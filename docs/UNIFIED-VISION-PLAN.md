# Unified Vision Plan - Habit Garden

> **Created:** 2026-01-31
> **Status:** Approved
> **Master Document** - This replaces all previous vision docs

## Archived Documents

The following documents have been consolidated into this plan:
- `archive/GENTLE-GROWTH-IMPLEMENTATION.md` - Rest days, seasons, reflections
- `archive/Design_vision.md` - Archetypes, journal tree, monetization
- `archive/redesign.md` - Goal UI/UX, weeds system
- `archive/feature.md` - Quick notes on features

---

## Table of Contents

1. [Core Decisions](#1-core-decisions)
2. [Architecture Overview](#2-architecture-overview)
3. [Database Schema Changes](#3-database-schema-changes)
4. [Phase 1: Core Redesign](#4-phase-1-core-redesign)
5. [Phase 2: Enhanced Features](#5-phase-2-enhanced-features)
6. [Migration Strategy](#6-migration-strategy)

---

## 1. Core Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Watering ≠ Completing** | Full separation | Giảm áp lực, tăng daily engagement |
| **Plant-Goal Relationship** | Multi-season | Cây sống mãi, mỗi season là 1 chapter |
| **User Archetypes** | Phase 2 | Focus core features first |
| **Journal Tree** | Yes | Special plant type cho free writing |

### Core Philosophy

> **"Progress, not perfection. Consistency, not streaks. Growth, not punishment."**

**Key Shifts:**
- Tưới nước ≠ Hoàn thành (caring vs achieving)
- Rest days là valid, không phải failure
- Cây ngủ (sleeping) thay vì chết (dead)
- Seasons cho phép continuous journey

---

## 2. Architecture Overview

### New Concept Model

```
┌─────────────────────────────────────────────────────────────────┐
│                           PLANT                                  │
│  - Đại diện cho 1 habit (Read, Exercise, Meditate...)           │
│  - Sống mãi mãi (không chết, chỉ ngủ)                           │
│  - Có "Why I Started" motivation                                 │
│  - Lớn lên theo thời gian (maturity_level 1-10)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  SEASON 1    │  │  SEASON 2    │  │  SEASON 3    │  ...     │
│  │  2024 Reading│  │  2025 Reading│  │  2026 Reading│          │
│  │  12/15 books │  │  18/20 books │  │  5/25 books  │          │
│  │  completed   │  │  completed   │  │  active      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                      ACTIVITY LOGS                               │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│  │ Watering│  │ Watering│  │ Log     │  │ Rest    │            │
│  │ only    │  │ + Note  │  │ Progress│  │ Day     │            │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### Two-Track System

```
WATERING (Chăm sóc)              COMPLETING (Thành tựu)
━━━━━━━━━━━━━━━━━━━━             ━━━━━━━━━━━━━━━━━━━━
• Nhắc nhở bản thân              • Ghi nhận progress thực
• Giữ moisture                   • Cây lớn lên
• Watering streak                • Completion streak
• Base XP (5-10)                 • Full XP (15-25)
• Có thể làm nhiều lần/ngày      • 1 lần/ngày (có progress)
• Không cần đạt goal             • Cần log số liệu

Flow:
[Tap Plant] → Modal → [💧 Chỉ tưới] [📊 Log Progress] [😴 Nghỉ hôm nay]
```

### Plant States

| State | Trigger | Visual | Message |
|-------|---------|--------|---------|
| **thriving** | Logged today | Bright, animated | "Growing beautifully! 🌱" |
| **growing** | Watered but not logged | Normal | "Ready for action 💪" |
| **resting** | 1-3 days no activity | Same + 💤 | "Taking a rest day" |
| **waiting** | 4-7 days no activity | Soft glow | "Waiting for you when you're ready 🌙" |
| **sleeping** | 7+ days no activity | Grayscale, peaceful | "Sleeping peacefully. Wake anytime 💚" |
| **mature** | Reached maturity milestone | Crown/glow | "A wise old tree 🌳" |

**REMOVED:** `dead` status → Cây không bao giờ chết

---

## 3. Database Schema Changes

### 3.1 Update: `plants` Table

```sql
-- Gentle Growth fields
ALTER TABLE plants ADD COLUMN IF NOT EXISTS why_i_started TEXT;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS maturity_level INTEGER DEFAULT 1;  -- 1-10
ALTER TABLE plants ADD COLUMN IF NOT EXISTS visual_stage TEXT DEFAULT 'seed';
-- Stages: seed, sprout, growing, mature, established, ancient, legendary

-- Rest day configuration
ALTER TABLE plants ADD COLUMN IF NOT EXISTS rest_days_allowed INTEGER DEFAULT 2;  -- per week
ALTER TABLE plants ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 7;

-- Rhythm tracking (computed from activity_logs)
ALTER TABLE plants ADD COLUMN IF NOT EXISTS days_this_week INTEGER DEFAULT 0;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS days_this_month INTEGER DEFAULT 0;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS consistency_percentage NUMERIC DEFAULT 0;

-- Update status enum: add 'thriving', 'resting', 'waiting', 'sleeping'
-- Remove 'dead' in practice (keep for backwards compat, but never set)
```

### 3.2 Update: `goals` Table → Seasons

```sql
-- Rename conceptually: goals = seasons
ALTER TABLE goals ADD COLUMN IF NOT EXISTS season_number INTEGER DEFAULT 1;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS season_name TEXT;  -- "2026 Reading Challenge"
ALTER TABLE goals ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
-- Status: active, completed, ended (ended = incomplete but moved on)

ALTER TABLE goals ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS days_active INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS rest_days_used INTEGER DEFAULT 0;

-- Reflection at end
ALTER TABLE goals ADD COLUMN IF NOT EXISTS end_reflection TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS lessons_learned TEXT;

-- Unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_plant_season
ON goals(plant_id, season_number);
```

### 3.3 New: `activity_logs` Table

```sql
-- Unified activity logs (replaces watering_logs + goal_logs over time)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  season_id UUID REFERENCES goals(id) ON DELETE SET NULL,  -- NULL = simple watering
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Type
  activity_type TEXT NOT NULL DEFAULT 'watering',
  -- Types: 'watering', 'progress', 'rest_day', 'reflection'

  -- Timing
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  logged_date DATE DEFAULT CURRENT_DATE,

  -- Data
  value NUMERIC,        -- NULL for simple watering, number for progress
  notes TEXT,           -- Optional reflection
  difficulty TEXT,      -- easy, normal, hard (mood when doing)

  -- Flags
  is_first_of_day BOOLEAN DEFAULT FALSE,

  -- XP & rewards
  xp_earned INTEGER DEFAULT 0,
  morning_bonus BOOLEAN DEFAULT FALSE,
  streak_bonus INTEGER DEFAULT 0,
  is_personal_record BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_plant ON activity_logs(plant_id);
CREATE INDEX idx_activity_date ON activity_logs(logged_date);
CREATE INDEX idx_activity_plant_date ON activity_logs(plant_id, logged_date);
```

### 3.4 New: `rest_days` Table

```sql
CREATE TABLE rest_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rest_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plant_id, rest_date)
);
```

### 3.5 New: `reflections` Table

```sql
CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  milestone_type TEXT NOT NULL,  -- days_30, days_100, season_complete, year_1
  milestone_value INTEGER,

  life_changes TEXT[],  -- Selected options
  personal_note TEXT,
  mood TEXT,

  -- Snapshot
  total_value_at_reflection NUMERIC,
  days_active_at_reflection INTEGER,
  season_number_at_reflection INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reflections_plant ON reflections(plant_id);
```

### 3.6 Special: Journal Tree Plant Type

```sql
-- Special plant type for Journal Tree
INSERT INTO plant_types (
  id, name, name_vi, icon, description, description_vi,
  maturity_days, frequency_type, frequency_target,
  moisture_decay_rate, moisture_boost,
  special_effect, category, difficulty, is_premium
) VALUES (
  gen_random_uuid(),
  'Journal Tree',
  'Cây Nhật Ký',
  '📔',
  'A special tree that grows with your thoughts and reflections',
  'Cây đặc biệt lớn lên cùng suy nghĩ và reflections của bạn',
  365,  -- Matures after 1 year of journaling
  'flexible',
  1,  -- Just write once to count
  5,  -- Low decay - forgiving
  100, -- Full moisture on any entry
  '{"type": "journal_tree", "growth_per_entry": 0.1}'::jsonb,
  'special',
  'easy',
  false
);
```

---

## 4. Phase 1: Core Redesign

### 4.1 Database Migrations
- [ ] Add Gentle Growth fields to `plants`
- [ ] Add Season fields to `goals`
- [ ] Create `activity_logs` table
- [ ] Create `rest_days` table
- [ ] Create `reflections` table
- [ ] Add Journal Tree plant type

### 4.2 Server Actions
- [ ] Create `src/lib/actions/activity.ts` - Unified activity logging
- [ ] Update `src/lib/actions/plants.ts` - New plant states
- [ ] Update `src/lib/actions/goals.ts` - Season support
- [ ] Create `src/lib/plant-status.ts` - Status calculation logic
- [ ] Create `src/lib/rhythm-calculator.ts` - Rhythm/consistency calculation

### 4.3 UI Components
- [ ] Redesign `watering-modal.tsx` → 3-action flow (Tưới / Log / Nghỉ)
- [ ] Create `rhythm-view.tsx` - Dots visualization thay thế streak
- [ ] Update `plant-detail-sheet.tsx` - Show seasons, "Why I Started"
- [ ] Create `rest-day-modal.tsx` - Mark intentional rest
- [ ] Create `reflection-modal.tsx` - Milestone reflections
- [ ] Update plant visuals for new states (resting, sleeping)

### 4.4 Messaging Updates
- [ ] Update all copy to gentle tone
- [ ] Remove "died", "dying", "dead" terminology
- [ ] Add encouraging messages for rest days
- [ ] Update achievement descriptions

---

## 5. Phase 2: Enhanced Features

### 5.1 Journal Tree (After Phase 1)
- [ ] Journal Tree creation flow
- [ ] Journal entry types (Free, Gratitude, Vent, etc.)
- [ ] Memory Garden view (timeline of entries)
- [ ] Entry prompts and writing experience

### 5.2 User Archetypes (Future)
- [ ] Track visit patterns (time of day, consistency)
- [ ] Calculate archetype based on behavior
- [ ] Insights screen
- [ ] Shareable archetype cards

### 5.3 Season Transitions
- [ ] Season completion celebration
- [ ] "Start New Season" flow
- [ ] Season history view
- [ ] Lessons learned capture

---

## 6. Migration Strategy

### Phase 1 Migration

```sql
-- Step 1: Migrate existing plants
UPDATE plants SET
  maturity_level = CASE
    WHEN growth_percentage >= 100 THEN 5
    WHEN growth_percentage >= 75 THEN 4
    WHEN growth_percentage >= 50 THEN 3
    WHEN growth_percentage >= 25 THEN 2
    ELSE 1
  END,
  visual_stage = CASE
    WHEN growth_percentage >= 100 THEN 'mature'
    WHEN growth_percentage >= 75 THEN 'growing'
    WHEN growth_percentage >= 50 THEN 'sprout'
    ELSE 'seed'
  END,
  why_i_started = habit_description  -- Use existing description
WHERE why_i_started IS NULL;

-- Step 2: Set season_number = 1 for existing goals
UPDATE goals SET
  season_number = 1,
  season_name = name || ' (Season 1)',
  status = CASE
    WHEN current_value >= target_value THEN 'completed'
    ELSE 'active'
  END
WHERE season_number IS NULL;

-- Step 3: Migrate watering_logs to activity_logs
INSERT INTO activity_logs (
  plant_id, user_id, activity_type, logged_at, logged_date,
  notes, xp_earned, morning_bonus, is_first_of_day
)
SELECT
  plant_id, user_id, 'watering', logged_at, logged_date,
  notes, xp_earned, morning_bonus, is_first_of_day
FROM watering_logs;

-- Step 4: Migrate goal_logs to activity_logs
INSERT INTO activity_logs (
  plant_id, season_id, user_id, activity_type, logged_at, logged_date,
  value, notes, xp_earned, is_personal_record
)
SELECT
  gl.plant_id, gl.goal_id, gl.user_id, 'progress', gl.logged_at, gl.logged_date,
  gl.value, gl.notes, gl.xp_earned, gl.is_personal_record
FROM goal_logs gl;
```

### Rollback Plan
- Keep old tables (`watering_logs`, `goal_logs`) for 30 days
- Add `is_migrated` flag to track migration status
- Create rollback script to restore if needed

---

## Summary

### What Changes

| Area | Before | After |
|------|--------|-------|
| Watering | = Completing | Separate actions |
| Goals | 1 per plant, ends | Seasons, infinite |
| Plant death | Can die | Can only sleep |
| Streaks | Primary metric | De-emphasized, rhythm view |
| Rest days | Penalty | Valid, tracked |
| Reflections | None | Milestone triggers |

### What Stays

- XP system
- Weather/mood system
- Achievements (updated copy)
- Focus mode
- Garden visuals
- Period-based goals (daily/weekly/monthly)

---

*Document created: 2026-01-31*

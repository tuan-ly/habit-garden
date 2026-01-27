# Gentle Growth Philosophy - Implementation Plan

> **Branch:** `feature/gentle-growth-philosophy`
> **Created:** 2026-01-27
> **Status:** Planning

---

## Table of Contents

1. [Philosophy Overview](#1-philosophy-overview)
2. [Current State Analysis](#2-current-state-analysis)
3. [Database Schema Changes](#3-database-schema-changes)
4. [UI/UX Changes](#4-uiux-changes)
5. [Messaging & Copy Guidelines](#5-messaging--copy-guidelines)
6. [Implementation Phases](#6-implementation-phases)
7. [Migration Strategy](#7-migration-strategy)

---

## 1. Philosophy Overview

### Core Principle

> **"Progress, not perfection. Consistency, not streaks. Growth, not punishment."**

### The Problem We're Solving

Traditional habit apps create anxiety through:
- **Streak pressure:** "Don't break your 30-day streak!"
- **Punishment visuals:** Wilted plants, dying indicators
- **All-or-nothing thinking:** Miss one day = failure
- **Disconnection:** No link between habits and life changes

### Our Solution: Gentle Growth

| Old Approach | Gentle Growth Approach |
|--------------|------------------------|
| Streak counter | Rhythm visualization |
| Health decay (punishment) | Rest days (self-care) |
| "Your plant is dying!" | "Your plant is resting" |
| Binary: done/not done | Partial credit system |
| Goal focus only | Life change reflection |

### Key Mindset Shifts

1. **Rest is valid** - Missing a day isn't failure, it's rest
2. **Partial counts** - 5 minutes of reading > 0 minutes
3. **Long-term view** - 80% consistency over years > 100% for weeks
4. **Connection to purpose** - Why you started matters
5. **Celebrate effort** - Not just achievement

---

## 2. Current State Analysis

### What We Already Have (Good Foundation)

| Feature | Status | Notes |
|---------|--------|-------|
| Watering logs with notes | ✅ | XP bonus for journaling |
| Goal logs with notes | ✅ | XP bonus for reflection |
| XP system | ✅ | Rewards engagement |
| Plant types with special effects | ✅ | Personality in plants |
| Weather system | ✅ | External factors affect growth |
| Achievements | ✅ | Milestone celebrations |

### What Needs to Change

| Current | Problem | New Approach |
|---------|---------|--------------|
| `current_moisture` decay | Punishes missing days | Rest day system |
| `current_streak` prominent | Creates anxiety | Rhythm view (de-emphasized) |
| Plant dies when neglected | Guilt-inducing | Plant "sleeps" peacefully |
| Goal = Plant lifecycle | Ends when complete | Habit = lifetime, Season = goal |
| No reflection prompts | Mechanical tracking | Milestone reflections |
| No "why" capture | Lost purpose | "Why I started" field |

---

## 3. Database Schema Changes

### 3.1 New Table: `habits` (Core Entity)

```sql
-- Habits are lifetime entities, plants visualize them
CREATE TABLE habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Identity
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🌱',
  color TEXT DEFAULT '#22c55e',

  -- Purpose (Gentle Growth: reconnect with why)
  why_i_started TEXT,                    -- User's original motivation

  -- Tracking configuration
  tracking_metric TEXT NOT NULL,         -- "books", "minutes", "times"
  unit TEXT NOT NULL,                    -- "cuốn", "phút", "lần"
  frequency TEXT DEFAULT 'daily',        -- daily, weekly, flexible
  frequency_target INTEGER DEFAULT 1,    -- times per frequency period

  -- Rest day configuration (Gentle Growth: rest is valid)
  rest_days_allowed INTEGER DEFAULT 2,   -- per week, guilt-free
  grace_period_days INTEGER DEFAULT 7,   -- before "sleeping" status

  -- Lifetime stats (aggregated across all seasons)
  total_value NUMERIC DEFAULT 0,
  total_logs INTEGER DEFAULT 0,
  total_days_active INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,

  -- Rhythm tracking (Gentle Growth: rhythm over streak)
  days_this_week INTEGER DEFAULT 0,
  days_this_month INTEGER DEFAULT 0,
  consistency_percentage NUMERIC DEFAULT 0,  -- rolling 30-day

  -- Age & Maturity
  started_at TIMESTAMPTZ DEFAULT NOW(),
  maturity_level INTEGER DEFAULT 1,      -- 1-10, grows with time + consistency

  -- Status (Gentle Growth: sleeping, not dying)
  status TEXT DEFAULT 'active',          -- active, resting, sleeping, paused
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  paused_at TIMESTAMPTZ,
  pause_reason TEXT,

  -- Plant visual reference
  plant_type_id UUID REFERENCES plant_types(id),

  -- Legacy migration
  legacy_plant_id UUID,                  -- Reference to old plants table

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_habits_user_id ON habits(user_id);
CREATE INDEX idx_habits_status ON habits(status);
```

### 3.2 New Table: `seasons` (Goal Cycles)

```sql
-- Seasons are goal cycles within a habit
CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Season identity
  name TEXT,                             -- "2024 Reading Challenge"
  season_number INTEGER NOT NULL,        -- Auto-increment per habit

  -- Goal configuration
  goal_mode TEXT DEFAULT 'total_progress',
  target_value NUMERIC NOT NULL,
  start_value NUMERIC DEFAULT 0,
  current_value NUMERIC DEFAULT 0,

  -- Timeline
  started_at TIMESTAMPTZ DEFAULT NOW(),
  target_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Status (Gentle Growth: celebrate effort even if not complete)
  status TEXT DEFAULT 'active',          -- active, completed, ended
  completion_percentage NUMERIC GENERATED ALWAYS AS (
    CASE WHEN target_value > 0
    THEN LEAST(100, ROUND((current_value / target_value) * 100, 1))
    ELSE 0 END
  ) STORED,

  -- Stats for this season
  total_logs INTEGER DEFAULT 0,
  days_active INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  rest_days_used INTEGER DEFAULT 0,

  -- Rewards
  xp_earned INTEGER DEFAULT 0,

  -- Reflection at end (Gentle Growth: learn from every season)
  end_reflection TEXT,
  lessons_learned TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(habit_id, season_number)
);

CREATE INDEX idx_seasons_habit_id ON seasons(habit_id);
CREATE INDEX idx_seasons_status ON seasons(status);
```

### 3.3 New Table: `habit_logs` (Unified Logging)

```sql
-- All habit activity logs
CREATE TABLE habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  season_id UUID REFERENCES seasons(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Log data
  value NUMERIC NOT NULL,
  target_value NUMERIC,                  -- What was the target that day

  -- Partial credit (Gentle Growth: every effort counts)
  effort_percentage NUMERIC GENERATED ALWAYS AS (
    CASE WHEN target_value > 0
    THEN LEAST(100, ROUND((value / target_value) * 100, 1))
    ELSE 100 END
  ) STORED,

  -- Context (Gentle Growth: understand, don't judge)
  effort_level TEXT,                     -- full, partial, minimal
  context TEXT,                          -- busy, sick, travel, tired, great
  notes TEXT,

  -- Timing
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  logged_date DATE DEFAULT CURRENT_DATE,

  -- Rewards
  xp_earned INTEGER DEFAULT 0,
  is_personal_record BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_habit_logs_habit_id ON habit_logs(habit_id);
CREATE INDEX idx_habit_logs_logged_date ON habit_logs(logged_date);
```

### 3.4 New Table: `rest_days` (Track Intentional Rest)

```sql
-- Track intentional rest days (Gentle Growth: rest is valid)
CREATE TABLE rest_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  rest_date DATE NOT NULL,
  reason TEXT,                           -- Optional: why resting

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(habit_id, rest_date)
);
```

### 3.5 New Table: `reflections` (Life Change Tracking)

```sql
-- Milestone reflections (Gentle Growth: connect habit to life)
CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Milestone that triggered reflection
  milestone_type TEXT NOT NULL,          -- days_30, days_100, season_complete, year_1
  milestone_value INTEGER,               -- e.g., 30, 100, 365

  -- Reflection content
  life_changes TEXT[],                   -- Selected from options
  personal_note TEXT,                    -- User's own words
  mood TEXT,                             -- How they feel about progress

  -- Context
  total_value_at_reflection NUMERIC,     -- Snapshot of progress
  days_active_at_reflection INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reflections_habit_id ON reflections(habit_id);
```

### 3.6 Update: `plants` Table (Visual Only)

```sql
-- Add new columns to existing plants table
ALTER TABLE plants ADD COLUMN IF NOT EXISTS habit_id UUID REFERENCES habits(id);
ALTER TABLE plants ADD COLUMN IF NOT EXISTS visual_stage TEXT DEFAULT 'seed';
ALTER TABLE plants ADD COLUMN IF NOT EXISTS visual_size INTEGER DEFAULT 1;

-- Visual stage: seed, sprout, growing, mature, established, ancient, legendary
-- Visual size: 1-5, affects grid_size display

-- Remove/deprecate punishment-related concepts
-- Note: Keep current_moisture for backward compatibility during migration
-- but stop using it for "health decay" logic
```

### 3.7 Update: `profiles` Table

```sql
-- Add gentle growth preferences
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  show_streaks BOOLEAN DEFAULT false;           -- User can opt-in to see streaks

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  preferred_rest_reminder TEXT DEFAULT 'gentle'; -- gentle, none, standard

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS
  reflection_frequency TEXT DEFAULT 'milestones'; -- milestones, weekly, monthly
```

---

## 4. UI/UX Changes

### 4.1 Garden View Changes

#### Current → New Status Display

```
CURRENT (Anxiety-inducing):
┌─────────────────────────┐
│  🌻 Sunflower           │
│  Health: ████░░ 65%     │  ← "Health" implies sickness
│  Streak: 12 days 🔥     │  ← Pressure to maintain
│  ⚠️ Needs water!        │  ← Guilt message
└─────────────────────────┘

NEW (Gentle Growth):
┌─────────────────────────┐
│  🌻 Sunflower           │
│  Season 2 • 8/12 books  │  ← Progress, not health
│  This month: ●●●●●●○○○  │  ← Rhythm, not streak
│  🌿 Growing beautifully │  ← Encouraging message
└─────────────────────────┘
```

#### Plant States Visual Guide

| State | Trigger | Visual | Message |
|-------|---------|--------|---------|
| **Thriving** | Logged today | Bright, animated | "Growing beautifully!" |
| **Resting** | 1-3 days no log | Same, with 💤 | "Taking a rest day" |
| **Waiting** | 4-7 days no log | Soft glow | "Waiting for you" |
| **Sleeping** | 7+ days no log | Grayscale, peaceful | "Sleeping peacefully" |

**Important:** NO wilting, NO brown colors, NO dying indicators.

#### Rhythm Visualization Component

```tsx
// New component: RhythmView
interface RhythmViewProps {
  habit: Habit
  days: DayStatus[] // Last 30 days
}

// DayStatus: 'full' | 'partial' | 'rest' | 'missed'

// Visual: Grid of dots/squares showing activity pattern
// Colors:
// - full: green filled
// - partial: green outline
// - rest: blue (intentional rest)
// - missed: light gray (not red, not alarming)
```

### 4.2 Habit Detail View (New)

```
┌────────────────────────────────────────────────────────────────┐
│  ← Back                                          [⚙️ Settings] │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│                    🌳 [Plant Visual]                           │
│                    2 năm tuổi                                  │
│                                                                │
│  ══════════════════════════════════════════════════════════   │
│  📚 ĐỌC SÁCH                                                  │
│  ══════════════════════════════════════════════════════════   │
│                                                                │
│  💭 "Tôi muốn mở rộng kiến thức và trở thành                  │
│      người thú vị hơn trong các cuộc trò chuyện"              │
│                                           [Sửa lý do →]       │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  SEASON HIỆN TẠI                                         │ │
│  │  ────────────────────────────────────────────────────    │ │
│  │  Season 5: "2026 Reading"                                │ │
│  │  Mục tiêu: 15 cuốn                                       │ │
│  │  Tiến độ: ████████░░░░░░░ 8/15 (53%)                    │ │
│  │  Còn lại: 338 ngày                                       │ │
│  │                                                          │ │
│  │  [📝 Log hôm nay]                                        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  NHỊP THÁNG NÀY                                          │ │
│  │  ●●●○●●●  ●●●●○●●  ●●○●●●●  ●●●○               22/27    │ │
│  │                                                          │ │
│  │  "81% - Bạn đang làm rất tốt!"                          │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  HÀNH TRÌNH                                              │ │
│  │                                                          │ │
│  │  📖 47 cuốn đã đọc trong 2 năm                          │ │
│  │  📅 520 ngày có hoạt động                               │ │
│  │  🏆 4 seasons hoàn thành                                 │ │
│  │                                                          │ │
│  │  [Xem chi tiết →]                                        │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  REFLECTIONS                                             │ │
│  │                                                          │ │
│  │  🌱 Ngày 30: "Bắt đầu thấy đọc sách là thói quen"       │ │
│  │  🌿 Ngày 100: "Tự tin hơn khi nói chuyện với đồng nghiệp"│ │
│  │  🌳 Năm 1: "Đọc sách đã thay đổi cách tôi suy nghĩ"     │ │
│  │                                                          │ │
│  │  [Xem tất cả →]                                          │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### 4.3 Log Modal (Redesigned)

```
┌────────────────────────────────────────────────────────────────┐
│  📚 LOG HÔM NAY                                          [×]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Mục tiêu hôm nay: 30 phút đọc sách                           │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Hôm nay bạn đọc được bao lâu?                           │ │
│  │                                                          │ │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │ │
│  │  │  😴    │  │  📖    │  │  📖    │  │  📖    │         │ │
│  │  │ Nghỉ   │  │ 10 phút│  │ 20 phút│  │ 30 phút│         │ │
│  │  │ hôm nay│  │        │  │        │  │ ✓ Goal │         │ │
│  │  └────────┘  └────────┘  └────────┘  └────────┘         │ │
│  │                                                          │ │
│  │  Hoặc nhập số: [____] phút                               │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Hôm nay thế nào? (không bắt buộc)                       │ │
│  │                                                          │ │
│  │  [😊 Tốt] [😐 Bình thường] [😓 Khó khăn] [🏃 Bận]       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  💭 Ghi chú (không bắt buộc)               +3 XP bonus   │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │                                                    │  │ │
│  │  │                                                    │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ────────────────────────────────────────────────────────────  │
│  Chọn "Nghỉ hôm nay" nếu bạn cần nghỉ ngơi.                   │
│  Nghỉ ngơi cũng là một phần của hành trình. 💚                │
│  ────────────────────────────────────────────────────────────  │
│                                                                │
│                                         [Lưu]                  │
└────────────────────────────────────────────────────────────────┘
```

### 4.4 Reflection Modal (New)

Triggers at milestones: 30 days, 100 days, season complete, 1 year, etc.

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                    🎉 MILESTONE!                               │
│                                                                │
│            Bạn đã đọc sách được 100 ngày!                     │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  💭 Hãy dừng lại một chút và suy nghĩ:                        │
│                                                                │
│  "Thói quen này đã thay đổi gì trong cuộc sống bạn?"          │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Chọn những thay đổi bạn nhận thấy:                      │ │
│  │                                                          │ │
│  │  [✓] Tôi hiểu biết nhiều hơn                            │ │
│  │  [✓] Tôi tự tin hơn trong cuộc trò chuyện               │ │
│  │  [ ] Tôi ngủ ngon hơn                                    │ │
│  │  [ ] Tôi bớt stress hơn                                  │ │
│  │  [ ] Tôi có nhiều ý tưởng sáng tạo hơn                  │ │
│  │  [ ] Chưa thấy thay đổi rõ rệt (và đó là bình thường!)  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Viết thêm suy nghĩ của bạn (không bắt buộc):            │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │ Sau 100 ngày, tôi nhận ra mình đã đọc được 15     │  │ │
│  │  │ cuốn sách - điều mà trước đây tôi nghĩ là không   │  │ │
│  │  │ thể. Giờ đọc sách đã trở thành thói quen tự nhiên.│  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ────────────────────────────────────────────────────────────  │
│  Những reflection này sẽ được lưu lại trong hành trình        │
│  của bạn. Sau này bạn có thể nhìn lại để thấy mình đã         │
│  đi được bao xa.                                               │
│  ────────────────────────────────────────────────────────────  │
│                                                                │
│                              [💚 Lưu & Tiếp tục hành trình]   │
└────────────────────────────────────────────────────────────────┘
```

### 4.5 Season Completion (Redesigned)

```
WHEN GOAL ACHIEVED:
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                    🎊 SEASON COMPLETE!                         │
│                                                                │
│                         🌳✨                                   │
│                                                                │
│              Season 4: "2025 Reading Challenge"                │
│                      15/15 cuốn sách!                          │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  📊 SEASON STATS                                         │ │
│  │                                                          │ │
│  │  ✅ 15 cuốn sách đã đọc                                  │ │
│  │  📅 Hoàn thành trong 287 ngày                            │ │
│  │  🌊 Consistency: 78%                                     │ │
│  │  ⭐ +450 XP earned                                       │ │
│  │                                                          │ │
│  │  🌳 Cây của bạn đã thêm một vòng tuổi mới!              │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Bạn muốn làm gì tiếp theo?                                   │
│                                                                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐   │
│  │ 🚀 Season mới  │  │ ⏸️ Nghỉ ngơi   │  │ 🔄 Duy trì     │   │
│  │ Tăng mục tiêu  │  │ Tạm dừng       │  │ Giữ nguyên     │   │
│  └────────────────┘  └────────────────┘  └────────────────┘   │
│                                                                │
└────────────────────────────────────────────────────────────────┘

WHEN GOAL NOT ACHIEVED (Season ends by time):
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│                    📚 SEASON ENDED                             │
│                                                                │
│              Season 3: "2024 Reading Challenge"                │
│                      8/12 cuốn (67%)                           │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  🌿 Không đạt mục tiêu, nhưng hãy nhìn lại...           │ │
│  │                                                          │ │
│  │  ✅ Bạn đã đọc 8 cuốn sách!                              │ │
│  │  ✅ Đó là 8 cuốn nhiều hơn nếu không bắt đầu            │ │
│  │  ✅ Consistency: 62% - trên trung bình!                  │ │
│  │  ✅ Tháng tốt nhất: Tháng 3 (3 cuốn)                    │ │
│  │                                                          │ │
│  │  💭 Cuộc sống có lúc lên xuống. Mỗi cuốn sách           │ │
│  │     bạn đọc đều có giá trị.                             │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Bạn học được gì từ season này? (không bắt buộc)        │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │ Tôi nhận ra tháng 5-7 quá bận với project công ty │  │ │
│  │  │ Season sau tôi sẽ đặt mục tiêu thực tế hơn.       │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Season tiếp theo bạn muốn thử:                               │
│  ● 10 cuốn (Khuyến nghị dựa trên kết quả)                    │
│  ○ 12 cuốn (Giữ nguyên, thử lại)                             │
│  ○ 8 cuốn (Giảm để dễ đạt hơn)                               │
│  ○ Tự đặt: [____] cuốn                                        │
│                                                                │
│            [🌱 Bắt đầu Season mới]  [⏸️ Tạm nghỉ]             │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

## 5. Messaging & Copy Guidelines

### Principles

1. **Never blame** - Don't say "you missed", say "you rested"
2. **Always encourage** - Every message should end positive
3. **Normalize imperfection** - "Life has ups and downs"
4. **Focus on journey** - Not just destination
5. **Celebrate effort** - Not just achievement

### Message Templates

#### Plant Status Messages

| Status | ❌ Old Message | ✅ New Message |
|--------|---------------|----------------|
| Thriving | "Plant is healthy" | "Growing beautifully! 🌱" |
| Resting (1-3d) | "Needs water!" | "Taking a rest day 💤" |
| Waiting (4-7d) | "Plant is wilting!" | "Waiting for you when you're ready 🌙" |
| Sleeping (7d+) | "Plant is dying!" | "Sleeping peacefully. Wake anytime 💚" |

#### Logging Messages

| Situation | Message |
|-----------|---------|
| Full completion | "Wonderful! Another step on your journey. 🌟" |
| Partial completion | "Every bit counts! 10 minutes > 0 minutes. 💪" |
| Rest day | "Rest is part of the journey. Take care. 💚" |
| After missing days | "Welcome back! Your plant missed you. 🌱" |
| Streak milestone | "22 days this month - that's beautiful consistency!" |

#### Season Messages

| Situation | Message |
|-----------|---------|
| Season complete | "You did it! Your tree grows stronger. 🌳" |
| Season incomplete | "8/12 is still 8 more than before you started! 💚" |
| Starting new season | "A new chapter begins. You've got this. 🌱" |
| Pausing habit | "Taking a break? That's okay. We'll be here. 💚" |

#### Reflection Prompts

| Milestone | Prompt |
|-----------|--------|
| 30 days | "One month! How does this habit feel now?" |
| 100 days | "100 days of growth. What's changed in your life?" |
| 1 year | "A whole year! Let's look back at your journey." |
| Season end | "What did you learn from this season?" |

### Notification Copy (Future)

| Type | ❌ Avoid | ✅ Use |
|------|---------|--------|
| Reminder | "You haven't logged today!" | "Ready to continue your journey? 🌱" |
| Streak alert | "Don't break your streak!" | (Don't send streak alerts) |
| Milestone | "Achievement unlocked!" | "Look how far you've come! 🌿" |
| Return | "Your plant needs you!" | "Welcome back! No judgment here. 💚" |

---

## 6. Implementation Phases

### Phase 1: Database & Core Logic (Week 1-2)

**Tasks:**
- [ ] Create migration for new tables (habits, seasons, habit_logs, rest_days, reflections)
- [ ] Update plants table with new columns
- [ ] Create habit status calculation logic (thriving/resting/waiting/sleeping)
- [ ] Create rhythm calculation (days this week/month, consistency %)
- [ ] Update XP system for partial credit
- [ ] Create REST API for new entities

**Files to create/modify:**
- `supabase/migrations/2026XXXX_gentle_growth_schema.sql`
- `src/lib/actions/habits.ts` (new)
- `src/lib/actions/seasons.ts` (new)
- `src/lib/habit-status.ts` (new)
- `src/lib/rhythm-calculator.ts` (new)
- `src/types/database.ts` (update)

### Phase 2: UI Components (Week 2-3)

**Tasks:**
- [ ] Create RhythmView component
- [ ] Create HabitDetailView component
- [ ] Redesign LogModal with rest day option
- [ ] Create ReflectionModal component
- [ ] Create SeasonCompleteModal component
- [ ] Update plant visual states (remove wilting, add sleeping)
- [ ] Update PlantTooltip/PlantCard for new status display

**Files to create/modify:**
- `src/components/habits/rhythm-view.tsx` (new)
- `src/components/habits/habit-detail-view.tsx` (new)
- `src/components/habits/log-modal.tsx` (new)
- `src/components/habits/reflection-modal.tsx` (new)
- `src/components/habits/season-complete-modal.tsx` (new)
- `src/components/garden/isometric-plant.tsx` (update visuals)
- `src/components/garden/plant-tooltip.tsx` (update)

### Phase 3: Migration & Integration (Week 3-4)

**Tasks:**
- [ ] Create data migration script (plants → habits)
- [ ] Update garden view to use habits
- [ ] Update watering flow to use habit logs
- [ ] Implement reflection triggers at milestones
- [ ] Update achievements for new model
- [ ] Update statistics dashboard

**Files to modify:**
- `src/components/garden/garden-view.tsx`
- `src/components/garden/isometric-garden.tsx`
- `src/lib/context/plants-context.tsx` → habits-context.tsx
- `src/lib/achievements.ts`

### Phase 4: Polish & Settings (Week 4)

**Tasks:**
- [ ] Add user preferences (show streaks toggle, reflection frequency)
- [ ] Update settings page
- [ ] Add "Why I started" edit functionality
- [ ] Journey/reflection history view
- [ ] Copy review and polish
- [ ] Testing and bug fixes

---

## 7. Migration Strategy

### Data Migration Script

```sql
-- Step 1: Create habits from existing plants
INSERT INTO habits (
  id,
  user_id,
  name,
  why_i_started,
  tracking_metric,
  unit,
  frequency,
  plant_type_id,
  started_at,
  total_waterings AS total_logs,
  current_streak,
  longest_streak,
  status,
  legacy_plant_id
)
SELECT
  gen_random_uuid(),
  p.user_id,
  p.name,
  p.habit_description,  -- Use as initial "why"
  COALESCE(g.tracking_metric, 'completion'),
  COALESCE(g.unit, 'times'),
  CASE
    WHEN pt.frequency_type = 'flexible' THEN 'flexible'
    ELSE 'daily'
  END,
  p.plant_type_id,
  p.started_at,
  p.total_waterings,
  p.current_streak,
  p.longest_streak,
  CASE
    WHEN p.status = 'dead' THEN 'sleeping'
    WHEN p.status = 'dormant' THEN 'sleeping'
    ELSE 'active'
  END,
  p.id
FROM plants p
LEFT JOIN goals g ON g.plant_id = p.id
LEFT JOIN plant_types pt ON pt.id = p.plant_type_id;

-- Step 2: Create seasons from existing goals
INSERT INTO seasons (
  habit_id,
  user_id,
  name,
  season_number,
  goal_mode,
  target_value,
  current_value,
  started_at,
  target_date,
  status
)
SELECT
  h.id,
  g.user_id,
  'Season 1',
  1,
  g.goal_mode,
  g.target_value,
  g.current_value,
  g.started_at,
  g.target_date,
  CASE
    WHEN g.current_value >= g.target_value THEN 'completed'
    ELSE 'active'
  END
FROM goals g
JOIN habits h ON h.legacy_plant_id = g.plant_id;

-- Step 3: Migrate goal_logs to habit_logs
INSERT INTO habit_logs (
  habit_id,
  season_id,
  user_id,
  value,
  notes,
  logged_at,
  logged_date,
  xp_earned,
  is_personal_record
)
SELECT
  h.id,
  s.id,
  gl.user_id,
  gl.value,
  gl.notes,
  gl.logged_at,
  gl.logged_date,
  0,  -- Will recalculate
  gl.is_personal_record
FROM goal_logs gl
JOIN habits h ON h.legacy_plant_id = gl.plant_id
JOIN seasons s ON s.habit_id = h.id;

-- Step 4: Update plants to reference habits
UPDATE plants p
SET habit_id = h.id
FROM habits h
WHERE h.legacy_plant_id = p.id;
```

### Rollback Plan

Keep old tables (plants, goals, goal_logs) intact for 30 days after migration. Add `is_migrated` flag to track migration status.

---

## Appendix: Reflection Options

### Life Change Options (by habit category)

**Reading:**
- Tôi hiểu biết nhiều hơn
- Tôi tự tin hơn trong cuộc trò chuyện
- Tôi có nhiều ý tưởng sáng tạo hơn
- Tôi viết tốt hơn
- Tôi thư giãn hơn trước khi ngủ

**Exercise:**
- Tôi khỏe hơn
- Tôi ngủ ngon hơn
- Tôi có nhiều năng lượng hơn
- Tôi tự tin hơn về cơ thể
- Tôi bớt stress hơn

**Meditation:**
- Tôi bình tĩnh hơn
- Tôi tập trung tốt hơn
- Tôi phản ứng tốt hơn với stress
- Tôi ngủ ngon hơn
- Tôi tự nhận thức tốt hơn

**Learning:**
- Tôi có kỹ năng mới
- Tôi tự tin hơn trong công việc
- Tôi mở ra cơ hội mới
- Tôi hiểu bản thân hơn
- Tôi có thêm đam mê mới

**General (always show):**
- Tôi tự hào về bản thân
- Tôi cảm thấy có kỷ luật hơn
- Chưa thấy thay đổi rõ rệt (và đó là bình thường!)

---

## Next Steps

1. [ ] Review and approve this plan
2. [ ] Create database migration
3. [ ] Start Phase 1 implementation
4. [ ] Weekly check-ins on progress

---

*Document created: 2026-01-27*
*Last updated: 2026-01-27*

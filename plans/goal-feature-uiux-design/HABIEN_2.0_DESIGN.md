# Habien 2.0 - Progressive Growth System Design

> **Created**: 2026-02-05
> **Status**: Design Document
> **Philosophy**: "A small seed, watered daily, grows taller than a forest planted and abandoned."

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current System Analysis](#2-current-system-analysis)
3. [Vision & Philosophy](#3-vision--philosophy)
4. [Progressive Disclosure Framework](#4-progressive-disclosure-framework)
5. [User Journey: The Gardener's Path](#5-user-journey-the-gardeners-path)
6. [Feature Unlock System](#6-feature-unlock-system)
7. [Plant Tier System](#7-plant-tier-system)
8. [Goal-Identity Architecture](#8-goal-identity-architecture)
9. [Guardrails & Protection System](#9-guardrails--protection-system)
10. [Implementation Roadmap](#10-implementation-roadmap)
11. [Database Schema Changes](#11-database-schema-changes)
12. [Success Metrics](#12-success-metrics)

---

## 1. Executive Summary

### The Problem

Current Habien allows users to:
- Plant unlimited plants from day 1
- Set complex goals immediately
- Choose any difficulty level
- Access all features at once

This leads to **"Haste makes waste"**:
- Users overcommit on day 1
- Too many habits = overwhelm
- Complex goals = confusion
- Result: Abandonment within 2 weeks

### The Solution: Progressive Growth

```
Day 1: One plant. One tap. That's it.
Day 50: Goals unlock. Metrics optional.
Day 150: Identity emerges. Legacy begins.
```

**Core Principle**: Complexity is EARNED, not chosen.

---

## 2. Current System Analysis

### What We Have

| Component | Status | Notes |
|-----------|--------|-------|
| **Plants CRUD** | Done | Unlimited from day 1 |
| **Watering** | Done | Check-in + streaks |
| **Goals** | Done | Attached to plants (1:1) |
| **XP/Levels** | Done | 15 levels, exponential XP |
| **Achievements** | Done | 20+ achievements |
| **Rest Days** | Done | 2/week per plant |
| **Reflections** | Done | Milestone-based |
| **Seasons** | Done | Goal reset cycles |
| **Weather** | Done | Daily bonuses |
| **Water Reserves** | Done | Streak protection |

### Current Database Schema (Relevant)

```
profiles
  - xp: number (current XP)
  - level: number (derived from XP)
  - water_reserves: number

plants
  - plant_type_id -> plant_types
  - status: thriving | growing | resting | waiting | sleeping | mature
  - visual_stage: seed | sprout | growing | mature | established | ancient | legendary
  - goal_mode: build_capacity | total_progress | null

plant_types
  - difficulty: easy | medium | hard
  - maturity_days: number
  - special_effect: jsonb

goals
  - plant_id: uuid (1:1 with plant)
  - goal_mode: build_capacity | total_progress
  - tracking_metric, unit, target_value
  - season_number, season_status
```

### Gaps Identified

| Current | Needed |
|---------|--------|
| Unlimited plants | **Plant slots by level** |
| All plant types available | **Tier unlock progression** |
| Goals always visible | **Goals unlock at Level 6** |
| No Identity concept | **Identity unlock at Level 13** |
| No onboarding guardrails | **Cooldowns, warnings, limits** |
| plant_types.difficulty informal | **Formal tier system (1-5)** |
| Goal = Plant (1:1) | **Goal -> Plants (1:N), Identity -> Goals** |

---

## 3. Vision & Philosophy

### Three-Layer Model

```
                    ┌─────────────────────────────────┐
                    │           IDENTITY              │
                    │      "I am a reader"            │
                    │         (Level 13+)             │
                    └───────────────┬─────────────────┘
                                    │
                    ┌───────────────▼─────────────────┐
                    │            GOALS                │
                    │     "Read 50 books/year"        │
                    │         (Level 6+)              │
                    └───────────────┬─────────────────┘
                                    │
        ┌───────────────────────────▼───────────────────────────┐
        │                       HABITS                           │
        │      [Read books]  [Take notes]  [Listen podcast]     │
        │                     (Level 1+)                         │
        └───────────────────────────────────────────────────────┘
```

### Core Philosophies

1. **Start Small, Stay Small (Initially)**
   - Day 1: 1 plant, Tier 1 only
   - Complexity is EARNED through consistency

2. **Forgiveness Before Challenge**
   - Tier 1 plants: Cannot fail (7-14 day tolerance)
   - Build confidence before demanding commitment

3. **Metric Later, Habit First**
   - Check-in = habit formed
   - Metrics = habit optimized (Level 6+)
   - Identity = habit internalized (Level 13+)

4. **Protection From Self**
   - System prevents overcommitment
   - Guardrails are features, not restrictions

---

## 4. Progressive Disclosure Framework

### Level-Based Feature Unlock

```
LEVEL 1-5: SEEDLING PHASE
├── Max Plants: 1 (Lv1-3), 2 (Lv4-5)
├── Available: Tier 1 plants only
├── Features: Check-in, Streaks, Basic achievements
├── Hidden: Goals, Metrics, Identity, Tier 2-5
└── Philosophy: "Just water every day"

LEVEL 6-12: GARDENER PHASE
├── Max Plants: 3 (Lv6-8), 4 (Lv9-11), 5 (Lv12)
├── Available: Tier 1-2 (Lv6-7), Tier 3 (Lv10+)
├── Features: Goals, Metrics (optional), Weekly reports
├── Unlock: Goal linking to plants
└── Philosophy: "Habits with purpose"

LEVEL 13+: SAGE PHASE
├── Max Plants: Unlimited (Lv15+)
├── Available: Tier 4 (Lv14+), Tier 5 (Lv18+)
├── Features: Identity, Goal grouping, Garden zones
├── Unlock: Full system access
└── Philosophy: "Habits shape who I am"
```

### Timeline Estimation

| Level | XP Required | Approx. Days | Phase |
|-------|-------------|--------------|-------|
| 1 | 0 | Day 1 | Seedling |
| 2 | 100 | ~10 days | Seedling |
| 3 | 250 | ~25 days | Seedling |
| 4 | 475 | ~40 days | Seedling |
| 5 | 812 | ~55 days | Seedling |
| 6 | 1,318 | ~70 days | Gardener |
| 10 | 5,931 | ~150 days | Gardener |
| 13 | 16,392 | ~250 days | Sage |
| 15 | 31,217 | ~350 days | Sage |

*Based on ~15-25 XP/day from consistent watering*

---

## 5. User Journey: The Gardener's Path

### Phase 1: Seedling (Level 1-5)

**Day 1 - Onboarding:**
```
Welcome to Habien! 🌱

Start simple:
→ Choose 1 habit to build
→ Water your plant every day
→ Watch it grow with you

[Plant your first seed]
```

**Plant Selection (Tier 1 Only):**
```
🌼 Dandelion  - 7 day tolerance - "Make a wish"
🪴 Succulent  - 10 day tolerance - "Resilient"
🌵 Cactus     - 14 day tolerance - "Desert survivor"
🌱 Sprouts    - 3 day tolerance, fast growth (7 days)
☘️ Clover     - 5 day tolerance - Lucky events
```

**Daily Experience:**
```
Open app → See plant → Tap water → Done ✓ → Close app

NO:
- Popup asking "How much did you do?"
- Required notes
- Complex dashboard
- Metrics, goals, identity
```

**Level Up Messages:**
```
Level 2: "Your first plant is growing! Keep going."
Level 3: "You've watered for 3 weeks straight. Amazing!"
Level 4: "New plant slot unlocked. Plant another when ready."
Level 5: "New features coming soon. Just 1 more level!"
```

### Phase 2: Gardener (Level 6-12)

**Level 6 - Goals Unlock:**
```
🎉 Congratulations! You're now a Gardener!

You've proven you can maintain a habit.
Now give it a clear purpose.

[Learn about Goals] [Maybe later]
```

**Goal Introduction (Soft):**
```
Your "Reading" plant is growing beautifully! 📚

Want to set a specific goal?
Example: "Read 30 books this year"

[Set a goal] [No, just keep watering]
```

**Tier 2 Unlock with Warning:**
```
🌸 Daisy unlocked!

This plant needs more frequent watering (2-3 days).
Only plant it when you're stable with your current plants.

Current habit: Dandelion (7 day streak) ✓

[Plant Daisy] [Maybe later]
```

**Metrics (Optional):**
```
When watering:

[Quick water ✓]     ← Default, 1 tap
[Water + log]       ← Opens number input
```

### Phase 3: Sage (Level 13+)

**Level 13 - Identity Unlock:**
```
🌳 You've become a Garden Sage!

100+ days of consistency. Habits are no longer things you do,
they're part of who you are.

Now ask: "Who do I want to become?"

[Explore Identity] [Continue as usual]
```

**Identity Suggestion:**
```
You have 3 learning-related Goals:
- Reading (15 books completed)
- English study (50 hours)
- Blog writing (12 posts)

It seems you're building the identity:
"Lifelong Learner" 📚

[Create this Identity] [Choose different name]
```

**Tier 4-5 Prerequisites:**
```
🎋 Bamboo - Tier 4

Requirements to plant:
✓ Level 14+
✓ At least 3 mature plants
✓ 66+ day streak achieved
✗ No plants died in the last 30 days

This plant takes 180 days to mature.
Are you ready for the long journey?

[Plant Bamboo] [Not ready yet]
```

---

## 6. Feature Unlock System

### Unlock Matrix

| Feature | Level | Condition | Notes |
|---------|-------|-----------|-------|
| **Plant Slot 1** | 1 | - | Default |
| **Plant Slot 2** | 4 | - | Auto-unlock |
| **Tier 2 Plants** | 7 | 1 mature plant | Warning shown |
| **Goals System** | 6 | - | Optional adoption |
| **Metrics Input** | 9 | Goal created | Inside goal flow |
| **Plant Slot 3** | 8 | - | Auto-unlock |
| **Tier 3 Plants** | 10 | 3 mature + 30-day streak | Warning shown |
| **Weekly Reports** | 12 | - | Auto-unlock |
| **Identity System** | 13 | - | Optional adoption |
| **Plant Slot 4** | 11 | - | Auto-unlock |
| **Tier 4 Plants** | 14 | 5 mature + 66-day streak | Requirements check |
| **Plant Slot 5** | 12 | - | Auto-unlock |
| **Unlimited Plants** | 15 | - | Full access |
| **Tier 5 Plants** | 18 | Special achievements | Quest-based |

### Unlock Notifications

```typescript
interface UnlockNotification {
  type: 'slot' | 'tier' | 'feature' | 'system'
  title: string
  description: string
  action: 'auto' | 'opt-in' | 'requirements'
  cta?: string
  dismiss?: string
}

// Examples:
{
  type: 'slot',
  title: 'New Slot!',
  description: 'You can plant another seed.',
  action: 'auto'
}

{
  type: 'system',
  title: 'Goals Unlocked!',
  description: 'Set goals for your habits.',
  action: 'opt-in',
  cta: 'Learn more',
  dismiss: 'Maybe later'
}
```

---

## 7. Plant Tier System

### Tier Definitions

```
TIER 1: FORGIVING FRIENDS
Theme: "You cannot fail here"
Tolerance: 3-14 days
Target User: New, building confidence
Plants: Dandelion, Succulent, Cactus, Sprouts, Clover

TIER 2: RELIABLE PARTNERS
Theme: "Building real consistency"
Tolerance: 2-4 days
Target User: Established rhythm, ready for consistency
Plants: Vegetable, Bush, Daisy, Mint, Lavender, Tomato

TIER 3: DEMANDING BEAUTIES
Theme: "Beauty requires dedication"
Tolerance: 1-2 days
Target User: Ready for daily commitment, reflection
Plants: Rose, Orchid, Cherry Blossom, Tulip, Peony, Sunflower
Requires: Reflection system active

TIER 4: LIFE COMPANIONS
Theme: "Identity-level transformation"
Tolerance: 2-5 days (but 180-365 day maturity)
Target User: Identity-level habit builders
Plants: Bamboo, Pine, Banyan, Bodhi Tree, Bonsai
Requires: Long-term commitment proof

TIER 5: GARDEN LEGENDS
Theme: "Earned, not planted"
Tolerance: Variable
Target User: Masters
Plants: Golden Lotus, Money Tree, Magic Beanstalk, Phoenix Flower, World Tree
Requires: Special achievements, quests
```

### Tier Unlock Requirements

```typescript
interface TierRequirement {
  level: number
  maturePlants: number
  longestStreak: number
  noDeathDays: number
  achievements?: string[]
}

const TIER_REQUIREMENTS: Record<number, TierRequirement> = {
  1: { level: 1, maturePlants: 0, longestStreak: 0, noDeathDays: 0 },
  2: { level: 7, maturePlants: 1, longestStreak: 7, noDeathDays: 0 },
  3: { level: 10, maturePlants: 3, longestStreak: 30, noDeathDays: 14 },
  4: { level: 14, maturePlants: 5, longestStreak: 66, noDeathDays: 30 },
  5: { level: 18, maturePlants: 10, longestStreak: 100, noDeathDays: 60,
       achievements: ['rose_master', 'bamboo_patience', 'perfect_month'] }
}
```

### Plant Properties by Tier

| Tier | XP Mult | Decay Rate | Requires Reflection | Growth Speed |
|------|---------|------------|---------------------|--------------|
| 1 | 1.0x | Very Slow | No | Fast |
| 2 | 1.2x | Slow | Optional | Normal |
| 3 | 1.5-2.0x | Normal | Yes (daily) | Normal |
| 4 | 2.0-3.5x | Slow | Yes (weekly) | Very Slow |
| 5 | 3.0-5.0x | Variable | Yes | Variable |

---

## 8. Goal-Identity Architecture

### Current Model (1:1)

```
Plant ←──────→ Goal (optional)
```

### New Model (Hierarchical)

```
Identity (Level 13+)
    │
    ├── Goal 1 (Level 6+)
    │   ├── Plant A
    │   └── Plant B
    │
    └── Goal 2
        └── Plant C

Plant (standalone, no goal) - Always available
```

### Entity Relationships

```typescript
// Identity: Top-level aspiration
interface Identity {
  id: string
  user_id: string
  name: string                    // "Reader"
  description?: string
  icon: string
  status: 'active' | 'achieved' | 'paused'
  created_at: string
  updated_at: string
}

// Goal: Measurable objective (now independent of Plant)
interface GoalV2 {
  id: string
  user_id: string
  identity_id?: string           // Optional link to identity
  name: string                   // "Read 50 books/year"
  metric_type: 'count' | 'time' | 'quantity'
  unit: string                   // "books", "hours", "pages"
  target_value: number
  current_value: number
  duration_weeks: number
  started_at: string
  target_date: string
  status: 'active' | 'completed' | 'paused'
}

// Plant-Goal Link (N:1)
interface PlantGoalLink {
  plant_id: string
  goal_id: string
  contribution_type: 'direct' | 'partial'
  contribution_weight: number    // Default 1.0
}
```

### Contribution Flow

```
User waters Plant "Morning reading" (Tier 2)
    │
    ├── Log activity: +1 watering
    │
    └── Prompt: "How many pages today?"
        │
        └── User enters: 20
            │
            ├── Plant grows
            ├── Goal "Read 50 books" += 20 pages
            └── Identity "Reader" gets progress
```

---

## 9. Guardrails & Protection System

### 1. Plant Slot Limits

```typescript
function getMaxPlants(level: number): number {
  if (level >= 15) return Infinity
  if (level >= 12) return 5
  if (level >= 9) return 4
  if (level >= 6) return 3
  if (level >= 4) return 2
  return 1
}
```

### 2. New Plant Cooldown

```typescript
interface Cooldown {
  type: 'new_plant' | 'mourning' | 'tier_upgrade'
  expires_at: Date
}

// Rules:
// - After planting: 7 days before next plant
// - After plant death: 3 days "mourning period"
// - After tier upgrade: 14 days before next upgrade tier
```

### 3. Difficulty Warning

```typescript
interface PlantWarning {
  shouldWarn: boolean
  message: string
  recommendation?: string
  allowOverride: boolean
}

function checkPlantDifficulty(
  user: Profile,
  plantTier: number
): PlantWarning {
  const stats = getUserStats(user.id)

  if (plantTier >= 3 && stats.longestStreak < 30) {
    return {
      shouldWarn: true,
      message: `Rose needs daily care.
                Your longest streak: ${stats.longestStreak} days.`,
      recommendation: 'Try Daisy (Tier 2) first?',
      allowOverride: true
    }
  }
  // ...
}
```

### 4. Overwhelm Detection

```typescript
interface OverwhelmCheck {
  isOverwhelmed: boolean
  trigger: string
  suggestion: string
}

function detectOverwhelm(userId: string): OverwhelmCheck {
  const recent = getRecentActivity(userId, 14) // 14 days

  // High miss rate
  if (recent.missRate > 0.3) {
    return {
      isOverwhelmed: true,
      trigger: 'miss_rate',
      suggestion: 'Seems like you\'re busy. Want to pause one plant?'
    }
  }

  // Multiple wilting
  if (recent.wiltingPlants >= 3) {
    return {
      isOverwhelmed: true,
      trigger: 'wilting',
      suggestion: 'Focus on saving one plant. Others will wait.'
    }
  }

  // Opens but no action
  if (recent.openNoActionDays >= 3) {
    return {
      isOverwhelmed: true,
      trigger: 'no_action',
      suggestion: 'Everything okay? Even one plant is fine.'
    }
  }

  return { isOverwhelmed: false, trigger: '', suggestion: '' }
}
```

### 5. Tier Gate Enforcement

```typescript
function canPlantTier(
  userId: string,
  tier: number
): { allowed: boolean; reason?: string } {
  const profile = getProfile(userId)
  const stats = getUserStats(userId)
  const req = TIER_REQUIREMENTS[tier]

  if (profile.level < req.level) {
    return {
      allowed: false,
      reason: `Requires Level ${req.level}. Current: Level ${profile.level}`
    }
  }

  if (stats.maturePlants < req.maturePlants) {
    return {
      allowed: false,
      reason: `Requires ${req.maturePlants} mature plants. Current: ${stats.maturePlants}`
    }
  }

  if (stats.longestStreak < req.longestStreak) {
    return {
      allowed: false,
      reason: `Requires ${req.longestStreak}-day streak. Best: ${stats.longestStreak}`
    }
  }

  // Check no death in X days
  const recentDeaths = getDeathsInDays(userId, req.noDeathDays)
  if (recentDeaths > 0) {
    return {
      allowed: false,
      reason: `No plants died in ${req.noDeathDays} days required`
    }
  }

  return { allowed: true }
}
```

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal**: Add tier system and slot limits

```
[ ] Add `tier` column to plant_types (1-5)
[ ] Add `max_plants`, `unlocked_tiers` to profiles
[ ] Seed existing plant_types with tiers
[ ] Create tier check function
[ ] Create slot limit function
[ ] Add tier badge UI
[ ] Add slot limit UI
[ ] Hide Tier 2+ in plant picker for low levels
```

### Phase 2: Progressive Unlock (Week 2-3)
**Goal**: Features unlock by level

```
[ ] Create `features_unlocked` column in profiles
[ ] Create unlock check system
[ ] Create unlock notification system
[ ] Hide Goals UI until Level 6
[ ] Add "Goals unlocked!" notification at Level 6
[ ] Add level-up modal with rewards/unlocks
```

### Phase 3: Guardrails (Week 3-4)
**Goal**: Protect users from overcommitment

```
[ ] Create cooldowns table
[ ] Implement new plant cooldown (7 days)
[ ] Implement mourning period (3 days)
[ ] Add difficulty warning modal
[ ] Add overwhelm detection
[ ] Add gentle nudges for overwhelmed users
```

### Phase 4: Goal Restructure (Week 4-6)
**Goal**: Separate Goals from Plants

```
[ ] Create new goals_v2 table (standalone)
[ ] Create plant_goal_links table (N:1)
[ ] Migrate existing goals to new structure
[ ] Update goal creation flow
[ ] Update plant watering to log to linked goals
[ ] Update goal progress UI
```

### Phase 5: Identity System (Week 6-8)
**Goal**: Add Identity layer

```
[ ] Create identities table
[ ] Link goals to identities
[ ] Hide Identity UI until Level 13
[ ] Create Identity creation flow
[ ] Create Identity dashboard
[ ] Add Identity suggestions based on goals
```

### Phase 6: Polish (Week 8-10)
**Goal**: Smooth experience

```
[ ] Onboarding flow for new users
[ ] Tutorial for each phase transition
[ ] Achievement integration with tiers
[ ] Performance optimization
[ ] Analytics for drop-off points
```

---

## 11. Database Schema Changes

### New Columns

```sql
-- profiles: Add progressive disclosure fields
ALTER TABLE profiles ADD COLUMN max_plants INTEGER DEFAULT 1;
ALTER TABLE profiles ADD COLUMN unlocked_tiers INTEGER[] DEFAULT '{1}';
ALTER TABLE profiles ADD COLUMN features_unlocked TEXT[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN phase TEXT DEFAULT 'seedling';
ALTER TABLE profiles ADD COLUMN longest_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN total_mature_plants INTEGER DEFAULT 0;

-- plant_types: Add tier
ALTER TABLE plant_types ADD COLUMN tier INTEGER DEFAULT 1;
ALTER TABLE plant_types ADD COLUMN tier_unlock_level INTEGER DEFAULT 1;
ALTER TABLE plant_types ADD COLUMN requires_reflection BOOLEAN DEFAULT false;
```

### New Tables

```sql
-- User cooldowns
CREATE TABLE user_cooldowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  cooldown_type TEXT NOT NULL, -- 'new_plant', 'mourning', 'tier_upgrade'
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, cooldown_type)
);

-- Identities (Level 13+)
CREATE TABLE identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🎯',
  status TEXT DEFAULT 'active', -- 'active', 'achieved', 'paused'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals V2 (Standalone)
CREATE TABLE goals_v2 (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  identity_id UUID REFERENCES identities(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  metric_type TEXT DEFAULT 'count', -- 'count', 'time', 'quantity'
  unit TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  current_value NUMERIC DEFAULT 0,
  duration_weeks INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  target_date TIMESTAMPTZ,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'paused'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plant-Goal Links (N:1)
CREATE TABLE plant_goal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals_v2(id) ON DELETE CASCADE,
  contribution_type TEXT DEFAULT 'direct', -- 'direct', 'partial'
  contribution_weight NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plant_id, goal_id)
);

-- Feature unlock tracking
CREATE TABLE feature_unlocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  shown_notification BOOLEAN DEFAULT false,
  UNIQUE(user_id, feature)
);
```

### Data Migration

```sql
-- Seed plant_types with tiers
UPDATE plant_types SET tier = 1 WHERE name IN ('Dandelion', 'Succulent', 'Cactus', 'Sprouts', 'Clover');
UPDATE plant_types SET tier = 2 WHERE name IN ('Vegetable', 'Bush', 'Daisy', 'Mint', 'Lavender', 'Tomato');
UPDATE plant_types SET tier = 3 WHERE name IN ('Rose', 'Orchid', 'Cherry Blossom', 'Tulip', 'Peony', 'Sunflower');
UPDATE plant_types SET tier = 4 WHERE name IN ('Bamboo', 'Pine', 'Banyan', 'Bodhi', 'Bonsai');
UPDATE plant_types SET tier = 5 WHERE name IN ('Golden Lotus', 'Money Tree', 'Magic Beanstalk', 'Phoenix Flower', 'World Tree');

-- Set tier unlock levels
UPDATE plant_types SET tier_unlock_level = 1 WHERE tier = 1;
UPDATE plant_types SET tier_unlock_level = 7 WHERE tier = 2;
UPDATE plant_types SET tier_unlock_level = 10 WHERE tier = 3;
UPDATE plant_types SET tier_unlock_level = 14 WHERE tier = 4;
UPDATE plant_types SET tier_unlock_level = 18 WHERE tier = 5;

-- Set reflection requirements
UPDATE plant_types SET requires_reflection = true WHERE tier >= 3;

-- Update existing users based on current level
UPDATE profiles SET
  max_plants = CASE
    WHEN level >= 15 THEN 999
    WHEN level >= 12 THEN 5
    WHEN level >= 9 THEN 4
    WHEN level >= 6 THEN 3
    WHEN level >= 4 THEN 2
    ELSE 1
  END,
  unlocked_tiers = CASE
    WHEN level >= 18 THEN '{1,2,3,4,5}'
    WHEN level >= 14 THEN '{1,2,3,4}'
    WHEN level >= 10 THEN '{1,2,3}'
    WHEN level >= 7 THEN '{1,2}'
    ELSE '{1}'
  END,
  phase = CASE
    WHEN level >= 13 THEN 'sage'
    WHEN level >= 6 THEN 'gardener'
    ELSE 'seedling'
  END;
```

---

## 12. Success Metrics

### Primary Metrics

| Metric | Current | Target | Method |
|--------|---------|--------|--------|
| **Day 7 Retention** | ? | 60%+ | Analytics |
| **Day 30 Retention** | ? | 40%+ | Analytics |
| **Day 66 Retention** | ? | 25%+ | Analytics |
| **Avg Plants/User (Day 7)** | ? | 1.0-1.5 | Reduce overwhelm |
| **Tier 2+ Unlock Rate** | - | 50%+ of L7 | Progression health |
| **Goal Adoption (L6+)** | - | 60%+ | Feature value |
| **Identity Adoption (L13+)** | - | 40%+ | Feature value |

### Secondary Metrics

| Metric | Target | Notes |
|--------|--------|-------|
| Plants per user (mature) | 3+ at L10 | Sustainable growth |
| Longest streak avg | 14+ days | Habit formation |
| Rest days used | < 50% | Not over-resting |
| Overwhelm triggers/week | < 0.5 | System working |
| Tier 3+ success rate | 60%+ | Right difficulty |

### Anti-Metrics (What NOT to Optimize)

- Total plants created (vanity metric)
- Daily opens (can be anxiety-driven)
- Time in app (not a productivity tool)
- Features used (complexity is bad)

---

## Appendix A: Visual Reference

### Phase Badges

```
🌱 SEEDLING (L1-5)  - Building foundation
🪴 GARDENER (L6-12) - Growing with purpose
🌳 SAGE (L13+)      - Shaping identity
```

### Tier Badges

```
⭐ Tier 1: Forgiving Friends
⭐⭐ Tier 2: Reliable Partners
⭐⭐⭐ Tier 3: Demanding Beauties
⭐⭐⭐⭐ Tier 4: Life Companions
⭐⭐⭐⭐⭐ Tier 5: Garden Legends
```

---

## Appendix B: Related Documents

- [Plant Difficulty System](reports/brainstorm-260205-plant-difficulty-system.md)
- [Outcome Integration](reports/brainstorm-260205-outcome-integration.md)
- [Creative Expansion](reports/brainstorm-260205-creative-expansion.md)
- [Plant Catalog](plant-designs/INDEX.md)

---

*Document created: 2026-02-05*
*Last updated: 2026-02-05*
*Author: Habien Team + Claude*

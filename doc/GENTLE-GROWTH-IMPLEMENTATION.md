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

### 3.1 Update: `plants` Table (Add Gentle Growth Fields)

Thay vì tạo bảng `habits` mới, ta mở rộng bảng `plants` hiện có:

```sql
-- Add Gentle Growth fields to existing plants table
ALTER TABLE plants ADD COLUMN IF NOT EXISTS why_i_started TEXT;  -- User's original motivation

-- Rest day configuration (Gentle Growth: rest is valid)
ALTER TABLE plants ADD COLUMN IF NOT EXISTS rest_days_allowed INTEGER DEFAULT 2;   -- per week
ALTER TABLE plants ADD COLUMN IF NOT EXISTS grace_period_days INTEGER DEFAULT 7;   -- before "sleeping"

-- Rhythm tracking (Gentle Growth: rhythm over streak)
ALTER TABLE plants ADD COLUMN IF NOT EXISTS days_this_week INTEGER DEFAULT 0;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS days_this_month INTEGER DEFAULT 0;
ALTER TABLE plants ADD COLUMN IF NOT EXISTS consistency_percentage NUMERIC DEFAULT 0;  -- rolling 30-day

-- Maturity (grows with time + consistency)
ALTER TABLE plants ADD COLUMN IF NOT EXISTS maturity_level INTEGER DEFAULT 1;  -- 1-10

-- Update status options: 'growing', 'mature', 'resting', 'sleeping', 'paused', 'dead'
-- Note: 'resting' = 1-3 days no activity, 'sleeping' = 7+ days (gentle, not punishing)
```

**Lý do không tạo bảng `habits` riêng:**
- Quan hệ 1:1 với plants → không cần tách
- Giảm complexity, ít joins
- Giữ backward compatibility tốt hơn

### 3.2 Repurpose: `goals` Table as Seasons

Thay vì tạo bảng `seasons` mới, ta mở rộng bảng `goals` hiện có để support multiple seasons:

```sql
-- Add season/cycle support to existing goals table
ALTER TABLE goals ADD COLUMN IF NOT EXISTS season_number INTEGER DEFAULT 1;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS season_name TEXT;  -- "2024 Reading Challenge"

-- Status for gentle growth (celebrate effort even if not complete)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';  -- active, completed, ended
ALTER TABLE goals ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Stats for this season
ALTER TABLE goals ADD COLUMN IF NOT EXISTS days_active INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS best_streak INTEGER DEFAULT 0;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS rest_days_used INTEGER DEFAULT 0;

-- Reflection at end (Gentle Growth: learn from every season)
ALTER TABLE goals ADD COLUMN IF NOT EXISTS end_reflection TEXT;
ALTER TABLE goals ADD COLUMN IF NOT EXISTS lessons_learned TEXT;

-- Unique constraint for seasons per plant
CREATE UNIQUE INDEX IF NOT EXISTS idx_goals_plant_season ON goals(plant_id, season_number);
```

**Season flow:**
1. Plant có thể có nhiều goals (seasons) theo thời gian
2. Khi hoàn thành/kết thúc season → tạo season mới với `season_number + 1`
3. Mỗi season lưu reflection và lessons learned

### 3.3 New Table: `activity_logs` (Merge watering_logs + goal_logs)

Merge `watering_logs` và `goal_logs` thành một bảng thống nhất:

```sql
-- Unified activity logs (replaces watering_logs + goal_logs)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goals(id) ON DELETE SET NULL,  -- NULL = simple watering
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Timing
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  logged_date DATE DEFAULT CURRENT_DATE,

  -- Data (cả 2 NULL = simple watering/check-in)
  value NUMERIC,                         -- NULL = không log số, có số = progress
  notes TEXT,                            -- NULL = không ghi chú

  -- Context (Gentle Growth: understand, don't judge)
  difficulty TEXT,                       -- easy, normal, hard (mood khi thực hiện)

  -- Computed flags
  is_first_of_day BOOLEAN DEFAULT FALSE, -- moisture chỉ tính từ log đầu tiên
  has_progress BOOLEAN GENERATED ALWAYS AS (
    value IS NOT NULL OR notes IS NOT NULL
  ) STORED,

  -- XP & rewards
  xp_earned INTEGER DEFAULT 0,
  morning_bonus BOOLEAN DEFAULT FALSE,
  streak_bonus INTEGER DEFAULT 0,
  is_personal_record BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_plant ON activity_logs(plant_id);
CREATE INDEX idx_activity_date ON activity_logs(logged_date);
CREATE INDEX idx_activity_plant_date ON activity_logs(plant_id, logged_date);
-- NOTE: Không có UNIQUE constraint - cho phép nhiều logs/ngày nếu có notes khác nhau
```

**Logic phân biệt:**

| value | notes | Ý nghĩa |
|-------|-------|---------|
| NULL | NULL | Simple watering (check-in, giữ moisture) |
| NULL | có | Check-in + reflection/ghi chú |
| có số | NULL/có | Log progress (cây lớn lên) |

**Tính toán:**
- **Moisture**: Reset khi có log đầu tiên trong ngày (`is_first_of_day = true`)
- **Growth**: Tính từ tổng `value` hoặc count logs có `has_progress = true`
- **Season progress**: Tính từ `SUM(value)` where `goal_id = current_goal`

### 3.4 New Table: `rest_days` (Track Intentional Rest)

```sql
-- Track intentional rest days (Gentle Growth: rest is valid)
CREATE TABLE rest_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  rest_date DATE NOT NULL,
  reason TEXT,                           -- Optional: why resting

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(plant_id, rest_date)
);
```

**Note:** Rest days được track riêng để:
- Không tính vào "missed days"
- Hiển thị khác trên rhythm view (màu xanh thay vì xám)
- Không ảnh hưởng đến moisture decay

### 3.5 New Table: `reflections` (Life Change Tracking)

```sql
-- Milestone reflections (Gentle Growth: connect habit to life)
CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plant_id UUID NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Milestone that triggered reflection
  milestone_type TEXT NOT NULL,          -- days_30, days_100, season_complete, year_1
  milestone_value INTEGER,               -- e.g., 30, 100, 365

  -- Reflection content
  life_changes TEXT[],                   -- Selected from options
  personal_note TEXT,                    -- User's own words
  mood TEXT,                             -- How they feel about progress

  -- Context snapshot
  total_value_at_reflection NUMERIC,     -- Progress at this point
  days_active_at_reflection INTEGER,
  season_number_at_reflection INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reflections_plant_id ON reflections(plant_id);
```

### 3.6 Update: `plants` Table (Visual Stages)

```sql
-- Add visual stage tracking
ALTER TABLE plants ADD COLUMN IF NOT EXISTS visual_stage TEXT DEFAULT 'seed';
-- Visual stages: seed, sprout, growing, mature, established, ancient, legendary

ALTER TABLE plants ADD COLUMN IF NOT EXISTS visual_size INTEGER DEFAULT 1;
-- Visual size: 1-5, affects grid_size display

-- Note: Giữ current_moisture nhưng thay đổi messaging
-- Thay vì "health decay" (punishment) → "cây cần được tưới" (gentle reminder)
-- Khi moisture = 0: cây "sleeping" thay vì "dying"
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

### 4.2 Plant Detail View (Enhanced)

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

### 4.3 Watering Modal (Unified Flow)

**Concept:** Tưới nước = action cơ bản. Có thể thêm progress (value) hoặc ghi chú (notes) tùy ý.

```
┌────────────────────────────────────────────────────────────────┐
│  💧 TƯỚI CÂY                                             [×]  │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  🌻 Đọc Sách                                                  │
│  💭 "Tôi muốn mở rộng kiến thức..."        [Xem đầy đủ →]    │
│                                                                │
│  ════════════════════════════════════════════════════════════  │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Hôm nay bạn có làm được gì không? (không bắt buộc)      │ │
│  │                                                          │ │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐         │ │
│  │  │  💧    │  │  📖    │  │  📖    │  │  📖    │         │ │
│  │  │ Chỉ    │  │ 10 phút│  │ 20 phút│  │ 30 phút│         │ │
│  │  │ tưới   │  │        │  │        │  │ ✓ Goal │         │ │
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
│  │  └────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  ════════════════════════════════════════════════════════════  │
│  💧 Tưới = giữ cây khỏe mạnh                                  │
│  📖 Tưới + số = ghi nhận tiến độ, cây lớn lên                 │
│  💭 Tưới + ghi chú = reflection, có thể tưới nhiều lần/ngày  │
│  ════════════════════════════════════════════════════════════  │
│                                                                │
│         [😴 Nghỉ hôm nay]              [💧 Tưới]              │
└────────────────────────────────────────────────────────────────┘
```

**Behavior:**
- **Chỉ tưới (value=NULL, notes=NULL):** Giữ moisture, không tăng growth
- **Tưới + số:** Giữ moisture + tăng growth + tăng season progress
- **Tưới + ghi chú:** Giữ moisture + reflection, có thể tưới lại trong ngày
- **Nghỉ hôm nay:** Đánh dấu rest day, không ảnh hưởng moisture

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

### Phase 1: Database & Core Logic

**Tasks:**
- [ ] Create migration: add Gentle Growth fields to `plants` table
- [ ] Create migration: add season fields to `goals` table
- [ ] Create migration: new `activity_logs` table (merge watering + goal logs)
- [ ] Create migration: new `rest_days` table
- [ ] Create migration: new `reflections` table
- [ ] Create plant status calculation logic (thriving/resting/waiting/sleeping)
- [ ] Create rhythm calculation (days this week/month, consistency %)
- [ ] Update XP system for unified activity logs

**Files to create/modify:**
- `supabase/migrations/2026XXXX_gentle_growth_plants.sql`
- `supabase/migrations/2026XXXX_gentle_growth_activity_logs.sql`
- `src/lib/actions/activity.ts` (new - unified logging)
- `src/lib/plant-status.ts` (new)
- `src/lib/rhythm-calculator.ts` (new)
- `src/types/supabase.ts` (update)

### Phase 2: UI Components

**Tasks:**
- [ ] Create RhythmView component (dots/calendar view)
- [ ] Enhance PlantDetailView with "why I started", seasons, reflections
- [ ] Redesign WateringModal with unified flow (tưới/log/ghi chú)
- [ ] Create ReflectionModal component (milestone triggers)
- [ ] Create SeasonCompleteModal component
- [ ] Update plant visual states (remove "dying", add "sleeping")
- [ ] Update PlantTooltip/PlantCard for new status display

**Files to create/modify:**
- `src/components/plants/rhythm-view.tsx` (new)
- `src/components/plants/plant-detail-view.tsx` (enhance)
- `src/components/plants/watering-modal.tsx` (redesign)
- `src/components/plants/reflection-modal.tsx` (new)
- `src/components/plants/season-complete-modal.tsx` (new)
- `src/components/garden/isometric-plant.tsx` (update visuals)
- `src/components/garden/plant-tooltip.tsx` (update)

### Phase 3: Data Migration & Integration

**Tasks:**
- [ ] Create migration script: `watering_logs` + `goal_logs` → `activity_logs`
- [ ] Update watering flow to use `activity_logs`
- [ ] Update goal logging to use `activity_logs`
- [ ] Implement reflection triggers at milestones
- [ ] Update achievements for new model
- [ ] Update statistics dashboard

**Files to modify:**
- `src/lib/actions/plants.ts` (update watering logic)
- `src/lib/actions/goals.ts` (update logging logic)
- `src/components/garden/garden-view.tsx`
- `src/lib/achievements.ts`
- `src/app/(dashboard)/stats/page.tsx`

### Phase 4: Polish & Settings

**Tasks:**
- [ ] Add user preferences (show streaks toggle, reflection frequency)
- [ ] Update settings page
- [ ] Add "Why I started" edit functionality
- [ ] Journey/reflection history view
- [ ] Copy review and polish (gentle messaging)
- [ ] Testing and bug fixes
- [ ] Deprecate old `watering_logs` and `goal_logs` tables

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

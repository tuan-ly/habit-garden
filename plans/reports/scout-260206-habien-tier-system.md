# Scout Report: Habien 2.0 Tier System Implementation

Date: 2026-02-06
Focus: Database schema, plant pickers, profile management, tier/difficulty logic
Status: Complete

## 1. DATABASE SCHEMA FILES

### Primary Schema Definition
File: d:/Code/habit-garden/src/types/database.ts

PlantType interface (lines 78-96):
- difficulty: Difficulty (ALREADY DEFINED as easy|medium|hard) ✅
- is_premium: boolean ✅
- special_effect: SpecialEffect | null ✅
- maturity_days, frequency_type, category

Profile interface (lines 60-76):
- xp: number ✅
- level: number ✅
- NO tier field yet (needs addition for progression)

Plant interface (lines 99-142):
- Links to plant_type via plant_type_id
- NO tier override field

### Latest Migration
File: d:/Code/habit-garden/supabase/migrations/20260131_gentle_growth_phase1.sql
- Adds activity_logs, rest_days, reflections tables
- Updates plants: maturity_level, visual_stage, why_i_started
- Updates goals: season_number, season_name, season_status
- NO tier/slot system yet (prime location for next migration)

---

## 2. PLANT PICKER COMPONENTS

### Add Plant Dialog
File: d:/Code/habit-garden/src/components/plants/add-plant-dialog.tsx

Key Features:
- Two-step wizard: Select type → Enter details
- Separates by category: basic vs special (lines 47-48)
- Displays difficulty badge (getDifficultyColor function)
- Shows maturity_days and special_effect labels
- Uses usePlants() context for immediate updates
- Calls createPlant server action

Integration Points:
- No tier-based filtering yet
- No slot limit validation
- All plant types shown regardless of user level

Related Plant Components:
- plant-card.tsx
- plant-visual.tsx
- plant-detail-sheet.tsx
- plant-tooltip.tsx

---

## 3. PROFILE & USER CONTEXT

### Profile Management
File: d:/Code/habit-garden/src/lib/actions/profile.ts

getProfile(): Fetches user profile with xp, level, timezone
- Auto-syncs XP from watering_logs if xp is 0

syncUserXp(): Manually syncs XP from watering_logs
- Sums all xp_earned entries
- Updates profiles table

### Plant Context
File: d:/Code/habit-garden/src/lib/context/plants-context.tsx

usePlants() provides:
- plants array (PlantWithType[])
- waterPlant(), logGoal(), movePlant() actions
- addPlant(), removePlant(), updatePlant()
- Optimistic updates for responsive UI

NO tier validation in context (needs addition)

### Level System
File: d:/Code/habit-garden/src/lib/utils/level.ts

calculateLevel(xp): Returns {level, currentXp, nextLevelXp}
- Formula: each level requires (level * 100) XP
- Level 1: 100 XP, Level 2: 200 XP, etc.

---

## 4. SERVER ACTIONS & UTILITIES

### Plant Actions
File: d:/Code/habit-garden/src/lib/actions/plants.ts

getPlants(): Fetch all plants with goals
- Joins plant_types
- No tier checking yet

createPlant(): Create new plant
- Takes CreatePlantDto
- Currently allows unlimited plants (needs slot validation)

waterPlant(): Water & earn XP
- Checks if already watered today
- Calculates XP from watering, mood, weather, notes

### XP System
File: d:/Code/habit-garden/src/lib/xp-system.ts
File: d:/Code/habit-garden/src/lib/xp-constants.ts

Constants:
- WATERING_BASE: 10 XP
- MORNING_BONUS: 3 XP
- PERSONAL_RECORD_BONUS: 25 XP
- REST_DAY_BASE: 2 XP
- NOTE bonuses: 3-5 XP

NO difficulty multiplier yet

### Progression
File: d:/Code/habit-garden/src/lib/progression.ts

ProgressionType: linear|exponential|logarithmic|s-curve|step
Used for goal target scaling

---

## 5. EXISTING DIFFICULTY LOGIC

What's Already There:
- Difficulty enum: easy|medium|hard (database.ts:28)
- Every plant_type has difficulty field
- UI badges with color-coding:
  - easy → green
  - medium → yellow
  - hard → red

Special Effects:
- SpecialEffectType includes: delayed_growth, buff_others, cycle,
  drought_resistant, difficulty_bonus, spawn_children, hidden_progress,
  immortal_after_mature
- difficulty_bonus type exists for XP rewards

---

## 6. MISSING FOR TIER SYSTEM

NOT YET IMPLEMENTED:
1. User tier/level slots on profile
2. Slot limits per tier
3. Tier unlock logic (which plants at which level)
4. Plant-tier mapping
5. Difficulty XP multiplier
6. Tier progression thresholds

Implementation Locations Needed:
- Database migration: Add profile.tier field
- Plant-tier relationship table
- Server action validation in createPlant()
- Context validation in usePlants()
- Difficulty multiplier in xp-system.ts
- UI filtering in add-plant-dialog

---

## 7. FILE LOCATION SUMMARY

Database:
  src/types/database.ts ................. Profile, PlantType, Plant
  supabase/migrations/*.sql ............ Schema

UI Components:
  src/components/plants/add-plant-dialog.tsx ... Main dialog
  src/components/plants/plant-card.tsx
  src/components/plants/plant-visual.tsx

Profile & Context:
  src/lib/actions/profile.ts ........... User management
  src/lib/context/plants-context.tsx .. Plant state
  src/lib/utils/level.ts .............. Level calculation

XP & Progression:
  src/lib/xp-system.ts ................ XP calculation
  src/lib/xp-constants.ts ............. Constants
  src/lib/progression.ts .............. Goal curves
  src/lib/actions/plants.ts ........... Plant CRUD

Gamification:
  src/lib/achievements.ts ............. Achievements
  src/lib/mood-system.ts .............. Mood bonuses
  src/lib/weather-system.ts ........... Weather bonuses

---

## SUMMARY

Implemented:
✅ Difficulty enum and plant difficulty field
✅ XP/level system
✅ Progression types
✅ Plant status tracking
✅ Special effects framework
✅ Category-based plant filtering (basic/special)

Not Yet Implemented:
❌ User tier/level slots
❌ Slot limits per tier
❌ Tier-based plant availability
❌ Difficulty XP multiplier
❌ Tier progression thresholds
❌ Plant-tier requirements

Report Date: 2026-02-06

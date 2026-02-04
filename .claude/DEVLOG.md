# Development Log - Habit Garden

> Nhật ký phát triển chi tiết. Session logs được chuyển từ MEMO.md.

---

## 2026-02-02: UX Mode Consolidation - Simplified Interaction

**Changes**:
- Consolidated 3 garden modes (View/Move/Add) into 1 toggle (Interact/Move)
- **Interact mode** (default): Click plant → GentleWateringModal, Click empty → AddPlantDialog
- **Move mode**: Click-to-select, click-to-place (toggle on/off)
- Merged FloatingPlantCard UX into GentleWateringModal (plant stats: moisture/growth/streak bars)
- Added "View plant details" link in modal for quick access to PlantDetailSheet
- Unified mobile/desktop behavior: both now show GentleWateringModal on plant click

**Key Files Changed**:
- `mode-toolbar.tsx` - 3 buttons → 1 toggle
- `isometric-garden.tsx` - Simplified modes, removed FloatingCard
- `gentle-watering-modal.tsx` - Added stats section + Details link

---

## 2026-02-02: Plant Detail Sheet Redesign - Reflective UX with Tabs

**Changes**:
- Redesigned plant-detail-sheet.tsx with 3-tab layout: Overview | Journal | Stats
- **Overview tab**: "Why I Started", quick rhythm (7 days), goal progress, action button, compact stats
- **Journal tab**: Activity timeline with notes + milestone celebrations (lazy loaded)
- **Stats tab**: Full moisture/growth bars, streak stats, 14-day rhythm (lazy loaded)
- Added skeleton loaders for smooth loading experience
- Implemented ReflectionModal for milestone reflections

**New Components**:
- `plant-detail-skeleton.tsx` - Tab-specific skeletons
- `journal-timeline.tsx` - Notes chronologically grouped
- `milestone-timeline.tsx` - Journey milestones
- `reflection-modal.tsx` - Multi-step reflection flow
- `journal.ts` - Server actions for journal/milestones

**Performance Improvements**:
- Lazy loading: Only load data for visible tab
- Reduced initial load from 3 API calls to 2 (7-day rhythm vs 30-day)
- useTransition for smooth tab switches
- Data caching (don't refetch on tab switch back)

---

## 2026-01-31: Watering Modal Redesign - Simplified 2-Option Flow

**Changes**:
- Replaced 3-action flow (Water/Log/Rest) with 2-option flow: "I did it today!" + "Just checking in"
- "I did it today!" mode now has QuickLogModal-style UI: number input + quick picks first, then notes
- All plants (goal or non-goal) now use `GentleWateringModal` instead of QuickLogModal
- Removed rest day option from modal (simplification)

**Key Files Changed**:
- `gentle-watering-modal.tsx` - 2-button flow, log mode UI
- `isometric-garden.tsx` - Routes all plants to GentleWateringModal

---

## 2026-01-31: Gentle Growth Phase 1 - UI Integration

**Changes**:
- Integrated `GentleWateringModal` into garden view (replaces old WateringModal)
- Added `RhythmView` with activity dots + stats to plant detail sheet
- 3-action flow: Water / Log Progress / Rest Day now works from garden

**Key Files Changed**:
- `isometric-garden.tsx` - Uses GentleWateringModal
- `plant-detail-sheet.tsx` - Shows RhythmView

---

## 2026-01-31: Gentle Growth Phase 1 Implementation

**Changes**:
- Database migration: `activity_logs`, `rest_days`, `reflections` tables
- New plant statuses: `thriving`, `resting`, `waiting`, `sleeping` (no more `dead`)
- New types: `ActivityLog`, `RestDay`, `Reflection`, `GentlePlantStatus`
- Created `plant-status.ts` - Status calculation logic
- Created `activity.ts` - Unified activity logging
- Created `gentle-watering-modal.tsx` - 3-action flow
- Created `rhythm-view.tsx` - Dots visualization
- Updated `plant-detail-sheet.tsx` - "Why I Started" + gentle messaging

**Key Files**:
- `20260131_gentle_growth_phase1.sql` (migration)
- `database.ts` - Extended with new types
- `plant-status.ts`, `activity.ts`, `gentle-watering-modal.tsx`, `rhythm-view.tsx` (NEW)

---

## 2026-01-31: Unified Vision Plan & Doc Cleanup

**Changes**:
- Created `UNIFIED-VISION-PLAN.md` - Master vision document
- Consolidated ideas from GENTLE-GROWTH, Design_vision, redesign, feature docs
- Archived superseded docs to `doc/archive/`

**Key Decisions**:
- **Watering ≠ Completing**: Full separation (tưới vs log progress)
- **Multi-Season**: 1 plant = nhiều seasons over time
- **No Plant Death**: Sleeping state replaces dead
- **Journal Tree**: Special plant type for free writing
- **Archetypes**: Deferred to Phase 2

---

## 2026-01-29: Improved Goal Setup UI/UX with Period-Based Tracking

**Changes**:
- Redesigned Goal Setup Wizard with clearer 4-step flow
- Period-based progress tracking (daily/weekly/monthly goals now work properly)
- New PeriodTargetDisplay component shows "This Week: 20/30 pages"
- Fixed: frequency fields now saved to database when creating goal
- Updated GoalProgress to prioritize period progress over overall

**Key Files**:
- `goal-setup-wizard.tsx` - Complete redesign
- `goal-progress.tsx` - Period-focused display
- `period-target-display.tsx` (NEW)
- `goal-utils.ts` (NEW): `getPeriodInfo()`, `getPeriodTarget()`
- `goals.ts` - Period tracking in GoalWithStats

---

## 2026-01-26: Focus Tab & Goal Frequency

**Changes**:
- Added Focus tab to garden view (Garden | List | Focus)
- Goal frequency support: daily/weekly/monthly with frequency_target
- Focus mode visual states: highlight (pulse-glow), dim (grayscale), urgent (red ring + bounce)
- FocusHeader shows progress bar with completed/total/urgent counts

**Key Files**:
- `garden-view.tsx` - ViewMode extended, Focus button added
- `focus-garden-view.tsx` (NEW): Focus view wrapper
- `focus-header.tsx` (NEW): Progress header
- `isometric-garden.tsx` - focusMode/focusStates props
- `isometric-plant.tsx` - focusState visual styles
- `goal-setup-wizard.tsx` - Frequency selector
- `database.ts` - GoalFrequency type, Goal interface updated

**Database migration**: `20260126_add_goal_frequency.sql`

---

## 2026-01-25: Optimistic Celebration UX

**Changes**:
- Watering/goal logging now shows celebration immediately (optimistic update)
- Client-side XP estimation using `calculateWateringXp` and `calculateNoteBonus`
- Error handling: cancel celebration and show toast if server rejects

**Key Files**: `isometric-garden.tsx` - Optimistic celebration for `handleWaterConfirm` and `handleGoalLog`

---

## 2026-01-24: Journal/Notes Reward System & Database Fixes

**Changes**:
- Added `growth_blocked` column to plants table (fix watering error)
- Created journal/notes reward system with XP bonuses:
  - +3 XP for any note, +2 for >50 chars, +2 for >100 chars
  - Journal streak tracking with bonus XP (3/5/8/12 for 3/7/14/30 days)
- Added 8 new journal achievements to database
- Updated watering modal UX with note bonus indicators and tips
- Added journal_streak, longest_journal_streak, last_journal_date, total_journal_entries to profiles

**Key Files**:
- `plants.ts` - Note bonus XP, journal streak tracking
- `xp-system.ts` - Added `calculateNoteBonus` function
- `watering-modal.tsx` - Journal UX with bonus tiers
- `database.ts` - Added journal fields to Profile type
- `garden-view.tsx`, `isometric-garden.tsx` - Pass journalStreak prop

**Database migrations**: `add_growth_blocked_column`, `add_journal_tracking_system`

---

## 2026-01-23: Performance Settings & Mobile UX Fixes

**Changes**:
- Added GardenSettings context for toggling visual effects (particles, decorations, celebrations)
- Created Performance settings UI with toggle switches
- Fixed watering animation bug (multiple clicks causing repeated animations) with cooldown
- Prevented text selection on garden page (`select-none`, `WebkitTouchCallout`)
- Prevented browser pinch-to-zoom (app zoom only)

**Key Files**:
- `garden-settings-context.tsx` (NEW)
- `performance-settings.tsx` (NEW)
- `switch.tsx` (NEW)
- `isometric-garden.tsx` - Integrated settings, cooldown fix
- `use-garden-zoom.ts` - Prevent browser pinch zoom

---

## 2026-01-23: Performance Optimization - Click-to-Move

**Changes**:
- Replaced drag-and-drop with click-to-select, click-to-place for better performance
- Reduced ambient particles (butterflies 3→1, pollen 15→5, fireflies 20→8, sparkles 20→6)
- Simplified hover effects (removed SVG filters, gradients, animations)
- Added faded plant preview when hovering target tile in move mode
- Removed complex touch/mouse event handlers

**Key Files**:
- `isometric-garden.tsx` - Simplified move logic
- `isometric-tile.tsx` - Added preview, simplified hover
- `ambient-particles.tsx` - Reduced particle count

---

## 2026-01-23: Mode-Based Garden UI

**What**: 3-mode toolbar system (Water/Move/Plant)
- View mode: Tap to water, double-tap for details
- Move mode: Instant drag (no long-press), pan disabled during drag
- Plant mode: Tap empty tile to add, tap plant for edit

**Key changes**:
- `mode-toolbar.tsx` - NEW vertical toolbar on left side
- `isometric-garden.tsx` - Mode state, interaction per mode
- `use-garden-zoom.ts` - Pan threshold, didPan flag reset

**Bug fixed**: Drag/pan conflict - didPan wasn't reset on drag end, blocking next click

---

## 2026-01-22: Gesture-Based UX (Superseded by Mode-Based)

**What**: Unified gesture model without modes
- Pan threshold 8px before drag starts
- Double-tap detection (300ms window)
- First-time gesture hint (localStorage persisted)

**Files**: `gesture-hint.tsx` (NEW), `use-garden-zoom.ts`, `isometric-garden.tsx`

---

## 2026-01-22: Garden Visual Enhancement

**What**: Decorations and particles around garden
- `garden-decorations.tsx` - SVG trees, bushes, rocks, mushrooms
- `ambient-particles.tsx` - Weather-aware (butterflies, fireflies, leaves)
- Enhanced tile hover with glow effect

**Animations added to globals.css**:
- `animate-tile-glow`, `animate-butterfly-float`, `animate-firefly-glow`, etc.

---

## 2026-01-20: Watering Celebration Effect

**What**: 3-second celebration when watering
- Phase 1 (0-0.5s): Water splash ring
- Phase 2 (0.5-2.5s): Sparkles, XP display, plant bounce
- Phase 3 (2.5-3s): Fadeout

**File**: `watering-celebration.tsx` (NEW)

---

## 2026-01-20: Plant Drag-and-Drop

**What**: Long-press to drag plants to new positions
- Native touch listener with `{ passive: false }` for preventDefault
- Ghost plant follows cursor during drag
- Hide badges/tooltips during drag
- Target cell highlight (green=valid, red=invalid)

**Key files**: `isometric-garden.tsx`, `grid-positioning.ts`

---

## 2026-01-20: Garden Zoom System

**What**: Zoom controls for garden view
- Range: 50% to 200%, step 25%
- Pinch-to-zoom on mobile
- localStorage persistence
- Auto-scroll to center on zoom change

**Files**: `zoom-controls.tsx`, `use-garden-zoom.ts` (NEW)

---

## 2026-01-20: Dynamic Grid Sizing

**What**: Grid auto-expands based on plant positions
- `calculateRequiredGridSize()` from max plant extent
- `validatePlantMove()` for collision check
- Conflict resolution when plants grow (1x1→2x2→3x3)

**File**: `grid-positioning.ts`

---

## 2026-01-19: Timezone Fix for Moisture Decay

**Critical bug**: Plants dying at midnight despite being watered

**Root cause**: Cron ran at 00:00 UTC (07:00 VN), comparing dates in UTC

**Fix**: Changed cron to 17:00 UTC (00:00 VN), per-user timezone support

**Key changes**:
- pg_cron schedule: `0 0 * * *` → `0 17 * * *`
- `update_daily_moisture()` now reads user timezone from profiles
- `TimezoneSync` component auto-detects browser timezone

---

## 2026-01-19: Multi-Cell Plants Visual

**What**: Plants can occupy 2x2 or 3x3 cells
- Merged tile hover (polygon highlight)
- Plant centered in merged area
- Shadow scaled by grid_size
- Grid lines hidden inside multi-cell area

**Files**: `ground-plane.tsx`, `isometric-tile.tsx`, `isometric-plant.tsx`

---

## 2026-01-18: Goal Data Integration

**What**: Merge goal info into PlantWithType
- `today_logs`, `today_log_count`, `today_value` fields
- `logGoal()` in PlantsContext with optimistic updates
- Badge shows log count

---

## 2026-01-18: UX Watering Redesign

**What**: Simplified interaction model
- Tap to water (simple) or open Quick Log (goal)
- Long-press/right-click for info card
- Overlay badge on plants
- Game-style toast with XP

**Files**: `floating-plant-card.tsx`, `quick-log-modal.tsx`, `plant-overlay-badge.tsx`, `water-toast.tsx`

---

## 2026-01-17: Multi-Cell Plants Infrastructure

**What**: Database and code support for grid positioning
- Schema: `grid_size`, `grid_row`, `grid_col` columns
- `updatePlantPosition()`, `expandPlantSize()` actions
- Visual scaling: 1x1→1.0x, 2x2→1.8x, 3x3→2.5x

**Design doc**: `.claude/MULTI-CELL-PLANTS-DESIGN.md`

---

## 2026-01-17: Mood/Weather System

**What**: Track mood with weather metaphors, XP bonus for tough days

| Level | Weather | XP Multiplier |
|-------|---------|---------------|
| 5 | ☀️ Sunny | 1.0x |
| 4 | 🌤️ Partly Cloudy | 1.05x |
| 3 | ☁️ Cloudy | 1.15x |
| 2 | 🌧️ Rainy | 1.3x |
| 1 | ⛈️ Stormy | 1.5x |

**Key**: NO goal target adjustment, only XP bonus

**Files**: `mood-system.ts`, `mood-context.tsx`, `mood-selector.tsx`

---

## 2026-01-16: Goal UI/UX Redesign

**What**: Goal Master-inspired charts and wizard
- Progress chart with plant growth icons
- Week-by-week timeline
- Garden-themed wizard (Seed → Target → Growth → Preview)
- Growth curves: Steady, S-Curve, Step, Quick Start, Slow Burn

**Files**: `goal-progress-chart.tsx`, `goal-timeline.tsx`, `goal-setup-wizard.tsx`

---

## 2026-01-16: Weeds System

**What**: Weeds grow when not checking in
- 1 weed/day (max 7)
- Tap to clear (+5 XP)
- "Clear All" when 3+ weeds

**Files**: `weeds-context.tsx`, `weed-item.tsx`, `plant-weeds.tsx`

---

## 2026-01-15: Optimistic Updates

**What**: Instant UI updates when watering
- `useOptimistic` hook for immediate feedback
- `PlantsContext` manages global state
- Server syncs in background

---

## 2026-01-15: Game-Style UI

**What**: Mobile game-inspired design
- Bottom navigation (removed sidebar)
- Floating HUD (XP, level, weather)
- Glass morphism cards
- Gradient backgrounds

**Files**: `game-nav.tsx`, `game-hud.tsx`

---

## 2026-01-15: PWA & Polish

**What**: Installable app + error handling
- Manifest + service worker
- Onboarding modal (5 steps)
- Error boundaries
- Skeleton loaders

---

## 2026-01-14: Plant Visual System

**What**: Images instead of emojis
- `PlantImage` component with growth stages
- Directory: `public/plants/[type]/[stage].png`
- Fallback to generic if type-specific missing

---

## 2026-01-14: Phase 3b Adaptive Goals

**What**: Performance-based goal adjustments
- Weekly score calculation
- Trigger detection (increase/decrease/recovery)
- Suggestion modal with options
- Adaptive modes: Fixed, Suggest, Auto
- Recovery week (50% target)

---

## 2026-01-14: Phase 3 Goal Tracking

**What**: Build Capacity and Total Progress modes
- Goal setup wizard
- Daily logging with +/- buttons
- Weekly targets with curves
- Personal records (+25 XP bonus)
- Goal statistics view

---

## 2026-01-14: Phase 2 Gamification

**What**: XP, achievements, weather
- 15 levels with exponential scaling
- 20+ achievements with 4 tiers
- Deterministic weather system
- Water reserves for streak protection
- Stats dashboard + cemetery view

---

## Key Decisions

| Date | Decision | Reason |
|------|----------|--------|
| 01-14 | CSS animations over Lottie | Performance, no external files |
| 01-14 | Deterministic weather | Consistent, testable |
| 01-14 | Achievements in code | Type-safe, version controlled |
| 01-17 | Mood XP bonus only | Goals should stay consistent |
| 01-19 | pg_cron over Vercel cron | More reliable, runs in DB |
| 01-23 | Mode-based UI | Clearer than gesture-only |

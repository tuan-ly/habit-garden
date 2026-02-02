# Habit Garden - Project Memo

> **Last Updated**: 2026-02-02
> **Phase**: 4 - Polish & Launch
> **Stack**: Next.js 16, Supabase, Tailwind CSS 4, shadcn/ui

---

## Quick Status

| Area | Status |
|------|--------|
| Auth | ✅ Complete |
| Garden/Plants | ✅ Complete |
| Watering System | ✅ Complete |
| Gamification | ✅ Complete (XP, achievements, weather, streaks, **journal rewards**) |
| Goal Tracking | ✅ Complete (Build Capacity + Total Progress modes) |
| Adaptive Goals | ✅ Complete |
| PWA/UI Polish | ✅ Mostly complete |
| **Gentle Growth** | ✅ Phase 1 Complete (DB + UI integrated) |
| **Plant Detail Sheet** | ✅ Redesigned with tabs + reflective UX |

---

## Recent Sessions

### 2026-02-02: UX Mode Consolidation - Simplified Interaction
**Changes**:
- Consolidated 3 garden modes (View/Move/Add) into 1 toggle (Interact/Move)
- **Interact mode** (default): Click plant → GentleWateringModal, Click empty → AddPlantDialog
- **Move mode**: Click-to-select, click-to-place (toggle on/off)
- Merged FloatingPlantCard UX into GentleWateringModal (plant stats: moisture/growth/streak bars)
- Added "View plant details" link in modal for quick access to PlantDetailSheet
- Unified mobile/desktop behavior: both now show GentleWateringModal on plant click

**Key Files Changed**:
- [mode-toolbar.tsx](src/components/garden/mode-toolbar.tsx) - 3 buttons → 1 toggle
- [isometric-garden.tsx](src/components/garden/isometric-garden.tsx) - Simplified modes, removed FloatingCard
- [gentle-watering-modal.tsx](src/components/plants/gentle-watering-modal.tsx) - Added stats section + Details link

**Status**: ✅ Complete

---

### 2026-02-02: Plant Detail Sheet Redesign - Reflective UX with Tabs
**Changes**:
- Redesigned plant-detail-sheet.tsx with 3-tab layout: Overview | Journal | Stats
- **Overview tab**: "Why I Started", quick rhythm (7 days), goal progress, action button, compact stats
- **Journal tab**: Activity timeline with notes + milestone celebrations (lazy loaded)
- **Stats tab**: Full moisture/growth bars, streak stats, 14-day rhythm (lazy loaded)
- Added skeleton loaders for smooth loading experience
- Implemented ReflectionModal for milestone reflections

**New Components**:
- [plant-detail-skeleton.tsx](src/components/plants/plant-detail-skeleton.tsx) - Tab-specific skeletons
- [journal-timeline.tsx](src/components/plants/journal-timeline.tsx) - Notes chronologically grouped
- [milestone-timeline.tsx](src/components/plants/milestone-timeline.tsx) - Journey milestones
- [reflection-modal.tsx](src/components/plants/reflection-modal.tsx) - Multi-step reflection flow
- [journal.ts](src/lib/actions/journal.ts) - Server actions for journal/milestones

**Performance Improvements**:
- Lazy loading: Only load data for visible tab
- Reduced initial load from 3 API calls to 2 (7-day rhythm vs 30-day)
- useTransition for smooth tab switches
- Data caching (don't refetch on tab switch back)

**Status**: ✅ Complete

---

### 2026-01-31: Watering Modal Redesign - Simplified 2-Option Flow
**Changes**:
- Replaced 3-action flow (Water/Log/Rest) with 2-option flow: "I did it today!" + "Just checking in"
- "I did it today!" mode now has QuickLogModal-style UI: number input + quick picks first, then notes
- All plants (goal or non-goal) now use `GentleWateringModal` instead of QuickLogModal
- Removed rest day option from modal (simplification)

**Key Files Changed**:
- [gentle-watering-modal.tsx](src/components/plants/gentle-watering-modal.tsx) - 2-button flow, log mode UI
- [isometric-garden.tsx](src/components/garden/isometric-garden.tsx) - Routes all plants to GentleWateringModal

**Status**: ✅ Complete

**TODO for Next Session** (Watering Logic Refinement):
1. If already watered today → hide "Just checking in", only show "I did it today!"
2. `waterPlantSimple` should NOT give base XP anymore, only note XP (like subsequent logs)
3. Base XP only awarded on first water/log of the day

---

### 2026-01-31: Gentle Growth Phase 1 - UI Integration
**Changes**:
- Integrated `GentleWateringModal` into garden view (replaces old WateringModal)
- Added `RhythmView` with activity dots + stats to plant detail sheet
- 3-action flow: Water / Log Progress / Rest Day now works from garden

**Key Files Changed**:
- [isometric-garden.tsx](src/components/garden/isometric-garden.tsx) - Uses GentleWateringModal
- [plant-detail-sheet.tsx](src/components/plants/plant-detail-sheet.tsx) - Shows RhythmView

**Status**: ✅ Phase 1 Complete - Ready for Phase 2

---

### 2026-01-31: Gentle Growth Phase 1 Implementation
**Changes**:
- Database migration: `activity_logs`, `rest_days`, `reflections` tables
- New plant statuses: `thriving`, `resting`, `waiting`, `sleeping` (no more `dead`)
- New types: `ActivityLog`, `RestDay`, `Reflection`, `GentlePlantStatus`
- Created [plant-status.ts](src/lib/plant-status.ts) - Status calculation logic
- Created [activity.ts](src/lib/actions/activity.ts) - Unified activity logging
- Created [gentle-watering-modal.tsx](src/components/plants/gentle-watering-modal.tsx) - 3-action flow
- Created [rhythm-view.tsx](src/components/plants/rhythm-view.tsx) - Dots visualization
- Updated [plant-detail-sheet.tsx](src/components/plants/plant-detail-sheet.tsx) - "Why I Started" + gentle messaging

**Key Files**:
- [20260131_gentle_growth_phase1.sql](supabase/migrations/20260131_gentle_growth_phase1.sql)
- [database.ts](src/types/database.ts) - Extended with new types
- [plant-status.ts](src/lib/plant-status.ts) - NEW
- [activity.ts](src/lib/actions/activity.ts) - NEW
- [gentle-watering-modal.tsx](src/components/plants/gentle-watering-modal.tsx) - NEW
- [rhythm-view.tsx](src/components/plants/rhythm-view.tsx) - NEW

**Next Steps**:
- ✅ Migration deployed to Supabase (4 parts: columns, tables, RLS, data migration)
- ✅ Integrate `GentleWateringModal` into garden view
- ✅ Add rhythm view to plant detail sheet
- Phase 2: Journal Tree, season transitions

---

### 2026-01-31: Unified Vision Plan & Doc Cleanup
**Changes**:
- Created [UNIFIED-VISION-PLAN.md](../doc/UNIFIED-VISION-PLAN.md) - Master vision document
- Consolidated ideas from GENTLE-GROWTH, Design_vision, redesign, feature docs
- Archived superseded docs to `doc/archive/`

**Key Decisions**:
- **Watering ≠ Completing**: Full separation (tưới vs log progress)
- **Multi-Season**: 1 plant = nhiều seasons over time
- **No Plant Death**: Sleeping state replaces dead
- **Journal Tree**: Special plant type for free writing
- **Archetypes**: Deferred to Phase 2

**Next Steps**:
- Phase 1: DB migrations, new plant states, watering modal redesign
- Phase 2: Journal Tree, season transitions, reflection UI

---

### 2026-01-29: Improved Goal Setup UI/UX with Period-Based Tracking
**Changes**:
- Redesigned Goal Setup Wizard with clearer 4-step flow
- Period-based progress tracking (daily/weekly/monthly goals now work properly)
- New PeriodTargetDisplay component shows "This Week: 20/30 pages"
- Fixed: frequency fields now saved to database when creating goal
- Updated GoalProgress to prioritize period progress over overall

**Key files changed**:
- [goal-setup-wizard.tsx](src/components/goals/goal-setup-wizard.tsx) - Complete redesign
- [goal-progress.tsx](src/components/goals/goal-progress.tsx) - Period-focused display
- [period-target-display.tsx](src/components/goals/period-target-display.tsx) - NEW
- [goal-utils.ts](src/lib/goal-utils.ts) - NEW: getPeriodInfo(), getPeriodTarget()
- [goals.ts](src/lib/actions/goals.ts) - Period tracking in GoalWithStats

---

### 2026-01-26: Focus Tab & Goal Frequency
**Changes**:
- Added Focus tab to garden view (Garden | List | Focus)
- Goal frequency support: daily/weekly/monthly with frequency_target
- Focus mode visual states: highlight (pulse-glow), dim (grayscale), urgent (red ring + bounce)
- FocusHeader shows progress bar with completed/total/urgent counts

**Key files changed**:
- [garden-view.tsx](src/components/garden/garden-view.tsx) - ViewMode extended, Focus button added
- [focus-garden-view.tsx](src/components/garden/focus-garden-view.tsx) - NEW: Focus view wrapper
- [focus-header.tsx](src/components/garden/focus-header.tsx) - NEW: Progress header
- [isometric-garden.tsx](src/components/garden/isometric-garden.tsx) - focusMode/focusStates props
- [isometric-plant.tsx](src/components/garden/isometric-plant.tsx) - focusState visual styles
- [goal-setup-wizard.tsx](src/components/goals/goal-setup-wizard.tsx) - Frequency selector
- [database.ts](src/types/database.ts) - GoalFrequency type, Goal interface updated

**Database migration**:
- `20260126_add_goal_frequency.sql` - goals.frequency, frequency_target, period_start_day

---

### 2026-01-25: Optimistic Celebration UX
**Changes**:
- Watering/goal logging now shows celebration immediately (optimistic update)
- Client-side XP estimation using `calculateWateringXp` and `calculateNoteBonus`
- Error handling: cancel celebration and show toast if server rejects

**Key files changed**:
- [isometric-garden.tsx](src/components/garden/isometric-garden.tsx) - Optimistic celebration for `handleWaterConfirm` and `handleGoalLog`

---

### 2026-01-24: Journal/Notes Reward System & Database Fixes
**Changes**:
- Added `growth_blocked` column to plants table (fix watering error)
- Created journal/notes reward system with XP bonuses:
  - +3 XP for any note, +2 for >50 chars, +2 for >100 chars
  - Journal streak tracking with bonus XP (3/5/8/12 for 3/7/14/30 days)
- Added 8 new journal achievements to database
- Updated watering modal UX with note bonus indicators and tips
- Added journal_streak, longest_journal_streak, last_journal_date, total_journal_entries to profiles

**Key files changed**:
- [plants.ts](src/lib/actions/plants.ts) - Note bonus XP, journal streak tracking
- [xp-system.ts](src/lib/xp-system.ts) - Added calculateNoteBonus function
- [watering-modal.tsx](src/components/plants/watering-modal.tsx) - Journal UX with bonus tiers
- [database.ts](src/types/database.ts) - Added journal fields to Profile type
- [garden-view.tsx](src/components/garden/garden-view.tsx) - Pass journalStreak prop
- [isometric-garden.tsx](src/components/garden/isometric-garden.tsx) - Accept journalStreak prop

**Database migrations applied**:
- `add_growth_blocked_column` - plants.growth_blocked BOOLEAN
- `add_journal_tracking_system` - profiles journal fields + achievements

### 2026-01-23: Performance Settings & Mobile UX Fixes
**Changes**:
- Added GardenSettings context for toggling visual effects (particles, decorations, celebrations)
- Created Performance settings UI in settings page with toggle switches
- Fixed watering animation bug (multiple clicks causing repeated animations) with cooldown mechanism
- Prevented text selection on garden page (`select-none`, `WebkitTouchCallout`)
- Prevented browser pinch-to-zoom (app zoom only) with `preventDefault` on touch events

**Key files changed**:
- [garden-settings-context.tsx](src/lib/context/garden-settings-context.tsx) - NEW
- [performance-settings.tsx](src/components/settings/performance-settings.tsx) - NEW
- [switch.tsx](src/components/ui/switch.tsx) - NEW
- [isometric-garden.tsx](src/components/garden/isometric-garden.tsx) - Integrated settings, cooldown fix, selection prevention
- [use-garden-zoom.ts](src/lib/hooks/use-garden-zoom.ts) - Prevent browser pinch zoom

### 2026-01-23: Performance Optimization - Click-to-Move
**Changes**:
- Replaced drag-and-drop with click-to-select, click-to-place for better performance
- Reduced ambient particles (butterflies 3→1, pollen 15→5, fireflies 20→8, sparkles 20→6)
- Simplified hover effects (removed SVG filters, gradients, animations)
- Added faded plant preview when hovering target tile in move mode
- Removed complex touch/mouse event handlers

**Key files changed**:
- [isometric-garden.tsx](src/components/garden/isometric-garden.tsx) - Simplified move logic
- [isometric-tile.tsx](src/components/garden/isometric-tile.tsx) - Added preview, simplified hover
- [ambient-particles.tsx](src/components/garden/ambient-particles.tsx) - Reduced particle count

### 2026-01-23: Mode-Based Garden UI
**Changes**:
- Added 3-mode toolbar (Water/Move/Plant) with Lucide icons
- Instant drag in Move mode (no long-press needed)
- Fixed drag/pan conflict (didPan state reset)

**Key files changed**:
- [mode-toolbar.tsx](src/components/garden/mode-toolbar.tsx) - NEW
- [isometric-garden.tsx](src/components/garden/isometric-garden.tsx)
- [use-garden-zoom.ts](src/lib/hooks/use-garden-zoom.ts)

### 2026-01-22: Gesture-Based UX
- Pan threshold (8px) before drag starts
- Double-tap detection for plants and empty tiles
- First-time gesture hint for new users

### 2026-01-22: Garden Visual Enhancement
- Decorations around garden (trees, bushes, rocks)
- Weather-aware particle system (butterflies, fireflies, leaves)
- Enhanced tile hover with glow effect

---

## Working Features

**Core**
- Auth (login, register, protected routes)
- Plants CRUD with types and positioning
- Grid-based garden with zoom/pan
- Drag-and-drop plant movement

**Watering**
- One-tap watering with celebration effect
- Moisture tracking with decay
- Streak system with bonuses

**Gamification**
- XP system (15 levels)
- Weather affecting XP/growth
- 20+ achievements
- Water reserves for streak protection

**Goals**
- Build Capacity mode (improve over time)
- Total Progress mode (accumulate to target)
- Weekly targets with progression curves
- Adaptive suggestions based on performance
- Personal records with bonus XP

**UI/UX**
- PWA (installable)
- Game-style bottom nav + floating HUD
- Mood/weather system for XP bonuses
- Onboarding flow
- Skeleton loaders

---

## Known Issues / TODO

- [ ] Responsive design check needed
- [ ] Achievement unlock notifications (popup)
- [ ] Level up celebration modal
- [ ] Performance optimization for large gardens

---

## Key Directories

```
src/components/
├── garden/         # Garden view (isometric, tiles, zoom)
├── plants/         # Plant components (visual, cards, dialogs)
├── goals/          # Goal tracking UI
├── game-ui/        # HUD, nav, mood selector
└── ui/             # shadcn components

src/lib/
├── actions/        # Server actions (plants, goals, profile)
├── context/        # React contexts (plants, mood, weeds)
├── hooks/          # Custom hooks
└── utils/          # Utilities (grid positioning, etc.)

public/plants/      # Plant images by type/stage
```

---

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # For cron job
CRON_SECRET=                 # For cron auth
```

---

## Database Quick Reference

**Key tables**: `plants`, `plant_types`, `goals`, `goal_logs`, `profiles`, `watering_logs`, `mood_logs`, `achievements`, `activity_logs`, `rest_days`, `reflections`

**Cron**: `update_daily_moisture()` runs at 17:00 UTC (00:00 VN) via pg_cron

---

## For Full History

See [DEVLOG.md](.claude/DEVLOG.md) for detailed session logs and implementation history.

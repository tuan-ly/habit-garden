# Habit Garden - Project Memo

> **Last Updated**: 2026-01-25
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

---

## Recent Sessions

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

**Key tables**: `plants`, `plant_types`, `goals`, `goal_logs`, `profiles`, `watering_logs`, `mood_logs`, `achievements`

**Cron**: `update_daily_moisture()` runs at 17:00 UTC (00:00 VN) via pg_cron

---

## For Full History

See [DEVLOG.md](.claude/DEVLOG.md) for detailed session logs and implementation history.

# Development Log - Habit Garden

> Nhật ký phát triển. Chi tiết implementation cho reference.

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

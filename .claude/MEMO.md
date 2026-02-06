# Habit Garden - Project Memo

> **Last Updated**: 2026-02-06
> **Phase**: 4 - Polish & Launch
> **Stack**: Next.js 16, Supabase, Tailwind CSS 4, shadcn/ui

---

## 🎯 Current Sprint

**Focus**: Habien 2.0 - Phase 2 Implementation

**Progress**:
- ✅ Phase 1 complete (tier system, slot limits)
- ✅ Phase 2 complete (garden expansion system)
- [ ] Phase 3: Celebration & Feedback integration

**Phase 2 Implemented**:
- [progression-system.ts](../src/lib/progression-system.ts) - Added getGardenSize, getUnlockedDecorations, getLevelUnlocks
- [grid-positioning.ts](../src/lib/utils/grid-positioning.ts) - Added minimumSize parameter
- [isometric-garden.tsx](../src/components/garden/isometric-garden.tsx) - Level-based grid sizing
- [garden-decorations.tsx](../src/components/garden/garden-decorations.tsx) - Unlock filtering + new SVGs (fence, pond, fountain)
- [level-up-modal.tsx](../src/components/game-ui/level-up-modal.tsx) - Level-up celebration modal
- [unlock-toast.tsx](../src/components/game-ui/unlock-toast.tsx) - Unlock notification toasts
- [expansion-animation.tsx](../src/components/garden/expansion-animation.tsx) - Garden expansion ripple effect

**Next Actions**:
1. Wire up LevelUpModal to XP system (trigger on level up)
2. Add expansion animation to isometric-garden
3. Test garden at different levels (1, 5, 6, 8, 9, 10, 12)
4. Phase 3: Add level-up triggering in xp-system.ts

**Related Docs**:
- [Implementation Plan](../plans/20260206-habien-2.0-phase-1/)
- [Brainstorm Reports](../plans/goal-feature-uiux-design/reports/)

---

## Quick Status

| Area | Status |
|------|--------|
| Auth | Done |
| Garden/Plants | Done |
| Watering System | Done |
| Gamification | Done (XP, achievements, weather, streaks, journal rewards) |
| Goal Tracking | Done (Build Capacity + Total Progress modes) |
| Adaptive Goals | Done |
| PWA/UI Polish | Done |
| Gentle Growth | Phase 1 Done |
| Plant Detail Sheet | Done (tabs + reflective UX) |

---

## Latest Session

### 2026-02-06: Habien 2.0 Phase 2 - Garden Expansion System
- Implemented level-based garden sizing (3x3 -> 5x5 -> 7x7 -> dynamic)
- Added decoration unlock system (bushes/rocks at L1, mushrooms/flowers L5, lanterns L8, fences L10, ponds/fountains L12)
- Created new SVG decorations: FencePost, FenceCorner, Pond, Fountain
- Built LevelUpModal with confetti effect and unlock display
- Built unlock toast notification system
- Built garden expansion ripple animation

**New Files**: [level-up-modal.tsx](src/components/game-ui/level-up-modal.tsx), [unlock-toast.tsx](src/components/game-ui/unlock-toast.tsx), [expansion-animation.tsx](src/components/garden/expansion-animation.tsx)

**Modified**: [progression-system.ts](src/lib/progression-system.ts), [grid-positioning.ts](src/lib/utils/grid-positioning.ts), [isometric-garden.tsx](src/components/garden/isometric-garden.tsx), [garden-decorations.tsx](src/components/garden/garden-decorations.tsx), [globals.css](src/app/globals.css)

### 2026-02-06: Habien 2.0 Phase 1 Implementation
- Implemented tier system (1-5 tiers based on plant difficulty)
- Added slot limits by level (1 slot at level 1, up to unlimited at level 15)
- Created TierBadge and SlotIndicator UI components
- Added tier filtering and slot validation to AddPlantDialog
- Applied migration to Supabase

**New Files**: [progression-system.ts](src/lib/progression-system.ts), [tier-badge.tsx](src/components/ui/tier-badge.tsx), [slot-indicator.tsx](src/components/ui/slot-indicator.tsx)

### 2026-02-02: UX Mode Consolidation
- Consolidated 3 garden modes into 1 toggle (Interact/Move)
- Merged FloatingPlantCard UX into GentleWateringModal

---

## Known Issues / TODO

- [ ] Responsive design check
- [ ] Achievement unlock popup notification
- [x] Level up celebration modal (Phase 2)
- [ ] Performance optimization for large gardens
- [ ] Wire LevelUpModal to XP system (trigger on level change)

**Watering Logic Refinement** (from 2026-01-31):
1. If already watered today -> hide "Just checking in"
2. `waterPlantSimple` should NOT give base XP, only note XP
3. Base XP only on first water/log of the day

---

## Working Features

**Core**: Auth, Plants CRUD, Grid garden with zoom/pan, Plant movement

**Watering**: One-tap watering + celebration, Moisture tracking, Streaks

**Gamification**: XP (15 levels), Weather XP bonus, 20+ achievements, Water reserves

**Goals**: Build Capacity mode, Total Progress mode, Weekly targets, Adaptive suggestions, Personal records

**UI/UX**: PWA, Game-style nav + HUD, Mood/weather system, Onboarding, Skeletons

---

## Key Directories

```
src/components/
  garden/    - Isometric garden, tiles, zoom, decorations
  plants/    - Plant visual, cards, dialogs, watering modal
  goals/     - Goal tracking UI
  game-ui/   - HUD, nav, mood selector

src/lib/
  actions/   - Server actions (plants, goals, profile, activity, journal)
  context/   - React contexts
  hooks/     - Custom hooks
```

---

## Database Quick Reference

**Tables**: `plants`, `plant_types`, `goals`, `goal_logs`, `profiles`, `watering_logs`, `mood_logs`, `achievements`, `activity_logs`, `rest_days`, `reflections`

**Cron**: `update_daily_moisture()` at 17:00 UTC (00:00 VN)

---

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

---

## References

- [DEVLOG.md](DEVLOG.md) - Full session history & implementation details
- [DECISIONS.md](DECISIONS.md) - Architecture decisions
- [ROADMAP.md](ROADMAP.md) - Future plans
- [CHANGELOG.md](CHANGELOG.md) - Release notes

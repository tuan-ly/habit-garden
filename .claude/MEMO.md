# Habit Garden - Project Memo

> **Last Updated**: 2026-02-06
> **Phase**: 4 - Polish & Launch
> **Stack**: Next.js 16, Supabase, Tailwind CSS 4, shadcn/ui

---

## 🎯 Current Sprint

**Focus**: Habien 2.0 - Phase 1 Implementation

**Progress**:
- ✅ Design complete: [HABIEN_2.0_DESIGN.md](../plans/goal-feature-uiux-design/HABIEN_2.0_DESIGN.md)
- ✅ Plant catalog: [PLANT_CATALOG.md](../plans/goal-feature-uiux-design/plant-designs/PLANT_CATALOG.md)
- ✅ Phase 1 implementation complete (tier system, slot limits)
- ✅ Migration applied to Supabase

**Implemented**:
- [progression-system.ts](../src/lib/progression-system.ts) - Core utility (getMaxPlants, canPlantTier, checkSlotAvailability)
- [tier-badge.tsx](../src/components/ui/tier-badge.tsx) - TierBadge component (1-5 stars)
- [slot-indicator.tsx](../src/components/ui/slot-indicator.tsx) - SlotIndicator (default/compact/progress)
- Modified: [database.ts](../src/lib/database.ts), [add-plant-dialog.tsx](../src/components/plants/add-plant-dialog.tsx), [plants.ts](../src/lib/actions/plants.ts)

**Next Steps**:
1. Test in browser (tier filtering, slot limits)
2. Phase 2: Garden expansion system
3. Phase 3: Outcome integration

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
- [ ] Level up celebration modal
- [ ] Performance optimization for large gardens

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

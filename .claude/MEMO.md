# Habit Garden - Project Memo

> **Last Updated**: 2026-02-05
> **Phase**: 4 - Polish & Launch
> **Stack**: Next.js 16, Supabase, Tailwind CSS 4, shadcn/ui

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

### 2026-02-02: UX Mode Consolidation
- Consolidated 3 garden modes (View/Move/Add) into 1 toggle (Interact/Move)
- **Interact mode** (default): Click plant -> GentleWateringModal, Click empty -> AddPlantDialog
- **Move mode**: Click-to-select, click-to-place
- Merged FloatingPlantCard UX into GentleWateringModal (stats bars + details link)

**Changed**: [mode-toolbar.tsx](src/components/garden/mode-toolbar.tsx), [isometric-garden.tsx](src/components/garden/isometric-garden.tsx), [gentle-watering-modal.tsx](src/components/plants/gentle-watering-modal.tsx)

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

# Reading Plant Integration — Phase 2 Handoff

**Date:** 2026-07-29  
**Status:** Implemented and verified  
**Scope:** Garden UI Integration only

## Delivered

- `/garden` loads the canonical reading journey and maps it to a runtime `VirtualPlant`.
- `PlantsProvider` exposes a discriminated `(PlantWithType | VirtualPlant)[]` while real-plant mutations reject virtual plants.
- `IsometricGarden` assigns virtual plants to deterministic free 1×1 cells without persisting grid coordinates.
- `HabitPlantTile` renders a reading-specific garden visual, growth bar and active-session indicator.
- Selecting a reading tile routes to `/reading`; an active reading session routes directly to `/reading/session`.
- The dashboard layout displays `ActiveSessionBanner` across protected pages for a running session, with an updating elapsed timer and Resume action.
- Plant cards/detail sheets and garden interactions narrow virtual plants before real-plant-only properties or mutations.

## Verification

- `npx tsc --noEmit` — pass.
- `npm run test:run -- src/lib/__tests__/habit-plant-mapping.test.ts src/components/garden/__tests__/habit-plant-tile.test.tsx src/components/game-ui/__tests__/active-session-banner.test.tsx src/components/garden/__tests__` — 10 files, 67 tests passed.
- Focused ESLint across Phase 2 files — zero errors; 12 existing unused-code warnings remain in `plant-card.tsx` and `plant-detail-sheet.tsx`.
- `git diff --check` — pass.

## Important Design Contract

This remains the **Virtual Plant Pattern**: reading plants are projections of `habits + growth_states`, not rows in `plants`. They must stay outside watering, garden-goal, movement and sanctuary-care mutations. Session progress remains owned by `habit_sessions`, `daily_progress` and `growth_states`.

## Known Follow-up

- Perform a browser-based visual check with real persisted reading data before committing.
- Active session state is server-rendered when `/garden` loads; live cross-route synchronization is reserved for later cross-system work.
- The lowercase duplicate `src/components/garden/habit-plant-tile.tsx` is unused; the canonical component is `HabitPlantTile.tsx`.
- Do not begin Phase 3 without a new discuss/plan step.

## Next Session

1. Start from this handoff and inspect the working tree before editing.
2. Run the app and validate virtual tile placement, navigation and active-session visuals.
3. Fix only Phase 2 visual/regression issues found during that check.
4. Commit Phase 2 manually when accepted.

# Guided Habit → Real Plant Capability Plan

**Updated:** 2026-07-30
**Goal:** Reading and future guided features extend normal persisted plants.

## Architecture

Use **Capability Attachment**:

- `plants` remains the visual, spatial and lifecycle aggregate root.
- `habits.plant_id` is an owned, unique foreign key to a real plant.
- `habit_sessions`, `daily_progress`, `goal_plans` and `growth_states` remain reusable guided behavior.
- `PlantWithType.guided_habit` is optional read-model metadata, not another plant type.
- Session completion records an idempotent activity against the linked plant.

See `docs/adr/002-guided-habit-plant-capability.md`.

## Delivered Slice

- [x] Remove `VirtualPlant` from `PlantsProvider`, garden placement, cards and mutations.
- [x] Restore real-plant movement to empty cells and preserve decoration movement.
- [x] Add `habits.plant_id` migration with ownership RLS and existing-data backfill.
- [x] Replace implicit grass-plant provisioning with explicit Reading attachment from the normal plant focus/detail flow.
- [x] Expose guided capability metadata on real plant read models.
- [x] Make the attached capability visible on the plant and expose its Reading CTA in focus/detail UI.
- [x] Keep the global active-session banner read-only outside Reading routes.
- [x] Sync completed reading sessions to real-plant activity with an idempotency key.

## Non-goals

- Exercise UI or another capability type.
- Multiple guided capabilities on one plant.
- Progression history chart or session-duration customization.
- Automatic linked-environment migration deployment.

## Acceptance

- Garden core types contain only persisted plants.
- Real plants can move to empty cells.
- Decorations retain selection and movement behavior.
- Every guided habit references a plant owned by the same user.
- Users explicitly choose which normal plant receives the Reading capability.
- Opening `/reading` never silently creates another plant.
- The attached capability is visible from the garden before opening plant detail.
- Reading completion updates both guided progress and the linked plant.
- Typecheck, focused tests, migration ledger check and production build pass.

# ADR 002: Guided Habits As Plant Capabilities

- Status: Accepted
- Date: 2026-07-29

## Context

The first garden integration projected `habits + growth_states` into runtime virtual plants. That avoided duplicate rows, but introduced a second set of plant invariants into `PlantsProvider`, placement, cards and interactions. Virtual plants had no persisted grid position and a regression prevented real plants from moving to empty cells.

The product model requires Reading, Exercise and future guided workflows to extend normal garden plants rather than create parallel plant types.

## Decision

Keep `plants` as the visual, spatial and lifecycle aggregate root. Attach at most one guided `habit` capability to a plant through the owned `habits.plant_id` foreign key.

`habit_sessions`, `daily_progress`, `goal_plans` and `growth_states` remain behavior-specific records keyed by `habit_id`. Garden read models expose an optional `guided_habit` summary on `PlantWithType`; the garden itself continues to render and mutate only persisted plants. Completing a guided session records an idempotent activity against the linked plant.

Attachment is explicit product behavior. A user selects a normal plant in the garden and attaches or moves Reading from its focus/detail UI. Opening `/reading` without a capability must show the attachment prompt and must not provision a hidden plant.

## Consequences

- Plant and decoration placement retain one source of truth.
- Guided features can add their own routes and UI without widening core garden types.
- Existing reading habits require a one-time backfill to real plants.
- Creating a normal plant and attaching guided behavior remain separate, visible operations.
- Moving a capability preserves its sessions, progress and Growth Plan because only `habit.plant_id` changes.
- Additional capability types can reuse the aggregate while providing type-specific UI.

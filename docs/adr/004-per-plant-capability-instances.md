# ADR 004: Per-Plant Capability Instances

- Status: Accepted; concurrent-running consequence superseded by [ADR 006](./006-user-scoped-running-session.md)
- Date: 2026-08-15
- Supersedes: [ADR 003](./003-shared-capability-assignments.md)

## Context

ADR 003 correctly removed the UI behavior that moved Reading from one plant to another, but it interpreted “one capability on many plants” as one shared `habit` aggregate. Because `goal_plans`, `growth_states`, `daily_progress` and `habit_sessions` are keyed by `habit_id`, assigned plants consequently shared both target and log. The intended product behavior is reuse of the capability type, not reuse of one user's progress instance.

## Decision

Adopt **Capability Definition vs Capability Instance**. Reading is a reusable capability definition configured in application code. Selecting Reading for a plant creates a distinct `habits` row as that plant's capability instance. `plant_capability_assignments.plant_id` remains unique so a plant has at most one capability, and `habit_id` also becomes unique so an instance belongs to exactly one plant.

Keep `goal_plans`, `growth_states`, `daily_progress` and `habit_sessions` keyed by `habit_id`. This existing ownership now provides isolated target, Growth Plan, open session and completed-session log per plant without adding a second event table. Journal and activity projections resolve `plant_id → habit_id` and show only that instance's sessions.

Drop the user-level `UNIQUE (user_id, type)` constraint on `habits`; a user may own multiple instances of the same capability type on different plants. Attachment remains additive and idempotent for a plant, but it creates a new instance instead of reusing another plant's instance. Completion and rewards remain atomic per session and update only the source plant.

## Data Migration

Existing habits with one assignment are unchanged. If one habit already has multiple assignments, the earliest assignment keeps the original instance. Each additional assignment receives a cloned habit, plan and growth state; sessions are moved according to `source_plant_id`, and affected daily aggregates are rebuilt from completed sessions. A unique constraint on assignment `habit_id` prevents future sharing.

## Consequences

- Many plants can select Reading without switching it away from another plant.
- Each plant has an independent target, Growth Plan, open-session lifecycle and capability log.
- Running attention is user-scoped: [ADR 006](./006-user-scoped-running-session.md) supersedes the earlier allowance for concurrent timers.
- The global resume banner resolves the user's single running capability session.
- Capability reuse is represented by `habits.type`, while progress ownership is represented by the per-plant habit instance.

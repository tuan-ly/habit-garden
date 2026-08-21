# ADR 003: Shared Capability Assignments And Event Stream

- Status: Superseded by [ADR 004](./004-per-plant-capability-instances.md)
- Date: 2026-08-14
- Supersedes: [ADR 002](./002-guided-habit-plant-capability.md)

## Context

ADR 002 made a persisted plant the visual and route identity for a guided habit, but stored that relationship directly in the unique `habits.plant_id` column. The resulting one-to-one attachment forced the user to move Reading between plants even though Reading sessions, progress and Growth Plan describe one reusable capability. It also made a plant link look like the owner of capability history.

The product model now requires different cardinality: each plant may select at most one capability, while one capability may be assigned to many plants. Every assigned plant must show the capability's same log and progression without copying events or switching the capability away from another plant.

## Decision

Adopt **Capability Assignment**: model the relationship with `plant_capability_assignments`, where `plant_id` is the primary key and `habit_id` is deliberately non-unique. Composite foreign keys with `user_id` guarantee that both the plant and capability belong to the same owner. `plants` remains the visual, spatial and lifecycle aggregate root; `habits` becomes the reusable capability aggregate rather than an attachment row.

Adopt a **Shared Capability Event Stream**: `habit_sessions`, `daily_progress`, `goal_plans` and `growth_states` remain keyed by `habit_id`. Plant journal, history and milestone reads for an assigned plant project completed capability sessions through its assignment. All plants assigned to the same capability therefore see the same results and reflections. The projection does not duplicate events per plant, and plant-local `activity_logs` are not the canonical guided-capability history.

Adopt **Route Context** through nullable `habit_sessions.source_plant_id`. Starting a session records the plant route from which it was opened. Resume navigation prefers that plant while its assignment remains valid, then falls back deterministically to another assigned plant. `source_plant_id` is not an ownership key, progression key or event-stream partition; deleting its plant sets it to null without deleting the session. An idempotent plant-care side effect may still target the source plant, but the completed session remains the canonical shared log event.

Attachment is additive and idempotent. Selecting Reading on another eligible plant inserts another assignment to the user's active Reading capability; it never removes an existing assignment. A plant already assigned to Reading returns `already_attached`, while a plant assigned to a different capability is rejected. The resource route remains `/plant/{plantId}` and must resolve the requested owned plant, its assignment and an active capability before rendering capability UI.

## Expand/Contract Rollout

1. **Expand:** create the assignment table with owner-scoped RLS and grants; add and backfill `habit_sessions.source_plant_id`; backfill one assignment from every legacy `habits.plant_id`; verify that no attachment or session origin was lost.
2. **Compatibility:** retain nullable `habits.plant_id` as a deprecated rollout anchor, change its plant-delete behavior from cascade to set-null, and mirror older insert/update behavior into additive assignments. A legacy "move" therefore degrades safely to sharing and never deletes the previous assignment.
3. **Cut over:** make application reads and writes use `plant_capability_assignments`; remove switch language; project the shared capability event stream on every assigned plant; use `source_plant_id` only to recover route context.
4. **Contract later:** after older deployed builds are retired and assignment/session invariants are verified in the linked environment, remove the compatibility trigger, legacy unique/index/FK artifacts and `habits.plant_id` in a separate migration. The expand migration must not perform this destructive step.

## Consequences

- One capability can appear on many real plants without creating another plant representation or moving history.
- Each plant still has zero or one capability, so garden controls and capability-empty states stay unambiguous.
- One open-session constraint per `habit_id` now applies across every plant sharing that capability.
- The selected route plant supplies visual identity and return context; capability progress and history remain shared.
- Removing one assignment or plant does not delete the capability or its history.
- Rollback remains compatible with older application builds during the expand/cutover window, at the cost of temporarily retaining a deprecated column and synchronization trigger.

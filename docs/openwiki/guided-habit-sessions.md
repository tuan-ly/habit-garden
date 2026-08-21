# Guided Habit Sessions

## Capability Journey Shell

Generic capability routes live under `src/app/(dashboard)/plant/[plantId]/`:

- `/plant/{plantId}` - base plant home or the active plugin journey home.
- `/plant/{plantId}/journey/session` - plugin session screen when exposed.
- `/plant/{plantId}/journey/completion` - plugin completion screen when exposed.
- `/plant/{plantId}/journey/plan` - plugin plan screen when exposed.

`src/capabilities/core/` owns the serializable catalog, server journey drivers, client focus actions, journey renderers and optional screen registry. Reading-specific pages and UI live in `src/capabilities/reading/` plus the existing `src/components/reading/` feature components. Legacy `/reading` paths are compatibility redirects only.

`ReadingJourneySnapshot` carries the requested owned `PlantWithType` after resolving its row in `plant_capability_assignments`. Reading Home and its child routes must show that route plant's name, type and canonical `PlantImage`; never choose a second visual identity from `growth_states.plant_stage` or a generic asset. Several plants may select the same Reading type through separate instances, but the requested persisted plant remains the visual and return-route identity.

## Domain And Persistence

Reusable types live in `src/types/habits.ts`; deterministic progression and timer calculations live in `src/lib/habit-growth.ts`. Reading is configuration, not a hard-coded domain branch: pages, 30 minutes, 5→30 target, seven-day review, 80% threshold and five-page increment.

Migration `20260728121000_reading_habit_vertical_slice.sql` owns `habits`, `goal_plans`, `habit_sessions`, `daily_progress`, `growth_states`, RLS and `complete_habit_session_atomic(...)`. Migration `20260814145405_shared_capability_assignments.sql` introduced canonical assignments; `20260814234237_isolate_capability_instances_per_plant.sql` made every assigned instance independent. Migration `20260819134213_capability_plugin_platform.sql` adds manifest version/config/archive metadata plus atomic attach/manage RPCs. Migration `20260821052602_enforce_single_running_session_per_user.sql` adds the user-scoped running-session invariant. See [ADR 005](../adr/005-capability-plugin-platform.md) and [ADR 006](../adr/006-user-scoped-running-session.md).

## Mutation Flow

`assigned route plant -> isolated Reading instance -> habit-sessions server action -> atomic completion RPC -> instance session/progress/growth -> plant capability-log projection + idempotent plant activity -> local reconcile or route navigation`

Timer state is persisted as accumulated seconds plus the last resume timestamp. Do not replace it with localStorage or a client-only countdown. Completion remains the guided-session transaction boundary. The completed `habit_session` is the canonical log event for its per-plant capability instance; the source-plant care side effect uses the session id as its idempotency key.

Capability assignment is explicit and additive: `attachCapabilityToPlant(...)` validates the manifest and explicit intent, then calls `create_plant_capability_instance(...)`. The invoker RPC authenticates ownership, serializes on a plant-scoped advisory lock, creates the instance and assignment atomically, and returns the existing same-type instance on a repeated attach. Reading's `ensureReadingJourney(userId, plantId)` may initialize plan/growth records only after the requested owned plant resolves to its active Reading instance; it must never create a plant.

Pause/resume/remove use `manage_plant_capability_instance(...)`. Pause keeps the assignment; remove frees the slot, clears the legacy anchor and sets `archived_at` without deleting sessions, progress, plan or growth history. Open sessions must be completed before lifecycle management.

Starting a session stores the route plant in `habit_sessions.source_plant_id`. Because each `habit_id` belongs to one assignment, target, daily progress and the open-session lifecycle remain isolated per plant. A partial unique index on `user_id` allows only one `running` timer across all capability instances; paused and awaiting-completion sessions may coexist. Start/resume conflicts return the canonical active session so clients can route to it without auto-pausing another plant.

`getCapabilityLogProjection(userId, plantId)` resolves the plant's assignment and maps completed sessions for its unique `habit_id` into the journal/activity read shape. Each assigned plant therefore shows its own capability-instance log and reflections. Only unassigned plants fall back to their legacy plant-local activity stream.

## Progression Contract

Evaluate only when `next_review_on` is due. Count distinct days in the completed review window whose value met that day's target. Advance one configured increment only when the threshold is met; otherwise hold. Cap at the plan end target and append every evaluation to `growth_states.history`.

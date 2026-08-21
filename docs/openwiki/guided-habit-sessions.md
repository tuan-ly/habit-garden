# Guided Habit Sessions

## Reading Slice

The first guided slice lives under `src/app/(dashboard)/plant/[plantId]/`:

- `/plant/{plantId}` - plant home; Reading Home replaces the base capability state only for the active attached plant.
- `/plant/{plantId}/reading/session` - persistent timer and ambient audio.
- `/plant/{plantId}/reading/completion` - page validation and persisted outcome.
- `/plant/{plantId}/reading/growth-plan` - milestones, rule, dates and review history.

UI components live in `src/components/reading/`. The existing sanctuary exposes an entry link; it does not replace the garden's plant-care flow.

`ReadingJourneySnapshot` carries the requested owned `PlantWithType` after resolving its row in `plant_capability_assignments`. Reading Home and its child routes must show that route plant's name, type and canonical `PlantImage`; never choose a second visual identity from `growth_states.plant_stage` or a generic asset. Several plants may resolve the same Reading capability, but the requested persisted plant remains the visual and return-route identity.

## Domain And Persistence

Reusable types live in `src/types/habits.ts`; deterministic progression and timer calculations live in `src/lib/habit-growth.ts`. Reading is configuration, not a hard-coded domain branch: pages, 30 minutes, 5→30 target, seven-day review, 80% threshold and five-page increment.

Migration `20260728121000_reading_habit_vertical_slice.sql` owns `habits`, `goal_plans`, `habit_sessions`, `daily_progress`, `growth_states`, RLS and `complete_habit_session_atomic(...)`. Migration `20260729155039_attach_habits_to_plants.sql` introduced the legacy one-to-one plant link. Migration `20260814145405_shared_capability_assignments.sql` expands that relationship into owned many-to-one assignments, backfills them, adds session route context and retains the old column only as a temporary compatibility anchor. See [ADR 003](../adr/003-shared-capability-assignments.md).

## Mutation Flow

`assigned route plant -> shared reading capability -> habit-sessions server action -> owned row / atomic completion RPC -> canonical capability session/progress/growth -> shared log projection + idempotent source-plant activity -> local reconcile or route navigation`

Timer state is persisted as accumulated seconds plus the last resume timestamp. Do not replace it with localStorage or a client-only countdown. Completion remains the guided-session transaction boundary. The completed `habit_session` is the canonical log event shared by every assigned plant; the source-plant care side effect uses the session id as its idempotency key.

Reading assignment is explicit and additive: `attachReadingCapabilityToPlant(plantId)` validates ownership and the plant's single-capability slot, creates the first Reading capability when needed, then inserts an assignment to the existing active Reading capability without removing assignments from other plants. Repeating the operation is idempotent. `ensureReadingJourney(userId, plantId)` may initialize plan/growth records only after the requested owned plant resolves to an active Reading assignment; it must never create a plant.

Starting a session stores the route plant in `habit_sessions.source_plant_id`. Active-session resume prefers that plant only while it remains assigned to the capability, otherwise it chooses an assigned plant deterministically. This field is navigation context, not a filter for sessions, daily progress or Growth Plan. Because the open-session constraint is keyed by `habit_id`, plants sharing Reading also share the same running or paused session.

`getCapabilityLogProjection(userId, plantId)` resolves the plant's assignment and maps completed sessions for its `habit_id` into the journal/activity read shape. Every plant assigned to that capability therefore shows the same completed-session log and reflections. Only unassigned plants fall back to their legacy plant-local activity stream.

## Progression Contract

Evaluate only when `next_review_on` is due. Count distinct days in the completed review window whose value met that day's target. Advance one configured increment only when the threshold is met; otherwise hold. Cap at the plan end target and append every evaluation to `growth_states.history`.

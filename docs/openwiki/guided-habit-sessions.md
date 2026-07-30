# Guided Habit Sessions

## Reading Slice

The first guided slice lives under `src/app/(dashboard)/reading/`:

- `/reading` - Home Garden and today progress.
- `/reading/session` - persistent timer and ambient audio.
- `/reading/completion` - page validation and persisted outcome.
- `/reading/growth-plan` - milestones, rule, dates and review history.

UI components live in `src/components/reading/`. The existing sanctuary exposes an entry link; it does not replace the garden's plant-care flow.

## Domain And Persistence

Reusable types live in `src/types/habits.ts`; deterministic progression and timer calculations live in `src/lib/habit-growth.ts`. Reading is configuration, not a hard-coded domain branch: pages, 30 minutes, 5→30 target, seven-day review, 80% threshold and five-page increment.

Migration `20260728121000_reading_habit_vertical_slice.sql` owns `habits`, `goal_plans`, `habit_sessions`, `daily_progress`, `growth_states`, RLS and `complete_habit_session_atomic(...)`. Migration `20260729155039_attach_habits_to_plants.sql` links each habit to one owned real plant and backfills existing reading journeys.

## Mutation Flow

`real plant capability -> reading client -> habit-sessions server action -> owned row / atomic completion RPC -> canonical session/progress/growth -> idempotent real-plant activity -> local reconcile or route navigation`

Timer state is persisted as accumulated seconds plus the last resume timestamp. Do not replace it with localStorage or a client-only countdown. Completion remains the guided-session transaction boundary; the linked plant activity uses the session id as its idempotency key.

Reading attachment is explicit: `attachReadingCapabilityToPlant(plantId)` validates ownership, creates the first Reading habit or moves the existing habit by updating only `plant_id`, then revalidates Garden and Reading. Moving preserves all records keyed by `habit_id`. `ensureReadingJourney()` may initialize plan/growth records for an attached habit, but it must never create a plant.

## Progression Contract

Evaluate only when `next_review_on` is due. Count distinct days in the completed review window whose value met that day's target. Advance one configured increment only when the threshold is met; otherwise hold. Cap at the plan end target and append every evaluation to `growth_states.history`.

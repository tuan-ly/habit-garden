# Reading Habit Vertical Slice

## Outcome

The reading slice turns one daily checklist into a persistent guided journey:

1. `/reading` — Home Garden shows the reading plant, today progress, current target, session entry and Growth Plan.
2. `/reading/session` — a 30-minute timer can start, pause, resume and finish; elapsed state and ambient preference survive refresh or leaving the route.
3. `/reading/completion` — validates and records whole pages, then shows target comparison, reward, plant growth, streak and next navigation.
4. `/reading/growth-plan` — shows the 5→30 pages/day trajectory, previous/current/next milestones, dates, rule and review history.

The existing `/garden` sanctuary links to the slice without replacing legacy plant care.

## Persistent Model

Migration `20260728121000_reading_habit_vertical_slice.sql` adds reusable `habits`, `goal_plans`, `habit_sessions`, `daily_progress` and `growth_states` tables. Units support pages, minutes, repetitions, sessions or another named numeric unit.

Migration `20260728123500_grant_guided_habit_table_access.sql` supplies explicit authenticated table privileges for projects where Supabase automatic table exposure is disabled; RLS still scopes every row to its owner.

`complete_habit_session_atomic(...)` owns the completion boundary: it records the result, updates daily progress and streaks, awards deterministic growth points, evaluates any due review period and appends progression history in one transaction.

## Deterministic Growth Rule

- Reading starts at 5 pages/day and caps at 30.
- A review occurs only after a configured 7-day period.
- Meeting the target on at least 80% of review days advances exactly 5 pages.
- Missing the threshold holds the current target for the next period; it never adds guilt, regression or surprise increases.
- Every review records its dates, score, successful days, old/new targets, action and reason.

The reusable TypeScript rule and its tests live in `src/lib/habit-growth.ts` and `src/lib/__tests__/habit-growth.test.ts`.

## Verification

Run:

```text
npm run db:migrations:check
npm run test:run
npm run lint
npx.cmd tsc --noEmit
npm run build
npx.cmd supabase db reset --local --no-seed
npx.cmd playwright test e2e/reading-vertical-slice.spec.ts --project=chromium
```

The authenticated Playwright test requires `E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD`.

Verified on 2026-07-28:

- 335 Vitest tests passed across 25 files.
- Every changed TypeScript/TSX file passed ESLint.
- `tsc --noEmit`, production build, the 58-file migration ledger check and a full local migration replay passed.
- The authenticated Chromium E2E and a manual desktop/mobile journey passed, including pause/reload/resume and persisted 7/5-page completion.
- Full-repository ESLint still reports 60 legacy errors outside this slice; they are recorded in `current-state.md` rather than expanded into an unrelated refactor.

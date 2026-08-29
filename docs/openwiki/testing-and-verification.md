# Testing And Verification

## Commands

- `npm run lint` - ESLint.
- `npm run test:run` - Vitest single pass.
- `npm test` - Vitest watch mode.
- `npm run e2e` - Playwright e2e.
- `npm run build` - production Next.js build.
- `npm run storybook` - Storybook dev server.
- `npm run build:mobile` - Next build plus Capacitor sync.

On Windows PowerShell, use `npx.cmd` instead of `npx` for one-off Node tooling.

## Unit Tests

Unit tests live under `src/lib/__tests__/`. Existing coverage focuses on domain logic such as XP, watering, goals, subscription limits, and progression.

Add unit tests when changing pure helpers or server-action-adjacent calculations:

- XP and coin formulas
- goal period math
- plant lifecycle/status transitions
- grid positioning/collision rules
- subscription gating

## E2E Tests

Playwright tests live in `e2e/`. They cover flows such as watering, plant lifecycle, onboarding, garden navigation, and adding plants.

Run targeted specs when changing user flows; run the full suite before broad UI/behavior changes when practical.

`e2e/reading-vertical-slice.spec.ts` covers the authenticated reading journey, including pause persistence across reload, ambient toggle, completion and Growth Plan navigation. It requires explicit E2E credentials.

Guided-session unit and contract coverage lives in:

- `src/lib/__tests__/habit-growth.test.ts`
- `src/lib/__tests__/habit-persistence-contract.test.ts`
- `src/components/reading/__tests__/reading-vertical-slice.test.tsx`
- `src/components/reading/__tests__/reading-session-conflict.test.tsx`

`scripts/sql/verify-single-running-session.sql` transactionally proves that PostgreSQL rejects a second `running` session for the same user without retaining probe data.

## Storybook

Stories live beside component areas such as `src/components/garden/__stories__/`, `src/components/plants/__stories__/`, `src/components/gamification/__stories__/`, and `src/components/ui/__stories__/`.

Use Storybook for visual component changes that are hard to validate through unit tests alone.

## Verification Rule Of Thumb

- Pure helper change: focused Vitest.
- Server action/domain mutation: Vitest if possible plus manual flow or Playwright when user-visible.
- Garden rendering/interaction change: browser smoke test and screenshot when practical.
- Schema change: migration review, type update, and action-level verification.

For daily notifications, also run the migration ledger check and execute `scripts/sql/verify-daily-habit-notifications.sql` against local Postgres. The probe rolls back its fixtures after checking goal suppression, simple-habit completion, idempotency, target resolution and the cross-midnight due window. Use `npx.cmd cap update`, `npx.cmd cap ls` and platform doctor output to verify native plugin registration without requiring exported web assets.

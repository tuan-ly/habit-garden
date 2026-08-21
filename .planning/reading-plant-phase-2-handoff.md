# Reading Plant Integration — Capability Attachment Handoff

> Historical R2 handoff. Its direct one-to-one attachment and move semantics were superseded on 2026-08-14 by [ADR 003](../docs/adr/003-shared-capability-assignments.md). Preserve the verification record below as release history; use ADR 003 and `current-state.md` for current implementation truth.

**Date:** 2026-07-30
**Status:** Complete, migrated, committed and preview-deployed from `develop`

## Outcome

The Virtual Plant integration was replaced. Reading is now a guided capability attached to a normal persisted plant through `habits.plant_id`.

## Delivered

- Garden and `PlantsProvider` are back to `PlantWithType[]`.
- Plant/decor placement has one persisted occupancy source.
- Existing guided habits are backfilled to real grass plants without overlapping current plant/decor rows.
- New Reading journeys create a normal plant before creating the capability.
- `getPlants()` attaches optional `guided_habit` metadata.
- The real plant detail sheet links to `/reading`.
- Reading completion logs idempotent progress activity against the real plant.
- Dashboard banner reads active sessions without bootstrapping Reading on every protected route.
- ADR 002 records the architecture decision.

## Verification

- `npx.cmd tsc --noEmit` — pass.
- Focused Vitest — 14 files, 87 tests passed.
- Focused ESLint — pass.
- `npm run db:migrations:check` — 59 unique migrations.
- `npm run build` — pass.
- Linked Supabase migration `20260729155039` — applied through the Management API.
- Remote `habits.plant_id` — UUID, non-null, backfilled with zero ownership mismatches.
- Remote ownership FK, one-capability-per-plant unique constraint and INSERT/UPDATE RLS policies — verified.
- Authenticated REST queries for `habits` and `plants` — pass.
- Explicit attach/move control preserves Reading history by updating only `habit.plant_id`.
- Reading capability badge and focus-panel CTA — authenticated Chromium E2E pass.
- Full Vitest suite — 29 files, 344 tests passed.
- Local Supabase replay — blocked because Docker Desktop daemon was not running.
- Commit `0fd1339` — pushed to `origin/develop`.
- Vercel commit status — deployment completed successfully.
- Post-push release verification — 59 unique migrations, typecheck, 344 tests and production build passed.
- Authenticated preview smoke — not repeated because the browser connector was unavailable; the authenticated Chromium Reading E2E had passed before release.

## Next Smallest Step

Commit only the reviewed R2 release-closure documentation; exclude generated Playwright reports and test-result artifacts.

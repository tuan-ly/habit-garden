# Reading Plant Integration — Capability Attachment Handoff

**Date:** 2026-07-30
**Status:** Complete and migrated on linked Supabase

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

## Next Smallest Step

Review the complete R2 diff and commit the Capability Attachment slice.

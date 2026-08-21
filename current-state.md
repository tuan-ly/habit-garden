# Current State

- Date: 2026-08-14
- Milestone: Retention Core — Guided Habit Sessions
- Active task: Deploy and verify shared many-to-one Capability Assignments
- Status: implementation complete and verified locally; linked deployment pending
- Vertical slice: each owned plant selects at most one capability through `plant_capability_assignments`; many plants may resolve the same Reading capability and display its shared session log/progression under their own `/plant/{plantId}` route identity
- Non-goals: multiple capabilities on one plant; Exercise UI; per-plant copies or partitions of capability history; removing the deprecated rollout anchor in the expand migration
- Completed: expand migration and ownership RLS; lossless legacy assignment/session-origin backfill; additive idempotent attach behavior; assignment-based Garden and Reading reads; shared capability-log projection for journal/history/milestones; `source_plant_id` route/resume context; ADR 003, OpenWiki and business-rule reconciliation
- Verification: clean PostgreSQL 17 replay and schema-catalog/advisor checks pass; migration ledger has 61 unique versions; the linked migration ledger confirms `20260814145405` is pending remotely; focused lint and typecheck pass; 34 Vitest files / 363 tests pass; production build passes with only plant-scoped Reading routes; the Reading E2E is discovered in five Playwright projects
- Constraints: `plant_id` is unique in assignments while `habit_id` is not; owner identity must match across plant, assignment and capability; capability sessions/progress stay keyed by `habit_id`; `source_plant_id` must never partition the shared log
- Risks: deploy migration `20260814145405` before the new app build; the expand/contract window temporarily retains nullable `habits.plant_id` and a compatibility trigger; authenticated E2E has not run against the linked schema
- Blockers: none
- Next smallest step: apply migration `20260814145405_shared_capability_assignments.sql` to the linked Supabase project and verify assignment, owner-RLS and backfill invariants before deploying the app build

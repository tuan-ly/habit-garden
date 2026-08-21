# Database And Migrations

## Dashboard Performance Read Models

Migration `20260713061331_dashboard_performance_read_models_and_activity_rpc.sql` is additive and introduces:

- `get_dashboard_bootstrap()` for dashboard shell hydration
- `get_garden_snapshot()` for plants, goals, period logs, and placed decorations
- `record_activity_atomic(...)` plus `mutation_receipts` idempotency
- composite indexes for goal, mood, and activity hot paths

Keep these contracts backward-compatible. Previous application artifacts may ignore the new table/functions during rollback; do not remove legacy columns in the same release.

## Sources

- Handwritten TypeScript domain/database types: `src/types/database.ts`.
- Supabase migrations: `supabase/migrations/`.
- Server-side data access: `src/lib/actions/` and `src/lib/supabase/server.ts`.

Treat migrations as the source of schema history. Treat `src/types/database.ts` as the app-facing type contract that must stay aligned with the live schema.

Migration `20260814051729_acknowledge_plant_deaths.sql` adds nullable `plants.death_acknowledged_at`, backfills deaths that existed before the workflow, and indexes each user's pending losses by death time. Existing plant UPDATE RLS remains sufficient because the acknowledgement server action still scopes the write to the authenticated owner and unacknowledged `dead` row.

## RLS

All user-owned tables should have RLS policies that constrain reads/writes by `auth.uid()`. Server actions should still perform ownership checks before writes; RLS is the database backstop, not a reason to skip app-level authorization.

## Migration Workflow

When adding or changing schema:

1. Add a timestamped SQL migration under `supabase/migrations/`.
2. Add or update RLS policies in the same migration when needed.
3. Update `src/types/database.ts` if app code depends on the new fields.
4. Update relevant actions with explicit column lists.
5. Add focused tests or manual verification notes for risky domain logic.

## Migration Ledger

Habit Garden uses a project-scoped migration ledger. Local SQL files remain in `supabase/migrations`; remote applied versions remain in `supabase_migrations.schema_migrations`. The GitHub workflow `.github/workflows/supabase-migration-ledger.yml` records both the remote ledger and a push dry-run in the job summary, rejects edits to existing migration files, and only applies migrations through a manually approved production job.

Project targeting comes from repository secrets rather than a developer-global link. See `docs/SUPABASE-MIGRATION-LEDGER.md` for setup and the one-time legacy baseline procedure.

The first linked audit on 2026-07-16 found 18 local-only and 51 remote-only ledger rows, with legacy 8/14-digit timestamp histories and duplicate local versions. A failed dry-run was treated as a deployment gate, not permission to run `migration repair` blindly.

The reconciliation fetched all 51 authoritative SQL entries from the remote history table, archived the 18 former local files outside the execution path, and reintroduced only three verified pending changes after the remote baseline. All 54 migrations replayed successfully on local Postgres before the three pending versions were applied remotely. The final remote ledger is aligned 54/54 and a linked dry-run reports no pending migration. No remote history row was repaired or deleted.

The production schema no longer contains the legacy `energy_logs` table even though an old ledger entry created it. Dashboard read models therefore depend on `mood_logs` only. Treat the current schema plus the reconciled ledger as authoritative; do not reintroduce a runtime dependency merely because an earlier migration once created it.

Database advisors currently report WARN-only legacy backlog: broad `SECURITY DEFINER` execute grants, disabled leaked-password protection, and a duplicate `goal_logs` index. Review RPC call sites before revoking grants; this is a separate security-hardening change from migration reconciliation.

## Existing Migration Themes

The migration history includes:

- grid positioning
- goal frequency
- subscription infrastructure and Paddle provider fields
- identity system
- gentle growth / Habien 2.0
- moisture decay fixes
- crafting and decoration system
- atomic economy/crafting/purchase/pickup functions
- RLS/auth.uid performance optimization and foreign key indexes
- reusable guided habits, persisted sessions, daily progress and deterministic growth state

## Guided Habit Session Schema

Migration `20260728121000_reading_habit_vertical_slice.sql` is additive. It creates `habits`, `goal_plans`, `habit_sessions`, `daily_progress` and `growth_states`, with direct user ownership, authenticated RLS policies and explicit indexes. A partial unique index permits only one running, paused or awaiting-completion session per habit.

Migration `20260821052602_enforce_single_running_session_per_user.sql` adds a second partial unique index permitting only one `running` session per `user_id` across all capability instances. Before creating the index, it deterministically keeps the newest running row and normalizes older duplicates to `paused` or `awaiting_completion` using persisted elapsed-time fields. Per-habit open-session ownership remains unchanged.

Migration `20260728123500_grant_guided_habit_table_access.sql` explicitly grants authenticated CRUD privileges because newer Supabase projects may disable automatic exposure of new public tables. RLS remains the ownership boundary.

`complete_habit_session_atomic(...)` is `SECURITY INVOKER`, clears `search_path`, locks the owned session/growth rows and completes all outcome writes in one transaction. Keep its review behavior aligned with `src/lib/habit-growth.ts` and its contract tests.

## Capability Assignment Rollout

Migration `20260814145405_shared_capability_assignments.sql` implements the **expand** phase from [ADR 003](../adr/003-shared-capability-assignments.md):

- `plant_capability_assignments` uses `plant_id` as its primary key, so one plant has at most one capability. Migration `20260814234237_isolate_capability_instances_per_plant.sql` also makes `habit_id` unique, so target and log ownership cannot cross plants.
- `habits.type` is the reusable capability definition key; `habits_user_type_unique` is removed so one user can own a separate Reading instance for each assigned plant.
- Composite `(plant_id, user_id)` and `(habit_id, user_id)` foreign keys prevent cross-owner assignments. The table has authenticated owner RLS, explicit CRUD grants and a habit-side lookup index.
- Every legacy non-null `habits.plant_id` is backfilled into an assignment, with a migration assertion that rejects silent attachment loss.
- Nullable `habit_sessions.source_plant_id` is backfilled from the legacy link and uses an owner-scoped foreign key with `ON DELETE SET NULL`. It preserves route origin only; capability events and progress remain keyed by `habit_id`.

The **compatibility** phase temporarily keeps `habits.plant_id` nullable as a deprecated anchor. Its plant foreign key uses set-null. An invoker trigger mirrors an older build's new habit insert into an assignment, but rejects moving one existing instance to a second plant because that would merge independent targets and logs. New application code treats `plant_capability_assignments` as canonical for reads.

The **contract** phase is deliberately deferred. Only after older deployed builds are retired and linked-environment invariants are verified should a separate migration remove the compatibility trigger, legacy plant-link constraint/index artifacts and `habits.plant_id`. Do not fold those destructive removals into the expand migration.

Completed guided-session logs are capability-owned. `src/lib/capability-log-projection.ts` resolves a plant's assignment, reads completed `habit_sessions` by `habit_id`, and projects them into existing activity/journal read shapes. This is a read projection, not duplicated plant event rows; `source_plant_id` must never become a log partition key.

The expand migration has passed a clean PostgreSQL 17 replay, schema-catalog/advisor checks and the 61-version migration-ledger validation. Linked-environment application and deployment verification remain a separate release step.

## Capability Plugin Lifecycle

Migration `20260819134213_capability_plugin_platform.sql` adds `habits.config`, `definition_version` and `archived_at`, plus owner/active lookup indexes. Definitions stay in source-controlled manifests; the database stores only per-instance config and version.

`create_plant_capability_instance(...)` and `manage_plant_capability_instance(...)` are `SECURITY INVOKER` functions with an empty `search_path`, explicit execute grants and plant-scoped `pg_advisory_xact_lock(...)`. RLS and owner-scoped foreign keys remain the privilege boundary. Attach creates the instance and assignment in one transaction; pause/resume update state; remove deletes only the assignment and archives the instance.

Do not replace the invoker functions with `SECURITY DEFINER` or broad service-role application calls. Do not hard-delete archived capability rows during normal management: `habit_sessions`, `daily_progress`, `goal_plans` and `growth_states` are retained by `habit_id`.

Local verification covers concurrent attach, cross-user rejection, pause/resume/remove and preserved session history. Migrations `20260814234237`, `20260819134213` and `20260821052602` were applied to linked project `jkhkfsfjnilbfqfatonb` on 2026-08-21. The remote catalog confirms the capability metadata, unique assignment `habit_id`, invoker RPCs, no anonymous execute privilege and the user-scoped partial unique index. The duplicate-running query returns zero rows, the ledger contains all three versions and linked ERROR-level database advisors report no issues. Authenticated application smoke remains the release gate.

## Decoration Footprint Calibration

`config/game-asset-catalog.json` is the repository-side desired catalog for manifest-backed decoration footprints. Asset Studio saves remain code-first: changing a canonical footprint stages the catalog, manifests and a timestamped SQL migration together; it never writes to a linked Supabase project.

The generated migration takes an advisory transaction lock, updates `decoration_types.grid_size`, then reconciles every matching `placed_decorations` row. Expansion searches the nearest non-negative collision-free anchor and aborts the transaction when no location is found; shrinkage keeps the same anchor. The existing placement trigger continues copying the canonical catalog footprint for future rows.

## Performance Notes

Prefer explicit selects and batched reads. `getPlants()` is an example of composing a garden-specific read model with plants, plant types, active goals, and current-period logs to avoid client-side request fan-out.

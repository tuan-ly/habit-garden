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

## Decoration Footprint Calibration

`config/game-asset-catalog.json` is the repository-side desired catalog for manifest-backed decoration footprints. Asset Studio saves remain code-first: changing a canonical footprint stages the catalog, manifests and a timestamped SQL migration together; it never writes to a linked Supabase project.

The generated migration takes an advisory transaction lock, updates `decoration_types.grid_size`, then reconciles every matching `placed_decorations` row. Expansion searches the nearest non-negative collision-free anchor and aborts the transaction when no location is found; shrinkage keeps the same anchor. The existing placement trigger continues copying the canonical catalog footprint for future rows.

## Performance Notes

Prefer explicit selects and batched reads. `getPlants()` is an example of composing a garden-specific read model with plants, plant types, active goals, and current-period logs to avoid client-side request fan-out.

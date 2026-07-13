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

## Performance Notes

Prefer explicit selects and batched reads. `getPlants()` is an example of composing a garden-specific read model with plants, plant types, active goals, and current-period logs to avoid client-side request fan-out.

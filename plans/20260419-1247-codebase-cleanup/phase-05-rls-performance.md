# Phase 05 — RLS Performance

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-04-19 |
| Priority | 🟠 HIGH |
| Status | ⬜ TODO |
| Depends on | Phase 01 (subscriptions table), Phase 02 (security functions settled) |
| Est. effort | 3–4h |

## Context Links
- Rules: `d:\Code\habit-garden\.claude\rules\database.md` — RLS rules, migration format
- Supabase project: `jkhkfsfjnilbfqfatonb`
- Migrations dir: `d:\Code\habit-garden\supabase\migrations\`

---

## Key Insights
1. **30+ RLS policies call `auth.uid()` per row** — `auth.uid()` is a stable function within a query but Postgres re-evaluates it for each row in non-optimized policies. Wrapping with `(SELECT auth.uid())` forces a single evaluation, a well-known Supabase performance pattern.
2. **5 unindexed foreign keys** — FK constraints without matching indexes cause sequential scans on JOIN/DELETE cascades. Unindexed FKs are a common Supabase advisor finding.
3. **Dropped deprecated functions** — some DB functions may be orphaned (no longer called by any action) but still exist in prod, adding noise and potential future security surface.

---

## Requirements
- All RLS policies that call `auth.uid()` bare must use `(SELECT auth.uid())` instead.
- All FK columns that lack an index must get one.
- Deprecated/orphaned DB functions identified and dropped.
- No behavioral change to existing data access — purely performance.

---

## Architecture

### auth.uid() Wrapping
Current (slow): `USING (user_id = auth.uid())`
Fixed (fast): `USING (user_id = (SELECT auth.uid()))`

The `SELECT` subquery is evaluated once per query (not per row). For large tables (plants, goal_logs, activity_logs, watering_logs) this is significant.

### FK Index Pattern
For each table with an FK column, create: `CREATE INDEX IF NOT EXISTS idx_<table>_<column> ON <table>(<column>);`

### Orphan Function Detection
Query `pg_proc` for SECURITY DEFINER functions. Cross-reference against all `.rpc()` calls in TypeScript actions. Functions not called anywhere are candidates for dropping.

---

## Related Code Files / DB Objects
```
supabase/migrations/                ← create new migration for all policy rewrites
src/lib/actions/                    ← grep all .rpc() calls to find active functions
Database tables (likely affected):
  plants, plant_types, goals, goal_logs, profiles
  watering_logs, mood_logs, achievements, activity_logs
  reflections, identities, subscriptions, coin_transactions
  adjustment_history, decorations, user_decorations
```

---

## Implementation Steps

### Step 1 — Audit current RLS policies
- Run `execute_sql`: query `pg_policies` for all policies.
- Identify every policy where `qual` or `with_check` contains `auth.uid()` without `SELECT` wrapper.
- Build a list: `(table_name, policy_name, policy_type)`.

### Step 2 — Audit FK indexes
- Run `execute_sql`: use the standard query to find FK columns without indexes:
  ```sql
  SELECT conrelid::regclass AS table, a.attname AS column
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
  WHERE c.contype = 'f'
    AND NOT EXISTS (
      SELECT 1 FROM pg_index i WHERE i.indrelid = c.conrelid
        AND a.attnum = ANY(i.indkey)
    );
  ```
- List all missing indexes.

### Step 3 — Audit orphan DB functions
- Run `execute_sql`: list all functions in `public` schema.
- Grep `src/lib/actions/` for `.rpc('function_name'` patterns.
- Cross-reference: functions in DB but not in any `.rpc()` call are orphan candidates.
- Verify against direct SQL calls and migration files before marking as orphan.

### Step 4 — Create RLS rewrite migration
- Migration name: `20260419_rls_auth_uid_optimize.sql`
- For each policy identified in Step 1:
  ```sql
  DROP POLICY "policy_name" ON table_name;
  CREATE POLICY "policy_name" ON table_name
    [FOR SELECT/INSERT/UPDATE/DELETE]
    [TO authenticated]
    USING (user_id = (SELECT auth.uid()))
    [WITH CHECK (user_id = (SELECT auth.uid()))];
  ```
- Apply via `apply_migration`.
- **Do not change** any policy's logic — only wrap `auth.uid()`.

### Step 5 — Create FK index migration
- Migration name: `20260419_add_fk_indexes.sql`
- For each missing index from Step 2:
  ```sql
  CREATE INDEX IF NOT EXISTS idx_<table>_<column> ON <table>(<column>);
  ```
- Apply via `apply_migration`.

### Step 6 — Drop orphan functions (optional, with care)
- For each confirmed orphan function:
  - Double-check no migration or edge function calls it.
  - Drop in migration: `DROP FUNCTION IF EXISTS function_name(params);`
- Be conservative — only drop if 100% certain unused.
- Migration name: `20260419_drop_orphan_functions.sql`.

### Step 7 — Verify performance
- Run `get_advisors(type: 'performance')` — expect fewer findings.
- Run `get_advisors(type: 'security')` — confirm no regressions.
- Check RLS policies on a high-traffic table (e.g., `plants`) with `EXPLAIN ANALYZE` if possible.

---

## Todo List
- [ ] Query pg_policies — list all bare auth.uid() usages
- [ ] Query pg_constraint / pg_index — list unindexed FKs
- [ ] Grep all .rpc() calls in src/lib/actions/
- [ ] Create RLS policy rewrite migration
- [ ] Create FK index migration
- [ ] Identify orphan functions (with conservative verification)
- [ ] Create orphan function drop migration (only confirmed orphans)
- [ ] Run performance advisor — verify improvement
- [ ] Run security advisor — verify no regression

---

## Success Criteria
- `get_advisors(type: 'performance')` shows no "auth.uid() not wrapped" findings.
- All 5 (or more) unindexed FKs now have indexes.
- No orphan SECURITY DEFINER functions (or documented reason to keep).
- Existing RLS behavior unchanged — no new data access violations.

---

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Policy rewrite changes logic accidentally | Low | High | Only change auth.uid() → (SELECT auth.uid()), nothing else |
| FK index on large table causes migration timeout | Low | Medium | Use `CREATE INDEX CONCURRENTLY` if table is large |
| Dropping a function used by an edge function | Medium | Medium | Check edge functions in Supabase dashboard |
| RLS rewrite breaks a complex policy | Low | Medium | Test each table's access after migration |

---

## Security Considerations
- This phase is purely performance — no security policy logic changes.
- Verify after migration that user A cannot access user B's data (spot-check).
- `CREATE INDEX CONCURRENTLY` doesn't lock table — safe for prod.

---

## Next Steps
→ Phase 06: Component Performance
→ Phase 08: DRY + Cleanup (select(*) violations tie into this work)

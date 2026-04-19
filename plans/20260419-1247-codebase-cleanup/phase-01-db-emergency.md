# Phase 01 — DB Emergency

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-04-19 |
| Priority | 🔴 CRITICAL |
| Status | ⬜ TODO |
| Blocks | Phase 04 (economy atomicity) |
| Est. effort | 2–4h |

## Context Links
- Rules: `d:\Code\habit-garden\.claude\rules\database.md`
- Migrations dir: `d:\Code\habit-garden\supabase\migrations\`
- Economy functions migration: `supabase/migrations/20260417_atomic_economy_functions.sql`
- Missing migration: `supabase/migrations/20260311_crafting_decoration_system.sql`

---

## Key Insights
1. `20260417_atomic_economy_functions.sql` IS applied to prod. It defines `award_coins`, `spend_coins`, `atomic_inventory_*` — all of which reference tables created by `20260311_crafting_decoration_system.sql`.
2. `20260311_crafting_decoration_system.sql` was NOT applied. This means Phase 7 (economy/crafting) throws at runtime because the referenced tables don't exist.
3. `subscriptions` table is referenced in code (`src/lib/actions/subscription.ts`, Paddle webhook handler) but is missing from both the live DB and the migrations folder entirely.
4. Any prod user touching crafting/shop/economy hits a hard 500 error right now.

---

## Requirements
- All tables referenced by `20260417_atomic_economy_functions.sql` must exist in prod.
- `subscriptions` table must exist in prod with correct schema and RLS.
- Migration history must be consistent (no gaps).
- No destructive changes to existing prod data.

---

## Architecture
**Problem**: Migration applied out of order — dependency applied before the table-creation migration.
**Fix approach**: Apply the missing migration carefully. If `20260311` creates tables that partially exist (from manual hotfixes), use `CREATE TABLE IF NOT EXISTS` guards. Verify with `information_schema.tables` before and after.

For `subscriptions`: reverse-engineer schema from code usage (Paddle webhook handler + `subscription.ts` action). Create a new migration with proper columns, RLS, and indexes.

---

## Related Code Files
```
supabase/migrations/20260311_crafting_decoration_system.sql   ← missing/not applied
supabase/migrations/20260417_atomic_economy_functions.sql     ← applied, references above
src/lib/actions/subscription.ts                               ← reveals subscriptions schema
src/lib/actions/crafting.ts                                   ← references crafting tables
src/lib/actions/decorations.ts                                ← references decoration tables
src/lib/actions/inventory.ts                                  ← references inventory tables
src/types/                                                    ← check for subscription types
```

---

## Implementation Steps

### Step 1 — Audit live DB state
- Run `execute_sql`: list all tables in `public` schema (`information_schema.tables WHERE table_schema = 'public'`).
- Run `execute_sql`: list all applied migrations (`supabase_migrations.schema_migrations`).
- Compare against migration files in `supabase/migrations/`.
- Document which tables exist, which are missing.

### Step 2 — Inspect `20260311_crafting_decoration_system.sql`
- Read the file. Identify all `CREATE TABLE` statements.
- Cross-check each table name against the live DB audit from Step 1.
- For tables that already exist (possible manual hotfix), check column parity.

### Step 3 — Apply `20260311` migration safely
- If tables don't exist: apply via `apply_migration` (use content of existing file, name `20260311_crafting_decoration_system`).
- If tables partially exist: create a fixup migration `20260419_crafting_tables_fixup.sql` with `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE ADD COLUMN IF NOT EXISTS` for any missing columns.
- Verify with `execute_sql` after apply.

### Step 4 — Reconstruct `subscriptions` table
- Read `src/lib/actions/subscription.ts` fully — map all `.select(...)`, `.insert(...)`, `.update(...)` calls to extract column names and types.
- Read Paddle webhook handler (likely `src/lib/actions/paddle.ts`) for additional columns.
- Check `src/types/` for any `Subscription` interface.
- Draft migration `20260419_create_subscriptions_table.sql` with:
  - Columns: at minimum `id`, `user_id` (FK → auth.users), `paddle_subscription_id`, `status`, `tier` (enum: free/pro/premium), `current_period_end`, `created_at`, `updated_at`.
  - RLS: enable RLS, policy: users can SELECT their own row; no direct INSERT/UPDATE from client.
  - Index on `user_id`.
- Apply via `apply_migration`.

### Step 5 — Verify economy functions
- Run `execute_sql`: call `\df award_coins` or check `pg_proc` for function existence.
- Test each function signature matches existing tables.
- If any function references a still-missing table, fix before closing phase.

### Step 6 — Run security advisor
- `get_advisors(type: 'security')` — confirm no new RLS gaps introduced.

---

## Todo List
- [ ] Audit live DB tables vs migration files
- [ ] Read `20260311_crafting_decoration_system.sql`
- [ ] Apply missing migration (or fixup)
- [ ] Reverse-engineer `subscriptions` schema from code
- [ ] Create and apply `subscriptions` migration with RLS
- [ ] Verify `award_coins`, `spend_coins`, `atomic_inventory_*` functions work end-to-end
- [ ] Check `supabase_migrations.schema_migrations` is now consistent
- [ ] Run security advisor

---

## Success Criteria
- `information_schema.tables` shows all crafting/decoration/inventory/subscriptions tables.
- Economy functions (`award_coins`, `spend_coins`) execute without error.
- `supabase_migrations.schema_migrations` has no gaps.
- No 500 errors on crafting/shop pages.

---

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tables partially exist from manual hotfix | Medium | High | Use `IF NOT EXISTS` guards |
| Column mismatch between migration and live | Medium | High | Audit columns before apply |
| `subscriptions` schema incomplete | Medium | Medium | Cross-ref all code usages |
| Apply breaks existing economy function | Low | Critical | Test in branch DB first |

---

## Security Considerations
- New `subscriptions` table must have RLS enabled immediately — do not ship without it.
- `subscriptions.tier` drives feature access — INSERT/UPDATE must be server-only (service role or trusted functions only).
- Do NOT allow users to self-promote their subscription tier.

---

## Next Steps
→ Phase 02: Security Hardening (IDOR, XP race, fire-and-forget)
→ Phase 04: Economy Atomicity (depends on this phase completing)

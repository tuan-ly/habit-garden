# Phase 04 — Economy Atomicity

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-04-19 |
| Priority | 🟠 HIGH |
| Status | ⬜ TODO |
| Depends on | Phase 01 (crafting tables must exist in prod) |
| Est. effort | 4–6h |

## Context Links
- Rules: `d:\Code\habit-garden\.claude\rules\actions.md` — auth, ownership patterns
- Rules: `d:\Code\habit-garden\.claude\rules\database.md` — migration format, use apply_migration for DDL
- Economy actions: `src/lib/actions/crafting.ts`, `src/lib/actions/decorations.ts`, `src/lib/actions/inventory.ts`
- Existing atomic functions: `supabase/migrations/20260417_atomic_economy_functions.sql`

---

## Key Insights
1. **`crafting.ts:craftDecoration`** — multi-step operation: deduct materials → award decoration. Done as sequential Supabase calls. If the second step fails, materials are already deducted with no rollback. User loses items.
2. **`decorations.ts:purchaseDecoration`** — deducts coins then adds decoration to inventory. No transaction. Coin deducted without decoration awarded on failure.
3. **`decorations.ts:pickUpDecoration`** — removes decoration from world then adds to inventory (or vice versa). Non-atomic: decoration can vanish from world without appearing in inventory.
4. **`inventory.ts:upsertInventoryMaterial`** — uses upsert pattern but swallows errors silently. If upsert fails, caller doesn't know; inventory count is wrong.
5. `20260417_atomic_economy_functions.sql` already established the pattern for atomic DB functions. Phase 04 extends this pattern to crafting/decoration operations.

---

## Requirements
- `craftDecoration`: must be all-or-nothing — materials deducted iff decoration awarded.
- `purchaseDecoration`: coins deducted iff decoration added to inventory.
- `pickUpDecoration`: decoration removed from world iff added to inventory.
- `upsertInventoryMaterial`: errors must surface to caller.
- All operations must be idempotent-safe (no double-spend on retry).

---

## Architecture

### Pattern: DB Function per Operation
Each multi-step economy operation becomes a single SECURITY DEFINER Postgres function that runs inside an implicit transaction. Called from the action via Supabase `.rpc()`.

```
Action layer (TypeScript):
  craftDecoration(userId, recipeId) → .rpc('craft_decoration', {...})

DB function `craft_decoration(user_id, recipe_id)`:
  BEGIN (implicit)
    1. Lock user's inventory row (SELECT FOR UPDATE)
    2. Check material quantities sufficient
    3. Deduct materials (UPDATE inventory)
    4. Insert decoration into user_decorations
    5. Log coin/activity event
  COMMIT / ROLLBACK on any error
```

This is the same pattern already used by `award_coins` / `spend_coins`.

### Error Surfacing Pattern
DB functions should `RAISE EXCEPTION` on business logic failures (insufficient materials, item not found). Supabase surfaces these as error objects — check `if (error) throw error` in the action.

---

## Related Code Files
```
src/lib/actions/crafting.ts              ← craftDecoration: non-atomic multi-step
src/lib/actions/decorations.ts           ← purchaseDecoration, pickUpDecoration: non-atomic
src/lib/actions/inventory.ts             ← upsertInventoryMaterial: swallowed errors
supabase/migrations/20260417_atomic_economy_functions.sql  ← reference pattern
supabase/migrations/20260311_crafting_decoration_system.sql ← table schemas needed
```

---

## Implementation Steps

### Step 1 — Read and map current implementation
- Read `src/lib/actions/crafting.ts` — document each DB call in `craftDecoration`, its order, and failure modes.
- Read `src/lib/actions/decorations.ts` — same for `purchaseDecoration` and `pickUpDecoration`.
- Read `src/lib/actions/inventory.ts` — identify `upsertInventoryMaterial`, note error handling.
- Read `20260417_atomic_economy_functions.sql` for function template/style reference.

### Step 2 — Create `craft_decoration` DB function
- Write migration `20260419_atomic_crafting_function.sql`.
- Function: `craft_decoration(p_user_id uuid, p_recipe_id uuid) RETURNS jsonb`.
- Logic: verify recipe exists → verify user has required materials → deduct materials → insert into `user_decorations` → return success payload.
- Use `SELECT FOR UPDATE` on inventory rows to prevent concurrent double-spend.
- `RAISE EXCEPTION` for: recipe not found, insufficient materials.
- Add `SET search_path = ''` (from Phase 02 lesson).
- Apply via `apply_migration`.

### Step 3 — Create `purchase_decoration` DB function
- Write migration `20260419_atomic_purchase_function.sql`.
- Function: `purchase_decoration(p_user_id uuid, p_decoration_id uuid) RETURNS jsonb`.
- Logic: call `spend_coins()` (already atomic) → insert decoration into `user_decorations`.
- If `spend_coins` raises, whole function rolls back.
- Apply via `apply_migration`.

### Step 4 — Create `pickup_decoration` DB function
- Write migration `20260419_atomic_pickup_function.sql`.
- Function: `pickup_decoration(p_user_id uuid, p_placed_decoration_id uuid) RETURNS jsonb`.
- Logic: verify ownership → DELETE from placed_decorations → INSERT into user_decorations inventory.
- Both ops in same transaction.
- Apply via `apply_migration`.

### Step 5 — Update TypeScript actions to use RPC
- In `crafting.ts:craftDecoration`: replace multi-step calls with single `.rpc('craft_decoration', {...})`. Check error, return typed result.
- In `decorations.ts:purchaseDecoration`: replace with `.rpc('purchase_decoration', {...})`.
- In `decorations.ts:pickUpDecoration`: replace with `.rpc('pickup_decoration', {...})`.
- In `inventory.ts:upsertInventoryMaterial`: add proper error check and re-throw / return error to caller.

### Step 6 — Remove now-dead code
- After RPC migration, delete the sequential multi-step logic blocks.
- Keep any pre-validation that's useful as a fast client-side check (e.g., "do you have enough materials?" before calling DB).

### Step 7 — Test
- Test craftDecoration with insufficient materials → materials unchanged.
- Test purchaseDecoration with insufficient coins → coins unchanged.
- Test pickUpDecoration → decoration appears in inventory, not in world.
- Test network failure mid-RPC → no partial state.

---

## Todo List
- [ ] Read crafting.ts, decorations.ts, inventory.ts — map all multi-step operations
- [ ] Create `craft_decoration` DB function + migration
- [ ] Create `purchase_decoration` DB function + migration
- [ ] Create `pickup_decoration` DB function + migration
- [ ] Update crafting.ts to use craft_decoration RPC
- [ ] Update decorations.ts to use purchase_decoration + pickup_decoration RPCs
- [ ] Fix upsertInventoryMaterial error surfacing
- [ ] Remove dead sequential logic
- [ ] Test all three operations for atomicity

---

## Success Criteria
- Crafting failure (e.g., simulated DB error mid-function) leaves materials unchanged.
- Purchase failure leaves coins unchanged.
- Pickup failure leaves both world and inventory unchanged.
- No swallowed errors in inventory operations.
- All three DB functions have `SET search_path = ''`.

---

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Recipe/inventory schema unclear from Phase 01 | Medium | High | Complete Phase 01 first |
| DB function raises break existing optimistic UI | Medium | Medium | Update action error handling before UI |
| Concurrent crafting still possible via race | Low | Low | `SELECT FOR UPDATE` handles this |
| Function signature mismatch | Low | Medium | Match existing `award_coins` signature style |

---

## Security Considerations
- All three DB functions must be `SECURITY DEFINER` with `SET search_path = ''`.
- Verify user ownership inside the DB function — don't trust `p_user_id` from client; use `auth.uid()` inside the function instead.
- `spend_coins` should already validate balance — don't duplicate that logic, just call it.

---

## Next Steps
→ Phase 05: RLS Performance (complements DB function work)
→ Phase 08: DRY + Cleanup (remove duplicated collision logic in decorations.ts)

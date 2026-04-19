# Phase 02 — Security Hardening

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-04-19 |
| Priority | 🔴 CRITICAL |
| Status | ⬜ TODO |
| Depends on | Phase 01 (subscriptions table needed for some RLS checks) |
| Est. effort | 4–6h |

## Context Links
- Rules: `d:\Code\habit-garden\.claude\rules\actions.md` — auth, ownership, query rules
- Rules: `d:\Code\habit-garden\.claude\rules\database.md` — RLS, migration format
- IDOR target: `src/lib/actions/adaptive.ts`
- Race target: `src/lib/actions/activity.ts`
- Fire-and-forget targets: `src/lib/actions/activity.ts:232,242,338`
- DB functions: `supabase/migrations/` (SECURITY DEFINER functions)

---

## Key Insights
1. **IDOR** — `adaptive.ts:getAdjustmentHistory` queries `adjustment_history` table with a `goalId` param but never checks `goal.user_id === auth.uid()`. Any authenticated user can read any other user's adjustment history by guessing a UUID.
2. **TOCTOU race** — `activity.ts:updateUserXp` does `SELECT xp → compute new xp → UPDATE xp`. Under concurrent requests (multiple tabs, background sync), two reads can see the same stale value and both write, causing XP to be awarded only once instead of twice. Fix: atomic SQL increment (`UPDATE profiles SET xp = xp + $delta`).
3. **Fire-and-forget** — Lines 232, 242, 338 in `activity.ts` call async functions without `await` and without `.catch()`. Errors are silently swallowed — DB writes (activity logs, XP, etc.) can fail invisibly.
4. **SECURITY DEFINER without search_path** — 8 DB functions lack `SET search_path = ''`. An attacker who can create objects in a schema on the search_path can hijack function execution (schema injection).
5. **coin_transactions INSERT RLS** — current policy allows authenticated users to INSERT into `coin_transactions` directly. Users can fabricate coin balance entries. Should be restricted to service role / trusted DB functions only.
6. **HaveIBeenPwned disabled** — Auth config has `hibp_enabled: false`. Weak/breached passwords allowed on signup.

---

## Requirements
- `getAdjustmentHistory` must verify caller owns the requested goal.
- XP updates must be atomic (no read-modify-write).
- All async writes in `activity.ts` must be awaited and errors surfaced.
- All SECURITY DEFINER functions must have `SET search_path = ''`.
- `coin_transactions` INSERT policy must be restricted to service/function-only.
- HaveIBeenPwned must be enabled in Supabase Auth config.

---

## Architecture

### IDOR Fix Pattern (matches `actions.md` ownership pattern)
```
getAdjustmentHistory(goalId):
  1. getAuthUser() → user
  2. SELECT id, user_id FROM goals WHERE id = goalId → goal
  3. if goal.user_id !== user.id → return { error: 'Not found' }
  4. proceed with adjustment_history query
```

### XP Race Fix
Replace read-modify-write pattern in `updateUserXp` with a single atomic SQL statement:
`UPDATE profiles SET xp = xp + $delta, level = ... WHERE user_id = $uid`
Or use a DB function (`increment_user_xp(user_id, delta)`) that handles level-up logic atomically.

### Fire-and-Forget Fix
Add `await` before each bare call. If a call is intentionally non-blocking (e.g., analytics), add `.catch(console.error)` at minimum, or move to a proper background queue.

### SECURITY DEFINER search_path Fix
For each affected function, add `SET search_path = ''` to the function definition. Requires a migration that uses `CREATE OR REPLACE FUNCTION`.

### coin_transactions INSERT Policy Fix
Drop the permissive INSERT policy. Add a restrictive policy: `WITH CHECK (false)` for authenticated role (block all direct inserts). Inserts go through SECURITY DEFINER functions only.

---

## Related Code Files
```
src/lib/actions/adaptive.ts              ← IDOR: getAdjustmentHistory (no ownership check)
src/lib/actions/activity.ts:232,242,338  ← fire-and-forget async writes
src/lib/actions/activity.ts:updateUserXp ← TOCTOU race
supabase/migrations/                     ← find all SECURITY DEFINER functions
src/lib/auth-cached.ts                   ← getAuthUser() helper (use this, not direct auth call)
```

---

## Implementation Steps

### Step 1 — Fix IDOR in `adaptive.ts:getAdjustmentHistory`
- Read `src/lib/actions/adaptive.ts`.
- Locate `getAdjustmentHistory` function.
- Add ownership check following the pattern in `actions.md`: fetch goal's `user_id`, compare to `getAuthUser()`.
- Return `{ error: 'Not found' }` on mismatch (not 'Unauthorized' — don't leak existence).

### Step 2 — Fix XP race in `activity.ts:updateUserXp`
- Read `src/lib/actions/activity.ts`, focus on `updateUserXp`.
- Identify the read-modify-write sequence.
- Replace with atomic Supabase RPC call or raw SQL: `UPDATE profiles SET xp = xp + $delta WHERE user_id = $uid RETURNING xp, level`.
- Handle level-up check on the returned value (not a pre-read value).
- If level-up logic is complex, create a DB function `increment_user_xp(uid uuid, delta int)` and call it via `.rpc()`.
- Apply migration for the DB function if needed.

### Step 3 — Fix fire-and-forget at lines 232, 242, 338
- Read `src/lib/actions/activity.ts` around lines 220–350.
- For each bare async call:
  - Add `await` if the result affects correctness.
  - If truly background (logging/analytics), add `.catch(err => console.error('[activity]', err))`.
  - Never silently swallow errors for DB writes.

### Step 4 — Fix SECURITY DEFINER functions
- Run `execute_sql`: query `pg_proc` for all functions with `prosecdef = true`.
- For each, check if `proconfig` includes `search_path`.
- Create migration `20260419_security_definer_search_path.sql`.
- For each affected function: `CREATE OR REPLACE FUNCTION ... SET search_path = '' ...` (preserve existing body, just add the config).

### Step 5 — Fix `coin_transactions` INSERT policy
- Run `execute_sql`: inspect current RLS policies on `coin_transactions`.
- Create migration `20260419_coin_transactions_rls_fix.sql`:
  - Drop the permissive INSERT policy for `authenticated` role.
  - Ensure only service role (or a SECURITY DEFINER function) can INSERT.
  - Keep SELECT policy so users can read their own transactions.

### Step 6 — Enable HaveIBeenPwned
- Go to Supabase Dashboard → Auth → Password Protection.
- Enable HaveIBeenPwned check.
- (No code change — dashboard config only. Document in DEVLOG.)

### Step 7 — Verify
- Run `get_advisors(type: 'security')`.
- Manually test `getAdjustmentHistory` with a mismatched user ID.
- Check `activity.ts` for any remaining bare async calls (grep pattern: `^(?!.*await).*\.(rpc|from|insert|update)\(`).

---

## Todo List
- [ ] Fix IDOR: add ownership check to `getAdjustmentHistory`
- [ ] Fix XP race: replace read-modify-write with atomic increment
- [ ] Fix fire-and-forget at activity.ts:232,242,338
- [ ] Audit all SECURITY DEFINER functions in pg_proc
- [ ] Create migration to add `SET search_path = ''` to all affected functions
- [ ] Fix `coin_transactions` INSERT RLS policy
- [ ] Enable HaveIBeenPwned in Supabase Auth dashboard
- [ ] Run security advisor, verify clean

---

## Success Criteria
- `getAdjustmentHistory` returns 404 for cross-user access.
- Concurrent XP awards produce correct cumulative XP (no lost updates).
- No bare async calls in `activity.ts`.
- All SECURITY DEFINER functions have `search_path = ''` in `pg_proc.proconfig`.
- `coin_transactions` has no INSERT policy for `authenticated` role.
- Security advisor shows no new issues.

---

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Atomic XP breaks level-up logic | Medium | Medium | Test level-up boundary in staging |
| SECURITY DEFINER migration breaks a function | Low | High | Test each function after migration |
| Removing INSERT policy breaks webhook | Low | High | Verify Paddle webhook uses service key |
| XP DB function needed but complex | Medium | Low | Can fall back to Supabase RPC pattern |

---

## Security Considerations
- IDOR fix must use `{ error: 'Not found' }` — not 'Forbidden' — to avoid leaking resource existence.
- `coin_transactions` is the highest-value target: treat it as financial data.
- HaveIBeenPwned prevents users from using credentials leaked in other breaches.
- `SET search_path = ''` is a defense-in-depth measure; unlikely to be exploited but easy to fix.

---

## Next Steps
→ Phase 03: Status System Correctness (plant state bugs)
→ Phase 05: RLS Performance (broader RLS optimization)

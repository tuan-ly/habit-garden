# Code Review Report

**Date:** 2026-03-03
**Focus:** Targeted security and performance audit (4 specific findings)

---

## Scope

- Files reviewed: `src/lib/actions/adaptive.ts`, `src/lib/actions/goals.ts`, `src/lib/actions/weeds.ts`, `src/lib/actions/profile.ts`
- Review focus: Pre-identified issues — auth bypass, N+1 queries, hidden side-effect queries

---

## Overall Assessment

Three confirmed issues, one partially mitigated. One CRITICAL security bug (missing auth/ownership guard before a write), two HIGH-severity N+1 query patterns, and one MEDIUM-severity hidden query in a read path. No false positives in the provided list.

---

## CRITICAL Issues

### 1. Missing Auth/Ownership Check in `autoApplyAdjustment`

**File:** `src/lib/actions/adaptive.ts:337-395`
**Confirmed:** YES

The function fetches a goal by raw `goalId` with `select('*')` and no join to `plants.user_id`. There is no `auth.getUser()` call and no ownership verification before inserting a `goal_adjustments` row and calling `applyAdjustment`.

```ts
// Line 341-345: unauthenticated goal fetch
const { data: goal } = await supabase
  .from('goals')
  .select('*')
  .eq('id', goalId)
  .single()

// Line 364: inserts adjustment for ANY goal if mode === 'auto'
await supabase.from('goal_adjustments').insert({ goal_id: goalId, ... })
```

Compare with `getAdaptiveAnalysis` (line 31-44) which correctly does:
```ts
const { data: { user } } = await supabase.auth.getUser()
// ...
if (!adjustment || (goal.plant as any).user_id !== user.id) return null
```

And `applyAdjustment` (line 166-184) which also correctly checks ownership.

**Attack surface:** Any authenticated user who knows another user's `goalId` (UUID) can trigger auto-application of goal adjustments against that user's goal. The downstream `applyAdjustment` call *does* check ownership, which limits the actual write blast — but the `goal_adjustments` INSERT at line 364 happens **before** that check and is unguarded. A malicious caller can pollute `goal_adjustments` for any goal.

**Severity:** CRITICAL — unauthorized write to another user's `goal_adjustments` table.

**Simplest fix:** Add auth + ownership check at the top of `autoApplyAdjustment`, mirroring the pattern in `activateRecoveryWeek` (lines 400-420):

```ts
export async function autoApplyAdjustment(goalId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, applied: false, error: 'Not authenticated' }

  const { data: goal } = await supabase
    .from('goals')
    .select('*, plant:plants!inner(user_id)')
    .eq('id', goalId)
    .single()

  if (!goal || (goal.plant as any).user_id !== user.id) {
    return { success: true, applied: false }
  }
  // ... rest of function (remove duplicate fetch of goal)
}
```

---

## High Priority Findings

### 2. N+1 Queries in `getUserGoals`

**File:** `src/lib/actions/goals.ts:644-672`
**Confirmed:** YES

```ts
for (const goal of goals) {
  const stats = await getGoalForPlant(goal.plant_id)  // line 665
  if (stats) goalsWithStats.push(stats)
}
```

`getGoalForPlant` fires **4 sequential Supabase round-trips** per goal:
1. `auth.getUser()` (line 553)
2. `goals` fetch (line 556)
3. `goal_logs` for current period (line 576)
4. `goal_logs` for legacy week (line 600)
5. `goal_logs` count for personal records (line 619)

For a user with N goals, this is `1 + 5N` total queries. A user with 10 goals = **51 queries**. A user with 20 goals = **101 queries**.

**Performance impact:** High latency on the goals page, risk of Supabase rate-limit or timeout for power users.

**Simplest fix (minimal code change):** Batch the three `goal_logs` queries into a single query per goal by fetching all logs at once and filtering in memory:

```ts
// Inside getGoalForPlant, replace 3 goal_logs queries with:
const { data: allLogs } = await supabase
  .from('goal_logs')
  .select('value, is_personal_record, logged_at')
  .eq('goal_id', goal.id)

// Then filter in memory for period, week, and PR count
```

**Better fix (eliminates N+1 entirely):** Rewrite `getUserGoals` to fetch all goals + all their logs in 2 queries, then compute stats in memory. The initial bulk fetch at line 651 already joins plants correctly — extend it to also fetch logs.

### 3. N+1 Updates in `growWeeds`

**File:** `src/lib/actions/weeds.ts:233-254`
**Confirmed:** YES

```ts
for (const plant of plants) {
  // ...
  await supabase
    .from('plants')
    .update({ weed_count: newWeedCount, ... })
    .eq('id', plant.id)   // line 244-251: one UPDATE per plant
}
```

One `UPDATE` per plant. If 50 plants are affected, 50 round-trips fire serially.

**Performance impact:** This is a background/cron job, not a user-facing path, so end-user latency is not directly affected. However, it holds a Supabase connection open for the full loop duration and counts against API rate limits.

**Severity:** HIGH (infra cost/reliability), not user-facing.

**Simplest fix:** Use Supabase's `.in()` for a single bulk update where all affected plants get the same weed increment. Since each plant may have a different `weed_count`, a single `UPDATE … SET weed_count = weed_count + 1` with `.in('id', affectedIds)` handles it:

```ts
const affectedIds = plants
  .filter(p => {
    const lastWatered = p.last_watered_at
      ? new Date(p.last_watered_at).toISOString().split('T')[0]
      : null
    return lastWatered !== yesterday
  })
  .map(p => p.id)

if (affectedIds.length > 0) {
  await supabase.rpc('increment_weed_count', { plant_ids: affectedIds })
  // or use a raw SQL approach via supabase.rpc
}
```

Alternatively, a Postgres function that does `UPDATE plants SET weed_count = LEAST(weed_count + 1, MAX_WEEDS) WHERE id = ANY($1)` in one shot.

---

## Medium Priority Findings

### 4. Hidden Side-Effect Query in `getProfile` (Read Path)

**File:** `src/lib/actions/profile.ts:75-116`
**Confirmed:** YES

`getProfile()` appears to be a pure read function but conditionally fires 2 additional queries and a write when `profile.xp === 0`:

```ts
if (data && data.xp === 0) {          // line 93 - triggers on every new user
  const { data: waterings } = await supabase
    .from('watering_logs')             // line 94: extra SELECT
    .select('xp_earned')...

  if (totalXp > 0) {
    await supabase
      .from('profiles')                // line 103: extra UPDATE (write!)
      .update({ xp: totalXp, ... })
  }
}
```

**Issues:**
1. A function named `getProfile` silently writes to the DB — violates principle of least surprise and breaks idempotency of read calls.
2. Every call to `getProfile` for a zero-XP user adds 2 extra queries. If called multiple times per page render (e.g., from multiple components), this compounds.
3. The condition `xp === 0` is a fragile heuristic — a legitimate user with 0 XP would trigger the sync on every call until they earn XP.

**Severity:** MEDIUM — not a security issue, but a correctness/performance concern. The write side-effect in a getter will surprise future developers and could cause race conditions if `getProfile` is called concurrently.

**Simplest fix:** Extract the sync logic into a separate `syncProfileXp()` function and call it explicitly once during user onboarding/session initialization, not inside every `getProfile` call.

---

## Positive Observations

- `getAdaptiveAnalysis`, `applyAdjustment`, and `activateRecoveryWeek` all correctly perform auth + ownership checks using the `plants!inner(user_id)` join pattern. The pattern is established and consistent — `autoApplyAdjustment` is a clear oversight, not a systemic architecture problem.
- `getUserGoals` does fetch goals in a single batch query first (line 651-658) with proper ownership filter — the N+1 is in the stats enrichment loop, not the ownership layer.
- RLS on Supabase tables likely provides a backstop for the CRITICAL issue, but application-level ownership checks should not be omitted — RLS policies can be misconfigured or disabled.

---

## Recommended Actions

1. **[CRITICAL — Fix now]** Add `auth.getUser()` + `plants!inner(user_id)` ownership check at the top of `autoApplyAdjustment` before any DB write. (`adaptive.ts:337`)

2. **[HIGH — Fix before launch]** Consolidate the 3 `goal_logs` queries inside `getGoalForPlant` into a single query, filter in memory. This alone reduces query count from `5N` to `2N`. (`goals.ts:576-623`)

3. **[HIGH — Fix before launch]** Rewrite `growWeeds` loop to use a single bulk `UPDATE` via Postgres function or `rpc`. (`weeds.ts:244-251`)

4. **[MEDIUM — Next sprint]** Move XP sync out of `getProfile` into an explicit `syncProfileXp()` utility called once at session start. (`profile.ts:93-113`)

---

## Metrics

- Files reviewed: 4
- Lines analyzed: ~420
- Critical issues: 1
- High issues: 2
- Medium issues: 1
- Low issues: 0
- False positives in the provided list: 0

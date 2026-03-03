# Phase 1: Critical Fixes (Security + N+1 Queries)

> **Priority**: CRITICAL
> **Estimated effort**: 2-3 hours
> **Files**: `src/lib/actions/adaptive.ts`, `src/lib/actions/goals.ts`, `src/lib/actions/weeds.ts`

## Context

- `adaptive.ts:337` - `autoApplyAdjustment()` fetches a goal by ID without verifying the authenticated user owns it. Any user can modify another user's goal.
- `goals.ts:664-669` - `getUserGoals()` loops calling `getGoalForPlant()` which internally runs 3 queries (goal, period logs, weekly logs) plus an auth check. For 5 goals = 16+ queries.
- `weeds.ts:235-251` - `growWeeds()` loops updating plants one-by-one. For 10 plants = 10 UPDATE queries.

## Key Insights

1. The security fix is trivial: add `auth.getUser()` + ownership check via plant join (same pattern used elsewhere).
2. `getUserGoals()` N+1 can be solved by inlining the stats computation: fetch all goals in one query, then fetch all goal_logs for those goal IDs in one query, compute stats in JS.
3. `growWeeds()` can batch updates: filter eligible plants in JS, then do a single `.in('id', eligibleIds)` update. The grace-period logic (skip if watered yesterday) requires the filter to happen in JS after the initial fetch, but the UPDATE can still be batched.

## Requirements

- [ ] `autoApplyAdjustment()` must verify goal ownership before applying changes
- [ ] `getUserGoals()` must fetch all data in at most 3 queries regardless of goal count
- [ ] `growWeeds()` must update all eligible plants in a single UPDATE query

---

## Implementation Steps

### 1. Security: Auth check in `autoApplyAdjustment()`

**File**: `src/lib/actions/adaptive.ts`, line 337

Current code fetches goal by ID with no user filter:
```ts
const { data: goal } = await supabase
  .from('goals')
  .select('*')
  .eq('id', goalId)
  .single()
```

Fix: Add auth check and join through plants to verify ownership:
```ts
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { success: false, applied: false, error: 'Not authenticated' }

const { data: goal } = await supabase
  .from('goals')
  .select('*, plant:plants!inner(user_id)')
  .eq('id', goalId)
  .eq('plant.user_id', user.id)
  .single()
```

Also audit `getAdaptiveAnalysis()` in same file - it is called from `autoApplyAdjustment` and may also lack auth. Verify it filters by user.

### 2. N+1: Rewrite `getUserGoals()` with batch queries

**File**: `src/lib/actions/goals.ts`, lines 640-672

Replace loop-based approach with:

```ts
export async function getUserGoals(): Promise<GoalWithStats[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // Query 1: All goals with plant info
  const { data: goals, error } = await supabase
    .from('goals')
    .select(`*, plant:plants!inner(user_id, name, plant_type:plant_types(icon))`)
    .eq('plant.user_id', user.id)

  if (error || !goals || goals.length === 0) return []

  // Query 2: All goal_logs for these goals (current periods)
  const goalIds = goals.map(g => g.id)
  const { data: allLogs } = await supabase
    .from('goal_logs')
    .select('goal_id, value, is_personal_record, logged_at')
    .in('goal_id', goalIds)

  // Compute stats in JS by grouping logs per goal
  const logsByGoal = new Map<string, typeof allLogs>()
  for (const log of (allLogs || [])) {
    const existing = logsByGoal.get(log.goal_id) || []
    existing.push(log)
    logsByGoal.set(log.goal_id, existing)
  }

  // Build GoalWithStats for each goal using in-memory log data
  return goals.map(goal => {
    const logs = logsByGoal.get(goal.id) || []
    // ... compute periodProgress, weeklyProgress from logs
    // (extract computation logic from getGoalForPlant into a pure function)
  })
}
```

Key: Extract the period/week calculation logic from `getGoalForPlant` into a pure function `computeGoalStats(goal, logs)` that both `getUserGoals` and `getGoalForPlant` can use. This avoids duplication.

### 3. N+1: Batch `growWeeds()` UPDATE

**File**: `src/lib/actions/weeds.ts`, lines 233-255

Replace the loop with:
```ts
// Filter eligible plants in JS
const yesterday = /* ... */
const eligiblePlants = plants.filter(plant => {
  const lastWatered = plant.last_watered_at
    ? new Date(plant.last_watered_at).toISOString().split('T')[0]
    : null
  return lastWatered !== yesterday
})

if (eligiblePlants.length === 0) {
  return { success: true, plantsAffected: 0 }
}

// Single batch update - increment weed_count by 1, cap at MAX_WEEDS
// Use RPC or individual .in() update
const eligibleIds = eligiblePlants.map(p => p.id)
await supabase
  .from('plants')
  .update({
    last_weed_added: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  .in('id', eligibleIds)

// Note: weed_count increment needs RPC since .update() can't do +1
// Option A: Create a tiny SQL function  increment_weed_count(plant_ids uuid[], max int)
// Option B: Use raw SQL via supabase.rpc()
```

**Preferred approach**: Create a Supabase RPC function for the atomic increment:
```sql
CREATE OR REPLACE FUNCTION increment_weed_count(plant_ids uuid[], max_weeds int DEFAULT 3)
RETURNS int AS $$
  UPDATE plants
  SET weed_count = LEAST(max_weeds, COALESCE(weed_count, 0) + 1),
      last_weed_added = now(),
      updated_at = now()
  WHERE id = ANY(plant_ids)
  RETURNING 1;
$$ LANGUAGE sql;
```

Then call: `await supabase.rpc('increment_weed_count', { plant_ids: eligibleIds })`

---

## Todo Checklist

- [ ] Add auth + ownership check to `autoApplyAdjustment()`
- [ ] Audit `getAdaptiveAnalysis()` for same auth gap
- [ ] Extract `computeGoalStats(goal, logs)` pure function from `getGoalForPlant`
- [ ] Rewrite `getUserGoals()` using batch query + `computeGoalStats`
- [ ] Verify `getGoalForPlant()` still works (it can use the same pure function)
- [ ] Create `increment_weed_count` RPC migration
- [ ] Rewrite `growWeeds()` to use batch filter + RPC
- [ ] Test: getUserGoals returns same data as before (compare output)
- [ ] Test: growWeeds updates correct plants with grace period logic
- [ ] Test: autoApplyAdjustment rejects unowned goalId

## Success Criteria

- `autoApplyAdjustment('other-users-goal-id')` returns error or empty result
- `getUserGoals()` executes at most 3 DB queries regardless of goal count
- `growWeeds()` executes exactly 2 DB queries (1 SELECT + 1 RPC) regardless of plant count

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `computeGoalStats` JS logic diverges from DB query logic | Medium | High (wrong stats) | Write unit tests comparing old vs new output for sample data |
| `increment_weed_count` RPC migration fails on prod | Low | Medium | Test migration on Supabase branch first |
| `getUserGoals` fetching ALL logs (not period-filtered) returns too much data | Low | Medium | Add date filter: only fetch logs from last 30 days |

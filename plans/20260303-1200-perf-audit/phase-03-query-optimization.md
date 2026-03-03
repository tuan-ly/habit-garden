# Phase 3: Query Optimization

> **Priority**: MEDIUM
> **Estimated effort**: 2 hours
> **Files**: Multiple action files, Supabase migration

## Context

- `select('*')` used in 8 action files. Fetches all columns when only a few are needed. Wastes bandwidth and exposes unnecessary data.
- Missing DB indexes on `goals.user_id` (indirect via plants join) and `activity_logs(user_id, created_at)` composite index. These are the most-queried patterns.
- `plant-detail-sheet.tsx` loads 4 data sets via sequential useEffects. Two of them (overview tab) already use Promise.all - good. The other two (journal, stats tabs) are lazy-loaded on tab switch, which is correct behavior for a modal. No change needed for the sheet itself.

## Key Insights

1. `select('*')` is mostly a code smell, not a critical perf issue for small tables. But it's easy to fix and prevents accidental data leaks. Prioritize the high-frequency queries.
2. Missing indexes matter most for `activity_logs` which grows unbounded. The `goals` table is small per-user but the join through `plants` benefits from an index.
3. The browser Supabase client (`src/lib/supabase/client.ts`) creates a new instance per call via `createBrowserClient()`. Per `@supabase/ssr` docs, this is fine - `createBrowserClient` returns a singleton internally. No action needed.

---

## Implementation Steps

### 1. Add missing database indexes

**Migration**: `supabase/migrations/YYYYMMDD_add_performance_indexes.sql`

```sql
-- Index for activity_logs queries (getUserStats, getActivityHistory)
-- Most queries filter by user_id + date range
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date
  ON activity_logs (user_id, created_at DESC);

-- Index for goal_logs queries (getGoalForPlant, getUserGoals batch)
-- Queried by goal_id + date range
CREATE INDEX IF NOT EXISTS idx_goal_logs_goal_date
  ON goal_logs (goal_id, logged_at DESC);

-- Index for watering_logs queries (getUserStats, getAchievementsData)
CREATE INDEX IF NOT EXISTS idx_watering_logs_user
  ON watering_logs (user_id, created_at DESC);

-- goals are queried via plant_id join
CREATE INDEX IF NOT EXISTS idx_goals_plant_id
  ON goals (plant_id);
```

**Note**: Check existing indexes first via `\di` on the Supabase SQL editor to avoid duplicates.

### 2. Replace `select('*')` with explicit columns

High-frequency targets (fix these first):

**`goals.ts`** - `getGoalForPlant()` line 558:
```ts
// Before
.select('*')
// After - only columns used in computeGoalStats
.select('id, plant_id, target_value, duration_weeks, weekly_targets, started_at, goal_mode, frequency, adaptive_mode, status, unit')
```

**`adaptive.ts`** - `autoApplyAdjustment()` line 343:
```ts
// Before
.select('*')
// After
.select('id, adaptive_mode, plant_id')
```

**`activity.ts`** - identify which select('*') calls exist and narrow them.

**`profile.ts`** - `getUserStats()` line 133 uses `select('*', { count: 'exact', head: true })` which is correct for count-only queries (head:true means no rows returned). No change needed for these.

Lower priority (fix opportunistically):
- `journal.ts`, `mood.ts`, `plants.ts`, `subscription.ts` - narrow columns when touching these files for other reasons.

### 3. Parallelize sequential queries in profile actions

Already covered in Phase 2, step 5. Included here for completeness as it's query optimization. See Phase 2 for implementation details on `getUserStats()` and `getAchievementsData()`.

---

## Todo Checklist

- [ ] Check existing indexes via Supabase SQL editor (`SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`)
- [ ] Create migration with performance indexes
- [ ] Apply migration to Supabase branch for testing
- [ ] Replace `select('*')` in `goals.ts` `getGoalForPlant()`
- [ ] Replace `select('*')` in `adaptive.ts` `autoApplyAdjustment()`
- [ ] Replace `select('*')` in `activity.ts` (identify specific functions)
- [ ] Verify all narrowed selects include every column used downstream
- [ ] Run existing tests to catch any missing column errors

## Success Criteria

- All high-frequency queries use explicit column selection
- `EXPLAIN ANALYZE` on `activity_logs` user+date query shows index scan (not seq scan)
- `EXPLAIN ANALYZE` on `goal_logs` goal+date query shows index scan
- No test regressions

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Narrowed select misses a column used downstream | Medium | Medium (runtime error) | TypeScript will catch most; run full app test after changes |
| Index creation locks table on large dataset | Low | Low (tables are small) | Use `CREATE INDEX CONCURRENTLY` if table >100k rows |
| Indexes slow down writes | Very Low | Negligible | These tables have low write frequency relative to reads |

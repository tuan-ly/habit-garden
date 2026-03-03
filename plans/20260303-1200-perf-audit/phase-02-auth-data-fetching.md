# Phase 2: Auth Deduplication + SSR Data Fetching

> **Priority**: HIGH
> **Estimated effort**: 2-3 hours
> **Files**: `src/lib/supabase/server.ts`, `src/lib/context/subscription-context.tsx`, `src/lib/context/mood-context.tsx`, `src/lib/actions/profile.ts`

## Context

- `auth.getUser()` is called 74 times across 11 action files. In a single page load, multiple server actions fire, each independently calling `auth.getUser()`. React.cache() deduplicates within a single request lifecycle.
- `SubscriptionContext` calls `getUserTier()` in useEffect on mount, causing a client-side waterfall. The tier should be fetched server-side in the layout and passed as prop.
- `MoodContext` already accepts `initialMood` prop and guards with `if (initialMood) return`. But if the layout doesn't pass it, it falls back to a client fetch. Need to verify layout passes it.
- `getProfile()` has a hidden sequential path: if `xp === 0`, it fetches all watering_logs to recalculate XP. This is a one-time migration path that blocks every profile load for new users.

## Key Insights

1. `React.cache()` is the standard Next.js pattern for request-scoped dedup. Wrap a `getUser()` helper once, import everywhere. Zero risk.
2. SubscriptionContext already has an `initialTier` prop (line 80). The layout just needs to call `getUserTier()` server-side and pass it down. The useEffect fetch becomes a no-op.
3. The XP sync in `getProfile()` should be a one-time migration, not runtime logic. Move it to a migration script or make it run only once (set a flag).

---

## Implementation Steps

### 1. Create cached auth helper

**New file**: `src/lib/auth-cached.ts`

```ts
import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export const getAuthUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
})
```

Then in each server action, replace:
```ts
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
```
With:
```ts
const user = await getAuthUser()
if (!user) return ...
const supabase = await createClient()
```

**Important**: `createClient()` (Supabase server client) still needs to be called per-action for the DB queries since it reads cookies. Only the `auth.getUser()` call is deduped.

**Rollout strategy**: Start with the 3 heaviest files (goals.ts: 6 calls, plants.ts: 10 calls, identity.ts: 9 calls), then do the rest.

### 2. SSR subscription tier in layout

**File**: `src/app/(dashboard)/layout.tsx` (or wherever SubscriptionProvider is mounted)

Add server-side tier fetch:
```tsx
import { getUserTier } from '@/lib/actions/subscription'

export default async function DashboardLayout({ children }) {
  const tier = await getUserTier()

  return (
    <SubscriptionProvider initialTier={tier}>
      {children}
    </SubscriptionProvider>
  )
}
```

**File**: `src/lib/context/subscription-context.tsx`

The useEffect at line 97-119 already has logic to run. After passing `initialTier`, modify to skip the fetch when initialTier is provided (similar to MoodContext pattern):

```ts
useEffect(() => {
  if (initialTier) {
    setIsLoading(false)
    return // SSR already provided tier
  }
  // ... existing fetch logic as fallback
}, [initialTier])
```

### 3. Verify MoodContext SSR path

**File**: `src/lib/context/mood-context.tsx`

The guard at line 56 (`if (initialMood) return`) is correct. Verify that the dashboard layout actually passes `initialMood`. If it does, no changes needed. If it doesn't, add the server-side fetch to layout (same pattern as subscription).

Check: `grep -r "MoodProvider" src/app/` to find where it's mounted and whether `initialMood` is passed.

### 4. Fix getProfile() XP sync blocking path

**File**: `src/lib/actions/profile.ts`, lines 92-113

The XP auto-sync runs on every `getProfile()` call when `xp === 0`. This is problematic because:
- New users always have xp=0, triggering the watering_logs scan
- It blocks every page load until the scan completes

Fix options (pick one):
- **Option A (recommended)**: Remove the runtime sync entirely. Create a one-time migration that backfills xp for all profiles where xp=0 but watering_logs exist. Then delete lines 92-113.
- **Option B**: Keep it but add a flag. After syncing, set a `xp_synced` flag on the profile so it never runs again.

Option A is cleaner. The XP should already be correct for active users (it gets updated on every watering). This sync was likely a one-time migration that was left as runtime code.

```sql
-- One-time migration
UPDATE profiles p
SET xp = COALESCE((
  SELECT SUM(xp_earned) FROM watering_logs WHERE user_id = p.id
), 0)
WHERE p.xp = 0
AND EXISTS (SELECT 1 FROM watering_logs WHERE user_id = p.id AND xp_earned > 0);
```

### 5. Parallelize profile page queries

**File**: `src/lib/actions/profile.ts`

`getUserStats()` (line 118) runs 3 sequential queries. Wrap in Promise.all:

```ts
const [{ data: plants }, { count: totalWaterings }, { count: achievementsCount }] = await Promise.all([
  supabase.from('plants').select('status, current_streak, longest_streak').eq('user_id', user.id),
  supabase.from('watering_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  supabase.from('user_achievements').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
])
```

`getAchievementsData()` (line 253) runs 4 sequential queries. Same treatment:

```ts
const [{ data: userAchievements }, { data: plants }, { data: profile }, { count: totalWaterings }, { count: morningWaterings }] = await Promise.all([
  supabase.from('user_achievements').select('achievement_id').eq('user_id', user.id),
  supabase.from('plants').select('status, current_streak, longest_streak, total_waterings').eq('user_id', user.id),
  supabase.from('profiles').select('xp').eq('id', user.id).single(),
  supabase.from('watering_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
  supabase.from('watering_logs').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('morning_bonus', true),
])
```

---

## Todo Checklist

- [ ] Create `src/lib/auth-cached.ts` with `getAuthUser()` using React.cache()
- [ ] Replace `auth.getUser()` in goals.ts (6 calls)
- [ ] Replace `auth.getUser()` in plants.ts (10 calls)
- [ ] Replace `auth.getUser()` in identity.ts (9 calls)
- [ ] Replace `auth.getUser()` in remaining 8 action files
- [ ] Pass `initialTier` from dashboard layout to SubscriptionProvider
- [ ] Add SSR skip guard in SubscriptionContext useEffect
- [ ] Verify MoodContext receives `initialMood` from layout; fix if not
- [ ] Remove XP auto-sync from `getProfile()`, create backfill migration
- [ ] Parallelize `getUserStats()` queries with Promise.all
- [ ] Parallelize `getAchievementsData()` queries with Promise.all
- [ ] Smoke test: profile page, dashboard, plant detail all load correctly

## Success Criteria

- `auth.getUser()` called at most once per request (verify via Supabase logs or console)
- No useEffect data fetches on initial dashboard load for subscription/mood
- Profile page queries run in parallel (visible in Supabase query logs - overlapping timestamps)
- `getProfile()` no longer queries watering_logs at runtime

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| React.cache() not deduping across server action boundaries | Low | Medium | Test by adding console.log to getAuthUser, verify single call per request |
| SubscriptionProvider initialTier causes hydration mismatch | Low | Low | Server and client will agree since server provides the value |
| Removing XP sync breaks new user onboarding | Low | Medium | Verify XP is set correctly on first watering via logActivity flow |

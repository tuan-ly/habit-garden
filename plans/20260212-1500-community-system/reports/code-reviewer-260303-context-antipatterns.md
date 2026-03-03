# Code Review Summary

## Scope
- Files reviewed: 6
  - `src/lib/context/subscription-context.tsx`
  - `src/lib/context/mood-context.tsx`
  - `src/lib/context/weeds-context.tsx`
  - `src/components/plants/plant-detail-sheet.tsx`
  - `src/lib/supabase/server.ts`
  - `src/app/(dashboard)/layout.tsx`
- Lines of code analyzed: ~1,000
- Review focus: Targeted anti-pattern audit (4 specific areas)
- Updated plans: none (informational review)

---

## Overall Assessment

The codebase shows **deliberate, thoughtful SSR hydration patterns** in most places. The `useEffect` fetches in contexts are guarded by `initialX` props, and SSR data flows correctly from `layout.tsx` through `DashboardProviders`. The real issues are a logic bug in the subscription isLoading heuristic, missing `contextValue` memoization in WeedsContext, a confirmed stale closure in weed callbacks, and no `React.cache()` on `createClient()`.

---

## Critical Issues

None (no data loss or security risks).

---

## High Priority Findings

### Finding 1 - subscription-context.tsx: isLoading initialization bug
**File:** `src/lib/context/subscription-context.tsx:78`

```typescript
const [isLoading, setIsLoading] = useState(initialTier === 'free')
```

**Problem:** This heuristic is wrong. When the user IS on the free tier (legitimate), `isLoading` starts `true`, triggering an unnecessary `getUserTier()` fetch on mount (line 115) even though the SSR-provided value is already correct. A free-tier user will always double-fetch on every page load.

**Impact:** Every free-tier user gets:
1. An extra `createClient()` call + `auth.getUser()` + DB query on mount
2. A brief flash where `isLoading=true` could show loading skeletons for subscription-gated UI, even though the data is already correct

**Severity: High** - affects the majority of users (free tier is the default).

**Fix:** Pass a boolean `initialTierProvided` prop, or use `undefined` as the sentinel:

```typescript
// In provider:
const [isLoading, setIsLoading] = useState(initialTier === undefined)
// Change prop default from 'free' to undefined

// In useEffect:
useEffect(() => {
  if (initialTier !== undefined) return // SSR provided it
  loadTier()
}, [])
```

---

### Finding 2 - weeds-context.tsx: Stale closure in clearWeed and clearAllWeeds
**File:** `src/lib/context/weeds-context.tsx:43-103`

```typescript
const clearWeed = useCallback(async (plantId: string) => {
  const currentCount = weeds[plantId] || 0  // closes over `weeds` snapshot
  ...
}, [weeds])   // must re-create on every weeds state change

const clearAllWeeds = useCallback(async (plantId: string) => {
  const currentCount = weeds[plantId] || 0  // same issue
  ...
}, [weeds])
```

**Problem:** Both callbacks read `weeds` directly from closure for the "revert" snapshot (`currentCount`). Because `weeds` is in the dep array, the callbacks are recreated on every weed-state change - which is correct for correctness but means any consumer that receives these callbacks as props will re-render on every weed update (including unrelated plants).

A more subtle risk: if two rapid calls happen before React batches the state updates, `currentCount` captured in the second call is stale (pointing to pre-first-call state). The optimistic update uses the functional updater correctly (`prev[plantId] - 1`), but the **revert** value `currentCount` is from the snapshot at callback-creation time.

**Impact:** In practice this is low risk because clearWeed is user-triggered (single click), but architecturally it's a fragile pattern.

**Severity: High** (architectural risk, minor practical risk today).

**Fix:** Read the revert value inside the functional updater using `useRef` or capture it at call time:

```typescript
const clearWeed = useCallback(async (plantId: string) => {
  let revertCount = 0
  setWeeds((prev) => {
    revertCount = prev[plantId] || 0   // capture inside updater = always fresh
    if (revertCount <= 0) return prev
    return { ...prev, [plantId]: revertCount - 1 }
  })
  if (revertCount <= 0) return { success: false }

  const result = await clearWeedAction(plantId)
  if (!result.success) {
    setWeeds((prev) => ({ ...prev, [plantId]: revertCount }))
    toast.error('Failed to clear weed')
    return { success: false }
  }
  toast.success(...)
  return { success: true, xpEarned: result.xpEarned }
}, [])  // empty deps - no stale closure
```

---

## Medium Priority Improvements

### Finding 3 - weeds-context.tsx: contextValue not memoized
**File:** `src/lib/context/weeds-context.tsx:109-121`

```typescript
return (
  <WeedsContext.Provider
    value={{           // new object reference every render
      weeds,
      setPlantWeeds,
      clearWeed,
      clearAllWeeds,
      getTotalWeeds,
    }}
  >
```

**Problem:** The context value object is created inline without `useMemo`. Every render of `WeedsProvider` creates a new object reference, causing all context consumers to re-render even when nothing changed. `SubscriptionProvider` (line 178) and `MoodProvider` (line 126) both use `useMemo` correctly - `WeedsContext` is inconsistent.

**Impact:** Medium - `WeedsProvider` renders when `weeds` changes (which is expected), so the re-renders are likely triggered by genuine state changes. But if a parent re-renders for an unrelated reason (e.g., `GardenSettingsProvider` above), all weed consumers will re-render unnecessarily.

**Severity: Medium**

**Fix:** Wrap the value in `useMemo`:

```typescript
const contextValue = useMemo(() => ({
  weeds,
  setPlantWeeds,
  clearWeed,
  clearAllWeeds,
  getTotalWeeds,
}), [weeds, setPlantWeeds, clearWeed, clearAllWeeds, getTotalWeeds])

return <WeedsContext.Provider value={contextValue}>{children}</WeedsContext.Provider>
```

---

### Finding 4 - server.ts: createClient() not wrapped in React.cache()
**File:** `src/lib/supabase/server.ts:4`

```typescript
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(...)
}
```

**Problem:** `createClient()` is called 74 times across server actions (confirmed via `grep`). Within a single Next.js request, each server action that calls `createClient()` constructs a fresh Supabase client, then each calls `supabase.auth.getUser()` independently. The Supabase JS client does deduplicate the auth token validation internally via a GoTrue client singleton per instance, but creating 74 separate client instances is wasteful.

**What this means in practice:** A single page load triggers `layout.tsx` which calls `createClient()` + `getUser()` directly, then calls `getTodayMood()` which calls `createClient()` + `getUser()` again. That's at minimum 2 separate `auth.getUser()` network calls per layout render.

**Impact:** Extra latency on initial page load proportional to how many parallel server actions run. With `React.cache()`, all calls within one render tree share one instance.

**Severity: Medium** - not a correctness bug but a performance overhead on every SSR render.

**Fix:**

```typescript
import { cache } from 'react'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const createClient = cache(async () => {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
})
```

Note: `React.cache()` scope is per-request, so this is safe for server components.

---

## Low Priority Suggestions

### Finding 5 - plant-detail-sheet.tsx: 4 useEffects for data fetching - appropriate for this case
**File:** `src/components/plants/plant-detail-sheet.tsx:124-185`

**useEffect inventory:**
1. Lines 124-136: Fetch goal + 7-day activity when sheet opens (`[plant?.id, open]`)
2. Lines 138-145: Reset tab state when sheet closes (`[open]`)
3. Lines 147-157: Lazy-load Journal tab data (`[activeTab, plant?.id, journalData, journalLoading]`)
4. Lines 159-169: Lazy-load Stats tab data (`[activeTab, plant?.id, fullActivityHistory, statsLoading]`)
5. Lines 171-185: Load goal stats + adaptive analysis when `showGoalStats=true` (`[goal?.id, showGoalStats]`)

Total: **5 useEffects** (not 4 - the "reset" effect at 138-145 is a state cleanup, not a data fetch; 4 are data-fetching effects).

**Assessment: These are appropriate.** This is a client-rendered Sheet/modal component where:
- The data is per-plant and changes based on user interaction (opening the sheet, switching tabs)
- SSR-fetching all plants' detail data upfront would be wasteful
- Lazy loading by tab is a valid performance optimization

The pattern is deliberate and sensible for a modal. No action needed.

**Minor UX note:** Effect #1 (lines 124-136) does not handle errors - if `getGoalForPlant` or `getPlantActivityHistory` throws, `isLoadingGoal` will remain `true` forever. Low risk since server actions typically don't throw but worth a try/catch + `finally`.

---

## Positive Observations

1. **SSR hydration pattern is well-designed.** `layout.tsx` correctly fetches `initialMood`, `initialTier`, and `initialWeeds` server-side and passes them to providers. The `useEffect` fetches in `MoodProvider` (line 56: `if (initialMood) return`) and `SubscriptionProvider` (commented intent at line 96) are guarded against double-fetching when SSR data is present.

2. **MoodProvider useEffect is correct.** The guard `if (initialMood) return` at line 56 means the client-side fetch only fires when SSR did not provide data (e.g., an unauthenticated render path). No double-fetch occurs in normal dashboard use.

3. **SubscriptionProvider and MoodProvider use useMemo correctly** for context value stabilization (lines 178 and 126 respectively).

4. **Optimistic updates with proper revert logic** in `clearWeed` and `clearAllWeeds` is a good UX pattern, even if the implementation has the stale closure issue noted above.

5. **Parallel data fetching** in `plant-detail-sheet.tsx` (line 127: `Promise.all([getGoalForPlant, getPlantActivityHistory])`) avoids waterfall fetches.

---

## Recommended Actions

1. **[High] Fix `isLoading` initialization in subscription-context.tsx:78** - Change sentinel from `'free'` to `undefined` to avoid double-fetch for free-tier users. This affects every free-tier user on every page load.

2. **[High] Fix stale closure in weeds-context.tsx clearWeed/clearAllWeeds** - Capture the revert count inside the functional `setWeeds` updater rather than from closure. Eliminates both the stale closure risk and the `[weeds]` dependency (enabling stable callback refs).

3. **[Medium] Add useMemo to WeedsContext value object** - Consistent with SubscriptionProvider and MoodProvider. 5-line change.

4. **[Medium] Wrap createClient() with React.cache()** - Single import change. Eliminates redundant `auth.getUser()` calls within the same SSR render tree. Particularly impactful when multiple server actions run during layout rendering.

5. **[Low] Add try/catch to plant-detail-sheet.tsx useEffect #1 (lines 124-136)** - Prevent `isLoadingGoal` being stuck `true` on action failure.

---

## Metrics
- Type Coverage: Not measured (no typecheck run requested)
- Test Coverage: Not measured
- Linting Issues: 0 blocking issues found in reviewed files

---

## Unresolved Questions

- Is `SubscriptionProvider` ever rendered **without** an `initialTier` prop (i.e., outside the dashboard layout)? If so, the `isLoading=true` on mount for free-tier becomes the intended behavior for that path, and the fix needs to use `undefined` as sentinel consistently.
- The `energy_logs` fallback in `getTodayMood()` (lines 41-59) suggests an in-progress migration. Is this table still written to? If not, it adds an extra DB query on every mood fetch where no `mood_logs` record exists yet.

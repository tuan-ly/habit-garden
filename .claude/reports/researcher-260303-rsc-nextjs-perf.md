# RSC + Next.js App Router Performance Patterns (2025)

## 1. Context Providers: Client vs Server

**Server Contexts (Use for data):**
- Use `React.cache()` for request-scoped deduplication (fetch once per request across all components)
- Avoid passing large objects; let components fetch granularly
- No performance cost—rendered to static HTML
- Pattern: Data layer via server actions + props, not context

**Client Contexts (Use sparingly):**
- Fine for UI state (theme, modals, auth token after hydration)
- Heavy contexts cause cascading re-renders → bundle bloat
- **Anti-pattern**: Global data context (user prefs, todos) forces client hydration of entire subtree
- **Fix**: Keep contexts small; use atomic state (Zustand, Jotai) or server actions for data

**Actionable**: For Habit Garden (Supabase auth, plant data):
- Auth: Small client context (user ID, token) via Supabase middleware
- Plant data: Fetch server-side per layout/page; pass via props or server actions
- Avoid: Large user/plant context wrapping whole app

---

## 2. Data Fetching Waterfalls: Detection & Fix

**Sequential (Bad) Pattern:**
```
1. Fetch user → 2. Fetch plants (depends on user) → 3. Fetch goals
```
Results: 3x network round trips, ~100-300ms+ latency on 3G.

**Parallel (Good) Pattern:**
```
Promise.all([
  fetchUser(),
  fetchPlants(),
  fetchGoals()
])
```
Single round trip; use `Promise.all()` or Promise constructor batching.

**Detection Signals:**
- Waterfall visible in DevTools Network tab (sequential requests, not parallel)
- Slow First Contentful Paint (FCP) even with fast server
- `useEffect` chaining dependencies

**Fix via Suspense Boundaries:**
```tsx
// app/page.tsx
export default async function Page() {
  // All in parallel at request time
  const [user, plants, goals] = await Promise.all([
    getUser(), getPlantsForUser(), getGoalsForUser()
  ]);

  return (
    <Suspense fallback={<LoadingHud />}>
      <Garden user={user} plants={plants} />
    </Suspense>
  );
}
```
**Pattern**: Fetch all at layer boundary (layout/page), not in deeply nested components.

---

## 3. Suspense Boundaries: Streaming SSR

**Progressive Enhancement:**
- Wrap slow components in `<Suspense>` with fallback UI
- Server streams HTML chunks as data arrives
- Users see skeleton UI while data fetches (perceived speed ↑)

**Example for Habit Garden:**
```tsx
<Suspense fallback={<SkeletonGarden />}>
  <GardenWithPlants />
</Suspense>

<Suspense fallback={<SkeletonHud />}>
  <GameHUD userId={userId} />
</Suspense>
```

**Gotchas:**
- Don't overuse (10+ boundaries = fragmented HTML, overhead)
- Boundary placement: Wrap at component, not leaf level
- Client components inside Suspense still hydrate on boundary resolution

**Best Practice**: 2-3 strategic boundaries (layout, main content, sidebar) not per-component.

---

## 4. Bundle Size: Code Splitting & Heavy Components

**Client-Side Bundle Risk Areas:**
- Canvas libraries (isometric garden visual) → lazy load via `dynamic()`
- Charting, animations → split by route or feature flag
- Date libs, translations → tree-shake or use lighter alternatives

**Code Splitting Strategy:**
```tsx
// garden/page.tsx
const IsometricGarden = dynamic(
  () => import('@/components/garden/isometric'),
  { loading: () => <div>Loading garden...</div> }
);

export default function GardenPage() {
  return <IsometricGarden />;
}
```

**Bundle Audit:**
- Run `next/bundle-analyzer` in build: `ANALYZE=true npm run build`
- Target: Keep initial JS < 200KB (gzipped)
- Split by route (garden vs goals vs settings page)

**For Habit Garden:**
- Isometric view: Heavy (canvas, three.js?) → lazy per `/garden` route
- Plant selection: Medium → lazy load per `/plants` route
- Auth, HUD: Keep in main bundle (always needed)

---

## 5. Common Mistakes & Fixes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Fetch inside client component | Hydration mismatch + waterfall | Move to server component, fetch at layout/page |
| Large context wrapping app | All children re-render on context change | Split context; use props or Zustand |
| No Suspense in slow component | Blocks entire page render | Add `<Suspense>` boundary + fallback |
| Server component with `useState` | Runtime error | Must be `'use client'` if stateful |
| Fetching same data twice | Waterfall + wasted bandwidth | Use `React.cache()` in server layer |
| Dynamic imports on every render | Bundle re-split on client | Dynamic import at module scope, not in JSX |

**Critical for Next.js 16:**
- Server components are default (✓ good for SEO, ✓ no JS)
- Don't accidentally make everything client with `'use client'`
- Use `'use client'` only for interactive features (buttons, forms, animations)

---

## Actionable Checklist for Habit Garden

- [ ] Audit plant-detail-sheet.tsx: Is it client? Move slow fetches to parent server component.
- [ ] Garden fetch: Use `Promise.all([getUser(), getPlants(), getGoals()])` at page level
- [ ] Suspense: Add boundary around `<GardenView />` + `<GameHUD />` separately
- [ ] Canvas rendering (isometric): Lazy load with `dynamic()` on `/garden` route only
- [ ] Auth context: Keep minimal (user ID + token); fetch plant list server-side
- [ ] Run bundle analyzer: `ANALYZE=true npm run build` → identify heavy deps
- [ ] Test Network tab: Verify zero sequential requests on page load

---

## References

- Next.js 16 App Router docs (official)
- React RFC: Server Components (facebook/react)
- Vercel Web Vitals Guide (2024-2025 patterns)
- Web.dev: Core Web Vitals optimization

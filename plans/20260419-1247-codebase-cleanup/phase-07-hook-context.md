# Phase 07 — Hook/Context Correctness

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-04-19 |
| Priority | 🟠 HIGH |
| Status | ⬜ TODO |
| Depends on | None (UI/hook bugs independent) |
| Est. effort | 3–5h |

## Context Links
- Rules: `d:\Code\habit-garden\.claude\rules\components.md` — context provider order, component map
- Primary files: `src/lib/context/inventory-context.tsx`, `src/lib/context/plants-context.tsx`
- Other: `src/lib/hooks/use-garden-zoom.ts`, `src/components/gamification/achievement-popup.tsx`
- Settings: `src/lib/context/garden-settings-context.tsx`

---

## Key Insights
1. **`inventory-context.tsx:185` loadRecipes race** — Two async calls to load recipes fire simultaneously without coordination. If the second resolves before the first, state is set with stale data then immediately overwritten. Or if the first resolves after the second, stale data wins. Use a ref or abort controller to cancel stale loads.
2. **`plants-context.tsx:215` waterPlant stale closure** — `waterPlant` callback closes over the initial `plants` state. If `plants` updates (e.g., another plant was added) before `waterPlant` resolves, the optimistic update applies to the stale array, silently dropping intermediate updates. Fix: use functional `setState(prev => ...)` form.
3. **`use-garden-zoom.ts:131,172` missing storageKey dep** — `useEffect` hooks that sync zoom state to `localStorage` have `storageKey` in the effect body but not in the dependency array. If `storageKey` changes, the old key is never cleaned up and the new key is never synced. ESLint exhaustive-deps would catch this.
4. **`achievement-popup.tsx:26` stale onClose ref** — `onClose` prop is captured in a `useEffect` or `setTimeout` without being wrapped in a `useRef`. If the parent re-renders and passes a new `onClose`, the popup still calls the old one.
5. **`garden-settings-context` SSR overwrite** — Context initializes from `localStorage` on mount (client), but if there's a server-side initial value (from cookies or SSR props), the client `useEffect` overwrites it before the user sees the page, causing a flash or wrong initial state.

---

## Requirements
- `loadRecipes` must not allow stale responses to win over newer ones.
- `waterPlant` optimistic update must use functional setState to avoid stale closure.
- `use-garden-zoom` effects must include `storageKey` in deps array.
- `achievement-popup` must always call the current `onClose` prop.
- `garden-settings-context` SSR value must not be overwritten by a stale `localStorage` read.

---

## Architecture

### Race Condition Fix (inventory-context loadRecipes)
Pattern: Use a boolean `cancelled` flag or `AbortController`:
```tsx
useEffect(() => {
  let cancelled = false
  loadRecipes().then(data => {
    if (!cancelled) setRecipes(data)
  })
  return () => { cancelled = true }
}, [])
```

### Stale Closure Fix (plants-context waterPlant)
Pattern: Functional setState form:
```tsx
// Instead of:
setPlants(plants.map(p => p.id === id ? {...p, moisture: newVal} : p))
// Use:
setPlants(prev => prev.map(p => p.id === id ? {...p, moisture: newVal} : p))
```

### Missing Dep Fix (use-garden-zoom)
- Add `storageKey` to the `useEffect` dependency array at lines 131 and 172.
- If `storageKey` is actually stable (never changes at runtime), add a comment explaining why the dep omission is intentional, or wrap in `useCallback`/`useMemo` at the call site.

### Stale Ref Fix (achievement-popup)
Pattern: `useRef` to always have current callback:
```tsx
const onCloseRef = useRef(onClose)
useEffect(() => { onCloseRef.current = onClose }, [onClose])
// In timeout/effect:
onCloseRef.current()
```

### SSR Overwrite Fix (garden-settings-context)
- On server: initialize state from props/cookies (if available).
- On client: only read `localStorage` if no server-provided value exists.
- Pattern: `const [settings, setSettings] = useState(() => serverValue ?? defaultSettings)` — then `useEffect` syncs FROM state TO localStorage (not the reverse).

---

## Related Code Files
```
src/lib/context/inventory-context.tsx:185    ← loadRecipes race
src/lib/context/plants-context.tsx:215       ← waterPlant stale closure
src/lib/hooks/use-garden-zoom.ts:131,172     ← missing storageKey dep
src/components/gamification/achievement-popup.tsx:26  ← stale onClose ref
src/lib/context/garden-settings-context.tsx  ← SSR overwrite
```

---

## Implementation Steps

### Step 1 — Fix inventory-context.tsx:185 loadRecipes race
- Read `src/lib/context/inventory-context.tsx` around line 185.
- Identify the async load pattern.
- Add `cancelled` flag or `AbortController` pattern.
- Ensure the cleanup function sets `cancelled = true`.
- Test: rapid component mount/unmount should not cause state updates after unmount.

### Step 2 — Fix plants-context.tsx:215 waterPlant stale closure
- Read `src/lib/context/plants-context.tsx` around line 215.
- Find `waterPlant` function definition and its optimistic update `setPlants(...)` call.
- Replace array reference form with functional form `setPlants(prev => ...)`.
- Verify other setPlants calls in the same function also use functional form.

### Step 3 — Fix use-garden-zoom.ts deps
- Read `src/lib/hooks/use-garden-zoom.ts:120-180`.
- At lines 131 and 172, locate `useEffect` dep arrays.
- Add `storageKey` to each dep array.
- If ESLint is configured, run `eslint src/lib/hooks/use-garden-zoom.ts` to verify no remaining exhaustive-deps warnings.

### Step 4 — Fix achievement-popup.tsx stale onClose
- Read `src/components/gamification/achievement-popup.tsx:20-40`.
- Find where `onClose` is called inside a `setTimeout` or `useEffect`.
- Add `useRef` pattern to always hold current `onClose`.
- Alternatively, if `onClose` is stable (memoized at call site), document why and add `// eslint-disable-next-line` with comment.

### Step 5 — Fix garden-settings-context SSR overwrite
- Read `src/lib/context/garden-settings-context.tsx` fully.
- Find the `useEffect` that reads from `localStorage` and calls `setSettings`.
- Refactor: initialize state with server value (prop or cookie) first.
- `localStorage` sync should only write TO storage, not read from it on mount if a server value exists.
- If no server value (pure CSR app), the current pattern is acceptable — add a comment clarifying.

### Step 6 — Run lint and type-check
- `npm run lint` — check for any remaining exhaustive-deps warnings in modified files.
- `npm run typecheck` (or `tsc --noEmit`) — ensure no type errors introduced.

---

## Todo List
- [ ] Fix loadRecipes race in inventory-context.tsx:185 (cancelled flag)
- [ ] Fix waterPlant stale closure in plants-context.tsx:215 (functional setState)
- [ ] Add storageKey to useEffect deps in use-garden-zoom.ts:131,172
- [ ] Fix stale onClose in achievement-popup.tsx:26 (useRef pattern)
- [ ] Fix SSR overwrite in garden-settings-context.tsx
- [ ] Run lint — check exhaustive-deps warnings cleared
- [ ] Run typecheck — no new errors

---

## Success Criteria
- Rapid re-fetching of recipes never shows stale data.
- `waterPlant` called immediately after adding a new plant sees the new plant in state.
- Changing `storageKey` (if ever possible) correctly migrates zoom state.
- Achievement popup always calls the most recent `onClose` prop.
- Garden settings loaded SSR do not flash to default on mount.
- No `react-hooks/exhaustive-deps` lint warnings in modified files.

---

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Functional setState changes timing of optimistic update | Low | Medium | Test water flow end-to-end |
| storageKey dep change triggers unexpected effect re-run | Low | Low | storageKey is likely static |
| SSR fix requires knowing server-side data shape | Medium | Medium | Read context initialization carefully |
| loadRecipes cancelled flag misses some load paths | Medium | Low | Check all code paths that call loadRecipes |

---

## Security Considerations
- No security impact (UI state bugs only).
- SSR overwrite fix does not expose any server state that wasn't already client-visible.

---

## Next Steps
→ Phase 08: DRY + Cleanup
→ Phase 09: Polish & A11y

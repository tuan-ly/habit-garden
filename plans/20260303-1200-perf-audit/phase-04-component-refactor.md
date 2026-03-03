# Phase 4: Component Refactor + Context Cleanup

> **Priority**: LOW-MEDIUM
> **Estimated effort**: 3-4 hours
> **Files**: `src/lib/context/weeds-context.tsx`, various utility files

## Context

- `WeedsContext` has stale closure bug: `clearWeed` and `clearAllWeeds` (useCallback) capture `weeds` in their dependency array but read `weeds[plantId]` directly. If two clears happen in rapid succession, the second may see stale state.
- `contextValue` object in WeedsProvider is recreated every render (no useMemo). With React Compiler enabled this may be auto-optimized, but explicit memoization is safer.
- DRY violations: emoji/color mapping functions duplicated across files.
- Large components (plant-detail-sheet at 930 lines, isometric-garden at 500+ lines) - defer splitting unless actively working in those files.

## Key Insights

1. The stale closure in WeedsContext is a real bug, not theoretical. If a user taps "clear weed" twice quickly, the optimistic update from the first tap isn't visible to the second callback. The revert logic could restore to the wrong count.
2. React Compiler (enabled in next.config.ts via `reactCompiler: true`) should auto-memoize the context value object. But the stale closure is a logic bug the compiler won't fix.
3. DRY violations are minor - only worth fixing if touching those files for other reasons.

---

## Implementation Steps

### 1. Fix WeedsContext stale closure

**File**: `src/lib/context/weeds-context.tsx`

The bug is in `clearWeed` (line 43) and `clearAllWeeds` (line 74). Both use `weeds[plantId]` directly but `weeds` is stale due to useCallback closure.

Fix: Use functional state updater and ref for current value:

```tsx
const weedsRef = useRef(weeds)
weedsRef.current = weeds

const clearWeed = useCallback(async (plantId: string) => {
  const currentCount = weedsRef.current[plantId] || 0
  if (currentCount <= 0) return { success: false }

  // Optimistic update using functional updater
  setWeeds((prev) => ({
    ...prev,
    [plantId]: Math.max(0, (prev[plantId] || 0) - 1),
  }))

  const result = await clearWeedAction(plantId)

  if (result.success) {
    toast.success(`+${result.xpEarned} XP`, { description: 'Weed cleared!', duration: 1500 })
    return { success: true, xpEarned: result.xpEarned }
  } else {
    // Revert using functional updater
    setWeeds((prev) => ({
      ...prev,
      [plantId]: currentCount, // restore pre-optimistic value
    }))
    toast.error('Failed to clear weed')
    return { success: false }
  }
}, []) // No dependency on weeds - uses ref instead
```

Same pattern for `clearAllWeeds`.

**Alternative (simpler)**: Since React Compiler is enabled, you could just remove the useCallback wrappers entirely and let the compiler handle memoization. The compiler would use the latest `weeds` value naturally. But the revert logic still needs the pre-call snapshot, so the ref approach is more correct.

### 2. Memoize WeedsContext value (optional with React Compiler)

**File**: `src/lib/context/weeds-context.tsx`, line 109-118

With React Compiler enabled, this is likely auto-optimized. Skip unless profiling shows unnecessary re-renders. Mark as "verify, don't fix":

```tsx
// Verify React Compiler output memoizes this:
const contextValue = useMemo(() => ({
  weeds, setPlantWeeds, clearWeed, clearAllWeeds, getTotalWeeds,
}), [weeds, setPlantWeeds, clearWeed, clearAllWeeds, getTotalWeeds])
```

### 3. DRY: Consolidate emoji/color utilities (opportunistic)

Only do this when touching the relevant files. Not worth a standalone PR.

Identify duplicated functions:
```bash
grep -rn "function.*emoji\|function.*color\|function.*icon" src/lib/ src/components/ --include="*.ts" --include="*.tsx"
```

If found, extract to `src/lib/utils/display.ts` or similar.

### 4. Next.js config improvements (quick win)

**File**: `next.config.ts`

Add image optimization for plant assets:
```ts
const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {},
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}
```

This is only useful if plant images are served via `<Image>` component. If they're in `<img>` tags or Canvas, skip this.

---

## Todo Checklist

- [ ] Fix stale closure in `clearWeed` using ref pattern
- [ ] Fix stale closure in `clearAllWeeds` using ref pattern
- [ ] Verify React Compiler auto-memoizes WeedsContext value (check compiled output)
- [ ] If not auto-memoized, add explicit useMemo for contextValue
- [ ] (Opportunistic) Consolidate duplicated emoji/color functions when touching those files
- [ ] (Opportunistic) Add Next.js image config if using `<Image>` component

## Success Criteria

- Rapid double-tap on "clear weed" correctly decrements by 2 (not 1)
- No unnecessary re-renders in WeedsProvider consumers (verify with React DevTools profiler)
- All existing tests pass

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Ref pattern introduces different subtle bug | Low | Medium | Test rapid-fire clearing manually |
| Removing useCallback deps breaks React Compiler assumptions | Very Low | Low | React Compiler handles missing deps gracefully |
| DRY refactor breaks imports | Low | Low | TypeScript compiler catches broken imports immediately |

## Deferred Items (not worth doing now)

- **Split plant-detail-sheet.tsx** (930 lines): Only split when adding new tabs or if merge conflicts become frequent. The file is organized by tab sections and is readable as-is.
- **Split isometric-garden.tsx** (500+ lines): Same reasoning. Canvas/render logic is cohesive.
- **Prop drilling in IsometricGarden chain**: React Compiler handles memoization. Adding context for 2-level prop passing adds indirection without measurable gain.

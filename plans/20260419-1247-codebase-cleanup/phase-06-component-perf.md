# Phase 06 — Component Performance

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-04-19 |
| Priority | 🟠 HIGH |
| Status | ⬜ TODO |
| Depends on | None (UI-only changes) |
| Est. effort | 5–8h |

## Context Links
- Rules: `d:\Code\habit-garden\.claude\rules\components.md` — perf rules: prefer Canvas, minimize DOM animations
- Rules: `d:\Code\habit-garden\.claude\rules\components.md` — performance first, frame rate priority
- Hydration bug (also in Phase 03): `src/components/game-ui/level-up-modal.tsx:121-127`

---

## Key Insights
1. **`weather-effects.tsx` — 40 rain divs** — Renders 40 individual `<div>` elements as rain drops, each with CSS animation. On low-end devices this tanks frame rate. Rules mandate Canvas for "many moving parts."
2. **`special-effects.tsx` — per-plant setInterval** — Creates a `setInterval` for each plant rendered. On a garden with 20 plants, 20 simultaneous intervals fire. Memory leak if plants unmount without cleanup. No `clearInterval` in cleanup.
3. **`watering-celebration.tsx`** — DOM-based celebration animation (likely CSS keyframes or GSAP-style inline styles). Should be Canvas.
4. **`ambient-particles.tsx` (default export)** — Default particle system using DOM elements. Rules say prefer Canvas.
5. **framer-motion in crafting/shop** — ~30KB bundle weight for what are likely simple enter/exit transitions. Can be replaced with CSS transitions or a tiny custom hook.
6. **`isometric-garden.tsx:414` — inline `new Set()`** — Creates a new Set reference on every render, causing downstream `useMemo`/`useEffect` dependencies to invalidate unnecessarily.
7. **`Math.random()` in level-up-modal** — covered in Phase 03 but has perf + hydration implications here too.

---

## Requirements
- Weather, particle, celebration effects must not use per-element DOM animation for >5 simultaneous elements.
- Canvas implementations must expose a cleanup function (cancel animation frame, clear intervals).
- No `setInterval` without paired `clearInterval` in useEffect cleanup.
- No inline object/array/Set creation in JSX that's passed as a prop or used as a dep.
- framer-motion removed from crafting/shop bundle (replaced with CSS or lightweight alternative).

---

## Architecture

### Canvas Migration Pattern
```tsx
// Replace DOM particle div array with:
const canvasRef = useRef<HTMLCanvasElement>(null)
useEffect(() => {
  const canvas = canvasRef.current
  const ctx = canvas.getContext('2d')
  let rafId: number
  const animate = () => {
    ctx.clearRect(...)
    // draw particles
    rafId = requestAnimationFrame(animate)
  }
  rafId = requestAnimationFrame(animate)
  return () => cancelAnimationFrame(rafId)  // ← critical cleanup
}, [])
return <canvas ref={canvasRef} ... />
```

### setInterval Cleanup Pattern
```tsx
useEffect(() => {
  const id = setInterval(tick, 100)
  return () => clearInterval(id)  // ← add this
}, [deps])
```

### Inline Set Fix
```tsx
// Move out of component or into useMemo:
const selectedIds = useMemo(() => new Set(ids), [ids])
```

### framer-motion Removal
Replace `<motion.div animate={{ opacity: 1 }}>` with CSS transitions:
```tsx
<div className="transition-opacity duration-300 opacity-100">
```
Or use a tiny `useTransition` hook if enter/exit is needed.

---

## Related Code Files
```
src/components/garden/weather-effects.tsx        ← 40 rain divs → Canvas
src/components/plants/special-effects.tsx        ← per-plant setInterval leak
src/components/plants/watering-celebration.tsx   ← DOM celebration → Canvas
src/components/garden/ambient-particles.tsx      ← DOM particles → Canvas
src/components/game-ui/level-up-modal.tsx:121    ← Math.random() (also Phase 03)
src/components/garden/isometric-garden.tsx:414   ← inline new Set()
src/components/               ← grep for framer-motion usage in crafting/shop
```

---

## Implementation Steps

### Step 1 — Audit all offenders
- Read each affected file. For each:
  - Count DOM elements created per render/frame.
  - Check for `setInterval`/`setTimeout` without cleanup.
  - Note any prop drilling of unstable references.
- Grep for `framer-motion` imports: `grep -r "framer-motion" src/components/`.

### Step 2 — Migrate `weather-effects.tsx` to Canvas
- Read current implementation.
- Replace the `{Array.from({length: 40}).map(...)}` div approach with a `<canvas>` + `requestAnimationFrame` loop.
- Implement rain particle physics on canvas (position, velocity, reset at bottom).
- Ensure cleanup: `cancelAnimationFrame` on unmount.
- Match visual fidelity approximately — exact pixel match not required.

### Step 3 — Fix `special-effects.tsx` setInterval leak
- Read `special-effects.tsx`.
- Find all `setInterval` calls.
- Ensure each is inside a `useEffect` with a return cleanup `() => clearInterval(id)`.
- If per-plant instances are still needed, ensure each plant component cleans up on unmount.
- Consider: consolidate into a single shared animation loop if multiple plants share the same effect type.

### Step 4 — Migrate `watering-celebration.tsx` to Canvas
- Read current implementation.
- Replace DOM-based celebration (confetti divs, etc.) with Canvas drawing.
- Use `requestAnimationFrame` loop. Particles spawn, move, fade, then `cancelAnimationFrame` when all done.
- Expose `onComplete` callback after animation ends.

### Step 5 — Migrate `ambient-particles.tsx` to Canvas
- Read default export.
- Replace DOM particle array with Canvas implementation.
- Likely simpler than rain — floating dots or sparkles.

### Step 6 — Fix `isometric-garden.tsx:414` inline Set
- Read around line 414.
- Move the `new Set(...)` construction to a `useMemo` or outside the component render path.
- Verify no downstream effect dependencies that were previously broken are now correctly triggered.

### Step 7 — Remove framer-motion from crafting/shop
- Identify exact import locations (from Step 1 grep).
- For each `motion.*` usage:
  - Simple fade/scale → replace with Tailwind `transition-*` classes.
  - Complex enter/exit → use CSS `@keyframes` or a `data-state` pattern.
- Remove `framer-motion` import from affected files.
- Verify bundle size reduction (optional: `next build` and compare).

### Step 8 — Performance smoke test
- Open garden with 10+ plants.
- Toggle rain weather effect.
- Log activity on a plant (triggers special-effects + watering-celebration).
- Monitor Chrome DevTools Performance panel — look for long frames (>16ms).
- Check Memory tab — no growing heap after multiple interactions.

---

## Todo List
- [ ] Audit all 6 offender files — map DOM elements per render and setInterval usage
- [ ] Grep framer-motion usages in crafting/shop components
- [ ] Migrate weather-effects.tsx → Canvas (with cleanup)
- [ ] Fix special-effects.tsx setInterval memory leak
- [ ] Migrate watering-celebration.tsx → Canvas
- [ ] Migrate ambient-particles.tsx → Canvas
- [ ] Fix inline new Set() in isometric-garden.tsx:414 → useMemo
- [ ] Remove framer-motion from crafting/shop files
- [ ] Performance smoke test — no frames >16ms during effects

---

## Success Criteria
- `weather-effects` renders 0 DOM div elements for rain particles (canvas only).
- No `setInterval` calls in `special-effects.tsx` without paired cleanup.
- `watering-celebration` and `ambient-particles` use canvas.
- `isometric-garden.tsx:414` Set is stable across renders (no unnecessary re-renders).
- framer-motion removed from crafting/shop pages.
- No frame drops >16ms during combined particle effects on a mid-spec device.

---

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Canvas rain looks different from div rain | High | Low | Visual regression is acceptable for perf |
| Canvas implementation complex to get right | Medium | Medium | Start with simple points, iterate |
| framer-motion removal breaks exit animations | Medium | Medium | Test each transition manually |
| setInterval cleanup fix misses some locations | Low | Medium | Grep all setInterval in special-effects |
| isometric-garden Set change breaks selection | Low | High | Verify selection state before/after |

---

## Security Considerations
- No security impact (UI-only changes).
- Canvas context doesn't expose any auth/user data concerns.

---

## Next Steps
→ Phase 07: Hook/Context Correctness (other hook bugs)
→ Phase 08: DRY + Cleanup (framer-motion removal may overlap with component cleanup)

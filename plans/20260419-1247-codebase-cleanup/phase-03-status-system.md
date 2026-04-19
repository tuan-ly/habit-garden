# Phase 03 — Status System Correctness

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-04-19 |
| Priority | 🔴 CRITICAL |
| Status | ⬜ TODO |
| Depends on | None (client-side bugs only) |
| Est. effort | 3–5h |

## Context Links
- Rules: `d:\Code\habit-garden\.claude\rules\plants-status.md` — canonical status values, flow, filter patterns
- Rules: `d:\Code\habit-garden\.claude\rules\components.md` — component map
- Primary bug file: `src/lib/context/plants-context.tsx`
- Status logic: `src/lib/plant-status.ts`
- Hydration bug: `src/components/game-ui/level-up-modal.tsx:121-127`

---

## Key Insights
1. **Reducer never sets 'thriving'** — `plants-context.tsx:152,359`: After `logActivity()` succeeds (which sets `status = 'thriving'` in DB), the optimistic reducer update sets status to something else (likely `'growing'`). UI shows wrong status until next full reload.
2. **No dead/dormant guard before mature promotion** — Lines 102,152,253,359: When `growth_percentage >= 100`, the reducer promotes a plant to `'mature'` without checking `status !== 'dead' && status !== 'dormant'`. A dead plant can be client-side promoted to mature, causing UI/DB desync.
3. **plant-status.ts switch gaps** — `calculatePlantStatus()` has a switch statement missing cases for `'thriving'`, `'resting'`, `'waiting'`, `'sleeping'`. These fall through to default, returning wrong display status.
4. **Math.random() in JSX** — `level-up-modal.tsx:121-127` uses `Math.random()` in render to generate particle positions. This causes React hydration mismatch (server vs client random values differ). Must move to `useEffect` or `useMemo` with client-only init.

---

## Requirements
- Reducer must set `status = 'thriving'` on logActivity success (matching DB behavior).
- Mature promotion must guard: `status !== 'dead' && status !== 'dormant'` (per `plants-status.md`).
- `calculatePlantStatus()` must handle all valid statuses without fall-through.
- No `Math.random()` calls during SSR render path.

---

## Architecture

### Status Flow (from plants-status.md)
```
createPlant()  → 'growing'
logActivity()  → 'thriving'   ← reducer must reflect this
waterPlant()   → status unchanged
growth >= 100% → 'mature'     ← only if NOT dead/dormant
moisture = 0   → 'dead'       (cron, not client)
```

### Correct mature promotion guard (from plants-status.md)
```typescript
newGrowth >= 100 && plant.status !== 'mature' && plant.status !== 'dead' && plant.status !== 'dormant'
```

### Hydration Fix Strategy
Extract particle positions from `Math.random()` into a `useEffect` that runs after mount. Render null or placeholder on server.

---

## Related Code Files
```
src/lib/context/plants-context.tsx:102   ← mature guard missing (createPlant?)
src/lib/context/plants-context.tsx:152   ← logActivity reducer: wrong status + mature guard
src/lib/context/plants-context.tsx:253   ← waterPlant reducer: mature guard
src/lib/context/plants-context.tsx:359   ← logActivity or update reducer: wrong status + mature guard
src/lib/plant-status.ts                  ← calculatePlantStatus() switch gaps
src/components/game-ui/level-up-modal.tsx:121-127  ← Math.random() hydration bug
```

---

## Implementation Steps

### Step 1 — Read and map plants-context.tsx
- Read `src/lib/context/plants-context.tsx` fully.
- Map all reducer cases that touch `status` or `growth_percentage`.
- Tag each with the issue (wrong status, missing guard, or both).

### Step 2 — Fix reducer: logActivity → 'thriving'
- Locate the reducer action for `logActivity` success (likely `LOG_ACTIVITY_SUCCESS` or similar).
- At lines 152 and 359, ensure the optimistic/confirmed update sets `status: 'thriving'` in the updated plant object.
- Do NOT set 'thriving' if `newGrowth >= 100` (would immediately promote to mature instead).

### Step 3 — Fix mature promotion guards
- At every location where `growth_percentage >= 100` triggers a status change to `'mature'` (lines 102, 152, 253, 359):
  - Add `&& plant.status !== 'dead' && plant.status !== 'dormant'` to the condition.
  - Use the exact filter pattern from `plants-status.md`.

### Step 4 — Fix `calculatePlantStatus()` switch gaps
- Read `src/lib/plant-status.ts`.
- Locate the switch/if-else handling status values.
- Add explicit handling for: `'thriving'`, `'resting'`, `'waiting'`, `'sleeping'`.
- Each should return the appropriate display status (likely same as `'growing'` visually, but check design intent in ARCHITECTURE.md or comments).
- Add an exhaustive `default` that logs a warning for unknown statuses.

### Step 5 — Fix Math.random() hydration bug in level-up-modal
- Read `src/components/game-ui/level-up-modal.tsx:110-140`.
- Identify the `Math.random()` calls generating particle positions/values.
- Move them into a `useState` initialized in a `useEffect(() => { ... }, [])` so they only run client-side.
- Render a stable placeholder (empty array or null) on first server render.
- Verify no hydration warning in browser console after fix.

### Step 6 — Write/update tests
- Add test cases to `src/lib/__tests__/` for:
  - `calculatePlantStatus()` with all valid status inputs.
  - Reducer: logActivity sets 'thriving'.
  - Reducer: dead plant cannot be promoted to mature.

### Step 7 — Manual smoke test
- Log activity on a plant → confirm status chip shows 'thriving' without reload.
- Water a dead plant (if possible via dev tools) → confirm UI does not show 'mature'.
- Trigger level-up → confirm no hydration warning.

---

## Todo List
- [ ] Read plants-context.tsx, map all status-touching reducer cases
- [ ] Fix logActivity reducer to set status = 'thriving' (lines 152, 359)
- [ ] Add dead/dormant guard before mature promotion (lines 102, 152, 253, 359)
- [ ] Read plant-status.ts, fix switch gaps for thriving/resting/waiting/sleeping
- [ ] Fix Math.random() in level-up-modal.tsx:121-127 (move to useEffect)
- [ ] Write tests for calculatePlantStatus() all statuses
- [ ] Write tests for reducer dead-plant guard
- [ ] Manual smoke test: logActivity → thriving shown, dead plant not promoted

---

## Success Criteria
- Logging activity shows 'thriving' status in UI immediately (no reload needed).
- A plant with `status = 'dead'` cannot reach `status = 'mature'` in the reducer.
- `calculatePlantStatus()` returns correct value for all 8 valid status inputs.
- No React hydration mismatch warning on level-up modal.
- All new tests pass.

---

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Fixing reducer breaks optimistic update timing | Medium | Medium | Test water → log → water sequence |
| plant-status.ts 'thriving' display behavior unclear | Medium | Low | Check ARCHITECTURE.md / design docs |
| useEffect particle init causes flash | Low | Low | Use stable empty-array placeholder |
| Missing additional reducer locations beyond 4 listed | Low | Medium | Full read of context file before fixing |

---

## Security Considerations
- No security impact (client-side state bugs only).
- Status desync could theoretically be used to display misleading plant health to the user, but no DB exploit vector.

---

## Next Steps
→ Phase 04: Economy Atomicity
→ Phase 07: Hook/Context Correctness (other context bugs)

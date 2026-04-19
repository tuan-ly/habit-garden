# Phase 09 — Polish & A11y

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-04-19 |
| Priority | 🔵 LOW |
| Status | ⬜ TODO |
| Depends on | Phases 03, 06, 08 (cleaner codebase to work in) |
| Est. effort | 3–4h |

## Context Links
- Rules: `d:\Code\habit-garden\.claude\rules\plants-status.md` — status values
- Rules: `d:\Code\habit-garden\.claude\rules\components.md` — component map
- Status logic: `src/lib/plant-status.ts`
- Duplicate clocks: search for `new Date()` / time-of-day logic in components
- XP constants: search for `xp-constants.ts` or similar

---

## Key Insights
1. **`plant-status.ts` switch gaps** — Already partially addressed in Phase 03 (thriving/resting/waiting/sleeping), but additional edge cases may exist in the switch for display logic (time-of-day mood, growth bands). Document all gaps found.
2. **Duplicate time-of-day clocks** — Multiple components independently compute "current time of day" (morning/afternoon/evening) for theming or greetings. Should be a single hook `useTimeOfDay()`.
3. **A11y gaps** — Interactive elements (plant tiles, garden tiles, decorations) likely lack `aria-label`, `role`, keyboard handlers. Garden canvas especially has no keyboard navigation.
4. **Stale story data** — Storybook stories (if present) or mock data files reference old plant types, removed statuses (e.g., `dormant` as active), or deleted components. Should be pruned.
5. **Duplicate migration date prefix** — Two migrations share the same date prefix (from the review: likely `20260311` appears twice, or a similar collision). Migration ordering depends on filename — duplicates cause unpredictable ordering.
6. **xp-constants zeroed** — `xp-constants.ts` (or similar) has XP values set to 0. Either intentional (disabled feature) or a bug. Needs audit.

---

## Requirements
- `plant-status.ts` handles all valid status values without gaps.
- Time-of-day logic exists in one place (hook or utility).
- Key interactive elements have `aria-label` and keyboard accessibility.
- Stale/incorrect mock/story data updated or removed.
- No duplicate migration filename prefixes.
- XP constants audited — zeroed values documented as intentional or fixed.

---

## Architecture

### useTimeOfDay Hook
```typescript
// src/lib/hooks/use-time-of-day.ts
export type TimeOfDay = 'morning' | 'afternoon' | 'evening' | 'night'
export function useTimeOfDay(): TimeOfDay {
  // Single implementation, used everywhere
}
```

### A11y Pattern for Canvas Garden
Canvas elements can't have child aria elements. Use `aria-label` on the `<canvas>` plus an off-screen `<ul>` with plant list for screen readers:
```tsx
<canvas aria-label="Isometric garden view" role="img" />
<ul className="sr-only">
  {plants.map(p => <li key={p.id}>{p.name} — {p.status}</li>)}
</ul>
```
For clickable tiles outside canvas (if any), add `role="button"`, `tabIndex={0}`, `onKeyDown` for Enter/Space.

### Migration Prefix Fix
Rename the duplicate-prefixed migration file to the next available date prefix. Update `supabase_migrations.schema_migrations` if already applied (requires careful coordination).

---

## Related Code Files
```
src/lib/plant-status.ts                   ← switch/if gaps
src/components/                           ← grep for time-of-day logic duplication
src/lib/hooks/                            ← create use-time-of-day.ts
src/components/garden/isometric-garden.tsx  ← canvas a11y
src/components/plants/                    ← interactive plant tiles a11y
supabase/migrations/                      ← check for duplicate date prefixes
src/lib/xp-constants.ts (or similar)      ← zeroed XP values
src/stories/ or src/**/*.stories.tsx      ← stale story data
```

---

## Implementation Steps

### Step 1 — Complete plant-status.ts gaps
- Read `src/lib/plant-status.ts` fully.
- List all switch/if branches and compare against valid statuses in `plants-status.md`.
- Add any missing cases. Add `default` with `console.warn` for truly unknown statuses.
- Run existing tests, add new cases for any gaps.

### Step 2 — Extract useTimeOfDay hook
- Grep: `grep -rn "getHours\|time.*of.*day\|morning\|afternoon\|evening" src/components/`.
- Identify all locations computing time-of-day independently.
- Create `src/lib/hooks/use-time-of-day.ts` with a single canonical implementation.
- Replace all duplicate implementations with `useTimeOfDay()`.

### Step 3 — A11y: canvas garden
- Read `src/components/garden/isometric-garden.tsx`.
- Add `aria-label="Garden view"` and `role="img"` to the `<canvas>` element.
- Add an off-screen `<ul aria-label="Plants in garden">` listing each plant with name and status.
- For any non-canvas clickable elements in the garden, add `role="button"`, `tabIndex={0}`, `onKeyDown` handler.

### Step 4 — A11y: plant tiles and interactive elements
- Read plant card/tile components.
- Add `aria-label` to icon-only buttons (water, log activity).
- Add `aria-pressed` or `aria-selected` where applicable.
- Test with keyboard-only navigation.

### Step 5 — Fix duplicate migration prefix
- List migration files: check for duplicate date prefixes.
- Identify which was applied first (check `supabase_migrations.schema_migrations`).
- Rename the second file to an unambiguous timestamp.
- If the renamed migration is already applied, update the `version` in `schema_migrations` via `execute_sql` (with caution).

### Step 6 — Audit xp-constants
- Find `xp-constants.ts` or where XP award values are defined.
- For each zero value:
  - Check git history for when it was zeroed.
  - Check if there's a feature flag or disabled-feature comment.
  - If intentionally zeroed (disabled feature): add a `// TODO: re-enable when...` comment.
  - If accidentally zeroed: restore correct values (check DEVLOG or design docs for intended values).

### Step 7 — Prune stale story/mock data
- Find `*.stories.tsx` files: check for references to removed statuses (`dormant` as a promoted status), deleted component names, or outdated prop shapes.
- Update stories to reflect current component APIs.
- Delete stories for archived/deleted components.

---

## Todo List
- [ ] Audit plant-status.ts — list all missing switch cases, add them
- [ ] Grep time-of-day logic across components
- [ ] Create use-time-of-day hook, replace duplicates
- [ ] Add aria-label + role to isometric-garden canvas
- [ ] Add sr-only plant list for screen readers
- [ ] Add aria-label to icon-only buttons in plant components
- [ ] Check migration filenames for duplicate date prefixes
- [ ] Fix duplicate migration prefix (rename + update schema_migrations if needed)
- [ ] Audit xp-constants — document or fix zeroed values
- [ ] Prune stale Storybook stories

---

## Success Criteria
- `calculatePlantStatus()` handles all 8 valid status values + unknown (with warn).
- Time-of-day logic exists in exactly one hook.
- Garden canvas has `aria-label`. Screen-reader plant list present.
- All icon-only buttons have `aria-label`.
- No duplicate migration filename date prefixes.
- All zeroed XP constants are either explained by a comment or restored.
- Storybook stories compile without errors referencing removed components/statuses.

---

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Renaming migration breaks local dev setup | Medium | Low | Document rename, update dev onboarding |
| Restoring XP constants changes live reward amounts | Medium | Medium | Deploy behind a flag or coordinate with PM |
| A11y changes alter layout (sr-only has layout impact) | Low | Low | Use standard Tailwind sr-only class |
| Story pruning removes tests that were still useful | Low | Low | Check if stories are used in visual regression |

---

## Security Considerations
- No security impact.
- XP constant restoration could affect economy balance — confirm with product before changing values in prod.

---

## Next Steps
All 9 phases complete. Recommend:
1. DEVLOG entry summarizing all changes.
2. Update MEMO.md current sprint to "Maintenance complete."
3. Run full `npm run build` + `npm test` to confirm clean state.
4. Consider adding ESLint `react-hooks/exhaustive-deps` rule if not already enabled.

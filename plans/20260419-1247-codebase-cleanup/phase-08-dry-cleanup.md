# Phase 08 — DRY + Cleanup

## Overview
| Field | Value |
|-------|-------|
| Date | 2026-04-19 |
| Priority | 🟡 MEDIUM |
| Status | ⬜ TODO |
| Depends on | Phases 03, 04 (don't refactor code that's about to be deleted/replaced) |
| Est. effort | 4–6h |

## Context Links
- Rules: `d:\Code\habit-garden\.claude\rules\actions.md` — never select('*'), specify columns
- Rules: `d:\Code\habit-garden\.claude\rules\components.md` — archived components list
- Actions dir: `src/lib/actions/`
- Orphan: `src/lib/progression.ts` (vs `src/lib/xp-system.ts`, `src/lib/progression-system.ts`)

---

## Key Insights
1. **14 `select('*')` violations** — Rules explicitly forbid `select('*')`. Each forces Postgres to return all columns even when only 2–3 are used. On large tables (activity_logs, watering_logs) this is unnecessary data transfer. Each violation is in an action file.
2. **Watering effect duplicated 4×** — The logic that triggers the watering visual/state update appears in 4 places in `plants-context.tsx`. Should be extracted into a shared helper function.
3. **Decorations collision logic duplicated** — `decorations.ts` contains the same collision-checking algorithm in multiple places. Extract into a single `checkDecorationCollision(x, y, existingDecorations)` helper.
4. **Three parallel progression modules** — `xp-system.ts`, `progression-system.ts`, and `progression.ts` all seem to handle XP/level progression. `progression.ts` appears to be an orphan (not imported anywhere). Risk of divergence.
5. **`inventory-context` manual type casts** — Uses `as SomeType` casts where proper type unions or generics would work, hiding type errors.
6. **Archived files in `src/`** — Per `components.md`, `QuickLogModal` is archived (file exists with "(archieved)" in name). Other archived files may exist. These should be deleted, not left as dead code.

---

## Requirements
- All `select('*')` calls in actions replaced with explicit column lists.
- Watering effect logic extracted to a single helper (≤1 implementation).
- Decoration collision logic extracted to a single helper.
- `progression.ts` orphan deleted (or merged if it has unique logic).
- Archived files removed from `src/`.
- Type casts in inventory-context replaced with proper types.

---

## Architecture

### select('*') Fix Pattern
For each violation: read the action, identify which columns the result object actually accesses, replace `select('*')` with `select('col1, col2, col3')`.

### Extract Watering Helper
```typescript
// src/lib/context/plants-context-helpers.ts (new file)
export function applyWateringEffect(plant: Plant, result: WateringResult): Plant {
  return { ...plant, current_moisture: result.moisture, growth_percentage: result.growth }
}
```

### Collision Helper
```typescript
// src/lib/decorations-utils.ts (new file or add to existing)
export function checkDecorationCollision(x: number, y: number, placed: PlacedDecoration[]): boolean { ... }
```

### Progression Module Consolidation
- Keep `xp-system.ts` (or `progression-system.ts`, whichever is actively imported).
- Merge any unique logic from `progression.ts` into the canonical module.
- Delete `progression.ts`.
- Update all imports.

---

## Related Code Files
```
src/lib/actions/*.ts                     ← grep for select('*') — 14 violations
src/lib/context/plants-context.tsx       ← watering effect duplicated 4×
src/lib/actions/decorations.ts           ← collision logic duplicated
src/lib/progression.ts                   ← orphan module (verify before deleting)
src/lib/xp-system.ts                     ← active progression module (verify)
src/lib/progression-system.ts            ← active progression module (verify)
src/lib/context/inventory-context.tsx    ← manual type casts
src/components/plants/                   ← archived QuickLogModal file
src/components/                          ← search for "(archieved)" in filenames
```

---

## Implementation Steps

### Step 1 — Fix all `select('*')` violations
- Grep: `grep -rn "select('\*')" src/lib/actions/`.
- For each match, read the action function and identify all accessed fields from the query result.
- Replace `select('*')` with explicit column list.
- Check that TypeScript still compiles after each change (type inference may differ).
- Run `tsc --noEmit` after all changes.

### Step 2 — Extract watering helper from plants-context
- Read `plants-context.tsx`, find the 4 locations where watering effect is applied.
- Extract shared logic into a pure helper function.
- If the logic differs slightly per location, parameterize the differences.
- Replace 4 inline usages with calls to the helper.
- Write a unit test for the helper.

### Step 3 — Extract collision helper from decorations.ts
- Read `src/lib/actions/decorations.ts`, locate duplicate collision logic.
- Extract into a function (either in decorations.ts itself or a `decorations-utils.ts`).
- Replace all duplicate usages.

### Step 4 — Audit and consolidate progression modules
- Read all three files: `progression.ts`, `xp-system.ts`, `progression-system.ts`.
- Grep imports: `grep -rn "progression'" src/` and `grep -rn "xp-system" src/` and `grep -rn "progression-system" src/`.
- Identify which is actually imported. Mark `progression.ts` import count.
- If `progression.ts` is truly unused: check for any unique functions → merge into canonical → delete file.
- If `xp-system.ts` and `progression-system.ts` overlap: document in DEVLOG but don't merge now (scope risk). Create a TODO comment at the top of the orphan.

### Step 5 — Delete archived files
- Find files with "(archieved)" in name: `glob "src/**/*archieved*"` or `glob "src/**/*archived*"`.
- Confirm none are imported anywhere.
- Delete each.
- Also check `components.md` archived list for other files that may still exist.

### Step 6 — Fix inventory-context type casts
- Read `src/lib/context/inventory-context.tsx`.
- Identify `as SomeType` casts.
- For each: determine if the cast is hiding a real type mismatch (fix the type) or bridging a known-safe type gap (add a comment or use a type guard).
- Replace `as` casts with proper type narrowing where possible.

### Step 7 — Final lint + typecheck
- `npm run lint`
- `npm run typecheck` / `tsc --noEmit`
- Fix any errors introduced.

---

## Todo List
- [ ] Grep all select('*') violations — list all 14 locations
- [ ] Fix each select('*') with explicit column list
- [ ] Extract watering effect helper from plants-context.tsx
- [ ] Extract collision helper from decorations.ts
- [ ] Audit progression.ts import count
- [ ] Delete progression.ts if confirmed orphan (merge unique logic first)
- [ ] Glob for archived files, confirm not imported, delete
- [ ] Fix inventory-context type casts
- [ ] Run lint + typecheck — clean

---

## Success Criteria
- Zero `select('*')` calls in `src/lib/actions/`.
- Watering effect logic exists in exactly one place.
- Decoration collision logic exists in exactly one place.
- `progression.ts` deleted (or documented as intentionally kept).
- No archived/dead files in `src/`.
- No `as` casts in inventory-context that hide type errors.
- TypeScript compilation clean.

---

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| select() column list misses a used column | Medium | Medium | TypeScript narrowing will surface it at compile time |
| Watering helper extraction changes subtle behavior | Low | Medium | Unit test before and after |
| progression.ts has unique logic not found elsewhere | Medium | Low | Read all three files before deleting |
| Archived file is imported somewhere surprising | Low | High | Always grep imports before deleting |

---

## Security Considerations
- Replacing `select('*')` with explicit columns reduces data over-fetching — minor security benefit (don't leak columns client doesn't need).
- No other security impact.

---

## Next Steps
→ Phase 09: Polish & A11y (final cleanup)

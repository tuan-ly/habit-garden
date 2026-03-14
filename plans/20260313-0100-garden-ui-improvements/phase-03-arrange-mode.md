# Phase 03: Arrange Mode Merge

> **Parent**: [plan.md](plan.md)
> **Dependencies**: Phase 02 (nav changes)
> **Priority**: Medium
> **Status**: Pending
> **Review**: Not started

## Overview

Merge `edit` and `decorate` modes into single `arrange` mode. One button replaces two. In arrange mode, user can move plants, add plants, place/move/pickup decorations — all from one unified editing experience with a bottom tray.

## Key Insights

- Current: `GardenMode = 'interact' | 'edit' | 'decorate'` — 3 modes, 2 buttons
- `edit` mode: plant move/add via `useGardenInteractions.handleTileClick`
- `decorate` mode: decoration placement via `EditModeOverlay` + `useEditMode`
- These are already in the same `IsometricGarden` — mode just gates which logic runs
- `EditModeOverlay` has `InventoryPanel` (bottom drawer) for decoration selection
- `useEditMode` manages: selectedItem, ghostPosition, ghostRotation, undoStack
- `useGardenInteractions` manages: moveState (selectedPlant, previewCell)
- Merging means both plant-move AND decoration-place logic active simultaneously

## Requirements

### 3a. GardenMode Type Change
- `GardenMode = 'interact' | 'arrange'` (remove 'edit' and 'decorate')
- Single "Arrange" button in ModeToolbar
- All files importing/checking GardenMode updated

### 3b. Arrange Mode Behavior
- Tap existing plant → select for move (existing edit behavior)
- Tap existing decoration → select for move/pickup (existing decorate behavior)
- Tap empty tile → context-dependent:
  - If decoration selected in tray → place decoration
  - If no selection → show "+" add plant hint (existing edit behavior)
- Bottom tray visible with Plants/Decorations sub-tabs
- "Done" button exits to interact mode
- Undo stack for decoration actions (existing)

### 3c. Bottom Tray
- Positioned above nav bar
- Two sub-tabs: "Plants" (add button) | "Decorations" (inventory)
- Decorations tab: reuse existing `InventoryPanel`
- Plants tab: "Add Plant" trigger (existing `AddPlantDialog`)

## Architecture

```
IsometricGarden (mode = 'interact' | 'arrange')
├── ModeToolbar (1 button: Arrange)
├── GardenTileGrid (mode)
│   └── handleTileClick:
│       arrange mode:
│         if selectedDecoration → place on tile
│         elif selectedPlant → move to tile
│         elif tile has plant → select for move
│         elif tile has decoration → select for move/pickup
│         elif empty → open AddPlantDialog
├── ArrangeOverlay (isActive = mode === 'arrange')
│   ├── ArrangeToolbar (top: Undo, Grid, Rotate, Done)
│   └── ArrangeTray (bottom)
│       ├── Tab: "Plants" → AddPlant button
│       └── Tab: "Decorations" → InventoryPanel
└── useEditMode (decoration placement state)
```

## Related Code Files

| File | Action | Change |
|------|--------|--------|
| `src/components/garden/mode-toolbar.tsx` | Modify | 1 button, type = `'interact' \| 'arrange'` |
| `src/components/garden/isometric-garden.tsx` | Modify | Replace 'edit'/'decorate' with 'arrange' |
| `src/components/garden/garden-tile-grid.tsx` | Modify | `mode === 'edit'` → `mode === 'arrange'` |
| `src/hooks/use-garden-interactions.ts` | Modify | Merge edit+decorate handling in 'arrange' case |
| `src/components/garden/edit-mode/edit-mode-overlay.tsx` | Modify | Rename to ArrangeOverlay, activate on 'arrange' |
| `src/components/garden/edit-mode/edit-mode-toolbar.tsx` | Modify | Minor rename/restyle |
| `src/components/inventory/inventory-panel.tsx` | Read | Reuse in arrange tray |
| Legacy `src/components/garden/garden-mode-toolbar.tsx` | Delete | Dead code (unused explore/water/edit modes) |

## Implementation Steps

### Step 1: Update GardenMode Type

1. **`mode-toolbar.tsx`**: Change type export:
   ```typescript
   export type GardenMode = 'interact' | 'arrange'
   ```

2. **`mode-toolbar.tsx`**: Single button:
   ```typescript
   <button
     onClick={() => onModeChange(isArranging ? 'interact' : 'arrange')}
     className={cn(
       '...w-14 h-14 rounded-xl...',
       isArranging
         ? 'bg-gradient-to-br from-amber-500 to-emerald-500 text-white shadow-lg shadow-amber-500/30'
         : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50'
     )}
     title={isArranging ? 'Done arranging' : 'Arrange garden'}
   >
     <Pencil className="w-5 h-5" />
     <span className="text-[10px]">Arrange</span>
   </button>
   ```

### Step 2: Update IsometricGarden

1. Replace all `mode === 'edit'` checks with `mode === 'arrange'`
2. Replace all `mode === 'decorate'` checks with `mode === 'arrange'`
3. `EditModeOverlay` isActive: `mode === 'arrange'`
4. Ensure `setModeWithReset` resets both moveState and editMode state

### Step 3: Update GardenTileGrid

1. `showAddHint={mode === 'arrange' && !moveState.selectedPlant && !editModeSelectedItem}`
   - Show "+" only when no plant or decoration is selected for placement
2. All `mode === 'edit'` → `mode === 'arrange'`

### Step 4: Update useGardenInteractions

Merge edit + decorate logic into 'arrange' case:
```typescript
case 'arrange':
  // Priority 1: Placing a decoration from inventory
  if (editMode.selectedItem && !plant) {
    // Handled by EditModeOverlay tile click
    return
  }
  // Priority 2: Moving a selected plant
  if (moveState.selectedPlant) {
    if (moveState.selectedPlant.id === plant?.id) {
      cancelMoveSelection()
    } else {
      confirmMove(row, col)
    }
  }
  // Priority 3: Select existing plant for move
  else if (plant) {
    selectPlantForMove(plant)
  }
  // Priority 4: Click decoration (handled by overlay)
  else if (decoration) {
    // delegate to edit mode overlay handler
    return
  }
  // Priority 5: Empty tile with no selection → add plant
  else {
    setAddDialogOpen(true)
    setAddDialogPosition({ row, col })
  }
  break
```

### Step 5: Rename EditModeOverlay → ArrangeOverlay

1. Rename component (optional — can keep filename, just update usage)
2. Keep existing functionality: toolbar (undo/grid/rotate/done), inventory panel
3. Add "Plants" sub-tab to inventory panel with AddPlant trigger
4. "Done" button calls `onModeChange('interact')`

### Step 6: Cleanup

1. Delete `garden-mode-toolbar.tsx` (dead code with old explore/water/edit types)
2. Search codebase for any remaining 'edit'|'decorate' mode references
3. Update any TypeScript type imports

## Todo

- [ ] Update `GardenMode` type to `'interact' | 'arrange'`
- [ ] Refactor `ModeToolbar` to single button
- [ ] Update `isometric-garden.tsx` mode checks
- [ ] Update `garden-tile-grid.tsx` mode checks
- [ ] Merge edit+decorate handling in `use-garden-interactions.ts`
- [ ] Update `EditModeOverlay` activation to `mode === 'arrange'`
- [ ] Add Plants sub-tab to inventory/arrange tray
- [ ] Delete dead `garden-mode-toolbar.tsx`
- [ ] Grep for leftover 'edit'|'decorate' string references
- [ ] Visual test: single Arrange button works
- [ ] Visual test: can move plants in arrange mode
- [ ] Visual test: can place decorations in arrange mode
- [ ] Visual test: bottom tray shows both tabs

## Success Criteria

- Only 1 mode button (Arrange) on left toolbar
- Entering arrange mode enables both plant and decoration editing
- Bottom tray has Plants/Decorations tabs
- Undo works for decoration actions
- "Done" returns to interact mode
- No 'edit' or 'decorate' string references in codebase (except comments)
- No TypeScript errors

## Risk Assessment

- **Medium**: Merging two interaction systems that currently operate independently
  - **Mitigation**: Priority-based click handling (decoration placement > plant move > add plant)
- **Medium**: Potential conflicts between moveState (plants) and editMode (decorations)
  - **Mitigation**: Clear one when the other activates (selecting plant deselects decoration and vice versa)
- **Low**: Dead code cleanup might miss references
  - **Mitigation**: Grep sweep for 'edit' | 'decorate' mode strings

## Security Considerations

None — UI-only changes. Server actions unchanged.

## Next Steps

After all 3 phases:
- Test full arrange mode flow
- Generate plant/decoration PNG assets
- Run migration on Supabase

## Commit

```
refactor: merge edit and decorate modes into single arrange mode
```

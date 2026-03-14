# Phase 01: Shadow Bug Fix

> **Parent**: [plan.md](plan.md)
> **Priority**: High (visual bug)
> **Status**: Pending
> **Review**: Not started

## Overview

Shadows render on tiles with decorations but no plants. Root cause: shadow triggers on `{children && ...}` but both `<IsometricPlant>` and `<DecorationImage>` are passed as children.

## Key Insights

- Shadow code at `isometric-tile.tsx:181`: `{children && (...)}`
- `garden-tile-grid.tsx:98-113`: passes plants AND decorations as children
- Shadow uses `plantGridSize` for scaling — incorrect for decorations
- Fix: explicit `shadowType` prop instead of inferring from children presence

## Requirements

- Plant tiles: keep existing shadow (radial gradient ellipse)
- Decoration tiles: smaller/lighter shadow or no shadow
- Empty tiles: no shadow
- No visual regression for plant shadows

## Architecture

```
GardenTileGrid
  → IsometricTile(shadowType='plant')   when plant && isAnchor
  → IsometricTile(shadowType='small')   when decoration && !plant
  → IsometricTile(shadowType='none')    default (empty)
```

## Related Code Files

| File | Action | Change |
|------|--------|--------|
| `src/components/garden/isometric-tile.tsx` | Modify | Add `shadowType` prop, update shadow render logic |
| `src/components/garden/garden-tile-grid.tsx` | Modify | Pass `shadowType` based on tile content |

## Implementation Steps

1. **`isometric-tile.tsx`** — Add prop to interface:
   ```typescript
   shadowType?: 'plant' | 'small' | 'none'  // default 'none'
   ```

2. **`isometric-tile.tsx`** — Replace shadow render (line 181):
   ```typescript
   // Before: {children && (
   // After:
   {shadowType && shadowType !== 'none' && (
     <div
       className="absolute pointer-events-none rounded-full"
       style={{
         left: tileSize / 2,
         top: tileHitHeight / 2 + getMergedAreaCenterOffset(plantGridSize, tileHitHeight),
         width: tileSize * (shadowType === 'plant'
           ? (0.4 + (plantGridSize - 1) * 0.3)
           : (0.25 + (plantGridSize - 1) * 0.2)),  // 60% size for decorations
         height: tileSize * (shadowType === 'plant'
           ? (0.15 + (plantGridSize - 1) * 0.1)
           : (0.1 + (plantGridSize - 1) * 0.06)),
         transform: 'translate(-50%, -50%)',
         background: shadowType === 'plant'
           ? 'radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)'
           : 'radial-gradient(ellipse, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.05) 50%, transparent 100%)',
       }}
     />
   )}
   ```

3. **`garden-tile-grid.tsx`** — Pass shadowType to IsometricTile:
   ```typescript
   shadowType={plant && isAnchor ? 'plant' : decoration ? 'small' : 'none'}
   ```

## Todo

- [ ] Add `shadowType` prop to `IsometricTileProps`
- [ ] Update shadow render condition + sizing
- [ ] Pass `shadowType` from `GardenTileGrid`
- [ ] Visual test: plants have correct shadow
- [ ] Visual test: decorations have smaller shadow
- [ ] Visual test: empty tiles have no shadow

## Success Criteria

- No shadow on empty tiles
- Plant shadows unchanged (same gradient, size)
- Decoration tiles have subtle smaller shadow
- No TypeScript errors

## Risk Assessment

- **Low**: Isolated change to 2 files, no logic changes
- Shadow scaling formula may need visual tuning for `small` type

## Security Considerations

None — purely visual change.

## Next Steps

Proceed to Phase 02.

## Commit

```
fix: shadow only renders on plant tiles, smaller shadow for decorations
```

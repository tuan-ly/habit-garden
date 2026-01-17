# Multi-Cell Plants Design

> **Author**: Claude
> **Date**: 2026-01-17
> **Status**: In Progress

---

## Overview

Cây sẽ chiếm nhiều ô vuông trong garden khi trồng càng lâu. Cây mature sẽ chiếm nhiều không gian hơn cây mới trồng, tạo visual hierarchy và reward cho người dùng kiên trì.

---

## Database Schema Changes

### New Fields for `plants` table

```sql
-- Grid positioning and size
grid_size INTEGER NOT NULL DEFAULT 1,  -- 1x1, 2x2, 3x3, etc.
grid_row INTEGER NOT NULL DEFAULT 0,   -- Top-left row position
grid_col INTEGER NOT NULL DEFAULT 0,   -- Top-left col position

-- Keep old position for backward compatibility (optional)
-- position INTEGER  -- Can deprecate later
```

**Field Descriptions:**
- `grid_size`: Number of cells the plant occupies in one dimension (1 = 1x1, 2 = 2x2, 3 = 3x3)
- `grid_row`, `grid_col`: Top-left corner position in the 2D grid
- A plant with `grid_size=2` at `(row=1, col=2)` occupies cells: (1,2), (1,3), (2,2), (2,3)

---

## Growth Expansion Logic

### Default: All plants start at 1x1

When a plant is created, it starts with:
```typescript
{
  grid_size: 1,
  grid_row: <next_available_position_row>,
  grid_col: <next_available_position_col>
}
```

### Expansion Milestones (Future Feature)

Will be configured per plant type later. Example:
```typescript
// In PlantType special_effect
{
  expansion_thresholds: [
    { days: 30, size: 2 },   // After 30 days → 2x2
    { days: 90, size: 3 },   // After 90 days → 3x3
    { days: 180, size: 4 },  // After 180 days → 4x4
  ]
}
```

**User's note**: Milestone logic will be implemented later - focus on structure first.

---

## Grid Algorithm

### Key Requirements

1. **Auto-expansion**: Garden grid expands to fit all plants
2. **No collision**: Plants cannot overlap
3. **Position tracking**: Each plant knows its exact grid position
4. **Efficient layout**: Minimize empty space while allowing growth

### Grid Sizing Algorithm

Current algorithm in `isometric-garden.tsx:21-26`:
```typescript
function getGridSize(plantCount: number): number {
  const minSlots = plantCount + 1  // +1 for empty slot
  const gridSize = Math.ceil(Math.sqrt(minSlots))
  return Math.max(gridSize, 2) // Minimum 2x2
}
```

**New algorithm for multi-cell support**:
```typescript
function calculateRequiredGridSize(plants: PlantWithType[]): number {
  // Calculate total occupied cells
  const totalCells = plants.reduce((sum, p) => sum + (p.grid_size ** 2), 0)

  // Add buffer for growth (25% extra space)
  const withBuffer = Math.ceil(totalCells * 1.25)

  // Find minimum square grid
  const gridSize = Math.ceil(Math.sqrt(withBuffer))

  return Math.max(gridSize, 2) // Minimum 2x2
}
```

### Position Assignment Algorithm

**When creating a new plant**:
1. Find next available position using flood-fill algorithm
2. Check if position has enough space for `grid_size=1`
3. Assign `(grid_row, grid_col)` to the plant

**When a plant expands**:
1. Check if current position has space for larger size
2. If yes: Update `grid_size` in place
3. If no: Find new position that fits, relocate plant
4. If grid is full: Expand grid first, then relocate

---

## Rendering Logic

### Occupied Cells Calculation

```typescript
function getOccupiedCells(plant: PlantWithType): Array<{row: number, col: number}> {
  const cells: Array<{row: number, col: number}> = []

  for (let r = 0; r < plant.grid_size; r++) {
    for (let c = 0; c < plant.grid_size; c++) {
      cells.push({
        row: plant.grid_row + r,
        col: plant.grid_col + c
      })
    }
  }

  return cells
}
```

### Collision Detection

```typescript
function hasCollision(
  newPlant: { grid_row: number, grid_col: number, grid_size: number },
  existingPlants: PlantWithType[]
): boolean {
  const newCells = getOccupiedCells(newPlant as PlantWithType)

  for (const plant of existingPlants) {
    const plantCells = getOccupiedCells(plant)

    // Check if any cell overlaps
    if (newCells.some(nc =>
      plantCells.some(pc => pc.row === nc.row && pc.col === nc.col)
    )) {
      return true
    }
  }

  return false
}
```

### Find Next Available Position

```typescript
function findNextAvailablePosition(
  plants: PlantWithType[],
  gridSize: number,
  newPlantSize: number = 1
): { row: number, col: number } | null {
  // Try each position in the grid
  for (let row = 0; row <= gridSize - newPlantSize; row++) {
    for (let col = 0; col <= gridSize - newPlantSize; col++) {
      const testPlant = { grid_row: row, grid_col: col, grid_size: newPlantSize }

      if (!hasCollision(testPlant, plants)) {
        return { row, col }
      }
    }
  }

  return null // Grid is full
}
```

---

## Visual Rendering Updates

### IsometricGarden Component

**Current**: Uses simple position map `Map<"row-col", Plant>`

**New**: Support multi-cell rendering
```typescript
// Build occupied cells map
const occupiedCells = new Map<string, PlantWithType>()

plants.forEach(plant => {
  const cells = getOccupiedCells(plant)
  cells.forEach(cell => {
    occupiedCells.set(`${cell.row}-${cell.col}`, plant)
  })
})

// Render tiles
tiles.forEach(tile => {
  const plant = occupiedCells.get(`${tile.row}-${tile.col}`)
  const isAnchor = plant && plant.grid_row === tile.row && plant.grid_col === tile.col

  return (
    <IsometricTile>
      {isAnchor && <IsometricPlant plant={plant} />}
      {/* Only render plant at its anchor position (top-left) */}
    </IsometricTile>
  )
})
```

### IsometricPlant Component

**Scale based on grid_size**:
```typescript
// Current: Scale based on growth percentage (0.6 → 1.0)
// New: Scale based on BOTH growth_percentage AND grid_size

function getPlantScale(plant: PlantWithType): number {
  // Base scale from growth
  const growthScale = getGrowthScale(plant.growth_percentage) // 0.6 → 1.0

  // Size multiplier for multi-cell plants
  const sizeMultiplier = plant.grid_size // 1, 2, 3, 4...

  return growthScale * sizeMultiplier
}
```

**Positioning**: Plant should span across its cells visually
```tsx
<div
  style={{
    transform: `scale(${getPlantScale(plant)})`,
    transformOrigin: 'bottom center',
  }}
>
  <PlantVisual plant={plant} />
</div>
```

---

## Migration Strategy

### Phase 1: Add Database Fields ✅

```sql
ALTER TABLE plants
ADD COLUMN grid_size INTEGER NOT NULL DEFAULT 1,
ADD COLUMN grid_row INTEGER NOT NULL DEFAULT 0,
ADD COLUMN grid_col INTEGER NOT NULL DEFAULT 0;
```

### Phase 2: Migrate Existing Data ✅

Convert old `position` to `(grid_row, grid_col)`:
```typescript
// Assuming old grid was calculated the same way
plants.forEach((plant, index) => {
  const oldGridSize = getGridSize(totalPlants)
  const row = Math.floor(index / oldGridSize)
  const col = index % oldGridSize

  updatePlant(plant.id, {
    grid_row: row,
    grid_col: col,
    grid_size: 1 // All existing plants are 1x1
  })
})
```

### Phase 3: Update TypeScript Types ✅

Update `Plant` interface in `src/types/database.ts`

### Phase 4: Update Grid Logic ✅

Modify `isometric-garden.tsx` to use new grid algorithm

### Phase 5: Update Plant Actions ✅

Modify `createPlant`, `updatePlant` to handle grid positioning

### Phase 6: Visual Scaling ✅

Update `IsometricPlant` to scale based on `grid_size`

### Phase 7: Testing ✅

Test various scenarios:
- Create new plants (auto-positioning)
- Grid expansion
- Collision detection
- Visual rendering

---

## Future Enhancements

### Milestone-based Expansion

To be implemented later per plant type:
```typescript
interface PlantType {
  // ...existing fields
  expansion_milestones?: Array<{
    trigger_type: 'days' | 'waterings' | 'growth_percentage'
    trigger_value: number
    new_size: number
  }>
}
```

Example:
```typescript
{
  name: "Sunflower",
  expansion_milestones: [
    { trigger_type: 'days', trigger_value: 30, new_size: 2 },
    { trigger_type: 'days', trigger_value: 90, new_size: 3 },
  ]
}
```

### Manual Rearrangement

Allow users to drag-and-drop plants to reorganize garden layout.

### Garden Customization

- Different grid patterns (hexagonal, circular)
- Custom backgrounds per garden section
- Plant grouping/zones

---

## Files to Modify

### Database
- [ ] Add migration script or manual schema update
- [ ] Update seed data if needed

### TypeScript Types
- [x] `src/types/database.ts` - Add grid fields to Plant interface

### Grid Logic
- [ ] `src/components/garden/isometric-garden.tsx` - New grid algorithm
- [ ] `src/lib/utils/grid-positioning.ts` - NEW file for grid utilities

### Rendering
- [ ] `src/components/garden/isometric-plant.tsx` - Scale based on grid_size
- [ ] `src/components/garden/isometric-tile.tsx` - Handle multi-cell rendering

### Server Actions
- [ ] `src/lib/actions/plants.ts` - Update createPlant, updatePlant

### Context
- [ ] `src/lib/context/plants-context.tsx` - Handle grid position updates

---

## Testing Checklist

- [ ] Create first plant → Should get position (0,0), size 1
- [ ] Create second plant → Should get next available position
- [ ] Create many plants → Grid should expand automatically
- [ ] Manually update plant grid_size → Should re-render correctly
- [ ] Test collision detection → Cannot place plant on occupied cells
- [ ] Test visual scaling → Larger plants should look bigger
- [ ] Test hover states → Should work for all cells of multi-cell plant

---

## Notes

- User prioritizes mature plants staying mature longer (not dying)
- Expansion milestones will be configured per plant type later
- Focus on structure and positioning first, visuals can be polished later
- Garden auto-expansion is already working, need to preserve this behavior

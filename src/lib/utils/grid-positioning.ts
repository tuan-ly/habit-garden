/**
 * Grid Positioning Utilities for Multi-Cell Plants
 *
 * Handles grid layout, collision detection, and position assignment
 * for plants that can occupy multiple cells (1x1, 2x2, 3x3, etc.)
 */

import type { PlantWithType } from '@/types/database'

export interface GridPosition {
  row: number
  col: number
}

export interface GridCell {
  row: number
  col: number
}

export interface PlantGridData {
  grid_size: number
  grid_row: number
  grid_col: number
}

/**
 * Minimal interface for plants used in grid calculations.
 * Allows partial plants (e.g., from Supabase queries with limited fields).
 */
export interface PlantForGrid {
  id?: string
  grid_size?: number | null
  grid_row?: number | null
  grid_col?: number | null
}

/**
 * Calculate minimum grid size needed to fit all plants with buffer
 */
export function calculateRequiredGridSize(plants: PlantForGrid[]): number {
  if (plants.length === 0) return 2 // Minimum 2x2

  // Calculate total occupied cells
  const totalCells = plants.reduce((sum, p) => {
    const size = p.grid_size || 1
    return sum + size * size
  }, 0)

  // Add buffer for growth and new plants (25% extra space)
  const withBuffer = Math.ceil(totalCells * 1.25) + 1 // +1 for at least one empty slot

  // Find minimum square grid
  const gridSize = Math.ceil(Math.sqrt(withBuffer))

  return Math.max(gridSize, 2) // Minimum 2x2
}

/**
 * Get all cells occupied by a plant
 */
export function getOccupiedCells(plant: PlantGridData): GridCell[] {
  const cells: GridCell[] = []
  const size = plant.grid_size || 1

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      cells.push({
        row: plant.grid_row + r,
        col: plant.grid_col + c,
      })
    }
  }

  return cells
}

/**
 * Check if a plant placement would collide with existing plants
 */
export function hasCollision(
  newPlant: PlantGridData,
  existingPlants: PlantForGrid[],
  excludePlantId?: string
): boolean {
  const newCells = getOccupiedCells(newPlant)

  for (const plant of existingPlants) {
    // Skip the plant we're checking against itself (for resize operations)
    if (excludePlantId && plant.id === excludePlantId) {
      continue
    }

    const plantCells = getOccupiedCells({
      grid_size: plant.grid_size || 1,
      grid_row: plant.grid_row || 0,
      grid_col: plant.grid_col || 0,
    })

    // Check if any cell overlaps
    const hasOverlap = newCells.some((nc) =>
      plantCells.some((pc) => pc.row === nc.row && pc.col === nc.col)
    )

    if (hasOverlap) {
      return true
    }
  }

  return false
}

/**
 * Find next available position for a plant of given size
 */
export function findNextAvailablePosition(
  plants: PlantForGrid[],
  gridSize: number,
  plantSize: number = 1
): GridPosition | null {
  // Try each position in the grid (row-major order)
  for (let row = 0; row <= gridSize - plantSize; row++) {
    for (let col = 0; col <= gridSize - plantSize; col++) {
      const testPlant: PlantGridData = {
        grid_row: row,
        grid_col: col,
        grid_size: plantSize,
      }

      if (!hasCollision(testPlant, plants)) {
        return { row, col }
      }
    }
  }

  return null // Grid is full
}

/**
 * Build a map of which plant occupies each cell
 * Returns Map<"row-col", PlantWithType>
 */
export function buildOccupiedCellsMap(
  plants: PlantWithType[]
): Map<string, PlantWithType> {
  const map = new Map<string, PlantWithType>()

  plants.forEach((plant) => {
    const cells = getOccupiedCells({
      grid_size: plant.grid_size || 1,
      grid_row: plant.grid_row || 0,
      grid_col: plant.grid_col || 0,
    })

    cells.forEach((cell) => {
      map.set(`${cell.row}-${cell.col}`, plant)
    })
  })

  return map
}

/**
 * Check if a position is the anchor (top-left) cell of a plant
 */
export function isAnchorCell(plant: PlantWithType, row: number, col: number): boolean {
  return (plant.grid_row || 0) === row && (plant.grid_col || 0) === col
}

/**
 * Calculate visual scale for a plant based on its grid size
 */
export function getPlantSizeScale(gridSize: number): number {
  // Multi-cell plants should be visually larger
  // 1x1 → 1.0x
  // 2x2 → 1.8x (not 2x to avoid too much overlap)
  // 3x3 → 2.5x
  // 4x4 → 3.2x
  return 1 + (gridSize - 1) * 0.8
}

/**
 * Reorganize garden layout to minimize empty space
 * (Optional optimization - can be implemented later)
 */
export function optimizeGridLayout(plants: PlantWithType[]): Map<string, GridPosition> {
  // TODO: Implement smart layout algorithm
  // For now, just return current positions
  const positions = new Map<string, GridPosition>()

  plants.forEach((plant) => {
    positions.set(plant.id, {
      row: plant.grid_row || 0,
      col: plant.grid_col || 0,
    })
  })

  return positions
}

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
 * Calculate minimum grid size needed to fit all plants
 * Grid size is determined by the maximum row/col position of any plant + its size
 * Example: Plant at (4,2) with size 2x2 means grid needs to be at least 6x6
 *
 * @param plants - Array of plants to calculate grid for
 * @param minimumSize - Minimum grid size (level-based). 0 = dynamic (no minimum beyond plants)
 */
export function calculateRequiredGridSize(
  plants: PlantForGrid[],
  minimumSize: number = 0
): number {
  // Find the maximum extent of any plant (position + size)
  let maxExtent = 0
  for (const plant of plants) {
    const row = plant.grid_row || 0
    const col = plant.grid_col || 0
    const size = plant.grid_size || 1

    // The plant extends from (row, col) to (row + size - 1, col + size - 1)
    // So the grid needs to be at least (row + size) and (col + size)
    const rowExtent = row + size
    const colExtent = col + size

    maxExtent = Math.max(maxExtent, rowExtent, colExtent)
  }

  // Add 1 buffer cell for adding new plants (only if there are plants)
  const plantBasedSize = plants.length > 0 ? maxExtent + 1 : 0

  // Use the larger of: plant-based size, minimum size, or absolute minimum (2)
  const effectiveMinimum = minimumSize > 0 ? minimumSize : 2
  return Math.max(plantBasedSize, effectiveMinimum)
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
 * Check if a plant can be placed at a specific position
 * Returns true if the position is valid and doesn't collide with other plants
 */
export function canPlacePlantAt(
  plant: PlantForGrid,
  row: number,
  col: number,
  allPlants: PlantForGrid[],
  gridSize?: number
): boolean {
  const plantSize = plant.grid_size || 1

  // Check bounds if gridSize is provided
  if (gridSize !== undefined) {
    if (row < 0 || col < 0 || row + plantSize > gridSize || col + plantSize > gridSize) {
      return false
    }
  }

  // Check collision with other plants
  const testPlant: PlantGridData = {
    grid_row: row,
    grid_col: col,
    grid_size: plantSize,
  }

  return !hasCollision(testPlant, allPlants, plant.id)
}

/**
 * Move a plant to a new position, checking for collisions
 */
export function validatePlantMove(
  plantId: string,
  newRow: number,
  newCol: number,
  allPlants: PlantForGrid[]
): { valid: boolean; reason?: string } {
  const plant = allPlants.find(p => p.id === plantId)
  if (!plant) {
    return { valid: false, reason: 'Plant not found' }
  }

  const plantSize = plant.grid_size || 1

  // Check negative positions
  if (newRow < 0 || newCol < 0) {
    return { valid: false, reason: 'Position cannot be negative' }
  }

  // Check collision with other plants
  const testPlant: PlantGridData = {
    grid_row: newRow,
    grid_col: newCol,
    grid_size: plantSize,
  }

  if (hasCollision(testPlant, allPlants, plantId)) {
    return { valid: false, reason: 'Position occupied by another plant' }
  }

  return { valid: true }
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

/**
 * Find plants that conflict with a target area
 */
export function getConflictingPlants(
  targetArea: PlantGridData,
  allPlants: PlantForGrid[],
  excludePlantId?: string
): PlantForGrid[] {
  const targetCells = getOccupiedCells(targetArea)
  const conflicting: PlantForGrid[] = []

  for (const plant of allPlants) {
    if (excludePlantId && plant.id === excludePlantId) continue

    const plantCells = getOccupiedCells({
      grid_size: plant.grid_size || 1,
      grid_row: plant.grid_row || 0,
      grid_col: plant.grid_col || 0,
    })

    const hasOverlap = targetCells.some((tc) =>
      plantCells.some((pc) => pc.row === tc.row && pc.col === tc.col)
    )

    if (hasOverlap) {
      conflicting.push(plant)
    }
  }

  return conflicting
}

/**
 * Calculate moves required to displace conflicting plants to nearest empty spots.
 * Returns a map of PlantID -> NewPosition, or null if resolution fails.
 */
export function findDisplacementMoves(
  targetArea: PlantGridData,
  allPlants: PlantForGrid[],
  excludePlantId?: string
): Map<string, GridPosition> | null {
  const moves = new Map<string, GridPosition>()
  
  // 1. Identify direct conflicts
  const conflicts = getConflictingPlants(targetArea, allPlants, excludePlantId)
  if (conflicts.length === 0) return moves // No conflicts (empty map)

  // 2. Clone plant list to simulate state as we move things
  // (We use a simple array for simulation since total plant count is low < 50-100)
  const simulatedPlants = allPlants.map(p => ({ ...p }))

  // Remove the "expanding" plant from simulation so it doesn't block moves
  // (But we must ensure nobody moves INTO the target area)
  // Actually, we treat the targetArea as "occupied" by a virtual plant
  const virtualBlocker: PlantForGrid = {
    id: 'virtual-blocker',
    ...targetArea
  }

  // 3. For each conflicting plant, find nearest empty spot
  for (const conflict of conflicts) {
    if (!conflict.id) continue

    const plantSize = conflict.grid_size || 1
    const startRow = conflict.grid_row || 0
    const startCol = conflict.grid_col || 0
    
    // Find nearest valid position that isn't the current one
    // Spiral search outward from current position
    let found = false
    let radius = 1
    const maxRadius = 10 // Limit search to avoid infinite loops

    while (!found && radius <= maxRadius) {
      // Generate candidates in a spiral (or just expanding box)
      for (let r = -radius; r <= radius; r++) {
        for (let c = -radius; c <= radius; c++) {
          // Check perimeter only (optimization)
          if (Math.abs(r) !== radius && Math.abs(c) !== radius) continue

          const testRow = startRow + r
          const testCol = startCol + c

          if (testRow < 0 || testCol < 0) continue

          // Candidate position
          const candidatePos: PlantGridData = {
            grid_row: testRow,
            grid_col: testCol,
            grid_size: plantSize
          }

          // Check if this position is valid in the SIMULATED state
          // logic: 
          // 1. Must not collide with 'virtualBlocker' (the expanding plant)
          // 2. Must not collide with other plants (stationary ones OR already moved ones)
          
          // Note: In a true "push" system, moving A might push B. 
          // For simplicity v1: We only move immediate neighbors to EMPTY spots. 
          // If a neighbor is blocked by another plant, we simply look further away.
          
          // Temporary list for collision check:
          // - All original plants EXCEPT the one moving
          // - PLUS the virtual blocker
          // - (In a real thorough simulation we'd update `simulatedPlants` as we go)
          
          const currentSimulatedPlants = simulatedPlants.filter(p => p.id !== conflict.id)
          currentSimulatedPlants.push(virtualBlocker)

          if (!hasCollision(candidatePos, currentSimulatedPlants)) {
            // Found a spot!
            moves.set(conflict.id, { row: testRow, col: testCol })
            
            // Update the simulated state for subsequent checks
            const pIndex = simulatedPlants.findIndex(p => p.id === conflict.id)
            if (pIndex >= 0) {
              simulatedPlants[pIndex].grid_row = testRow
              simulatedPlants[pIndex].grid_col = testCol
            }
            
            found = true
            break
          }
        }
        if (found) break
      }
      radius++
    }

    if (!found) {
      // Could not find a spot for this neighbor within reasonable distance
      return null 
    }
  }

  return moves
}

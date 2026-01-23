import { useMemo } from 'react'

interface TileData {
  row: number
  col: number
}

interface UseVisibleTilesParams {
  gridSize: number
  tileSize: number
  zoom: number
  panOffset: { x: number; y: number }
  viewportWidth: number
  viewportHeight: number
  /** Buffer tiles beyond visible area (default 2) */
  buffer?: number
}

/**
 * Calculate visible tiles based on viewport, zoom, and pan offset.
 * Uses isometric coordinate transformation to determine which tiles
 * are within the visible area.
 * 
 * Returns a Set of "row-col" strings for O(1) visibility lookup.
 */
export function useVisibleTiles({
  gridSize,
  tileSize,
  zoom,
  panOffset,
  viewportWidth,
  viewportHeight,
  buffer = 2,
}: UseVisibleTilesParams): Set<string> {
  return useMemo(() => {
    const visibleTiles = new Set<string>()

    // If grid is small, just render all tiles
    if (gridSize <= 6) {
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          visibleTiles.add(`${row}-${col}`)
        }
      }
      return visibleTiles
    }

    // Calculate visible area in garden coordinates
    // The garden is centered in viewport, so we need to account for that
    const containerWidth = gridSize * tileSize
    const containerHeight = gridSize * (tileSize / 2) + tileSize * 0.3

    // Center of the container in screen coordinates
    const centerX = viewportWidth / 2
    const centerY = viewportHeight / 2

    // Transform viewport corners to garden coordinates
    // Account for zoom and pan
    const toGardenCoords = (screenX: number, screenY: number) => {
      // Reverse the transform: screen -> garden
      // transform: scale(zoom) translate(panOffset.x/zoom, panOffset.y/zoom)
      const gardenX = (screenX - centerX) / zoom - panOffset.x / zoom + containerWidth / 2
      const gardenY = (screenY - centerY) / zoom - panOffset.y / zoom + containerHeight / 2
      return { x: gardenX, y: gardenY }
    }

    // Get the visible rectangle in garden coordinates
    const topLeft = toGardenCoords(0, 0)
    const bottomRight = toGardenCoords(viewportWidth, viewportHeight)

    // Convert garden coordinates to grid row/col
    // Isometric formula: 
    // screenX = centerX + (col - row) * (tileSize / 2)
    // screenY = (col + row) * (tileSize / 4)
    // Inverse:
    // row = (screenY / (tileSize/4) - screenX / (tileSize/2)) / 2
    // col = (screenY / (tileSize/4) + screenX / (tileSize/2)) / 2

    const centerXGarden = containerWidth / 2

    const toGridCoords = (x: number, y: number) => {
      // Adjust x relative to center
      const relX = x - centerXGarden
      const yFactor = y / (tileSize / 4)
      const xFactor = relX / (tileSize / 2)
      
      const row = (yFactor - xFactor) / 2
      const col = (yFactor + xFactor) / 2
      
      return { row, col }
    }

    // Calculate min/max row/col from visible corners
    const corners = [
      toGridCoords(topLeft.x, topLeft.y),
      toGridCoords(bottomRight.x, topLeft.y),
      toGridCoords(topLeft.x, bottomRight.y),
      toGridCoords(bottomRight.x, bottomRight.y),
    ]

    let minRow = Infinity, maxRow = -Infinity
    let minCol = Infinity, maxCol = -Infinity

    for (const corner of corners) {
      minRow = Math.min(minRow, corner.row)
      maxRow = Math.max(maxRow, corner.row)
      minCol = Math.min(minCol, corner.col)
      maxCol = Math.max(maxCol, corner.col)
    }

    // Add buffer and clamp to grid bounds
    minRow = Math.max(0, Math.floor(minRow) - buffer)
    maxRow = Math.min(gridSize - 1, Math.ceil(maxRow) + buffer)
    minCol = Math.max(0, Math.floor(minCol) - buffer)
    maxCol = Math.min(gridSize - 1, Math.ceil(maxCol) + buffer)

    // Add all tiles in the visible range
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        visibleTiles.add(`${row}-${col}`)
      }
    }

    return visibleTiles
  }, [gridSize, tileSize, zoom, panOffset.x, panOffset.y, viewportWidth, viewportHeight, buffer])
}

/**
 * Filter tiles array to only include visible tiles.
 */
export function filterVisibleTiles<T extends TileData>(
  tiles: T[],
  visibleTileKeys: Set<string>
): T[] {
  return tiles.filter(tile => visibleTileKeys.has(`${tile.row}-${tile.col}`))
}

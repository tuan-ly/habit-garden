'use client'

import { memo } from 'react'
import { IsometricTile } from './isometric-tile'
import { IsometricPlant, type FocusState } from './isometric-plant'
import { isAnchorCell } from '@/lib/utils/grid-positioning'
import type { PlantWithType, WeatherType } from '@/types/database'
import type { MoveState } from './use-garden-interactions'

interface TileData {
  row: number
  col: number
  plant?: PlantWithType
  isAnchor: boolean
  isOccupiedByMultiCell: boolean
}

interface GardenTileGridProps {
  tiles: TileData[]
  gridSize: number
  tileSize: number
  visibleTileKeys: Set<string>
  hoveredTile: string | null
  mode: 'interact' | 'edit'
  moveState: MoveState
  focusStates?: Map<string, FocusState>
  weather?: WeatherType | null
  onTileClick: (row: number, col: number, plant?: PlantWithType, event?: React.MouseEvent | React.TouchEvent) => void
  onTileHover: (row: number, col: number) => void
  onTileLeave: () => void
  onContextMenu: (e: React.MouseEvent, plant?: PlantWithType) => void
}

export const GardenTileGrid = memo(function GardenTileGrid({
  tiles,
  gridSize,
  tileSize,
  visibleTileKeys,
  hoveredTile,
  mode,
  moveState,
  focusStates,
  weather,
  onTileClick,
  onTileHover,
  onTileLeave,
  onContextMenu,
}: GardenTileGridProps) {
  return (
    <>
      {tiles.map(({ row, col, plant, isAnchor, isOccupiedByMultiCell }) => {
        const tileKey = `${row}-${col}`

        // Skip tiles outside visible area (virtualization)
        if (!visibleTileKeys.has(tileKey)) return null

        const isHovered = hoveredTile === tileKey
        const clickPlant = isOccupiedByMultiCell ? plant : (isAnchor ? plant : undefined)
        const isPartOfMultiCell = plant !== undefined && (plant.grid_size || 1) > 1
        const isSelectedForMove = moveState.selectedPlant?.id === plant?.id
        const isPreviewTile = moveState.previewCell?.row === row && moveState.previewCell?.col === col

        return (
          <IsometricTile
            key={tileKey}
            row={row}
            col={col}
            gridSize={gridSize}
            isEmpty={!plant && !isOccupiedByMultiCell}
            isHovered={isHovered}
            isOccupiedByMultiCell={isOccupiedByMultiCell}
            isPartOfMultiCell={isPartOfMultiCell}
            plantGridSize={plant?.grid_size || 1}
            onClick={(e) => onTileClick(row, col, clickPlant, e)}
            onContextMenu={(e) => onContextMenu(e, clickPlant)}
            onMouseEnter={() => onTileHover(row, col)}
            onMouseLeave={onTileLeave}
            tileSize={tileSize}
            plant={isAnchor ? plant : null}
            hideBadge={isSelectedForMove}
            showAddHint={mode === 'edit' && !moveState.selectedPlant}
            isSelectedForMove={isSelectedForMove}
            previewPlant={isPreviewTile && moveState.selectedPlant && moveState.isValidPreview ? moveState.selectedPlant : undefined}
          >
            {plant && isAnchor && (
              <div className={isSelectedForMove ? 'opacity-40 scale-95 transition-all' : ''}>
                <IsometricPlant
                  plant={plant}
                  weather={weather}
                  focusState={focusStates?.get(plant.id)}
                />
              </div>
            )}
          </IsometricTile>
        )
      })}
    </>
  )
})

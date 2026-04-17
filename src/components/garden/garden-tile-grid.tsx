'use client'

import { memo, useMemo } from 'react'
import { IsometricTile } from './isometric-tile'
import { IsometricPlant, type FocusState } from './isometric-plant'
import { DecorationImage } from './decoration-image'
import { isAnchorCell } from '@/lib/utils/grid-positioning'
import type { PlantWithType, PlacedDecorationWithType, WeatherType } from '@/types/database'
import type { MoveState } from './use-garden-interactions'
import type { GardenMode } from './mode-toolbar'

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
  mode: GardenMode
  moveState: MoveState
  focusStates?: Map<string, FocusState>
  weather?: WeatherType | null
  placedDecorations?: PlacedDecorationWithType[]
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
  placedDecorations = [],
  onTileClick,
  onTileHover,
  onTileLeave,
  onContextMenu,
}: GardenTileGridProps) {
  // Build a map from "row-col" -> decoration (anchor only) for O(1) lookup.
  // Memoized so we don't rebuild the Map on every render (only when decorations change).
  const decorationAnchorMap = useMemo(() => {
    const map = new Map<string, PlacedDecorationWithType>()
    for (const deco of placedDecorations) {
      map.set(`${deco.grid_row}-${deco.grid_col}`, deco)
    }
    return map
  }, [placedDecorations])

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

        // Check if a decoration is anchored at this tile
        const decoration = decorationAnchorMap.get(tileKey)

        return (
          <IsometricTile
            key={tileKey}
            row={row}
            col={col}
            gridSize={gridSize}
            isEmpty={!plant && !isOccupiedByMultiCell && !decoration}
            isHovered={isHovered}
            isOccupiedByMultiCell={isOccupiedByMultiCell}
            isPartOfMultiCell={isPartOfMultiCell}
            plantGridSize={plant?.grid_size || decoration?.grid_size || 1}
            onClick={(e) => onTileClick(row, col, clickPlant, e)}
            onContextMenu={(e) => onContextMenu(e, clickPlant)}
            onMouseEnter={() => onTileHover(row, col)}
            onMouseLeave={onTileLeave}
            tileSize={tileSize}
            plant={isAnchor ? plant : null}
            hideBadge={isSelectedForMove}
            showAddHint={mode === 'arrange' && !moveState.selectedPlant}
            isSelectedForMove={isSelectedForMove}
            previewPlant={isPreviewTile && moveState.selectedPlant && moveState.isValidPreview ? moveState.selectedPlant : undefined}
            shadowType={plant && isAnchor ? 'plant' : decoration ? 'small' : 'none'}
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
            {decoration && !plant && (
              <DecorationImage
                decorationType={decoration.decoration_type}
                size={decoration.grid_size >= 2 ? 'xl' : 'lg'}
                rotation={decoration.rotation}
              />
            )}
          </IsometricTile>
        )
      })}
    </>
  )
})

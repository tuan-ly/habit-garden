'use client'

import { memo, useMemo } from 'react'
import { IsometricTile } from './isometric-tile'
import { IsometricPlant, type FocusState } from './isometric-plant'
import { DecorationImage } from './decoration-image'
import { PlacementGhost } from './edit-mode/placement-ghost'
import type { DecorationRotation, DecorationType, PlantWithType, PlacedDecorationWithType, WeatherType } from '@/types/database'
import type { MoveState } from './use-garden-interactions'
import type { GardenMode } from './mode-toolbar'
import { getPlantSizeScale } from '@/lib/utils/grid-positioning'
import { PlantFocusFrame } from './plant-focus-frame'

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
  onTileClick: (row: number, col: number, plant?: PlantWithType, decoration?: PlacedDecorationWithType, event?: React.MouseEvent | React.TouchEvent) => void
  onTileHover: (row: number, col: number) => void
  onTileLeave: () => void
  onContextMenu: (e: React.MouseEvent, plant?: PlantWithType) => void
  hidePlantBadges?: boolean
  featuredPlantId?: string | null
  focusFrameClosing?: boolean
  hideStatusIndicators?: boolean
  cinematic?: boolean
  selectedDecorationId?: string | null
  placementGhost?: {
    row: number
    col: number
    decorationType: DecorationType
    rotation: DecorationRotation
    isValid: boolean
  } | null
}

export function shouldRenderPlacementGhost(ghostAtTile: boolean, decorationSelected: boolean): boolean {
  return ghostAtTile && !decorationSelected
}

export function isPlantSelectedForMove(
  plantId: string | undefined,
  selectedPlantId: string | undefined
): boolean {
  return plantId !== undefined && selectedPlantId === plantId
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
  hidePlantBadges = false,
  featuredPlantId,
  focusFrameClosing = false,
  hideStatusIndicators = false,
  cinematic = false,
  selectedDecorationId,
  placementGhost,
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
  const decorationCellMap = useMemo(() => {
    const map = new Map<string, PlacedDecorationWithType>()
    for (const deco of placedDecorations) {
      for (let r = 0; r < deco.grid_size; r++) {
        for (let c = 0; c < deco.grid_size; c++) map.set(`${deco.grid_row + r}-${deco.grid_col + c}`, deco)
      }
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
        const isSelectedForMove = isPlantSelectedForMove(plant?.id, moveState.selectedPlant?.id)
        const isPreviewTile = moveState.previewCell?.row === row && moveState.previewCell?.col === col

        // Check if a decoration is anchored at this tile
        const decoration = decorationAnchorMap.get(tileKey)
        const occupyingDecoration = decorationCellMap.get(tileKey)
        const decorationSelected = occupyingDecoration?.id === selectedDecorationId
        const ghostAtTile = placementGhost?.row === row && placementGhost.col === col
        const ghostSize = placementGhost?.decorationType.grid_size || 1
        const decorationPixelSize = decoration
          ? tileSize * (0.62 + decoration.grid_size * 0.62)
          : undefined
        const isFeaturedPlant = plant?.id === featuredPlantId

        return (
          <IsometricTile
            key={tileKey}
            row={row}
            col={col}
            gridSize={gridSize}
            isEmpty={!plant && !isOccupiedByMultiCell && !occupyingDecoration}
            isHovered={isHovered}
            isOccupiedByMultiCell={isOccupiedByMultiCell}
            isPartOfMultiCell={isPartOfMultiCell || (!!occupyingDecoration && occupyingDecoration.grid_size > 1)}
            plantGridSize={plant?.grid_size || decoration?.grid_size || (ghostAtTile ? ghostSize : 1)}
            onClick={(e) => onTileClick(row, col, clickPlant, occupyingDecoration, e)}
            onKeyDown={(e) => {
              if (clickPlant && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                onTileClick(row, col, clickPlant, occupyingDecoration)
              }
            }}
            onContextMenu={(e) => onContextMenu(e, clickPlant)}
            onMouseEnter={() => onTileHover(row, col)}
            onMouseLeave={onTileLeave}
            tileSize={tileSize}
            plant={isAnchor ? plant : null}
            hideBadge={hidePlantBadges || isSelectedForMove}
            showAddHint={mode === 'arrange' && !moveState.selectedPlant}
            isSelectedForMove={isSelectedForMove}
            disableContentHoverScale={Boolean(featuredPlantId) || (mode === 'arrange' && !!decoration)}
            previewPlant={isPreviewTile && moveState.selectedPlant ? moveState.selectedPlant : undefined}
            shadowType={plant && isAnchor ? 'plant' : decoration ? 'small' : 'none'}
            cinematicShadows={cinematic}
            accessibleLabel={decoration ? `Chọn ${decoration.decoration_type.name}` : undefined}
            decorationHitSize={decorationPixelSize}
            previewOverlayGridSize={ghostSize}
            previewOverlay={placementGhost && shouldRenderPlacementGhost(ghostAtTile, decorationSelected) ? (
              <PlacementGhost
                decorationType={placementGhost.decorationType}
                rotation={placementGhost.rotation}
                isValid={placementGhost.isValid}
                pixelSize={tileSize * (0.62 + ghostSize * 0.62)}
              />
            ) : null}
          >
            {plant && isAnchor && (
              <>
                {isFeaturedPlant && (
                  <PlantFocusFrame
                    tileSize={tileSize}
                    gridSize={plant.grid_size || 1}
                    closing={focusFrameClosing}
                  />
                )}
                <div className={isSelectedForMove ? 'relative z-10 opacity-40 scale-95 transition-all' : 'relative z-10'}>
                  <IsometricPlant
                    plant={plant}
                    weather={weather}
                    scale={isFeaturedPlant
                      ? (cinematic ? 3.4 : 1.9) / getPlantSizeScale(plant.grid_size || 1)
                      : 1}
                    focusState={focusStates?.get(plant.id)}
                    hideStatusIndicators={hideStatusIndicators}
                    priority={isFeaturedPlant}
                    cinematic={cinematic}
                  />
                </div>
              </>
            )}
            {decoration && !plant && (
              <div className={decorationSelected ? 'rounded-full opacity-55 ring-4 ring-[#f7d477]/80 transition' : 'transition'}>
                <DecorationImage
                  decorationType={decoration.decoration_type}
                  size={decoration.grid_size >= 2 ? 'xl' : 'lg'}
                  rotation={decoration.rotation}
                  pixelSize={decorationPixelSize}
                  grounded
                />
              </div>
            )}
          </IsometricTile>
        )
      })}
    </>
  )
})

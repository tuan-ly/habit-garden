'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { PlantWithType } from '@/types/database'
import { PlantOverlayBadge } from './plant-overlay-badge'
import { IsometricPlant } from './isometric-plant'
import { Plus } from 'lucide-react'

interface IsometricTileProps {
  row: number
  col: number
  gridSize: number
  isEmpty: boolean
  isHovered: boolean
  /** True if this cell is occupied by a multi-cell plant but is not the anchor */
  isOccupiedByMultiCell?: boolean
  /** True if this tile is part of a multi-cell plant (including anchor) */
  isPartOfMultiCell?: boolean
  /** Plant grid size for positioning and shadow scaling (default 1) */
  plantGridSize?: number
  onClick: (e: React.MouseEvent) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  onContextMenu?: (e: React.MouseEvent) => void
  children?: React.ReactNode
  tileSize?: number
  /** Plant data for badge (optional - only needed when plant exists) */
  plant?: PlantWithType | null
  /** Hide badge (e.g., when dragging) */
  hideBadge?: boolean
  /** Show add hint on empty tiles (when in add mode) */
  showAddHint?: boolean
  /** True if this plant is selected for moving (show "lifted" effect) */
  isSelectedForMove?: boolean
  /** Keep placeable objects at their authored size while arranging them. */
  disableContentHoverScale?: boolean
  /** Preview plant to show faded on this tile (for move preview) */
  previewPlant?: PlantWithType
  /** Decoration preview rendered independently from the tile's real content. */
  previewOverlay?: React.ReactNode
  previewOverlayGridSize?: number
  /** Enlarged click target for a decoration whose art extends above the tile. */
  decorationHitSize?: number
  accessibleLabel?: string
  /** Shadow type: 'plant' for full shadow, 'small' for decoration shadow, 'none' (default) for no shadow */
  shadowType?: 'plant' | 'small' | 'none'
  cinematicShadows?: boolean
}

/**
 * Calculate the Y offset to position elements at the CENTER of a merged multi-cell area.
 *
 * ISOMETRIC COORDINATE SYSTEM:
 * - Anchor tile is at grid position (row, col), rendered at the top of the merged diamond
 * - Center of NxN area is at grid position (row + (N-1)/2, col + (N-1)/2)
 * - In screen Y: each +1 row adds tileHitHeight/2, each +1 col adds tileHitHeight/2
 * - Total Y offset from anchor to center = (N-1)/2 * tileHitHeight/2 * 2 = (N-1) * tileHitHeight / 2
 *
 * VALUES:
 * - 1x1: offset = 0 (center = anchor)
 * - 2x2: offset = tileHitHeight / 2
 * - 3x3: offset = tileHitHeight
 */
function getMergedAreaCenterOffset(plantGridSize: number, tileHitHeight: number): number {
  return (plantGridSize - 1) * tileHitHeight / 2
}

export function getTileContentScale(
  isHovered: boolean,
  isSelectedForMove: boolean,
  disableContentHoverScale: boolean
): number {
  return isHovered && !isSelectedForMove && !disableContentHoverScale ? 1.2 : 1
}

/** Keep the footprint shadow proportional to the visible growth stage. */
export function getPlantShadowScale(growthPercentage: number): number {
  if (growthPercentage < 10) return 0.46
  if (growthPercentage < 25) return 0.58
  if (growthPercentage < 50) return 0.72
  if (growthPercentage < 75) return 0.86
  if (growthPercentage < 100) return 0.95
  return 1
}

function IsometricTileComponent({
  row,
  col,
  gridSize,
  isEmpty,
  isHovered,
  isOccupiedByMultiCell = false,
  isPartOfMultiCell = false,
  plantGridSize = 1,
  onClick,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  onContextMenu,
  children,
  tileSize = 60,
  plant,
  hideBadge = false,
  showAddHint = false,
  isSelectedForMove = false,
  disableContentHoverScale = false,
  previewPlant,
  previewOverlay,
  previewOverlayGridSize = 1,
  decorationHitSize,
  accessibleLabel,
  shadowType = 'none',
  cinematicShadows = false,
}: IsometricTileProps) {
  // Isometric tile positioning:
  // The grid's top point (0,0) is at the top-center of the diamond
  // Each tile's center position:
  //   x = (col - row) * tileSize/2   (relative to center)
  //   y = (col + row) * tileSize/4   (from top)
  //
  // Container is gridSize * tileSize wide, so center is at gridSize * tileSize / 2

  const containerWidth = gridSize * tileSize
  const centerX = containerWidth / 2

  // Position of this tile's center point (top of the diamond shape)
  const tileCenterX = centerX + (col - row) * (tileSize / 2)
  const tileCenterY = (col + row) * (tileSize / 4)

  const tileHitHeight = tileSize / 2
  const plantShadowScale = getPlantShadowScale(plant?.growth_percentage ?? 100)

  return (
    <button
      type="button"
      data-grid-row={row}
      data-grid-col={col}
      tabIndex={plant || accessibleLabel ? 0 : -1}
      aria-label={accessibleLabel || (plant ? `Đến thăm ${plant.name}` : undefined)}
      className={cn(
        'absolute cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-none',
        (plant || accessibleLabel) && 'focus-visible:ring-2 focus-visible:ring-[#f6edb0] focus-visible:ring-offset-4 focus-visible:ring-offset-transparent'
      )}
      style={{
        left: tileCenterX,
        top: tileCenterY,
        width: tileSize,
        height: tileHitHeight,
        transform: 'translate(-50%, 0)', // Align from top-center
        // Plant anchors must stay above neighboring transparent tile hit areas.
        zIndex: row + col + (plant || decorationHitSize ? 100 : 10),
      }}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onContextMenu={onContextMenu}
      onMouseEnter={onMouseEnter}
      onMouseMove={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onPointerEnter={onMouseEnter}
      onPointerMove={onMouseEnter}
    >
      {/* Invisible hit area - diamond shape matching isometric tile */}
      <svg
        width={tileSize}
        height={tileSize / 2}
        viewBox={`0 0 ${tileSize} ${tileSize / 2}`}
        className="absolute top-0 left-0"
      >
        <polygon
          points={`
            ${tileSize / 2},0
            ${tileSize},${tileSize / 4}
            ${tileSize / 2},${tileSize / 2}
            0,${tileSize / 4}
          `}
          fill="transparent"
          className={cn(
            'transition-all duration-200',
            // Only show hover fill for non-multi-cell tiles (multi-cell handled by GroundPlane)
            isHovered && !isPartOfMultiCell && 'fill-white/10'
          )}
        />
      </svg>

      {decorationHitSize && (
        <span
          aria-hidden="true"
          className="absolute left-1/2 pointer-events-auto"
          data-decoration-hit-area="true"
          style={{
            bottom: tileHitHeight / 2,
            width: decorationHitSize * 0.62,
            height: decorationHitSize * 0.78,
            transform: 'translateX(-50%)',
          }}
        />
      )}

      {/* Simple hover highlight - scales for multi-cell plants */}
      {isHovered && !isOccupiedByMultiCell && !isPartOfMultiCell && (
        <svg
          width={tileSize}
          height={tileSize / 2}
          viewBox={`0 0 ${tileSize} ${tileSize / 2}`}
          className="absolute top-0 left-0 pointer-events-none overflow-visible"
        >
          {(() => {
            const size = previewPlant?.grid_size || 1
            const top = ` ${tileSize / 2},0`
            const right = ` ${tileSize / 2 + size * tileSize / 2},${size * tileSize / 4}`
            const bottom = ` ${tileSize / 2},${size * tileSize / 2}`
            const left = ` ${tileSize / 2 - size * tileSize / 2},${size * tileSize / 4}`

            return (
              <polygon
                points={`${top} ${right} ${bottom} ${left}`}
                fill="rgba(134,239,172,0.15)"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="2"
              />
            )
          })()}
        </svg>
      )}

      {/* Hint for empty tiles - shows plus only on hover in add mode */}
      {isEmpty && !isOccupiedByMultiCell && showAddHint && isHovered && (
        <div
          className="absolute flex items-center justify-center pointer-events-none"
          style={{
            left: tileSize / 2,
            top: tileHitHeight / 2,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center bg-emerald-500 text-white shadow-md">
            <Plus className="h-4 w-4" />
          </div>
        </div>
      )}

      {/* Plant/decoration shadow — ground contact ellipse with offset for directional light */}
      {shadowType !== 'none' && (
        <>
          {shadowType === 'plant' && cinematicShadows && (
            <div
              className="absolute pointer-events-none rounded-full"
              style={{
                left: tileSize / 2 - tileSize * 0.24 * plantShadowScale,
                top: tileHitHeight / 2 + getMergedAreaCenterOffset(plantGridSize, tileHitHeight) + tileSize * 0.09,
                width: tileSize * (0.88 + (plantGridSize - 1) * 0.44) * plantShadowScale,
                height: tileSize * (0.12 + (plantGridSize - 1) * 0.07) * plantShadowScale,
                transform: 'translate(-50%, -50%) rotate(20deg)',
                background: 'radial-gradient(ellipse at 78% 50%, rgba(35,30,19,0.28) 0%, rgba(35,30,19,0.13) 42%, transparent 78%)',
                filter: 'blur(5px)',
              }}
            />
          )}
          {/* Contact shadow — compact and centered under the object. */}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              left: tileSize / 2,
              top: tileHitHeight / 2 + getMergedAreaCenterOffset(plantGridSize, tileHitHeight) + 1,
              width: tileSize * (shadowType === 'plant'
                ? (0.42 + (plantGridSize - 1) * 0.30) * plantShadowScale
                : (0.32 + (plantGridSize - 1) * 0.24)),
              height: tileSize * (shadowType === 'plant'
                ? (0.14 + (plantGridSize - 1) * 0.10) * plantShadowScale
                : (0.13 + (plantGridSize - 1) * 0.09)),
              transform: 'translate(-50%, -50%)',
              background: shadowType === 'plant'
                ? 'radial-gradient(ellipse, rgba(20,15,8,0.34) 0%, rgba(20,15,8,0.12) 52%, transparent 100%)'
                : 'radial-gradient(ellipse at 42% 55%, rgba(15,10,5,0.30) 0%, rgba(15,10,5,0.08) 55%, transparent 100%)',
              filter: shadowType === 'plant' ? 'blur(3px)' : 'blur(2px)',
            }}
          />
        </>
      )}

      {/*
        Plant container - positioned so the container's BOTTOM is at the shadow center.
      */}
      {children && (
        <div
          className={cn(
            "absolute pointer-events-none flex flex-col items-center transition-transform duration-200",
            isSelectedForMove && "scale-90 -translate-y-2"
          )}
          style={{
            left: tileSize / 2,
            top: tileHitHeight / 2 + getMergedAreaCenterOffset(plantGridSize, tileHitHeight) ,
            transform: `translate(-50%, -100%) scale(${getTileContentScale(isHovered, isSelectedForMove, disableContentHoverScale)})`,
            transformOrigin: 'bottom center',
          }}
        >
          {children}
        </div>
      )}

      {/* Preview plant - faded ghost showing where plant will be placed */}
      {previewPlant && !plant && !isOccupiedByMultiCell && (
        <div
          className="absolute pointer-events-none flex flex-col items-center opacity-50"
          style={{
            left: tileSize / 2,
            top: tileHitHeight / 2 + getMergedAreaCenterOffset(previewPlant.grid_size || 1, tileHitHeight),
            transform: 'translate(-50%, -100%)',
            transformOrigin: 'bottom center',
          }}
        >
          <IsometricPlant plant={previewPlant} />
        </div>
      )}

      {previewOverlay && (
        <div
          className="absolute pointer-events-none flex flex-col items-center"
          data-placement-ghost="true"
          style={{
            left: tileSize / 2,
            top: tileHitHeight / 2 + getMergedAreaCenterOffset(previewOverlayGridSize, tileHitHeight),
            transform: 'translate(-50%, -100%)',
            transformOrigin: 'bottom center',
            zIndex: 20,
          }}
        >
          {previewOverlay}
        </div>
      )}

      {/* Badge - positioned below the plant, scaled with tile size */}
      {plant && children && !hideBadge && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: tileSize / 2,
            // Position below the plant (center of merged area + small offset)
            top: tileHitHeight / 2 + getMergedAreaCenterOffset(plantGridSize, tileHitHeight) + tileSize * 0.05,
            transform: 'translate(-50%, 0)',
            zIndex: 5,
          }}
        >
          <PlantOverlayBadge
            plant={plant}
            tileSize={tileSize}
          />
        </div>
      )}
    </button>
  )
}

export const IsometricTile = memo(IsometricTileComponent)

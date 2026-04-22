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
  /** Preview plant to show faded on this tile (for move preview) */
  previewPlant?: PlantWithType
  /** Shadow type: 'plant' for full shadow, 'small' for decoration shadow, 'none' (default) for no shadow */
  shadowType?: 'plant' | 'small' | 'none'
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
  onMouseEnter,
  onMouseLeave,
  onContextMenu,
  children,
  tileSize = 60,
  plant,
  hideBadge = false,
  showAddHint = false,
  isSelectedForMove = false,
  previewPlant,
  shadowType = 'none',
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

  return (
    <div
      className={cn(
        'absolute cursor-pointer'
      )}
      style={{
        left: tileCenterX,
        top: tileCenterY,
        width: tileSize,
        height: tileHitHeight,
        transform: 'translate(-50%, 0)', // Align from top-center
        zIndex: row + col + 10, // Above ground plane
      }}
      onClick={onClick}
      onContextMenu={onContextMenu}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
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

      {/* Plant/decoration shadow - Art Bible v2.0: cream AO tone #D4C9B0, offset lower-left */}
      {shadowType !== 'none' && (
        <>
          {/* Soft AO halo - creates "cushion" grounding effect */}
          {shadowType === 'plant' && (
            <div
              className="absolute pointer-events-none rounded-full"
              style={{
                left: tileSize / 2,
                top: tileHitHeight / 2 + getMergedAreaCenterOffset(plantGridSize, tileHitHeight),
                width: tileSize * (0.55 + (plantGridSize - 1) * 0.35),
                height: tileSize * (0.22 + (plantGridSize - 1) * 0.14),
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(ellipse at 50% 50%, rgba(212,201,176,0.35) 0%, rgba(212,201,176,0.12) 55%, transparent 100%)',
                filter: 'blur(6px)',
              }}
            />
          )}
          {/* Main shadow ellipse - cream AO, offset lower-left per upper-right light */}
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              left: tileSize / 2,
              top: tileHitHeight / 2 + getMergedAreaCenterOffset(plantGridSize, tileHitHeight),
              width: tileSize * (shadowType === 'plant'
                ? (0.46 + (plantGridSize - 1) * 0.32)
                : (0.28 + (plantGridSize - 1) * 0.22)),
              height: tileSize * (shadowType === 'plant'
                ? (0.17 + (plantGridSize - 1) * 0.11)
                : (0.11 + (plantGridSize - 1) * 0.07)),
              transform: 'translate(-50%, -50%)',
              background: shadowType === 'plant'
                ? 'radial-gradient(ellipse at 40% 60%, rgba(124,94,72,0.38) 0%, rgba(124,94,72,0.14) 55%, transparent 100%)'
                : 'radial-gradient(ellipse at 40% 60%, rgba(124,94,72,0.25) 0%, rgba(124,94,72,0.08) 55%, transparent 100%)',
              filter: 'blur(3px)',
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
            transform: `translate(-50%, -100%) scale(${isHovered && !isSelectedForMove ? 1.20 : 1})`,
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
            todayLogCount={plant.today_log_count}
            todayValue={plant.today_value}
            tileSize={tileSize}
          />
        </div>
      )}
    </div>
  )
}

export const IsometricTile = memo(IsometricTileComponent)

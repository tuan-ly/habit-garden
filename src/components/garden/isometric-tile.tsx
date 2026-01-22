'use client'

import { cn } from '@/lib/utils'
import type { PlantWithType } from '@/types/database'
import { PlantOverlayBadge } from './plant-overlay-badge'

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
  onTouchStart?: (e: React.TouchEvent) => void
  onTouchMove?: (e: React.TouchEvent) => void
  onTouchEnd?: (e: React.TouchEvent) => void
  onMouseDown?: (e: React.MouseEvent) => void
  onMouseMove?: (e: React.MouseEvent) => void
  onMouseUp?: (e: React.MouseEvent) => void
  children?: React.ReactNode
  tileSize?: number
  /** Plant data for badge (optional - only needed when plant exists) */
  plant?: PlantWithType | null
  /** Hide badge (e.g., when dragging) */
  hideBadge?: boolean
  /** Show add hint on empty tiles (when in add mode) */
  showAddHint?: boolean
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

export function IsometricTile({
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
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  children,
  tileSize = 60,
  plant,
  hideBadge = false,
  showAddHint = false,
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
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
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

      {/* Enhanced hover highlight effect with glow - don't show for multi-cell tiles (handled by GroundPlane) */}
      {isHovered && !isOccupiedByMultiCell && !isPartOfMultiCell && (
        <svg
          width={tileSize}
          height={tileSize / 2}
          viewBox={`0 0 ${tileSize} ${tileSize / 2}`}
          className="absolute top-0 left-0 pointer-events-none animate-tile-glow"
        >
          <defs>
            {/* Gradient fill for hover */}
            <linearGradient id="hoverGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
              <stop offset="50%" stopColor="rgba(134,239,172,0.2)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
            </linearGradient>
            {/* Glow filter */}
            <filter id="tileGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          {/* Outer glow */}
          <polygon
            points={`
              ${tileSize / 2},0
              ${tileSize},${tileSize / 4}
              ${tileSize / 2},${tileSize / 2}
              0,${tileSize / 4}
            `}
            fill="none"
            stroke="rgba(134,239,172,0.6)"
            strokeWidth="4"
            filter="url(#tileGlow)"
            className="animate-pulse-slow"
          />
          {/* Main highlight */}
          <polygon
            points={`
              ${tileSize / 2},0
              ${tileSize},${tileSize / 4}
              ${tileSize / 2},${tileSize / 2}
              0,${tileSize / 4}
            `}
            fill="url(#hoverGradient)"
            stroke="rgba(255,255,255,0.6)"
            strokeWidth="1.5"
            className="animate-tile-shimmer"
          />
          {/* Inner shine line */}
          <polygon
            points={`
              ${tileSize / 2},4
              ${tileSize - 8},${tileSize / 4}
              ${tileSize / 2},${tileSize / 2 - 4}
              8,${tileSize / 4}
            `}
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
        </svg>
      )}

      {/* Hint for empty tiles - shows plus in add mode */}
      {isEmpty && !isOccupiedByMultiCell && showAddHint && (
        <div
          className="absolute flex items-center justify-center pointer-events-none"
          style={{
            left: tileSize / 2,
            top: tileHitHeight / 2,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-all",
            isHovered
              ? "bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/40"
              : "bg-emerald-500/30 text-emerald-300"
          )}>
            +
          </div>
        </div>
      )}

      {/* Plant shadow - centered in merged area, scales with plant grid size */}
      {children && (
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: tileSize / 2,
            // Shadow at center of merged area
            top: tileHitHeight / 2 + getMergedAreaCenterOffset(plantGridSize, tileHitHeight),
            // Shadow scales based on plant grid size (1x1→0.4, 2x2→0.7, 3x3→1.0)
            width: tileSize * (0.4 + (plantGridSize - 1) * 0.3),
            height: tileSize * (0.15 + (plantGridSize - 1) * 0.1),
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
          }}
        />
      )}

      {/*
        Plant container - positioned so the container's BOTTOM is at the shadow center.
      */}
      {children && (
        <div
          className={cn(
            "absolute pointer-events-none flex flex-col items-center transition-transform duration-200",
            isHovered && "scale-110"
          )}
          style={{
            left: tileSize / 2,
            // Position slightly above the center of merged area (shadow position)
            top: tileHitHeight / 2 + getMergedAreaCenterOffset(plantGridSize, tileHitHeight) - 2,
            // -100% moves bottom to anchor point
            transform: 'translate(-50%, -100%)',
            transformOrigin: 'bottom center',

            // DEBUG: red border to see container bounds
            // border: '2px solid red',
          }}
        >
          {children}
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

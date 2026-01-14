'use client'

import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

interface IsometricTileProps {
  row: number
  col: number
  gridSize: number
  isEmpty: boolean
  isHovered: boolean
  onClick: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  children?: React.ReactNode
  tileSize?: number
}

export function IsometricTile({
  row,
  col,
  gridSize,
  isEmpty,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  children,
  tileSize = 60,
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

  return (
    <div
      className={cn(
        'absolute cursor-pointer transition-all duration-200'
      )}
      style={{
        left: tileCenterX,
        top: tileCenterY,
        width: tileSize,
        height: tileSize,
        transform: 'translate(-50%, 0)', // Align from top-center
        zIndex: row + col + 10, // Above ground plane
      }}
      onClick={onClick}
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
            isHovered && 'fill-white/10'
          )}
        />
      </svg>

      {/* Hover highlight effect */}
      {isHovered && (
        <svg
          width={tileSize}
          height={tileSize / 2}
          viewBox={`0 0 ${tileSize} ${tileSize / 2}`}
          className="absolute top-0 left-0 pointer-events-none"
        >
          <polygon
            points={`
              ${tileSize / 2},0
              ${tileSize},${tileSize / 4}
              ${tileSize / 2},${tileSize / 2}
              0,${tileSize / 4}
            `}
            fill="rgba(255,255,255,0.15)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
          />
        </svg>
      )}

      {/* Plus icon for empty tiles */}
      {isEmpty && isHovered && (
        <div
          className="absolute flex items-center justify-center pointer-events-none"
          style={{
            left: tileSize / 2,
            top: tileSize / 4,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="bg-white/95 rounded-full p-1.5 shadow-lg border border-green-200 animate-in zoom-in-50 duration-200">
            <Plus className="h-4 w-4 text-green-600" />
          </div>
        </div>
      )}

      {/* Plant shadow - centered on tile */}
      {children && (
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: tileSize / 2,
            top: tileSize / 4,
            width: tileSize * 0.4,
            height: tileSize * 0.15,
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
          }}
        />
      )}

      {/* Plant container - positioned above the tile center */}
      {children && (
        <div
          className={cn(
            "absolute pointer-events-none flex flex-col items-center justify-end transition-transform duration-200",
            isHovered && "scale-110"
          )}
          style={{
            left: tileSize / 2,
            top: tileSize / 4,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

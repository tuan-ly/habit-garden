'use client'

import { cn } from '@/lib/utils'
import { Plus } from 'lucide-react'

interface IsometricTileProps {
  row: number
  col: number
  isEmpty: boolean
  isHovered: boolean
  onClick: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
  children?: React.ReactNode
  tileSize?: number
  grassColor?: string
  dirtColor?: string
  dirtDarkColor?: string
}

export function IsometricTile({
  row,
  col,
  isEmpty,
  isHovered,
  onClick,
  onMouseEnter,
  onMouseLeave,
  children,
  tileSize = 60,
  grassColor = '#4ade80',
  dirtColor = '#a3744f',
  dirtDarkColor = '#8b5e3c',
}: IsometricTileProps) {
  // Calculate position in isometric grid
  // x offset: (col - row) * tileWidth/2
  // y offset: (col + row) * tileHeight/4
  const xOffset = (col - row) * (tileSize / 2)
  const yOffset = (col + row) * (tileSize / 4)

  const tileHeight = tileSize * 0.3 // Height of the 3D extrusion

  return (
    <div
      className={cn(
        'absolute cursor-pointer transition-all duration-200',
        isHovered && isEmpty && 'scale-105'
      )}
      style={{
        left: `calc(50% + ${xOffset}px)`,
        top: `calc(50% + ${yOffset}px)`,
        width: tileSize,
        height: tileSize,
        transform: 'translate(-50%, -50%)',
        zIndex: row + col, // Proper layering for isometric view
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* SVG Isometric Tile */}
      <svg
        width={tileSize}
        height={tileSize + tileHeight}
        viewBox={`0 0 ${tileSize} ${tileSize + tileHeight}`}
        className="absolute top-0 left-0"
        style={{ overflow: 'visible' }}
      >
        {/* Top face (grass/ground) - Diamond shape */}
        <polygon
          points={`
            ${tileSize / 2},0
            ${tileSize},${tileSize / 4}
            ${tileSize / 2},${tileSize / 2}
            0,${tileSize / 4}
          `}
          fill={grassColor}
          stroke={isHovered && isEmpty ? '#22c55e' : '#16a34a'}
          strokeWidth={isHovered && isEmpty ? 2 : 1}
          className={cn(
            'transition-all duration-200',
            isHovered && isEmpty && 'brightness-110'
          )}
        />

        {/* Left face (dirt) */}
        <polygon
          points={`
            0,${tileSize / 4}
            ${tileSize / 2},${tileSize / 2}
            ${tileSize / 2},${tileSize / 2 + tileHeight}
            0,${tileSize / 4 + tileHeight}
          `}
          fill={dirtDarkColor}
          stroke="#7a5232"
          strokeWidth={0.5}
        />

        {/* Right face (dirt) */}
        <polygon
          points={`
            ${tileSize / 2},${tileSize / 2}
            ${tileSize},${tileSize / 4}
            ${tileSize},${tileSize / 4 + tileHeight}
            ${tileSize / 2},${tileSize / 2 + tileHeight}
          `}
          fill={dirtColor}
          stroke="#7a5232"
          strokeWidth={0.5}
        />

        {/* Grid lines on top face */}
        <line
          x1={tileSize / 4}
          y1={tileSize / 8}
          x2={tileSize * 3 / 4}
          y2={tileSize * 3 / 8}
          stroke="#22c55e"
          strokeWidth={0.5}
          opacity={0.3}
        />
        <line
          x1={tileSize / 4}
          y1={tileSize * 3 / 8}
          x2={tileSize * 3 / 4}
          y2={tileSize / 8}
          stroke="#22c55e"
          strokeWidth={0.5}
          opacity={0.3}
        />
      </svg>

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
          <div className="bg-white/90 rounded-full p-1 shadow-md">
            <Plus className="h-4 w-4 text-green-600" />
          </div>
        </div>
      )}

      {/* Plant container - positioned on top of the tile */}
      {children && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: tileSize / 2,
            top: tileSize / 4 - 10, // Position plant slightly above tile surface
            transform: 'translate(-50%, -100%)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  )
}

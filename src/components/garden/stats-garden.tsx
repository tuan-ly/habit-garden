'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { GardenSky } from './garden-sky'
import { WeatherEffects } from './weather-effects'
import { GroundPlaneCanvas } from './ground-plane-canvas'
import { StatsBadge } from './stats-badge'
import { PlantImage, getGrowthStage } from '@/components/plants/plant-image'
import type { PlantPeriodStats } from '@/lib/actions/plants'
import type { WeatherType, PlantStatus } from '@/types/database'
import type { TimeOfDay } from './themes'
import { defaultTheme } from './themes'
import { cn } from '@/lib/utils'

interface StatsGardenProps {
  plants: PlantPeriodStats[]
  weather?: WeatherType | null
  className?: string
  skyContained?: boolean
  timeOfDay?: TimeOfDay
  onPlantClick?: (plant: PlantPeriodStats) => void
}

// Calculate grid size based on plant count
function getGridSize(plantCount: number): number {
  if (plantCount === 0) return 2
  const gridSize = Math.ceil(Math.sqrt(plantCount))
  return Math.max(gridSize, 2) // Minimum 2x2
}

// Get responsive tile size
const DEFAULT_TILE_SIZE = 100

function getClientTileSize(): number {
  if (typeof window === 'undefined') return DEFAULT_TILE_SIZE
  const width = window.innerWidth
  if (width < 640) return 70 // Mobile
  if (width < 1024) return 85 // Tablet
  return 100 // Desktop
}

// Get center offset for multi-cell plants
function getMergedAreaCenterOffset(plantGridSize: number, tileHitHeight: number): number {
  return (plantGridSize - 1) * tileHitHeight / 2
}

// Map growth percentage to visual scale
function getGrowthScale(growthPercentage: number): number {
  if (growthPercentage < 10) return 0.6
  if (growthPercentage < 25) return 0.7
  if (growthPercentage < 50) return 0.8
  if (growthPercentage < 75) return 0.9
  if (growthPercentage < 100) return 0.95
  return 1.0
}

// Stats plant visual - simplified version for stats
function StatsPlantVisual({ stats, tileSize }: { stats: PlantPeriodStats; tileSize: number }) {
  const growthScale = getGrowthScale(stats.growth_percentage)
  const gridSizeScale = 1 + (stats.grid_size - 1) * 0.4

  // Create a minimal plant-like object for PlantImage
  const plantForImage = {
    growth_percentage: stats.growth_percentage,
    status: stats.status as PlantStatus,
    plant_type: {
      name: stats.plant_type_name,
      icon: stats.plant_icon,
    },
  }

  return (
    <div
      className="relative transition-transform duration-200 hover:scale-105"
      style={{
        transform: `scale(${growthScale * gridSizeScale})`,
        transformOrigin: 'bottom center',
      }}
    >
      <PlantImage
        plant={plantForImage as any}
        size="lg"
        alignBottom
      />
    </div>
  )
}

// Stats tile - reuses isometric positioning logic
function StatsTile({
  row,
  col,
  gridSize,
  stats,
  tileSize,
  isHovered,
  onMouseEnter,
  onMouseLeave,
  onClick,
}: {
  row: number
  col: number
  gridSize: number
  stats?: PlantPeriodStats
  tileSize: number
  isHovered: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
}) {
  const containerWidth = gridSize * tileSize
  const centerX = containerWidth / 2

  // Isometric position
  const tileCenterX = centerX + (col - row) * (tileSize / 2)
  const tileCenterY = (col + row) * (tileSize / 4)
  const tileHitHeight = tileSize / 2

  const plantGridSize = stats?.grid_size || 1

  return (
    <div
      className={cn(
        'absolute cursor-pointer transition-all duration-200',
        stats && 'hover:z-50'
      )}
      style={{
        left: tileCenterX,
        top: tileCenterY,
        width: tileSize,
        height: tileHitHeight,
        transform: 'translate(-50%, 0)',
        zIndex: row + col + 10,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {/* Hit area */}
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
            isHovered && stats && 'fill-white/15'
          )}
        />
      </svg>

      {/* Hover highlight */}
      {isHovered && stats && (
        <svg
          width={tileSize}
          height={tileSize / 2}
          viewBox={`0 0 ${tileSize} ${tileSize / 2}`}
          className="absolute top-0 left-0 pointer-events-none overflow-visible"
        >
          <polygon
            points={`
              ${tileSize / 2},0
              ${tileSize},${tileSize / 4}
              ${tileSize / 2},${tileSize / 2}
              0,${tileSize / 4}
            `}
            fill="rgba(134,239,172,0.15)"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="2"
          />
        </svg>
      )}

      {/* Plant shadow */}
      {stats && (
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: tileSize / 2,
            top: tileHitHeight / 2 + getMergedAreaCenterOffset(plantGridSize, tileHitHeight),
            width: tileSize * (0.4 + (plantGridSize - 1) * 0.3),
            height: tileSize * (0.15 + (plantGridSize - 1) * 0.1),
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
          }}
        />
      )}

      {/* Plant visual */}
      {stats && (
        <div
          className={cn(
            "absolute pointer-events-none flex flex-col items-center transition-all duration-200",
            isHovered && "scale-110"
          )}
          style={{
            left: tileSize / 2,
            top: tileHitHeight / 2 + getMergedAreaCenterOffset(plantGridSize, tileHitHeight) - 2,
            transform: 'translate(-50%, -100%)',
            transformOrigin: 'bottom center',
          }}
        >
          <StatsPlantVisual stats={stats} tileSize={tileSize} />
        </div>
      )}

      {/* Stats badge */}
      {stats && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: tileSize / 2,
            top: tileHitHeight / 2 + getMergedAreaCenterOffset(plantGridSize, tileHitHeight) + tileSize * 0.05,
            transform: 'translate(-50%, 0)',
            zIndex: 5,
          }}
        >
          <StatsBadge stats={stats} tileSize={tileSize} />
        </div>
      )}
    </div>
  )
}

export function StatsGarden({
  plants,
  weather,
  className,
  skyContained = true,
  timeOfDay,
  onPlantClick,
}: StatsGardenProps) {
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE)
  const [hoveredTile, setHoveredTile] = useState<string | null>(null)

  useEffect(() => {
    const handleResize = () => setTileSize(getClientTileSize())
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate grid size based on plants count
  const gridSize = useMemo(() => {
    return getGridSize(plants.length)
  }, [plants.length])

  // Generate tiles with plants
  const tiles = useMemo(() => {
    const result: { row: number; col: number; stats?: PlantPeriodStats }[] = []
    let plantIndex = 0

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const stats = plants[plantIndex]
        result.push({ row, col, stats })
        plantIndex++
      }
    }
    return result
  }, [gridSize, plants])

  // Container dimensions
  const containerWidth = gridSize * tileSize
  const containerHeight = gridSize * (tileSize / 2) + tileSize * 0.35

  const handleTileClick = useCallback((stats?: PlantPeriodStats) => {
    if (stats && onPlantClick) {
      onPlantClick(stats)
    }
  }, [onPlantClick])

  // Empty state
  if (plants.length === 0) {
    return (
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        <GardenSky weather={weather} contained timeOfDay={timeOfDay} />
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center text-muted-foreground">
            <span className="text-4xl mb-2 block">🏜️</span>
            <p className="text-sm">No activity in this period</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative w-full min-h-0 flex flex-col", className)}>
      {/* Sky background */}
      <GardenSky weather={weather} contained={skyContained} timeOfDay={timeOfDay} />

      {/* Weather effects */}
      {weather && <WeatherEffects weather={weather} contained={skyContained} />}

      {/* Garden container */}
      <div
        className="flex-1 flex items-center justify-center py-8 overflow-x-auto overflow-y-visible relative z-10 custom-scrollbar"
        style={{ minHeight: containerHeight + 100 }}
      >
        <div
          className="relative"
          style={{
            width: containerWidth,
            height: containerHeight,
          }}
        >
          {/* Canvas ground plane */}
          <GroundPlaneCanvas
            gridSize={gridSize}
            tileSize={tileSize}
            grassColor={defaultTheme.ground.primary}
            grassDarkColor={defaultTheme.ground.secondary}
          />

          {/* Tiles with plants */}
          {tiles.map(({ row, col, stats }) => (
            <StatsTile
              key={`${row}-${col}`}
              row={row}
              col={col}
              gridSize={gridSize}
              stats={stats}
              tileSize={tileSize}
              isHovered={hoveredTile === `${row}-${col}`}
              onMouseEnter={() => setHoveredTile(`${row}-${col}`)}
              onMouseLeave={() => setHoveredTile(null)}
              onClick={() => handleTileClick(stats)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

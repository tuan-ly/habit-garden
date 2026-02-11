'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { GardenSky } from './garden-sky'
import { WeatherEffects } from './weather-effects'
import { GroundPlaneCanvas } from './ground-plane-canvas'
import { StatsBadge } from './stats-badge'
import { ZoomControls } from './zoom-controls'
import { PlantImage } from '@/components/plants/plant-image'
import { useGardenZoom } from '@/lib/hooks'
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
  /** Header content to render as floating overlay at top of garden */
  headerContent?: React.ReactNode
}

// Calculate total cells needed for all plants (considering multi-cell plants)
function getTotalCellsNeeded(plants: PlantPeriodStats[]): number {
  return plants.reduce((total, plant) => {
    const size = plant.grid_size || 1
    return total + (size * size)
  }, 0)
}

// Calculate grid size based on total cells needed
function getGridSize(plants: PlantPeriodStats[]): number {
  if (plants.length === 0) return 2
  const totalCells = getTotalCellsNeeded(plants)
  const gridSize = Math.ceil(Math.sqrt(totalCells))
  return Math.max(gridSize, 3) // Minimum 3x3 to accommodate 2x2 plants
}

// Build a grid placement map for plants, handling multi-cell plants
function buildPlantGrid(plants: PlantPeriodStats[], gridSize: number): Map<string, { plant: PlantPeriodStats; isAnchor: boolean }> {
  const grid = new Map<string, { plant: PlantPeriodStats; isAnchor: boolean }>()
  const occupiedCells = new Set<string>()

  // Sort plants by grid_size (larger first for better placement)
  const sortedPlants = [...plants].sort((a, b) => (b.grid_size || 1) - (a.grid_size || 1))

  for (const plant of sortedPlants) {
    const plantSize = plant.grid_size || 1
    let placed = false

    // Find a valid position for this plant
    for (let row = 0; row <= gridSize - plantSize && !placed; row++) {
      for (let col = 0; col <= gridSize - plantSize && !placed; col++) {
        // Check if all cells needed are available
        let canPlace = true
        for (let dr = 0; dr < plantSize && canPlace; dr++) {
          for (let dc = 0; dc < plantSize && canPlace; dc++) {
            const key = `${row + dr}-${col + dc}`
            if (occupiedCells.has(key)) {
              canPlace = false
            }
          }
        }

        if (canPlace) {
          // Place the plant
          for (let dr = 0; dr < plantSize; dr++) {
            for (let dc = 0; dc < plantSize; dc++) {
              const key = `${row + dr}-${col + dc}`
              occupiedCells.add(key)
              grid.set(key, {
                plant,
                isAnchor: dr === 0 && dc === 0, // Top-left is anchor
              })
            }
          }
          placed = true
        }
      }
    }
  }

  return grid
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
function StatsPlantVisual({ stats }: { stats: PlantPeriodStats }) {
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
  isAnchor,
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
  isAnchor: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
}) {
  const containerWidth = gridSize * tileSize
  const centerX = containerWidth / 2

  // Isometric position - add top padding for plants that extend above tiles
  const topPadding = tileSize * 0.8
  const tileCenterX = centerX + (col - row) * (tileSize / 2)
  const tileCenterY = topPadding + (col + row) * (tileSize / 4)
  const tileHitHeight = tileSize / 2

  const plantGridSize = stats?.grid_size || 1

  // For multi-cell plants, calculate the center offset for the merged area
  // The plant is rendered at the visual center of all its cells
  const mergedCenterOffset = getMergedAreaCenterOffset(plantGridSize, tileHitHeight)

  // Only render plant visual at anchor cell (top-left of multi-cell plants)
  const shouldRenderPlant = stats && isAnchor

  return (
    <div
      className={cn(
        'absolute cursor-pointer transition-all duration-200',
        shouldRenderPlant && 'hover:z-50'
      )}
      style={{
        left: tileCenterX,
        top: tileCenterY,
        width: tileSize,
        height: tileHitHeight,
        transform: 'translate(-50%, 0)',
        zIndex: row + col + (shouldRenderPlant ? 10 + plantGridSize * 5 : 10),
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      {/* Hit area - for all tiles (transparent, no highlight - highlight is handled by GroundPlaneCanvas) */}
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
        />
      </svg>

      {/* Plant shadow - only at anchor */}
      {shouldRenderPlant && (
        <div
          className="absolute pointer-events-none rounded-full"
          style={{
            left: tileSize / 2,
            top: tileHitHeight / 2 + mergedCenterOffset,
            width: tileSize * (0.4 + (plantGridSize - 1) * 0.4),
            height: tileSize * (0.15 + (plantGridSize - 1) * 0.15),
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(ellipse, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
          }}
        />
      )}

      {/* Plant visual - only at anchor */}
      {shouldRenderPlant && (
        <div
          className={cn(
            "absolute pointer-events-none flex flex-col items-center transition-all duration-200",
            isHovered && "scale-110"
          )}
          style={{
            left: tileSize / 2,
            top: tileHitHeight / 2 + mergedCenterOffset - 2,
            transform: 'translate(-50%, -100%)',
            transformOrigin: 'bottom center',
          }}
        >
          <StatsPlantVisual stats={stats} />
        </div>
      )}

      {/* Stats badge - only at anchor */}
      {shouldRenderPlant && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: tileSize / 2,
            top: tileHitHeight / 2 + mergedCenterOffset + tileSize * 0.05,
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

// Floating info bar - shows plant info at top of garden when hovering
function StatsPlantInfoBar({ stats }: { stats: PlantPeriodStats | null }) {
  if (!stats) {
    return null
  }

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-50 z-50 pointer-events-none">
      <div className={cn(
        "relative overflow-hidden rounded-2xl shadow-2xl",
        "bg-slate-900/95 border border-slate-700/50",
        "animate-in fade-in zoom-in-95 duration-200"
      )}>
        {/* Gradient accent bar */}
        <div className="h-1 bg-gradient-to-r from-green-500 to-emerald-600" />

        <div className="flex items-center gap-4 px-4 py-2.5">
          {/* Plant icon */}
          <div className="relative">
            <div className="absolute inset-0 blur-xl opacity-50 bg-gradient-to-r from-green-500 to-emerald-600" />
            <span className="relative text-3xl drop-shadow-lg">{stats.plant_icon}</span>
          </div>

          {/* Plant name */}
          <div className="min-w-0">
            <div className="font-bold text-white text-base leading-tight">{stats.plant_name}</div>
            <div className="text-[10px] text-slate-400 font-medium">{stats.plant_type_name}</div>
          </div>

          {/* Divider */}
          <div className="w-px h-8 bg-slate-700" />

          {/* Stats */}
          <div className="flex items-center gap-3">
            {/* Waterings */}
            <div className="text-center">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-sm">💧</span>
                <span className="text-base font-bold tabular-nums text-cyan-400">{stats.watering_count}</span>
              </div>
            </div>

            {/* Growth */}
            <div className="text-center">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-sm">🌱</span>
                <span className="text-base font-bold tabular-nums text-green-400">{Math.round(stats.growth_percentage)}%</span>
              </div>
              <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${stats.growth_percentage}%` }}
                />
              </div>
            </div>

            {/* XP */}
            {stats.total_xp > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 bg-yellow-900/50 rounded-lg border border-yellow-500/30">
                <span className="text-sm">🔥</span>
                <span className="font-bold text-yellow-400 text-sm">{stats.total_xp}</span>
              </div>
            )}
          </div>

          {/* Click hint */}
          <div className="w-px h-8 bg-slate-700" />
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <span>Click</span>
            <span className="text-slate-400">→</span>
          </div>
        </div>
      </div>
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
  headerContent,
}: StatsGardenProps) {
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE)
  const [hoveredPlantId, setHoveredPlantId] = useState<string | null>(null)
  const [hoveredStats, setHoveredStats] = useState<PlantPeriodStats | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Zoom and pan state management with separate storage key for overview
  const {
    zoom,
    minZoom,
    maxZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    isPanning,
    didPan,
    panOffset,
    bindGestures,
    resetDidPan,
  } = useGardenZoom({
    storageKey: 'stats-garden-zoom-level',
    minZoom: 0.4,
    maxZoom: 2.0,
  })

  useEffect(() => {
    const handleResize = () => setTileSize(getClientTileSize())
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Prevent browser zoom on Ctrl+Wheel
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
      }
    }

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [])

  // Calculate grid size based on plants count and sizes
  const gridSize = useMemo(() => {
    return getGridSize(plants)
  }, [plants])

  // Build plant placement grid
  const plantGrid = useMemo(() => {
    return buildPlantGrid(plants, gridSize)
  }, [plants, gridSize])

  // Generate all tiles
  const tiles = useMemo(() => {
    const result: { row: number; col: number; stats?: PlantPeriodStats; isAnchor: boolean }[] = []

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const key = `${row}-${col}`
        const cellData = plantGrid.get(key)
        result.push({
          row,
          col,
          stats: cellData?.plant,
          isAnchor: cellData?.isAnchor ?? false,
        })
      }
    }
    return result
  }, [gridSize, plantGrid])

  // Container dimensions - extra padding for plants and isometric overflow
  const containerWidth = gridSize * tileSize
  const containerHeight = gridSize * (tileSize / 2) + tileSize * 1.2

  const handleTileClick = useCallback((stats?: PlantPeriodStats) => {
    // Don't trigger click if we just panned
    if (didPan) {
      resetDidPan()
      return
    }
    if (stats && onPlantClick) {
      onPlantClick(stats)
    }
  }, [onPlantClick, didPan, resetDidPan])


  const handleTileHover = useCallback((stats?: PlantPeriodStats) => {
    if (stats) {
      setHoveredPlantId(stats.plant_id)
      setHoveredStats(stats)
    } else {
      setHoveredPlantId(null)
      setHoveredStats(null)
    }
  }, [])

  // Get multi-cell areas for hiding grid lines inside merged tiles
  const multiCellAreas = useMemo(() => {
    const areas: { row: number; col: number; size: number }[] = []
    for (const [key, cellData] of plantGrid.entries()) {
      if (cellData.isAnchor && (cellData.plant.grid_size || 1) > 1) {
        const [row, col] = key.split('-').map(Number)
        areas.push({ row, col, size: cellData.plant.grid_size })
      }
    }
    return areas
  }, [plantGrid])

  // Calculate hovered area for GroundPlaneCanvas highlight (all plants including single-cell)
  const hoveredMultiCellArea = useMemo(() => {
    if (!hoveredStats) return null
    const plantSize = hoveredStats.grid_size || 1

    // Find anchor position from plantGrid
    for (const [key, cellData] of plantGrid.entries()) {
      if (cellData.plant.plant_id === hoveredStats.plant_id && cellData.isAnchor) {
        const [row, col] = key.split('-').map(Number)
        return { row, col, size: plantSize }
      }
    }
    return null
  }, [hoveredStats, plantGrid])

  // Empty state
  if (plants.length === 0) {
    return (
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        <GardenSky weather={weather} contained timeOfDay={timeOfDay} />
        {/* Header content overlay */}
        {headerContent && (
          <div className="absolute top-0 left-0 right-0 z-40 pointer-events-auto">
            {headerContent}
          </div>
        )}
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
    <div className={cn("relative w-full min-h-0 flex flex-col select-none", className)}>
      {/* Sky background */}
      <GardenSky weather={weather} contained={skyContained} timeOfDay={timeOfDay} />

      {/* Weather effects */}
      {weather && <WeatherEffects weather={weather} contained={skyContained} />}

      {/* Header content overlay */}
      {headerContent && (
        <div className="absolute top-0 left-0 right-0 z-40 pointer-events-auto">
          {headerContent}
        </div>
      )}

      {/* Zoom controls - positioned over the garden */}
      <ZoomControls
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onReset={resetZoom}
        className="absolute bottom-4 right-4 z-30"
      />

      {/* Garden container with zoom/pan */}
      <div
        ref={containerRef}
        className={cn(
          "flex-1 overflow-hidden relative z-10",
          isPanning && "cursor-grabbing"
        )}
        style={{
          touchAction: 'none', // Disable browser touch actions
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
        }}
        onTouchStart={bindGestures.onTouchStart}
        onTouchMove={bindGestures.onTouchMove}
        onTouchEnd={bindGestures.onTouchEnd}
        onMouseDown={bindGestures.onMouseDown}
        onMouseMove={bindGestures.onMouseMove}
        onMouseUp={bindGestures.onMouseUp}
        onMouseLeave={bindGestures.onMouseLeave}
      >
        {/* Zoomable/Pannable content */}
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
            transformOrigin: 'center center',
            willChange: 'transform',
          }}
        >
          <div
            className="relative"
            style={{
              width: containerWidth,
              height: containerHeight,
            }}
          >
            {/* Canvas ground plane - offset to match tile positioning */}
            <div style={{ position: 'absolute', top: tileSize * 0.8, left: 0 }}>
              <GroundPlaneCanvas
                gridSize={gridSize}
                tileSize={tileSize}
                grassColor={defaultTheme.ground.primary}
                grassDarkColor={defaultTheme.ground.secondary}
                multiCellAreas={multiCellAreas}
                hoveredMultiCellArea={hoveredMultiCellArea}
              />
            </div>

            {/* Tiles with plants */}
            {tiles.map(({ row, col, stats, isAnchor }) => (
              <StatsTile
                key={`${row}-${col}`}
                row={row}
                col={col}
                gridSize={gridSize}
                stats={stats}
                tileSize={tileSize}
                isHovered={!!stats && hoveredPlantId === stats.plant_id}
                isAnchor={isAnchor}
                onMouseEnter={() => handleTileHover(stats)}
                onMouseLeave={() => handleTileHover(undefined)}
                onClick={() => handleTileClick(stats)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Floating info bar - shows plant info at top when hovering */}
      {!isPanning && <StatsPlantInfoBar stats={hoveredStats} />}
    </div>
  )
}

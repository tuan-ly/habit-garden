'use client'

import { useState, useMemo, useEffect } from 'react'
import { GardenSky } from './garden-sky'
import { GroundPlane } from './ground-plane'
import type { WateringLogWithPlant } from '@/lib/actions/plants'
import type { WeatherType } from '@/types/database'
import { defaultTheme } from './themes'
import { cn } from '@/lib/utils'

interface StatsGardenProps {
  waterings: WateringLogWithPlant[]
  weather?: WeatherType | null
  maxDisplay?: number // Max trees to display (default 50)
}

// Calculate grid size based on plant count
function getGridSize(plantCount: number): number {
  if (plantCount === 0) return 2
  const gridSize = Math.ceil(Math.sqrt(plantCount))
  return Math.max(gridSize, 2) // Minimum 2x2
}

// Get responsive tile size
const DEFAULT_TILE_SIZE = 80

function getClientTileSize(): number {
  if (typeof window === 'undefined') return DEFAULT_TILE_SIZE
  const width = window.innerWidth
  if (width < 640) return 50 // Mobile
  if (width < 1024) return 65 // Tablet
  return 80 // Desktop
}

// Mini plant visual - simple version for stats display
function MiniPlant({ watering }: { watering: WateringLogWithPlant }) {
  const icon = watering.plant?.plant_type?.icon || '🌱'

  return (
    <div className="flex flex-col items-center justify-center transition-transform hover:scale-110">
      <span className="text-2xl sm:text-3xl drop-shadow-md">{icon}</span>
    </div>
  )
}

// Isometric tile for stats view
function StatsTile({
  row,
  col,
  gridSize,
  watering,
  tileSize,
}: {
  row: number
  col: number
  gridSize: number
  watering?: WateringLogWithPlant
  tileSize: number
}) {
  // Calculate isometric position
  const x = (col - row) * (tileSize / 2) + (gridSize * tileSize) / 2 - tileSize / 2
  const y = (col + row) * (tileSize / 4)

  return (
    <div
      className="absolute flex items-center justify-center cursor-pointer"
      style={{
        left: x,
        top: y,
        width: tileSize,
        height: tileSize / 2,
        zIndex: row + col,
      }}
    >
      {watering ? (
        <MiniPlant watering={watering} />
      ) : (
        <div className="w-2 h-2 rounded-full bg-green-300/30" />
      )}
    </div>
  )
}

export function StatsGarden({
  waterings,
  weather,
  maxDisplay = 50,
}: StatsGardenProps) {
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE)

  useEffect(() => {
    const handleResize = () => setTileSize(getClientTileSize())
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Limit displayed waterings
  const displayedWaterings = waterings.slice(0, maxDisplay)

  // Calculate grid size based on waterings count
  const gridSize = useMemo(() => {
    return getGridSize(displayedWaterings.length)
  }, [displayedWaterings.length])

  // Generate tiles with waterings
  const tiles = useMemo(() => {
    const result: { row: number; col: number; watering?: WateringLogWithPlant }[] = []
    let wateringIndex = 0

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const watering = displayedWaterings[wateringIndex]
        result.push({ row, col, watering })
        wateringIndex++
      }
    }
    return result
  }, [gridSize, displayedWaterings])

  // Calculate container dimensions
  const containerWidth = gridSize * tileSize
  const containerHeight = gridSize * (tileSize / 2) + tileSize * 0.3

  // Empty state
  if (waterings.length === 0) {
    return (
      <div className="relative w-full h-full flex flex-col overflow-hidden">
        <GardenSky weather={weather} contained />
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center text-muted-foreground">
            <span className="text-4xl mb-2 block">🏜️</span>
            <p className="text-sm">No waterings in this period</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden">
      {/* Sky background - contained within this component */}
      <GardenSky weather={weather} contained />

      {/* Garden container - above sky */}
      <div className="flex-1 flex items-center justify-center py-2 overflow-auto relative z-10">
        <div
          className="relative"
          style={{
            width: containerWidth,
            height: containerHeight,
          }}
        >
          {/* Ground plane */}
          <GroundPlane
            gridSize={gridSize}
            tileSize={tileSize}
            grassColor={defaultTheme.ground.primary}
            grassDarkColor={defaultTheme.ground.secondary}
          />

          {/* Tiles with plants */}
          {tiles.map(({ row, col, watering }) => (
            <StatsTile
              key={`${row}-${col}`}
              row={row}
              col={col}
              gridSize={gridSize}
              watering={watering}
              tileSize={tileSize}
            />
          ))}
        </div>
      </div>

      {/* Stats summary below garden */}
      <div className="flex justify-center gap-4 mt-1 pb-1 text-sm text-muted-foreground relative z-10">
        <span className="flex items-center gap-1">
          <span className="text-blue-500">💧</span>
          {waterings.length} waterings
        </span>
        {waterings.length > maxDisplay && (
          <span className="text-xs opacity-70">
            (showing {maxDisplay} of {waterings.length})
          </span>
        )}
      </div>
    </div>
  )
}

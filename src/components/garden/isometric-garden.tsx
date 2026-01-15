'use client'

import { useState, useMemo, useEffect } from 'react'
import { IsometricTile } from './isometric-tile'
import { IsometricPlant } from './isometric-plant'
import { PlantInfoBar } from './plant-tooltip'
import { GardenSky } from './garden-sky'
import { GroundPlane } from './ground-plane'
import { AddPlantDialog } from '@/components/plants/add-plant-dialog'
import { PlantDetailSheet } from '@/components/plants/plant-detail-sheet'
import type { PlantWithType, PlantType, WeatherType } from '@/types/database'
import { defaultTheme } from './themes'

interface IsometricGardenProps {
  plants: PlantWithType[]
  plantTypes: PlantType[]
  weather?: WeatherType | null
}

// Calculate grid size based on plant count
// Always ensures at least 1 empty slot for adding new plants
function getGridSize(plantCount: number): number {
  // Find the smallest grid that can fit all plants + 1 empty slot
  const minSlots = plantCount + 1
  const gridSize = Math.ceil(Math.sqrt(minSlots))
  return Math.max(gridSize, 2) // Minimum 2x2
}

// Get responsive tile size - returns default for SSR, actual for client
const DEFAULT_TILE_SIZE = 140

function getClientTileSize(): number {
  if (typeof window === 'undefined') return DEFAULT_TILE_SIZE
  const width = window.innerWidth
  if (width < 640) return 90 // Mobile
  if (width < 1024) return 120 // Tablet
  return 140 // Desktop - larger tiles for better visuals
}

export function IsometricGarden({
  plants,
  plantTypes,
  weather,
}: IsometricGardenProps) {
  const [hoveredTile, setHoveredTile] = useState<string | null>(null)
  const [selectedPlant, setSelectedPlant] = useState<PlantWithType | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  // Use default tile size on server, actual size on client to avoid hydration mismatch
  const [tileSize, setTileSize] = useState(DEFAULT_TILE_SIZE)

  useEffect(() => {
    // Update on resize
    const handleResize = () => setTileSize(getClientTileSize())

    // Set initial size via resize handler to avoid lint warning
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Filter out dead plants for the garden view (they go to cemetery)
  const livingPlants = plants.filter((p) => p.status !== 'dead')

  // Calculate grid size - minimum 2x2, grows with plant count
  const gridSize = useMemo(() => {
    // Always show at least one empty spot
    return Math.max(getGridSize(livingPlants.length + 1), 2)
  }, [livingPlants.length])

  // Create a map of plant positions
  // Plants are assigned positions based on their index
  const plantPositions = useMemo(() => {
    const positions = new Map<string, PlantWithType>()
    livingPlants.forEach((plant, index) => {
      const row = Math.floor(index / gridSize)
      const col = index % gridSize
      if (row < gridSize && col < gridSize) {
        positions.set(`${row}-${col}`, plant)
      }
    })
    return positions
  }, [livingPlants, gridSize])

  // Generate grid tiles
  const tiles = useMemo(() => {
    const result: { row: number; col: number; plant?: PlantWithType }[] = []
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const plant = plantPositions.get(`${row}-${col}`)
        result.push({ row, col, plant })
      }
    }
    return result
  }, [gridSize, plantPositions])

  // Calculate container dimensions
  // Container must match ground plane size exactly
  const containerWidth = gridSize * tileSize
  const containerHeight = gridSize * (tileSize / 2) + tileSize * 0.3 // + dirt height

  const handleTileClick = (row: number, col: number, plant?: PlantWithType) => {
    if (plant) {
      setSelectedPlant(plant)
      setSheetOpen(true)
    } else {
      setAddDialogOpen(true)
    }
  }

  const handleTileHover = (row: number, col: number) => {
    setHoveredTile(`${row}-${col}`)
  }

  const handleTileLeave = () => {
    setHoveredTile(null)
  }

  // Get hovered plant for info bar
  const hoveredPlant = hoveredTile ? plantPositions.get(hoveredTile) ?? null : null

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* Sky background */}
      <GardenSky weather={weather} />

      {/* Garden container - centered, fills available space */}
      <div className="flex-1 flex items-center justify-center py-2 overflow-auto">
        <div
          className="relative"
          style={{
            width: containerWidth,
            height: containerHeight,
          }}
        >
        {/* Single unified ground plane */}
        <GroundPlane
          gridSize={gridSize}
          tileSize={tileSize}
          grassColor={defaultTheme.ground.primary}
          grassDarkColor={defaultTheme.ground.secondary}
        />

        {/* Interactive tile zones (transparent) */}
        {tiles.map(({ row, col, plant }) => {
          const tileKey = `${row}-${col}`
          const isHovered = hoveredTile === tileKey

          return (
            <IsometricTile
              key={tileKey}
              row={row}
              col={col}
              gridSize={gridSize}
              isEmpty={!plant}
              isHovered={isHovered}
              onClick={() => handleTileClick(row, col, plant)}
              onMouseEnter={() => handleTileHover(row, col)}
              onMouseLeave={handleTileLeave}
              tileSize={tileSize}
            >
              {plant && (
                <IsometricPlant
                  plant={plant}
                  weather={weather}
                />
              )}
            </IsometricTile>
          )
        })}
        </div>
      </div>

      {/* Info bar below garden - shows hovered plant details */}
      <PlantInfoBar plant={hoveredPlant} />

      {/* Stats below garden - game style */}
      <div className="flex justify-center gap-3 mt-2 pb-2">
        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50">
          <span className="text-lg">🌱</span>
          <span className="text-sm font-bold text-green-400">{livingPlants.length}</span>
          <span className="text-xs text-slate-400">growing</span>
        </div>
        {plants.filter((p) => p.status === 'dead').length > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700/50">
            <span className="text-lg">🪦</span>
            <span className="text-sm font-bold text-slate-400">{plants.filter((p) => p.status === 'dead').length}</span>
            <span className="text-xs text-slate-500">cemetery</span>
          </div>
        )}
      </div>

      {/* Add plant dialog */}
      <AddPlantDialog
        plantTypes={plantTypes}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      {/* Plant detail sheet */}
      <PlantDetailSheet
        plant={selectedPlant}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}

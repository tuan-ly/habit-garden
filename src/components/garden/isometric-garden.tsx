'use client'

import { useState, useMemo } from 'react'
import { IsometricTile } from './isometric-tile'
import { IsometricPlant } from './isometric-plant'
import { PlantTooltip } from './plant-tooltip'
import { GardenSky } from './garden-sky'
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
function getGridSize(plantCount: number): number {
  if (plantCount <= 4) return 2
  if (plantCount <= 9) return 3
  if (plantCount <= 16) return 4
  return 5
}

// Get responsive tile size
function getTileSize(): number {
  if (typeof window === 'undefined') return 60
  const width = window.innerWidth
  if (width < 640) return 50 // Mobile
  if (width < 1024) return 60 // Tablet
  return 70 // Desktop
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

  // Filter out dead plants for the garden view (they go to cemetery)
  const livingPlants = plants.filter((p) => p.status !== 'dead')

  // Calculate grid size - minimum 2x2, grows with plant count
  const gridSize = useMemo(() => {
    // Always show at least one empty spot
    return Math.max(getGridSize(livingPlants.length + 1), 2)
  }, [livingPlants.length])

  const tileSize = getTileSize()

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
  const containerWidth = gridSize * tileSize + tileSize
  const containerHeight = gridSize * (tileSize / 2) + tileSize

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

  // Get hovered plant for tooltip
  const hoveredPlant = hoveredTile ? plantPositions.get(hoveredTile) : null

  return (
    <div className="relative w-full">
      {/* Sky background */}
      <GardenSky weather={weather} />

      {/* Garden container */}
      <div
        className="relative mx-auto"
        style={{
          width: containerWidth,
          height: containerHeight,
          minHeight: 300,
        }}
      >
        {/* Isometric tiles */}
        {tiles.map(({ row, col, plant }) => {
          const tileKey = `${row}-${col}`
          const isHovered = hoveredTile === tileKey

          return (
            <IsometricTile
              key={tileKey}
              row={row}
              col={col}
              isEmpty={!plant}
              isHovered={isHovered}
              onClick={() => handleTileClick(row, col, plant)}
              onMouseEnter={() => handleTileHover(row, col)}
              onMouseLeave={handleTileLeave}
              tileSize={tileSize}
              grassColor={defaultTheme.ground.primary}
              dirtColor={defaultTheme.ground.secondary}
              dirtDarkColor="#8b5e3c"
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

        {/* Tooltip for hovered plant */}
        {hoveredPlant && hoveredTile && (
          <PlantTooltip
            plant={hoveredPlant}
            tileKey={hoveredTile}
            gridSize={gridSize}
            tileSize={tileSize}
          />
        )}
      </div>

      {/* Stats below garden */}
      <div className="flex justify-center gap-4 mt-4 text-sm text-muted-foreground">
        <span>🌱 {livingPlants.length} growing</span>
        <span>🪦 {plants.filter((p) => p.status === 'dead').length} dead</span>
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

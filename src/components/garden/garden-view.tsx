'use client'

import { useState, useEffect } from 'react'
import { PlantCard } from '@/components/plants/plant-card'
import { PlantDetailSheet } from '@/components/plants/plant-detail-sheet'
import { AddPlantDialog } from '@/components/plants/add-plant-dialog'
import { IsometricGarden } from './isometric-garden'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Flower2, TreesIcon, LayoutGrid } from 'lucide-react'
import type { PlantWithType, PlantType, WeatherType } from '@/types/database'

type ViewMode = 'garden' | 'list'

interface GardenViewProps {
  plants: PlantWithType[]
  plantTypes: PlantType[]
  weather?: WeatherType | null
}

export function GardenView({ plants, plantTypes, weather }: GardenViewProps) {
  const [selectedPlant, setSelectedPlant] = useState<PlantWithType | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('garden')

  // Load saved preference
  useEffect(() => {
    const saved = localStorage.getItem('gardenViewMode') as ViewMode | null
    if (saved && (saved === 'garden' || saved === 'list')) {
      setViewMode(saved)
    }
  }, [])

  // Save preference
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('gardenViewMode', mode)
  }

  const handlePlantClick = (plant: PlantWithType) => {
    setSelectedPlant(plant)
    setSheetOpen(true)
  }

  const growingPlants = plants.filter((p) => p.status === 'growing')
  const maturePlants = plants.filter((p) => p.status === 'mature')
  const deadPlants = plants.filter((p) => p.status === 'dead')

  // Empty state
  if (plants.length === 0) {
    return (
      <div className="space-y-6">
        <IsometricGarden
          plants={[]}
          plantTypes={plantTypes}
          weather={weather}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* View toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'garden' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewModeChange('garden')}
          >
            <TreesIcon className="h-4 w-4 mr-1" />
            Garden
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleViewModeChange('list')}
          >
            <LayoutGrid className="h-4 w-4 mr-1" />
            List
          </Button>
        </div>
        {viewMode === 'list' && (
          <AddPlantDialog plantTypes={plantTypes} />
        )}
      </div>

      {/* Isometric Garden View */}
      {viewMode === 'garden' && (
        <IsometricGarden
          plants={plants}
          plantTypes={plantTypes}
          weather={weather}
        />
      )}

      {/* List View (original card grid) */}
      {viewMode === 'list' && (
        <div className="space-y-8">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{growingPlants.length} growing</span>
            <span>{maturePlants.length} mature</span>
            {deadPlants.length > 0 && (
              <span className="text-red-500">{deadPlants.length} dead</span>
            )}
          </div>

          {/* Growing Plants */}
          {growingPlants.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">🌱</span>
                Growing ({growingPlants.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {growingPlants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    onClick={() => handlePlantClick(plant)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Mature Plants */}
          {maturePlants.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="text-xl">🌳</span>
                Mature ({maturePlants.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {maturePlants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    onClick={() => handlePlantClick(plant)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Dead Plants (Cemetery) */}
          {deadPlants.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                <span className="text-xl">🪦</span>
                Cemetery ({deadPlants.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {deadPlants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    onClick={() => handlePlantClick(plant)}
                  />
                ))}
              </div>
            </section>
          )}

          <PlantDetailSheet
            plant={selectedPlant}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
          />
        </div>
      )}
    </div>
  )
}

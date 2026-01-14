'use client'

import { useState, useEffect } from 'react'
import { PlantCard } from '@/components/plants/plant-card'
import { PlantDetailSheet } from '@/components/plants/plant-detail-sheet'
import { AddPlantDialog } from '@/components/plants/add-plant-dialog'
import { IsometricGarden } from './isometric-garden'
import { Button } from '@/components/ui/button'
import { TreesIcon, LayoutGrid } from 'lucide-react'
import { WeatherBadge } from '@/components/gamification/weather-display'
import { XpBadge } from '@/components/gamification/xp-progress'
import type { PlantWithType, PlantType, WeatherType, Profile } from '@/types/database'

type ViewMode = 'garden' | 'list'

interface GardenViewProps {
  plants: PlantWithType[]
  plantTypes: PlantType[]
  weather?: WeatherType | null
  profile?: Profile | null
}

export function GardenView({ plants, plantTypes, weather, profile }: GardenViewProps) {
  const [selectedPlant, setSelectedPlant] = useState<PlantWithType | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Initialize from localStorage on client side
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gardenViewMode') as ViewMode | null
      if (saved === 'garden' || saved === 'list') {
        return saved
      }
    }
    return 'garden'
  })

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
    <div className="flex flex-col h-full">
      {/* Compact header bar */}
      <div className="flex items-center justify-between py-1">
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
        <div className="flex items-center gap-3">
          {viewMode === 'list' && (
            <AddPlantDialog plantTypes={plantTypes} />
          )}
          {profile && <XpBadge totalXp={profile.xp} />}
          <WeatherBadge size="sm" />
        </div>
      </div>

      {/* Isometric Garden View - fills remaining space */}
      {viewMode === 'garden' && (
        <div className="flex-1 min-h-0">
          <IsometricGarden
            plants={plants}
            plantTypes={plantTypes}
            weather={weather}
          />
        </div>
      )}

      {/* List View (original card grid) */}
      {viewMode === 'list' && (
        <div className="flex-1 overflow-auto space-y-8">
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

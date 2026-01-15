'use client'

import { useState } from 'react'
import { PlantCard } from '@/components/plants/plant-card'
import { PlantDetailSheet } from '@/components/plants/plant-detail-sheet'
import { AddPlantDialog } from '@/components/plants/add-plant-dialog'
import { IsometricGarden } from './isometric-garden'
import { TreesIcon, LayoutGrid } from 'lucide-react'
import { GameHud } from '@/components/game-ui'
import { cn } from '@/lib/utils'
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
      <div className="h-screen">
        {/* Game HUD */}
        <GameHud profile={profile} weather={weather} />

        <IsometricGarden
          plants={[]}
          plantTypes={plantTypes}
          weather={weather}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Game HUD - floating at top */}
      <GameHud profile={profile} weather={weather} />

      {/* View mode toggle - game style floating buttons */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <div className="flex items-center gap-1 p-1.5 bg-slate-900/90 backdrop-blur-xl rounded-2xl border-2 border-slate-700/50 shadow-xl">
          <button
            onClick={() => handleViewModeChange('garden')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
              viewMode === 'garden'
                ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <TreesIcon className="w-5 h-5" />
            Garden
          </button>
          <button
            onClick={() => handleViewModeChange('list')}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300",
              viewMode === 'list'
                ? "bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-lg shadow-blue-500/30"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            )}
          >
            <LayoutGrid className="w-5 h-5" />
            List
          </button>
        </div>
      </div>

      {/* Isometric Garden View - fills entire screen */}
      {viewMode === 'garden' && (
        <div className="flex-1">
          <IsometricGarden
            plants={plants}
            plantTypes={plantTypes}
            weather={weather}
          />
        </div>
      )}

      {/* List View (card grid with game styling) */}
      {viewMode === 'list' && (
        <div className="flex-1 overflow-auto pt-20 px-4 pb-4 space-y-6">
          {/* Add plant button - floating */}
          <div className="fixed top-16 right-4 z-30">
            <AddPlantDialog plantTypes={plantTypes} />
          </div>

          {/* Stats bar */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
              <span className="text-sm">🌱</span>
              <span className="text-sm font-medium text-green-700 dark:text-green-400">{growingPlants.length} growing</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full">
              <span className="text-sm">🌳</span>
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{maturePlants.length} mature</span>
            </div>
            {deadPlants.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                <span className="text-sm">🪦</span>
                <span className="text-sm font-medium text-red-700 dark:text-red-400">{deadPlants.length} dead</span>
              </div>
            )}
          </div>

          {/* Growing Plants */}
          {growingPlants.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md shadow-green-500/30">
                  <span className="text-lg">🌱</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg">Growing</h2>
                  <p className="text-xs text-slate-500">{growingPlants.length} plants</p>
                </div>
              </div>
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
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                  <span className="text-lg">🌳</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg">Mature</h2>
                  <p className="text-xs text-slate-500">{maturePlants.length} plants</p>
                </div>
              </div>
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
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shadow-md">
                  <span className="text-lg">🪦</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-500">Cemetery</h2>
                  <p className="text-xs text-slate-400">{deadPlants.length} plants</p>
                </div>
              </div>
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

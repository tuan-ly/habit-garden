'use client'

import { useState } from 'react'
import { PlantCard } from '@/components/plants/plant-card'
import { PlantDetailSheet } from '@/components/plants/plant-detail-sheet'
import { AddPlantDialog } from '@/components/plants/add-plant-dialog'
import { IsometricGarden } from './isometric-garden'
import { FocusGardenView } from './focus-garden-view'
import { GardenSky } from './garden-sky'
import { WeatherEffects } from './weather-effects'
import { TreesIcon, LayoutGrid, Plus, Target } from 'lucide-react'
import { GameHud } from '@/components/game-ui'
import { cn } from '@/lib/utils'
import { usePlants, useMood } from '@/lib/context'
import type { PlantWithType, PlantType, WeatherType, Profile } from '@/types/database'

type ViewMode = 'garden' | 'list' | 'focus'

interface GardenViewProps {
  plantTypes: PlantType[]
  weather?: WeatherType | null
  profile?: Profile | null
}

export function GardenView({ plantTypes, weather, profile }: GardenViewProps) {
  // Get plants from context with optimistic updates
  const { plants } = usePlants()
  const { mood } = useMood()

  // Map mood to weather
  const moodWeather: WeatherType = (() => {
    switch (mood) {
      case 5: // Sunny
        return 'sunny';
      case 4: // Partly Cloudy
        return 'cloudy';
      case 3: // Cloudy
        return 'cloudy';
      case 2: // Rainy
        return 'rainy';
      case 1: // Stormy
        return 'stormy';
      default:
        return 'sunny';
    }
  })();

  const displayWeather = moodWeather;

  const [selectedPlant, setSelectedPlant] = useState<PlantWithType | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Initialize from localStorage on client side
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gardenViewMode') as ViewMode | null
      if (saved === 'garden' || saved === 'list' || saved === 'focus') {
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
      <div className="h-full relative">
        {/* Sky background */}
        <GardenSky weather={displayWeather} />

        {/* Game HUD */}
        <GameHud profile={profile} />

        {/* View toggle - top center */}
        <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />

        <IsometricGarden
          plantTypes={plantTypes}
          weather={displayWeather}
          journalStreak={profile?.journal_streak ?? 0}
        />

        <AddPlantDialog
          plantTypes={plantTypes}
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
        />
      </div>
    )
  }

  return (
    <div className="h-full relative">
      {/* Sky background - fills entire screen (garden and focus modes) */}
      {(viewMode === 'garden' || viewMode === 'focus') && <GardenSky weather={displayWeather} />}

      {/* Weather Overlay - Renders on top of everything but below HUD (garden and focus modes) */}
      {(viewMode === 'garden' || viewMode === 'focus') && displayWeather && <WeatherEffects weather={displayWeather} />}

      {/* Game HUD - floating at top corners */}
      <GameHud profile={profile} />

      {/* View toggle - top center */}
      <ViewToggle viewMode={viewMode} onViewModeChange={handleViewModeChange} />

      {/* Floating Add Plant button - only in list view */}
      {viewMode === 'list' && <FloatingAddButton onClick={() => setAddDialogOpen(true)} />}

      {/* Isometric Garden View - fills entire screen */}
      {viewMode === 'garden' && (
        <div className="h-full">
          <IsometricGarden
            plantTypes={plantTypes}
            weather={displayWeather}
            journalStreak={profile?.journal_streak ?? 0}
          />
        </div>
      )}

      {/* Focus Garden View - goal-focused with visual states */}
      {viewMode === 'focus' && (
        <div className="h-full">
          <FocusGardenView
            plants={plants}
            plantTypes={plantTypes}
            weather={displayWeather}
            journalStreak={profile?.journal_streak ?? 0}
          />
        </div>
      )}

      {/* List View (card grid with game styling) */}
      {viewMode === 'list' && (
        <div className="h-full overflow-y-auto pt-20 px-4 pb-36 space-y-6 bg-gradient-to-br from-sky-200 via-emerald-100 to-green-200 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
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

      {/* Add plant dialog */}
      <AddPlantDialog
        plantTypes={plantTypes}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      {/* Plant detail sheet for list view */}
      {viewMode === 'list' && (
        <PlantDetailSheet
          plant={selectedPlant}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
        />
      )}
    </div>
  )
}

// View toggle component - compact, positioned at top center (moves down on mobile to avoid HUD overlap)
function ViewToggle({
  viewMode,
  onViewModeChange
}: {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
}) {
  return (
    <div className="fixed top-14 sm:top-3 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="flex items-center gap-0.5 p-0.5 sm:p-1 bg-slate-900/80 backdrop-blur-xl rounded-lg sm:rounded-xl border border-slate-700/50 shadow-lg">
        <button
          onClick={() => onViewModeChange('garden')}
          className={cn(
            "flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition-all duration-300",
            viewMode === 'garden'
              ? "bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-md shadow-green-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          )}
        >
          <TreesIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          Garden
        </button>
        <button
          onClick={() => onViewModeChange('list')}
          className={cn(
            "flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition-all duration-300",
            viewMode === 'list'
              ? "bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-md shadow-blue-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          )}
        >
          <LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          List
        </button>
        <button
          onClick={() => onViewModeChange('focus')}
          className={cn(
            "flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold transition-all duration-300",
            viewMode === 'focus'
              ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md shadow-amber-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          )}
        >
          <Target className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          Focus
        </button>
      </div>
    </div>
  )
}

// Floating Add Plant button - positioned at top right, below weather
function FloatingAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed top-14 right-2 sm:top-16 sm:right-3 z-30",
        "flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl",
        "bg-gradient-to-br from-green-400 to-emerald-500",
        "text-white text-[11px] sm:text-xs font-bold",
        "shadow-lg shadow-green-500/30",
        "hover:shadow-xl hover:shadow-green-500/40 hover:scale-105",
        "transition-all duration-300",
        "border border-green-300/30"
      )}
    >
      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span className="hidden xs:inline">Add Plant</span>
      <span className="xs:hidden">Add</span>
    </button>
  )
}

'use client'

import { cn } from '@/lib/utils'
import type { PlantWithType } from '@/types/database'
import { Skull, Calendar, Droplets, Flame, History, AlertTriangle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useState } from 'react'

interface CemeteryViewProps {
  deadPlants: PlantWithType[]
  className?: string
}

export function CemeteryView({ deadPlants, className }: CemeteryViewProps) {
  const [selectedPlant, setSelectedPlant] = useState<PlantWithType | null>(null)

  if (deadPlants.length === 0) {
    return (
      <div className={cn('p-6 text-center', className)}>
        <div className="text-4xl mb-3">🌈</div>
        <h3 className="font-semibold mb-1">No plants have died</h3>
        <p className="text-sm text-muted-foreground">
          Keep taking care of your garden and your plants will thrive!
        </p>
      </div>
    )
  }

  // Sort by death date, most recent first
  const sortedPlants = [...deadPlants].sort((a, b) => {
    const dateA = a.died_at ? new Date(a.died_at).getTime() : 0
    const dateB = b.died_at ? new Date(b.died_at).getTime() : 0
    return dateB - dateA
  })

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <Skull className="h-5 w-5" />
        <span className="font-medium">Plant Cemetery</span>
        <span className="text-sm">({deadPlants.length} plants)</span>
      </div>

      {/* Cemetery info */}
      <div className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-muted-foreground">
          These plants have withered away. Learn from the past to grow a better future garden.
        </p>
      </div>

      {/* Dead plants grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sortedPlants.map((plant) => (
          <GravestoneCard
            key={plant.id}
            plant={plant}
            onClick={() => setSelectedPlant(plant)}
          />
        ))}
      </div>

      {/* Detail dialog */}
      <Dialog
        open={!!selectedPlant}
        onOpenChange={(open) => !open && setSelectedPlant(null)}
      >
        <DialogContent>
          {selectedPlant && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <span className="text-4xl grayscale opacity-60">
                    {selectedPlant.plant_type.icon}
                  </span>
                  <div>
                    <DialogTitle>{selectedPlant.name}</DialogTitle>
                    <DialogDescription>
                      {selectedPlant.plant_type.name}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Death info */}
                <div className="p-4 rounded-lg bg-gray-100 dark:bg-gray-800/50 border">
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Skull className="h-4 w-4" />
                    <span className="font-medium">Cause of Death</span>
                  </div>
                  <p className="text-sm">
                    {selectedPlant.death_reason || 'Neglect - moisture dropped to 0%'}
                  </p>
                </div>

                {/* Timeline */}
                <div className="space-y-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Timeline
                  </h4>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Planted</span>
                      <span>
                        {new Date(selectedPlant.started_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    {selectedPlant.died_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Died</span>
                        <span>
                          {new Date(selectedPlant.died_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Lifespan</span>
                      <span>
                        {selectedPlant.died_at
                          ? Math.ceil(
                              (new Date(selectedPlant.died_at).getTime() -
                                new Date(selectedPlant.started_at).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          : 0}{' '}
                        days
                      </span>
                    </div>
                  </div>
                </div>

                {/* Final stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Droplets className="h-4 w-4" />
                      <span className="text-xs">Total Waterings</span>
                    </div>
                    <span className="font-semibold">{selectedPlant.total_waterings}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-muted">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Flame className="h-4 w-4" />
                      <span className="text-xs">Best Streak</span>
                    </div>
                    <span className="font-semibold">{selectedPlant.longest_streak} days</span>
                  </div>
                </div>

                {/* Growth at death */}
                <div className="p-3 rounded-lg bg-muted">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-muted-foreground">Growth at death</span>
                    <span className="font-semibold">{selectedPlant.growth_percentage}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gray-500"
                      style={{ width: `${selectedPlant.growth_percentage}%` }}
                    />
                  </div>
                </div>

                {/* Habit description */}
                {selectedPlant.habit_description && (
                  <div>
                    <h4 className="font-medium mb-1">Habit</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedPlant.habit_description}
                    </p>
                  </div>
                )}

                {/* Memorial message */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-center">
                  <p className="text-sm text-muted-foreground italic">
                    "Every ending is a new beginning. Plant a new seed and try again."
                  </p>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Individual gravestone card
interface GravestoneCardProps {
  plant: PlantWithType
  onClick?: () => void
}

function GravestoneCard({ plant, onClick }: GravestoneCardProps) {
  const deathDate = plant.died_at
    ? new Date(plant.died_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'Unknown'

  const lifespanDays = plant.died_at
    ? Math.ceil(
        (new Date(plant.died_at).getTime() - new Date(plant.started_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0

  return (
    <button
      onClick={onClick}
      className={cn(
        'p-4 rounded-lg border text-left transition-all hover:shadow-md',
        'bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900/50 dark:to-slate-900/50',
        'border-gray-200 dark:border-gray-700'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Plant icon (grayscale) */}
        <div className="relative">
          <span className="text-3xl grayscale opacity-50 plant-dead">
            {plant.plant_type.icon}
          </span>
          <Skull className="absolute -bottom-1 -right-1 h-4 w-4 text-gray-500" />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold truncate">{plant.name}</h4>
          <p className="text-xs text-muted-foreground truncate">
            {plant.plant_type.name}
          </p>

          {/* Death info */}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {deathDate}
            </div>
            <span>{lifespanDays} days</span>
          </div>

          {/* Death reason badge */}
          {plant.death_reason && (
            <div className="mt-2 flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400">
              <AlertTriangle className="h-3 w-3" />
              <span className="truncate">{plant.death_reason}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between text-xs text-muted-foreground">
        <span>Watered {plant.total_waterings}x</span>
        <span>Best streak: {plant.longest_streak}d</span>
        <span>Growth: {plant.growth_percentage}%</span>
      </div>
    </button>
  )
}

// Summary card for cemetery
interface CemeterySummaryProps {
  deadPlants: PlantWithType[]
  className?: string
}

export function CemeterySummary({ deadPlants, className }: CemeterySummaryProps) {
  if (deadPlants.length === 0) return null

  const totalWaterings = deadPlants.reduce((sum, p) => sum + p.total_waterings, 0)
  const avgLifespan = Math.round(
    deadPlants.reduce((sum, plant) => {
      if (!plant.died_at) return sum
      const days = Math.ceil(
        (new Date(plant.died_at).getTime() - new Date(plant.started_at).getTime()) /
          (1000 * 60 * 60 * 24)
      )
      return sum + days
    }, 0) / deadPlants.length
  )

  return (
    <div
      className={cn(
        'p-4 rounded-lg border bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <Skull className="h-5 w-5 text-gray-500" />
        <h3 className="font-semibold">Cemetery Summary</h3>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold">{deadPlants.length}</p>
          <p className="text-xs text-muted-foreground">Plants lost</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{avgLifespan}</p>
          <p className="text-xs text-muted-foreground">Avg. lifespan (days)</p>
        </div>
        <div>
          <p className="text-2xl font-bold">{totalWaterings}</p>
          <p className="text-xs text-muted-foreground">Total waterings</p>
        </div>
      </div>
    </div>
  )
}

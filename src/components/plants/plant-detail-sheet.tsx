'use client'

import { useState, useTransition } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Droplets,
  Flame,
  Calendar,
  Trash2,
  Clock,
  Trophy,
  TrendingUp,
} from 'lucide-react'
import type { PlantWithType, WeatherType } from '@/types/database'
import { MoistureBar } from './moisture-bar'
import { GrowthProgress } from './growth-progress'
import { PlantVisual, XpPopup } from './plant-visual'
import { waterPlant, deletePlant } from '@/lib/actions/plants'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface PlantDetailSheetProps {
  plant: PlantWithType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  weather?: WeatherType | null
}

export function PlantDetailSheet({
  plant,
  open,
  onOpenChange,
  weather,
}: PlantDetailSheetProps) {
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isWatering, setIsWatering] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [earnedXp, setEarnedXp] = useState(0)

  if (!plant) return null

  const isWateredToday = plant.last_watered_at
    ? new Date(plant.last_watered_at).toDateString() === new Date().toDateString()
    : false

  const isDead = plant.status === 'dead'
  const isMature = plant.status === 'mature'

  const startedDate = new Date(plant.started_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const daysActive = Math.floor(
    (Date.now() - new Date(plant.started_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  const handleWater = async () => {
    if (isWateredToday || isDead) return

    setIsWatering(true)
    startTransition(async () => {
      const result = await waterPlant(plant.id)

      if (result.success) {
        // Show XP popup animation
        setEarnedXp(result.xpEarned || 0)
        setShowXp(true)
        setTimeout(() => setShowXp(false), 1500)

        toast.success(`Watered ${plant.name}!`, {
          description: `+${result.xpEarned} XP earned`,
        })
      } else {
        toast.error('Failed to water', {
          description: result.error,
        })
      }
      setTimeout(() => setIsWatering(false), 800)
    })
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${plant.name}"? This cannot be undone.`)) {
      return
    }

    setIsDeleting(true)
    const result = await deletePlant(plant.id)

    if (result.success) {
      toast.success('Plant deleted')
      onOpenChange(false)
    } else {
      toast.error('Failed to delete', {
        description: result.error,
      })
    }
    setIsDeleting(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-4">
            <div className="relative">
              <PlantVisual
                plant={plant}
                size="xl"
                showWateringEffect={isWatering}
                weather={weather}
              />
              <XpPopup amount={earnedXp} show={showXp} />
            </div>
            <div>
              <SheetTitle>{plant.name}</SheetTitle>
              <SheetDescription>{plant.plant_type.name}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-center">
            <span
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium',
                plant.status === 'growing' && 'bg-emerald-100 text-emerald-700',
                plant.status === 'mature' && 'bg-green-100 text-green-700',
                plant.status === 'dead' && 'bg-gray-100 text-gray-700'
              )}
            >
              {plant.status === 'growing' && 'Growing'}
              {plant.status === 'mature' && 'Mature!'}
              {plant.status === 'dead' && 'Dead'}
            </span>
          </div>

          {/* Progress Bars */}
          <div className="space-y-4">
            <MoistureBar value={plant.current_moisture} size="md" />
            <GrowthProgress
              value={plant.growth_percentage}
              status={plant.status}
              maturityDays={plant.plant_type.maturity_days}
              size="md"
            />
          </div>

          {/* Water Button */}
          <Button
            className={cn('w-full', isWatering && 'animate-pulse')}
            size="lg"
            variant={isWateredToday ? 'secondary' : 'default'}
            onClick={handleWater}
            disabled={isPending || isWatering || isWateredToday || isDead}
          >
            <Droplets className={cn('h-5 w-5 mr-2', isWatering && 'text-blue-400')} />
            {isDead ? 'Plant is dead' : isWateredToday ? 'Already watered today' : isWatering ? 'Watering...' : 'Water Plant'}
          </Button>

          <Separator />

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Flame className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-xs text-muted-foreground">Current Streak</p>
                <p className="font-semibold">{plant.current_streak} days</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-xs text-muted-foreground">Best Streak</p>
                <p className="font-semibold">{plant.longest_streak} days</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Droplets className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xs text-muted-foreground">Total Waterings</p>
                <p className="font-semibold">{plant.total_waterings}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Days Active</p>
                <p className="font-semibold">{daysActive}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Info */}
          <div className="space-y-3">
            <h4 className="font-medium">Details</h4>

            {plant.habit_description && (
              <p className="text-sm text-muted-foreground">
                {plant.habit_description}
              </p>
            )}

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Started {startedDate}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{plant.plant_type.maturity_days} days to mature</span>
            </div>

            {plant.plant_type.special_effect && (
              <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200">
                <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                  Special Ability
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {plant.plant_type.special_effect.type.replace(/_/g, ' ')}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Danger Zone */}
          <div>
            <h4 className="font-medium text-red-600 mb-3">Danger Zone</h4>
            <Button
              variant="destructive"
              className="w-full"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isDeleting ? 'Deleting...' : 'Delete Plant'}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

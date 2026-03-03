'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Droplets, Target, Plus } from 'lucide-react'
import type { PlantWithType, WeatherType } from '@/types/database'
import { MoistureBar } from './moisture-bar'
import { GrowthProgress } from './growth-progress'
import { PlantVisual, StreakFire, XpPopup } from './plant-visual'
import { usePlants } from '@/lib/context'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { getGoalForPlant, type GoalWithStats } from '@/lib/actions/goals'
import { GoalProgressRing, GoalModeBadge } from '@/components/goals'

// Plant type gradient backgrounds
const PLANT_GRADIENTS: Record<string, string> = {
  bamboo: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
  sunflower: 'from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30',
  'cherry blossom': 'from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-950/30',
  cactus: 'from-lime-50 to-green-50 dark:from-lime-950/30 dark:to-green-950/30',
  lotus: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
  rose: 'from-rose-50 to-red-50 dark:from-rose-950/30 dark:to-red-950/30',
  bonsai: 'from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30',
  'money tree': 'from-yellow-50 to-green-50 dark:from-yellow-950/30 dark:to-green-950/30',
}

function getPlantGradient(typeName: string): string {
  const normalizedName = typeName.toLowerCase()
  return PLANT_GRADIENTS[normalizedName] || 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30'
}

interface PlantCardProps {
  plant: PlantWithType
  onClick?: () => void
  weather?: WeatherType | null
}

export function PlantCard({ plant: initialPlant, onClick, weather }: PlantCardProps) {
  // Get the latest plant data from context (with optimistic updates)
  const { plants, waterPlant } = usePlants()
  const plant = plants.find(p => p.id === initialPlant.id) || initialPlant

  const [isWatering, setIsWatering] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [earnedXp, setEarnedXp] = useState(0)
  const [goal, setGoal] = useState<GoalWithStats | null>(null)

  const hasGoal = !!plant.goal_mode

  // Load goal data if plant has a goal
  useEffect(() => {
    if (hasGoal) {
      getGoalForPlant(plant.id).then(setGoal)
    }
  }, [plant.id, hasGoal])

  const isWateredToday = plant.last_watered_at
    ? new Date(plant.last_watered_at).toDateString() === new Date().toDateString()
    : false

  const isDead = plant.status === 'dead'
  const isMature = plant.status === 'mature'

  const handleWater = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (isWateredToday || isDead) return

    // If plant has a goal, clicking should open the detail sheet instead
    if (hasGoal) {
      onClick?.()
      return
    }

    setIsWatering(true)

    // Use optimistic update from context
    const result = await waterPlant(plant.id)

    if (result.success) {
      // Show XP popup animation
      setEarnedXp(result.xpEarned || 0)
      setShowXp(true)
      setTimeout(() => setShowXp(false), 1500)
    }

    // Keep watering animation for a moment
    setTimeout(() => setIsWatering(false), 800)
  }

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-300',
        'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1.5',
        'relative overflow-hidden border-2',
        'bg-gradient-to-br',
        getPlantGradient(plant.plant_type.name),
        isDead && 'opacity-60 grayscale',
        isMature && 'border-green-400 dark:border-green-600 ring-2 ring-green-500/20',
        hasGoal && !goal?.isOnTrack && 'border-amber-400 dark:border-amber-600 ring-2 ring-amber-500/20',
        !isDead && !isMature && 'border-transparent hover:border-primary/20'
      )}
      onClick={onClick}
    >
      {/* Decorative corner gradient */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/40 to-transparent dark:from-white/5 pointer-events-none" />

      <CardContent className="p-4 relative">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative p-1 bg-white/50 dark:bg-black/20 rounded-xl shadow-inner">
              <PlantVisual
                plant={plant}
                size="md"
                showWateringEffect={isWatering}
                weather={weather}
              />
              <XpPopup amount={earnedXp} show={showXp} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-base truncate">{plant.name}</h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span className="opacity-70">{plant.plant_type.icon}</span>
                <span>{plant.plant_type.name}</span>
                {hasGoal && <Target className="h-3 w-3 text-primary" />}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {goal && <GoalProgressRing goal={goal} size="sm" showPeriod={true} />}
            <StreakFire streak={plant.current_streak} show={plant.current_streak > 0 && !hasGoal} />
          </div>
        </div>

        {/* Show goal info or regular progress */}
        {hasGoal && goal ? (
          <div className="space-y-3 mb-4 p-3 bg-white/60 dark:bg-black/20 rounded-xl backdrop-blur-sm">
            <MoistureBar value={plant.current_moisture} />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">{goal.periodLabel}</span>
              <span className={cn(
                'font-bold',
                goal.periodProgress >= goal.currentPeriodTarget
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : !goal.isOnTrack
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-primary'
              )}>
                {Math.round(goal.periodProgress * 10) / 10} / {Math.round(goal.currentPeriodTarget * 10) / 10} {goal.unit}
              </span>
            </div>
            {/* Progress bar for goal (period-based) */}
            <div className="h-2 w-full rounded-full bg-muted/50 overflow-hidden shadow-inner">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  goal.periodProgress >= goal.currentPeriodTarget
                    ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                    : goal.isOnTrack
                    ? 'bg-gradient-to-r from-primary/80 to-primary'
                    : 'bg-gradient-to-r from-amber-400 to-orange-500'
                )}
                style={{ width: `${Math.min(100, goal.currentPeriodTarget > 0 ? (goal.periodProgress / goal.currentPeriodTarget) * 100 : 0)}%` }}
              />
            </div>
            {goal.periodProgress < goal.currentPeriodTarget && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400">
                {Math.round((goal.currentPeriodTarget - goal.periodProgress) * 10) / 10} {goal.unit} to go
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3 mb-4 p-3 bg-white/60 dark:bg-black/20 rounded-xl backdrop-blur-sm">
            <MoistureBar value={plant.current_moisture} />
            <GrowthProgress
              value={plant.growth_percentage}
              status={plant.status}
              maturityDays={plant.plant_type.maturity_days}
            />
          </div>
        )}

        {/* Button changes based on goal status */}
        {hasGoal ? (
          <Button
            variant={isWateredToday ? 'secondary' : 'default'}
            size="sm"
            className={cn(
              'w-full font-semibold shadow-md transition-all',
              !isWateredToday && !isDead && 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70',
              isWateredToday && 'opacity-75'
            )}
            onClick={handleWater}
            disabled={isWateredToday || isDead}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isDead ? 'Dead' : isWateredToday ? '✓ Logged Today' : 'Log Progress'}
          </Button>
        ) : (
          <Button
            variant={isWateredToday ? 'secondary' : 'default'}
            size="sm"
            className={cn(
              'w-full font-semibold shadow-md transition-all',
              isWatering && 'animate-pulse',
              !isWateredToday && !isDead && 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white border-0',
              isWateredToday && 'opacity-75'
            )}
            onClick={handleWater}
            disabled={isWatering || isWateredToday || isDead}
          >
            <Droplets className={cn('h-4 w-4 mr-2', isWatering && 'text-blue-200 animate-bounce')} />
            {isDead ? 'Dead' : isWateredToday ? '✓ Watered Today' : isWatering ? 'Watering...' : 'Water Plant'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Droplets, Target, Plus, Check } from 'lucide-react'
import type { PlantWithType, WeatherType } from '@/types/database'
import { MoistureBar } from './moisture-bar'
import { GrowthProgress } from './growth-progress'
import { PlantVisual, StreakFire, XpPopup } from './plant-visual'
import { usePlants } from '@/lib/context/plants-context'
import { useState, useEffect, memo } from 'react'
import { cn } from '@/lib/utils'
import {
  formatGoalValue,
  getRemainingGoalValue,
} from '@/lib/goal-progress'
import { getGoalForPlant, type GoalWithStats } from '@/lib/actions/goals'

// Plant type accent — a single hue for top border, not full gradient
const PLANT_ACCENTS: Record<string, string> = {
  bamboo: 'bg-moss',
  sunflower: 'bg-bloom',
  'cherry blossom': 'bg-[#E8A4B5]',
  cactus: 'bg-growth',
  lotus: 'bg-[#B794D1]',
  rose: 'bg-[#D97A8E]',
  bonsai: 'bg-leaf',
}

function getPlantAccent(typeName: string): string {
  return PLANT_ACCENTS[typeName.toLowerCase()] || 'bg-moss'
}

interface PlantCardProps {
  plant: PlantWithType
  onClick?: () => void
  weather?: WeatherType | null
  goalStats?: GoalWithStats | null
}

export const PlantCard = memo(function PlantCard({ plant: initialPlant, onClick, weather, goalStats }: PlantCardProps) {
  const { plants, waterPlant } = usePlants()
  const plant = plants.find(p => p.id === initialPlant.id) || initialPlant

  const [isWatering, setIsWatering] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [earnedXp, setEarnedXp] = useState(0)

  const [lazyGoal, setLazyGoal] = useState<GoalWithStats | null>(null)
  const goal = goalStats ?? lazyGoal

  const hasGoal = !!plant.goal_mode
  const periodProgress = plant.goal?.period_progress ?? goal?.periodProgress ?? 0
  const currentPeriodTarget = plant.goal?.current_period_target ?? goal?.currentPeriodTarget ?? 0
  const periodLabel = plant.goal?.period_label ?? goal?.periodLabel ?? 'This period'
  const goalUnit = plant.goal?.unit ?? goal?.unit ?? ''
  const remainingPeriodValue = getRemainingGoalValue(periodProgress, currentPeriodTarget)
  const isPeriodComplete = currentPeriodTarget > 0 && remainingPeriodValue === 0
  const isPeriodOnTrack = goal?.isOnTrack ?? periodProgress >= currentPeriodTarget * 0.8

  useEffect(() => {
    if (hasGoal && goalStats === undefined) {
      getGoalForPlant(plant.id).then(setLazyGoal)
    }
  }, [plant.id, hasGoal, goalStats])

  const isWateredToday = plant.last_watered_at
    ? new Date(plant.last_watered_at).toDateString() === new Date().toDateString()
    : false

  const isDead = plant.status === 'dead'
  const isMature = plant.status === 'mature'

  const handleWater = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isDead) return

    if (hasGoal) {
      onClick?.()
      return
    }

    if (isWateredToday) return

    setIsWatering(true)
    const result = await waterPlant(plant.id)
    if (result.success) {
      setEarnedXp(result.xpEarned || 0)
      setShowXp(true)
      setTimeout(() => setShowXp(false), 1500)
    }
    setTimeout(() => setIsWatering(false), 800)
  }

  return (
    <Card
      className={cn(
        'group cursor-pointer relative overflow-hidden',
        'bg-white/90 dark:bg-card border-0 rounded-[20px]',
        'shadow-dappled hover:shadow-dappled-lg',
        'transition-[transform,box-shadow] duration-300',
        'hover:scale-[1.02]',
        isDead && 'opacity-60 grayscale',
        isMature && 'ring-1 ring-leaf/30',
        hasGoal && currentPeriodTarget > 0 && !isPeriodOnTrack && 'ring-1 ring-bloom/40'
      )}
      onClick={onClick}
    >
      {/* Plant-type accent strip */}
      <div className={cn('absolute top-0 left-0 right-0 h-1', getPlantAccent(plant.plant_type.name))} />

      <CardContent className="p-4 pt-5 relative">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl bg-mist/80 dark:bg-muted flex items-center justify-center shadow-dappled">
              <PlantVisual
                plant={plant}
                size="md"
                showWateringEffect={isWatering}
                weather={weather}
              />
              <XpPopup amount={earnedXp} show={showXp} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-[17px] font-semibold text-canopy dark:text-foreground truncate leading-tight">
                {plant.name}
              </h3>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                <span>{plant.plant_type.name}</span>
                {hasGoal && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <span className="inline-flex items-center gap-0.5 text-leaf">
                      <Target className="h-3 w-3" />
                      Goal
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {hasGoal && currentPeriodTarget > 0 && (
              <span className={cn(
                'rounded-full px-2.5 py-1 text-[11px] font-semibold',
                isPeriodComplete
                  ? 'bg-leaf/15 text-leaf'
                  : 'bg-bloom/15 text-bloom'
              )}>
                {isPeriodComplete
                  ? 'Done'
                  : `${formatGoalValue(remainingPeriodValue)} ${goalUnit} left`.trim()}
              </span>
            )}
            <StreakFire streak={plant.current_streak} show={plant.current_streak > 0 && !hasGoal} />
          </div>
        </div>

        {/* Metrics block */}
        {hasGoal && (goal || plant.goal) ? (
          <div className="space-y-3 mb-4 p-3.5 rounded-2xl bg-mist/60 dark:bg-muted/50">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">{periodLabel}</span>
              <span className={cn(
                'font-display font-semibold tabular-nums',
                isPeriodComplete ? 'text-leaf'
                  : !isPeriodOnTrack ? 'text-bloom'
                  : 'text-canopy dark:text-foreground'
              )}>
                {formatGoalValue(periodProgress)} / {formatGoalValue(currentPeriodTarget)} {goalUnit}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/70 dark:bg-black/30 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-[width] duration-500 ease-out',
                  isPeriodComplete ? 'bg-leaf'
                    : isPeriodOnTrack ? 'bg-moss'
                    : 'bg-bloom'
                )}
                style={{ width: `${Math.min(100, currentPeriodTarget > 0 ? (periodProgress / currentPeriodTarget) * 100 : 0)}%` }}
              />
            </div>
            {!isPeriodComplete && (
              <p className="text-[10px] text-bloom/90 font-medium">
                {formatGoalValue(remainingPeriodValue)} {goalUnit} to go
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3 mb-4 p-3.5 rounded-2xl bg-mist/60 dark:bg-muted/50">
            <MoistureBar value={plant.current_moisture} />
            <GrowthProgress
              value={plant.growth_percentage}
              status={plant.status}
              maturityDays={plant.plant_type.maturity_days}
            />
          </div>
        )}

        {/* CTA */}
        {hasGoal ? (
          <Button
            size="sm"
            className={cn(
              'w-full h-10 rounded-full font-semibold cursor-pointer transition-colors',
              isDead
                ? 'bg-mist hover:bg-mist text-muted-foreground shadow-none dark:bg-muted'
                : 'bg-leaf hover:bg-canopy text-white shadow-leaf'
            )}
            onClick={handleWater}
            disabled={isDead}
          >
            {isDead ? (
              'Dead'
            ) : isWateredToday ? (
              <><Plus className="h-4 w-4 mr-2" />Log more</>
            ) : (
              <><Plus className="h-4 w-4 mr-2" />Log Progress</>
            )}
          </Button>
        ) : (
          <Button
            size="sm"
            className={cn(
              'w-full h-10 rounded-full font-semibold cursor-pointer transition-colors',
              isWatering && 'animate-pulse',
              isWateredToday || isDead
                ? 'bg-mist hover:bg-mist text-muted-foreground shadow-none dark:bg-muted'
                : 'bg-leaf hover:bg-canopy text-white shadow-leaf'
            )}
            onClick={handleWater}
            disabled={isWatering || isWateredToday || isDead}
          >
            {isWateredToday ? (
              <><Check className="h-4 w-4 mr-2" />Watered today</>
            ) : isDead ? (
              'Dead'
            ) : isWatering ? (
              <><Droplets className="h-4 w-4 mr-2 animate-bounce-subtle" />Watering…</>
            ) : (
              <><Droplets className="h-4 w-4 mr-2" />Water Plant</>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
})

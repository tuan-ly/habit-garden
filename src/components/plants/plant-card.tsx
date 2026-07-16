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

interface PrimaryCardContent {
  type: 'period_progress' | 'moisture_state' | 'overall_progress'
  mainMetric: {
    label: string
    value: string | number
    unit?: string
    progress?: number  // 0-100 for progress bar
  }
  secondaryText?: string
  cta: {
    label: string
    icon?: React.ReactNode
    disabled: boolean
  }
}

function getPrimaryCardContent(
  plant: PlantWithType,
  goal: GoalWithStats | null,
  isWateredToday: boolean,
  isDead: boolean
): PrimaryCardContent {
  const hasGoal = !!plant.goal_mode
  
  // Priority 1: Active goal with period target
  if (hasGoal && goal?.currentPeriodTarget && goal.currentPeriodTarget > 0) {
    const remaining = getRemainingGoalValue(goal.periodProgress, goal.currentPeriodTarget)
    const isComplete = remaining === 0
    
    return {
      type: 'period_progress',
      mainMetric: {
        label: goal.periodLabel || 'This week',
        value: `${formatGoalValue(goal.periodProgress)} / ${formatGoalValue(goal.currentPeriodTarget)}`,
        unit: goal.unit,
        progress: (goal.periodProgress / goal.currentPeriodTarget) * 100
      },
      secondaryText: isComplete 
        ? '✨ Period complete!' 
        : `${formatGoalValue(remaining)} ${goal.unit} to go`,
      cta: {
        label: isDead ? 'Dead' : (isComplete ? 'Log more' : 'Log Progress'),
        icon: isDead ? undefined : <Plus className="h-4 w-4 mr-2" />,
        disabled: isDead
      }
    }
  }
  
  // Priority 2: Simple watering habit (no goal)
  if (!hasGoal) {
    return {
      type: 'moisture_state',
      mainMetric: {
        label: isWateredToday ? 'Watered today' : 'Needs water',
        value: '', // Visual only via PlantVisual
      },
      secondaryText: plant.last_watered_at 
        ? `Last: ${new Date(plant.last_watered_at).toLocaleDateString()}`
        : undefined,
      cta: {
        label: isWateredToday ? 'Watered today' : (isDead ? 'Dead' : 'Water Plant'),
        icon: isWateredToday ? <Check className="h-4 w-4 mr-2" /> : (isDead ? undefined : <Droplets className="h-4 w-4 mr-2" />),
        disabled: isWateredToday || isDead
      }
    }
  }
  
  // Priority 3: Goal without period (milestone)
  return {
    type: 'overall_progress',
    mainMetric: {
      label: 'Overall progress',
      value: plant.growth_percentage,
      unit: '%',
      progress: plant.growth_percentage
    },
    cta: {
      label: isDead ? 'Dead' : 'Log Progress',
      icon: isDead ? undefined : <Plus className="h-4 w-4 mr-2" />,
      disabled: isDead
    }
  }
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

  // Get primary card content based on plant state
  const content = getPrimaryCardContent(plant, goal, isWateredToday, isDead)

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

      <CardContent className="p-6 relative">
        {/* Header - cleaner */}
        <div className="flex items-start justify-between mb-5">
          <div className="relative w-14 h-14 rounded-2xl bg-mist/80 dark:bg-muted flex items-center justify-center shadow-dappled flex-shrink-0">
            <PlantVisual
              plant={plant}
              size="md"
              showWateringEffect={isWatering}
              weather={weather}
            />
          </div>
          <div className="flex-1 min-w-0 ml-3">
            <h3 className="text-lg font-semibold text-canopy dark:text-foreground truncate">
              {plant.name}
            </h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
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

        {/* Single focused metric */}
        <div className="space-y-4 mb-5 p-4 rounded-2xl bg-mist/60 dark:bg-muted/50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{content.mainMetric.label}</span>
            {content.type === 'period_progress' && content.mainMetric.value && (
              <span className="font-display font-semibold text-lg tabular-nums text-canopy dark:text-foreground">
                {content.mainMetric.value} {content.mainMetric.unit}
              </span>
            )}
          </div>
          
          {content.mainMetric.progress !== undefined && (
            <div className="h-1.5 w-full rounded-full bg-white/70 dark:bg-black/30 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 bg-leaf"
                style={{ width: `${Math.min(100, content.mainMetric.progress)}%` }}
              />
            </div>
          )}
          
          {content.secondaryText && (
            <p className="text-xs text-bloom font-medium">
              {content.secondaryText}
            </p>
          )}
        </div>

        {/* Single clear CTA */}
        <Button
          size="sm"
          className={cn(
            'w-full h-10 rounded-full font-semibold transition-colors',
            isWatering && 'animate-pulse',
            content.cta.disabled
              ? 'bg-mist hover:bg-mist text-muted-foreground shadow-none dark:bg-muted cursor-not-allowed'
              : 'bg-leaf hover:bg-canopy text-white shadow-leaf cursor-pointer'
          )}
          onClick={handleWater}
          disabled={content.cta.disabled || isWatering}
        >
          {isWatering ? (
            <><Droplets className="h-4 w-4 mr-2 animate-bounce-subtle" />Watering…</>
          ) : (
            <>{content.cta.icon}{content.cta.label}</>
          )}
        </Button>
      </CardContent>
    </Card>
  )
})

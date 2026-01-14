'use client'

import { useState, useTransition, useEffect } from 'react'
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
  Clock,
  Trophy,
  TrendingUp,
  Target,
  Plus,
  BarChart3,
} from 'lucide-react'
import type { PlantWithType, WeatherType } from '@/types/database'
import { MoistureBar } from './moisture-bar'
import { GrowthProgress } from './growth-progress'
import { PlantVisual, XpPopup } from './plant-visual'
import { waterPlant } from '@/lib/actions/plants'
import { getGoalForPlant, getGoalStats, type GoalWithStats, type GoalStatistics } from '@/lib/actions/goals'
import { getAdaptiveAnalysis, type AdaptiveAnalysisResult } from '@/lib/actions/adaptive'
import {
  GoalSetupWizard,
  GoalLogModal,
  GoalProgress,
  GoalModeBadge,
  GoalStats,
  AdaptiveSuggestionModal,
  AdaptiveSettings,
  PerformanceOverview,
  AdjustmentHistory,
} from '@/components/goals'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const [isWatering, setIsWatering] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [earnedXp, setEarnedXp] = useState(0)

  // Goal state
  const [goal, setGoal] = useState<GoalWithStats | null>(null)
  const [goalStats, setGoalStats] = useState<GoalStatistics | null>(null)
  const [showGoalWizard, setShowGoalWizard] = useState(false)
  const [showGoalLog, setShowGoalLog] = useState(false)
  const [showGoalStats, setShowGoalStats] = useState(false)
  const [isLoadingGoal, setIsLoadingGoal] = useState(false)

  // Adaptive state
  const [adaptiveAnalysis, setAdaptiveAnalysis] = useState<AdaptiveAnalysisResult | null>(null)
  const [showAdaptiveSuggestion, setShowAdaptiveSuggestion] = useState(false)

  // Load goal when plant changes or sheet opens
  useEffect(() => {
    if (plant && open) {
      setIsLoadingGoal(true)
      getGoalForPlant(plant.id).then((g) => {
        setGoal(g)
        setIsLoadingGoal(false)
      })
    }
  }, [plant?.id, open])

  // Load full stats and adaptive analysis when viewing stats
  useEffect(() => {
    if (goal && showGoalStats) {
      getGoalStats(goal.id).then(setGoalStats)
      getAdaptiveAnalysis(goal.id).then((analysis) => {
        setAdaptiveAnalysis(analysis)
        // Show suggestion modal if there's a pending suggestion
        if (analysis?.suggestion && analysis?.pendingAdjustment) {
          setShowAdaptiveSuggestion(true)
        }
      })
    }
  }, [goal?.id, showGoalStats])

  if (!plant) return null

  const isWateredToday = plant.last_watered_at
    ? new Date(plant.last_watered_at).toDateString() === new Date().toDateString()
    : false

  const isDead = plant.status === 'dead'
  const hasGoal = !!plant.goal_mode

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

  const handleGoalComplete = () => {
    // Refresh goal data
    getGoalForPlant(plant.id).then(setGoal)
  }

  const handleAdaptiveComplete = () => {
    // Refresh all goal data after adaptive adjustment
    if (goal) {
      getGoalForPlant(plant.id).then(setGoal)
      getGoalStats(goal.id).then(setGoalStats)
      getAdaptiveAnalysis(goal.id).then(setAdaptiveAnalysis)
    }
  }

  return (
    <>
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
                <SheetDescription className="flex items-center gap-2">
                  {plant.plant_type.name}
                  {hasGoal && goal && (
                    <GoalModeBadge mode={goal.goal_mode} />
                  )}
                </SheetDescription>
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

            {/* Goal Progress */}
            {goal && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Goal Progress
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowGoalStats(true)}
                    >
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Stats
                    </Button>
                  </div>
                  <GoalProgress goal={goal} />
                </div>
              </>
            )}

            {/* Action Buttons */}
            {hasGoal && goal ? (
              <Button
                className={cn('w-full', isWatering && 'animate-pulse')}
                size="lg"
                variant={isWateredToday ? 'secondary' : 'default'}
                onClick={() => setShowGoalLog(true)}
                disabled={isPending || isWateredToday || isDead}
              >
                <Plus className="h-5 w-5 mr-2" />
                {isDead ? 'Plant is dead' : isWateredToday ? 'Already logged today' : 'Log Progress'}
              </Button>
            ) : (
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
            )}

            {/* Add Goal button if no goal exists */}
            {!hasGoal && !isDead && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowGoalWizard(true)}
              >
                <Target className="h-4 w-4 mr-2" />
                Add Goal Tracking
              </Button>
            )}

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

          </div>
        </SheetContent>
      </Sheet>

      {/* Goal Setup Wizard */}
      <GoalSetupWizard
        plantId={plant.id}
        plantName={plant.name}
        open={showGoalWizard}
        onOpenChange={setShowGoalWizard}
        onComplete={handleGoalComplete}
      />

      {/* Goal Log Modal */}
      {goal && (
        <GoalLogModal
          goal={goal}
          open={showGoalLog}
          onOpenChange={setShowGoalLog}
          onSuccess={handleGoalComplete}
        />
      )}

      {/* Goal Stats Modal */}
      {goal && (
        <Sheet open={showGoalStats} onOpenChange={setShowGoalStats}>
          <SheetContent className="overflow-y-auto sm:max-w-lg">
            <SheetHeader>
              <SheetTitle>Goal Statistics</SheetTitle>
              <SheetDescription>{plant.name}</SheetDescription>
            </SheetHeader>
            <div className="mt-4">
              <Tabs defaultValue="progress" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="progress">Progress</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                <TabsContent value="progress" className="mt-4">
                  {goalStats ? (
                    <GoalStats stats={goalStats} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading statistics...
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="performance" className="mt-4 space-y-4">
                  {adaptiveAnalysis ? (
                    <>
                      <PerformanceOverview analysis={adaptiveAnalysis.analysis} />
                      <AdjustmentHistory goalId={goal.id} />
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading performance data...
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="settings" className="mt-4">
                  <AdaptiveSettings
                    goal={goal}
                    onUpdate={handleAdaptiveComplete}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Adaptive Suggestion Modal */}
      {adaptiveAnalysis?.suggestion && adaptiveAnalysis?.pendingAdjustment && (
        <AdaptiveSuggestionModal
          suggestion={adaptiveAnalysis.suggestion}
          adjustmentId={adaptiveAnalysis.pendingAdjustment.id}
          open={showAdaptiveSuggestion}
          onOpenChange={setShowAdaptiveSuggestion}
          onComplete={handleAdaptiveComplete}
        />
      )}
    </>
  )
}

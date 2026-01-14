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
        <SheetContent className="overflow-y-auto p-0">
          {/* Header with gradient background */}
          <div className="bg-gradient-to-br from-emerald-50 via-green-50 to-lime-50 dark:from-emerald-950/50 dark:via-green-950/50 dark:to-lime-950/50 px-6 pt-6 pb-8">
            <SheetHeader className="mb-0">
              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <div className="p-3 rounded-2xl bg-white/80 dark:bg-slate-800/80 shadow-lg backdrop-blur-sm">
                    <PlantVisual
                      plant={plant}
                      size="xl"
                      showWateringEffect={isWatering}
                      weather={weather}
                    />
                  </div>
                  <XpPopup amount={earnedXp} show={showXp} />
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <SheetTitle className="text-xl font-bold text-slate-800 dark:text-slate-100 truncate">
                    {plant.name}
                  </SheetTitle>
                  <SheetDescription className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-slate-600 dark:text-slate-400">{plant.plant_type.name}</span>
                    {hasGoal && goal && (
                      <GoalModeBadge mode={goal.goal_mode} />
                    )}
                  </SheetDescription>
                  {/* Status Badge - inline with header */}
                  <div className="mt-3">
                    <span
                      className={cn(
                        'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium shadow-sm',
                        plant.status === 'growing' && 'bg-emerald-500 text-white',
                        plant.status === 'mature' && 'bg-green-600 text-white',
                        plant.status === 'dead' && 'bg-gray-500 text-white'
                      )}
                    >
                      {plant.status === 'growing' && '🌱 Growing'}
                      {plant.status === 'mature' && '🌳 Mature'}
                      {plant.status === 'dead' && '💀 Dead'}
                    </span>
                  </div>
                </div>
              </div>
            </SheetHeader>
          </div>

          <div className="px-6 py-6 space-y-6">

            {/* Progress Bars - Card style */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-4">
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
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2 text-blue-800 dark:text-blue-200">
                    <Target className="h-4 w-4" />
                    Goal Progress
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 dark:text-blue-300"
                    onClick={() => setShowGoalStats(true)}
                  >
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Stats
                  </Button>
                </div>
                <GoalProgress goal={goal} />
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {hasGoal && goal ? (
                <Button
                  className={cn(
                    'w-full h-12 text-base font-medium shadow-md',
                    isWatering && 'animate-pulse',
                    !isWateredToday && !isDead && 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  )}
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
                  className={cn(
                    'w-full h-12 text-base font-medium shadow-md',
                    isWatering && 'animate-pulse',
                    !isWateredToday && !isDead && 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                  )}
                  size="lg"
                  variant={isWateredToday ? 'secondary' : 'default'}
                  onClick={handleWater}
                  disabled={isPending || isWatering || isWateredToday || isDead}
                >
                  <Droplets className={cn('h-5 w-5 mr-2', isWatering && 'text-blue-200')} />
                  {isDead ? 'Plant is dead' : isWateredToday ? 'Already watered today' : isWatering ? 'Watering...' : 'Water Plant'}
                </Button>
              )}

              {/* Add Goal button if no goal exists */}
              {!hasGoal && !isDead && (
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={() => setShowGoalWizard(true)}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Add Goal Tracking
                </Button>
              )}
            </div>

            {/* Stats - Better layout with icons */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">Statistics</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-100 dark:border-orange-900/50">
                  <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/50">
                    <Flame className="h-5 w-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs text-orange-600/80 dark:text-orange-400/80">Current Streak</p>
                    <p className="font-bold text-orange-700 dark:text-orange-300">{plant.current_streak} days</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border border-yellow-100 dark:border-yellow-900/50">
                  <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/50">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80">Best Streak</p>
                    <p className="font-bold text-yellow-700 dark:text-yellow-300">{plant.longest_streak} days</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-100 dark:border-blue-900/50">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                    <Droplets className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600/80 dark:text-blue-400/80">Total Waterings</p>
                    <p className="font-bold text-blue-700 dark:text-blue-300">{plant.total_waterings}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-100 dark:border-green-900/50">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/50">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs text-green-600/80 dark:text-green-400/80">Days Active</p>
                    <p className="font-bold text-green-700 dark:text-green-300">{daysActive}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Info - Cleaner design */}
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-800 dark:text-slate-200">Details</h4>

              {plant.habit_description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3">
                  &ldquo;{plant.habit_description}&rdquo;
                </p>
              )}

              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="h-4 w-4 text-slate-400" />
                <span>Started {startedDate}</span>
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                <Clock className="h-4 w-4 text-slate-400" />
                <span>{plant.plant_type.maturity_days} days to mature</span>
              </div>

              {plant.plant_type.special_effect && (
                <div className="p-3 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border border-purple-100 dark:border-purple-900/50">
                  <p className="text-sm text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-2">
                    ✨ Special Ability
                  </p>
                  <p className="text-xs text-purple-600 dark:text-purple-400 mt-1 capitalize">
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

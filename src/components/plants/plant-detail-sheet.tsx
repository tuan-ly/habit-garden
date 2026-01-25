'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
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
  Sparkles,
  Zap,
} from 'lucide-react'
import type { PlantWithType, WeatherType } from '@/types/database'
import { PlantVisual, XpPopup } from './plant-visual'
import { usePlants } from '@/lib/context'
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
import { cn } from '@/lib/utils'

interface PlantDetailSheetProps {
  plant: PlantWithType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  weather?: WeatherType | null
}

export function PlantDetailSheet({
  plant: initialPlant,
  open,
  onOpenChange,
  weather,
}: PlantDetailSheetProps) {
  // Get the latest plant data from context (with optimistic updates)
  const { plants, waterPlant, updatePlant, isPending, isSyncing } = usePlants()
  const plant = initialPlant ? (plants.find(p => p.id === initialPlant.id) || initialPlant) : null
  
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
    
    // Use optimistic update from context
    const result = await waterPlant(plant.id)
    
    if (result.success) {
      setEarnedXp(result.xpEarned || 0)
      setShowXp(true)
      setTimeout(() => setShowXp(false), 1500)
    }
    
    setTimeout(() => setIsWatering(false), 800)
  }

  const handleGoalComplete = async () => {
    // Refresh goal data and update plant in context
    const newGoal = await getGoalForPlant(plant.id)
    setGoal(newGoal)

    // Update plant in context with goal_mode and goal info
    if (newGoal) {
      updatePlant(plant.id, {
        goal_mode: newGoal.goal_mode,
        goal: {
          id: newGoal.id,
          goal_mode: newGoal.goal_mode,
          tracking_metric: newGoal.tracking_metric,
          unit: newGoal.unit,
          target_value: newGoal.target_value,
          current_value: newGoal.current_value,
          weekly_targets: newGoal.weekly_targets,
          current_week_target: newGoal.currentWeekTarget,
          week_number: newGoal.weekNumber,
        },
      })
    }
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
        <SheetContent className="overflow-y-auto p-0 w-full sm:max-w-md">
          {/* Hero Header - Centered plant visual */}
          <div className="relative">
            {/* Background gradient */}
            <div className={cn(
              'absolute inset-0 bg-gradient-to-b',
              plant.status === 'dead'
                ? 'from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-900'
                : plant.status === 'mature'
                ? 'from-emerald-100 via-green-50 to-white dark:from-emerald-900/40 dark:via-green-950/30 dark:to-slate-900'
                : 'from-sky-100 via-emerald-50 to-white dark:from-sky-900/30 dark:via-emerald-950/20 dark:to-slate-900'
            )} />

            <div className="relative pt-8 pb-6 px-6">
              <SheetHeader className="text-center space-y-4">
                {/* Plant Image - Hero Style */}
                <div className="relative mx-auto">
                  <div className={cn(
                    'relative w-28 h-28 mx-auto rounded-3xl flex items-center justify-center',
                    'bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm',
                    'shadow-xl shadow-black/5 dark:shadow-black/20',
                    'ring-1 ring-white/50 dark:ring-white/10'
                  )}>
                    <PlantVisual
                      plant={plant}
                      size="xl"
                      showWateringEffect={isWatering}
                      weather={weather}
                    />
                    <XpPopup amount={earnedXp} show={showXp} />
                  </div>

                  {/* Status badge floating */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
                        'shadow-lg shadow-black/10',
                        plant.status === 'growing' && 'bg-emerald-500 text-white',
                        plant.status === 'mature' && 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
                        plant.status === 'dead' && 'bg-slate-400 text-white'
                      )}
                    >
                      {plant.status === 'growing' && <Sparkles className="h-3 w-3" />}
                      {plant.status === 'mature' && <Trophy className="h-3 w-3" />}
                      {plant.status === 'growing' && 'Growing'}
                      {plant.status === 'mature' && 'Mature'}
                      {plant.status === 'dead' && 'Wilted'}
                    </span>
                  </div>
                </div>

                {/* Name & Type */}
                <div className="pt-2">
                  <SheetTitle className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                    {plant.name}
                  </SheetTitle>
                  <SheetDescription className="flex items-center justify-center gap-2 mt-1">
                    <span className="text-slate-500 dark:text-slate-400">{plant.plant_type.name}</span>
                    {hasGoal && goal && <GoalModeBadge mode={goal.goal_mode} />}
                  </SheetDescription>
                </div>
              </SheetHeader>
            </div>
          </div>

          <div className="px-5 pb-8 space-y-5">
            {/* Progress Section - Unified Card */}
            <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 p-4 space-y-4">
              {/* Moisture */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'p-1.5 rounded-lg',
                      plant.current_moisture >= 70 ? 'bg-blue-100 dark:bg-blue-900/50' :
                      plant.current_moisture >= 40 ? 'bg-amber-100 dark:bg-amber-900/50' :
                      'bg-red-100 dark:bg-red-900/50'
                    )}>
                      <Droplets className={cn(
                        'h-4 w-4',
                        plant.current_moisture >= 70 ? 'text-blue-500' :
                        plant.current_moisture >= 40 ? 'text-amber-500' :
                        'text-red-500'
                      )} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Moisture</span>
                  </div>
                  <span className={cn(
                    'text-sm font-bold',
                    plant.current_moisture >= 70 ? 'text-blue-600 dark:text-blue-400' :
                    plant.current_moisture >= 40 ? 'text-amber-600 dark:text-amber-400' :
                    'text-red-600 dark:text-red-400'
                  )}>
                    {Math.round(plant.current_moisture)}%
                  </span>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200/70 dark:bg-slate-700/50 overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      plant.current_moisture >= 70 ? 'bg-gradient-to-r from-blue-400 to-cyan-400' :
                      plant.current_moisture >= 40 ? 'bg-gradient-to-r from-amber-400 to-yellow-400' :
                      'bg-gradient-to-r from-red-400 to-orange-400'
                    )}
                    style={{ width: `${Math.max(0, Math.min(100, plant.current_moisture))}%` }}
                  />
                </div>
              </div>

              {/* Growth */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Growth</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      {plant.status === 'mature' ? 'Complete!' : `~${Math.ceil(plant.plant_type.maturity_days * (100 - plant.growth_percentage) / 100)}d left`}
                    </span>
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      {Math.round(plant.growth_percentage)}%
                    </span>
                  </div>
                </div>
                <div className="h-2.5 rounded-full bg-slate-200/70 dark:bg-slate-700/50 overflow-hidden relative">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-700',
                      plant.status === 'dead' ? 'bg-slate-400' :
                      plant.status === 'mature' ? 'bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400' :
                      'bg-gradient-to-r from-lime-400 to-emerald-500'
                    )}
                    style={{ width: `${Math.max(0, Math.min(100, plant.growth_percentage))}%` }}
                  />
                  {/* Subtle milestone markers */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    {[25, 50, 75].map((mark) => (
                      <div
                        key={mark}
                        className="absolute top-0 bottom-0 w-px bg-white/30 dark:bg-black/20"
                        style={{ left: `${mark}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Goal Progress - If exists */}
            {goal && (
              <div className="rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/30 p-4 space-y-3 ring-1 ring-indigo-100 dark:ring-indigo-900/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                      <Target className="h-4 w-4 text-indigo-500" />
                    </div>
                    <span className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">Goal Progress</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                    onClick={() => setShowGoalStats(true)}
                  >
                    <BarChart3 className="h-3.5 w-3.5 mr-1" />
                    Details
                  </Button>
                </div>
                <GoalProgress goal={goal} />
              </div>
            )}

            {/* Primary Action Button */}
            <div className="space-y-2.5">
              {hasGoal && goal ? (
                <Button
                  className={cn(
                    'w-full h-12 text-base font-semibold rounded-xl shadow-lg transition-all',
                    isWatering && 'animate-pulse',
                    !isWateredToday && !isDead && 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-indigo-500/25'
                  )}
                  size="lg"
                  variant={isWateredToday ? 'secondary' : 'default'}
                  onClick={() => setShowGoalLog(true)}
                  disabled={isPending || isWateredToday || isDead}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  {isDead ? 'Plant has wilted' : isWateredToday ? 'Logged for today' : 'Log Progress'}
                </Button>
              ) : (
                <Button
                  className={cn(
                    'w-full h-12 text-base font-semibold rounded-xl shadow-lg transition-all',
                    isWatering && 'animate-pulse',
                    !isWateredToday && !isDead && 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/25'
                  )}
                  size="lg"
                  variant={isWateredToday ? 'secondary' : 'default'}
                  onClick={handleWater}
                  disabled={isPending || isWatering || isWateredToday || isDead}
                >
                  <Droplets className={cn('h-5 w-5 mr-2', isWatering && 'text-blue-200')} />
                  {isDead ? 'Plant has wilted' : isWateredToday ? 'Watered today' : isWatering ? 'Watering...' : 'Water Plant'}
                </Button>
              )}

              {/* Add Goal - Secondary */}
              {!hasGoal && !isDead && (
                <Button
                  variant="outline"
                  className="w-full h-11 rounded-xl font-medium border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => setShowGoalWizard(true)}
                >
                  <Target className="h-4 w-4 mr-2" />
                  Add Goal Tracking
                </Button>
              )}
            </div>

            {/* Statistics - Compact Row Style */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                Statistics
              </h4>

              <div className="grid grid-cols-4 gap-2">
                {/* Current Streak - Highlighted */}
                <div className={cn(
                  'col-span-2 p-3 rounded-xl text-center',
                  'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40',
                  'ring-1 ring-orange-200/50 dark:ring-orange-800/30'
                )}>
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <Flame className="h-4 w-4 text-orange-500" />
                    <span className="text-[10px] uppercase tracking-wide font-medium text-orange-600/80 dark:text-orange-400/80">Streak</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{plant.current_streak}</p>
                  <p className="text-[10px] text-orange-500/70 dark:text-orange-400/60">days</p>
                </div>

                {/* Best Streak */}
                <div className="p-2.5 rounded-xl text-center bg-slate-100/80 dark:bg-slate-800/60">
                  <Trophy className="h-3.5 w-3.5 text-yellow-500 mx-auto mb-0.5" />
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{plant.longest_streak}</p>
                  <p className="text-[9px] text-slate-400 uppercase">Best</p>
                </div>

                {/* Total Waterings */}
                <div className="p-2.5 rounded-xl text-center bg-slate-100/80 dark:bg-slate-800/60">
                  <Droplets className="h-3.5 w-3.5 text-blue-500 mx-auto mb-0.5" />
                  <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{plant.total_waterings}</p>
                  <p className="text-[9px] text-slate-400 uppercase">Waters</p>
                </div>
              </div>
            </div>

            {/* Details - Compact & Clean */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Details</h4>

              <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/40 divide-y divide-slate-200/50 dark:divide-slate-700/50">
                {plant.habit_description && (
                  <div className="p-3">
                    <p className="text-sm text-slate-600 dark:text-slate-400 italic leading-relaxed">
                      &ldquo;{plant.habit_description}&rdquo;
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3 p-3">
                  <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">Started</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{startedDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3">
                  <Clock className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-400">Maturity</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{plant.plant_type.maturity_days} days</p>
                  </div>
                </div>
              </div>

              {/* Special Ability - Highlighted */}
              {plant.plant_type.special_effect && (
                <div className={cn(
                  'p-3.5 rounded-xl',
                  'bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/40 dark:to-purple-950/40',
                  'ring-1 ring-purple-200/50 dark:ring-purple-800/30'
                )}>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">Special Ability</span>
                  </div>
                  <p className="text-sm text-purple-600 dark:text-purple-400 capitalize">
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

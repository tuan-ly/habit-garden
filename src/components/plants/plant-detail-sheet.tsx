'use client'

/**
 * Plant Detail Sheet - Redesigned with tabs for reflective experience
 *
 * Tabs:
 * - Overview: Quick view with motivation, rhythm, and action
 * - Journal: Notes timeline + milestones (lazy loaded)
 * - Stats: Detailed statistics (lazy loaded)
 */

import { useState, useEffect, useTransition, useMemo } from 'react'
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
  Lightbulb,
  Moon,
  Heart,
  BookOpen,
  ChevronRight,
  Lock,
} from 'lucide-react'
import type { PlantWithType, WeatherType, MilestoneType } from '@/types/database'
import { PlantVisual, XpPopup } from './plant-visual'
import { usePlants, useSubscription } from '@/lib/context'
import { FeatureLock } from '@/components/game-ui'
import { getGoalForPlant, getGoalStats, type GoalWithStats, type GoalStatistics } from '@/lib/actions/goals'
import { getAdaptiveAnalysis, type AdaptiveAnalysisResult } from '@/lib/actions/adaptive'
import { getPlantActivityHistory, type ActivityHistory } from '@/lib/actions/activity'
import { getPlantJournalData, type JournalData, type MilestoneData } from '@/lib/actions/journal'
import { RhythmView, RhythmStats } from './rhythm-view'
import { JournalTimeline } from './journal-timeline'
import { MilestoneTimeline } from './milestone-timeline'
import { PlantDetailSkeleton } from './plant-detail-skeleton'
import { ReflectionModal } from './reflection-modal'
import {
  GoalSetupWizard,
  GoalLogModal,
  GoalModeBadge,
  GoalStats,
  PeriodTargetDisplay,
  GoalJourneyMap,
  AdaptiveSuggestionModal,
  AdaptiveSettings,
  PerformanceOverview,
  AdjustmentHistory,
} from '@/components/goals'
import { getPeriodInfo } from '@/lib/goal-utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn, isToday } from '@/lib/utils'

interface PlantDetailSheetProps {
  plant: PlantWithType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  weather?: WeatherType | null
}

type TabValue = 'overview' | 'journal' | 'stats'

export function PlantDetailSheet({
  plant: initialPlant,
  open,
  onOpenChange,
  weather,
}: PlantDetailSheetProps) {
  // Get the latest plant data from context (with optimistic updates)
  const { plants, waterPlant, updatePlant } = usePlants()
  const { hasGoals, showUpgradeModal } = useSubscription()
  const plant = initialPlant ? (plants.find(p => p.id === initialPlant.id) || initialPlant) : null

  const [isWatering, setIsWatering] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [earnedXp, setEarnedXp] = useState(0)
  const [activeTab, setActiveTab] = useState<TabValue>('overview')

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

  // Activity/Rhythm state - Quick view (7 days for overview)
  const [quickRhythm, setQuickRhythm] = useState<ActivityHistory | null>(null)

  // Journal tab state (lazy loaded)
  const [journalData, setJournalData] = useState<JournalData | null>(null)
  const [journalLoading, setJournalLoading] = useState(false)

  // Stats tab state (lazy loaded)
  const [fullActivityHistory, setFullActivityHistory] = useState<ActivityHistory | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  // Reflection modal state
  const [reflectionMilestone, setReflectionMilestone] = useState<MilestoneData | null>(null)
  const [showReflectionModal, setShowReflectionModal] = useState(false)

  const [isPending, startTransition] = useTransition()

  // Load essential data when sheet opens (Overview tab) - parallel requests
  useEffect(() => {
    if (plant && open) {
      setIsLoadingGoal(true)
      Promise.all([
        getGoalForPlant(plant.id),
        getPlantActivityHistory(plant.id, 7),
      ]).then(([g, rhythm]) => {
        setGoal(g)
        setQuickRhythm(rhythm)
        setIsLoadingGoal(false)
      })
    }
  }, [plant?.id, open])

  // Reset tab when sheet closes
  useEffect(() => {
    if (!open) {
      setActiveTab('overview')
      setJournalData(null)
      setFullActivityHistory(null)
    }
  }, [open])

  // Lazy load Journal tab data
  useEffect(() => {
    if (plant && activeTab === 'journal' && !journalData && !journalLoading) {
      setJournalLoading(true)
      startTransition(async () => {
        const data = await getPlantJournalData(plant.id)
        setJournalData(data)
        setJournalLoading(false)
      })
    }
  }, [activeTab, plant?.id, journalData, journalLoading])

  // Lazy load Stats tab data
  useEffect(() => {
    if (plant && activeTab === 'stats' && !fullActivityHistory && !statsLoading) {
      setStatsLoading(true)
      startTransition(async () => {
        const history = await getPlantActivityHistory(plant.id, 30)
        setFullActivityHistory(history)
        setStatsLoading(false)
      })
    }
  }, [activeTab, plant?.id, fullActivityHistory, statsLoading])

  // Load full stats and adaptive analysis when viewing goal stats - parallel requests
  useEffect(() => {
    if (goal && showGoalStats) {
      Promise.all([
        getGoalStats(goal.id),
        getAdaptiveAnalysis(goal.id),
      ]).then(([stats, analysis]) => {
        setGoalStats(stats)
        setAdaptiveAnalysis(analysis)
        if (analysis?.suggestion && analysis?.pendingAdjustment) {
          setShowAdaptiveSuggestion(true)
        }
      })
    }
  }, [goal?.id, showGoalStats])

  // Days remaining in current period
  const periodDaysLeft = useMemo(() => {
    if (!goal) return 0
    try {
      const info = getPeriodInfo(goal)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return Math.max(0, Math.ceil((info.periodEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
    } catch {
      return 0
    }
  }, [goal?.id, goal?.periodNumber])

  if (!plant) return null

  const isWateredToday = isToday(plant.last_watered_at)

  const isSleeping = plant.status === 'dead' || plant.status === 'sleeping'
  const isResting = plant.status === 'resting' || plant.status === 'dormant'
  const hasGoal = !!plant.goal_mode

  const startedDate = new Date(plant.started_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const handleWater = async () => {
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

  const handleGoalComplete = async () => {
    const newGoal = await getGoalForPlant(plant.id)
    setGoal(newGoal)
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
    // Refresh journal data if on journal tab
    if (activeTab === 'journal') {
      const data = await getPlantJournalData(plant.id)
      setJournalData(data)
    }
  }

  const handleAdaptiveComplete = () => {
    if (goal) {
      getGoalForPlant(plant.id).then(setGoal)
      getGoalStats(goal.id).then(setGoalStats)
      getAdaptiveAnalysis(goal.id).then(setAdaptiveAnalysis)
    }
  }

  const handleAddReflection = (milestone: MilestoneData) => {
    setReflectionMilestone(milestone)
    setShowReflectionModal(true)
  }

  const handleReflectionComplete = async () => {
    // Refresh journal data
    if (plant) {
      const data = await getPlantJournalData(plant.id)
      setJournalData(data)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto p-0 w-full sm:max-w-md">
          {/* Hero Header - Always visible */}
          <HeroHeader
            plant={plant}
            goal={goal}
            weather={weather}
            isWatering={isWatering}
            earnedXp={earnedXp}
            showXp={showXp}
            isSleeping={isSleeping}
            isResting={isResting}
            hasGoal={hasGoal}
          />

          {/* Main Tabs */}
          <div className="px-5 pb-8">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)} className="mt-4">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="overview" className="text-xs">
                  <Heart className="h-3.5 w-3.5 mr-1.5" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="journal" className="text-xs">
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                  Journal
                </TabsTrigger>
                <TabsTrigger value="stats" className="text-xs">
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                  Stats
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="mt-0 space-y-5">
                {/* Sleeping plant message */}
                {isSleeping && (
                  <div className={cn(
                    'p-4 rounded-xl',
                    'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40',
                    'ring-1 ring-indigo-200/50 dark:ring-indigo-800/30'
                  )}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                        <Moon className="h-4 w-4 text-indigo-500" />
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                          Sleeping peacefully
                        </h5>
                        <p className="text-xs text-indigo-600/80 dark:text-indigo-400/80 mt-1">
                          Wake it anytime by watering - your journey continues where you left off.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Why I Started */}
                {plant.why_i_started && (
                  <div className={cn(
                    'p-4 rounded-xl',
                    'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/40 dark:to-indigo-950/40',
                    'ring-1 ring-purple-200/50 dark:ring-purple-800/30'
                  )}>
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                        <Lightbulb className="h-4 w-4 text-purple-500" />
                      </div>
                      <div>
                        <h5 className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-1">
                          Why I Started
                        </h5>
                        <p className="text-sm text-purple-600 dark:text-purple-400 italic leading-relaxed">
                          &ldquo;{plant.why_i_started}&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Rhythm View (7 days) */}
                {quickRhythm && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-emerald-500" />
                        This Week
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-slate-500 hover:text-slate-700"
                        onClick={() => setActiveTab('journal')}
                      >
                        See journal
                        <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                      </Button>
                    </div>
                    <div className="rounded-xl bg-slate-900/80 p-3">
                      <RhythmView
                        activityDates={quickRhythm.activities.map(a => a.logged_date)}
                        days={7}
                        size="md"
                      />
                    </div>
                  </div>
                )}

                {/* Goal Progress (compact) */}
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
                    <PeriodTargetDisplay goal={goal} variant="full" />
                    {periodDaysLeft > 0 && (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{periodDaysLeft} day{periodDaysLeft !== 1 ? 's' : ''} remaining in {goal.periodLabel}</span>
                      </div>
                    )}
                    <GoalJourneyMap goal={goal} />
                  </div>
                )}

                {/* Primary Action Button */}
                <div className="space-y-2.5">
                  {hasGoal && goal ? (
                    <Button
                      className={cn(
                        'w-full h-12 text-base font-semibold rounded-xl shadow-lg transition-all',
                        isWatering && 'animate-pulse',
                        !isWateredToday && 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-indigo-500/25'
                      )}
                      size="lg"
                      variant={isWateredToday ? 'secondary' : 'default'}
                      onClick={() => setShowGoalLog(true)}
                      disabled={isWateredToday}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      {isWateredToday ? 'Logged for today' : isSleeping ? 'Wake & Log Progress' : 'Log Progress'}
                    </Button>
                  ) : (
                    <Button
                      className={cn(
                        'w-full h-12 text-base font-semibold rounded-xl shadow-lg transition-all',
                        isWatering && 'animate-pulse',
                        !isWateredToday && 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-blue-500/25'
                      )}
                      size="lg"
                      variant={isWateredToday ? 'secondary' : 'default'}
                      onClick={handleWater}
                      disabled={isWatering || isWateredToday}
                    >
                      <Droplets className={cn('h-5 w-5 mr-2', isWatering && 'text-blue-200')} />
                      {isWateredToday ? 'Watered today' : isWatering ? 'Watering...' : isSleeping ? 'Wake Plant' : 'Water Plant'}
                    </Button>
                  )}

                  {!hasGoal && (
                    hasGoals ? (
                      <Button
                        variant="outline"
                        className="w-full h-11 rounded-xl font-medium border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                        onClick={() => setShowGoalWizard(true)}
                      >
                        <Target className="h-4 w-4 mr-2" />
                        Add Goal Tracking
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full h-11 rounded-xl font-medium border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 opacity-80"
                        onClick={() => showUpgradeModal('level_6_goals')}
                      >
                        <Lock className="h-4 w-4 mr-2 text-amber-500" />
                        <span className="flex items-center gap-1.5">
                          Goal Tracking
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 font-semibold">
                            PRO
                          </span>
                        </span>
                      </Button>
                    )
                  )}
                </div>

                {/* Quick Stats Preview */}
                <div className="flex items-center justify-center gap-6 py-3">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-orange-500">
                      <Flame className="h-4 w-4" />
                      <span className="text-lg font-bold">{plant.current_streak}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase">Streak</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-emerald-500">
                      <TrendingUp className="h-4 w-4" />
                      <span className="text-lg font-bold">{Math.round(plant.growth_percentage)}%</span>
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase">Growth</p>
                  </div>
                  <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-blue-500">
                      <Droplets className="h-4 w-4" />
                      <span className="text-lg font-bold">{plant.total_waterings}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 uppercase">Waters</p>
                  </div>
                </div>
              </TabsContent>

              {/* Journal Tab */}
              <TabsContent value="journal" className="mt-0 space-y-6">
                {journalLoading ? (
                  <PlantDetailSkeleton tab="journal" />
                ) : journalData ? (
                  <>
                    {/* Milestones Section */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-500" />
                        Journey Milestones
                      </h4>
                      <MilestoneTimeline
                        milestones={journalData.milestones}
                        onAddReflection={handleAddReflection}
                      />
                    </div>

                    {/* Journal Timeline */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-purple-500" />
                        Activity Timeline
                      </h4>
                      <JournalTimeline entries={journalData.entries} />
                    </div>
                  </>
                ) : (
                  <PlantDetailSkeleton tab="journal" />
                )}
              </TabsContent>

              {/* Stats Tab */}
              <TabsContent value="stats" className="mt-0 space-y-5">
                {statsLoading ? (
                  <PlantDetailSkeleton tab="stats" />
                ) : (
                  <>
                    {/* Moisture & Growth */}
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

                    {/* Streak Stats */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-amber-500" />
                        Statistics
                      </h4>
                      <div className="grid grid-cols-4 gap-2">
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
                        <div className="p-2.5 rounded-xl text-center bg-slate-100/80 dark:bg-slate-800/60">
                          <Trophy className="h-3.5 w-3.5 text-yellow-500 mx-auto mb-0.5" />
                          <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{plant.longest_streak}</p>
                          <p className="text-[9px] text-slate-400 uppercase">Best</p>
                        </div>
                        <div className="p-2.5 rounded-xl text-center bg-slate-100/80 dark:bg-slate-800/60">
                          <Droplets className="h-3.5 w-3.5 text-blue-500 mx-auto mb-0.5" />
                          <p className="text-lg font-bold text-slate-700 dark:text-slate-300">{plant.total_waterings}</p>
                          <p className="text-[9px] text-slate-400 uppercase">Waters</p>
                        </div>
                      </div>
                    </div>

                    {/* Full Activity Rhythm */}
                    {fullActivityHistory && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-emerald-500" />
                          Activity Rhythm
                        </h4>
                        <div className="rounded-2xl bg-slate-900/80 p-4 space-y-4">
                          <RhythmView
                            activityDates={fullActivityHistory.activities.map(a => a.logged_date)}
                            days={14}
                            size="md"
                            showLegend
                          />
                          <div className="pt-2 border-t border-slate-700/50">
                            <RhythmStats
                              daysThisWeek={fullActivityHistory.rhythm.daysThisWeek}
                              daysThisMonth={fullActivityHistory.rhythm.daysThisMonth}
                              consistencyPercentage={fullActivityHistory.rhythm.consistencyPercentage}
                              className="justify-center"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Details */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Details</h4>
                      <div className="rounded-xl bg-slate-50/80 dark:bg-slate-800/40 divide-y divide-slate-200/50 dark:divide-slate-700/50">
                        {plant.habit_description && !plant.why_i_started && (
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
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SheetContent>
      </Sheet>

      {/* Modals */}
      <GoalSetupWizard
        plantId={plant.id}
        plantName={plant.name}
        open={showGoalWizard}
        onOpenChange={setShowGoalWizard}
        onComplete={handleGoalComplete}
      />

      {goal && (
        <GoalLogModal
          goal={goal}
          open={showGoalLog}
          onOpenChange={setShowGoalLog}
          onSuccess={handleGoalComplete}
        />
      )}

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
                  <AdaptiveSettings goal={goal} onUpdate={handleAdaptiveComplete} />
                </TabsContent>
              </Tabs>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {adaptiveAnalysis?.suggestion && adaptiveAnalysis?.pendingAdjustment && (
        <AdaptiveSuggestionModal
          suggestion={adaptiveAnalysis.suggestion}
          adjustmentId={adaptiveAnalysis.pendingAdjustment.id}
          open={showAdaptiveSuggestion}
          onOpenChange={setShowAdaptiveSuggestion}
          onComplete={handleAdaptiveComplete}
        />
      )}

      {reflectionMilestone && (
        <ReflectionModal
          plantId={plant.id}
          milestoneType={reflectionMilestone.type}
          milestoneTitle={reflectionMilestone.title}
          open={showReflectionModal}
          onOpenChange={setShowReflectionModal}
          onComplete={handleReflectionComplete}
        />
      )}
    </>
  )
}

// =====================================================
// Hero Header Component (extracted for cleaner code)
// =====================================================

interface HeroHeaderProps {
  plant: PlantWithType
  goal: GoalWithStats | null
  weather?: WeatherType | null
  isWatering: boolean
  earnedXp: number
  showXp: boolean
  isSleeping: boolean
  isResting: boolean
  hasGoal: boolean
}

function HeroHeader({
  plant,
  goal,
  weather,
  isWatering,
  earnedXp,
  showXp,
  isSleeping,
  isResting,
  hasGoal,
}: HeroHeaderProps) {
  return (
    <div className="relative">
      <div className={cn(
        'absolute inset-0 bg-gradient-to-b',
        isSleeping
          ? 'from-indigo-100 to-slate-100 dark:from-indigo-950/40 dark:to-slate-900'
          : isResting
            ? 'from-blue-100 to-slate-100 dark:from-blue-950/40 dark:to-slate-900'
            : plant.status === 'mature'
              ? 'from-emerald-100 via-green-50 to-white dark:from-emerald-900/40 dark:via-green-950/30 dark:to-slate-900'
              : plant.status === 'thriving'
                ? 'from-emerald-100 via-teal-50 to-white dark:from-emerald-900/40 dark:via-teal-950/30 dark:to-slate-900'
                : 'from-sky-100 via-emerald-50 to-white dark:from-sky-900/30 dark:via-emerald-950/20 dark:to-slate-900'
      )} />

      <div className="relative pt-8 pb-6 px-6">
        <SheetHeader className="text-center space-y-4">
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

            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold',
                  'shadow-lg shadow-black/10',
                  plant.status === 'thriving' && 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
                  plant.status === 'growing' && 'bg-emerald-500 text-white',
                  plant.status === 'mature' && 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white',
                  isResting && 'bg-blue-500 text-white',
                  plant.status === 'waiting' && 'bg-amber-500 text-white',
                  isSleeping && 'bg-indigo-500 text-white'
                )}
              >
                {plant.status === 'thriving' && <Sparkles className="h-3 w-3" />}
                {plant.status === 'growing' && <Sparkles className="h-3 w-3" />}
                {plant.status === 'mature' && <Trophy className="h-3 w-3" />}
                {isResting && <Moon className="h-3 w-3" />}
                {plant.status === 'waiting' && <Heart className="h-3 w-3" />}
                {isSleeping && <Moon className="h-3 w-3" />}
                {plant.status === 'thriving' && 'Thriving'}
                {plant.status === 'growing' && 'Growing'}
                {plant.status === 'mature' && 'Mature'}
                {isResting && 'Resting'}
                {plant.status === 'waiting' && 'Waiting'}
                {isSleeping && 'Sleeping'}
              </span>
            </div>
          </div>

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
  )
}

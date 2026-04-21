'use client'

/**
 * Plant Detail Sheet — Living Garden redesign
 *
 * Concept: Organic Biophilic + Calm Tech
 * - Sage palette via --garden-* tokens
 * - Fraunces display for plant name, Nunito body
 * - Dappled-light shadows, no harsh gradients
 * - Tabs: Overview | Journal | Stats
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
  Leaf,
} from 'lucide-react'
import type { PlantWithType, WeatherType, MilestoneType } from '@/types/database'
import { PlantVisual, XpPopup } from './plant-visual'
import { usePlants } from '@/lib/context/plants-context'
import { useSubscription } from '@/lib/context/subscription-context'
import { FeatureLock } from '@/components/game-ui/upgrade-modal'
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
  const { plants, waterPlant, updatePlant } = usePlants()
  const { hasGoals, showUpgradeModal } = useSubscription()
  const plant = initialPlant ? (plants.find(p => p.id === initialPlant.id) || initialPlant) : null

  const [isWatering, setIsWatering] = useState(false)
  const [showXp, setShowXp] = useState(false)
  const [earnedXp, setEarnedXp] = useState(0)
  const [activeTab, setActiveTab] = useState<TabValue>('overview')

  const [goal, setGoal] = useState<GoalWithStats | null>(null)
  const [goalStats, setGoalStats] = useState<GoalStatistics | null>(null)
  const [showGoalWizard, setShowGoalWizard] = useState(false)
  const [showGoalLog, setShowGoalLog] = useState(false)
  const [showGoalStats, setShowGoalStats] = useState(false)
  const [isLoadingGoal, setIsLoadingGoal] = useState(false)

  const [adaptiveAnalysis, setAdaptiveAnalysis] = useState<AdaptiveAnalysisResult | null>(null)
  const [showAdaptiveSuggestion, setShowAdaptiveSuggestion] = useState(false)

  const [quickRhythm, setQuickRhythm] = useState<ActivityHistory | null>(null)

  const [journalData, setJournalData] = useState<JournalData | null>(null)
  const [journalLoading, setJournalLoading] = useState(false)

  const [fullActivityHistory, setFullActivityHistory] = useState<ActivityHistory | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const [reflectionMilestone, setReflectionMilestone] = useState<MilestoneData | null>(null)
  const [showReflectionModal, setShowReflectionModal] = useState(false)

  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (plant && open) {
      setGoal(null)
      setQuickRhythm(null)

      const hasGoalMode = !!plant.goal_mode

      if (hasGoalMode) {
        setIsLoadingGoal(true)
        let cancelled = false
        Promise.all([
          getGoalForPlant(plant.id),
          getPlantActivityHistory(plant.id, 7),
        ]).then(([g, rhythm]) => {
          if (!cancelled) {
            setGoal(g)
            setQuickRhythm(rhythm)
            setIsLoadingGoal(false)
          }
        })
        return () => { cancelled = true }
      } else {
        setIsLoadingGoal(false)
        getPlantActivityHistory(plant.id, 7).then(setQuickRhythm)
      }
    }
  }, [plant?.id, open])

  useEffect(() => {
    if (!open) {
      setActiveTab('overview')
    }
    setJournalData(null)
    setFullActivityHistory(null)
  }, [open, plant?.id])

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
      setQuickRhythm(null)
      setFullActivityHistory(null)
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
    setQuickRhythm(null)
    setFullActivityHistory(null)
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
    if (plant) {
      const data = await getPlantJournalData(plant.id)
      setJournalData(data)
    }
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-y-auto p-0 w-full sm:max-w-md border-l-0 surface-paper">
          {/* ═══ Hero Header ═══ */}
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

          <div className="px-5 pb-10 pt-4">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
              <TabsList className="grid w-full grid-cols-3 mb-5 h-10 bg-mist/70 dark:bg-secondary rounded-full p-1">
                <TabsTrigger
                  value="overview"
                  className="text-xs rounded-full data-[state=active]:bg-white data-[state=active]:text-canopy data-[state=active]:shadow-sm dark:data-[state=active]:bg-accent cursor-pointer"
                >
                  <Heart className="h-3.5 w-3.5 mr-1.5" />
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="journal"
                  className="text-xs rounded-full data-[state=active]:bg-white data-[state=active]:text-canopy data-[state=active]:shadow-sm dark:data-[state=active]:bg-accent cursor-pointer"
                >
                  <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                  Journal
                </TabsTrigger>
                <TabsTrigger
                  value="stats"
                  className="text-xs rounded-full data-[state=active]:bg-white data-[state=active]:text-canopy data-[state=active]:shadow-sm dark:data-[state=active]:bg-accent cursor-pointer"
                >
                  <BarChart3 className="h-3.5 w-3.5 mr-1.5" />
                  Stats
                </TabsTrigger>
              </TabsList>

              {/* ═══ Overview Tab ═══ */}
              <TabsContent value="overview" className="mt-0 space-y-5">
                {/* Sleeping notice */}
                {isSleeping && (
                  <div className="p-4 rounded-2xl bg-sky-garden/40 dark:bg-accent ring-1 ring-moss/20">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-white/80 dark:bg-muted shadow-sm">
                        <Moon className="h-4 w-4 text-leaf" />
                      </div>
                      <div>
                        <h5 className="text-sm font-semibold text-canopy dark:text-foreground">
                          Sleeping peacefully
                        </h5>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          Wake it anytime by watering — your journey continues where you left off.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Why I started */}
                {plant.why_i_started && (
                  <div className="p-4 rounded-2xl bg-bloom/10 dark:bg-accent/60 ring-1 ring-bloom/25">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-white/80 dark:bg-muted shadow-sm">
                        <Lightbulb className="h-4 w-4 text-bloom" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-[10px] font-bold text-canopy/70 dark:text-muted-foreground uppercase tracking-[0.12em] mb-1.5">
                          Why I Started
                        </h5>
                        <p className="font-display text-[15px] text-canopy dark:text-foreground italic leading-snug">
                          &ldquo;{plant.why_i_started}&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* This Week — Rhythm */}
                {quickRhythm && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-canopy dark:text-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-leaf" />
                        This Week
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-canopy hover:bg-mist cursor-pointer"
                        onClick={() => setActiveTab('journal')}
                      >
                        See journal
                        <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
                      </Button>
                    </div>
                    <div className="rounded-2xl bg-white/70 dark:bg-card p-4 ring-1 ring-border shadow-dappled">
                      <RhythmView
                        activityDates={quickRhythm.activities.map(a => a.logged_date)}
                        days={7}
                        size="md"
                      />
                    </div>
                  </div>
                )}

                {/* Goal Progress — Hero number style */}
                {isLoadingGoal && hasGoal && (
                  <div className="rounded-2xl bg-white/70 dark:bg-card p-5 space-y-3 ring-1 ring-border shadow-dappled animate-pulse">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-mist dark:bg-muted">
                        <Target className="h-4 w-4 text-leaf/40" />
                      </div>
                      <div className="h-4 w-24 bg-mist dark:bg-muted rounded" />
                    </div>
                    <div className="h-10 w-32 bg-mist dark:bg-muted rounded" />
                    <div className="h-2 w-full bg-mist dark:bg-muted rounded-full" />
                  </div>
                )}
                {!isLoadingGoal && goal && (
                  <div className="rounded-2xl bg-white/80 dark:bg-card p-5 space-y-4 ring-1 ring-border shadow-dappled">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-leaf/10 dark:bg-accent">
                          <Target className="h-4 w-4 text-leaf" />
                        </div>
                        <span className="text-sm font-semibold text-canopy dark:text-foreground">Goal Progress</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs text-leaf hover:text-canopy hover:bg-mist cursor-pointer"
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

                {/* Primary CTAs */}
                <div className="space-y-2.5 pt-1">
                  {hasGoal && (isLoadingGoal || goal) ? (
                    <Button
                      className={cn(
                        'w-full h-12 text-base font-semibold rounded-full transition-all cursor-pointer',
                        'bg-leaf hover:bg-canopy text-white shadow-leaf',
                        isWatering && 'animate-pulse',
                        isWateredToday && 'bg-mist text-muted-foreground hover:bg-mist shadow-none dark:bg-muted'
                      )}
                      onClick={() => setShowGoalLog(true)}
                      disabled={isWateredToday || isLoadingGoal}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      {isLoadingGoal ? 'Loading…' : isWateredToday ? 'Logged for today' : isSleeping ? 'Wake & Log Progress' : 'Log Progress'}
                    </Button>
                  ) : (
                    <Button
                      className={cn(
                        'w-full h-12 text-base font-semibold rounded-full transition-all cursor-pointer',
                        'bg-leaf hover:bg-canopy text-white shadow-leaf',
                        isWatering && 'animate-pulse',
                        isWateredToday && 'bg-mist text-muted-foreground hover:bg-mist shadow-none dark:bg-muted'
                      )}
                      onClick={handleWater}
                      disabled={isWatering || isWateredToday}
                    >
                      <Droplets className={cn('h-5 w-5 mr-2', isWatering && 'animate-bounce-subtle')} />
                      {isWateredToday ? 'Watered today' : isWatering ? 'Watering…' : isSleeping ? 'Wake Plant' : 'Water Plant'}
                    </Button>
                  )}

                  {!hasGoal && (
                    hasGoals ? (
                      <Button
                        variant="outline"
                        className="w-full h-11 rounded-full font-medium border-border bg-white/60 hover:bg-white text-canopy cursor-pointer dark:bg-card dark:hover:bg-accent"
                        onClick={() => setShowGoalWizard(true)}
                      >
                        <Target className="h-4 w-4 mr-2 text-leaf" />
                        Add Goal Tracking
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full h-11 rounded-full font-medium border-border bg-white/60 hover:bg-white text-canopy cursor-pointer dark:bg-card dark:hover:bg-accent"
                        onClick={() => showUpgradeModal('level_6_goals')}
                      >
                        <Lock className="h-4 w-4 mr-2 text-bloom" />
                        <span className="flex items-center gap-1.5">
                          Goal Tracking
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-bloom/20 text-bloom font-bold tracking-wide">
                            PRO
                          </span>
                        </span>
                      </Button>
                    )
                  )}
                </div>

                {/* Quick stats row */}
                <div className="flex items-center justify-around py-3">
                  <QuickStat
                    icon={<Flame className="h-4 w-4" />}
                    value={plant.current_streak}
                    label="Streak"
                    tone="bloom"
                  />
                  <div className="h-8 w-px bg-border" />
                  <QuickStat
                    icon={<TrendingUp className="h-4 w-4" />}
                    value={`${Math.round(plant.growth_percentage)}%`}
                    label="Growth"
                    tone="leaf"
                  />
                  <div className="h-8 w-px bg-border" />
                  <QuickStat
                    icon={<Droplets className="h-4 w-4" />}
                    value={plant.total_waterings}
                    label="Waters"
                    tone="moisture"
                  />
                </div>
              </TabsContent>

              {/* ═══ Journal Tab ═══ */}
              <TabsContent value="journal" className="mt-0 space-y-6">
                {journalLoading ? (
                  <PlantDetailSkeleton tab="journal" />
                ) : journalData ? (
                  <>
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-canopy dark:text-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-bloom" />
                        Journey Milestones
                      </h4>
                      <MilestoneTimeline
                        milestones={journalData.milestones}
                        onAddReflection={handleAddReflection}
                      />
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-canopy dark:text-foreground flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-leaf" />
                        Activity Timeline
                      </h4>
                      <JournalTimeline entries={journalData.entries} />
                    </div>
                  </>
                ) : (
                  <PlantDetailSkeleton tab="journal" />
                )}
              </TabsContent>

              {/* ═══ Stats Tab ═══ */}
              <TabsContent value="stats" className="mt-0 space-y-5">
                {statsLoading ? (
                  <PlantDetailSkeleton tab="stats" />
                ) : (
                  <>
                    {/* Moisture & Growth — unified card */}
                    <div className="rounded-2xl bg-white/80 dark:bg-card p-5 space-y-4 ring-1 ring-border shadow-dappled">
                      <MeterRow
                        icon={<Droplets className="h-4 w-4" />}
                        label="Moisture"
                        value={plant.current_moisture}
                        tone={
                          plant.current_moisture >= 70 ? 'moisture'
                            : plant.current_moisture >= 40 ? 'bloom'
                              : 'danger'
                        }
                      />
                      <div className="h-px bg-border" />
                      <MeterRow
                        icon={<Leaf className="h-4 w-4" />}
                        label="Growth"
                        value={plant.growth_percentage}
                        tone={plant.status === 'dead' ? 'ash' : 'leaf'}
                        suffix={
                          plant.status === 'mature'
                            ? 'Complete'
                            : `~${Math.ceil(plant.plant_type.maturity_days * (100 - plant.growth_percentage) / 100)}d left`
                        }
                      />
                    </div>

                    {/* Stats grid */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-canopy dark:text-foreground flex items-center gap-2">
                        <Zap className="h-4 w-4 text-bloom" />
                        Statistics
                      </h4>
                      <div className="grid grid-cols-4 gap-2.5">
                        <div className="col-span-2 p-4 rounded-2xl text-center bg-bloom/10 dark:bg-accent/60 ring-1 ring-bloom/20">
                          <div className="flex items-center justify-center gap-1.5 mb-1">
                            <Flame className="h-4 w-4 text-bloom" />
                            <span className="text-[10px] uppercase tracking-[0.12em] font-bold text-canopy/70 dark:text-muted-foreground">Streak</span>
                          </div>
                          <p className="font-display text-3xl font-semibold text-canopy dark:text-foreground leading-none">{plant.current_streak}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">days</p>
                        </div>
                        <div className="p-3 rounded-2xl text-center bg-mist/70 dark:bg-muted">
                          <Trophy className="h-3.5 w-3.5 text-bloom mx-auto mb-1" />
                          <p className="font-display text-xl font-semibold text-canopy dark:text-foreground leading-none">{plant.longest_streak}</p>
                          <p className="text-[9px] text-muted-foreground uppercase mt-0.5 tracking-wider">Best</p>
                        </div>
                        <div className="p-3 rounded-2xl text-center bg-mist/70 dark:bg-muted">
                          <Droplets className="h-3.5 w-3.5 text-moisture mx-auto mb-1" />
                          <p className="font-display text-xl font-semibold text-canopy dark:text-foreground leading-none">{plant.total_waterings}</p>
                          <p className="text-[9px] text-muted-foreground uppercase mt-0.5 tracking-wider">Waters</p>
                        </div>
                      </div>
                    </div>

                    {/* Activity rhythm */}
                    {fullActivityHistory && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-canopy dark:text-foreground flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-leaf" />
                          Activity Rhythm
                        </h4>
                        <div className="rounded-2xl bg-white/80 dark:bg-card p-4 space-y-4 ring-1 ring-border shadow-dappled">
                          <RhythmView
                            activityDates={fullActivityHistory.activities.map(a => a.logged_date)}
                            days={14}
                            size="md"
                            showLegend
                          />
                          <div className="pt-3 border-t border-border">
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
                      <h4 className="text-sm font-semibold text-canopy dark:text-foreground">Details</h4>
                      <div className="rounded-2xl bg-white/70 dark:bg-card ring-1 ring-border divide-y divide-border overflow-hidden shadow-dappled">
                        {plant.habit_description && !plant.why_i_started && (
                          <div className="p-4">
                            <p className="font-display text-[15px] text-canopy dark:text-foreground italic leading-snug">
                              &ldquo;{plant.habit_description}&rdquo;
                            </p>
                          </div>
                        )}
                        <DetailRow icon={<Calendar className="h-4 w-4" />} label="Started" value={startedDate} />
                        <DetailRow icon={<Clock className="h-4 w-4" />} label="Maturity" value={`${plant.plant_type.maturity_days} days`} />
                      </div>
                      {plant.plant_type.special_effect && (
                        <div className="p-4 rounded-2xl bg-moss/10 dark:bg-accent/60 ring-1 ring-moss/25">
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="h-4 w-4 text-leaf" />
                            <span className="text-sm font-semibold text-canopy dark:text-foreground">Special Ability</span>
                          </div>
                          <p className="text-sm text-muted-foreground capitalize">
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
          <SheetContent className="overflow-y-auto sm:max-w-lg surface-paper border-l-0">
            <SheetHeader className="px-1">
              <SheetTitle className="font-display text-2xl font-semibold text-canopy dark:text-foreground">
                Goal Statistics
              </SheetTitle>
              <SheetDescription className="text-muted-foreground">
                {plant.name}
              </SheetDescription>
            </SheetHeader>
            <div className="mt-5 px-1">
              <Tabs defaultValue="progress" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-mist/70 dark:bg-secondary rounded-full h-10 p-1">
                  <TabsTrigger value="progress" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-canopy data-[state=active]:shadow-sm dark:data-[state=active]:bg-accent cursor-pointer">
                    Progress
                  </TabsTrigger>
                  <TabsTrigger value="performance" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-canopy data-[state=active]:shadow-sm dark:data-[state=active]:bg-accent cursor-pointer">
                    Performance
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-canopy data-[state=active]:shadow-sm dark:data-[state=active]:bg-accent cursor-pointer">
                    Settings
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="progress" className="mt-5">
                  {goalStats ? (
                    <GoalStats stats={goalStats} />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading statistics…
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="performance" className="mt-5 space-y-4">
                  {adaptiveAnalysis ? (
                    <>
                      <PerformanceOverview analysis={adaptiveAnalysis.analysis} />
                      <AdjustmentHistory goalId={goal.id} />
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading performance data…
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="settings" className="mt-5">
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
// Hero Header — Living Garden
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
    <div className="relative surface-garden">
      <div className="relative pt-10 pb-8 px-6">
        <div className="text-center space-y-4">
          {/* Plant visual in floating card */}
          <div className="relative mx-auto">
            <div className="relative w-32 h-32 mx-auto rounded-[28px] flex items-center justify-center bg-white/90 dark:bg-card backdrop-blur-sm shadow-dappled-lg ring-1 ring-white/60 dark:ring-white/5">
              <PlantVisual
                plant={plant}
                size="xl"
                showWateringEffect={isWatering}
                weather={weather}
              />
              <XpPopup amount={earnedXp} show={showXp} />
            </div>

            {/* Status pill — floating at bottom */}
            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
              <StatusPill
                status={plant.status}
                isResting={isResting}
                isSleeping={isSleeping}
              />
            </div>
          </div>

          {/* Plant name — Fraunces */}
          <div className="pt-3">
            <SheetTitle asChild>
              <h2 className="font-display text-[28px] font-semibold leading-tight text-canopy dark:text-foreground tracking-tight">
                {plant.name}
              </h2>
            </SheetTitle>
            <SheetDescription asChild>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <span className="text-sm text-muted-foreground">{plant.plant_type.name}</span>
                {hasGoal && (goal ? <GoalModeBadge mode={goal.goal_mode} /> : <GoalModeBadge mode={plant.goal_mode!} />)}
              </div>
            </SheetDescription>
          </div>
        </div>
      </div>
    </div>
  )
}

// =====================================================
// Small components
// =====================================================

function StatusPill({
  status,
  isResting,
  isSleeping,
}: {
  status: PlantWithType['status']
  isResting: boolean
  isSleeping: boolean
}) {
  const config = isSleeping
    ? { icon: <Moon className="h-3 w-3" />, label: 'Sleeping', className: 'bg-accent text-canopy dark:text-foreground' }
    : isResting
      ? { icon: <Moon className="h-3 w-3" />, label: 'Resting', className: 'bg-sky-garden text-canopy' }
      : status === 'mature'
        ? { icon: <Trophy className="h-3 w-3" />, label: 'Mature', className: 'bg-bloom text-canopy' }
        : status === 'thriving'
          ? { icon: <Sparkles className="h-3 w-3" />, label: 'Thriving', className: 'bg-leaf text-white' }
          : status === 'waiting'
            ? { icon: <Heart className="h-3 w-3" />, label: 'Waiting', className: 'bg-bloom/80 text-canopy' }
            : { icon: <Leaf className="h-3 w-3" />, label: 'Growing', className: 'bg-moss text-white' }

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold shadow-dappled',
      config.className
    )}>
      {config.icon}
      {config.label}
    </span>
  )
}

function QuickStat({
  icon,
  value,
  label,
  tone,
}: {
  icon: React.ReactNode
  value: React.ReactNode
  label: string
  tone: 'leaf' | 'bloom' | 'moisture'
}) {
  const toneColor = {
    leaf: 'text-leaf',
    bloom: 'text-bloom',
    moisture: 'text-moisture',
  }[tone]

  return (
    <div className="text-center">
      <div className={cn('flex items-center justify-center gap-1', toneColor)}>
        {icon}
        <span className="font-display text-lg font-semibold tabular-nums">{value}</span>
      </div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
    </div>
  )
}

function MeterRow({
  icon,
  label,
  value,
  tone,
  suffix,
}: {
  icon: React.ReactNode
  label: string
  value: number
  tone: 'moisture' | 'leaf' | 'bloom' | 'danger' | 'ash'
  suffix?: string
}) {
  const toneCfg = {
    moisture: { color: 'text-moisture', bg: 'bg-moisture' },
    leaf: { color: 'text-leaf', bg: 'bg-leaf' },
    bloom: { color: 'text-bloom', bg: 'bg-bloom' },
    danger: { color: 'text-moisture-low', bg: 'bg-moisture-low' },
    ash: { color: 'text-ash', bg: 'bg-ash' },
  }[tone]

  const pct = Math.max(0, Math.min(100, value))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex p-1.5 rounded-lg bg-mist dark:bg-muted', toneCfg.color)}>
            {icon}
          </span>
          <span className="text-sm font-medium text-canopy dark:text-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          {suffix && <span className="text-[11px] text-muted-foreground">{suffix}</span>}
          <span className={cn('font-display text-sm font-semibold tabular-nums', toneCfg.color)}>
            {Math.round(pct)}%
          </span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-mist dark:bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-[width] duration-700 ease-out', toneCfg.bg)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 p-4">
      <span className="text-muted-foreground flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-canopy dark:text-foreground">{value}</p>
      </div>
    </div>
  )
}

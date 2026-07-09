'use client'

import { useState, useEffect, useMemo } from 'react'
import { PlantCard } from '@/components/plants/plant-card'
import { PlantDetailSheet } from '@/components/plants/plant-detail-sheet'
import { AddPlantDialog } from '@/components/plants/add-plant-dialog'
import { BackgroundAudio } from './background-audio'
import { IsometricGarden } from './isometric-garden'
import { FocusGardenView } from './focus-garden-view'
import { GardenSky } from './garden-sky'
import { WeatherEffects } from './weather-effects'
import { WelcomeBackModal } from '@/components/game-ui/welcome-back-modal'
import { PlantImage } from '@/components/plants/plant-image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Droplets,
  Flame,
  Flower2,
  LayoutGrid,
  Leaf,
  ListChecks,
  Plus,
  Sprout,
  Target,
  TreesIcon,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { GameHud } from '@/components/game-ui/game-hud'
import { cn, isToday } from '@/lib/utils'
import { usePlants } from '@/lib/context/plants-context'
import { useMood } from '@/lib/context/mood-context'
import { usePlantTypes, useProfile } from '@/lib/context/dashboard-data-context'
import { useBreathingRhythm } from '@/hooks/use-breathing-rhythm'
import { useDevOverride } from '@/components/dev/dev-debug-context'
import { getGoalsForPlants, type GoalWithStats } from '@/lib/actions/goals'
import { toast } from 'sonner'
import type { PlantWithType, Profile, WeatherType } from '@/types/database'

const LAST_VISIT_KEY = 'habit-garden-last-visit'
const ABSENCE_THRESHOLD_DAYS = 3

function getDaysDiff(dateStr: string, today: string): number {
  const prev = new Date(dateStr)
  const now = new Date(today)
  const diffMs = now.getTime() - prev.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

type ViewMode = 'today' | 'garden' | 'list' | 'focus'

interface GardenViewProps {
  weather?: WeatherType | null
}

export function GardenView({}: GardenViewProps) {
  // Get plants from context with optimistic updates
  const { plants, waterPlant, logGoal, isSyncing } = usePlants()
  const { mood } = useMood()
  // Get plantTypes and profile from DashboardDataContext
  const plantTypes = usePlantTypes()
  const { profile } = useProfile()

  // Dev overrides for testing
  const effectiveLevel = useDevOverride('level', profile?.level ?? 1)

  // Map mood to weather
  const moodWeather: WeatherType = (() => {
    switch (mood) {
      case 5: // Sunny
        return 'sunny';
      case 4: // Partly Cloudy
        return 'cloudy';
      case 3: // Cloudy
        return 'cloudy';
      case 2: // Rainy
        return 'rainy';
      case 1: // Stormy
        return 'stormy';
      default:
        return 'sunny';
    }
  })();

  const displayWeather = moodWeather;

  const [selectedPlant, setSelectedPlant] = useState<PlantWithType | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [quickLogPlant, setQuickLogPlant] = useState<PlantWithType | null>(null)
  const [isZenMode, setIsZenMode] = useState(false)

  // Welcome back system
  const [welcomeBackOpen, setWelcomeBackOpen] = useState(false)
  const [welcomeBackDays, setWelcomeBackDays] = useState(0)
  const [welcomeBackPending, setWelcomeBackPending] = useState(false)

  // Detect absence on mount and show welcome back modal if away >= 3 days
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY)

    if (lastVisit && lastVisit !== today) {
      const daysDiff = getDaysDiff(lastVisit, today)
      if (daysDiff >= ABSENCE_THRESHOLD_DAYS) {
        queueMicrotask(() => {
          setWelcomeBackDays(daysDiff)
          setWelcomeBackPending(true)
          setWelcomeBackOpen(true)
        })
      }
    }

    // Always update last visit to today
    localStorage.setItem(LAST_VISIT_KEY, today)
  }, [])

  const sleepingPlantCount = plants.filter(
    (p) => p.status === 'sleeping' || p.status === 'waiting'
  ).length

  // After onboarding: auto-open AddPlantDialog if flagged and garden is empty
  useEffect(() => {
    const shouldPrompt = localStorage.getItem("habit-garden-prompt-add-plant")
    if (shouldPrompt === "true" && plants.length === 0) {
      localStorage.removeItem("habit-garden-prompt-add-plant")
      // Small delay so the garden renders before the dialog appears
      const timer = setTimeout(() => setAddDialogOpen(true), 600)
      return () => clearTimeout(timer)
    }
  }, [plants.length])
  const [currentZenTrack, setCurrentZenTrack] = useState(0)
  const breathingValue = useBreathingRhythm(isZenMode)

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    // Initialize from localStorage on client side
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gardenViewMode') as ViewMode | null
      if (saved === 'today' || saved === 'garden' || saved === 'list' || saved === 'focus') {
        return saved
      }
    }
    return 'today'
  })

  // Save preference
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('gardenViewMode', mode)
  }

  const handlePlantClick = (plant: PlantWithType) => {
    setSelectedPlant(plant)
    setSheetOpen(true)
  }

  const handleWaterPlant = async (plant: PlantWithType) => {
    await waterPlant(plant.id)
  }

  const handleQuickGoalLog = async (plant: PlantWithType, value: number, notes?: string) => {
    const result = await logGoal(plant.id, value, notes)
    if (result.success) {
      toast.success(`Logged ${formatHabitValue(value)} ${plant.goal?.unit ?? ''}`.trim(), {
        description: `${plant.name} is updated for today.`,
      })
    }
  }

  // Include all living gentle-growth statuses (thriving/resting/waiting/sleeping/growing)
  const growingPlants = plants.filter((p) => p.status !== 'mature' && p.status !== 'dead' && p.status !== 'dormant')
  const maturePlants = plants.filter((p) => p.status === 'mature')
  const deadPlants = plants.filter((p) => p.status === 'dead' || p.status === 'dormant')

  // Batch fetch goals for all plants with goal_mode (1 query instead of N)
  const [goalsMap, setGoalsMap] = useState<Map<string, GoalWithStats>>(new Map())
  const plantIdsWithGoals = useMemo(
    () => plants.filter(p => !!p.goal_mode).map(p => p.id),
    [plants]
  )
  useEffect(() => {
    if (plantIdsWithGoals.length === 0) {
      queueMicrotask(() => setGoalsMap(new Map()))
      return
    }
    getGoalsForPlants(plantIdsWithGoals).then(setGoalsMap)
  }, [plantIdsWithGoals])

  // Empty state
  if (plants.length === 0) {
    return (
      <div className="h-full relative">
        {/* Background Audio for Zen Mode */}
        <BackgroundAudio
          isPlaying={isZenMode}
          currentTrackIndex={currentZenTrack}
          onTrackChange={setCurrentZenTrack}
          className="fixed top-14 right-2 sm:top-3 sm:right-3 z-30"
        />

        {/* Sky background */}
        <GardenSky
          weather={displayWeather}
          breathingValue={breathingValue}
        />

        {/* Game HUD */}
        {viewMode !== 'today' && <GameHud profile={profile} />}

        {/* View toggle - top center */}
        <ViewToggle
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          isZenMode={isZenMode}
          onZenModeChange={setIsZenMode}
        />

        {viewMode === 'today' ? (
          <EmptyTodayDashboard onAddPlant={() => setAddDialogOpen(true)} />
        ) : (
          <IsometricGarden
            plantTypes={plantTypes}
            weather={displayWeather}
            journalStreak={profile?.journal_streak ?? 0}
            userLevel={effectiveLevel}
            welcomeBackPending={welcomeBackPending}
            onWelcomeBackUsed={() => setWelcomeBackPending(false)}
          />
        )}

        <AddPlantDialog
          plantTypes={plantTypes}
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
        />
      </div>
    )
  }

  return (
    <div className="h-full relative">
      {/* Background Audio for Zen Mode */}
      <BackgroundAudio
        isPlaying={isZenMode}
        currentTrackIndex={currentZenTrack}
        onTrackChange={setCurrentZenTrack}
        className="fixed top-14 right-2 sm:top-3 sm:right-3 z-30"
      />

      {/* Sky background - fills entire screen (garden and focus modes) */}
      {(viewMode === 'garden' || viewMode === 'focus') && (
        <GardenSky
          weather={displayWeather}
          breathingValue={breathingValue}
        />
      )}

      {/* Weather Overlay - Renders on top of everything but below HUD (garden and focus modes) */}
      {(viewMode === 'garden' || viewMode === 'focus') && displayWeather && (
        <WeatherEffects
          weather={displayWeather}
          breathingValue={breathingValue}
        />
      )}

      {/* Game HUD - floating at top corners */}
      {viewMode !== 'today' && <GameHud profile={profile} />}

      {/* View toggle - top center */}
      <ViewToggle
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        isZenMode={isZenMode}
        onZenModeChange={setIsZenMode}
      />

      {/* Floating Add Plant button - only in list view */}
      {viewMode === 'list' && <FloatingAddButton onClick={() => setAddDialogOpen(true)} />}

      {/* Today View - habit-first tracking dashboard */}
      {viewMode === 'today' && (
        <TodayHabitDashboard
          plants={plants}
          profile={profile}
          goalsMap={goalsMap}
          isSyncing={isSyncing}
          onAddPlant={() => setAddDialogOpen(true)}
          onOpenPlant={handlePlantClick}
          onWaterPlant={handleWaterPlant}
          onQuickLog={handleQuickGoalLog}
          onOpenLog={setQuickLogPlant}
        />
      )}

      {/* Isometric Garden View - fills entire screen */}
      {viewMode === 'garden' && (
        <div className="h-full">
          <IsometricGarden
            plantTypes={plantTypes}
            weather={displayWeather}
            journalStreak={profile?.journal_streak ?? 0}
            userLevel={effectiveLevel}
            welcomeBackPending={welcomeBackPending}
            onWelcomeBackUsed={() => setWelcomeBackPending(false)}
          />
        </div>
      )}

      {/* Focus Garden View - goal-focused with visual states */}
      {viewMode === 'focus' && (
        <div className="h-full">
          <FocusGardenView
            plants={plants}
            plantTypes={plantTypes}
            weather={displayWeather}
            journalStreak={profile?.journal_streak ?? 0}
            userLevel={effectiveLevel}
          />
        </div>
      )}

      {/* List View (card grid with game styling) */}
      {viewMode === 'list' && (
        <div className="h-full overflow-y-auto pt-20 px-4 pb-36 space-y-6 bg-[linear-gradient(135deg,#FFFBF3_0%,#F4E6D0_42%,#E5EEF2_74%,#F1D8C7_100%)] dark:bg-[linear-gradient(135deg,#15110D_0%,#211A13_48%,#182126_78%,#2A1C16_100%)]">
          {/* Stats bar */}
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-950/30 rounded-full">
              <span className="text-sm">🌱</span>
              <span className="text-sm font-medium text-amber-800 dark:text-amber-300">{growingPlants.length} growing</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#E6EEDC] dark:bg-[#263224] rounded-full">
              <span className="text-sm">🌳</span>
              <span className="text-sm font-medium text-[#536B44] dark:text-[#B9D0A8]">{maturePlants.length} mature</span>
            </div>
            {deadPlants.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 rounded-full">
                <span className="text-sm">🪦</span>
                <span className="text-sm font-medium text-red-700 dark:text-red-400">{deadPlants.length} dead</span>
              </div>
            )}
          </div>

          {/* Growing Plants */}
          {growingPlants.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/30">
                  <span className="text-lg">🌱</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg">Growing</h2>
                  <p className="text-xs text-slate-500">{growingPlants.length} plants</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {growingPlants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    onClick={() => handlePlantClick(plant)}
                    goalStats={goalsMap.get(plant.id) ?? null}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Mature Plants */}
          {maturePlants.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8DAA78] to-[#6F8F63] flex items-center justify-center shadow-md shadow-lime-600/20">
                  <span className="text-lg">🌳</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg">Mature</h2>
                  <p className="text-xs text-slate-500">{maturePlants.length} plants</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {maturePlants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    onClick={() => handlePlantClick(plant)}
                    goalStats={goalsMap.get(plant.id) ?? null}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Dead Plants (Cemetery) */}
          {deadPlants.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shadow-md">
                  <span className="text-lg">🪦</span>
                </div>
                <div>
                  <h2 className="font-bold text-lg text-slate-500">Cemetery</h2>
                  <p className="text-xs text-slate-400">{deadPlants.length} plants</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {deadPlants.map((plant) => (
                  <PlantCard
                    key={plant.id}
                    plant={plant}
                    onClick={() => handlePlantClick(plant)}
                    goalStats={goalsMap.get(plant.id) ?? null}
                  />
                ))}
              </div>
            </section>
          )}

          <PlantDetailSheet
            plant={selectedPlant}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
          />
        </div>
      )}

      {/* Add plant dialog */}
      <AddPlantDialog
        plantTypes={plantTypes}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />

      <QuickLogDialog
        plant={quickLogPlant}
        open={!!quickLogPlant}
        onOpenChange={(open) => {
          if (!open) setQuickLogPlant(null)
        }}
        onSubmit={async (value, notes) => {
          if (!quickLogPlant) return
          await handleQuickGoalLog(quickLogPlant, value, notes)
          setQuickLogPlant(null)
        }}
      />

      {/* Welcome back modal */}
      <WelcomeBackModal
        open={welcomeBackOpen}
        onOpenChange={setWelcomeBackOpen}
        daysMissed={welcomeBackDays}
        sleepingPlantCount={sleepingPlantCount}
        onStartWatering={() => {
          setWelcomeBackOpen(false)
          handleViewModeChange('garden')
        }}
      />
    </div>
  )
}

function EmptyTodayDashboard({ onAddPlant }: { onAddPlant: () => void }) {
  return (
    <div className="relative z-10 flex h-full items-center justify-center px-4 pb-28 pt-24">
      <section className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 p-6 shadow-dappled-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/70 sm:p-8">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Sprout className="h-8 w-8" />
        </div>
        <Badge variant="secondary" className="mb-3 bg-primary/10 text-primary">
          Start with one habit
        </Badge>
        <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          Plant the first habit you want to see every day.
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          The new home screen is built around a daily loop: choose the next habit,
          check in fast, and let the garden become the reward layer after the action.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={onAddPlant} size="lg" className="h-12 gap-2 rounded-2xl">
            <Plus className="h-5 w-5" />
            Create first habit
          </Button>
          <div className="flex items-center gap-2 rounded-2xl border bg-background/70 px-4 py-3 text-sm text-muted-foreground">
            <ListChecks className="h-4 w-4 text-primary" />
            Today, streaks, progress, and garden feedback in one place.
          </div>
        </div>
      </section>
    </div>
  )
}

interface TodayHabitDashboardProps {
  plants: PlantWithType[]
  profile: Profile | null
  goalsMap: Map<string, GoalWithStats>
  isSyncing: boolean
  onAddPlant: () => void
  onOpenPlant: (plant: PlantWithType) => void
  onWaterPlant: (plant: PlantWithType) => Promise<void>
  onQuickLog: (plant: PlantWithType, value: number) => Promise<void>
  onOpenLog: (plant: PlantWithType) => void
}

function TodayHabitDashboard({
  plants,
  profile,
  goalsMap,
  isSyncing,
  onAddPlant,
  onOpenPlant,
  onWaterPlant,
  onQuickLog,
  onOpenLog,
}: TodayHabitDashboardProps) {
  const livingPlants = useMemo(
    () => plants.filter((plant) => plant.status !== 'dead' && plant.status !== 'dormant'),
    [plants]
  )
  const completedPlants = useMemo(
    () => livingPlants.filter((plant) => isHabitDoneToday(plant)),
    [livingPlants]
  )
  const duePlants = useMemo(
    () =>
      livingPlants
        .filter((plant) => !isHabitDoneToday(plant))
        .sort((a, b) => getHabitUrgency(b) - getHabitUrgency(a)),
    [livingPlants]
  )
  const completionPercent = livingPlants.length
    ? Math.round((completedPlants.length / livingPlants.length) * 100)
    : 0
  const focusPlant = duePlants[0] ?? completedPlants[0] ?? livingPlants[0]
  const attentionCount = duePlants.filter((plant) => getHabitUrgency(plant) >= 4).length
  const averageGoalProgress = getAverageGoalProgress(livingPlants)

  return (
    <div className="h-full overflow-y-auto bg-[linear-gradient(180deg,#FFFBF3_0%,#F4E6D0_42%,#E5EEF2_76%,#F1D8C7_100%)] px-4 pb-36 pt-24 dark:bg-[linear-gradient(180deg,#15110D_0%,#211A13_48%,#182126_78%,#2A1C16_100%)] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_400px]">
        <section className="space-y-5">
          <div className="rounded-[2rem] border border-[#EFE0C9] bg-white/82 p-5 shadow-dappled-lg backdrop-blur-xl dark:border-white/10 dark:bg-[#211A13]/78 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <Badge variant="secondary" className="mb-3 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  Today plan
                </Badge>
                <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-5xl">
                  {completionPercent === 100 ? 'Daily loop complete.' : 'Pick the next habit and move.'}
                </h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
                  {completionPercent === 100
                    ? 'You have checked in on every active habit. The garden can stay calm now.'
                    : `${duePlants.length} habit${duePlants.length === 1 ? '' : 's'} still need a check-in. Start with the smallest clear action.`}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:min-w-[340px]">
                <TodayMetric
                  icon={CheckCircle2}
                  label="Done"
                  value={`${completedPlants.length}/${livingPlants.length}`}
                  tone="sage"
                />
                <TodayMetric
                  icon={Flame}
                  label="Best streak"
                  value={String(getBestStreak(livingPlants))}
                  tone="amber"
                />
                <TodayMetric
                  icon={BarChart3}
                  label="Period"
                  value={`${averageGoalProgress}%`}
                  tone="blue"
                />
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div className="order-2 rounded-3xl border bg-background/80 p-4 dark:bg-slate-900/70 lg:order-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Today completion</span>
                  <span className="font-bold text-primary">{completionPercent}%</span>
                </div>
                <Progress value={completionPercent} className="mt-3 h-3 bg-primary/10" />
                <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock3 className="h-4 w-4 text-primary" />
                  {isSyncing ? 'Syncing latest check-in...' : 'Actions update immediately.'}
                </div>
              </div>

              {focusPlant && (
                <div className="order-1 relative overflow-hidden rounded-3xl border border-[#EBD8B8] bg-[radial-gradient(circle_at_85%_10%,rgba(201,130,47,0.30),transparent_34%),linear-gradient(135deg,rgba(246,239,226,0.92),rgba(255,255,255,0.78))] p-4 dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(217,149,69,0.14),rgba(33,26,19,0.88))] lg:order-2">
                  <div className="flex items-center gap-4">
                    <div className="flex h-24 w-24 shrink-0 items-end justify-center rounded-3xl bg-white/70 p-2 shadow-dappled dark:bg-white/5">
                      <PlantImage plant={focusPlant} size="2xl" alignBottom />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge className={cn('border-0', isHabitDoneToday(focusPlant) ? 'bg-[#6F8F63]' : 'bg-primary')}>
                          {isHabitDoneToday(focusPlant) ? 'Checked in' : 'Next best action'}
                        </Badge>
                        {focusPlant.easy_mode && (
                          <Badge variant="outline" className="bg-white/60 dark:bg-white/5">
                            2-minute seed
                          </Badge>
                        )}
                      </div>
                      <h2 className="truncate text-xl font-black text-foreground sm:text-2xl">
                        {focusPlant.name}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {focusPlant.tiny_seed || focusPlant.habit_description || 'A small daily check-in keeps this plant alive.'}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {focusPlant.goal ? (
                          <>
                            <Button onClick={() => onOpenLog(focusPlant)} className="gap-2 rounded-2xl">
                              <Zap className="h-4 w-4" />
                              Log progress
                            </Button>
                            <Button variant="secondary" onClick={() => onQuickLog(focusPlant, 1)} className="rounded-2xl">
                              +1 quick log
                            </Button>
                          </>
                        ) : (
                          <Button
                            onClick={() => onWaterPlant(focusPlant)}
                            disabled={isHabitDoneToday(focusPlant)}
                            className="gap-2 rounded-2xl"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {isHabitDoneToday(focusPlant) ? 'Done today' : 'Check in'}
                          </Button>
                        )}
                        <Button variant="ghost" onClick={() => onOpenPlant(focusPlant)} className="hidden gap-1 rounded-2xl sm:inline-flex">
                          Details
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">Action queue</h2>
                <p className="text-sm text-muted-foreground">
                  Ordered by habits that need attention first.
                </p>
              </div>
              <Button variant="outline" onClick={onAddPlant} className="shrink-0 gap-2 rounded-2xl bg-white/70 dark:bg-white/5">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </div>

            <div className="grid gap-3 xl:grid-cols-2">
              {duePlants.map((plant) => (
                <HabitActionCard
                  key={plant.id}
                  plant={plant}
                  goalStats={goalsMap.get(plant.id) ?? null}
                  status="due"
                  onOpen={onOpenPlant}
                  onWaterPlant={onWaterPlant}
                  onQuickLog={onQuickLog}
                  onOpenLog={onOpenLog}
                />
              ))}
              {duePlants.length === 0 && (
                <div className="rounded-3xl border border-[#D7E3C8] bg-[#F3F7ED]/90 p-5 text-[#405235] shadow-dappled dark:border-[#3A4A34] dark:bg-[#263224]/50 dark:text-[#DDEBCF]">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6" />
                    <div>
                      <h3 className="font-bold">Nothing urgent left today.</h3>
                      <p className="text-sm text-[#607A52] dark:text-[#B9D0A8]">
                        You can review details, add a note, or enjoy the garden view.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[2rem] border border-[#EFE0C9] bg-white/82 p-5 shadow-dappled backdrop-blur-xl dark:border-white/10 dark:bg-[#211A13]/78">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-black">Momentum</h2>
                <p className="text-sm text-muted-foreground">Daily habit health.</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E6EEDC] text-[#607A52] dark:bg-[#263224] dark:text-[#B9D0A8]">
                <Leaf className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <InsightTile label="Needs attention" value={String(attentionCount)} icon={Clock3} />
              <InsightTile label="Journal streak" value={String(profile?.journal_streak ?? 0)} icon={CalendarDays} />
              <InsightTile label="Level" value={String(profile?.level ?? 1)} icon={Zap} />
              <InsightTile label="Living habits" value={String(livingPlants.length)} icon={Sprout} />
            </div>
          </section>

          <section className="rounded-[2rem] border border-[#EFE0C9] bg-white/82 p-5 shadow-dappled backdrop-blur-xl dark:border-white/10 dark:bg-[#211A13]/78">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-black">Done today</h2>
                <p className="text-sm text-muted-foreground">Positive feedback, not clutter.</p>
              </div>
              <Badge variant="secondary">{completedPlants.length}</Badge>
            </div>
            <div className="space-y-2">
              {completedPlants.slice(0, 5).map((plant) => (
                <button
                  key={plant.id}
                  onClick={() => onOpenPlant(plant)}
                  className="flex w-full items-center gap-3 rounded-2xl border bg-background/70 p-3 text-left transition hover:bg-amber-50 dark:bg-white/5"
                >
                  <div className="flex h-11 w-11 items-end justify-center rounded-2xl bg-[#E6EEDC] p-1 dark:bg-[#263224]">
                    <PlantImage plant={plant} size="lg" alignBottom />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{plant.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {plant.today_log_count ? `${plant.today_log_count} log${plant.today_log_count === 1 ? '' : 's'}` : 'Checked in'}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-[#6F8F63]" />
                </button>
              ))}
              {completedPlants.length === 0 && (
                <p className="rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                  Completed habits will move here after the first check-in.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function TodayMetric({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  tone: 'sage' | 'amber' | 'blue'
}) {
  const tones = {
    sage: 'bg-[#E6EEDC] text-[#536B44] dark:bg-[#263224] dark:text-[#B9D0A8]',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    blue: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  }

  return (
    <div className="rounded-2xl border bg-background/75 p-3 dark:bg-white/5">
      <div className={cn('mb-2 flex h-8 w-8 items-center justify-center rounded-xl', tones[tone])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="text-xl font-black leading-none">{value}</div>
      <div className="mt-1 text-[11px] font-bold uppercase text-muted-foreground">{label}</div>
    </div>
  )
}

function InsightTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border bg-background/70 p-3 dark:bg-white/5">
      <Icon className="mb-2 h-4 w-4 text-primary" />
      <div className="text-lg font-black leading-none">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function HabitActionCard({
  plant,
  goalStats,
  status,
  onOpen,
  onWaterPlant,
  onQuickLog,
  onOpenLog,
}: {
  plant: PlantWithType
  goalStats: GoalWithStats | null
  status: 'due' | 'done'
  onOpen: (plant: PlantWithType) => void
  onWaterPlant: (plant: PlantWithType) => Promise<void>
  onQuickLog: (plant: PlantWithType, value: number) => Promise<void>
  onOpenLog: (plant: PlantWithType) => void
}) {
  const done = status === 'done' || isHabitDoneToday(plant)
  const progress = getHabitGoalProgress(plant, goalStats)
  const urgency = getHabitUrgency(plant)

  return (
    <article className="rounded-[1.5rem] border border-white/70 bg-white/85 p-4 shadow-dappled transition hover:-translate-y-0.5 hover:shadow-dappled-lg dark:border-white/10 dark:bg-slate-950/65">
      <div className="flex gap-4">
        <button
          onClick={() => onOpen(plant)}
          className="flex h-20 w-20 shrink-0 items-end justify-center rounded-3xl bg-gradient-to-b from-[#E6EEDC] to-[#F6EFE2] p-2 dark:from-[#263224] dark:to-[#211A13]"
          aria-label={`Open ${plant.name}`}
        >
          <PlantImage plant={plant} size="2xl" alignBottom />
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge
              variant={done ? 'secondary' : 'outline'}
              className={cn(
                done && 'bg-[#E6EEDC] text-[#536B44] dark:bg-[#263224] dark:text-[#B9D0A8]',
                !done && urgency >= 4 && 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300'
              )}
            >
              {done ? 'Done today' : urgency >= 4 ? 'Needs attention' : 'Ready'}
            </Badge>
            {plant.current_streak > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-300">
                <Flame className="h-3.5 w-3.5" />
                {plant.current_streak}
              </span>
            )}
          </div>
          <h3 className="truncate text-base font-black">{plant.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {plant.tiny_seed || plant.habit_description || plant.plant_type.description || 'Small progress counts today.'}
          </p>
        </div>
      </div>

      {progress && (
        <div className="mt-4 rounded-2xl border bg-background/70 p-3 dark:bg-white/5">
          <div className="mb-2 flex items-center justify-between gap-3 text-xs">
            <span className="font-semibold text-muted-foreground">{progress.label}</span>
            <span className="font-black">
              {formatHabitValue(progress.current)} / {formatHabitValue(progress.target)} {progress.unit}
            </span>
          </div>
          <Progress value={progress.percent} className="h-2.5 bg-primary/10" />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {plant.goal ? (
          <>
            <Button onClick={() => onOpenLog(plant)} size="sm" className="gap-2 rounded-2xl">
              <Zap className="h-4 w-4" />
              Log
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onQuickLog(plant, 1)} className="rounded-2xl">
              +1
            </Button>
            <Button variant="outline" size="sm" onClick={() => onQuickLog(plant, 5)} className="rounded-2xl bg-white/60 dark:bg-white/5">
              +5
            </Button>
          </>
        ) : (
          <Button
            onClick={() => onWaterPlant(plant)}
            disabled={done}
            size="sm"
            className="gap-2 rounded-2xl"
          >
            {done ? <CheckCircle2 className="h-4 w-4" /> : <Droplets className="h-4 w-4" />}
            {done ? 'Checked in' : 'Check in'}
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={() => onOpen(plant)} className="ml-auto rounded-2xl">
          Details
        </Button>
      </div>
    </article>
  )
}

function QuickLogDialog({
  plant,
  open,
  onOpenChange,
  onSubmit,
}: {
  plant: PlantWithType | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (value: number, notes?: string) => Promise<void>
}) {
  const [value, setValue] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      queueMicrotask(() => {
        setValue('')
        setNotes('')
      })
    }
  }, [open])

  const goal = plant?.goal

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Log progress
          </DialogTitle>
          <DialogDescription>
            {plant ? `${plant.name}${goal ? ` - ${goal.period_label}` : ''}` : 'Add a habit check-in.'}
          </DialogDescription>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault()
            const parsed = Number(value)
            if (!parsed || parsed <= 0) {
              toast.error('Enter a value greater than 0')
              return
            }
            await onSubmit(parsed, notes.trim() || undefined)
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="quick-log-value">Value {goal?.unit ? `(${goal.unit})` : ''}</Label>
            <Input
              id="quick-log-value"
              type="number"
              min="0"
              step="0.1"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="0"
              className="h-12 rounded-2xl text-lg font-bold"
              autoFocus
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {[1, 5, 10, 25].map((amount) => (
              <Button
                key={amount}
                type="button"
                variant={value === String(amount) ? 'default' : 'outline'}
                size="sm"
                onClick={() => setValue(String(amount))}
                className="rounded-2xl"
              >
                {amount}
              </Button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-log-notes">Reflection note</Label>
            <Textarea
              id="quick-log-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="What helped today?"
              className="min-h-20 rounded-2xl"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="rounded-2xl">
              Save check-in
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function isHabitDoneToday(plant: PlantWithType): boolean {
  if (plant.goal) {
    return (plant.today_log_count ?? 0) > 0
  }

  return isToday(plant.last_watered_at)
}

function getHabitUrgency(plant: PlantWithType): number {
  let score = 0
  if (plant.status === 'sleeping' || plant.status === 'waiting') score += 3
  if (plant.current_moisture < 30) score += 3
  else if (plant.current_moisture < 55) score += 1
  if (plant.growth_blocked) score += 2
  if (!isHabitDoneToday(plant)) score += 1
  return score
}

function getBestStreak(plants: PlantWithType[]): number {
  return plants.reduce((max, plant) => Math.max(max, plant.current_streak ?? 0), 0)
}

function getAverageGoalProgress(plants: PlantWithType[]): number {
  const goalPlants = plants.filter((plant) => plant.goal)
  if (goalPlants.length === 0) return 0

  const total = goalPlants.reduce((sum, plant) => {
    const progress = getHabitGoalProgress(plant, null)
    return sum + (progress?.percent ?? 0)
  }, 0)

  return Math.round(total / goalPlants.length)
}

function getHabitGoalProgress(plant: PlantWithType, goalStats: GoalWithStats | null) {
  const goal = plant.goal
  if (!goal && !goalStats) return null

  const current = goalStats?.periodProgress ?? goal?.period_progress ?? 0
  const target = goalStats?.currentPeriodTarget ?? goal?.current_period_target ?? 1
  const percent = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  const unit = goalStats?.unit ?? goal?.unit ?? ''
  const label = goalStats?.periodLabel ?? goal?.period_label ?? 'This period'

  return { current, target, percent, unit, label }
}

function formatHabitValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

// View toggle component - compact, positioned at top center
function ViewToggle({
  viewMode,
  onViewModeChange,
  isZenMode,
  onZenModeChange
}: {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  isZenMode: boolean
  onZenModeChange: (isZen: boolean) => void
}) {
  const viewItems: Array<{ mode: ViewMode; label: string; icon: LucideIcon; active: string }> = [
    { mode: 'today', label: 'Today', icon: ListChecks, active: 'from-amber-400 to-orange-500' },
    { mode: 'garden', label: 'Garden', icon: TreesIcon, active: 'from-[#8DAA78] to-[#6F8F63]' },
    { mode: 'list', label: 'List', icon: LayoutGrid, active: 'from-blue-400 to-indigo-500' },
    { mode: 'focus', label: 'Focus', icon: Target, active: 'from-amber-400 to-orange-500' },
  ]

  return (
    <div className="fixed top-2 left-1/2 z-30 flex max-w-[calc(100vw-0.75rem)] -translate-x-1/2 items-center pointer-events-auto">
      {/* View Modes */}
      <div className="flex shrink-0 items-center gap-0.5 rounded-2xl border border-slate-700/50 bg-slate-950/85 p-1 shadow-lg backdrop-blur-xl">
        {viewItems.map((item) => {
          const Icon = item.icon
          const active = viewMode === item.mode
          return (
            <button
              key={item.mode}
              aria-label={item.label}
              onClick={() => onViewModeChange(item.mode)}
              className={cn(
                "flex h-8 items-center gap-1 rounded-xl px-2 text-[10px] font-bold transition-all duration-300 sm:h-10 sm:gap-1.5 sm:px-3.5 sm:text-xs",
                active
                  ? `bg-gradient-to-br ${item.active} text-white shadow-md`
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              <span>{item.label}</span>
            </button>
          )
        })}
        <div className="mx-0.5 h-5 w-px bg-slate-700/70" />
        <button
          aria-label="Zen"
          onClick={() => onZenModeChange(!isZenMode)}
          className={cn(
            "flex h-8 items-center gap-1 rounded-xl px-2 text-[10px] font-bold transition-all duration-300 sm:h-10 sm:gap-1.5 sm:px-3.5 sm:text-xs",
            isZenMode
              ? "bg-gradient-to-br from-pink-400 to-rose-500 text-white shadow-md shadow-rose-500/30"
              : "text-slate-400 hover:text-white hover:bg-slate-800"
          )}
          title="Zen Mode: Relax with breathing weather and music"
        >
          <Flower2 className={cn("h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4", isZenMode && "animate-pulse")} />
          <span>Zen</span>
        </button>
      </div>
    </div>
  )
}

// Floating Add Plant button - positioned at top right, below weather
function FloatingAddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed top-14 right-2 sm:top-16 sm:right-3 z-30",
        "flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg sm:rounded-xl",
        "bg-gradient-to-br from-amber-400 to-orange-500",
        "text-white text-[11px] sm:text-xs font-bold",
        "shadow-lg shadow-amber-500/30",
        "hover:shadow-xl hover:shadow-amber-500/40 hover:scale-105",
        "transition-all duration-300",
        "border border-amber-300/30"
      )}
    >
      <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      <span className="hidden xs:inline">Add Plant</span>
      <span className="xs:hidden">Add</span>
    </button>
  )
}

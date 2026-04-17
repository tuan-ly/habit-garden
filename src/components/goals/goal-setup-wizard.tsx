'use client'

import { useState, useTransition, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  TrendingUp,
  Target,
  ArrowRight,
  ArrowLeft,
  Check,
  Sprout,
  Calendar,
  CalendarDays,
  CalendarRange,
  Flower2,
  Edit3,
  Info,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoalMode, ProgressionType, GoalFrequency } from '@/types/database'
import { createGoal } from '@/lib/actions/goals'
import { toast } from 'sonner'

interface GoalSetupWizardProps {
  plantId: string
  plantName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

type WizardStep = 'mode' | 'frequency' | 'target' | 'preview'

// Goal mode options — Living Garden palette
const GOAL_MODES = [
  {
    id: 'build_capacity' as GoalMode,
    title: 'Build Capacity',
    icon: TrendingUp,
    description: 'Improve each period',
    example: 'Week 1: 20 pages → Week 12: 50 pages',
    accent: 'leaf',
  },
  {
    id: 'total_progress' as GoalMode,
    title: 'Total Progress',
    icon: Target,
    description: 'Accumulate to a total',
    example: 'Save $10,000 over 6 months',
    accent: 'moisture',
  },
] as const

// Frequency options with clearer descriptions
const FREQUENCY_OPTIONS = [
  {
    id: 'daily' as GoalFrequency,
    label: 'Daily',
    icon: Calendar,
    description: 'Set a target for each day',
    periodLabel: 'day',
    periodsPerWeek: 7,
  },
  {
    id: 'weekly' as GoalFrequency,
    label: 'Weekly',
    icon: CalendarDays,
    description: 'Set a target for each week',
    periodLabel: 'week',
    periodsPerWeek: 1,
  },
  {
    id: 'monthly' as GoalFrequency,
    label: 'Monthly',
    icon: CalendarRange,
    description: 'Set a target for each month',
    periodLabel: 'month',
    periodsPerWeek: 0.25,
  },
]

// Growth patterns
const GROWTH_PATTERNS = [
  { id: 'steady', label: 'Steady', description: 'Same increase each period', icon: '→' },
  { id: 'gentle', label: 'Gentle Start', description: 'Small increases early, larger later', icon: '↗' },
  { id: 'aggressive', label: 'Fast Start', description: 'Big gains early, then maintain', icon: '⚡' },
]

export function GoalSetupWizard({
  plantId,
  plantName,
  open,
  onOpenChange,
  onComplete,
}: GoalSetupWizardProps) {
  const [step, setStep] = useState<WizardStep>('mode')
  const [isPending, startTransition] = useTransition()
  const [showManualEditor, setShowManualEditor] = useState(false)

  // Form state
  const [goalMode, setGoalMode] = useState<GoalMode | null>(null)
  const [frequency, setFrequency] = useState<GoalFrequency>('weekly')
  const [unit, setUnit] = useState('')

  // Build Capacity fields
  const [startingTarget, setStartingTarget] = useState('') // Target for first period
  const [finalTarget, setFinalTarget] = useState('') // Target for final period
  const [growthPattern, setGrowthPattern] = useState('steady')

  // Total Progress fields
  const [totalTarget, setTotalTarget] = useState('') // Total to accumulate
  const [currentAmount, setCurrentAmount] = useState('') // Already have

  // Common
  const [durationWeeks, setDurationWeeks] = useState(12)
  const [manualTargets, setManualTargets] = useState<number[] | null>(null)

  // Calculate number of periods based on frequency and duration
  const numberOfPeriods = useMemo(() => {
    if (frequency === 'daily') return durationWeeks * 7
    if (frequency === 'weekly') return durationWeeks
    return Math.ceil(durationWeeks / 4) // monthly
  }, [frequency, durationWeeks])

  // Generate period targets
  const periodTargets = useMemo(() => {
    if (manualTargets) return manualTargets

    if (goalMode === 'build_capacity') {
      const start = Number(startingTarget) || 0
      const end = Number(finalTarget) || start
      const periods = numberOfPeriods

      if (periods <= 1) return [end]

      const targets: number[] = []
      for (let i = 0; i < periods; i++) {
        const progress = i / (periods - 1)
        let value: number

        if (growthPattern === 'gentle') {
          // Slow start, accelerate later (quadratic ease-in)
          value = start + (end - start) * (progress * progress)
        } else if (growthPattern === 'aggressive') {
          // Fast start, slow down (quadratic ease-out)
          value = start + (end - start) * (1 - Math.pow(1 - progress, 2))
        } else {
          // Linear
          value = start + (end - start) * progress
        }
        targets.push(Math.round(value * 10) / 10)
      }
      return targets
    } else {
      // Total Progress: divide evenly
      const remaining = (Number(totalTarget) || 0) - (Number(currentAmount) || 0)
      const perPeriod = remaining / numberOfPeriods
      return Array(numberOfPeriods).fill(Math.round(perPeriod * 10) / 10)
    }
  }, [goalMode, startingTarget, finalTarget, totalTarget, currentAmount, numberOfPeriods, growthPattern, manualTargets])

  // Generate period labels (dates)
  const periodLabels = useMemo(() => {
    const today = new Date()
    const labels: string[] = []

    for (let i = 0; i < numberOfPeriods; i++) {
      if (frequency === 'daily') {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        labels.push(date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' }))
      } else if (frequency === 'weekly') {
        const startDate = new Date(today)
        startDate.setDate(today.getDate() + i * 7)
        const endDate = new Date(startDate)
        endDate.setDate(startDate.getDate() + 6)
        labels.push(`${startDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}`)
      } else {
        const date = new Date(today)
        date.setMonth(today.getMonth() + i)
        labels.push(date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' }))
      }
    }
    return labels
  }, [frequency, numberOfPeriods])

  const frequencyOption = FREQUENCY_OPTIONS.find(f => f.id === frequency)!

  const resetForm = () => {
    setStep('mode')
    setGoalMode(null)
    setFrequency('weekly')
    setUnit('')
    setStartingTarget('')
    setFinalTarget('')
    setTotalTarget('')
    setCurrentAmount('')
    setDurationWeeks(12)
    setGrowthPattern('steady')
    setManualTargets(null)
    setShowManualEditor(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) resetForm()
  }

  const handleNext = () => {
    if (step === 'mode' && goalMode) setStep('frequency')
    else if (step === 'frequency') setStep('target')
    else if (step === 'target') setStep('preview')
  }

  const handleBack = () => {
    if (step === 'frequency') setStep('mode')
    else if (step === 'target') setStep('frequency')
    else if (step === 'preview') setStep('target')
  }

  const canProceed = () => {
    if (step === 'mode') return !!goalMode
    if (step === 'frequency') return true
    if (step === 'target') {
      if (!unit.trim()) return false
      if (goalMode === 'build_capacity') {
        return Number(startingTarget) >= 0 && Number(finalTarget) > 0
      } else {
        return Number(totalTarget) > 0
      }
    }
    return true
  }

  const handleManualTargetChange = (index: number, value: number) => {
    const newTargets = manualTargets ? [...manualTargets] : [...periodTargets]
    newTargets[index] = value
    setManualTargets(newTargets)
  }

  const handleSubmit = async () => {
    if (!goalMode) return

    startTransition(async () => {
      // Convert period targets to weekly targets for storage
      let weeklyTargets: number[]
      if (frequency === 'daily') {
        // Group daily targets into weekly
        weeklyTargets = []
        for (let i = 0; i < durationWeeks; i++) {
          const weekDays = periodTargets.slice(i * 7, (i + 1) * 7)
          // For build_capacity, take the max of the week; for total_progress, take sum
          if (goalMode === 'build_capacity') {
            weeklyTargets.push(Math.max(...weekDays))
          } else {
            weeklyTargets.push(weekDays.reduce((a, b) => a + b, 0))
          }
        }
      } else if (frequency === 'monthly') {
        // Expand monthly targets to weekly (4 weeks per month)
        weeklyTargets = []
        periodTargets.forEach(monthTarget => {
          const weeklyValue = goalMode === 'build_capacity' ? monthTarget : monthTarget / 4
          for (let i = 0; i < 4; i++) {
            weeklyTargets.push(Math.round(weeklyValue * 10) / 10)
          }
        })
        weeklyTargets = weeklyTargets.slice(0, durationWeeks)
      } else {
        weeklyTargets = periodTargets
      }

      const result = await createGoal({
        plant_id: plantId,
        goal_mode: goalMode,
        tracking_metric: goalMode === 'build_capacity' ? 'max' : 'sum',
        unit: unit.trim(),
        start_value: goalMode === 'build_capacity' ? Number(startingTarget) || 0 : 0,
        target_value: goalMode === 'build_capacity' ? Number(finalTarget) : Number(totalTarget),
        initial_amount: goalMode === 'total_progress' ? Number(currentAmount) || 0 : undefined,
        duration_weeks: durationWeeks,
        progression_type: growthPattern === 'gentle' ? 's-curve' : growthPattern === 'aggressive' ? 'logarithmic' : 'linear',
        weekly_targets: weeklyTargets,
        frequency,
        frequency_target: 1,
      })

      if (result.success) {
        toast.success('Goal created!', {
          description: `Your goal has been set for ${plantName}`,
        })
        handleOpenChange(false)
        onComplete?.()
      } else {
        toast.error('Failed to create goal', {
          description: result.error,
        })
      }
    })
  }

  // Step indicators
  const steps: WizardStep[] = ['mode', 'frequency', 'target', 'preview']
  const stepIcons = [TrendingUp, Calendar, Target, Flower2]

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto surface-paper border-0 shadow-dappled-lg rounded-[24px] p-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-1 mb-5">
          {steps.map((s, i) => {
            const Icon = stepIcons[i]
            const isActive = step === s
            const isPast = steps.indexOf(step) > i

            return (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                    isActive
                      ? 'bg-leaf text-white scale-110 shadow-leaf'
                      : isPast
                      ? 'bg-moss/20 text-leaf'
                      : 'bg-mist dark:bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      'w-8 h-0.5 mx-1 transition-colors',
                      isPast ? 'bg-leaf' : 'bg-mist dark:bg-muted'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step 1: Choose Goal Mode */}
        {step === 'mode' && (
          <>
            <DialogHeader className="text-center">
              <DialogTitle asChild>
                <h2 className="font-display text-2xl font-semibold text-canopy dark:text-foreground flex items-center justify-center gap-2">
                  <TrendingUp className="h-5 w-5 text-leaf" />
                  Choose Goal Type
                </h2>
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                How do you want to track progress for {plantName}?
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              {GOAL_MODES.map((mode) => {
                const Icon = mode.icon
                const accentColor = mode.accent === 'leaf' ? 'text-leaf' : 'text-moisture'
                const accentBg = mode.accent === 'leaf' ? 'bg-leaf/10' : 'bg-moisture/10'
                const isSelected = goalMode === mode.id
                return (
                  <button
                    key={mode.id}
                    onClick={() => setGoalMode(mode.id)}
                    className={cn(
                      'relative p-4 rounded-2xl text-left transition-all overflow-hidden cursor-pointer',
                      'bg-white/80 dark:bg-card ring-1',
                      isSelected
                        ? 'ring-2 ring-leaf shadow-dappled-lg'
                        : 'ring-border hover:ring-moss/40 shadow-dappled'
                    )}
                  >
                    <div className="relative flex items-start gap-4">
                      <div className={cn('p-2.5 rounded-xl flex-shrink-0', accentBg)}>
                        <Icon className={cn('h-5 w-5', accentColor)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={cn('font-display text-lg font-semibold', accentColor)}>
                          {mode.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {mode.description}
                        </p>
                        <p className="text-xs bg-mist dark:bg-muted text-canopy/80 dark:text-foreground/80 px-2 py-1 rounded-lg mt-2 inline-block tabular-nums">
                          {mode.example}
                        </p>
                      </div>
                      {isSelected && (
                        <Check className="h-5 w-5 text-leaf flex-shrink-0" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}

        {/* Step 2: Choose Frequency */}
        {step === 'frequency' && (
          <>
            <DialogHeader className="text-center">
              <DialogTitle className="flex items-center justify-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Choose Tracking Period
              </DialogTitle>
              <DialogDescription>
                How often do you want to set targets?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="grid gap-3">
                {FREQUENCY_OPTIONS.map((opt) => {
                  const Icon = opt.icon
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setFrequency(opt.id)
                        setManualTargets(null)
                      }}
                      className={cn(
                        'p-4 rounded-xl border-2 text-left transition-all flex items-center gap-4',
                        frequency === opt.id
                          ? 'border-primary bg-primary/5 ring-2 ring-offset-2 ring-primary'
                          : 'hover:border-primary/50'
                      )}
                    >
                      <div className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center',
                        frequency === opt.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      )}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{opt.label}</h3>
                        <p className="text-sm text-muted-foreground">{opt.description}</p>
                      </div>
                      {frequency === opt.id && <Check className="h-5 w-5 text-primary" />}
                    </button>
                  )
                })}
              </div>

              {/* Duration selector */}
              <div className="space-y-3 pt-4 border-t">
                <div className="flex items-center justify-between">
                  <Label>Total duration</Label>
                  <span className="text-sm font-medium">{durationWeeks} weeks ({numberOfPeriods} {frequencyOption.periodLabel}s)</span>
                </div>
                <Slider
                  value={[durationWeeks]}
                  onValueChange={(v) => {
                    setDurationWeeks(v[0])
                    setManualTargets(null)
                  }}
                  min={2}
                  max={52}
                  step={1}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>2 weeks</span>
                  <span>1 year</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Set Targets */}
        {step === 'target' && (
          <>
            <DialogHeader className="text-center">
              <DialogTitle className="flex items-center justify-center gap-2">
                <Target className="h-5 w-5 text-amber-500" />
                Set Your Targets
              </DialogTitle>
              <DialogDescription>
                Define your {frequencyOption.periodLabel}ly targets
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Unit */}
              <div className="space-y-2">
                <Label htmlFor="unit">What are you measuring?</Label>
                <Input
                  id="unit"
                  placeholder="e.g., pages, km, minutes, $"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="text-lg"
                />
              </div>

              {/* Build Capacity specific fields */}
              {goalMode === 'build_capacity' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="startingTarget">
                        First {frequencyOption.periodLabel} target
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="startingTarget"
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g., 20"
                          value={startingTarget}
                          onChange={(e) => {
                            setStartingTarget(e.target.value)
                            setManualTargets(null)
                          }}
                        />
                        {unit && <span className="text-muted-foreground text-sm shrink-0">{unit}</span>}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="finalTarget">
                        Final {frequencyOption.periodLabel} target
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="finalTarget"
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="e.g., 50"
                          value={finalTarget}
                          onChange={(e) => {
                            setFinalTarget(e.target.value)
                            setManualTargets(null)
                          }}
                        />
                        {unit && <span className="text-muted-foreground text-sm shrink-0">{unit}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Example explanation */}
                  {startingTarget && finalTarget && (
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-emerald-700 dark:text-emerald-300">
                          You'll start with <strong>{startingTarget} {unit}</strong> per {frequencyOption.periodLabel},
                          and gradually increase to <strong>{finalTarget} {unit}</strong> per {frequencyOption.periodLabel}
                          over {numberOfPeriods} {frequencyOption.periodLabel}s.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Growth pattern */}
                  <div className="space-y-2">
                    <Label>Growth pattern</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {GROWTH_PATTERNS.map((pattern) => (
                        <button
                          key={pattern.id}
                          type="button"
                          onClick={() => {
                            setGrowthPattern(pattern.id)
                            setManualTargets(null)
                          }}
                          className={cn(
                            'p-3 rounded-lg border text-center transition-all',
                            growthPattern === pattern.id
                              ? 'border-primary bg-primary/10 text-primary'
                              : 'hover:border-primary/50'
                          )}
                        >
                          <div className="text-xl mb-1">{pattern.icon}</div>
                          <div className="font-medium text-sm">{pattern.label}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                            {pattern.description}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Total Progress specific fields */}
              {goalMode === 'total_progress' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="totalTarget">Total target to reach</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="totalTarget"
                        type="number"
                        min="1"
                        step="0.01"
                        placeholder="e.g., 10000"
                        value={totalTarget}
                        onChange={(e) => {
                          setTotalTarget(e.target.value)
                          setManualTargets(null)
                        }}
                        className="text-lg"
                      />
                      {unit && <span className="text-muted-foreground">{unit}</span>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="currentAmount">Already have (optional)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="currentAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0"
                        value={currentAmount}
                        onChange={(e) => {
                          setCurrentAmount(e.target.value)
                          setManualTargets(null)
                        }}
                      />
                      {unit && <span className="text-muted-foreground">{unit}</span>}
                    </div>
                  </div>

                  {/* Example explanation */}
                  {totalTarget && (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          You need to accumulate <strong>{Math.round(((Number(totalTarget) - (Number(currentAmount) || 0)) / numberOfPeriods) * 10) / 10} {unit}</strong> per {frequencyOption.periodLabel}
                          to reach <strong>{totalTarget} {unit}</strong> in {numberOfPeriods} {frequencyOption.periodLabel}s.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* Step 4: Preview */}
        {step === 'preview' && (
          <>
            <DialogHeader className="text-center">
              <DialogTitle className="flex items-center justify-center gap-2">
                <Flower2 className="h-5 w-5 text-pink-500" />
                Review Your Plan
              </DialogTitle>
              <DialogDescription>
                Check your {frequencyOption.periodLabel}ly targets before starting
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Summary badges */}
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-leaf/15 text-leaf text-sm font-medium">
                  {goalMode === 'build_capacity' ? <TrendingUp className="h-3.5 w-3.5" /> : <Target className="h-3.5 w-3.5" />}
                  {goalMode === 'build_capacity' ? 'Build Capacity' : 'Total Progress'}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-moisture/15 text-moisture text-sm font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  {frequency === 'daily' ? 'Daily' : frequency === 'weekly' ? 'Weekly' : 'Monthly'}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-bloom/15 text-bloom text-sm font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  {durationWeeks} weeks
                </span>
              </div>

              {/* Target summary */}
              <div className="text-center p-5 rounded-2xl bg-white/80 dark:bg-card ring-1 ring-border shadow-dappled">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">Your Goal</div>
                <div className="font-display text-2xl font-semibold text-canopy dark:text-foreground mt-1">
                  {goalMode === 'build_capacity' ? (
                    <>{startingTarget} → {finalTarget} {unit}/{frequencyOption.periodLabel}</>
                  ) : (
                    <>{totalTarget} {unit} total</>
                  )}
                </div>
              </div>

              {/* Period targets list */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">
                    {frequency === 'daily' ? 'Daily' : frequency === 'weekly' ? 'Weekly' : 'Monthly'} Targets
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowManualEditor(!showManualEditor)}
                    className="text-xs h-7"
                  >
                    <Edit3 className="h-3 w-3 mr-1" />
                    {showManualEditor ? 'Hide Editor' : 'Edit Manually'}
                  </Button>
                </div>

                {manualTargets && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setManualTargets(null)}
                    className="w-full text-xs h-7"
                  >
                    Reset to Recommended
                  </Button>
                )}

                <div className="max-h-[200px] overflow-y-auto rounded-lg border divide-y">
                  {periodTargets.slice(0, Math.min(periodTargets.length, 20)).map((target, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 text-sm',
                        i === 0 && 'bg-primary/5'
                      )}
                    >
                      <span className="text-xs text-muted-foreground w-6 shrink-0">
                        {frequency === 'daily' ? `D${i + 1}` : frequency === 'weekly' ? `W${i + 1}` : `M${i + 1}`}
                      </span>
                      <span className="text-xs text-muted-foreground flex-1 truncate">
                        {periodLabels[i]}
                      </span>
                      <span className="text-muted-foreground">:</span>
                      {showManualEditor ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={target}
                          onChange={(e) => handleManualTargetChange(i, Number(e.target.value))}
                          className="w-20 h-7 text-sm"
                        />
                      ) : (
                        <span className="font-medium w-16 text-right">{target}</span>
                      )}
                      <span className="text-muted-foreground text-xs">{unit}</span>
                    </div>
                  ))}
                  {periodTargets.length > 20 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground text-center">
                      ... and {periodTargets.length - 20} more {frequencyOption.periodLabel}s
                    </div>
                  )}
                </div>
              </div>

              {/* Motivational message */}
              <p className="text-center text-sm text-muted-foreground italic">
                Consistent small steps lead to big results. 🌱
              </p>
            </div>
          </>
        )}

        <DialogFooter className="gap-2">
          {step !== 'mode' && (
            <Button type="button" variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          {step !== 'preview' ? (
            <Button onClick={handleNext} disabled={!canProceed()}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isPending}
              className="bg-leaf hover:bg-canopy text-white rounded-full shadow-leaf cursor-pointer"
            >
              {isPending ? 'Creating…' : (<><Sprout className="h-4 w-4 mr-2" />Start Goal</>)}
              {!isPending && <Check className="h-4 w-4 ml-2" />}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

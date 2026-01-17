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
  Leaf,
  TreeDeciduous,
  Flower2,
  Edit3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoalMode, ProgressionType } from '@/types/database'
import { createGoal } from '@/lib/actions/goals'
import { generateProgressionPlan, type ProgressionType as ProgType } from '@/lib/progression'
import { toast } from 'sonner'

interface GoalSetupWizardProps {
  plantId: string
  plantName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

type WizardStep = 'seed' | 'target' | 'growth' | 'preview'

// Garden-themed goal modes
const SEED_TYPES = [
  {
    id: 'build_capacity' as GoalMode,
    title: 'Capacity Seed',
    icon: '📈',
    description: 'Grow stronger each week',
    example: 'Run 2km → 10km',
    color: 'from-emerald-500/20 to-green-500/20',
    borderColor: 'border-emerald-500/50',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    id: 'total_progress' as GoalMode,
    title: 'Accumulator Seed',
    icon: '🎯',
    description: 'Collect towards a total',
    example: 'Save $0 → $10,000',
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/50',
    textColor: 'text-blue-600 dark:text-blue-400',
  },
]

// Growth curve types with visual preview
const GROWTH_CURVES = [
  {
    id: 'linear' as ProgressionType,
    name: 'Steady',
    icon: '↗',
    description: 'Linear growth',
    visual: '▁▂▃▄▅▆▇█',
  },
  {
    id: 's-curve' as ProgressionType,
    name: 'S-Curve',
    icon: '📈',
    description: 'Natural progression',
    visual: '▁▁▂▃▅▆▇▇',
  },
  {
    id: 'step' as ProgressionType,
    name: 'Step',
    icon: '🪜',
    description: 'Level up in stages',
    visual: '▂▂▄▄▆▆██',
  },
  {
    id: 'logarithmic' as ProgressionType,
    name: 'Quick Start',
    icon: '⚡',
    description: 'Fast then steady',
    visual: '▅▆▇▇▇███',
  },
  {
    id: 'exponential' as ProgressionType,
    name: 'Slow Burn',
    icon: '🚀',
    description: 'Build momentum',
    visual: '▁▁▂▂▃▄▆█',
  },
]

// Duration markers with plant growth stages
const DURATION_MARKERS = [
  { weeks: 4, icon: '🌱', label: 'Sprout' },
  { weeks: 8, icon: '🌿', label: 'Growing' },
  { weeks: 12, icon: '🌸', label: 'Blooming' },
  { weeks: 16, icon: '🌳', label: 'Mature' },
]

const TRACKING_METRICS = [
  { id: 'max', label: 'Best', description: 'Track peak performance' },
  { id: 'sum', label: 'Total', description: 'Sum all values' },
  { id: 'average', label: 'Average', description: 'Track average' },
]

export function GoalSetupWizard({
  plantId,
  plantName,
  open,
  onOpenChange,
  onComplete,
}: GoalSetupWizardProps) {
  const [step, setStep] = useState<WizardStep>('seed')
  const [isPending, startTransition] = useTransition()
  const [showManualEditor, setShowManualEditor] = useState(false)

  // Form state
  const [goalMode, setGoalMode] = useState<GoalMode | null>(null)
  const [unit, setUnit] = useState('')
  const [startValue, setStartValue] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [initialAmount, setInitialAmount] = useState('')
  const [durationWeeks, setDurationWeeks] = useState(12)
  const [progressionType, setProgressionType] = useState<ProgressionType>('s-curve')
  const [trackingMetric, setTrackingMetric] = useState('max')
  const [manualTargets, setManualTargets] = useState<number[] | null>(null)

  // Generate preview targets
  const previewTargets = useMemo(() => {
    if (manualTargets) return manualTargets
    if (!goalMode) return []
    return generateProgressionPlan({
      startValue: goalMode === 'build_capacity' ? Number(startValue) || 0 : 0,
      endValue: Number(targetValue) || 100,
      totalWeeks: durationWeeks,
      type: progressionType as ProgType,
    })
  }, [goalMode, startValue, targetValue, durationWeeks, progressionType, manualTargets])

  // Calculate week date ranges for preview
  const weekDateRanges = useMemo(() => {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay() + 1) // Monday

    return previewTargets.map((_, index) => {
      const weekStart = new Date(startOfWeek)
      weekStart.setDate(startOfWeek.getDate() + index * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      return {
        start: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        end: weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }
    })
  }, [previewTargets])

  const resetForm = () => {
    setStep('seed')
    setGoalMode(null)
    setUnit('')
    setStartValue('')
    setTargetValue('')
    setInitialAmount('')
    setDurationWeeks(12)
    setProgressionType('s-curve')
    setTrackingMetric('max')
    setManualTargets(null)
    setShowManualEditor(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) resetForm()
  }

  const handleNext = () => {
    if (step === 'seed' && goalMode) setStep('target')
    else if (step === 'target') setStep('growth')
    else if (step === 'growth') setStep('preview')
  }

  const handleBack = () => {
    if (step === 'target') setStep('seed')
    else if (step === 'growth') setStep('target')
    else if (step === 'preview') setStep('growth')
  }

  const canProceed = () => {
    if (step === 'seed') return !!goalMode
    if (step === 'target') {
      return unit.trim() && targetValue && Number(targetValue) > 0
    }
    return true
  }

  const handleManualTargetChange = (index: number, value: number) => {
    const newTargets = manualTargets ? [...manualTargets] : [...previewTargets]
    newTargets[index] = value
    setManualTargets(newTargets)
  }

  const handleResetToRecommended = () => {
    setManualTargets(null)
  }

  const handleSubmit = async () => {
    if (!goalMode) return

    startTransition(async () => {
      const result = await createGoal({
        plant_id: plantId,
        goal_mode: goalMode,
        tracking_metric: goalMode === 'build_capacity' ? trackingMetric : 'sum',
        unit: unit.trim(),
        start_value: goalMode === 'build_capacity' ? Number(startValue) || 0 : 0,
        target_value: Number(targetValue),
        initial_amount: goalMode === 'total_progress' ? Number(initialAmount) || 0 : undefined,
        duration_weeks: durationWeeks,
        progression_type: progressionType,
        weekly_targets: manualTargets || undefined,
      })

      if (result.success) {
        toast.success('Goal planted!', {
          description: `Your goal seed has been planted for ${plantName}`,
        })
        handleOpenChange(false)
        onComplete?.()
      } else {
        toast.error('Failed to plant goal', {
          description: result.error,
        })
      }
    })
  }

  // Get current growth stage based on duration
  const currentGrowthStage = DURATION_MARKERS.reduce((prev, curr) =>
    durationWeeks >= curr.weeks ? curr : prev
  )

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Garden-themed step indicator */}
        <div className="flex items-center justify-center gap-1 mb-4">
          {(['seed', 'target', 'growth', 'preview'] as WizardStep[]).map((s, i) => {
            const icons = [Sprout, Target, Leaf, Flower2]
            const Icon = icons[i]
            const isActive = step === s
            const isPast = ['seed', 'target', 'growth', 'preview'].indexOf(step) > i

            return (
              <div key={s} className="flex items-center">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground scale-110'
                      : isPast
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                {i < 3 && (
                  <div
                    className={cn(
                      'w-8 h-0.5 mx-1',
                      isPast ? 'bg-primary' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Step 1: Choose Seed Type */}
        {step === 'seed' && (
          <>
            <DialogHeader className="text-center">
              <DialogTitle className="flex items-center justify-center gap-2">
                <Sprout className="h-5 w-5 text-green-500" />
                Plant a Goal Seed
              </DialogTitle>
              <DialogDescription>
                Choose how your goal will grow with {plantName}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {SEED_TYPES.map((seed) => (
                <button
                  key={seed.id}
                  onClick={() => {
                    setGoalMode(seed.id)
                    if (seed.id === 'total_progress') setTrackingMetric('sum')
                  }}
                  className={cn(
                    'relative p-4 rounded-xl border-2 text-left transition-all overflow-hidden',
                    goalMode === seed.id
                      ? `${seed.borderColor} ring-2 ring-offset-2 ring-primary`
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  {/* Background gradient */}
                  <div
                    className={cn(
                      'absolute inset-0 bg-gradient-to-br opacity-50',
                      seed.color
                    )}
                  />

                  <div className="relative flex items-start gap-4">
                    <span className="text-3xl">{seed.icon}</span>
                    <div className="flex-1">
                      <h3 className={cn('font-semibold', seed.textColor)}>
                        {seed.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {seed.description}
                      </p>
                      <p className="text-xs font-mono bg-background/50 px-2 py-1 rounded mt-2 inline-block">
                        {seed.example}
                      </p>
                    </div>
                    {goalMode === seed.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Set Target */}
        {step === 'target' && (
          <>
            <DialogHeader className="text-center">
              <DialogTitle className="flex items-center justify-center gap-2">
                <Target className="h-5 w-5 text-blue-500" />
                Set Your Target
              </DialogTitle>
              <DialogDescription>
                Define what you want to achieve
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-4">
              {/* Unit */}
              <div className="space-y-2">
                <Label htmlFor="unit">What are you measuring?</Label>
                <Input
                  id="unit"
                  placeholder={
                    goalMode === 'build_capacity'
                      ? 'e.g., km, pages, minutes'
                      : 'e.g., $, books, items'
                  }
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="text-lg"
                />
              </div>

              {/* Start/Current Value */}
              {goalMode === 'build_capacity' && (
                <div className="space-y-2">
                  <Label htmlFor="startValue">Current level (optional)</Label>
                  <Input
                    id="startValue"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="0"
                    value={startValue}
                    onChange={(e) => setStartValue(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Where you're starting from
                  </p>
                </div>
              )}

              {goalMode === 'total_progress' && (
                <div className="space-y-2">
                  <Label htmlFor="initialAmount">Already accumulated (optional)</Label>
                  <Input
                    id="initialAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                  />
                </div>
              )}

              {/* Target Value */}
              <div className="space-y-2">
                <Label htmlFor="targetValue" className="flex items-center gap-2">
                  <span>Goal target</span>
                  <span className="text-primary font-medium">*</span>
                </Label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="targetValue"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder={goalMode === 'build_capacity' ? '10' : '10000'}
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="text-lg font-medium"
                  />
                  {unit && (
                    <span className="text-muted-foreground font-medium">
                      {unit}
                    </span>
                  )}
                </div>
              </div>

              {/* Tracking Metric (for capacity goals) */}
              {goalMode === 'build_capacity' && (
                <div className="space-y-2">
                  <Label>How to track progress</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {TRACKING_METRICS.map((metric) => (
                      <button
                        key={metric.id}
                        type="button"
                        onClick={() => setTrackingMetric(metric.id)}
                        className={cn(
                          'p-3 rounded-lg border text-center transition-all',
                          trackingMetric === metric.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'hover:border-primary/50'
                        )}
                      >
                        <div className="font-medium text-sm">{metric.label}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          {metric.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Duration Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Growth duration</Label>
                  <span className="text-sm font-medium flex items-center gap-1">
                    {currentGrowthStage.icon} {durationWeeks} weeks
                  </span>
                </div>

                <Slider
                  value={[durationWeeks]}
                  onValueChange={(v) => {
                    setDurationWeeks(v[0])
                    setManualTargets(null) // Reset manual targets when duration changes
                  }}
                  min={2}
                  max={24}
                  step={1}
                  className="py-2"
                />

                {/* Duration markers */}
                <div className="flex justify-between text-xs">
                  {DURATION_MARKERS.map((marker) => (
                    <button
                      key={marker.weeks}
                      onClick={() => {
                        setDurationWeeks(marker.weeks)
                        setManualTargets(null)
                      }}
                      className={cn(
                        'flex flex-col items-center gap-1 px-2 py-1 rounded transition-colors',
                        durationWeeks === marker.weeks
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-muted'
                      )}
                    >
                      <span className="text-base">{marker.icon}</span>
                      <span>{marker.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Growth Curve */}
        {step === 'growth' && (
          <>
            <DialogHeader className="text-center">
              <DialogTitle className="flex items-center justify-center gap-2">
                <Leaf className="h-5 w-5 text-green-500" />
                Choose Growth Pattern
              </DialogTitle>
              <DialogDescription>
                How should your targets increase over time?
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-3">
              {GROWTH_CURVES.map((curve) => (
                <button
                  key={curve.id}
                  onClick={() => {
                    setProgressionType(curve.id)
                    setManualTargets(null) // Reset manual targets when curve changes
                  }}
                  className={cn(
                    'p-3 rounded-xl border-2 text-center transition-all',
                    progressionType === curve.id
                      ? 'border-primary bg-primary/5 ring-2 ring-offset-2 ring-primary'
                      : 'hover:border-primary/50'
                  )}
                >
                  <div className="text-2xl mb-1">{curve.icon}</div>
                  <div className="font-medium text-sm">{curve.name}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    {curve.description}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground mt-2 tracking-tighter">
                    {curve.visual}
                  </div>
                </button>
              ))}
            </div>

            {/* Mini preview */}
            <div className="p-3 rounded-lg bg-muted/50 mt-2">
              <div className="text-xs text-muted-foreground mb-2">Preview (first 4 weeks):</div>
              <div className="flex gap-2">
                {previewTargets.slice(0, 4).map((target, i) => (
                  <div key={i} className="flex-1 text-center">
                    <div className="text-xs text-muted-foreground">W{i + 1}</div>
                    <div className="text-sm font-medium">
                      {Math.round(target)} {unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Step 4: Preview (Goal Master Format) */}
        {step === 'preview' && (
          <>
            <DialogHeader className="text-center">
              <DialogTitle className="flex items-center justify-center gap-2">
                <Flower2 className="h-5 w-5 text-pink-500" />
                Your Goal Garden Preview
              </DialogTitle>
              <DialogDescription>
                Review your growth plan before planting
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Summary badges */}
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-sm">
                  {goalMode === 'build_capacity' ? '📈' : '🎯'}{' '}
                  {goalMode === 'build_capacity' ? 'Capacity' : 'Accumulator'}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 text-sm">
                  {currentGrowthStage.icon} {durationWeeks} weeks
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 text-sm">
                  {GROWTH_CURVES.find((c) => c.id === progressionType)?.icon}{' '}
                  {GROWTH_CURVES.find((c) => c.id === progressionType)?.name}
                </span>
              </div>

              {/* Target summary */}
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200/50 dark:border-green-800/50">
                <div className="text-sm text-muted-foreground">Your Goal</div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                  {goalMode === 'build_capacity' && startValue ? (
                    <>
                      {startValue} → {targetValue} {unit}
                    </>
                  ) : (
                    <>
                      {targetValue} {unit}
                    </>
                  )}
                </div>
              </div>

              {/* Weekly targets (Goal Master format) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Weekly Targets</h4>
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
                    onClick={handleResetToRecommended}
                    className="w-full text-xs h-7"
                  >
                    Reset to Recommended
                  </Button>
                )}

                {/* Timeline list (Goal Master format) */}
                <div className="max-h-[200px] overflow-y-auto rounded-lg border divide-y">
                  {previewTargets.map((target, i) => (
                    <div
                      key={i}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 text-sm',
                        i === 0 && 'bg-primary/5'
                      )}
                    >
                      {/* Week date range */}
                      <span className="text-xs text-muted-foreground w-24 shrink-0">
                        {weekDateRanges[i]?.start} - {weekDateRanges[i]?.end}
                      </span>

                      {/* Separator */}
                      <span className="text-muted-foreground">:</span>

                      {/* Target indicator */}
                      <span className="text-muted-foreground">—</span>

                      {/* Target value */}
                      {showManualEditor ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.1"
                          value={manualTargets?.[i] ?? Math.round(target * 10) / 10}
                          onChange={(e) =>
                            handleManualTargetChange(i, Number(e.target.value))
                          }
                          className="w-20 h-7 text-sm"
                        />
                      ) : (
                        <span className="font-medium">
                          {Math.round((manualTargets?.[i] ?? target) * 10) / 10}
                        </span>
                      )}

                      <span className="text-muted-foreground">{unit}</span>

                      {/* Week indicator */}
                      {i === 0 && (
                        <span className="ml-auto text-xs text-primary font-medium">
                          Start
                        </span>
                      )}
                      {i === previewTargets.length - 1 && (
                        <span className="ml-auto text-xs text-green-600 font-medium">
                          🎯 Goal
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Warning for large jumps */}
                {manualTargets && (() => {
                  const hasLargeJump = manualTargets.some((target, i) => {
                    if (i === 0) return false
                    const prev = manualTargets[i - 1]
                    const jump = (target - prev) / prev
                    return jump > 0.25 // > 25% increase
                  })
                  return hasLargeJump ? (
                    <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      ⚠️ Some weeks have large jumps (&gt;25%). Consider smoothing them out.
                    </p>
                  ) : null
                })()}
              </div>

              {/* Motivational message */}
              <p className="text-center text-sm text-muted-foreground italic">
                "Small steps every week lead to big growth. 🌱"
              </p>
            </div>
          </>
        )}

        <DialogFooter className="gap-2">
          {step !== 'seed' && (
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
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
            >
              {isPending ? 'Planting...' : '🌱 Plant Goal'}
              {!isPending && <Check className="h-4 w-4 ml-2" />}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

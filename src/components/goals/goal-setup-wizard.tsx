'use client'

import { useState, useTransition } from 'react'
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
import {
  TrendingUp,
  Target,
  ArrowRight,
  ArrowLeft,
  Check,
  BarChart3,
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

type WizardStep = 'mode' | 'details' | 'progression' | 'preview'

const GOAL_MODES = [
  {
    id: 'build_capacity' as GoalMode,
    title: 'Build Capacity',
    titleVi: 'Nang cao nang luc',
    icon: TrendingUp,
    description: 'Improve your performance over time',
    descriptionVi: 'Nang cao gia tri moi lan thuc hien',
    example: 'Run: 2km -> 10km',
    metric: 'MAX',
  },
  {
    id: 'total_progress' as GoalMode,
    title: 'Total Progress',
    titleVi: 'Tich luy tien do',
    icon: Target,
    description: 'Accumulate towards a target',
    descriptionVi: 'Tich luy den muc tieu',
    example: 'Save: $0 -> $10,000',
    metric: 'SUM',
  },
]

const PROGRESSION_TYPES = [
  {
    id: 'linear' as ProgressionType,
    name: 'Linear',
    description: 'Steady progress each week',
    icon: '📈',
    curve: 'straight',
  },
  {
    id: 'exponential' as ProgressionType,
    name: 'Exponential',
    description: 'Start slow, accelerate later',
    icon: '🚀',
    curve: 'slow-start',
  },
  {
    id: 'logarithmic' as ProgressionType,
    name: 'Logarithmic',
    description: 'Quick start, stabilize later',
    icon: '⚡',
    curve: 'quick-start',
  },
  {
    id: 's-curve' as ProgressionType,
    name: 'S-Curve',
    description: 'Slow-Fast-Slow (most natural)',
    icon: '🌊',
    curve: 'sigmoid',
  },
  {
    id: 'step' as ProgressionType,
    name: 'Step',
    description: 'Level up in stages',
    icon: '🪜',
    curve: 'steps',
  },
]

const TRACKING_METRICS = [
  { id: 'max', label: 'Maximum', description: 'Track your best performance' },
  { id: 'sum', label: 'Total Sum', description: 'Add up all values' },
  { id: 'average', label: 'Average', description: 'Track average performance' },
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

  // Form state
  const [goalMode, setGoalMode] = useState<GoalMode | null>(null)
  const [unit, setUnit] = useState('')
  const [startValue, setStartValue] = useState('')
  const [targetValue, setTargetValue] = useState('')
  const [initialAmount, setInitialAmount] = useState('')
  const [durationWeeks, setDurationWeeks] = useState('12')
  const [progressionType, setProgressionType] = useState<ProgressionType>('linear')
  const [trackingMetric, setTrackingMetric] = useState('max')

  const resetForm = () => {
    setStep('mode')
    setGoalMode(null)
    setUnit('')
    setStartValue('')
    setTargetValue('')
    setInitialAmount('')
    setDurationWeeks('12')
    setProgressionType('linear')
    setTrackingMetric('max')
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) {
      resetForm()
    }
  }

  const handleNext = () => {
    if (step === 'mode' && goalMode) setStep('details')
    else if (step === 'details') setStep('progression')
    else if (step === 'progression') setStep('preview')
  }

  const handleBack = () => {
    if (step === 'details') setStep('mode')
    else if (step === 'progression') setStep('details')
    else if (step === 'preview') setStep('progression')
  }

  const canProceed = () => {
    if (step === 'mode') return !!goalMode
    if (step === 'details') {
      return (
        unit.trim() &&
        targetValue &&
        Number(targetValue) > 0 &&
        durationWeeks &&
        Number(durationWeeks) > 0
      )
    }
    if (step === 'progression') return true
    return true
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
        duration_weeks: Number(durationWeeks),
        progression_type: progressionType,
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

  // Generate preview data
  const previewTargets = goalMode
    ? generateProgressionPlan({
        startValue: goalMode === 'build_capacity' ? Number(startValue) || 0 : 0,
        endValue: Number(targetValue) || 100,
        totalWeeks: Number(durationWeeks) || 12,
        type: progressionType as ProgType,
      })
    : []

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {(['mode', 'details', 'progression', 'preview'] as WizardStep[]).map((s, i) => (
            <div
              key={s}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                step === s
                  ? 'bg-primary w-4'
                  : ['mode', 'details', 'progression', 'preview'].indexOf(step) > i
                  ? 'bg-primary'
                  : 'bg-muted'
              )}
            />
          ))}
        </div>

        {/* Step 1: Choose Mode */}
        {step === 'mode' && (
          <>
            <DialogHeader>
              <DialogTitle>Choose Goal Type</DialogTitle>
              <DialogDescription>
                How do you want to track progress for {plantName}?
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {GOAL_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    setGoalMode(mode.id)
                    if (mode.id === 'total_progress') {
                      setTrackingMetric('sum')
                    }
                  }}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-lg border text-left transition-all',
                    goalMode === mode.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'hover:border-primary/50 hover:bg-accent'
                  )}
                >
                  <div
                    className={cn(
                      'p-2 rounded-lg',
                      goalMode === mode.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    )}
                  >
                    <mode.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{mode.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{mode.description}</p>
                    <p className="text-xs text-muted-foreground mt-2 font-mono bg-muted px-2 py-1 rounded inline-block">
                      {mode.example}
                    </p>
                  </div>
                  {goalMode === mode.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Details */}
        {step === 'details' && (
          <>
            <DialogHeader>
              <DialogTitle>Set Your Target</DialogTitle>
              <DialogDescription>
                Define the specifics of your goal
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit of Measurement *</Label>
                <Input
                  id="unit"
                  placeholder={goalMode === 'build_capacity' ? 'e.g., km, pages, minutes' : 'e.g., $, books, pushups'}
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                />
              </div>

              {goalMode === 'build_capacity' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="startValue">Starting Value</Label>
                    <Input
                      id="startValue"
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g., 2"
                      value={startValue}
                      onChange={(e) => setStartValue(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Your current capability (default: 0)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="trackingMetric">Tracking Method</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {TRACKING_METRICS.map((metric) => (
                        <button
                          key={metric.id}
                          type="button"
                          onClick={() => setTrackingMetric(metric.id)}
                          className={cn(
                            'p-2 rounded-lg border text-center text-sm transition-all',
                            trackingMetric === metric.id
                              ? 'border-primary bg-primary/5'
                              : 'hover:border-primary/50'
                          )}
                        >
                          {metric.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {goalMode === 'total_progress' && (
                <div className="space-y-2">
                  <Label htmlFor="initialAmount">Current Amount (optional)</Label>
                  <Input
                    id="initialAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="e.g., 500"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    What you've already accumulated
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="targetValue">Target Value *</Label>
                <Input
                  id="targetValue"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder={goalMode === 'build_capacity' ? 'e.g., 10' : 'e.g., 10000'}
                  value={targetValue}
                  onChange={(e) => setTargetValue(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="durationWeeks">Duration (weeks) *</Label>
                <Input
                  id="durationWeeks"
                  type="number"
                  min="1"
                  max="52"
                  placeholder="e.g., 12"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Recommended: 8-16 weeks for sustainable progress
                </p>
              </div>
            </div>
          </>
        )}

        {/* Step 3: Progression */}
        {step === 'progression' && (
          <>
            <DialogHeader>
              <DialogTitle>Choose Progression Style</DialogTitle>
              <DialogDescription>
                How should your targets increase over time?
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              {PROGRESSION_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setProgressionType(type.id)}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                    progressionType === type.id
                      ? 'border-primary bg-primary/5 ring-2 ring-primary'
                      : 'hover:border-primary/50 hover:bg-accent'
                  )}
                >
                  <span className="text-2xl">{type.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium">{type.name}</h4>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                  {progressionType === type.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 4: Preview */}
        {step === 'preview' && (
          <>
            <DialogHeader>
              <DialogTitle>Preview Your Goal</DialogTitle>
              <DialogDescription>
                Review your settings before confirming
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Summary */}
              <div className="p-4 rounded-lg bg-muted space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Type</span>
                  <span className="font-medium">
                    {goalMode === 'build_capacity' ? 'Build Capacity' : 'Total Progress'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Target</span>
                  <span className="font-medium">
                    {targetValue} {unit}
                  </span>
                </div>
                {goalMode === 'build_capacity' && startValue && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Starting from</span>
                    <span className="font-medium">{startValue} {unit}</span>
                  </div>
                )}
                {goalMode === 'total_progress' && initialAmount && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Already have</span>
                    <span className="font-medium">{initialAmount} {unit}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duration</span>
                  <span className="font-medium">{durationWeeks} weeks</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Progression</span>
                  <span className="font-medium capitalize">{progressionType}</span>
                </div>
              </div>

              {/* Weekly targets preview */}
              <div>
                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Weekly Targets Preview
                </h4>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  {previewTargets.slice(0, 8).map((target, i) => (
                    <div
                      key={i}
                      className="p-2 rounded bg-muted text-center"
                    >
                      <div className="text-muted-foreground">Week {i + 1}</div>
                      <div className="font-medium">
                        {target.toFixed(1)} {unit}
                      </div>
                    </div>
                  ))}
                </div>
                {previewTargets.length > 8 && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    ... and {previewTargets.length - 8} more weeks
                  </p>
                )}
              </div>
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
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? 'Creating...' : 'Create Goal'}
              <Check className="h-4 w-4 ml-2" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

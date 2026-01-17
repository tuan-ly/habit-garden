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
  TrendingDown,
  Calendar,
  RefreshCw,
  ArrowRight,
  Check,
  ArrowLeft,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Goal } from '@/types/database'
import { modifyGoal } from '@/lib/actions/goals'
import { generateProgressionPlan, type ProgressionType } from '@/lib/progression'
import { GoalComparison } from './goal-comparison'
import { toast } from 'sonner'

interface GoalModifyModalProps {
  goal: Goal
  currentWeek: number
  open: boolean
  onOpenChange: (open: boolean) => void
  onComplete?: () => void
}

type ModifyMode = 'select' | 'adjust' | 'preview'
type AdjustType = 'increase' | 'decrease' | 'extend' | 'recalculate'

const ADJUST_OPTIONS = [
  {
    id: 'increase' as AdjustType,
    title: 'Increase Target',
    description: '"I can do more!"',
    icon: TrendingUp,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'decrease' as AdjustType,
    title: 'Decrease Target',
    description: '"I need to be more realistic"',
    icon: TrendingDown,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-200 dark:border-amber-800',
  },
  {
    id: 'extend' as AdjustType,
    title: 'Extend Timeline',
    description: '"I need more time"',
    icon: Calendar,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200 dark:border-blue-800',
  },
  {
    id: 'recalculate' as AdjustType,
    title: 'Recalculate from Now',
    description: '"Start fresh from current level"',
    icon: RefreshCw,
    color: 'text-violet-500',
    bgColor: 'bg-violet-50 dark:bg-violet-950/30',
    borderColor: 'border-violet-200 dark:border-violet-800',
  },
]

export function GoalModifyModal({
  goal,
  currentWeek,
  open,
  onOpenChange,
  onComplete,
}: GoalModifyModalProps) {
  const [mode, setMode] = useState<ModifyMode>('select')
  const [adjustType, setAdjustType] = useState<AdjustType | null>(null)
  const [isPending, startTransition] = useTransition()

  // Form state
  const [newTargetValue, setNewTargetValue] = useState(goal.target_value.toString())
  const [newDurationWeeks, setNewDurationWeeks] = useState(goal.duration_weeks)

  // Original values
  const originalTargets = goal.weekly_targets as number[] || []

  // Calculate new weekly targets based on adjustment
  const newWeeklyTargets = useMemo(() => {
    const progressionType = (goal.progression_type || 'linear') as ProgressionType

    if (adjustType === 'recalculate') {
      // Start fresh from current value
      return generateProgressionPlan({
        startValue: Number(goal.current_value),
        endValue: Number(newTargetValue),
        totalWeeks: newDurationWeeks - (currentWeek - 1), // Remaining weeks
        type: progressionType,
      })
    }

    // For other adjustments, regenerate the full plan
    return generateProgressionPlan({
      startValue: Number(goal.start_value),
      endValue: Number(newTargetValue),
      totalWeeks: newDurationWeeks,
      type: progressionType,
    })
  }, [goal, newTargetValue, newDurationWeeks, adjustType, currentWeek])

  // Reset form
  const resetForm = () => {
    setMode('select')
    setAdjustType(null)
    setNewTargetValue(goal.target_value.toString())
    setNewDurationWeeks(goal.duration_weeks)
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
    if (!newOpen) resetForm()
  }

  const handleSelectAdjust = (type: AdjustType) => {
    setAdjustType(type)

    // Set initial values based on type
    if (type === 'increase') {
      setNewTargetValue((Number(goal.target_value) * 1.1).toFixed(1))
    } else if (type === 'decrease') {
      setNewTargetValue((Number(goal.target_value) * 0.9).toFixed(1))
    } else if (type === 'extend') {
      setNewDurationWeeks(goal.duration_weeks + 2)
    } else if (type === 'recalculate') {
      // Keep same target but recalculate from current position
      setNewTargetValue(goal.target_value.toString())
    }

    setMode('adjust')
  }

  const handleSubmit = async () => {
    startTransition(async () => {
      const result = await modifyGoal({
        goal_id: goal.id,
        target_value: Number(newTargetValue),
        duration_weeks: newDurationWeeks,
        weekly_targets: adjustType === 'recalculate'
          ? [...originalTargets.slice(0, currentWeek - 1), ...newWeeklyTargets]
          : newWeeklyTargets,
      })

      if (result.success) {
        toast.success('Goal updated!', {
          description: 'Your goal has been adjusted successfully',
        })
        handleOpenChange(false)
        onComplete?.()
      } else {
        toast.error('Failed to update goal', {
          description: result.error,
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        {/* Step 1: Select Adjustment Type */}
        {mode === 'select' && (
          <>
            <DialogHeader className="text-center">
              <DialogTitle className="flex items-center justify-center gap-2">
                <RefreshCw className="h-5 w-5 text-primary" />
                Adjust Your Goal
              </DialogTitle>
              <DialogDescription>
                Choose how you'd like to modify your goal
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-4">
              {ADJUST_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleSelectAdjust(option.id)}
                  className={cn(
                    'flex items-center gap-3 p-4 rounded-lg border-2 text-left transition-all',
                    'hover:scale-[1.02]',
                    option.bgColor,
                    option.borderColor
                  )}
                >
                  <option.icon className={cn('h-5 w-5', option.color)} />
                  <div>
                    <h4 className="font-medium">{option.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto text-muted-foreground" />
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Adjust Values */}
        {mode === 'adjust' && adjustType && (
          <>
            <DialogHeader className="text-center">
              <DialogTitle className="flex items-center justify-center gap-2">
                {(() => {
                  const option = ADJUST_OPTIONS.find((o) => o.id === adjustType)
                  if (!option) return null
                  const Icon = option.icon
                  return <Icon className={cn('h-5 w-5', option.color)} />
                })()}
                {ADJUST_OPTIONS.find((o) => o.id === adjustType)?.title}
              </DialogTitle>
              <DialogDescription>
                Adjust the values to match your needs
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Target Value */}
              {(adjustType === 'increase' || adjustType === 'decrease' || adjustType === 'recalculate') && (
                <div className="space-y-3">
                  <Label htmlFor="targetValue">Target Value</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="targetValue"
                      type="number"
                      min="0.01"
                      step="0.1"
                      value={newTargetValue}
                      onChange={(e) => setNewTargetValue(e.target.value)}
                      className="text-lg font-medium"
                    />
                    <span className="text-muted-foreground font-medium">
                      {goal.unit}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Current: {goal.target_value} {goal.unit}
                    </span>
                    {Number(newTargetValue) !== goal.target_value && (
                      <span
                        className={cn(
                          'font-medium',
                          Number(newTargetValue) > goal.target_value
                            ? 'text-emerald-600'
                            : 'text-amber-600'
                        )}
                      >
                        {Number(newTargetValue) > goal.target_value ? '+' : ''}
                        {(Number(newTargetValue) - goal.target_value).toFixed(1)} {goal.unit}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Duration */}
              {(adjustType === 'extend' || adjustType === 'recalculate') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Duration</Label>
                    <span className="text-sm font-medium">
                      {newDurationWeeks} weeks
                    </span>
                  </div>
                  <Slider
                    value={[newDurationWeeks]}
                    onValueChange={(v) => setNewDurationWeeks(v[0])}
                    min={Math.max(currentWeek, 2)}
                    max={52}
                    step={1}
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Current: {goal.duration_weeks} weeks
                    </span>
                    {newDurationWeeks !== goal.duration_weeks && (
                      <span
                        className={cn(
                          'font-medium',
                          newDurationWeeks > goal.duration_weeks
                            ? 'text-blue-600'
                            : 'text-orange-600'
                        )}
                      >
                        {newDurationWeeks > goal.duration_weeks ? '+' : ''}
                        {newDurationWeeks - goal.duration_weeks} weeks
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Info for recalculate */}
              {adjustType === 'recalculate' && (
                <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 text-sm">
                  <p className="text-violet-700 dark:text-violet-300">
                    This will keep your past progress and recalculate the remaining
                    weeks from your current level ({Number(goal.current_value).toFixed(1)} {goal.unit}).
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setMode('select')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setMode('preview')}>
                Preview Changes
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Preview */}
        {mode === 'preview' && adjustType && (
          <>
            <DialogHeader className="text-center">
              <DialogTitle>Review Changes</DialogTitle>
              <DialogDescription>
                Confirm your goal adjustments
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <GoalComparison
                before={{
                  targetValue: goal.target_value,
                  durationWeeks: goal.duration_weeks,
                  weeklyTargets: originalTargets,
                  unit: goal.unit,
                }}
                after={{
                  targetValue: Number(newTargetValue),
                  durationWeeks: newDurationWeeks,
                  weeklyTargets: adjustType === 'recalculate'
                    ? [...originalTargets.slice(0, currentWeek - 1), ...newWeeklyTargets]
                    : newWeeklyTargets,
                  unit: goal.unit,
                }}
                currentWeek={currentWeek}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setMode('adjust')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isPending}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              >
                {isPending ? 'Applying...' : 'Apply Changes'}
                {!isPending && <Check className="h-4 w-4 ml-2" />}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

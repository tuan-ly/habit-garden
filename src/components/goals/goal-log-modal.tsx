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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Minus, Plus, Trophy, Target, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoalWithStats } from '@/lib/actions/goals'
import { logGoalValue } from '@/lib/actions/goals'
import {
  applyGoalLogToPeriod,
  formatGoalValue,
  getGoalLogCopy,
  getRemainingGoalValue,
} from '@/lib/goal-progress'
import { showGoalLogToast } from '@/components/plants/water-toast'
import { toast } from 'sonner'

interface GoalLogModalProps {
  goal: GoalWithStats
  plantName: string
  plantIcon?: string
  consistencyDayAdded?: boolean
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function GoalLogModal({
  goal,
  plantName,
  plantIcon,
  consistencyDayAdded = false,
  open,
  onOpenChange,
  onSuccess,
}: GoalLogModalProps) {
  const [value, setValue] = useState('')
  const [notes, setNotes] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{
    xpEarned?: number
    isPersonalRecord?: boolean
    exceededTarget?: boolean
  } | null>(null)

  const handleIncrement = (amount: number) => {
    const current = Number(value) || 0
    setValue(String(Math.max(0, current + amount)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const numValue = Number(value)
    if (!numValue || numValue <= 0) {
      toast.error('Please enter a valid value')
      return
    }

    startTransition(async () => {
      const res = await logGoalValue({
        goal_id: goal.id,
        value: numValue,
        notes: notes.trim() || undefined,
      })

      if (res.success) {
        setResult({
          xpEarned: res.xpEarned,
          isPersonalRecord: res.isPersonalRecord,
          exceededTarget: res.exceededTarget,
        })

        showGoalLogToast({
          plantName,
          plantIcon,
          value: numValue,
          unit: goal.unit,
          xpEarned: res.xpEarned || 0,
          isPersonalRecord: res.isPersonalRecord,
          periodProgress: applyGoalLogToPeriod(
            goal.goal_mode,
            goal.periodProgress,
            numValue
          ),
          periodTarget: goal.currentPeriodTarget,
          periodLabel: goal.periodLabel,
          consistencyDayAdded,
        })

        // Reset and close after a brief delay for celebration
        setTimeout(() => {
          setValue('')
          setNotes('')
          setResult(null)
          onOpenChange(false)
          onSuccess?.()
        }, res.isPersonalRecord ? 1500 : 500)
      } else {
        toast.error('Failed to log progress', {
          description: res.error,
        })
      }
    })
  }

  const numValue = Number(value) || 0
  const nextPeriodProgress = applyGoalLogToPeriod(
    goal.goal_mode,
    goal.periodProgress,
    numValue
  )
  const remainingAfterLog = getRemainingGoalValue(
    nextPeriodProgress,
    goal.currentPeriodTarget
  )
  const willExceedTarget = numValue > 0 && remainingAfterLog === 0
  const willBePR =
    goal.goal_mode === 'build_capacity' &&
    goal.tracking_metric === 'max' &&
    numValue > Number(goal.current_value)
  const goalLogCopy = getGoalLogCopy(goal.goal_mode, goal.unit)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        {/* Success celebration overlay */}
        {result?.isPersonalRecord && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10 rounded-lg">
            <div className="text-center animate-in zoom-in-50 fade-in duration-300">
              <div className="text-6xl mb-4">
                <Trophy className="h-16 w-16 text-yellow-500 mx-auto animate-bounce" />
              </div>
              <h3 className="text-2xl font-bold text-yellow-500">Personal Record!</h3>
              <p className="text-muted-foreground mt-2">
                {value} {goal.unit}
              </p>
              <p className="text-sm text-primary mt-1">+{result.xpEarned} XP</p>
            </div>
          </div>
        )}

        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {goal.goal_mode === 'build_capacity' ? (
              <>
                <Target className="h-5 w-5 text-primary" />
                Log Your Progress
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-primary" />
                Add to Total
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {goal.periodLabel} target: {formatGoalValue(goal.currentPeriodTarget)} {goal.unit}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Value input with +/- buttons */}
            <div className="space-y-2">
              <Label htmlFor="value">{goalLogCopy.label}</Label>
              <p className="text-xs text-muted-foreground">{goalLogCopy.hint}</p>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleIncrement(-1)}
                  disabled={numValue <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="value"
                  type="number"
                  min="0"
                  step="0.1"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="text-center text-xl font-semibold"
                  placeholder="0"
                  required
                  autoFocus
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleIncrement(1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quick buttons */}
            <div className="flex flex-wrap gap-2">
              {[5, 10, 25, 50, 100].map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue(String(amount))}
                  className={cn(
                    'text-xs',
                    numValue === amount && 'border-primary bg-primary/5'
                  )}
                >
                  {amount}
                </Button>
              ))}
            </div>

            {/* Target comparison */}
            {numValue > 0 && (
              <div
                className={cn(
                  'p-3 rounded-lg border transition-colors',
                  willBePR
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                    : willExceedTarget
                    ? 'border-green-500 bg-green-50 dark:bg-green-950'
                    : 'border-muted bg-muted'
                )}
              >
                {willBePR ? (
                  <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm font-medium">New Personal Record!</span>
                  </div>
                ) : willExceedTarget ? (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <Sparkles className="h-4 w-4" />
                    <span className="text-sm font-medium">{goal.periodLabel} target complete!</span>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    {formatGoalValue(remainingAfterLog)} {goal.unit} left in {goal.periodLabel}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="How did it go?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || numValue <= 0}>
              {isPending ? 'Logging...' : 'Log Progress'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

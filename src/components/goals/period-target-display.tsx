'use client'

import { cn } from '@/lib/utils'
import { Target, TrendingUp, Calendar, CalendarDays, CalendarRange, Check, AlertCircle } from 'lucide-react'
import type { GoalWithStats } from '@/lib/actions/goals'
import type { GoalFrequency } from '@/types/database'

interface PeriodTargetDisplayProps {
  goal: GoalWithStats
  variant?: 'compact' | 'full' | 'minimal'
  className?: string
}

const FREQUENCY_CONFIG: Record<GoalFrequency, { icon: typeof Calendar; label: string; shortLabel: string }> = {
  daily: { icon: Calendar, label: 'Today', shortLabel: 'D' },
  weekly: { icon: CalendarDays, label: 'This Week', shortLabel: 'W' },
  monthly: { icon: CalendarRange, label: 'This Month', shortLabel: 'M' },
}

export function PeriodTargetDisplay({ goal, variant = 'compact', className }: PeriodTargetDisplayProps) {
  const frequency = (goal.frequency || 'weekly') as GoalFrequency
  const config = FREQUENCY_CONFIG[frequency]
  const Icon = config.icon

  const progressPercent = goal.currentPeriodTarget > 0
    ? Math.min(100, (goal.periodProgress / goal.currentPeriodTarget) * 100)
    : 0

  const isCompleted = goal.periodProgress >= goal.currentPeriodTarget
  const isNearTarget = progressPercent >= 80 && !isCompleted

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-1.5 text-xs', className)}>
        <Icon className="h-3 w-3 text-muted-foreground" />
        <span className={cn(
          'font-medium',
          isCompleted ? 'text-green-600' : isNearTarget ? 'text-amber-600' : ''
        )}>
          {Math.round(goal.periodProgress)}/{Math.round(goal.currentPeriodTarget)} {goal.unit}
        </span>
        {isCompleted && <Check className="h-3 w-3 text-green-600" />}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn('rounded-lg border p-2 bg-background/50', className)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{config.label}</span>
          </div>
          <div className="flex items-center gap-1">
            {isCompleted ? (
              <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                <Check className="h-3 w-3" /> Done
              </span>
            ) : (
              <span className={cn(
                'text-xs font-medium',
                isNearTarget ? 'text-amber-600' : 'text-muted-foreground'
              )}>
                {Math.round(progressPercent)}%
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              isCompleted
                ? 'bg-green-500'
                : isNearTarget
                ? 'bg-amber-500'
                : 'bg-primary'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Target info */}
        <div className="mt-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {goal.periodLabel}
          </span>
          <span className={cn(
            'font-medium',
            isCompleted ? 'text-green-600' : ''
          )}>
            {Math.round(goal.periodProgress * 10) / 10} / {Math.round(goal.currentPeriodTarget * 10) / 10} {goal.unit}
          </span>
        </div>
      </div>
    )
  }

  // Full variant
  return (
    <div className={cn('rounded-xl border p-4 bg-background', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center',
            isCompleted ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary'
          )}>
            {isCompleted ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
          </div>
          <div>
            <h4 className="font-medium text-sm">{config.label}'s Target</h4>
            <p className="text-xs text-muted-foreground">{goal.periodDateRange}</p>
          </div>
        </div>
        <div className={cn(
          'px-2 py-1 rounded-full text-xs font-medium',
          isCompleted
            ? 'bg-green-100 text-green-700'
            : isNearTarget
            ? 'bg-amber-100 text-amber-700'
            : 'bg-muted text-muted-foreground'
        )}>
          {isCompleted ? 'Completed' : isNearTarget ? 'Almost there!' : `${Math.round(progressPercent)}%`}
        </div>
      </div>

      {/* Progress visualization */}
      <div className="relative mb-3">
        <div className="h-3 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              isCompleted
                ? 'bg-gradient-to-r from-green-400 to-green-500'
                : isNearTarget
                ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                : 'bg-gradient-to-r from-primary/80 to-primary'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {/* Target marker */}
        <div
          className="absolute top-0 h-3 w-0.5 bg-foreground/30"
          style={{ left: '100%', transform: 'translateX(-1px)' }}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-lg bg-muted/50">
          <div className="text-lg font-bold">
            {Math.round(goal.periodProgress * 10) / 10}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Progress
          </div>
        </div>
        <div className="p-2 rounded-lg bg-muted/50">
          <div className="text-lg font-bold">
            {Math.round(goal.currentPeriodTarget * 10) / 10}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Target
          </div>
        </div>
        <div className="p-2 rounded-lg bg-muted/50">
          <div className="text-lg font-bold">
            {Math.round(Math.max(0, goal.currentPeriodTarget - goal.periodProgress) * 10) / 10}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
            Remaining
          </div>
        </div>
      </div>

      {/* Unit label */}
      <div className="mt-2 text-center text-xs text-muted-foreground">
        {goal.unit}
      </div>

      {/* Goal mode indicator */}
      <div className="mt-3 pt-3 border-t flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          {goal.goal_mode === 'build_capacity' ? (
            <>
              <TrendingUp className="h-3 w-3" />
              <span>Build Capacity</span>
            </>
          ) : (
            <>
              <Target className="h-3 w-3" />
              <span>Total Progress</span>
            </>
          )}
        </div>
        <span className="text-muted-foreground">
          {goal.periodLabel} of {goal.duration_weeks} weeks
        </span>
      </div>
    </div>
  )
}

// Mini badge variant for plant cards
export function PeriodTargetBadge({ goal }: { goal: GoalWithStats }) {
  const frequency = (goal.frequency || 'weekly') as GoalFrequency
  const config = FREQUENCY_CONFIG[frequency]
  const Icon = config.icon

  const progressPercent = goal.currentPeriodTarget > 0
    ? Math.min(100, (goal.periodProgress / goal.currentPeriodTarget) * 100)
    : 0

  const isCompleted = goal.periodProgress >= goal.currentPeriodTarget

  return (
    <div className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium',
      isCompleted
        ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
        : 'bg-primary/10 text-primary'
    )}>
      <Icon className="h-2.5 w-2.5" />
      <span>
        {isCompleted ? (
          <span className="flex items-center gap-0.5">
            <Check className="h-2.5 w-2.5" />
          </span>
        ) : (
          `${Math.round(goal.periodProgress)}/${Math.round(goal.currentPeriodTarget)}`
        )}
      </span>
    </div>
  )
}

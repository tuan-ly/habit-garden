'use client'

import { cn } from '@/lib/utils'
import { Target, TrendingUp, Trophy, AlertCircle, Calendar, CalendarDays, CalendarRange, Check } from 'lucide-react'
import type { GoalWithStats } from '@/lib/actions/goals'
import type { GoalFrequency } from '@/types/database'

interface GoalProgressProps {
  goal: GoalWithStats
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
  className?: string
}

const FREQUENCY_CONFIG: Record<GoalFrequency, { icon: typeof Calendar; label: string }> = {
  daily: { icon: Calendar, label: 'Today' },
  weekly: { icon: CalendarDays, label: 'This Week' },
  monthly: { icon: CalendarRange, label: 'This Month' },
}

export function GoalProgress({
  goal,
  size = 'md',
  showDetails = true,
  className,
}: GoalProgressProps) {
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const progressBarHeight = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3',
  }

  const isBuildCapacity = goal.goal_mode === 'build_capacity'
  const progressPercent = Math.min(100, goal.overallProgress)

  // Period-based progress
  const frequency = (goal.frequency || 'weekly') as GoalFrequency
  const freqConfig = FREQUENCY_CONFIG[frequency]
  const FreqIcon = freqConfig.icon

  const periodProgressPercent = goal.currentPeriodTarget > 0
    ? Math.min(100, (goal.periodProgress / goal.currentPeriodTarget) * 100)
    : 0
  const isPeriodCompleted = goal.periodProgress >= goal.currentPeriodTarget

  return (
    <div className={cn('space-y-3', sizeClasses[size], className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {isBuildCapacity ? (
            <TrendingUp className={cn(
              'text-blue-500',
              size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
            )} />
          ) : (
            <Target className={cn(
              'text-green-500',
              size === 'sm' ? 'h-3 w-3' : size === 'md' ? 'h-4 w-4' : 'h-5 w-5'
            )} />
          )}
          <span className="font-medium text-muted-foreground">
            {isBuildCapacity ? 'Build Capacity' : 'Total Progress'}
          </span>
        </div>
        {!goal.isOnTrack && (
          <div className="flex items-center gap-1 text-amber-500">
            <AlertCircle className={cn(
              size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
            )} />
            <span className="text-xs">Behind</span>
          </div>
        )}
      </div>

      {/* Period Progress (Primary) */}
      {showDetails && (
        <div className="p-3 rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <FreqIcon className={cn(
                size === 'sm' ? 'h-3 w-3' : 'h-4 w-4',
                isPeriodCompleted ? 'text-green-500' : 'text-muted-foreground'
              )} />
              <span className={cn(
                'font-medium',
                isPeriodCompleted ? 'text-green-600' : ''
              )}>
                {freqConfig.label}
              </span>
            </div>
            {isPeriodCompleted ? (
              <div className="flex items-center gap-1 text-green-600">
                <Check className="h-4 w-4" />
                <span className="text-xs font-medium">Done!</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">
                {goal.periodLabel}
              </span>
            )}
          </div>

          {/* Period progress bar */}
          <div className={cn(
            'w-full rounded-full bg-background overflow-hidden',
            progressBarHeight[size]
          )}>
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                isPeriodCompleted
                  ? 'bg-gradient-to-r from-green-400 to-green-500'
                  : periodProgressPercent >= 80
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500'
                  : 'bg-gradient-to-r from-primary/80 to-primary'
              )}
              style={{ width: `${periodProgressPercent}%` }}
            />
          </div>

          <div className="flex justify-between text-muted-foreground">
            <span className="text-xs">{goal.periodDateRange}</span>
            <span className={cn(
              'font-medium',
              isPeriodCompleted ? 'text-green-600' : ''
            )}>
              {Math.round(goal.periodProgress * 10) / 10} / {Math.round(goal.currentPeriodTarget * 10) / 10} {goal.unit}
            </span>
          </div>
        </div>
      )}

      {/* Overall Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Overall Progress</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className={cn(
          'w-full rounded-full bg-muted overflow-hidden',
          size === 'sm' ? 'h-1' : 'h-1.5'
        )}>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              goal.isOnTrack ? 'bg-green-500' : 'bg-amber-500'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-muted-foreground text-xs">
          <span>
            {Number(goal.current_value).toFixed(1)} {goal.unit}
          </span>
          <span>
            {goal.target_value} {goal.unit}
          </span>
        </div>
      </div>

      {/* Stats */}
      {showDetails && goal.personalRecords > 0 && (
        <div className="flex items-center gap-1 text-yellow-600">
          <Trophy className={cn(
            size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
          )} />
          <span>{goal.personalRecords} Personal Record{goal.personalRecords > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  )
}

// Compact version for cards
export function GoalProgressRing({
  goal,
  size = 'md',
  showPeriod = false,
}: {
  goal: GoalWithStats
  size?: 'sm' | 'md' | 'lg'
  showPeriod?: boolean
}) {
  const dimensions = {
    sm: { size: 40, stroke: 4 },
    md: { size: 56, stroke: 5 },
    lg: { size: 72, stroke: 6 },
  }

  const { size: svgSize, stroke } = dimensions[size]
  const radius = (svgSize - stroke) / 2
  const circumference = radius * 2 * Math.PI

  // Use period progress if showPeriod, otherwise overall
  const progress = showPeriod
    ? (goal.currentPeriodTarget > 0 ? Math.min(100, (goal.periodProgress / goal.currentPeriodTarget) * 100) : 0)
    : Math.min(100, goal.overallProgress)

  const isPeriodCompleted = showPeriod && goal.periodProgress >= goal.currentPeriodTarget
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg
        width={svgSize}
        height={svgSize}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            'transition-all duration-500',
            isPeriodCompleted
              ? 'text-green-500'
              : showPeriod
              ? (progress >= 80 ? 'text-amber-500' : 'text-primary')
              : (goal.isOnTrack ? 'text-green-500' : 'text-amber-500')
          )}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {isPeriodCompleted ? (
          <Check className={cn(
            'text-green-500',
            size === 'sm' ? 'h-4 w-4' : size === 'md' ? 'h-5 w-5' : 'h-6 w-6'
          )} />
        ) : (
          <span className={cn(
            'font-semibold',
            size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
          )}>
            {Math.round(progress)}%
          </span>
        )}
      </div>
    </div>
  )
}

// Badge for showing goal mode
export function GoalModeBadge({
  mode,
  className,
}: {
  mode: 'build_capacity' | 'total_progress'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        mode === 'build_capacity'
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
          : 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300',
        className
      )}
    >
      {mode === 'build_capacity' ? (
        <>
          <TrendingUp className="h-3 w-3" />
          Capacity
        </>
      ) : (
        <>
          <Target className="h-3 w-3" />
          Progress
        </>
      )}
    </span>
  )
}

// Frequency badge
export function GoalFrequencyBadge({
  frequency,
  className,
}: {
  frequency: GoalFrequency
  className?: string
}) {
  const config = FREQUENCY_CONFIG[frequency]
  const Icon = config.icon

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground',
        className
      )}
    >
      <Icon className="h-3 w-3" />
      {frequency === 'daily' ? 'Daily' : frequency === 'weekly' ? 'Weekly' : 'Monthly'}
    </span>
  )
}

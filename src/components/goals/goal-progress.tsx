'use client'

import { cn } from '@/lib/utils'
import { Target, TrendingUp, Trophy, AlertCircle } from 'lucide-react'
import type { GoalWithStats } from '@/lib/actions/goals'

interface GoalProgressProps {
  goal: GoalWithStats
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
  className?: string
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
  const weeklyProgressPercent = Math.min(100, (goal.weeklyProgress / goal.currentWeekTarget) * 100)

  return (
    <div className={cn('space-y-2', sizeClasses[size], className)}>
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
            {isBuildCapacity ? 'Capacity' : 'Progress'}
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

      {/* Overall Progress Bar */}
      <div className="space-y-1">
        <div className={cn(
          'w-full rounded-full bg-muted overflow-hidden',
          progressBarHeight[size]
        )}>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              goal.isOnTrack ? 'bg-green-500' : 'bg-amber-500'
            )}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>
            {Number(goal.current_value).toFixed(1)} {goal.unit}
          </span>
          <span>
            {goal.target_value} {goal.unit}
          </span>
        </div>
      </div>

      {/* Weekly Progress */}
      {showDetails && (
        <div className="space-y-1">
          <div className="flex justify-between text-muted-foreground">
            <span>Week {goal.weekNumber} Target</span>
            <span className="font-medium">
              {goal.weeklyProgress.toFixed(1)} / {goal.currentWeekTarget.toFixed(1)} {goal.unit}
            </span>
          </div>
          <div className={cn(
            'w-full rounded-full bg-muted overflow-hidden',
            size === 'sm' ? 'h-1' : 'h-1.5'
          )}>
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                weeklyProgressPercent >= 100 ? 'bg-blue-500' : 'bg-blue-300'
              )}
              style={{ width: `${weeklyProgressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Stats */}
      {showDetails && goal.personalRecords > 0 && (
        <div className="flex items-center gap-1 text-yellow-600">
          <Trophy className={cn(
            size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'
          )} />
          <span>{goal.personalRecords} PR{goal.personalRecords > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  )
}

// Compact version for cards
export function GoalProgressRing({
  goal,
  size = 'md',
}: {
  goal: GoalWithStats
  size?: 'sm' | 'md' | 'lg'
}) {
  const dimensions = {
    sm: { size: 40, stroke: 4 },
    md: { size: 56, stroke: 5 },
    lg: { size: 72, stroke: 6 },
  }

  const { size: svgSize, stroke } = dimensions[size]
  const radius = (svgSize - stroke) / 2
  const circumference = radius * 2 * Math.PI
  const progress = Math.min(100, goal.overallProgress)
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
            goal.isOnTrack ? 'text-green-500' : 'text-amber-500'
          )}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={cn(
          'font-semibold',
          size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
        )}>
          {Math.round(progress)}%
        </span>
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

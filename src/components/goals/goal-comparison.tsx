'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { ArrowRight, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react'

interface GoalComparisonProps {
  before: {
    targetValue: number
    durationWeeks: number
    weeklyTargets: number[]
    unit: string
  }
  after: {
    targetValue: number
    durationWeeks: number
    weeklyTargets: number[]
    unit: string
  }
  currentWeek: number
  className?: string
}

export function GoalComparison({
  before,
  after,
  currentWeek,
  className,
}: GoalComparisonProps) {
  // Calculate changes
  const targetChange = after.targetValue - before.targetValue
  const targetChangePercent = Math.round((targetChange / before.targetValue) * 100)
  const durationChange = after.durationWeeks - before.durationWeeks

  // Calculate weekly target changes from current week onwards
  const weeklyChanges = useMemo(() => {
    const changes: { week: number; before: number; after: number; change: number }[] = []
    const maxWeeks = Math.max(before.weeklyTargets.length, after.weeklyTargets.length)

    for (let i = currentWeek - 1; i < maxWeeks; i++) {
      const beforeTarget = before.weeklyTargets[i] || 0
      const afterTarget = after.weeklyTargets[i] || 0
      if (beforeTarget !== afterTarget) {
        changes.push({
          week: i + 1,
          before: beforeTarget,
          after: afterTarget,
          change: afterTarget - beforeTarget,
        })
      }
    }
    return changes
  }, [before.weeklyTargets, after.weeklyTargets, currentWeek])

  const hasSignificantChanges = Math.abs(targetChangePercent) > 10 || Math.abs(durationChange) > 2

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        {/* Before */}
        <div className="p-3 rounded-lg bg-muted/50 text-center">
          <div className="text-xs text-muted-foreground mb-1">Before</div>
          <div className="text-lg font-bold">{before.targetValue}</div>
          <div className="text-xs text-muted-foreground">{before.unit}</div>
        </div>

        {/* Arrow */}
        <div className="flex items-center justify-center">
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center',
              targetChange > 0
                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600'
                : targetChange < 0
                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-600'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>

        {/* After */}
        <div className="p-3 rounded-lg bg-primary/10 text-center border border-primary/20">
          <div className="text-xs text-primary mb-1">After</div>
          <div className="text-lg font-bold text-primary">{after.targetValue}</div>
          <div className="text-xs text-muted-foreground">{after.unit}</div>
        </div>
      </div>

      {/* Change Summary */}
      <div className="grid grid-cols-2 gap-3">
        {/* Target Change */}
        <div className="p-3 rounded-lg bg-background border">
          <div className="flex items-center gap-2 text-sm">
            {targetChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : targetChange < 0 ? (
              <TrendingDown className="h-4 w-4 text-amber-500" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">Target</span>
          </div>
          <div
            className={cn(
              'text-lg font-medium mt-1',
              targetChange > 0 && 'text-emerald-600',
              targetChange < 0 && 'text-amber-600'
            )}
          >
            {targetChange > 0 ? '+' : ''}
            {targetChange} {before.unit}
            {targetChangePercent !== 0 && (
              <span className="text-xs text-muted-foreground ml-1">
                ({targetChangePercent > 0 ? '+' : ''}
                {targetChangePercent}%)
              </span>
            )}
          </div>
        </div>

        {/* Duration Change */}
        <div className="p-3 rounded-lg bg-background border">
          <div className="flex items-center gap-2 text-sm">
            {durationChange > 0 ? (
              <TrendingUp className="h-4 w-4 text-blue-500" />
            ) : durationChange < 0 ? (
              <TrendingDown className="h-4 w-4 text-orange-500" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-muted-foreground">Duration</span>
          </div>
          <div
            className={cn(
              'text-lg font-medium mt-1',
              durationChange > 0 && 'text-blue-600',
              durationChange < 0 && 'text-orange-600'
            )}
          >
            {durationChange > 0 ? '+' : ''}
            {durationChange} weeks
          </div>
        </div>
      </div>

      {/* Weekly Target Changes */}
      {weeklyChanges.length > 0 && (
        <div>
          <h4 className="text-sm font-medium mb-2">Updated Weekly Targets</h4>
          <div className="max-h-[150px] overflow-y-auto rounded-lg border divide-y text-sm">
            {weeklyChanges.slice(0, 6).map((change) => (
              <div
                key={change.week}
                className="flex items-center justify-between px-3 py-2"
              >
                <span className="text-muted-foreground">Week {change.week}</span>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground line-through">
                    {Math.round(change.before * 10) / 10}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="font-medium">
                    {Math.round(change.after * 10) / 10}
                  </span>
                  <span
                    className={cn(
                      'text-xs',
                      change.change > 0 ? 'text-emerald-600' : 'text-amber-600'
                    )}
                  >
                    ({change.change > 0 ? '+' : ''}
                    {Math.round(change.change * 10) / 10})
                  </span>
                </div>
              </div>
            ))}
            {weeklyChanges.length > 6 && (
              <div className="px-3 py-2 text-center text-xs text-muted-foreground">
                ... and {weeklyChanges.length - 6} more weeks
              </div>
            )}
          </div>
        </div>
      )}

      {/* Warning for significant changes */}
      {hasSignificantChanges && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-sm">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>
            This is a significant change. Make sure it aligns with your goals and abilities.
          </p>
        </div>
      )}

      {/* Motivational message */}
      <p className="text-center text-sm text-muted-foreground italic">
        "It's okay to adjust! Progress is not always linear. 🌱"
      </p>
    </div>
  )
}

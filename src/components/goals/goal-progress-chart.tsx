'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Sprout, Leaf, TreeDeciduous, Flower2, Sparkles } from 'lucide-react'
import type { GoalStatistics } from '@/lib/actions/goals'

interface GoalProgressChartProps {
  stats: GoalStatistics
  className?: string
  showPlantStages?: boolean
}

// Map growth percentage to plant stage
function getPlantStage(progress: number): { icon: typeof Sprout; label: string; color: string } {
  if (progress >= 100) return { icon: TreeDeciduous, label: 'Mature', color: 'text-green-500' }
  if (progress >= 75) return { icon: Flower2, label: 'Blooming', color: 'text-pink-500' }
  if (progress >= 50) return { icon: Leaf, label: 'Growing', color: 'text-emerald-500' }
  if (progress >= 25) return { icon: Sprout, label: 'Sprout', color: 'text-lime-500' }
  return { icon: Sprout, label: 'Seed', color: 'text-amber-500' }
}

export function GoalProgressChart({
  stats,
  className,
  showPlantStages = true,
}: GoalProgressChartProps) {
  const { goal, logs, currentWeek } = stats

  // Build weekly data for chart
  const weeklyData = useMemo(() => {
    const weeklyTargets = (goal.weekly_targets as number[]) || []
    const weeks: Array<{
      week: number
      target: number
      actual: number
      hit: boolean
      isCurrent: boolean
      dateRange: string
    }> = []

    const startDate = new Date(goal.started_at)

    for (let w = 1; w <= Math.min(currentWeek + 2, weeklyTargets.length); w++) {
      const weekStart = new Date(startDate)
      weekStart.setDate(weekStart.getDate() + (w - 1) * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      // Get logs for this week
      const weekLogs = logs.filter((log) => {
        const logDate = new Date(log.logged_at)
        return logDate >= weekStart && logDate <= weekEnd
      })

      let actual = 0
      if (goal.goal_mode === 'total_progress') {
        actual = weekLogs.reduce((sum, log) => sum + Number(log.value), 0)
      } else {
        actual = weekLogs.length > 0 ? Math.max(...weekLogs.map((l) => Number(l.value))) : 0
      }

      const target = weeklyTargets[w - 1] || goal.target_value
      const isCurrent = w === currentWeek

      // Format date range
      const formatDate = (d: Date) => {
        const month = d.toLocaleDateString('en-US', { month: 'short' })
        const day = d.getDate().toString().padStart(2, '0')
        return `${month} ${day}`
      }
      const dateRange = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`

      weeks.push({
        week: w,
        target: Math.round(target),
        actual: Math.round(actual * 10) / 10,
        hit: w <= currentWeek && actual >= target,
        isCurrent,
        dateRange,
      })
    }

    return weeks
  }, [goal, logs, currentWeek])

  // Find max value for chart scaling
  const maxValue = useMemo(() => {
    const allValues = weeklyData.flatMap((w) => [w.actual, w.target])
    return Math.max(...allValues, 1)
  }, [weeklyData])

  // Calculate plant stages for Y-axis
  const plantStages = useMemo(() => {
    if (!showPlantStages) return []

    const stages = [
      { percent: 100, stage: getPlantStage(100) },
      { percent: 75, stage: getPlantStage(75) },
      { percent: 50, stage: getPlantStage(50) },
      { percent: 25, stage: getPlantStage(25) },
    ]

    return stages.map(({ percent, stage }) => ({
      value: (maxValue * percent) / 100,
      ...stage,
    }))
  }, [maxValue, showPlantStages])

  return (
    <div className={cn('space-y-4', className)}>
      {/* Chart Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <span className="font-medium text-sm">Growth Journey</span>
        </div>
        <div className="text-xs text-muted-foreground">
          Week {currentWeek} of {(goal.weekly_targets as number[])?.length || goal.duration_weeks}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative">
        {/* Y-Axis Labels (Plant Stages) */}
        {showPlantStages && (
          <div className="absolute left-0 top-0 bottom-0 w-8 flex flex-col justify-between py-2 text-[10px] text-muted-foreground">
            {plantStages.map(({ value, icon: Icon, color }, i) => (
              <div key={i} className={cn('flex items-center gap-0.5', color)}>
                <Icon className="h-3 w-3" />
              </div>
            ))}
            <div className="h-3" /> {/* Bottom spacer */}
          </div>
        )}

        {/* Chart Area */}
        <div className={cn('space-y-2', showPlantStages && 'ml-8')}>
          {weeklyData.map((week) => (
            <div
              key={week.week}
              className={cn(
                'relative rounded-lg p-2 transition-all duration-300',
                week.isCurrent && 'bg-primary/5 ring-2 ring-primary/20 animate-pulse-slow'
              )}
            >
              {/* Week Label */}
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className={cn(
                  'font-medium',
                  week.isCurrent ? 'text-primary' : 'text-muted-foreground'
                )}>
                  {week.isCurrent ? 'This Week' : `Week ${week.week}`}
                </span>
                <span className="text-muted-foreground">
                  {week.actual} / {week.target} {goal.unit}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-5 bg-muted/50 rounded-full overflow-hidden shadow-inner">
                {/* Target marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-gray-400/60 z-10"
                  style={{ left: `${Math.min((week.target / maxValue) * 100, 100)}%` }}
                />

                {/* Actual progress bar */}
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700 ease-out',
                    week.isCurrent
                      ? 'bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400'
                      : week.hit
                        ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                        : week.week <= currentWeek
                          ? 'bg-gradient-to-r from-amber-400 to-orange-400'
                          : 'bg-gradient-to-r from-gray-300 to-gray-400'
                  )}
                  style={{ width: `${Math.min((week.actual / maxValue) * 100, 100)}%` }}
                >
                  {/* Shine effect for current week */}
                  {week.isCurrent && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
                  )}
                </div>

                {/* Hit indicator */}
                {week.hit && week.week <= currentWeek && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <span className="text-[10px] text-white font-medium drop-shadow">
                      {week.week === currentWeek ? '' : ''}
                    </span>
                  </div>
                )}
              </div>

              {/* Date Range (subtle) */}
              <div className="text-[10px] text-muted-foreground mt-1">
                {week.dateRange}
              </div>

              {/* Current week glow */}
              {week.isCurrent && (
                <div className="absolute -inset-px rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 -z-10" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 text-[10px] text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-r from-green-400 to-emerald-500" />
          <span>Target Hit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-r from-amber-400 to-orange-400" />
          <span>Below Target</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gradient-to-r from-blue-400 to-cyan-400" />
          <span>Current</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-0.5 h-3 bg-gray-400" />
          <span>Target</span>
        </div>
      </div>
    </div>
  )
}

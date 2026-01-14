'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Target,
  Calendar,
  BarChart3,
  CheckCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { GoalStatistics } from '@/lib/actions/goals'

interface GoalStatsProps {
  stats: GoalStatistics
  className?: string
}

export function GoalStats({ stats, className }: GoalStatsProps) {
  const { goal, logs, currentWeek, weeklyTarget, overallProgress, isOnTrack, weeklyTrend } = stats

  // Group logs by week for the chart
  const weeklyData = useMemo(() => {
    const weeklyTargets = goal.weekly_targets as number[] || []
    const weeks: { week: number; actual: number; target: number }[] = []

    for (let w = 1; w <= Math.min(currentWeek, weeklyTargets.length); w++) {
      const startDate = new Date(goal.started_at)
      startDate.setDate(startDate.getDate() + (w - 1) * 7)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 7)

      const weekLogs = logs.filter((log) => {
        const logDate = new Date(log.logged_at)
        return logDate >= startDate && logDate < endDate
      })

      let actual = 0
      if (goal.goal_mode === 'total_progress') {
        actual = weekLogs.reduce((sum, log) => sum + Number(log.value), 0)
      } else {
        actual = weekLogs.length > 0 ? Math.max(...weekLogs.map((l) => Number(l.value))) : 0
      }

      weeks.push({
        week: w,
        actual,
        target: weeklyTargets[w - 1] || 0,
      })
    }

    return weeks
  }, [goal, logs, currentWeek])

  // Find max value for chart scaling
  const maxValue = useMemo(() => {
    const allValues = weeklyData.flatMap((w) => [w.actual, w.target])
    return Math.max(...allValues, 1)
  }, [weeklyData])

  const TrendIcon =
    weeklyTrend === 'up' ? TrendingUp : weeklyTrend === 'down' ? TrendingDown : Minus
  const trendColor =
    weeklyTrend === 'up'
      ? 'text-green-500'
      : weeklyTrend === 'down'
      ? 'text-red-500'
      : 'text-gray-500'

  return (
    <div className={cn('space-y-4', className)}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Target className="h-4 w-4" />
              Overall Progress
            </div>
            <div className="text-2xl font-bold mt-1">{Math.round(overallProgress)}%</div>
            <div className="text-xs text-muted-foreground">
              {Number(goal.current_value).toFixed(1)} / {goal.target_value} {goal.unit}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Calendar className="h-4 w-4" />
              Week {currentWeek}
            </div>
            <div className="text-2xl font-bold mt-1">{weeklyTarget.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">This week's target</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Personal Records
            </div>
            <div className="text-2xl font-bold mt-1">{stats.personalRecords}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Weeks Completed
            </div>
            <div className="text-2xl font-bold mt-1">{stats.weeksCompleted}</div>
            <div className="text-xs text-muted-foreground">Target met</div>
          </CardContent>
        </Card>
      </div>

      {/* Status */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-3 h-3 rounded-full',
                  isOnTrack ? 'bg-green-500' : 'bg-amber-500'
                )}
              />
              <span className="font-medium">
                {isOnTrack ? 'On Track' : 'Behind Schedule'}
              </span>
            </div>
            <div className={cn('flex items-center gap-1', trendColor)}>
              <TrendIcon className="h-4 w-4" />
              <span className="text-sm capitalize">{weeklyTrend} trend</span>
            </div>
          </div>
          {stats.predictedCompletion && (
            <div className="mt-2 text-sm text-muted-foreground">
              Predicted completion:{' '}
              <span className="font-medium">
                {stats.predictedCompletion.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Weekly Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {weeklyData.map((week) => (
              <div key={week.week} className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Week {week.week}</span>
                  <span>
                    {week.actual.toFixed(1)} / {week.target.toFixed(1)} {goal.unit}
                  </span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden relative">
                  {/* Target line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
                    style={{ left: `${(week.target / maxValue) * 100}%` }}
                  />
                  {/* Actual bar */}
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      week.actual >= week.target ? 'bg-green-500' : 'bg-blue-400'
                    )}
                    style={{ width: `${(week.actual / maxValue) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-400" />
              <span>Actual</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-green-500" />
              <span>Target met</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-0.5 h-3 bg-gray-400" />
              <span>Target</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {logs.slice(-5).reverse().map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {Number(log.value).toFixed(1)} {goal.unit}
                      </span>
                      {log.is_personal_record && (
                        <Trophy className="h-3 w-3 text-yellow-500" />
                      )}
                      {log.exceeded_target && !log.is_personal_record && (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      )}
                    </div>
                    {log.notes && (
                      <p className="text-xs text-muted-foreground">{log.notes}</p>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(log.logged_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

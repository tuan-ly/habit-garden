'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { Check, Circle, ArrowRight, Calendar, Sparkles } from 'lucide-react'
import type { GoalStatistics } from '@/lib/actions/goals'
import { GoalWeekCard } from './goal-week-card'

interface GoalTimelineProps {
  stats: GoalStatistics
  className?: string
  showAll?: boolean
  maxVisible?: number
}

export function GoalTimeline({
  stats,
  className,
  showAll = false,
  maxVisible = 8,
}: GoalTimelineProps) {
  const { goal, logs, currentWeek } = stats

  // Build timeline data
  const timelineData = useMemo(() => {
    const weeklyTargets = (goal.weekly_targets as number[]) || []
    const startDate = new Date(goal.started_at)

    const weeks: Array<{
      week: number
      target: number
      actual: number | null
      hit: boolean | null
      status: 'completed' | 'current' | 'upcoming'
      dateRange: string
      startDate: Date
      endDate: Date
    }> = []

    for (let w = 1; w <= weeklyTargets.length; w++) {
      const weekStart = new Date(startDate)
      weekStart.setDate(weekStart.getDate() + (w - 1) * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)

      // Get logs for this week
      const weekLogs = logs.filter((log) => {
        const logDate = new Date(log.logged_at)
        return logDate >= weekStart && logDate <= weekEnd
      })

      let actual: number | null = null
      if (w <= currentWeek) {
        if (goal.goal_mode === 'total_progress') {
          actual = weekLogs.reduce((sum, log) => sum + Number(log.value), 0)
        } else {
          actual = weekLogs.length > 0 ? Math.max(...weekLogs.map((l) => Number(l.value))) : 0
        }
      }

      const target = Math.round(weeklyTargets[w - 1] || goal.target_value)
      const hit = actual !== null ? actual >= target : null

      // Determine status
      let status: 'completed' | 'current' | 'upcoming'
      if (w < currentWeek) {
        status = 'completed'
      } else if (w === currentWeek) {
        status = 'current'
      } else {
        status = 'upcoming'
      }

      // Format date range (Goal Master style)
      const formatDate = (d: Date) => {
        const month = d.toLocaleDateString('en-US', { month: 'short' })
        const day = d.getDate().toString().padStart(2, '0')
        return `${month} ${day}`
      }
      const dateRange = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`

      weeks.push({
        week: w,
        target,
        actual,
        hit,
        status,
        dateRange,
        startDate: weekStart,
        endDate: weekEnd,
      })
    }

    return weeks
  }, [goal, logs, currentWeek])

  // Split into sections
  const completedWeeks = timelineData.filter((w) => w.status === 'completed')
  const currentWeekData = timelineData.find((w) => w.status === 'current')
  const upcomingWeeks = timelineData.filter((w) => w.status === 'upcoming')

  // Limit visible weeks if not showing all
  const visibleCompleted = showAll
    ? completedWeeks
    : completedWeeks.slice(-Math.floor(maxVisible / 2))
  const visibleUpcoming = showAll
    ? upcomingWeeks
    : upcomingWeeks.slice(0, Math.floor(maxVisible / 2))

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-sm">Progression Timeline</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {completedWeeks.filter((w) => w.hit).length}/{completedWeeks.length} weeks hit
        </span>
      </div>

      {/* Completed Section */}
      {completedWeeks.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            <div className="h-px flex-1 bg-border" />
            <span>Completed</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {!showAll && completedWeeks.length > visibleCompleted.length && (
            <div className="text-center text-xs text-muted-foreground py-1">
              ... {completedWeeks.length - visibleCompleted.length} earlier weeks
            </div>
          )}

          <div className="space-y-1.5">
            {visibleCompleted.map((week) => (
              <TimelineRow
                key={week.week}
                week={week}
                unit={goal.unit}
                status="completed"
              />
            ))}
          </div>
        </div>
      )}

      {/* Current Week Section */}
      {currentWeekData && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            <div className="h-px flex-1 bg-primary/30" />
            <span className="text-primary font-medium flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Current Week
            </span>
            <div className="h-px flex-1 bg-primary/30" />
          </div>

          <GoalWeekCard
            week={currentWeekData.week}
            dateRange={currentWeekData.dateRange}
            target={currentWeekData.target}
            actual={currentWeekData.actual || 0}
            unit={goal.unit}
            isCurrent
          />
        </div>
      )}

      {/* Upcoming Section */}
      {upcomingWeeks.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            <div className="h-px flex-1 bg-border" />
            <span>Upcoming</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-1.5 opacity-60">
            {visibleUpcoming.map((week) => (
              <TimelineRow
                key={week.week}
                week={week}
                unit={goal.unit}
                status="upcoming"
              />
            ))}
          </div>

          {!showAll && upcomingWeeks.length > visibleUpcoming.length && (
            <div className="text-center text-xs text-muted-foreground py-1">
              ... {upcomingWeeks.length - visibleUpcoming.length} more weeks
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Timeline row component (Goal Master style)
function TimelineRow({
  week,
  unit,
  status,
}: {
  week: {
    week: number
    target: number
    actual: number | null
    hit: boolean | null
    dateRange: string
  }
  unit: string
  status: 'completed' | 'current' | 'upcoming'
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all',
        status === 'completed' && week.hit && 'bg-green-50 dark:bg-green-950/20',
        status === 'completed' && !week.hit && 'bg-amber-50 dark:bg-amber-950/20',
        status === 'upcoming' && 'bg-muted/30'
      )}
    >
      {/* Status Icon */}
      <div className="flex-shrink-0">
        {status === 'completed' && week.hit && (
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <Check className="h-3 w-3 text-white" />
          </div>
        )}
        {status === 'completed' && !week.hit && (
          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
            <Circle className="h-3 w-3 text-white" />
          </div>
        )}
        {status === 'upcoming' && (
          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
            <Circle className="h-3 w-3 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Date Range */}
      <div className="flex-shrink-0 w-28 text-xs text-muted-foreground">
        {week.dateRange}
      </div>

      {/* Separator */}
      <div className="flex items-center text-muted-foreground">
        <span className="text-xs">:</span>
        <ArrowRight className="h-3 w-3 mx-1" />
      </div>

      {/* Target */}
      <div className={cn(
        'font-mono font-medium',
        status === 'completed' && week.hit && 'text-green-600 dark:text-green-400',
        status === 'completed' && !week.hit && 'text-amber-600 dark:text-amber-400',
        status === 'upcoming' && 'text-muted-foreground'
      )}>
        {week.target} {unit}
      </div>

      {/* Actual (for completed weeks) */}
      {status === 'completed' && week.actual !== null && (
        <>
          <div className="flex-1" />
          <div className={cn(
            'text-xs',
            week.hit ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'
          )}>
            {week.actual} {unit}
          </div>
        </>
      )}
    </div>
  )
}

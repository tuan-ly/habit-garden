'use client'

/**
 * Rhythm View - Gentle alternative to streak display
 *
 * Shows dots for each day, celebrating consistency
 * without harsh "streak broken" messaging
 */

import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface RhythmViewProps {
  /** Array of dates with activity (YYYY-MM-DD format) */
  activityDates: string[]
  /** Array of rest day dates (YYYY-MM-DD format) */
  restDates?: string[]
  /** Number of days to show (default 14) */
  days?: number
  /** Show week labels */
  showWeekLabels?: boolean
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show legend */
  showLegend?: boolean
}

export function RhythmView({
  activityDates,
  restDates = [],
  days = 14,
  showWeekLabels = false,
  size = 'md',
  showLegend = false,
}: RhythmViewProps) {
  // Generate array of dates for the last N days
  const dateArray = Array.from({ length: days }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (days - 1 - i))
    return date.toISOString().split('T')[0]
  })

  const activitySet = new Set(activityDates)
  const restSet = new Set(restDates)

  // Size classes
  const dotSize = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  }[size]

  const gap = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2',
  }[size]

  return (
    <div className="space-y-2">
      <TooltipProvider delayDuration={200}>
        <div className={cn('flex flex-wrap', gap)}>
          {dateArray.map((date, i) => {
            const hasActivity = activitySet.has(date)
            const isRestDay = restSet.has(date)
            const isToday = date === new Date().toISOString().split('T')[0]

            const dateObj = new Date(date)
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' })
            const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

            // Determine dot style
            let dotStyle = 'bg-slate-700' // Empty
            let tooltipText = 'No activity'

            if (hasActivity) {
              dotStyle = 'bg-emerald-500'
              tooltipText = 'Active'
            } else if (isRestDay) {
              dotStyle = 'bg-blue-500'
              tooltipText = 'Rest day'
            }

            return (
              <Tooltip key={date}>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      dotSize,
                      'rounded-full transition-all',
                      dotStyle,
                      isToday && 'ring-2 ring-white/30 ring-offset-1 ring-offset-slate-900',
                      !hasActivity && !isRestDay && 'opacity-40',
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  <div className="text-center">
                    <div className="font-medium">{dayName}</div>
                    <div className="text-slate-400">{dateLabel}</div>
                    <div className={cn(
                      'mt-1',
                      hasActivity && 'text-emerald-400',
                      isRestDay && 'text-blue-400',
                      !hasActivity && !isRestDay && 'text-slate-500',
                    )}>
                      {tooltipText}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      </TooltipProvider>

      {showLegend && (
        <div className="flex items-center gap-4 text-[10px] text-slate-500">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Active</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Rest</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-slate-700 opacity-40" />
            <span>Missed</span>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Compact rhythm stats display
 */
interface RhythmStatsProps {
  daysThisWeek: number
  daysThisMonth: number
  consistencyPercentage: number
  className?: string
}

export function RhythmStats({
  daysThisWeek,
  daysThisMonth,
  consistencyPercentage,
  className,
}: RhythmStatsProps) {
  return (
    <div className={cn('flex items-center gap-4 text-sm', className)}>
      <div className="text-center">
        <div className="text-lg font-bold text-emerald-500">{daysThisWeek}</div>
        <div className="text-[10px] text-slate-500 uppercase">This Week</div>
      </div>
      <div className="h-8 w-px bg-slate-700" />
      <div className="text-center">
        <div className="text-lg font-bold text-blue-500">{daysThisMonth}</div>
        <div className="text-[10px] text-slate-500 uppercase">This Month</div>
      </div>
      <div className="h-8 w-px bg-slate-700" />
      <div className="text-center">
        <div className="text-lg font-bold text-purple-500">{consistencyPercentage}%</div>
        <div className="text-[10px] text-slate-500 uppercase">Consistency</div>
      </div>
    </div>
  )
}

/**
 * Week-based rhythm calendar (GitHub style)
 */
interface WeeklyRhythmProps {
  activityDates: string[]
  restDates?: string[]
  weeks?: number
}

export function WeeklyRhythm({
  activityDates,
  restDates = [],
  weeks = 12,
}: WeeklyRhythmProps) {
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - (weeks * 7 - 1))

  // Align to Sunday
  startDate.setDate(startDate.getDate() - startDate.getDay())

  const activitySet = new Set(activityDates)
  const restSet = new Set(restDates)

  // Generate week columns
  const weekColumns: string[][] = []
  const currentDate = new Date(startDate)

  while (currentDate <= today) {
    const week: string[] = []
    for (let i = 0; i < 7; i++) {
      if (currentDate <= today) {
        week.push(currentDate.toISOString().split('T')[0])
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    weekColumns.push(week)
  }

  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

  return (
    <div className="space-y-2">
      <div className="flex gap-0.5">
        {/* Day labels column */}
        <div className="flex flex-col gap-0.5 mr-1">
          {dayLabels.map((day, i) => (
            <div
              key={i}
              className="w-3 h-3 text-[8px] text-slate-500 flex items-center justify-center"
            >
              {i % 2 === 1 ? day : ''}
            </div>
          ))}
        </div>

        {/* Week columns */}
        {weekColumns.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-0.5">
            {week.map((date, dayIndex) => {
              const hasActivity = activitySet.has(date)
              const isRestDay = restSet.has(date)
              const isToday = date === today.toISOString().split('T')[0]

              let bgColor = 'bg-slate-800'
              if (hasActivity) {
                bgColor = 'bg-emerald-500'
              } else if (isRestDay) {
                bgColor = 'bg-blue-500/70'
              }

              return (
                <div
                  key={date}
                  className={cn(
                    'w-3 h-3 rounded-sm transition-colors',
                    bgColor,
                    isToday && 'ring-1 ring-white/50',
                  )}
                  title={`${date}${hasActivity ? ' - Active' : isRestDay ? ' - Rest' : ''}`}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 text-[9px] text-slate-500">
        <span>Less</span>
        <div className="flex gap-0.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-slate-800" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-900" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-700" />
          <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  )
}

'use client'

import { Fragment } from 'react'
import { cn } from '@/lib/utils'
import { Map } from 'lucide-react'
import type { GoalWithStats } from '@/lib/actions/goals'

interface GoalJourneyMapProps {
  goal: GoalWithStats
  className?: string
}

interface PeriodPillProps {
  periodNumber: number
  target: number
  unit: string
  status: 'past' | 'current' | 'future'
  currentProgress?: number
}

function PeriodPill({ periodNumber, target, unit, status, currentProgress }: PeriodPillProps) {
  if (status === 'current') {
    return (
      <div className="flex flex-col items-center gap-1 flex-shrink-0">
        <div className="px-3 py-2 rounded-xl bg-blue-500/10 border-2 border-blue-400 min-w-[72px] text-center">
          <div className="text-xs font-bold text-blue-600 dark:text-blue-400">
            {Math.round((currentProgress ?? 0) * 10) / 10}/{Math.round(target * 10) / 10}
          </div>
          <div className="text-[9px] text-blue-500/70 truncate max-w-[60px] mx-auto">{unit}</div>
        </div>
        <span className="text-[9px] font-semibold text-blue-500">Now</span>
      </div>
    )
  }

  if (status === 'past') {
    return (
      <div className="flex flex-col items-center gap-0.5 flex-shrink-0 opacity-60">
        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">{periodNumber}</span>
        </div>
        <span className="text-[8px] text-slate-400 dark:text-slate-500">{Math.round(target)}</span>
      </div>
    )
  }

  // future
  return (
    <div className="flex flex-col items-center gap-0.5 flex-shrink-0 opacity-35">
      <div className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 flex items-center justify-center bg-transparent">
        <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">{Math.round(target)}</span>
      </div>
      <span className="text-[8px] text-slate-300 dark:text-slate-600">{unit}</span>
    </div>
  )
}

export function GoalJourneyMap({ goal, className }: GoalJourneyMapProps) {
  const weeklyTargets = (goal.weekly_targets as number[] | null) ?? []
  const totalPeriods = weeklyTargets.length > 0 ? weeklyTargets.length : goal.duration_weeks
  const currentIdx = (goal.periodNumber ?? 1) - 1

  const windowStart = Math.max(0, currentIdx - 3)
  const windowEnd = Math.min(totalPeriods - 1, currentIdx + 4)
  const extraAfter = totalPeriods - 1 - windowEnd

  const periodsToShow = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, i) => {
      const idx = windowStart + i
      const target = weeklyTargets[idx] ?? goal.target_value
      return { index: idx, target }
    }
  )

  const frequencyLabel =
    goal.frequency === 'daily' ? 'days' :
    goal.frequency === 'monthly' ? 'months' :
    'weeks'

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold flex items-center gap-1.5 text-muted-foreground">
          <Map className="h-3.5 w-3.5" />
          Your Journey
        </h4>
        <span className="text-[10px] text-muted-foreground">
          {goal.periodNumber} / {totalPeriods} {frequencyLabel}
        </span>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <div className="flex items-end gap-1 pb-1" style={{ minWidth: 'max-content' }}>
          {windowStart > 0 && (
            <>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center">+{windowStart} earlier</span>
              <div className="w-4 h-px bg-slate-300 dark:bg-slate-600 self-center flex-shrink-0" />
            </>
          )}

          {periodsToShow.map((period, i) => (
            <Fragment key={period.index}>
              {i > 0 && (
                <div className="w-3 h-px bg-slate-300 dark:bg-slate-600 self-center flex-shrink-0" />
              )}
              <PeriodPill
                periodNumber={period.index + 1}
                target={period.target}
                unit={goal.unit}
                status={
                  period.index < currentIdx ? 'past' :
                  period.index === currentIdx ? 'current' :
                  'future'
                }
                currentProgress={period.index === currentIdx ? goal.periodProgress : undefined}
              />
            </Fragment>
          ))}

          {extraAfter > 0 && (
            <>
              <div className="w-3 h-px bg-slate-300 dark:bg-slate-600 self-center flex-shrink-0" />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 self-center">+{extraAfter} more</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

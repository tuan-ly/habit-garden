'use client'

import { cn } from '@/lib/utils'
import { Target, Check, AlertCircle, Sparkles } from 'lucide-react'

interface GoalWeekCardProps {
  week: number
  dateRange: string
  target: number
  actual: number
  unit: string
  isCurrent?: boolean
  className?: string
}

export function GoalWeekCard({
  week,
  dateRange,
  target,
  actual,
  unit,
  isCurrent = false,
  className,
}: GoalWeekCardProps) {
  const progress = target > 0 ? Math.min((actual / target) * 100, 100) : 0
  const isHit = actual >= target
  const remaining = Math.max(0, target - actual)

  // Calculate days remaining in week (assuming Monday start)
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysRemaining = dayOfWeek === 0 ? 0 : 7 - dayOfWeek

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden transition-all duration-300',
        isCurrent
          ? 'bg-gradient-to-br from-primary/10 via-primary/5 to-transparent ring-2 ring-primary/30'
          : 'bg-card border',
        className
      )}
    >
      {/* Glow effect for current */}
      {isCurrent && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 animate-pulse-slow" />
      )}

      <div className="relative p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center',
                isCurrent
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}
            >
              {isCurrent ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                <Target className="h-4 w-4" />
              )}
            </div>
            <div>
              <div className="font-semibold text-sm">
                {isCurrent ? 'This Week' : `Week ${week}`}
              </div>
              <div className="text-[10px] text-muted-foreground">{dateRange}</div>
            </div>
          </div>

          {/* Status badge */}
          <div
            className={cn(
              'px-2 py-1 rounded-full text-[10px] font-medium flex items-center gap-1',
              isHit
                ? 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400'
                : progress >= 50
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
            )}
          >
            {isHit ? (
              <>
                <Check className="h-3 w-3" />
                Complete
              </>
            ) : progress >= 50 ? (
              <>
                <AlertCircle className="h-3 w-3" />
                In Progress
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3" />
                {remaining} {unit} to go
              </>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-mono font-medium">
              {actual.toFixed(1)} / {target} {unit}
            </span>
          </div>

          <div className="relative h-4 bg-muted/50 rounded-full overflow-hidden shadow-inner">
            {/* Progress fill */}
            <div
              className={cn(
                'h-full rounded-full transition-all duration-700 ease-out',
                isHit
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                  : 'bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400'
              )}
              style={{ width: `${progress}%` }}
            >
              {/* Animated shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>

            {/* Percentage text inside bar */}
            {progress > 15 && (
              <div className="absolute inset-0 flex items-center justify-end pr-2">
                <span className="text-[10px] font-medium text-white drop-shadow">
                  {Math.round(progress)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Daily breakdown (for current week) */}
        {isCurrent && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-1">
              <div className="flex gap-0.5">
                {Array.from({ length: 7 }).map((_, i) => {
                  const isPast = i < 7 - daysRemaining
                  return (
                    <div
                      key={i}
                      className={cn(
                        'w-4 h-4 rounded-full flex items-center justify-center text-[8px]',
                        isPast
                          ? 'bg-primary/80 text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                    </div>
                  )
                })}
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {daysRemaining} days left
            </div>
          </div>
        )}

        {/* Target achieved celebration */}
        {isHit && (
          <div className="absolute top-2 right-2">
            <div className="text-lg animate-bounce-subtle">
              {actual >= target * 1.2 ? '!!!' : ''}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

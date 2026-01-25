'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { PlantWithType } from '@/types/database'

interface PlantOverlayBadgeProps {
  plant: PlantWithType
  todayLogCount?: number
  todayValue?: number
  className?: string
  /** Tile size for scaling the badge (default 60) */
  tileSize?: number
}

/**
 * Shows today's activity directly on plant in garden view.
 * - Simple Habits: Shows ✓ if watered, ○ if not
 * - Goal Plants: Shows progress (value / target) with target icon when not reached
 */
function PlantOverlayBadgeComponent({
  plant,
  todayLogCount = 0,
  todayValue,
  className,
  tileSize = 60,
}: PlantOverlayBadgeProps) {
  const hasGoal = !!plant.goal_mode
  const goal = plant.goal
  const isWateredToday = plant.last_watered_at
    ? new Date(plant.last_watered_at).toDateString() === new Date().toDateString()
    : false

  // Scale badge based on tile size (min 0.4 to prevent too small on large plants)
  const badgeScale = Math.max(0.4, (tileSize / 60) * 0.35)

  // Simple habit - show checkbox
  if (!hasGoal) {
    return (
      <div
        className={cn(
          'flex items-center justify-center',
          'rounded-full',
          'backdrop-blur-md shadow-lg',
          'transition-all duration-300',
          isWateredToday
            ? 'bg-emerald-500/90 text-white'
            : 'bg-slate-800/70 text-slate-400 opacity-80',
          isWateredToday && 'animate-in zoom-in-50 duration-300',
          className
        )}
        style={{
          width: 18 * badgeScale,
          height: 18 * badgeScale,
        }}
      >
        {isWateredToday ? (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            style={{ width: 10 * badgeScale, height: 10 * badgeScale }}
          >
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          <span
            className="rounded-full border-2 border-current"
            style={{ width: 8 * badgeScale, height: 8 * badgeScale }}
          />
        )}
      </div>
    )
  }

  // Goal plant - show progress vs target
  const currentWeekTarget = Math.round(goal?.current_week_target || 0)
  const displayValue = todayValue ?? 0
  const hasReachedTarget = currentWeekTarget > 0 && displayValue >= currentWeekTarget
  const trackingMetric = goal?.tracking_metric || 'total'

  // Determine what value to show based on tracking metric
  const getDisplayLabel = () => {
    if (todayLogCount === 0) return '0'
    if (trackingMetric === 'max') {
      // For max: show best value today
      return `${displayValue}`
    }
    // For total/min/avg: show accumulated value
    return `${displayValue}`
  }

  // No logs today - show target icon to encourage logging
  if (todayLogCount === 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-0.5',
          'rounded-full',
          'bg-amber-500/80 backdrop-blur-md',
          'text-white font-medium',
          'shadow-lg shadow-amber-500/30',
          'animate-pulse',
          className
        )}
        style={{
          padding: `${2 * badgeScale}px ${6 * badgeScale}px`,
          fontSize: 10 * badgeScale,
        }}
      >
        <span>🎯</span>
        <span>{currentWeekTarget > 0 ? currentWeekTarget : '?'}</span>
      </div>
    )
  }

  // Has logs today - show progress
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-0.5',
        'rounded-full',
        'backdrop-blur-md',
        'font-bold',
        'shadow-lg',
        'animate-in zoom-in-75 duration-300',
        hasReachedTarget
          ? 'bg-emerald-500/90 text-white shadow-emerald-500/30'
          : 'bg-blue-500/90 text-white shadow-blue-500/30',
        className
      )}
      style={{
        padding: `${2 * badgeScale}px ${6 * badgeScale}px`,
        fontSize: 9 * badgeScale,
      }}
    >
      {hasReachedTarget ? (
        <>
          <span>✓</span>
          <span>{getDisplayLabel()}</span>
        </>
      ) : (
        <>
          <span>{getDisplayLabel()}</span>
          <span className="opacity-70">/</span>
          <span className="opacity-70">{currentWeekTarget}</span>
        </>
      )}
    </div>
  )
}

export const PlantOverlayBadge = memo(PlantOverlayBadgeComponent)

/**
 * Compact badge showing just a dot indicator for the list view.
 */
export function PlantStatusDot({
  plant,
  className,
}: {
  plant: PlantWithType
  className?: string
}) {
  const isWateredToday = plant.last_watered_at
    ? new Date(plant.last_watered_at).toDateString() === new Date().toDateString()
    : false

  const isThirsty = plant.current_moisture < 30 && plant.status !== 'dead'

  return (
    <span
      className={cn(
        'inline-block w-2 h-2 rounded-full',
        isWateredToday
          ? 'bg-emerald-500'
          : isThirsty
            ? 'bg-red-500 animate-pulse'
            : 'bg-slate-400',
        className
      )}
    />
  )
}

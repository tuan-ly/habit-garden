'use client'

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
 * - Goal Plants: Shows action count (💧×3) or today's value (📖 45p)
 */
export function PlantOverlayBadge({
  plant,
  todayLogCount = 0,
  todayValue,
  className,
  tileSize = 60,
}: PlantOverlayBadgeProps) {
  const hasGoal = !!plant.goal_mode
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

  // Goal plant - show log count or value
  if (todayLogCount === 0) {
    // No logs today - show empty state
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-0.5',
          'rounded-full',
          'bg-slate-800/70 backdrop-blur-md',
          'text-slate-400 font-medium',
          'shadow-lg',
          className
        )}
        style={{
          padding: `${2 * badgeScale}px ${6 * badgeScale}px`,
          fontSize: 10 * badgeScale,
        }}
      >
        <span className="opacity-60">💧</span>
        <span>0</span>
      </div>
    )
  }

  // Has logs today
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-0.5',
        'rounded-full',
        'bg-emerald-500/90 backdrop-blur-md',
        'text-white font-bold',
        'shadow-lg shadow-emerald-500/30',
        'animate-in zoom-in-75 duration-300',
        className
      )}
      style={{
        padding: `${2 * badgeScale}px ${6 * badgeScale}px`,
        fontSize: 10 * badgeScale,
      }}
    >
      <span>💧</span>
      {todayLogCount > 9 ? (
        <span>9+</span>
      ) : todayValue !== undefined ? (
        <span>{todayValue}</span>
      ) : (
        <span>×{todayLogCount}</span>
      )}
    </div>
  )
}

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

'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import type { PlantPeriodStats } from '@/lib/actions/plants'

interface StatsBadgeProps {
  stats: PlantPeriodStats
  className?: string
  /** Tile size for scaling the badge (default 60) */
  tileSize?: number
}

/**
 * Badge showing period stats for a plant in stats garden view.
 * - Simple Habits: Shows watering count (💧×5)
 * - Goal Plants: Shows total value or log count
 */
function StatsBadgeComponent({
  stats,
  className,
  tileSize = 60,
}: StatsBadgeProps) {
  const hasGoal = stats.has_goal
  const wateringCount = stats.watering_count
  const goalStats = stats.goal_stats

  // Scale badge based on tile size
  const badgeScale = Math.max(0.4, (tileSize / 60) * 0.35)

  // No activity in period
  if (wateringCount === 0 && (!goalStats || goalStats.count === 0)) {
    return null
  }

  // Goal plant with logs
  if (hasGoal && goalStats && goalStats.count > 0) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-0.5',
          'rounded-full',
          'bg-violet-500/90 backdrop-blur-md',
          'text-white font-bold',
          'shadow-lg shadow-violet-500/30',
          className
        )}
        style={{
          padding: `${2 * badgeScale}px ${6 * badgeScale}px`,
          fontSize: 10 * badgeScale,
        }}
      >
        <span>📊</span>
        <span>{goalStats.total}{stats.goal_unit ? ` ${stats.goal_unit}` : ''}</span>
      </div>
    )
  }

  // Simple habit with waterings
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-0.5',
        'rounded-full',
        'bg-cyan-500/90 backdrop-blur-md',
        'text-white font-bold',
        'shadow-lg shadow-cyan-500/30',
        className
      )}
      style={{
        padding: `${2 * badgeScale}px ${6 * badgeScale}px`,
        fontSize: 10 * badgeScale,
      }}
    >
      <span>💧</span>
      <span>×{wateringCount}</span>
    </div>
  )
}

export const StatsBadge = memo(StatsBadgeComponent)

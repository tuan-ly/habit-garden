'use client'

import { memo } from 'react'
import { cn, isToday } from '@/lib/utils'
import { formatGoalValue, getRemainingGoalValue } from '@/lib/goal-progress'
import type { PlantWithType } from '@/types/database'
import type { VirtualPlant } from '@/lib/habit-plant-mapping'

interface PlantOverlayBadgeProps {
  plant: PlantWithType | VirtualPlant
  className?: string
  /** Tile size for scaling the badge (default 60) */
  tileSize?: number
}

/**
 * In-world status marker shown at the base of plants in the garden view.
 * Art Bible v2.0 compliance:
 *  - No Tailwind UI pills / backdrop-blur
 *  - Palette limited to cream #FBF5E6, warm earth #A08060/#7C5E48, muted sage
 *  - Small, grounded, feels like part of the world (not app UI overlaid)
 */
function PlantOverlayBadgeComponent({
  plant,
  className,
  tileSize = 60,
}: PlantOverlayBadgeProps) {
  // Virtual plants don't show badges yet (Phase 2 will add habit-specific badges)
  if ('type' in plant && plant.type === 'habit') {
    return null
  }

  const hasGoal = !!(plant as PlantWithType).goal_mode
  const goal = (plant as PlantWithType).goal
  const isWateredToday = isToday((plant as PlantWithType).last_watered_at)

  // Scale marker based on tile size - markers are ~30% smaller than old pills
  const scale = Math.max(0.3, (tileSize / 60) * 0.25)

  // Simple habit - tiny drop (watered) or ring (not watered), sitting on grass
  if (!hasGoal) {
    return (
      <div
        className={cn('flex items-center justify-center transition-all duration-300', className)}
        style={{ width: 18 * scale * 2, height: 14 * scale * 2 }}
      >
        {isWateredToday ? (
          // Watered: soft cream water droplet, grounded (Art Bible cream + muted blue tint)
          <svg
            viewBox="0 0 24 24"
            fill="none"
            style={{
              width: 14 * scale * 2,
              height: 14 * scale * 2,
              filter: 'drop-shadow(0 1px 1px rgba(124,94,72,0.25))',
            }}
          >
            <path
              d="M12 3 C7 10 6 14 6 16 a6 6 0 0 0 12 0 C18 14 17 10 12 3 Z"
              fill="#B8D4D8"
              stroke="#7FA5AB"
              strokeWidth="1"
              strokeLinejoin="round"
            />
            <path
              d="M10 11 C8 13 8 15 9 16"
              stroke="#FBF5E6"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />
          </svg>
        ) : (
          // Not watered: thin warm earth ring, subtle
          <span
            className="rounded-full border"
            style={{
              width: 9 * scale * 2,
              height: 9 * scale * 2,
              borderColor: '#8B7355',
              opacity: 0.5,
              borderWidth: '1.5px',
            }}
          />
        )}
      </div>
    )
  }

  // Goal plant - wooden tag SVG grounded below plant
  const currentPeriodTarget = goal?.current_period_target || 0
  const periodProgress = goal?.period_progress || 0
  const remaining = getRemainingGoalValue(periodProgress, currentPeriodTarget)
  const hasReachedTarget = currentPeriodTarget > 0 && remaining === 0
  const label = currentPeriodTarget <= 0
    ? '?'
    : hasReachedTarget
      ? 'Done'
      : `${formatGoalValue(remaining)} ${goal?.unit || ''} left`.trim()

  // Dimensions for wooden tag
  const tagW = (label.length * 5.5 + 14) * scale * 2
  const tagH = 14 * scale * 2
  const fontSize = 8.5 * scale * 2

  // Palette: warm earth tag, cream text, small pin above
  const tagFill = hasReachedTarget ? '#8FAE82' : '#A08060'
  const tagStroke = hasReachedTarget ? '#6B8C5E' : '#7C5E48'

  return (
    <div
      className={cn('flex flex-col items-center', className)}
      style={{ width: tagW, lineHeight: 0 }}
    >
      <svg
        width={tagW}
        height={tagH + 4 * scale * 2}
        viewBox={`0 0 ${tagW} ${tagH + 4 * scale * 2}`}
        style={{ filter: 'drop-shadow(0 1px 1.5px rgba(124,94,72,0.3))', overflow: 'visible' }}
      >
        {/* Small pin/stem cắm xuống đất */}
        <line
          x1={tagW / 2}
          y1={0}
          x2={tagW / 2}
          y2={4 * scale * 2}
          stroke={tagStroke}
          strokeWidth={1.2}
        />
        {/* Rounded wooden tag rectangle */}
        <rect
          x={0.5}
          y={4 * scale * 2}
          width={tagW - 1}
          height={tagH - 1}
          rx={tagH / 2}
          fill={tagFill}
          stroke={tagStroke}
          strokeWidth={1}
        />
        {/* Label */}
        <text
          x={tagW / 2}
          y={4 * scale * 2 + tagH / 2}
          fontSize={fontSize}
          fontFamily="system-ui, sans-serif"
          fontWeight={600}
          fill="#FBF5E6"
          textAnchor="middle"
          dominantBaseline="central"
        >
          {label}
        </text>
      </svg>
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
  const isWateredToday = isToday(plant.last_watered_at)

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

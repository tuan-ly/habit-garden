'use client'

import type { PlantWithType } from '@/types/database'
import { cn } from '@/lib/utils'

interface PlantTooltipProps {
  plant: PlantWithType
  tileKey: string
  gridSize: number
  tileSize: number
}

export function PlantTooltip({
  plant,
  tileKey,
  gridSize,
  tileSize,
}: PlantTooltipProps) {
  const [row, col] = tileKey.split('-').map(Number)

  // Calculate tooltip position
  const xOffset = (col - row) * (tileSize / 2)
  const yOffset = (col + row) * (tileSize / 4)

  // Determine if tooltip should appear above or below
  const showAbove = row + col >= gridSize - 1

  // Moisture color
  const getMoistureColor = (moisture: number) => {
    if (moisture >= 70) return 'text-blue-500'
    if (moisture >= 40) return 'text-yellow-500'
    if (moisture >= 20) return 'text-orange-500'
    return 'text-red-500'
  }

  // Growth color
  const getGrowthColor = (growth: number) => {
    if (growth >= 75) return 'text-green-500'
    if (growth >= 50) return 'text-lime-500'
    if (growth >= 25) return 'text-yellow-500'
    return 'text-orange-500'
  }

  return (
    <div
      className={cn(
        'absolute z-50 pointer-events-none',
        'animate-tooltip-appear'
      )}
      style={{
        left: `calc(50% + ${xOffset}px)`,
        top: showAbove
          ? `calc(50% + ${yOffset}px - ${tileSize}px - 8px)`
          : `calc(50% + ${yOffset}px + ${tileSize / 4}px + 8px)`,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border p-3 min-w-[160px]">
        {/* Plant name and type */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{plant.plant_type.icon}</span>
          <div>
            <div className="font-medium text-sm">{plant.name}</div>
            <div className="text-xs text-muted-foreground">{plant.plant_type.name}</div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-1.5">
          {/* Moisture */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">💧 Moisture</span>
            <span className={cn('font-medium', getMoistureColor(plant.current_moisture))}>
              {plant.current_moisture}%
            </span>
          </div>

          {/* Growth */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">🌱 Growth</span>
            <span className={cn('font-medium', getGrowthColor(plant.growth_percentage))}>
              {plant.growth_percentage}%
            </span>
          </div>

          {/* Streak (if > 0) */}
          {plant.current_streak > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">🔥 Streak</span>
              <span className="font-medium text-orange-500">{plant.current_streak} days</span>
            </div>
          )}
        </div>

        {/* Warning for low moisture */}
        {plant.current_moisture < 30 && plant.status !== 'dead' && (
          <div className="mt-2 text-xs text-red-500 font-medium">
            ⚠️ Needs water!
          </div>
        )}

        {/* Hint to click */}
        <div className="mt-2 pt-2 border-t text-xs text-muted-foreground text-center">
          Click to view details
        </div>
      </div>
    </div>
  )
}

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

  // Calculate tile center position
  const xOffset = (col - row) * (tileSize / 2)
  const yOffset = (col + row) * (tileSize / 4)

  // Determine tooltip side based on position
  // Show on right if on left side of grid, left if on right side
  const showOnRight = col <= row

  // Moisture color
  const getMoistureColor = (moisture: number) => {
    if (moisture >= 70) return 'text-emerald-500'
    if (moisture >= 40) return 'text-amber-500'
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

  // Moisture bar
  const getMoistureBarColor = (moisture: number) => {
    if (moisture >= 70) return 'bg-emerald-500'
    if (moisture >= 40) return 'bg-amber-500'
    if (moisture >= 20) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div
      className={cn(
        'absolute z-[100] pointer-events-none',
        'animate-tooltip-appear'
      )}
      style={{
        // Position to the side of the tile, not on top
        left: showOnRight
          ? `calc(50% + ${xOffset}px + ${tileSize * 0.6}px)`
          : `calc(50% + ${xOffset}px - ${tileSize * 0.6}px)`,
        top: `calc(50% + ${yOffset}px - ${tileSize * 0.5}px)`,
        transform: showOnRight ? 'translateY(-50%)' : 'translate(-100%, -50%)',
      }}
    >
      {/* Arrow pointer */}
      <div
        className={cn(
          'absolute top-1/2 -translate-y-1/2 w-0 h-0',
          showOnRight
            ? 'left-0 -translate-x-full border-r-8 border-r-white dark:border-r-slate-800 border-y-6 border-y-transparent'
            : 'right-0 translate-x-full border-l-8 border-l-white dark:border-l-slate-800 border-y-6 border-y-transparent'
        )}
      />

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 min-w-[180px] backdrop-blur-sm">
        {/* Plant name and type - compact header */}
        <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">
          <span className="text-2xl drop-shadow-sm">{plant.plant_type.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-slate-800 dark:text-slate-100 truncate">
              {plant.name}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {plant.plant_type.name}
            </div>
          </div>
        </div>

        {/* Stats - compact layout */}
        <div className="space-y-2">
          {/* Moisture with mini bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span className="text-blue-400">💧</span> Moisture
              </span>
              <span className={cn('font-semibold', getMoistureColor(plant.current_moisture))}>
                {plant.current_moisture}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', getMoistureBarColor(plant.current_moisture))}
                style={{ width: `${plant.current_moisture}%` }}
              />
            </div>
          </div>

          {/* Growth with mini bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span className="text-green-400">🌱</span> Growth
              </span>
              <span className={cn('font-semibold', getGrowthColor(plant.growth_percentage))}>
                {plant.growth_percentage}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                style={{ width: `${plant.growth_percentage}%` }}
              />
            </div>
          </div>

          {/* Streak (if > 0) - inline */}
          {plant.current_streak > 0 && (
            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <span className="text-orange-400">🔥</span> Streak
              </span>
              <span className="font-semibold text-orange-500">{plant.current_streak} days</span>
            </div>
          )}
        </div>

        {/* Warning for low moisture */}
        {plant.current_moisture < 30 && plant.status !== 'dead' && (
          <div className="mt-2 py-1.5 px-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-1">
            <span>⚠️</span> Needs water!
          </div>
        )}

        {/* Hint to click - subtle */}
        <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 text-[10px] text-slate-400 dark:text-slate-500 text-center uppercase tracking-wide">
          Click to view details
        </div>
      </div>
    </div>
  )
}

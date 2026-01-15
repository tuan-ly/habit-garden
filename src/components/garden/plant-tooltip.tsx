'use client'

import type { PlantWithType } from '@/types/database'
import { cn } from '@/lib/utils'

interface PlantTooltipProps {
  plant: PlantWithType
}

// Simple mini tooltip that shows essential info only
// This is displayed as a small badge near the cursor, not blocking the garden
export function PlantTooltip({ plant }: PlantTooltipProps) {
  // Moisture color
  const getMoistureColor = (moisture: number) => {
    if (moisture >= 70) return 'text-emerald-500'
    if (moisture >= 40) return 'text-amber-500'
    if (moisture >= 20) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-lg shadow-lg border border-slate-200/50 dark:border-slate-700/50">
      <span className="text-lg">{plant.plant_type.icon}</span>
      <div className="flex items-center gap-3 text-xs">
        <span className="font-medium text-slate-700 dark:text-slate-200 max-w-20 truncate">
          {plant.name}
        </span>
        <span className={cn('font-semibold', getMoistureColor(plant.current_moisture))}>
          💧{plant.current_moisture}%
        </span>
        <span className="font-semibold text-green-600 dark:text-green-400">
          🌱{Math.round(plant.growth_percentage)}%
        </span>
        {plant.current_moisture < 30 && plant.status !== 'dead' && (
          <span className="text-red-500 animate-pulse">⚠️</span>
        )}
      </div>
    </div>
  )
}

// Floating card - shows details when hovering a plant
interface PlantInfoBarProps {
  plant: PlantWithType | null
}

// Get gradient based on plant type
function getPlantGradient(plantTypeId: string): string {
  const gradients: Record<string, string> = {
    'cactus': 'from-emerald-500 to-green-600',
    'rose': 'from-pink-500 to-rose-600',
    'bonsai': 'from-green-600 to-emerald-700',
    'bamboo': 'from-lime-500 to-green-600',
    'lotus': 'from-pink-400 to-fuchsia-500',
    'cherry-blossom': 'from-pink-300 to-rose-400',
    'money-tree': 'from-yellow-500 to-amber-600',
    'fruit-tree': 'from-orange-400 to-red-500',
  }
  // Try to match by id containing the key
  for (const [key, value] of Object.entries(gradients)) {
    if (plantTypeId.toLowerCase().includes(key)) {
      return value
    }
  }
  return 'from-green-500 to-emerald-600'
}

export function PlantInfoBar({ plant }: PlantInfoBarProps) {
  // Fixed height container to prevent layout shift
  const containerHeight = 80

  if (!plant) {
    return (
      <div className="flex justify-center items-center mt-3" style={{ height: containerHeight }}>
        <div className="px-6 py-3 bg-slate-900/90 backdrop-blur-md rounded-2xl text-sm text-slate-300 border-2 border-slate-700/50 shadow-xl">
          <span className="opacity-80 flex items-center gap-2">
            <span className="text-lg">✨</span>
            <span>Hover a plant to see info</span>
            <span className="text-slate-500">•</span>
            <span>Click to open details</span>
          </span>
        </div>
      </div>
    )
  }

  const gradient = getPlantGradient(plant.plant_type.id)
  const moisturePercent = plant.current_moisture
  const growthPercent = Math.round(plant.growth_percentage)
  const isThirsty = moisturePercent < 30 && plant.status !== 'dead'

  return (
    <div className="flex justify-center items-center mt-3" style={{ height: containerHeight }}>
      <div className={cn(
        "relative overflow-hidden rounded-2xl shadow-2xl",
        "bg-slate-900/95 border-2 border-slate-700/50",
        "animate-in fade-in zoom-in-95 duration-200"
      )}>
        {/* Gradient accent bar */}
        <div className={cn("h-1 bg-linear-to-r", gradient)} />

        <div className="flex items-center gap-5 px-5 py-3">
          {/* Plant icon with glow */}
          <div className="relative">
            <div className={cn(
              "absolute inset-0 blur-xl opacity-50 bg-linear-to-r",
              gradient
            )} />
            <span className="relative text-4xl drop-shadow-lg">{plant.plant_type.icon}</span>
          </div>

          {/* Plant name */}
          <div className="min-w-0">
            <div className="font-bold text-white text-lg leading-tight">
              {plant.name}
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {plant.plant_type.name}
            </div>
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-slate-700" />

          {/* Stats */}
          <div className="flex items-center gap-4">
            {/* Moisture */}
            <div className="text-center">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">💧</span>
                <span className={cn(
                  "text-xl font-bold tabular-nums",
                  moisturePercent >= 70 ? 'text-emerald-400' :
                  moisturePercent >= 40 ? 'text-amber-400' :
                  moisturePercent >= 20 ? 'text-orange-400' : 'text-red-400'
                )}>
                  {moisturePercent}%
                </span>
              </div>
              <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    moisturePercent >= 70 ? 'bg-emerald-500' :
                    moisturePercent >= 40 ? 'bg-amber-500' :
                    moisturePercent >= 20 ? 'bg-orange-500' : 'bg-red-500'
                  )}
                  style={{ width: `${moisturePercent}%` }}
                />
              </div>
            </div>

            {/* Growth */}
            <div className="text-center">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-lg">🌱</span>
                <span className="text-xl font-bold tabular-nums text-green-400">
                  {growthPercent}%
                </span>
              </div>
              <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-green-400 to-emerald-500 rounded-full transition-all"
                  style={{ width: `${growthPercent}%` }}
                />
              </div>
            </div>

            {/* Streak */}
            {plant.current_streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-900/50 rounded-xl border border-orange-500/30">
                <span className="text-base">🔥</span>
                <span className="font-bold text-orange-400">{plant.current_streak}</span>
              </div>
            )}
          </div>

          {/* Warning badge */}
          {isThirsty && (
            <>
              <div className="w-px h-10 bg-slate-700" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/50 rounded-xl border border-red-500/30 animate-pulse">
                <span>⚠️</span>
                <span className="text-sm font-bold text-red-400">Thirsty!</span>
              </div>
            </>
          )}

          {/* Click hint */}
          <div className="w-px h-10 bg-slate-700" />
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
            <span>Click</span>
            <span className="text-slate-400">→</span>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import type { PlantWithType } from '@/types/database'
import { cn } from '@/lib/utils'
import { Droplets, Flame, Leaf, MousePointer2 } from 'lucide-react'

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

// Floating tooltip - shows details when hovering a plant
// Positioned as fixed element above the garden area
interface PlantInfoBarProps {
  plant: PlantWithType | null
}

export function PlantInfoBar({ plant }: PlantInfoBarProps) {
  // No plant hovered — render nothing (avoid placeholder-looking UI)
  if (!plant) {
    return null
  }

  const moisturePercent = plant.current_moisture
  const growthPercent = Math.round(plant.growth_percentage)
  const isThirsty = moisturePercent < 30 && plant.status !== 'dead'

  return (
    <div className="pointer-events-none absolute left-1/2 top-16 z-20 -translate-x-1/2 px-4">
      <div className="animate-in fade-in zoom-in-95 overflow-hidden rounded-[1.5rem] border border-white/70 bg-[#fffaf0]/92 shadow-[0_18px_50px_rgba(64,82,47,0.18)] backdrop-blur-xl duration-200">
        <div className="flex items-center gap-4 px-4 py-3 text-[#355239]">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-[#dbe5cd] bg-[#edf3df] shadow-inner">
            <span className="text-3xl drop-shadow-sm">{plant.plant_type.icon}</span>
          </div>

          {/* Plant name */}
          <div className="min-w-0">
            <div className="max-w-36 truncate text-base font-bold leading-tight">
              {plant.name}
            </div>
            <div className="mt-0.5 text-xs font-medium text-[#71806c]">
              {plant.plant_type.name}
            </div>
          </div>

          <div className="h-9 w-px bg-[#d9dfce]" />

          {/* Stats */}
          <div className="flex items-center gap-3">
            <div className="min-w-20">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Droplets className="size-4 text-[#4b91a0]" aria-hidden="true" />
                <span className={cn(
                  "text-sm font-bold tabular-nums",
                  moisturePercent >= 70 ? 'text-[#3d7b72]' :
                  moisturePercent >= 40 ? 'text-[#9a742d]' :
                  moisturePercent >= 20 ? 'text-[#ae693b]' : 'text-[#a85448]'
                )}>
                  {moisturePercent}%
                </span>
              </div>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#dfe7d6]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    moisturePercent >= 70 ? 'bg-[#66a092]' :
                    moisturePercent >= 40 ? 'bg-[#d1a64c]' :
                    moisturePercent >= 20 ? 'bg-[#d98a52]' : 'bg-[#c86d61]'
                  )}
                  style={{ width: `${moisturePercent}%` }}
                />
              </div>
            </div>

            <div className="min-w-20">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Leaf className="size-4 text-[#70915b]" aria-hidden="true" />
                <span className="text-sm font-bold tabular-nums text-[#557744]">
                  {growthPercent}%
                </span>
              </div>
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#dfe7d6]">
                <div
                  className="h-full rounded-full bg-[#86a96e] transition-all"
                  style={{ width: `${growthPercent}%` }}
                />
              </div>
            </div>

            {plant.current_streak > 0 && (
              <div className="flex items-center gap-1.5 rounded-full border border-[#ecd9b8] bg-[#fbedd4] px-2.5 py-1.5">
                <Flame className="size-3.5 text-[#b86b37]" aria-hidden="true" />
                <span className="text-sm font-bold text-[#94532f]">{plant.current_streak}</span>
              </div>
            )}
          </div>

          {/* Warning badge */}
          {isThirsty && (
            <div className="rounded-full border border-[#e8c6b9] bg-[#fae4d8] px-2.5 py-1.5 text-xs font-semibold text-[#985848]">
              Cần chăm
            </div>
          )}

          <div className="h-9 w-px bg-[#d9dfce]" />
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#71806c]">
            <MousePointer2 className="size-3.5" aria-hidden="true" />
            <span>Chạm để xem</span>
          </div>
        </div>
      </div>
    </div>
  )
}

'use client'

import type { PlantWithType } from '@/types/database'
import { cn } from '@/lib/utils'
import { AlertTriangle, Droplets, Flame, Sprout } from 'lucide-react'

interface PlantTooltipProps {
  plant: PlantWithType
}

function getMoistureColor(moisture: number) {
  if (moisture >= 70) return 'text-leaf'
  if (moisture >= 40) return 'text-honey'
  if (moisture >= 20) return 'text-[#B7793A]'
  return 'text-bloom'
}

function getPlantGradient(plantTypeId: string): string {
  const gradients: Record<string, string> = {
    cactus: 'from-leaf to-canopy',
    rose: 'from-bloom to-[#C96B88]',
    bonsai: 'from-canopy to-leaf',
    bamboo: 'from-sage to-leaf',
    lotus: 'from-bloom to-[#D18AA2]',
    'cherry-blossom': 'from-bloom to-[#D18AA2]',
    'fruit-tree': 'from-honey to-[#D7893A]',
  }

  for (const [key, value] of Object.entries(gradients)) {
    if (plantTypeId.toLowerCase().includes(key)) {
      return value
    }
  }

  return 'from-leaf to-canopy'
}

export function PlantTooltip({ plant }: PlantTooltipProps) {
  const isThirsty = plant.current_moisture < 30 && plant.status !== 'dead'

  return (
    <div className="garden-chrome flex items-center gap-2 px-2.5 py-1.5 rounded-lg">
      <span className="text-lg">{plant.plant_type.icon}</span>
      <div className="flex items-center gap-3 text-xs">
        <span className="font-medium text-canopy max-w-20 truncate">
          {plant.name}
        </span>
        <span className={cn('inline-flex items-center gap-1 font-semibold', getMoistureColor(plant.current_moisture))}>
          <Droplets className="h-3 w-3" />
          {plant.current_moisture}%
        </span>
        <span className="inline-flex items-center gap-1 font-semibold text-leaf">
          <Sprout className="h-3 w-3" />
          {Math.round(plant.growth_percentage)}%
        </span>
        {isThirsty && <AlertTriangle className="h-3.5 w-3.5 text-bloom animate-pulse" />}
      </div>
    </div>
  )
}

interface PlantInfoBarProps {
  plant: PlantWithType | null
}

export function PlantInfoBar({ plant }: PlantInfoBarProps) {
  if (!plant) {
    return null
  }

  const gradient = getPlantGradient(plant.plant_type.id)
  const moisturePercent = plant.current_moisture
  const growthPercent = Math.round(plant.growth_percentage)
  const isThirsty = moisturePercent < 30 && plant.status !== 'dead'

  return (
    <div className="absolute left-1/2 -translate-x-1/2 top-16 z-20 pointer-events-none">
      <div
        className={cn(
          'garden-chrome relative overflow-hidden rounded-2xl border-2 border-cream/70 shadow-2xl',
          'animate-in fade-in zoom-in-95 duration-200'
        )}
      >
        <div className={cn('h-1 bg-linear-to-r', gradient)} />

        <div className="flex items-center gap-5 px-5 py-3">
          <div className="relative">
            <div className={cn('absolute inset-0 blur-xl opacity-35 bg-linear-to-r', gradient)} />
            <span className="relative text-4xl drop-shadow-lg">{plant.plant_type.icon}</span>
          </div>

          <div className="min-w-0">
            <div className="font-bold text-canopy text-lg leading-tight">
              {plant.name}
            </div>
            <div className="text-xs text-canopy/55 font-medium">
              {plant.plant_type.name}
            </div>
          </div>

          <div className="w-px h-10 bg-canopy/10" />

          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1.5 mb-1">
                <Droplets className="h-4 w-4 text-moisture" />
                <span className={cn('text-xl font-bold tabular-nums', getMoistureColor(moisturePercent))}>
                  {moisturePercent}%
                </span>
              </div>
              <div className="w-16 h-2 bg-canopy/10 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    moisturePercent >= 70
                      ? 'bg-leaf'
                      : moisturePercent >= 40
                        ? 'bg-honey'
                        : moisturePercent >= 20
                          ? 'bg-[#D7893A]'
                          : 'bg-bloom'
                  )}
                  style={{ width: `${moisturePercent}%` }}
                />
              </div>
            </div>

            <div className="text-center">
              <div className="flex items-center gap-1.5 mb-1">
                <Sprout className="h-4 w-4 text-leaf" />
                <span className="text-xl font-bold tabular-nums text-leaf">
                  {growthPercent}%
                </span>
              </div>
              <div className="w-16 h-2 bg-canopy/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-linear-to-r from-leaf to-canopy rounded-full transition-all"
                  style={{ width: `${growthPercent}%` }}
                />
              </div>
            </div>

            {plant.current_streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-honey/15 rounded-xl border border-honey/35">
                <Flame className="h-4 w-4 text-honey" />
                <span className="font-bold text-canopy">{plant.current_streak}</span>
              </div>
            )}
          </div>

          {isThirsty && (
            <>
              <div className="w-px h-10 bg-canopy/10" />
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-bloom/15 rounded-xl border border-bloom/35 animate-pulse">
                <AlertTriangle className="h-4 w-4 text-bloom" />
                <span className="text-sm font-bold text-canopy">Thirsty!</span>
              </div>
            </>
          )}

          <div className="w-px h-10 bg-canopy/10" />
          <div className="text-xs text-canopy/45 font-medium flex items-center gap-1">
            <span>Click</span>
            <span className="text-canopy/35">-&gt;</span>
          </div>
        </div>
      </div>
    </div>
  )
}

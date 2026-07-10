'use client'

import { memo } from 'react'
import { PlantVisual } from '@/components/plants/plant-visual'
import type { PlantWithType, WeatherType } from '@/types/database'
import { cn } from '@/lib/utils'
import { getPlantSizeScale } from '@/lib/utils/grid-positioning'

export type FocusState = 'normal' | 'highlight' | 'dim' | 'urgent'

interface IsometricPlantProps {
  plant: PlantWithType
  weather?: WeatherType | null
  showWateringEffect?: boolean
  scale?: number
  className?: string
  /** Focus mode visual state */
  focusState?: FocusState
  hideStatusIndicators?: boolean
  priority?: boolean
}

// Map growth percentage to a visual scale (base scale)
function getGrowthScale(growthPercentage: number): number {
  if (growthPercentage < 10) return 0.72 // Seed
  if (growthPercentage < 25) return 0.84 // Sprout
  if (growthPercentage < 50) return 0.96 // Early growing
  if (growthPercentage < 75) return 1.08 // Mid growing
  if (growthPercentage < 100) return 1.14 // Late growing/blooming
  return 1.2 // Mature
}

function IsometricPlantComponent({
  plant,
  weather,
  showWateringEffect = false,
  scale = 1,
  className,
  focusState,
  hideStatusIndicators = false,
  priority = false,
}: IsometricPlantProps) {
  // Base scale from growth stage
  const growthScale = getGrowthScale(plant.growth_percentage)

  // Multi-cell size multiplier (1x1→1.0x, 2x2→1.8x, 3x3→2.5x, etc.)
  const gridSize = plant.grid_size || 1
  const gridSizeScale = getPlantSizeScale(gridSize)

  // Combine all scale factors
  const finalScale = scale * growthScale * gridSizeScale

  // Focus state visual classes
  const focusClasses = cn(
    // Highlight without animating transform so tile scale and camera scale stay intact.
    focusState === 'highlight' && 'drop-shadow-[0_0_14px_rgba(246,235,167,0.72)]',
    // Dim: keep the garden legible while giving the selected plant the stage.
    focusState === 'dim' && 'opacity-35 saturate-50',
    // Urgent: red ring + bounce
    focusState === 'urgent' && 'animate-bounce-subtle'
  )

  return (
    <div
      className={cn(
        'relative transition-all duration-300 ease-out',
        focusClasses,
        className
      )}
      style={{
        // Scale the whole container from bottom center
        transform: `scale(${finalScale}) translateY(-1px)`,
        transformOrigin: 'bottom center',
      }}
    >
      {/* Urgent glow ring */}
      {focusState === 'urgent' && (
        <div className="absolute inset-0 -m-2 rounded-full bg-red-500/20 animate-ping pointer-events-none" />
      )}

      {/* Highlight glow */}
      {focusState === 'highlight' && (
        <div className="absolute inset-0 -m-1 animate-pulse rounded-full bg-amber-400/30 blur-md pointer-events-none" />
      )}

      <PlantVisual
        plant={plant}
        size="xl"
        weather={weather}
        showWateringEffect={showWateringEffect}
        alignBottom
        hideStatusIndicators={hideStatusIndicators}
        priority={priority}
      />

      {/* Growth Blocked Indicator */}
      {plant.growth_blocked && (
        <div
          className="absolute -top-12 left-1/2 -translate-x-1/2 z-20 animate-bounce pointer-events-none"
        >
          <div className="bg-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border border-rose-400 whitespace-nowrap flex items-center gap-1">
            <span>⚠️</span> Needs Space!
          </div>
        </div>
      )}

      {/* Urgent indicator badge */}
      {focusState === 'urgent' && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
          <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg border border-red-400 whitespace-nowrap animate-pulse">
            🔥 Urgent
          </div>
        </div>
      )}
    </div>
  )
}

export const IsometricPlant = memo(IsometricPlantComponent)

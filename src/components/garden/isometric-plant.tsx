'use client'

import { PlantVisual } from '@/components/plants/plant-visual'
import { PlantOverlayBadge } from './plant-overlay-badge'
import type { PlantWithType, WeatherType } from '@/types/database'
import { cn } from '@/lib/utils'
import { getPlantSizeScale } from '@/lib/utils/grid-positioning'

interface IsometricPlantProps {
  plant: PlantWithType
  weather?: WeatherType | null
  showWateringEffect?: boolean
  scale?: number
  className?: string
  /** Today's log count for goal plants */
  todayLogCount?: number
  /** Today's total value for goal plants */
  todayValue?: number
  /** Whether to show the overlay badge */
  showBadge?: boolean
}

// Map growth percentage to a visual scale (base scale)
function getGrowthScale(growthPercentage: number): number {
  if (growthPercentage < 10) return 0.6 // Seed
  if (growthPercentage < 25) return 0.7 // Sprout
  if (growthPercentage < 50) return 0.8 // Early growing
  if (growthPercentage < 75) return 0.9 // Mid growing
  if (growthPercentage < 100) return 0.95 // Late growing/blooming
  return 1.0 // Mature
}

export function IsometricPlant({
  plant,
  weather,
  showWateringEffect = false,
  scale = 1,
  className,
  todayLogCount,
  todayValue,
  showBadge = true,
}: IsometricPlantProps) {
  // Base scale from growth stage
  const growthScale = getGrowthScale(plant.growth_percentage)

  // Multi-cell size multiplier (1x1→1.0x, 2x2→1.8x, 3x3→2.5x, etc.)
  const gridSizeScale = getPlantSizeScale(plant.grid_size || 1)

  // Combine all scale factors
  const finalScale = scale * growthScale * gridSizeScale

  return (
    <div
      className={cn(
        'relative transition-all duration-300 ease-out',
        className
      )}
      style={{
        transform: `translate(0, 12%) scale(${finalScale})`,
        transformOrigin: 'bottom center',
      }}
    >
      <PlantVisual
        plant={plant}
        size="xl"
        weather={weather}
        showWateringEffect={showWateringEffect}
      />

      {/* Overlay badge showing today's activity */}
      {showBadge && (
        <PlantOverlayBadge
          plant={plant}
          todayLogCount={todayLogCount}
          todayValue={todayValue}
        />
      )}
    </div>
  )
}

'use client'

import { PlantVisual } from '@/components/plants/plant-visual'
import type { PlantWithType, WeatherType } from '@/types/database'
import { cn } from '@/lib/utils'

interface IsometricPlantProps {
  plant: PlantWithType
  weather?: WeatherType | null
  showWateringEffect?: boolean
  scale?: number
  className?: string
}

// Map growth percentage to a visual scale
function getPlantScale(growthPercentage: number): number {
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
}: IsometricPlantProps) {
  const growthScale = getPlantScale(plant.growth_percentage)
  const finalScale = scale * growthScale

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        className
      )}
      style={{
        transform: `scale(${finalScale})`,
        transformOrigin: 'bottom center',
      }}
    >
      <PlantVisual
        plant={plant}
        size="md"
        weather={weather}
        showWateringEffect={showWateringEffect}
      />
    </div>
  )
}

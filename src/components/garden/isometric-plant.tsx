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

// Map growth percentage to a visual scale - larger base sizes
function getPlantScale(growthPercentage: number): number {
  if (growthPercentage < 10) return 0.7 // Seed - slightly larger
  if (growthPercentage < 25) return 0.8 // Sprout
  if (growthPercentage < 50) return 0.9 // Early growing
  if (growthPercentage < 75) return 1.0 // Mid growing
  if (growthPercentage < 100) return 1.1 // Late growing/blooming
  return 1.2 // Mature - noticeably larger
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
        'transition-all duration-500 ease-out',
        'hover:scale-110',
        className
      )}
      style={{
        transform: `scale(${finalScale})`,
        transformOrigin: 'bottom center',
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
      }}
    >
      <PlantVisual
        plant={plant}
        size="xl"
        weather={weather}
        showWateringEffect={showWateringEffect}
      />
    </div>
  )
}

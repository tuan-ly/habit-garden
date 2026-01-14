'use client'

import { cn } from '@/lib/utils'
import type { PlantWithType, PlantStatus, WeatherType } from '@/types/database'
import { useEffect, useState, useRef } from 'react'
import { PlantImage, getGrowthStage, type GrowthStage } from './plant-image'

// Re-export growth stages for backwards compatibility
export { getGrowthStage }
export type { GrowthStage }

// Special plant effects mapped to plant type names
const SPECIAL_PLANT_EFFECTS: Record<string, string> = {
  bamboo: 'plant-effect-bamboo',
  sunflower: 'plant-effect-sunflower',
  'cherry blossom': 'plant-effect-cherry',
  cherry: 'plant-effect-cherry',
  cactus: 'plant-effect-cactus',
  lotus: 'plant-effect-lotus',
  rose: 'plant-effect-rose',
  bonsai: 'plant-effect-bonsai',
  'money tree': 'plant-effect-money',
}

// Weather effect classes
const WEATHER_EFFECTS: Record<WeatherType, string> = {
  sunny: 'weather-sunny',
  cloudy: '',
  rainy: 'weather-rainy',
  stormy: 'weather-stormy',
  rainbow: 'weather-rainbow',
}

interface PlantVisualProps {
  plant: PlantWithType
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  showWateringEffect?: boolean
  weather?: WeatherType | null
  className?: string
}

function getSpecialEffectClass(plantTypeName: string): string {
  const normalizedName = plantTypeName.toLowerCase()
  return SPECIAL_PLANT_EFFECTS[normalizedName] || ''
}

// Determine if plant is wilting (low moisture, not dead)
function isWilting(plant: PlantWithType): boolean {
  return plant.status !== 'dead' && plant.current_moisture < 30
}

export function PlantVisual({
  plant,
  size = 'md',
  showWateringEffect = false,
  weather,
  className,
}: PlantVisualProps) {
  const [isWatering, setIsWatering] = useState(false)
  const [showGrowthBurst, setShowGrowthBurst] = useState(false)
  const previousStageRef = useRef<GrowthStage | null>(null)

  // Handle watering animation trigger
  useEffect(() => {
    if (showWateringEffect) {
      setIsWatering(true)
      const timer = setTimeout(() => setIsWatering(false), 800)
      return () => clearTimeout(timer)
    }
  }, [showWateringEffect])

  const growthStage = getGrowthStage(plant.growth_percentage, plant.status)
  const isDead = plant.status === 'dead'
  const wilting = isWilting(plant)

  // Detect growth stage changes for burst animation
  useEffect(() => {
    if (previousStageRef.current && previousStageRef.current !== growthStage && !isDead) {
      setShowGrowthBurst(true)
      const timer = setTimeout(() => setShowGrowthBurst(false), 800)
      return () => clearTimeout(timer)
    }
    previousStageRef.current = growthStage
  }, [growthStage, isDead])

  // Get special effect if applicable (only for non-dead plants)
  const specialEffectClass = !isDead ? getSpecialEffectClass(plant.plant_type.name) : ''

  // Weather effect
  const weatherClass = weather ? WEATHER_EFFECTS[weather] : ''

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* Main plant image with animations */}
      <div
        className={cn(
          'plant-visual inline-flex items-center justify-center transition-transform duration-300',
          specialEffectClass,
          weatherClass,
          wilting && 'plant-wilting',
          showGrowthBurst && 'animate-growth-burst'
        )}
      >
        <PlantImage
          plant={plant}
          size={size}
          showGrowthTransition={showGrowthBurst}
        />
      </div>

      {/* Watering effect overlay */}
      {isWatering && (
        <div className="water-effect absolute inset-0">
          {/* Water drops */}
          <span className="water-drop absolute top-0 left-1/3 text-blue-400">💧</span>
          <span className="water-drop absolute top-0 left-1/2 text-blue-400 delay-100">💧</span>
          <span className="water-drop absolute top-0 left-2/3 text-blue-400 delay-200">💧</span>

          {/* Splash ring */}
          <div className="water-splash-ring absolute bottom-1/4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-400/30" />
        </div>
      )}

      {/* Growth stage indicator (optional visual feedback) */}
      {growthStage === 'blooming' && !isDead && !wilting && (
        <span className="absolute -top-1 -right-1 text-xs sparkle">✨</span>
      )}

      {/* Growth burst effect */}
      {showGrowthBurst && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="absolute w-full h-full rounded-full bg-green-400/20 animate-ping" />
          <span className="absolute text-yellow-400 animate-bounce">✨</span>
        </div>
      )}
    </div>
  )
}


// Sub-component for cherry blossom petals effect
export function CherryBlossomPetals({ active }: { active: boolean }) {
  const [petals, setPetals] = useState<number[]>([])

  useEffect(() => {
    if (!active) return

    const interval = setInterval(() => {
      setPetals((prev) => [...prev.slice(-5), Date.now()])
    }, 2000)

    return () => clearInterval(interval)
  }, [active])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {petals.map((id) => (
        <span
          key={id}
          className="cherry-petal absolute text-pink-300 text-xs"
          style={{
            left: `${Math.random() * 80 + 10}%`,
            top: '0',
          }}
        >
          🌸
        </span>
      ))}
    </div>
  )
}

// XP popup component for showing earned XP
export function XpPopup({ amount, show }: { amount: number; show: boolean }) {
  if (!show || amount <= 0) return null

  return (
    <span className="xp-popup absolute -top-2 left-1/2 -translate-x-1/2 text-xs font-bold text-yellow-500 whitespace-nowrap">
      +{amount} XP
    </span>
  )
}

// Streak fire component
export function StreakFire({ streak, show }: { streak: number; show: boolean }) {
  if (!show || streak <= 0) return null

  return (
    <span className={cn('inline-flex items-center gap-0.5', streak >= 7 && 'streak-fire')}>
      <span className="text-orange-500">🔥</span>
      <span className="text-xs font-medium text-orange-500">{streak}</span>
    </span>
  )
}

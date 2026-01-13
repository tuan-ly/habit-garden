'use client'

import { cn } from '@/lib/utils'
import type { PlantWithType, PlantStatus, WeatherType } from '@/types/database'
import { useEffect, useState } from 'react'

// Growth stage thresholds
const GROWTH_STAGES = {
  seed: { min: 0, max: 10 },
  sprout: { min: 10, max: 25 },
  growing: { min: 25, max: 75 },
  blooming: { min: 75, max: 100 },
  mature: { min: 100, max: Infinity },
} as const

type GrowthStage = keyof typeof GROWTH_STAGES

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
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showWateringEffect?: boolean
  weather?: WeatherType | null
  className?: string
}

function getGrowthStage(growthPercentage: number, status: PlantStatus): GrowthStage {
  if (status === 'mature') return 'mature'
  if (status === 'dead') return 'seed' // Dead plants don't animate growth

  if (growthPercentage < GROWTH_STAGES.seed.max) return 'seed'
  if (growthPercentage < GROWTH_STAGES.sprout.max) return 'sprout'
  if (growthPercentage < GROWTH_STAGES.growing.max) return 'growing'
  if (growthPercentage < GROWTH_STAGES.blooming.max) return 'blooming'
  return 'mature'
}

function getGrowthStageClass(stage: GrowthStage): string {
  const classes: Record<GrowthStage, string> = {
    seed: 'plant-seed',
    sprout: 'plant-sprout',
    growing: 'plant-growing',
    blooming: 'plant-blooming',
    mature: 'plant-mature',
  }
  return classes[stage]
}

function getSpecialEffectClass(plantTypeName: string): string {
  const normalizedName = plantTypeName.toLowerCase()
  return SPECIAL_PLANT_EFFECTS[normalizedName] || ''
}

function getSizeClasses(size: PlantVisualProps['size']) {
  const sizes = {
    sm: 'text-2xl w-8 h-8',
    md: 'text-3xl w-10 h-10',
    lg: 'text-4xl w-12 h-12',
    xl: 'text-5xl w-16 h-16',
  }
  return sizes[size || 'md']
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

  // Determine animation class
  const getAnimationClass = () => {
    if (isDead) return 'plant-dead'
    if (wilting) return 'plant-wilting'
    return getGrowthStageClass(growthStage)
  }

  // Get special effect if applicable (only for non-dead plants)
  const specialEffectClass = !isDead ? getSpecialEffectClass(plant.plant_type.name) : ''

  // Weather effect
  const weatherClass = weather ? WEATHER_EFFECTS[weather] : ''

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      {/* Main plant icon with animations */}
      <span
        className={cn(
          'plant-visual inline-flex items-center justify-center',
          getSizeClasses(size),
          getAnimationClass(),
          specialEffectClass,
          weatherClass,
          showGrowthBurst && 'growth-milestone'
        )}
      >
        {plant.plant_type.icon}
      </span>

      {/* Watering effect overlay */}
      {isWatering && (
        <div className="water-effect">
          {/* Water drops */}
          <span className="water-drop absolute top-0 left-1/3 text-blue-400">💧</span>
          <span className="water-drop absolute top-0 left-1/2 text-blue-400 delay-100">💧</span>
          <span className="water-drop absolute top-0 left-2/3 text-blue-400 delay-200">💧</span>

          {/* Splash ring */}
          <div className="water-splash-ring absolute bottom-1/4 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-blue-400/30" />
        </div>
      )}

      {/* Wilting indicator */}
      {wilting && !isDead && (
        <span className="absolute -top-1 -right-1 text-xs animate-pulse">💦</span>
      )}

      {/* Growth stage indicator (optional visual feedback) */}
      {growthStage === 'blooming' && !isDead && !wilting && (
        <span className="absolute -top-1 -right-1 text-xs sparkle">✨</span>
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

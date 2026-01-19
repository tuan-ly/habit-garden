'use client'

import { cn } from '@/lib/utils'
import type { PlantWithType, PlantStatus, WeatherType } from '@/types/database'
import { useEffect, useState, useRef, useMemo } from 'react'
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

// Plant glow colors based on type
const PLANT_GLOW_COLORS: Record<string, string> = {
  bamboo: 'rgba(34, 197, 94, 0.4)',
  sunflower: 'rgba(251, 191, 36, 0.4)',
  'cherry blossom': 'rgba(244, 114, 182, 0.4)',
  cherry: 'rgba(244, 114, 182, 0.4)',
  cactus: 'rgba(34, 197, 94, 0.3)',
  lotus: 'rgba(139, 92, 246, 0.4)',
  rose: 'rgba(244, 63, 94, 0.4)',
  bonsai: 'rgba(101, 163, 13, 0.4)',
  'money tree': 'rgba(251, 191, 36, 0.5)',
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
  /** If true, hides the "needs water" indicator (plant already watered today) */
  isWateredToday?: boolean
  /** If true, aligns plant to bottom of container (for isometric garden view) */
  alignBottom?: boolean
}

function getSpecialEffectClass(plantTypeName: string): string {
  const normalizedName = plantTypeName.toLowerCase()
  return SPECIAL_PLANT_EFFECTS[normalizedName] || ''
}

function getSizeClasses(size: PlantVisualProps['size'], alignBottom?: boolean) {
  // When alignBottom is true, we don't set fixed height so plant sits at bottom naturally
  const sizes = {
    sm: alignBottom ? 'text-2xl w-10' : 'text-2xl w-10 h-10',
    md: alignBottom ? 'text-4xl w-14' : 'text-4xl w-14 h-14',
    lg: alignBottom ? 'text-5xl w-20' : 'text-5xl w-20 h-20',
    xl: alignBottom ? 'text-6xl w-28' : 'text-6xl w-28 h-28',
    '2xl': alignBottom ? 'text-7xl w-36' : 'text-7xl w-36 h-36',
  }
  return sizes[size || 'md']
}

// Get glow color based on plant type
function getPlantGlowColor(plantTypeName: string): string {
  const normalizedName = plantTypeName.toLowerCase()
  return PLANT_GLOW_COLORS[normalizedName] || 'rgba(34, 197, 94, 0.3)'
}

// Determine if plant is wilting (low moisture, not dead)
function isWilting(plant: PlantWithType): boolean {
  return plant.status !== 'dead' && plant.current_moisture < 30
}

// Determine if plant is thriving (high moisture + good growth)
function isThriving(plant: PlantWithType): boolean {
  return plant.status !== 'dead' && plant.current_moisture >= 70 && plant.growth_percentage >= 25
}

export function PlantVisual({
  plant,
  size = 'md',
  showWateringEffect = false,
  weather,
  className,
  isWateredToday,
  alignBottom = false,
}: PlantVisualProps) {
  // Auto-detect if watered today when not explicitly passed
  const wateredToday = isWateredToday ?? (plant.last_watered_at
    ? new Date(plant.last_watered_at).toDateString() === new Date().toDateString()
    : false)
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
  const thriving = isThriving(plant)

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

  // Independent random shaking for stormy weather
  const [isStormShaking, setIsStormShaking] = useState(false)

  useEffect(() => {
    if (weather !== 'stormy') {
      setIsStormShaking(false)
      return
    }

    let timeoutId: NodeJS.Timeout

    const scheduleShake = () => {
      // Random interval between 5s and 15s to check for shake
      const nextInterval = 5000 + Math.random() * 10000

      timeoutId = setTimeout(() => {
        triggerShake()
        scheduleShake()
      }, nextInterval)
    }

    const triggerShake = () => {
      setIsStormShaking(true)
      // Shake for 1-2 seconds
      setTimeout(() => setIsStormShaking(false), 1000 + Math.random() * 1000)
    }

    // Initial random delay
    scheduleShake()

    return () => clearTimeout(timeoutId)
  }, [weather])

  // Weather effect - exclude stormy from default class as we handle it manually
  const weatherClass = weather && weather !== 'stormy' ? WEATHER_EFFECTS[weather] : ''

  // Glow color for thriving plants
  const glowColor = getPlantGlowColor(plant.plant_type.name)

  return (
    <div className={cn(
      'relative inline-flex justify-center',
      alignBottom ? 'items-end' : 'items-center',
      'plant-container',
      className
    )}>
      {/* Background glow for thriving/mature plants */}
      {(thriving || plant.status === 'mature') && !isDead && (
        <div
          className="absolute inset-0 rounded-full opacity-60 animate-pulse-slow blur-md"
          style={{
            background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
            transform: 'scale(1.5)',
          }}
        />
      )}

      {/* Main plant image with animations */}
      <div
        className={cn(
          'plant-visual inline-flex justify-center transition-transform duration-300 relative z-10',
          alignBottom ? 'items-end' : 'items-center',
          getSizeClasses(size, alignBottom),
          specialEffectClass,
          weatherClass,
          isStormShaking && 'weather-stormy', // Apply shake only when active
          wilting && 'plant-wilting',
          showGrowthBurst && 'animate-growth-burst',
          thriving && 'plant-thriving',
          plant.status === 'mature' && 'plant-mature-glow'
        )}
      >
        <PlantImage
          plant={plant}
          size={size}
          showGrowthTransition={showGrowthBurst}
          alignBottom={alignBottom}
        />
      </div>

      {/* Watering effect overlay */}
      {isWatering && (
        <div className="water-effect absolute inset-0">
          {/* Water drops */}
          <span className="water-drop absolute top-0 left-1/4 text-blue-400 text-lg">💧</span>
          <span className="water-drop absolute top-0 left-1/2 text-blue-400 text-lg delay-100">💧</span>
          <span className="water-drop absolute top-0 left-3/4 text-blue-400 text-lg delay-200">💧</span>

          {/* Splash ring */}
          <div className="water-splash-ring absolute bottom-1/4 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-blue-400/40" />
        </div>
      )}

      {/* Needs water indicator - shows when plant hasn't been watered today */}
      {!wateredToday && !isDead && !isWatering && (
        <div className="needs-water-indicator">
          <div className="relative flex items-center justify-center">
            {/* Watering can icon */}
            <span className="watering-can-anim text-lg">🚿</span>
            {/* Water drops falling */}
            {/* <div className="absolute top-4 left-1/2 -translate-x-1/2 flex gap-1">
              <span className="needs-water-drop text-xs text-blue-400">💧</span>
              <span className="needs-water-drop text-xs text-blue-400">💧</span>
              <span className="needs-water-drop text-xs text-blue-400">💧</span>
            </div> */}
          </div>
        </div>
      )}

      {/* Wilting indicator - more prominent (only shows when critically low) */}
      {wilting && !isDead && (
        <div className="absolute -top-2 -right-2 flex items-center gap-0.5 bg-amber-100 dark:bg-amber-900/50 px-1.5 py-0.5 rounded-full shadow-sm">
          <span className="text-xs">⚠️</span>
          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400">Critical!</span>
        </div>
      )}

      {/* Growth stage indicator - enhanced */}
      {growthStage === 'blooming' && !isDead && !wilting && (
        <div className="absolute -top-1 -right-1 flex">
          <span className="text-sm sparkle">✨</span>
          <span className="text-sm sparkle delay-150">✨</span>
        </div>
      )}

      {/* Mature badge */}
      {plant.status === 'mature' && !isDead && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md">
          MATURE
        </div>
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

'use client'

import { cn } from '@/lib/utils'
import type { PlantWithType, SpecialEffect, SpecialEffectType } from '@/types/database'
import { useEffect, useState, useCallback } from 'react'

// Special effect configurations for different plant types
interface EffectConfig {
  name: string
  description: string
  visualClass: string
  particleEmoji?: string
  particleCount?: number
  glowColor?: string
  animationDuration?: number
}

const EFFECT_CONFIGS: Record<SpecialEffectType, EffectConfig> = {
  delayed_growth: {
    name: 'Delayed Growth',
    description: 'Stores energy, then bursts with rapid growth',
    visualClass: 'plant-effect-bamboo',
    particleEmoji: '🎋',
    glowColor: 'rgba(34, 197, 94, 0.4)',
  },
  buff_others: {
    name: 'Community Spirit',
    description: 'Boosts growth of nearby plants',
    visualClass: 'plant-effect-sunflower',
    particleEmoji: '✨',
    particleCount: 3,
    glowColor: 'rgba(251, 191, 36, 0.4)',
  },
  cycle: {
    name: 'Seasonal Cycle',
    description: 'Blooms and rests in cycles',
    visualClass: 'plant-effect-cherry',
    particleEmoji: '🌸',
    particleCount: 5,
    glowColor: 'rgba(244, 114, 182, 0.4)',
  },
  drought_resistant: {
    name: 'Drought Resistant',
    description: 'Survives longer without water',
    visualClass: 'plant-effect-cactus',
    glowColor: 'rgba(34, 197, 94, 0.3)',
  },
  difficulty_bonus: {
    name: 'Difficulty Master',
    description: 'Rewards harder days with bonus XP',
    visualClass: 'plant-effect-lotus',
    particleEmoji: '💎',
    glowColor: 'rgba(139, 92, 246, 0.4)',
  },
  spawn_children: {
    name: 'Family Tree',
    description: 'Can spawn child plants when mature',
    visualClass: 'plant-effect-money',
    particleEmoji: '🌱',
    particleCount: 2,
    glowColor: 'rgba(34, 197, 94, 0.4)',
  },
  hidden_progress: {
    name: 'Mysterious Growth',
    description: 'Progress hidden until bloom time',
    visualClass: 'plant-effect-rose',
    particleEmoji: '❓',
    glowColor: 'rgba(147, 51, 234, 0.4)',
  },
  immortal_after_mature: {
    name: 'Eternal Bloom',
    description: 'Cannot die once fully mature',
    visualClass: 'plant-effect-bonsai',
    particleEmoji: '♾️',
    glowColor: 'rgba(251, 191, 36, 0.5)',
  },
}

interface SpecialEffectRendererProps {
  effect: SpecialEffect | null
  isActive?: boolean
  className?: string
}

export function SpecialEffectRenderer({
  effect,
  isActive = true,
  className,
}: SpecialEffectRendererProps) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([])

  const config = effect ? EFFECT_CONFIGS[effect.type] : null

  // Generate particles periodically for effects that have them
  useEffect(() => {
    if (!config?.particleEmoji || !isActive) return

    const interval = setInterval(() => {
      const count = config.particleCount || 1
      const newParticles = Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 80 + 10, // 10-90%
        y: Math.random() * 30, // 0-30%
      }))

      setParticles((prev) => [...prev.slice(-(config.particleCount || 3) * 2), ...newParticles])
    }, 3000)

    return () => clearInterval(interval)
  }, [config, isActive])

  // Clean up old particles
  useEffect(() => {
    if (particles.length === 0) return

    const timeout = setTimeout(() => {
      setParticles((prev) => prev.slice(1))
    }, 3000)

    return () => clearTimeout(timeout)
  }, [particles])

  if (!effect || !config) return null

  return (
    <div className={cn('absolute inset-0 pointer-events-none overflow-hidden', className)}>
      {/* Glow effect */}
      {config.glowColor && isActive && (
        <div
          className="absolute inset-0 rounded-full opacity-50 animate-pulse"
          style={{
            background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Floating particles */}
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="float-particle absolute text-sm"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
        >
          {config.particleEmoji}
        </span>
      ))}
    </div>
  )
}

// Cherry Blossom petal fall effect
interface CherryBlossomEffectProps {
  active: boolean
  intensity?: 'low' | 'medium' | 'high'
}

export function CherryBlossomEffect({ active, intensity = 'medium' }: CherryBlossomEffectProps) {
  const [petals, setPetals] = useState<{ id: number; x: number; delay: number; size: number }[]>([])

  const petalCounts = { low: 2, medium: 4, high: 8 }
  const count = petalCounts[intensity]

  useEffect(() => {
    if (!active) {
      setPetals([])
      return
    }

    const interval = setInterval(() => {
      const newPetals = Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        delay: Math.random() * 1000,
        size: Math.random() * 0.5 + 0.5, // 0.5-1x size
      }))
      setPetals((prev) => [...prev.slice(-count * 3), ...newPetals])
    }, 2500)

    return () => clearInterval(interval)
  }, [active, count])

  if (!active) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {petals.map((petal) => (
        <span
          key={petal.id}
          className="cherry-petal absolute text-pink-300"
          style={{
            left: `${petal.x}%`,
            top: '-10px',
            animationDelay: `${petal.delay}ms`,
            fontSize: `${petal.size}rem`,
          }}
        >
          🌸
        </span>
      ))}
    </div>
  )
}

// Sunflower buff aura effect
interface SunflowerAuraProps {
  active: boolean
  buffPercentage?: number
}

export function SunflowerAura({ active, buffPercentage = 10 }: SunflowerAuraProps) {
  if (!active) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Pulsing sun rays */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-24 h-24 rounded-full animate-pulse opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(251, 191, 36, 0.6) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Buff indicator */}
      <div className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
        +{buffPercentage}%
      </div>
    </div>
  )
}

// Lotus water ripple effect
interface LotusRippleProps {
  active: boolean
}

export function LotusRipple({ active }: LotusRippleProps) {
  const [ripples, setRipples] = useState<number[]>([])

  useEffect(() => {
    if (!active) return

    const interval = setInterval(() => {
      setRipples((prev) => [...prev.slice(-2), Date.now()])
    }, 2000)

    return () => clearInterval(interval)
  }, [active])

  if (!active) return null

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {ripples.map((id) => (
        <div
          key={id}
          className="absolute w-8 h-8 rounded-full border-2 border-blue-400/50"
          style={{
            animation: 'lotus-ripple 2s ease-out forwards',
          }}
        />
      ))}
    </div>
  )
}

// Cactus resilience indicator
interface CactusResilienceProps {
  moistureDecayMultiplier: number
  active: boolean
}

export function CactusResilience({ moistureDecayMultiplier, active }: CactusResilienceProps) {
  if (!active) return null

  const savings = Math.round((1 - moistureDecayMultiplier) * 100)

  return (
    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
      🛡️ -{savings}% decay
    </div>
  )
}

// Money tree coin effect
interface MoneyTreeEffectProps {
  active: boolean
  onCoinCollect?: () => void
}

export function MoneyTreeEffect({ active, onCoinCollect }: MoneyTreeEffectProps) {
  const [coins, setCoins] = useState<{ id: number; x: number }[]>([])

  useEffect(() => {
    if (!active) return

    const interval = setInterval(() => {
      setCoins((prev) => [
        ...prev.slice(-3),
        { id: Date.now(), x: Math.random() * 60 + 20 },
      ])
      onCoinCollect?.()
    }, 4000)

    return () => clearInterval(interval)
  }, [active, onCoinCollect])

  if (!active) return null

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {coins.map((coin) => (
        <span
          key={coin.id}
          className="absolute text-yellow-500 float-particle"
          style={{ left: `${coin.x}%`, top: '20%' }}
        >
          🪙
        </span>
      ))}
    </div>
  )
}

// Bonsai zen effect
interface BonsaiZenProps {
  active: boolean
}

export function BonsaiZen({ active }: BonsaiZenProps) {
  if (!active) return null

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className="absolute inset-0 rounded-lg opacity-20"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(34, 197, 94, 0.3) 0%, transparent 60%)',
          animation: 'bonsai-zen 6s ease-in-out infinite',
        }}
      />
    </div>
  )
}

// Rose bloom pulse
interface RoseBloomProps {
  active: boolean
  isHidden?: boolean
}

export function RoseBloom({ active, isHidden }: RoseBloomProps) {
  if (!active) return null

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {isHidden ? (
        <div className="absolute top-0 right-0 text-purple-500 text-lg animate-pulse">❓</div>
      ) : (
        <div
          className="w-16 h-16 rounded-full opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(244, 63, 94, 0.4) 0%, transparent 70%)',
            animation: 'rose-pulse 3s ease-in-out infinite',
          }}
        />
      )}
    </div>
  )
}

// Combined special effects wrapper
interface PlantSpecialEffectsProps {
  plant: PlantWithType
  className?: string
}

export function PlantSpecialEffects({ plant, className }: PlantSpecialEffectsProps) {
  const effect = plant.plant_type.special_effect
  const isMature = plant.status === 'mature'
  const isDead = plant.status === 'dead'

  if (!effect || isDead) return null

  const plantName = plant.plant_type.name.toLowerCase()

  // Render specific effects based on plant type
  return (
    <div className={cn('absolute inset-0 pointer-events-none', className)}>
      {/* Cherry Blossom petals */}
      {(plantName.includes('cherry') || effect.type === 'cycle') && (
        <CherryBlossomEffect active={isMature} intensity={isMature ? 'high' : 'low'} />
      )}

      {/* Sunflower aura */}
      {(plantName.includes('sunflower') || effect.type === 'buff_others') && (
        <SunflowerAura active={true} buffPercentage={effect.buff_percentage} />
      )}

      {/* Lotus ripples */}
      {(plantName.includes('lotus') || effect.type === 'difficulty_bonus') && (
        <LotusRipple active={true} />
      )}

      {/* Cactus resilience */}
      {(plantName.includes('cactus') || effect.type === 'drought_resistant') && (
        <CactusResilience
          active={true}
          moistureDecayMultiplier={effect.decay_multiplier || 0.5}
        />
      )}

      {/* Money tree coins */}
      {(plantName.includes('money') || effect.type === 'spawn_children') && (
        <MoneyTreeEffect active={isMature} />
      )}

      {/* Bonsai zen */}
      {(plantName.includes('bonsai') || effect.type === 'immortal_after_mature') && (
        <BonsaiZen active={isMature} />
      )}

      {/* Rose hidden progress */}
      {(plantName.includes('rose') || effect.type === 'hidden_progress') && (
        <RoseBloom
          active={true}
          isHidden={plant.growth_percentage < (effect.hidden_until || 80)}
        />
      )}

      {/* Generic effect renderer for any effect */}
      <SpecialEffectRenderer effect={effect} isActive={!isDead} />
    </div>
  )
}

// Effect description card for UI
interface EffectDescriptionProps {
  effect: SpecialEffect
  className?: string
}

export function EffectDescription({ effect, className }: EffectDescriptionProps) {
  const config = EFFECT_CONFIGS[effect.type]

  if (!config) return null

  return (
    <div
      className={cn(
        'p-3 rounded-lg border bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{config.particleEmoji || '✨'}</span>
        <span className="font-semibold text-purple-700 dark:text-purple-300">
          {config.name}
        </span>
      </div>
      <p className="text-sm text-purple-600 dark:text-purple-400">{config.description}</p>

      {/* Show specific effect values if present */}
      <div className="mt-2 flex flex-wrap gap-2">
        {effect.buff_percentage && (
          <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full">
            +{effect.buff_percentage}% boost
          </span>
        )}
        {effect.decay_multiplier && (
          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
            {Math.round((1 - effect.decay_multiplier) * 100)}% slower decay
          </span>
        )}
        {effect.cycle_days && (
          <span className="text-xs bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300 px-2 py-0.5 rounded-full">
            {effect.cycle_days} day cycle
          </span>
        )}
        {effect.hard_day_bonus && (
          <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
            +{effect.hard_day_bonus}% on hard days
          </span>
        )}
      </div>
    </div>
  )
}

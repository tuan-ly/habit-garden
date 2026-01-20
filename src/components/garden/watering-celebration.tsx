'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface WateringCelebrationProps {
  /** Whether the celebration is active */
  isActive: boolean
  /** Callback when celebration ends */
  onComplete?: () => void
  /** Position in screen coordinates */
  position?: { x: number; y: number }
  /** XP earned to display */
  xpEarned?: number
  /** Plant name */
  plantName?: string
  /** Plant icon/emoji */
  plantIcon?: string
  /** Streak count */
  streakCount?: number
}

/**
 * Watering celebration effect - Shows a 3-second celebration animation
 * when a plant is watered successfully.
 */
export function WateringCelebration({
  isActive,
  onComplete,
  position,
  xpEarned = 10,
  plantName,
  plantIcon = '🌱',
  streakCount,
}: WateringCelebrationProps) {
  const [phase, setPhase] = useState<'idle' | 'splash' | 'celebrate' | 'fadeout'>('idle')
  const [sparkles, setSparkles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([])
  const [waterDrops, setWaterDrops] = useState<Array<{ id: number; x: number; delay: number }>>([])

  useEffect(() => {
    if (!isActive) {
      setPhase('idle')
      return
    }

    // Generate random sparkles
    const newSparkles = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 200 - 100, // -100 to 100
      y: Math.random() * 200 - 100,
      delay: Math.random() * 0.5,
    }))
    setSparkles(newSparkles)

    // Generate water drops
    const newDrops = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 - 40, // -40 to 40
      delay: Math.random() * 0.3,
    }))
    setWaterDrops(newDrops)

    // Phase 1: Splash (0-0.5s)
    setPhase('splash')

    // Phase 2: Celebrate (0.5s-2.5s)
    const celebrateTimer = setTimeout(() => {
      setPhase('celebrate')
    }, 500)

    // Phase 3: Fadeout (2.5s-3s)
    const fadeoutTimer = setTimeout(() => {
      setPhase('fadeout')
    }, 2500)

    // Complete (3s)
    const completeTimer = setTimeout(() => {
      setPhase('idle')
      onComplete?.()
    }, 3000)

    return () => {
      clearTimeout(celebrateTimer)
      clearTimeout(fadeoutTimer)
      clearTimeout(completeTimer)
    }
  }, [isActive, onComplete])

  if (phase === 'idle') return null

  const centerX = position?.x ?? (typeof window !== 'undefined' ? window.innerWidth / 2 : 200)
  const centerY = position?.y ?? (typeof window !== 'undefined' ? window.innerHeight / 2 : 300)

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {/* Background overlay with radial gradient */}
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-500',
          phase === 'splash' && 'opacity-0',
          phase === 'celebrate' && 'opacity-100',
          phase === 'fadeout' && 'opacity-0'
        )}
        style={{
          background: `radial-gradient(circle at ${centerX}px ${centerY}px, rgba(34, 197, 94, 0.15) 0%, transparent 50%)`,
        }}
      />

      {/* Water splash effect */}
      {phase === 'splash' && (
        <div
          className="absolute"
          style={{ left: centerX, top: centerY, transform: 'translate(-50%, -50%)' }}
        >
          {/* Central splash ring */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-cyan-400/30 animate-water-splash-ring" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center" style={{ animationDelay: '0.1s' }}>
            <div className="w-32 h-32 rounded-full bg-cyan-300/20 animate-water-splash-ring" style={{ animationDelay: '0.15s' }} />
          </div>

          {/* Water droplets flying out */}
          {waterDrops.map((drop) => (
            <div
              key={drop.id}
              className="absolute text-lg animate-water-droplet-fly"
              style={{
                left: 0,
                top: 0,
                '--drop-x': `${drop.x}px`,
                animationDelay: `${drop.delay}s`,
              } as React.CSSProperties}
            >
              💧
            </div>
          ))}
        </div>
      )}

      {/* Celebration phase */}
      {(phase === 'celebrate' || phase === 'fadeout') && (
        <div
          className={cn(
            'absolute transition-all duration-500',
            phase === 'fadeout' && 'opacity-0 scale-90'
          )}
          style={{ left: centerX, top: centerY, transform: 'translate(-50%, -50%)' }}
        >
          {/* Sparkles */}
          {sparkles.map((sparkle) => (
            <div
              key={sparkle.id}
              className="absolute animate-celebration-sparkle"
              style={{
                left: sparkle.x,
                top: sparkle.y,
                animationDelay: `${sparkle.delay}s`,
              }}
            >
              <span className="text-xl">✨</span>
            </div>
          ))}

          {/* Central celebration card */}
          <div className="relative animate-celebration-pop">
            {/* Glow ring */}
            <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 opacity-60 blur-xl animate-pulse" />

            {/* Card */}
            <div className="relative bg-gradient-to-br from-slate-900/95 via-emerald-900/90 to-slate-900/95 backdrop-blur-xl rounded-2xl p-5 border border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
              {/* Plant icon with bounce */}
              <div className="flex justify-center mb-3">
                <div className="text-5xl animate-celebration-bounce">
                  {plantIcon}
                </div>
              </div>

              {/* Watered message */}
              <div className="text-center mb-3">
                <div className="text-emerald-400 font-bold text-lg">
                  💦 Watered!
                </div>
                {plantName && (
                  <div className="text-slate-400 text-sm mt-1">
                    {plantName}
                  </div>
                )}
              </div>

              {/* XP earned with animation */}
              <div className="flex justify-center">
                <div className="px-4 py-2 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 rounded-full border border-amber-500/30">
                  <span className="text-amber-400 font-bold text-xl animate-xp-glow">
                    +{xpEarned} XP
                  </span>
                </div>
              </div>

              {/* Streak info if applicable */}
              {streakCount && streakCount > 1 && (
                <div className="mt-3 flex justify-center">
                  <div className="px-3 py-1 bg-orange-500/20 rounded-full border border-orange-500/30">
                    <span className="text-orange-400 text-sm font-medium">
                      🔥 {streakCount} day streak!
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Floating +XP particles */}
          <div className="absolute -top-8 left-1/2 -translate-x-1/2">
            <div className="text-emerald-400 font-bold text-2xl animate-float-up-fade">
              +{xpEarned}
            </div>
          </div>

          {/* Water droplet trail effect */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="text-cyan-400 text-sm animate-drip-fade"
                style={{ animationDelay: `${i * 0.2}s` }}
              >
                💧
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

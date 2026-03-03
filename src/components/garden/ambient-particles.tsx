'use client'

import { memo, useMemo, useState, useEffect } from 'react'
import type { WeatherType } from '@/types/database'
import type { TimeOfDay } from './themes'

interface AmbientParticlesProps {
  weather?: WeatherType | null
  timeOfDay?: TimeOfDay
  className?: string
}

// Particle types
type ParticleType = 'leaf' | 'pollen' | 'firefly' | 'sparkle' | 'butterfly' | 'dandelion'

interface Particle {
  id: number
  type: ParticleType
  x: number
  y: number
  size: number
  duration: number
  delay: number
  color?: string
}

// Generate particles based on weather and time
function generateParticles(
  weather: WeatherType | null | undefined,
  timeOfDay: TimeOfDay,
  seed: number = 999
): Particle[] {
  const particles: Particle[] = []

  const random = (i: number) => {
    const x = Math.sin(seed + i * 7777) * 10000
    return x - Math.floor(x)
  }

  let id = 0

  // Sunny day: reduced particles for performance
  if (timeOfDay === 'day' && (weather === 'sunny' || weather === 'rainbow' || !weather)) {
    // Butterflies (very rare - reduced from 3 to 1)
    particles.push({
      id: id++,
      type: 'butterfly',
      x: random(10) * 100,
      y: 20 + random(11) * 40,
      size: 14,
      duration: 20,
      delay: random(14) * 10,
      color: '#f8bbd0',
    })

    // Pollen particles (reduced from 15 to 5)
    for (let i = 0; i < 5; i++) {
      particles.push({
        id: id++,
        type: 'pollen',
        x: random(i * 20) * 100,
        y: random(i * 21) * 80,
        size: 3,
        duration: 10 + random(i * 23) * 5,
        delay: random(i * 24) * 8,
      })
    }
  }

  // Cloudy/rainy: falling leaves (reduced from 12 to 4)
  if (weather === 'cloudy' || weather === 'rainy') {
    for (let i = 0; i < 4; i++) {
      particles.push({
        id: id++,
        type: 'leaf',
        x: random(i * 40) * 100,
        y: -10,
        size: 12,
        duration: 8,
        delay: random(i * 43) * 6,
        color: ['#8bc34a', '#689f38', '#ff9800'][Math.floor(random(i * 44) * 3)],
      })
    }
  }

  // Night: fireflies (reduced from 20 to 8)
  if (timeOfDay === 'night') {
    for (let i = 0; i < 8; i++) {
      particles.push({
        id: id++,
        type: 'firefly',
        x: random(i * 50) * 100,
        y: 20 + random(i * 51) * 60,
        size: 4,
        duration: 4,
        delay: random(i * 54) * 5,
      })
    }
  }

  // Rainbow: sparkles (reduced from 20 to 6)
  if (weather === 'rainbow') {
    for (let i = 0; i < 6; i++) {
      particles.push({
        id: id++,
        type: 'sparkle',
        x: random(i * 60) * 100,
        y: random(i * 61) * 70,
        size: 6,
        duration: 3,
        delay: random(i * 64) * 4,
        color: ['#ff5252', '#ffeb3b', '#4caf50', '#2196f3'][Math.floor(random(i * 65) * 4)],
      })
    }
  }

  return particles
}

// Leaf SVG component
function LeafParticle({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C12 2 4 8 4 14C4 18 8 22 12 22C16 22 20 18 20 14C20 8 12 2 12 2Z"
        fill={color}
        opacity="0.8"
      />
      <path
        d="M12 6V18M9 10L12 13M15 10L12 13"
        stroke="rgba(0,0,0,0.2)"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  )
}

// Butterfly SVG component
function ButterflyParticle({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size * 2} height={size} viewBox="0 0 40 20" fill="none" className="animate-butterfly-wing">
      {/* Left wing */}
      <ellipse cx="10" cy="10" rx="9" ry="8" fill={color} opacity="0.85" />
      <ellipse cx="8" cy="10" rx="4" ry="3" fill="rgba(255,255,255,0.4)" />
      {/* Right wing */}
      <ellipse cx="30" cy="10" rx="9" ry="8" fill={color} opacity="0.85" />
      <ellipse cx="32" cy="10" rx="4" ry="3" fill="rgba(255,255,255,0.4)" />
      {/* Body */}
      <ellipse cx="20" cy="10" rx="2" ry="6" fill="#333" />
      {/* Antennae */}
      <path d="M19 5 Q16 2 14 3" stroke="#333" strokeWidth="0.8" fill="none" />
      <path d="M21 5 Q24 2 26 3" stroke="#333" strokeWidth="0.8" fill="none" />
    </svg>
  )
}

// Dandelion seed SVG
function DandelionParticle({ size }: { size: number }) {
  return (
    <svg width={size} height={size * 1.5} viewBox="0 0 20 30" fill="none">
      {/* Seed */}
      <ellipse cx="10" cy="25" rx="2" ry="4" fill="#8d6e63" />
      {/* Fluff */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
        <line
          key={i}
          x1="10"
          y1="10"
          x2={10 + Math.cos((angle * Math.PI) / 180) * 8}
          y2={10 + Math.sin((angle * Math.PI) / 180) * 8}
          stroke="rgba(255,255,255,0.8)"
          strokeWidth="0.5"
        />
      ))}
      <circle cx="10" cy="10" r="3" fill="rgba(255,255,255,0.9)" />
    </svg>
  )
}

// Render particle based on type
function ParticleElement({ particle }: { particle: Particle }) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${particle.x}%`,
    top: `${particle.y}%`,
    animationDuration: `${particle.duration}s`,
    animationDelay: `${particle.delay}s`,
    animationIterationCount: 'infinite',
    pointerEvents: 'none',
  }

  switch (particle.type) {
    case 'leaf':
      return (
        <div
          className="animate-leaf-fall"
          style={style}
        >
          <LeafParticle size={particle.size} color={particle.color || '#8bc34a'} />
        </div>
      )

    case 'butterfly':
      return (
        <div
          className="animate-butterfly-float"
          style={style}
        >
          <ButterflyParticle size={particle.size} color={particle.color || '#f8bbd0'} />
        </div>
      )

    case 'pollen':
      return (
        <div
          className="animate-pollen-drift"
          style={{
            ...style,
            width: particle.size,
            height: particle.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,235,59,0.8) 0%, rgba(255,235,59,0) 70%)',
          }}
        />
      )

    case 'firefly':
      return (
        <div
          className="animate-firefly-glow"
          style={{
            ...style,
            width: particle.size,
            height: particle.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,235,59,1) 0%, rgba(255,235,59,0.5) 30%, rgba(255,235,59,0) 70%)',
            boxShadow: '0 0 10px rgba(255,235,59,0.8), 0 0 20px rgba(255,235,59,0.4)',
          }}
        />
      )

    case 'sparkle':
      return (
        <div
          className="animate-sparkle-twinkle"
          style={style}
        >
          <svg width={particle.size} height={particle.size} viewBox="0 0 24 24">
            <path
              d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z"
              fill={particle.color || '#fff'}
              opacity="0.9"
            />
          </svg>
        </div>
      )

    case 'dandelion':
      return (
        <div
          className="animate-dandelion-float"
          style={style}
        >
          <DandelionParticle size={particle.size} />
        </div>
      )

    default:
      return null
  }
}

export const AmbientParticles = memo(function AmbientParticles({ weather, timeOfDay = 'day', className }: AmbientParticlesProps) {
  // Use state to handle client-only rendering
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const particles = useMemo(
    () => generateParticles(weather, timeOfDay),
    [weather, timeOfDay]
  )

  // Don't render on server to avoid hydration mismatch
  if (!mounted) return null

  // Don't render during stormy weather
  if (weather === 'stormy') return null

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none z-15 ${className || ''}`}
    >
      {particles.map((particle) => (
        <ParticleElement key={particle.id} particle={particle} />
      ))}
    </div>
  )
})

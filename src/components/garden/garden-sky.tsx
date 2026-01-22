'use client'

import { useMemo, useState, useEffect } from 'react'
import type { WeatherType } from '@/types/database'
import { getTimeOfDay, type TimeOfDay } from './themes'

interface GardenSkyProps {
  weather?: WeatherType | null
  className?: string
  /** If true, uses absolute positioning instead of fixed (for contained views like StatsGarden) */
  contained?: boolean
  /** Force a specific time of day (optional) */
  timeOfDay?: TimeOfDay
}

// Enhanced sky gradient colors based on time of day - more vibrant and natural
const SKY_GRADIENTS: Record<TimeOfDay, { stops: Array<{ offset: string; color: string }> }> = {
  day: {
    stops: [
      { offset: '0%', color: '#38bdf8' },    // Bright sky blue at top
      { offset: '25%', color: '#7dd3fc' },   // Lighter blue
      { offset: '50%', color: '#bae6fd' },   // Pale sky
      { offset: '75%', color: '#fef9c3' },   // Warm glow near horizon
      { offset: '100%', color: '#bbf7d0' },  // Soft green at horizon
    ],
  },
  night: {
    stops: [
      { offset: '0%', color: '#0c1222' },    // Deep night blue
      { offset: '30%', color: '#1e293b' },   // Dark slate
      { offset: '60%', color: '#334155' },   // Lighter slate
      { offset: '100%', color: '#475569' },  // Horizon glow
    ],
  },
}

// Weather overlay effects
const WEATHER_OVERLAYS: Record<WeatherType, { color: string; opacity: number }> = {
  sunny: { color: 'rgba(255, 236, 179, 0.12)', opacity: 0.12 },
  cloudy: { color: 'rgba(148, 163, 184, 0.25)', opacity: 0.25 },
  rainy: { color: 'rgba(71, 85, 105, 0.35)', opacity: 0.35 },
  stormy: { color: 'rgba(15, 23, 42, 0.55)', opacity: 0.55 },
  rainbow: { color: 'rgba(252, 211, 77, 0.08)', opacity: 0.08 },
}

// Generate random clouds for dynamic sky
function generateClouds(count: number, seed: number = 123) {
  const clouds: Array<{
    x: number
    y: number
    scale: number
    opacity: number
    speed: number
  }> = []

  const random = (i: number) => {
    const x = Math.sin(seed + i * 7777) * 10000
    // Round to 6 decimal places to avoid SSR/client hydration mismatch
    return Math.round((x - Math.floor(x)) * 1000000) / 1000000
  }

  for (let i = 0; i < count; i++) {
    clouds.push({
      x: random(i * 2) * 120 - 10, // Allow starting off-screen
      y: 5 + random(i * 3) * 20,
      scale: 0.6 + random(i * 4) * 0.6,
      opacity: 0.5 + random(i * 5) * 0.4,
      speed: 60 + random(i * 6) * 80,
    })
  }

  return clouds
}

// Generate stars for night sky
function generateStars(count: number, seed: number = 456) {
  const stars: Array<{
    x: number
    y: number
    size: number
    twinkleDelay: number
    brightness: number
  }> = []

  const random = (i: number) => {
    const x = Math.sin(seed + i * 5555) * 10000
    // Round to 6 decimal places to avoid SSR/client hydration mismatch
    return Math.round((x - Math.floor(x)) * 1000000) / 1000000
  }

  for (let i = 0; i < count; i++) {
    stars.push({
      x: random(i * 2) * 100,
      y: random(i * 3) * 55,
      size: 1 + random(i * 4) * 2.5,
      twinkleDelay: random(i * 5) * 5,
      brightness: 0.3 + random(i * 6) * 0.7,
    })
  }

  return stars
}

export function GardenSky({ weather, className, contained, timeOfDay: forcedTimeOfDay }: GardenSkyProps) {
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay>('day')

  useEffect(() => {
    if (!forcedTimeOfDay) {
      setCurrentTimeOfDay(getTimeOfDay())
      const interval = setInterval(() => setCurrentTimeOfDay(getTimeOfDay()), 60000)
      return () => clearInterval(interval)
    }
  }, [forcedTimeOfDay])

  const timeOfDay = forcedTimeOfDay || currentTimeOfDay
  const skyGradient = useMemo(() => SKY_GRADIENTS[timeOfDay], [timeOfDay])
  const weatherOverlay = weather ? WEATHER_OVERLAYS[weather] : null

  // Generate clouds and stars
  const clouds = useMemo(() => generateClouds(6), [])
  const stars = useMemo(() => generateStars(40), [])

  // Create gradient string
  const gradientStyle = useMemo(() => {
    const stops = skyGradient.stops.map(s => `${s.color} ${s.offset}`).join(', ')
    return `linear-gradient(to bottom, ${stops})`
  }, [skyGradient])

  return (
    <div
      className={`${contained ? 'absolute' : 'fixed'} inset-0 z-0 overflow-hidden ${className || ''}`}
      style={{ background: gradientStyle }}
    >
      {/* Weather overlay */}
      {weatherOverlay && (
        <div
          className="absolute inset-0 transition-colors duration-1000"
          style={{ backgroundColor: weatherOverlay.color }}
        />
      )}

      {/* Sun rays effect for sunny weather */}
      {timeOfDay === 'day' && (weather === 'sunny' || !weather) && (
        <div className="absolute top-0 right-0 w-96 h-96 opacity-30">
          <div
            className="absolute top-16 right-8 w-64 h-64 rounded-full animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(255,236,179,0.8) 0%, rgba(255,236,179,0) 70%)',
            }}
          />
        </div>
      )}

      {/* Dynamic Sun with glow effect */}
      {timeOfDay === 'day' && (
        <div className="absolute top-16 right-6 sm:top-20 sm:right-10">
          {/* Sun glow */}
          <div
            className="absolute -inset-8 rounded-full animate-pulse"
            style={{
              background: weather === 'sunny' || !weather
                ? 'radial-gradient(circle, rgba(251,191,36,0.4) 0%, rgba(251,191,36,0) 70%)'
                : 'radial-gradient(circle, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0) 70%)',
            }}
          />
          {/* Sun icon */}
          <div className={`text-5xl sm:text-6xl drop-shadow-lg ${weather === 'sunny' || !weather ? 'animate-sun-glow' : ''}`}>
            {weather === 'stormy' ? '⛈️' : weather === 'rainy' ? '🌧️' : weather === 'cloudy' ? '⛅' : weather === 'rainbow' ? '🌈' : '☀️'}
          </div>
        </div>
      )}

      {/* Night sky with moon and stars */}
      {timeOfDay === 'night' && (
        <>
          {/* Stars */}
          {stars.map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                width: star.size,
                height: star.size,
                opacity: star.brightness,
                animationDelay: `${star.twinkleDelay}s`,
                animationDuration: `${2 + star.twinkleDelay * 0.5}s`,
              }}
            />
          ))}

          {/* Moon with glow */}
          <div className="absolute top-16 right-6 sm:top-20 sm:right-10">
            <div
              className="absolute -inset-6 rounded-full"
              style={{
                background: 'radial-gradient(circle, rgba(226,232,240,0.3) 0%, rgba(226,232,240,0) 70%)',
              }}
            />
            <div className="text-5xl sm:text-6xl drop-shadow-lg">🌙</div>
          </div>
        </>
      )}

      {/* Animated clouds - improved SVG clouds */}
      {timeOfDay === 'day' && clouds.map((cloud, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{
            left: `${cloud.x}%`,
            top: `${cloud.y}%`,
            transform: `scale(${cloud.scale})`,
            opacity: weather === 'cloudy' || weather === 'rainy' || weather === 'stormy'
              ? cloud.opacity
              : cloud.opacity * 0.5,
            animation: `cloud-drift-enhanced ${cloud.speed}s linear infinite`,
            animationDelay: `${-cloud.speed * (i / clouds.length)}s`,
          }}
        >
          <svg width="120" height="60" viewBox="0 0 120 60" fill="none">
            <ellipse cx="35" cy="40" rx="25" ry="18" fill="white" fillOpacity="0.9" />
            <ellipse cx="60" cy="32" rx="30" ry="22" fill="white" fillOpacity="0.95" />
            <ellipse cx="85" cy="38" rx="22" ry="16" fill="white" fillOpacity="0.85" />
            <ellipse cx="55" cy="45" rx="35" ry="14" fill="white" fillOpacity="0.9" />
          </svg>
        </div>
      ))}

      {/* Extra clouds for overcast weather */}
      {timeOfDay === 'day' && (weather === 'rainy' || weather === 'stormy') && (
        <>
          <div
            className="absolute top-[15%] left-[5%] opacity-60"
            style={{ animation: 'cloud-drift-enhanced 70s linear infinite' }}
          >
            <svg width="180" height="80" viewBox="0 0 180 80" fill="none">
              <ellipse cx="50" cy="50" rx="35" ry="25" fill="#94a3b8" fillOpacity="0.8" />
              <ellipse cx="90" cy="40" rx="45" ry="30" fill="#94a3b8" fillOpacity="0.85" />
              <ellipse cx="130" cy="48" rx="32" ry="22" fill="#94a3b8" fillOpacity="0.75" />
              <ellipse cx="85" cy="58" rx="50" ry="18" fill="#94a3b8" fillOpacity="0.8" />
            </svg>
          </div>
          <div
            className="absolute top-[8%] left-[40%] opacity-50"
            style={{ animation: 'cloud-drift-enhanced 90s linear infinite reverse' }}
          >
            <svg width="160" height="70" viewBox="0 0 160 70" fill="none">
              <ellipse cx="45" cy="45" rx="30" ry="22" fill="#64748b" fillOpacity="0.7" />
              <ellipse cx="80" cy="35" rx="40" ry="28" fill="#64748b" fillOpacity="0.8" />
              <ellipse cx="115" cy="42" rx="28" ry="20" fill="#64748b" fillOpacity="0.7" />
            </svg>
          </div>
        </>
      )}

      {/* Distant mountains/hills silhouette at horizon */}
      <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none">
        <svg
          viewBox="0 0 1200 150"
          preserveAspectRatio="xMidYMax slice"
          className="w-full h-full"
          style={{ opacity: timeOfDay === 'day' ? 0.15 : 0.25 }}
        >
          <path
            d="M0,150 L0,100 Q100,60 200,90 Q300,50 400,80 Q500,40 600,70 Q700,55 800,85 Q900,45 1000,75 Q1100,60 1200,90 L1200,150 Z"
            fill={timeOfDay === 'day' ? '#166534' : '#1e293b'}
          />
          <path
            d="M0,150 L0,110 Q150,80 300,100 Q450,70 600,95 Q750,75 900,100 Q1050,80 1200,105 L1200,150 Z"
            fill={timeOfDay === 'day' ? '#15803d' : '#334155'}
          />
        </svg>
      </div>

      {/* Decorative trees on sides - with better styling */}
      <div className="absolute bottom-28 sm:bottom-32 left-2 text-2xl opacity-30 drop-shadow-md">🌲</div>
      <div className="absolute bottom-28 sm:bottom-32 left-10 sm:left-14 text-3xl opacity-40 drop-shadow-md">🌳</div>
      <div className="absolute bottom-36 sm:bottom-40 left-6 text-xl opacity-25 drop-shadow-md">🌲</div>
      <div className="absolute bottom-28 sm:bottom-32 right-2 text-2xl opacity-30 drop-shadow-md">🌲</div>
      <div className="absolute bottom-28 sm:bottom-32 right-10 sm:right-14 text-3xl opacity-40 drop-shadow-md">🌳</div>
      <div className="absolute bottom-36 sm:bottom-40 right-6 text-xl opacity-25 drop-shadow-md">🌲</div>

      {/* Birds silhouettes for sunny days */}
      {timeOfDay === 'day' && (weather === 'sunny' || !weather) && (
        <>
          <div className="absolute top-[20%] left-[15%] opacity-20 animate-bird-fly" style={{ animationDelay: '0s' }}>
            <svg width="24" height="12" viewBox="0 0 24 12">
              <path d="M0,6 Q6,0 12,6 Q18,0 24,6" stroke="currentColor" fill="none" strokeWidth="2" />
            </svg>
          </div>
          <div className="absolute top-[25%] left-[20%] opacity-15 animate-bird-fly" style={{ animationDelay: '0.5s' }}>
            <svg width="20" height="10" viewBox="0 0 24 12">
              <path d="M0,6 Q6,0 12,6 Q18,0 24,6" stroke="currentColor" fill="none" strokeWidth="2" />
            </svg>
          </div>
          <div className="absolute top-[18%] left-[25%] opacity-10 animate-bird-fly" style={{ animationDelay: '1s' }}>
            <svg width="16" height="8" viewBox="0 0 24 12">
              <path d="M0,6 Q6,0 12,6 Q18,0 24,6" stroke="currentColor" fill="none" strokeWidth="2" />
            </svg>
          </div>
        </>
      )}

      {/* Rainbow effect */}
      {weather === 'rainbow' && timeOfDay === 'day' && (
        <div className="absolute top-[5%] left-[10%] right-[10%] h-40 opacity-30 pointer-events-none">
          <div
            className="w-full h-full rounded-t-full"
            style={{
              background: 'linear-gradient(to bottom, transparent 40%, #ef4444 50%, #f97316 55%, #eab308 60%, #22c55e 65%, #3b82f6 70%, #8b5cf6 75%, transparent 85%)',
            }}
          />
        </div>
      )}
    </div>
  )
}

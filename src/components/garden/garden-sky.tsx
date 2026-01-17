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

// Sky gradient colors based on time of day
const SKY_GRADIENTS: Record<TimeOfDay, { from: string; via: string; to: string }> = {
  day: {
    from: '#87CEEB', // Light sky blue
    via: '#B0E0E6', // Powder blue
    to: '#E8F5E9', // Very light green near horizon
  },
  night: {
    from: '#0f172a', // Dark slate
    via: '#1e293b', // Slate 800
    to: '#334155', // Slate 700 near horizon
  },
}

// Weather overlay effects
const WEATHER_OVERLAYS: Record<WeatherType, { color: string; opacity: number }> = {
  sunny: { color: 'rgba(255, 236, 179, 0.15)', opacity: 0.15 },
  cloudy: { color: 'rgba(156, 163, 175, 0.25)', opacity: 0.25 },
  rainy: { color: 'rgba(55, 65, 81, 0.35)', opacity: 0.35 }, // Darker grey (was stormy value)
  stormy: { color: 'rgba(15, 23, 42, 0.6)', opacity: 0.6 }, // Very dark slate (much darker)
  rainbow: { color: 'rgba(252, 211, 77, 0.1)', opacity: 0.1 },
}

export function GardenSky({ weather, className, contained, timeOfDay: forcedTimeOfDay }: GardenSkyProps) {
  const [currentTimeOfDay, setCurrentTimeOfDay] = useState<TimeOfDay>('day')

  useEffect(() => {
    if (!forcedTimeOfDay) {
      setCurrentTimeOfDay(getTimeOfDay())
      // Optional: Update periodically if it stays open
      const interval = setInterval(() => setCurrentTimeOfDay(getTimeOfDay()), 60000)
      return () => clearInterval(interval)
    }
  }, [forcedTimeOfDay])

  const timeOfDay = forcedTimeOfDay || currentTimeOfDay
  const skyGradient = useMemo(() => SKY_GRADIENTS[timeOfDay], [timeOfDay])
  const weatherOverlay = weather ? WEATHER_OVERLAYS[weather] : null

  return (
    <div
      className={`${contained ? 'absolute' : 'fixed'} inset-0 z-0 overflow-hidden ${className || ''}`}
      style={{
        background: `linear-gradient(to bottom, ${skyGradient.from}, ${skyGradient.via}, ${skyGradient.to})`,
      }}
    >
      {/* Weather overlay */}
      {weatherOverlay && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: weatherOverlay.color,
          }}
        />
      )}

      {/* Sun or Moon */}
      {timeOfDay === 'day' ? (
        <div className="absolute top-24 right-8">
          {weather === 'sunny' && (
            <div className="text-4xl animate-pulse">☀️</div>
          )}
          {weather === 'cloudy' && (
            <div className="text-4xl">⛅</div>
          )}
          {weather === 'rainy' && (
            <div className="text-4xl">🌧️</div>
          )}
          {weather === 'stormy' && (
            <div className="text-4xl">⛈️</div>
          )}
          {weather === 'rainbow' && (
            <div className="text-4xl">🌈</div>
          )}
          {!weather && (
            <div className="text-4xl">☀️</div>
          )}
        </div>
      ) : (
        <div className="absolute top-24 right-8">
          <div className="text-4xl">🌙</div>
          {/* Stars */}
          <div className="absolute top-0 left-[-60px] text-xs animate-twinkle">✨</div>
          <div className="absolute top-8 left-[-40px] text-xs animate-twinkle delay-300">✨</div>
          <div className="absolute top-4 left-[-80px] text-xs animate-twinkle delay-700">✨</div>
        </div>
      )}

      {/* Decorative clouds */}
      {timeOfDay === 'day' && (weather === 'cloudy' || weather === 'rainy' || weather === 'stormy') && (
        <>
          <div className="absolute top-8 left-[10%] text-2xl opacity-70 animate-cloud-drift">☁️</div>
          <div className="absolute top-12 left-[30%] text-xl opacity-50 animate-cloud-drift delay-1000">☁️</div>
          <div className="absolute top-6 left-[60%] text-2xl opacity-60 animate-cloud-drift delay-500">☁️</div>
        </>
      )}



      {/* Decorative trees on sides - positioned above bottom nav */}
      <div className="absolute bottom-32 left-2 text-2xl opacity-40">🌲</div>
      <div className="absolute bottom-32 left-12 text-3xl opacity-50">🌳</div>
      <div className="absolute bottom-32 right-2 text-2xl opacity-40">🌲</div>
      <div className="absolute bottom-32 right-12 text-3xl opacity-50">🌳</div>
    </div>
  )
}

'use client'

import { useMemo } from 'react'
import type { WeatherType } from '@/types/database'
import { getTimeOfDay, type TimeOfDay } from './themes'

interface GardenSkyProps {
  weather?: WeatherType | null
  className?: string
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
  rainy: { color: 'rgba(96, 165, 250, 0.2)', opacity: 0.2 },
  stormy: { color: 'rgba(55, 65, 81, 0.35)', opacity: 0.35 },
  rainbow: { color: 'rgba(252, 211, 77, 0.1)', opacity: 0.1 },
}

export function GardenSky({ weather, className }: GardenSkyProps) {
  const timeOfDay = useMemo(() => getTimeOfDay(), [])
  const skyGradient = SKY_GRADIENTS[timeOfDay]
  const weatherOverlay = weather ? WEATHER_OVERLAYS[weather] : null

  return (
    <div
      className={`absolute inset-0 -z-10 overflow-hidden rounded-xl ${className || ''}`}
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
        <div className="absolute top-4 right-8">
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
        <div className="absolute top-4 right-8">
          <div className="text-4xl">🌙</div>
          {/* Stars */}
          <div className="absolute top-0 left-[-60px] text-xs animate-twinkle">✨</div>
          <div className="absolute top-8 left-[-40px] text-xs animate-twinkle delay-300">✨</div>
          <div className="absolute top-4 left-[-80px] text-xs animate-twinkle delay-700">✨</div>
        </div>
      )}

      {/* Decorative clouds */}
      {timeOfDay === 'day' && (weather === 'cloudy' || weather === 'rainy') && (
        <>
          <div className="absolute top-8 left-[10%] text-2xl opacity-70 animate-cloud-drift">☁️</div>
          <div className="absolute top-12 left-[30%] text-xl opacity-50 animate-cloud-drift delay-1000">☁️</div>
          <div className="absolute top-6 left-[60%] text-2xl opacity-60 animate-cloud-drift delay-500">☁️</div>
        </>
      )}

      {/* Rain drops animation */}
      {weather === 'rainy' && (
        <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-4 bg-blue-300/40 animate-rain-drop"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${0.5 + Math.random() * 0.5}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Decorative trees on sides */}
      <div className="absolute bottom-0 left-2 text-2xl opacity-60">🌲</div>
      <div className="absolute bottom-0 left-8 text-3xl opacity-70">🌳</div>
      <div className="absolute bottom-0 right-2 text-2xl opacity-60">🌲</div>
      <div className="absolute bottom-0 right-10 text-3xl opacity-70">🌳</div>
    </div>
  )
}

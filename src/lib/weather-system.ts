// Daily Weather System for Habit Garden

import type { WeatherType, DailyWeather } from '@/types/database'

// Weather configuration with probabilities and effects
export interface WeatherConfig {
  type: WeatherType
  icon: string
  name: string
  nameVi: string
  description: string
  descriptionVi: string
  growthModifier: number // Multiplier for growth (1.0 = normal)
  moistureModifier: number // Multiplier for moisture decay (< 1.0 = slower decay)
  xpModifier: number // Multiplier for XP earned
  probability: number // Base probability (0-1)
}

export const WEATHER_CONFIGS: Record<WeatherType, WeatherConfig> = {
  sunny: {
    type: 'sunny',
    icon: '☀️',
    name: 'Sunny',
    nameVi: 'Nắng',
    description: 'A bright sunny day! Plants grow normally.',
    descriptionVi: 'Một ngày nắng đẹp! Cây cối phát triển bình thường.',
    growthModifier: 1.0,
    moistureModifier: 1.2, // Faster moisture decay
    xpModifier: 1.0,
    probability: 0.35,
  },
  cloudy: {
    type: 'cloudy',
    icon: '☁️',
    name: 'Cloudy',
    nameVi: 'Nhiều mây',
    description: 'Overcast skies. Plants retain moisture better.',
    descriptionVi: 'Trời nhiều mây. Cây giữ ẩm tốt hơn.',
    growthModifier: 1.0,
    moistureModifier: 0.9, // Slightly slower decay
    xpModifier: 1.0,
    probability: 0.30,
  },
  rainy: {
    type: 'rainy',
    icon: '🌧️',
    name: 'Rainy',
    nameVi: 'Mưa',
    description: 'Rain is falling! Plants grow faster and retain moisture.',
    descriptionVi: 'Trời mưa! Cây phát triển nhanh hơn và giữ ẩm tốt.',
    growthModifier: 1.2, // 20% faster growth
    moistureModifier: 0.5, // Much slower decay
    xpModifier: 1.1, // Bonus XP
    probability: 0.20,
  },
  stormy: {
    type: 'stormy',
    icon: '⛈️',
    name: 'Stormy',
    nameVi: 'Bão',
    description: 'A storm is brewing! Take care of your plants.',
    descriptionVi: 'Có bão! Hãy chăm sóc cây của bạn.',
    growthModifier: 0.8, // Slower growth
    moistureModifier: 0.7, // Slower decay but not as good as rainy
    xpModifier: 1.2, // Bonus XP for watering in storms
    probability: 0.10,
  },
  rainbow: {
    type: 'rainbow',
    icon: '🌈',
    name: 'Rainbow',
    nameVi: 'Cầu vồng',
    description: 'A magical rainbow day! Everything is better.',
    descriptionVi: 'Một ngày cầu vồng kỳ diệu! Mọi thứ đều tốt hơn.',
    growthModifier: 1.5, // 50% faster growth
    moistureModifier: 0.8, // Good moisture retention
    xpModifier: 1.5, // 50% bonus XP
    probability: 0.05, // Rare
  },
}

/**
 * Generate weather for a specific date using a deterministic algorithm
 * This ensures the same date always gets the same weather
 */
export function generateWeatherForDate(date: Date): WeatherType {
  // Create a deterministic seed from the date
  const dateString = date.toISOString().split('T')[0] // YYYY-MM-DD
  let seed = 0
  for (let i = 0; i < dateString.length; i++) {
    seed = ((seed << 5) - seed) + dateString.charCodeAt(i)
    seed = seed & seed // Convert to 32-bit integer
  }

  // Use the seed to generate a "random" number between 0 and 1
  const pseudoRandom = Math.abs(Math.sin(seed)) % 1

  // Determine weather based on cumulative probability
  let cumulative = 0
  for (const config of Object.values(WEATHER_CONFIGS)) {
    cumulative += config.probability
    if (pseudoRandom <= cumulative) {
      return config.type
    }
  }

  // Fallback to sunny
  return 'sunny'
}

/**
 * Get weather configuration for a date
 */
export function getWeatherForDate(date: Date): WeatherConfig {
  const type = generateWeatherForDate(date)
  return WEATHER_CONFIGS[type]
}

/**
 * Get today's weather
 */
export function getTodayWeather(): WeatherConfig {
  return getWeatherForDate(new Date())
}

/**
 * Get weather forecast for the next N days
 */
export function getWeatherForecast(days: number): WeatherConfig[] {
  const forecast: WeatherConfig[] = []
  const today = new Date()

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() + i)
    forecast.push(getWeatherForDate(date))
  }

  return forecast
}

/**
 * Calculate modified growth based on weather
 */
export function calculateWeatherGrowth(baseGrowth: number, weather: WeatherType): number {
  const config = WEATHER_CONFIGS[weather]
  return Math.round(baseGrowth * config.growthModifier * 100) / 100
}

/**
 * Calculate modified moisture decay based on weather
 */
export function calculateWeatherMoistureDecay(
  baseDecay: number,
  weather: WeatherType
): number {
  const config = WEATHER_CONFIGS[weather]
  return Math.round(baseDecay * config.moistureModifier * 100) / 100
}

/**
 * Calculate modified XP based on weather
 */
export function calculateWeatherXp(baseXp: number, weather: WeatherType): number {
  const config = WEATHER_CONFIGS[weather]
  return Math.round(baseXp * config.xpModifier)
}

/**
 * Get weather effect description for UI
 */
export function getWeatherEffectDescription(weather: WeatherType): string[] {
  const config = WEATHER_CONFIGS[weather]
  const effects: string[] = []

  if (config.growthModifier !== 1.0) {
    const percent = Math.round((config.growthModifier - 1) * 100)
    if (percent > 0) {
      effects.push(`+${percent}% plant growth`)
    } else {
      effects.push(`${percent}% plant growth`)
    }
  }

  if (config.moistureModifier !== 1.0) {
    const percent = Math.round((1 - config.moistureModifier) * 100)
    if (percent > 0) {
      effects.push(`-${percent}% moisture decay`)
    } else {
      effects.push(`+${Math.abs(percent)}% moisture decay`)
    }
  }

  if (config.xpModifier !== 1.0) {
    const percent = Math.round((config.xpModifier - 1) * 100)
    if (percent > 0) {
      effects.push(`+${percent}% XP earned`)
    }
  }

  return effects
}

// Weather streak tracking
export interface WeatherStreak {
  type: WeatherType
  count: number
  startDate: string
}

/**
 * Check for weather streaks (same weather multiple days)
 */
export function checkWeatherStreak(days: number = 7): WeatherStreak | null {
  const today = new Date()
  let currentStreak: WeatherStreak | null = null
  let previousWeather: WeatherType | null = null

  for (let i = 0; i < days; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const weather = generateWeatherForDate(date)

    if (previousWeather === null) {
      previousWeather = weather
      currentStreak = {
        type: weather,
        count: 1,
        startDate: date.toISOString().split('T')[0],
      }
    } else if (weather === previousWeather) {
      if (currentStreak) {
        currentStreak.count++
        currentStreak.startDate = date.toISOString().split('T')[0]
      }
    } else {
      break
    }
  }

  return currentStreak && currentStreak.count >= 2 ? currentStreak : null
}

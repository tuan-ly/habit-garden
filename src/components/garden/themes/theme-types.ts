import type { WeatherType } from '@/types/database'

export type TimeOfDay = 'day' | 'night'

export interface GardenTheme {
  id: string
  name: string
  isPremium: boolean
  // Sky colors for gradient
  sky: {
    day: {
      from: string
      via?: string
      to: string
    }
    night: {
      from: string
      via?: string
      to: string
    }
  }
  // Ground/grass colors
  ground: {
    primary: string
    secondary: string
    accent?: string
  }
  // Background decorations (trees, mountains, etc.)
  decorations?: {
    type: 'trees' | 'mountains' | 'buildings' | 'custom'
    color: string
    secondaryColor?: string
  }
  // Weather overlay adjustments
  weatherEffects?: {
    rain?: string
    sunny?: string
    cloudy?: string
    stormy?: string
  }
}

// Get time of day based on local time
export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()
  // Day: 6am to 6pm (6-18)
  return hour >= 6 && hour < 18 ? 'day' : 'night'
}

// Get sky gradient based on time and theme
export function getSkyGradient(theme: GardenTheme, timeOfDay: TimeOfDay): string {
  const sky = timeOfDay === 'day' ? theme.sky.day : theme.sky.night

  if (sky.via) {
    return `linear-gradient(to bottom, ${sky.from}, ${sky.via}, ${sky.to})`
  }
  return `linear-gradient(to bottom, ${sky.from}, ${sky.to})`
}

// Weather overlay opacity/color adjustments
export function getWeatherOverlay(weather: WeatherType): {
  overlay: string
  opacity: number
} {
  switch (weather) {
    case 'sunny':
      return { overlay: 'rgba(255, 236, 179, 0.1)', opacity: 0.1 }
    case 'cloudy':
      return { overlay: 'rgba(156, 163, 175, 0.2)', opacity: 0.2 }
    case 'rainy':
      return { overlay: 'rgba(96, 165, 250, 0.15)', opacity: 0.15 }
    case 'stormy':
      return { overlay: 'rgba(55, 65, 81, 0.3)', opacity: 0.3 }
    case 'rainbow':
      return { overlay: 'rgba(252, 211, 77, 0.1)', opacity: 0.1 }
    default:
      return { overlay: 'transparent', opacity: 0 }
  }
}

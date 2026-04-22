import type { GardenTheme } from './theme-types'

export const defaultTheme: GardenTheme = {
  id: 'default',
  name: 'Classic Garden',
  isPremium: false,
  sky: {
    day: {
      from: '#87CEEB', // Light sky blue
      via: '#B0E0E6', // Powder blue
      to: '#E0F4FF', // Very light blue near horizon
    },
    night: {
      from: '#0f172a', // Dark slate
      via: '#1e293b', // Slate 800
      to: '#334155', // Slate 700 near horizon
    },
  },
  ground: {
    primary: '#A8C49A', // Warm sage (Art Bible v2.0)
    secondary: '#8FAE82', // Darker sage
    accent: '#B5CFA5', // Light sage highlight
  },
  decorations: {
    type: 'trees',
    color: '#33691e', // Dark forest green
    secondaryColor: '#558b2f', // Medium forest green
  },
}

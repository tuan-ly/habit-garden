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
    primary: '#7cb342', // Natural grass green (Forest-like)
    secondary: '#689f38', // Darker grass
    accent: '#8bc34a', // Light grass highlight
  },
  decorations: {
    type: 'trees',
    color: '#33691e', // Dark forest green
    secondaryColor: '#558b2f', // Medium forest green
  },
}

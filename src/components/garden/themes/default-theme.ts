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
    primary: '#4ade80', // Green 400
    secondary: '#22c55e', // Green 500
    accent: '#86efac', // Green 300
  },
  decorations: {
    type: 'trees',
    color: '#166534', // Green 800
    secondaryColor: '#15803d', // Green 700
  },
}

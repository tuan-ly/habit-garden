// Mood/Weather System for Habit Garden
// Track daily mood using weather metaphors
// Mood affects XP rewards (doing habits on bad days = more XP)
// Mood does NOT affect goal targets

export type MoodLevel = 1 | 2 | 3 | 4 | 5

export interface MoodConfig {
  level: MoodLevel
  weather: string
  weatherVi: string
  icon: string
  description: string
  descriptionVi: string
  xpMultiplier: number // Bonus XP for doing habits on tough days
  color: string
  bgColor: string
  gradientFrom: string
  gradientTo: string
}

export const MOOD_CONFIG: Record<MoodLevel, MoodConfig> = {
  5: {
    level: 5,
    weather: 'Sunny',
    weatherVi: 'Nang dep',
    icon: '☀️',
    description: 'Feeling great, full of energy!',
    descriptionVi: 'Tuyet voi, tran day nang luong!',
    xpMultiplier: 1.0,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500',
    gradientFrom: 'from-amber-400',
    gradientTo: 'to-orange-500',
  },
  4: {
    level: 4,
    weather: 'Partly Cloudy',
    weatherVi: 'It may',
    icon: '🌤️',
    description: 'Good day, doing fine',
    descriptionVi: 'Kha tot, binh thuong',
    xpMultiplier: 1.05,
    color: 'text-sky-500',
    bgColor: 'bg-sky-500',
    gradientFrom: 'from-sky-400',
    gradientTo: 'to-blue-500',
  },
  3: {
    level: 3,
    weather: 'Cloudy',
    weatherVi: 'May mu',
    icon: '☁️',
    description: 'Meh, low motivation today',
    descriptionVi: 'Hoi uoi, thieu dong luc',
    xpMultiplier: 1.15,
    color: 'text-slate-500',
    bgColor: 'bg-slate-500',
    gradientFrom: 'from-slate-400',
    gradientTo: 'to-slate-600',
  },
  2: {
    level: 2,
    weather: 'Rainy',
    weatherVi: 'Mua',
    icon: '🌧️',
    description: 'Tired, struggling today',
    descriptionVi: 'Met moi, kho khan',
    xpMultiplier: 1.3,
    color: 'text-blue-600',
    bgColor: 'bg-blue-600',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-indigo-600',
  },
  1: {
    level: 1,
    weather: 'Stormy',
    weatherVi: 'Bao to',
    icon: '⛈️',
    description: 'Really tough day, but still here',
    descriptionVi: 'Ngay rat kho khan, nhung van co gang',
    xpMultiplier: 1.5,
    color: 'text-purple-600',
    bgColor: 'bg-purple-600',
    gradientFrom: 'from-purple-500',
    gradientTo: 'to-violet-700',
  },
}

// Get mood configuration
export function getMoodConfig(level: MoodLevel): MoodConfig {
  return MOOD_CONFIG[level]
}

// Get XP multiplier for mood
export function getMoodXpMultiplier(level: MoodLevel): number {
  return MOOD_CONFIG[level].xpMultiplier
}

// Calculate XP with mood bonus
export function calculateXpWithMood(baseXp: number, moodLevel: MoodLevel): number {
  const multiplier = getMoodXpMultiplier(moodLevel)
  return Math.round(baseXp * multiplier)
}

// Get bonus XP amount (for display)
export function getMoodBonusXp(baseXp: number, moodLevel: MoodLevel): number {
  const withBonus = calculateXpWithMood(baseXp, moodLevel)
  return withBonus - baseXp
}

// Get all mood levels for selection (best to worst for display)
export function getAllMoodLevels(): MoodConfig[] {
  return [
    MOOD_CONFIG[5],
    MOOD_CONFIG[4],
    MOOD_CONFIG[3],
    MOOD_CONFIG[2],
    MOOD_CONFIG[1],
  ]
}

// Default mood for new day (neutral)
export const DEFAULT_MOOD: MoodLevel = 4

// Check if mood is considered "tough" (deserves bonus)
export function isToughDay(level: MoodLevel): boolean {
  return level <= 2 // Rainy or Stormy
}

// Check if mood is considered "struggling"
export function isStrugglingDay(level: MoodLevel): boolean {
  return level <= 3 // Cloudy, Rainy, or Stormy
}

// Get encouragement message based on mood
export function getMoodEncouragement(level: MoodLevel): string {
  switch (level) {
    case 1:
      return "You showed up on a stormy day. That's real strength! +50% XP"
    case 2:
      return "Pushing through the rain. You're tougher than you think! +30% XP"
    case 3:
      return "Even cloudy days count. Keep going! +15% XP"
    case 4:
      return "Nice day to build good habits!"
    case 5:
      return "Sunshine and progress! Make the most of it!"
    default:
      return "Every day is a chance to grow!"
  }
}

// Get weather animation class (for UI effects)
export function getWeatherAnimationClass(level: MoodLevel): string {
  switch (level) {
    case 1:
      return 'animate-storm'
    case 2:
      return 'animate-rain'
    case 3:
      return 'animate-clouds'
    case 4:
    case 5:
      return 'animate-sunshine'
    default:
      return ''
  }
}

// Format mood for display
export function formatMoodDisplay(level: MoodLevel): string {
  const config = getMoodConfig(level)
  return `${config.icon} ${config.weather}`
}

// Format mood with XP info
export function formatMoodWithXp(level: MoodLevel): string {
  const config = getMoodConfig(level)
  if (config.xpMultiplier === 1.0) {
    return `${config.icon} ${config.weather}`
  }
  const bonusPercent = Math.round((config.xpMultiplier - 1) * 100)
  return `${config.icon} ${config.weather} (+${bonusPercent}% XP)`
}

// Get mood level from weather name (for parsing)
export function getMoodLevelFromWeather(weather: string): MoodLevel {
  const normalizedWeather = weather.toLowerCase().trim()
  for (const [level, config] of Object.entries(MOOD_CONFIG)) {
    if (config.weather.toLowerCase() === normalizedWeather) {
      return Number(level) as MoodLevel
    }
  }
  return DEFAULT_MOOD
}

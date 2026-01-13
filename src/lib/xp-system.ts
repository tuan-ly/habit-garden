// XP and Level Progression System for Habit Garden

// Level thresholds - exponential scaling
// Level 1: 0 XP, Level 2: 100 XP, Level 3: 250 XP, etc.
const BASE_XP = 100
const XP_MULTIPLIER = 1.5

/**
 * Calculate the total XP required to reach a given level
 */
export function getXpForLevel(level: number): number {
  if (level <= 1) return 0
  // Sum of XP needed: 100 + 150 + 225 + 337 + ...
  let totalXp = 0
  for (let i = 2; i <= level; i++) {
    totalXp += Math.floor(BASE_XP * Math.pow(XP_MULTIPLIER, i - 2))
  }
  return totalXp
}

/**
 * Calculate the XP needed to advance from current level to next level
 */
export function getXpToNextLevel(level: number): number {
  return Math.floor(BASE_XP * Math.pow(XP_MULTIPLIER, level - 1))
}

/**
 * Calculate the level from total XP
 */
export function getLevelFromXp(totalXp: number): number {
  let level = 1
  let xpRequired = 0

  while (xpRequired <= totalXp) {
    xpRequired += getXpToNextLevel(level)
    if (xpRequired <= totalXp) {
      level++
    }
  }

  return level
}

/**
 * Calculate progress percentage within current level
 */
export function getLevelProgress(totalXp: number): number {
  const currentLevel = getLevelFromXp(totalXp)
  const xpForCurrentLevel = getXpForLevel(currentLevel)
  const xpToNext = getXpToNextLevel(currentLevel)

  const xpInCurrentLevel = totalXp - xpForCurrentLevel
  return Math.min(100, Math.round((xpInCurrentLevel / xpToNext) * 100))
}

/**
 * Get detailed level information from total XP
 */
export function getLevelInfo(totalXp: number) {
  const level = getLevelFromXp(totalXp)
  const xpForCurrentLevel = getXpForLevel(level)
  const xpToNextLevel = getXpToNextLevel(level)
  const xpInCurrentLevel = totalXp - xpForCurrentLevel
  const progress = Math.min(100, Math.round((xpInCurrentLevel / xpToNextLevel) * 100))

  return {
    level,
    totalXp,
    xpInCurrentLevel,
    xpToNextLevel,
    xpForCurrentLevel,
    xpForNextLevel: getXpForLevel(level + 1),
    progress,
    title: getLevelTitle(level),
    badge: getLevelBadge(level),
  }
}

/**
 * Get a title for the level
 */
export function getLevelTitle(level: number): string {
  const titles: Record<number, string> = {
    1: 'Seedling',
    2: 'Sprout',
    3: 'Gardener',
    4: 'Cultivator',
    5: 'Horticulturist',
    6: 'Plant Whisperer',
    7: 'Garden Master',
    8: 'Nature Guardian',
    9: 'Forest Keeper',
    10: 'Botanical Sage',
    11: 'Flora Champion',
    12: 'Garden Architect',
    13: 'Ecosystem Builder',
    14: 'Nature Harmonizer',
    15: 'Eden Creator',
  }

  // For levels beyond our defined titles
  if (level > 15) {
    return `Eden Creator ${level - 14}`
  }

  return titles[level] || 'Seedling'
}

/**
 * Get a badge/icon for the level
 */
export function getLevelBadge(level: number): string {
  const badges: Record<number, string> = {
    1: '🌱',
    2: '🌿',
    3: '🪴',
    4: '🌾',
    5: '🌻',
    6: '🌳',
    7: '🏡',
    8: '🏞️',
    9: '🌲',
    10: '✨',
    11: '🏆',
    12: '🎨',
    13: '🌍',
    14: '🎭',
    15: '👑',
  }

  if (level > 15) {
    return '👑'
  }

  return badges[level] || '🌱'
}

// XP rewards configuration
export const XP_REWARDS = {
  // Base watering XP
  WATER_PLANT: 10,

  // Streak bonuses
  STREAK_3_DAYS: 5,
  STREAK_7_DAYS: 15,
  STREAK_14_DAYS: 30,
  STREAK_30_DAYS: 50,

  // Morning bonus (watering before 9 AM)
  MORNING_BONUS: 5,

  // Difficulty bonuses
  HARD_DAY_BONUS: 10,
  MEDIUM_DAY_BONUS: 5,

  // Plant milestones
  PLANT_MATURED: 100,
  FIRST_PLANT_MATURED: 50,

  // Achievement XP (base, multiplied by achievement tier)
  ACHIEVEMENT_TIER_1: 25,
  ACHIEVEMENT_TIER_2: 50,
  ACHIEVEMENT_TIER_3: 100,
  ACHIEVEMENT_TIER_4: 200,

  // Special events
  RAINBOW_DAY_BONUS: 20,
  RAINY_DAY_BONUS: 5,
}

/**
 * Calculate XP for a watering action
 */
export function calculateWateringXp(params: {
  streak: number
  isMorning: boolean
  difficulty?: 'easy' | 'medium' | 'hard'
  isRainyDay?: boolean
  isRainbowDay?: boolean
  specialEffectBonus?: number
}): { total: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {
    base: XP_REWARDS.WATER_PLANT,
  }

  // Streak bonuses
  if (params.streak >= 30) {
    breakdown.streakBonus = XP_REWARDS.STREAK_30_DAYS
  } else if (params.streak >= 14) {
    breakdown.streakBonus = XP_REWARDS.STREAK_14_DAYS
  } else if (params.streak >= 7) {
    breakdown.streakBonus = XP_REWARDS.STREAK_7_DAYS
  } else if (params.streak >= 3) {
    breakdown.streakBonus = XP_REWARDS.STREAK_3_DAYS
  }

  // Morning bonus
  if (params.isMorning) {
    breakdown.morningBonus = XP_REWARDS.MORNING_BONUS
  }

  // Difficulty bonus
  if (params.difficulty === 'hard') {
    breakdown.difficultyBonus = XP_REWARDS.HARD_DAY_BONUS
  } else if (params.difficulty === 'medium') {
    breakdown.difficultyBonus = XP_REWARDS.MEDIUM_DAY_BONUS
  }

  // Weather bonuses
  if (params.isRainbowDay) {
    breakdown.weatherBonus = XP_REWARDS.RAINBOW_DAY_BONUS
  } else if (params.isRainyDay) {
    breakdown.weatherBonus = XP_REWARDS.RAINY_DAY_BONUS
  }

  // Special effect bonus (e.g., from Sunflower buff)
  if (params.specialEffectBonus && params.specialEffectBonus > 0) {
    const effectXp = Math.round(
      Object.values(breakdown).reduce((a, b) => a + b, 0) * (params.specialEffectBonus / 100)
    )
    if (effectXp > 0) {
      breakdown.specialEffectBonus = effectXp
    }
  }

  const total = Object.values(breakdown).reduce((a, b) => a + b, 0)

  return { total, breakdown }
}

// Level milestones and rewards
export interface LevelReward {
  level: number
  title: string
  description: string
  reward: string
  unlocks?: string[]
}

export const LEVEL_REWARDS: LevelReward[] = [
  {
    level: 2,
    title: 'First Growth',
    description: 'You\'ve started your journey!',
    reward: '+1 Water Reserve',
    unlocks: ['Basic plant types'],
  },
  {
    level: 3,
    title: 'Green Thumb',
    description: 'Your garden is taking shape',
    reward: '+1 Water Reserve',
    unlocks: ['Plant customization'],
  },
  {
    level: 5,
    title: 'Garden Grows',
    description: 'Your dedication is paying off',
    reward: '+2 Water Reserves',
    unlocks: ['Special plant types', 'Garden themes'],
  },
  {
    level: 7,
    title: 'Master Cultivator',
    description: 'You\'ve mastered the basics',
    reward: '+2 Water Reserves',
    unlocks: ['Weather forecasts'],
  },
  {
    level: 10,
    title: 'Botanical Sage',
    description: 'Your garden is legendary',
    reward: '+3 Water Reserves',
    unlocks: ['Premium plants', 'Custom themes'],
  },
  {
    level: 15,
    title: 'Eden Creator',
    description: 'You\'ve achieved gardening mastery',
    reward: '+5 Water Reserves',
    unlocks: ['All features unlocked'],
  },
]

/**
 * Get rewards for reaching a specific level
 */
export function getLevelReward(level: number): LevelReward | null {
  return LEVEL_REWARDS.find((r) => r.level === level) || null
}

/**
 * Check if user has reached a new level
 */
export function checkLevelUp(
  previousXp: number,
  newXp: number
): { leveledUp: boolean; newLevel: number; reward: LevelReward | null } {
  const previousLevel = getLevelFromXp(previousXp)
  const newLevel = getLevelFromXp(newXp)

  if (newLevel > previousLevel) {
    return {
      leveledUp: true,
      newLevel,
      reward: getLevelReward(newLevel),
    }
  }

  return {
    leveledUp: false,
    newLevel: previousLevel,
    reward: null,
  }
}

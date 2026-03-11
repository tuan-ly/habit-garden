/**
 * Coin Reward System for Habit Garden
 *
 * Coins are earned through various garden activities and can be spent
 * in the shop to purchase decorations.
 */

// ============================================
// Constants
// ============================================

/** Coins for first daily watering */
export const COINS_FIRST_DAILY_WATER = 5

/** Coins for each additional plant watered in a day */
export const COINS_EXTRA_PLANT_WATER = 2

/** Coins earned when a plant reaches mature status */
export const COINS_PLANT_MATURED = 50

/** Streak milestone coin rewards */
export const STREAK_COIN_REWARDS: Record<number, number> = {
  3: 10,
  7: 25,
  14: 50,
  30: 100,
  60: 200,
  100: 500,
}

/** Achievement coin rewards by rarity */
export const ACHIEVEMENT_COIN_REWARDS: Record<string, number> = {
  common: 10,
  uncommon: 25,
  rare: 50,
  epic: 100,
}

// ============================================
// Calculation Functions
// ============================================

/**
 * Calculate coins earned for watering activity
 * @param isFirstDailyWater - Whether this is the first watering of the day
 * @returns Coins to award
 */
export function calculateWateringCoins(isFirstDailyWater: boolean): number {
  return isFirstDailyWater ? COINS_FIRST_DAILY_WATER : COINS_EXTRA_PLANT_WATER
}

/**
 * Calculate coins earned for reaching a streak milestone
 * @param currentStreak - The streak value after this watering
 * @returns Coins to award (0 if not a milestone)
 */
export function calculateStreakCoins(currentStreak: number): number {
  return STREAK_COIN_REWARDS[currentStreak] ?? 0
}

/**
 * Calculate total coins for a watering event
 * @param isFirstDailyWater - Whether this is the first watering of the day
 * @param newStreak - The streak value after this watering
 * @returns Object with breakdown and total
 */
export function calculateWateringReward(
  isFirstDailyWater: boolean,
  newStreak: number
): {
  wateringCoins: number
  streakCoins: number
  total: number
} {
  const wateringCoins = calculateWateringCoins(isFirstDailyWater)
  const streakCoins = calculateStreakCoins(newStreak)
  return {
    wateringCoins,
    streakCoins,
    total: wateringCoins + streakCoins,
  }
}

/**
 * Get the next streak milestone and its reward
 * @param currentStreak - Current streak value
 * @returns Next milestone info or null if past all milestones
 */
export function getNextStreakMilestone(currentStreak: number): {
  daysUntil: number
  milestone: number
  coins: number
} | null {
  const milestones = Object.keys(STREAK_COIN_REWARDS)
    .map(Number)
    .sort((a, b) => a - b)

  for (const milestone of milestones) {
    if (milestone > currentStreak) {
      return {
        daysUntil: milestone - currentStreak,
        milestone,
        coins: STREAK_COIN_REWARDS[milestone],
      }
    }
  }

  return null
}

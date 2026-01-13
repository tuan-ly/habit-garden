// Water Reserves (Freeze) System for Habit Garden
// Water reserves allow users to "freeze" their streak when they can't water

export interface WaterReserveConfig {
  maxReserves: number
  reserveRestorePerLevel: number
  reserveRestoreOnMature: number
  streakProtectionDays: number
}

export const WATER_RESERVE_CONFIG: WaterReserveConfig = {
  maxReserves: 10, // Maximum reserves a user can have
  reserveRestorePerLevel: 1, // Reserves gained per level up
  reserveRestoreOnMature: 1, // Reserves gained when a plant matures
  streakProtectionDays: 1, // Each reserve protects streak for 1 day
}

/**
 * Calculate maximum water reserves based on user level
 */
export function getMaxReserves(level: number): number {
  // Base: 3 reserves, +1 every 2 levels, capped at maxReserves
  const bonus = Math.floor(level / 2)
  return Math.min(3 + bonus, WATER_RESERVE_CONFIG.maxReserves)
}

/**
 * Check if user can use a water reserve
 */
export function canUseReserve(currentReserves: number): boolean {
  return currentReserves > 0
}

/**
 * Use water reserves for streak protection
 * Returns the number of reserves used
 */
export function useReservesForStreak(
  currentReserves: number,
  missedDays: number
): { reservesUsed: number; streakProtected: boolean; remainingMissedDays: number } {
  const reservesToUse = Math.min(currentReserves, missedDays)
  const remainingMissedDays = missedDays - reservesToUse

  return {
    reservesUsed: reservesToUse,
    streakProtected: remainingMissedDays === 0,
    remainingMissedDays,
  }
}

/**
 * Calculate reserves to award on level up
 */
export function getReservesOnLevelUp(newLevel: number): number {
  // Award reserves at specific level milestones
  const milestones: Record<number, number> = {
    2: 1,
    3: 1,
    5: 2,
    7: 2,
    10: 3,
    15: 5,
  }
  return milestones[newLevel] || 0
}

/**
 * Check if reserve was auto-used (for notification purposes)
 */
export interface ReserveUsageResult {
  wasUsed: boolean
  reservesUsed: number
  remainingReserves: number
  streakSaved: boolean
  plantName?: string
}

/**
 * Format reserve display
 */
export function formatReserveDisplay(current: number, max: number): string {
  return `${current}/${max} 💧`
}

/**
 * Get reserve status description
 */
export function getReserveStatus(current: number, max: number): {
  status: 'full' | 'partial' | 'empty' | 'critical'
  message: string
} {
  const ratio = current / max

  if (ratio === 1) {
    return {
      status: 'full',
      message: 'Water reserves are full!',
    }
  }
  if (ratio >= 0.5) {
    return {
      status: 'partial',
      message: `${current} water reserves remaining`,
    }
  }
  if (current > 0) {
    return {
      status: 'critical',
      message: `Only ${current} reserve${current > 1 ? 's' : ''} left!`,
    }
  }
  return {
    status: 'empty',
    message: 'No water reserves - streaks are at risk!',
  }
}

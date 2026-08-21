/**
 * Plant Status Logic - Gentle Growth Philosophy
 *
 * Status Flow:
 * - thriving: Logged today (active engagement)
 * - growing: Watered but not logged (caring without achieving)
 * - resting: 1-3 days no activity (intentional rest)
 * - waiting: 4-7 days no activity (patient waiting)
 * - sleeping: 7+ days no activity (peaceful dormancy)
 * - mature: Reached growth milestone (celebration)
 *
 * Key Principle: Plants NEVER die. They only sleep.
 */

import type { Plant, PlantStatus, PlantStateInfo, VisualStage } from '@/types/database'

/**
 * Acknowledged Plant Loss keeps the final visual moment durable across reloads.
 * Dead plants leave the interactive garden only after this value is persisted.
 */
export function isPendingPlantDeath(
  plant: Pick<Plant, 'status' | 'death_acknowledged_at'>
): boolean {
  return plant.status === 'dead' && plant.death_acknowledged_at == null
}

export function isVisibleInGarden(
  plant: Pick<Plant, 'status' | 'death_acknowledged_at'>
): boolean {
  return plant.status !== 'dead' || isPendingPlantDeath(plant)
}

// =====================================================
// Status Calculation
// =====================================================

export interface PlantStatusInput {
  lastWateredAt: string | null
  lastLoggedAt?: string | null
  growthPercentage: number
  gracePeriodDays?: number
  hasLoggedToday?: boolean
  hasWateredToday?: boolean
}

/**
 * Calculate the current plant status based on activity
 */
export function calculatePlantStatus(input: PlantStatusInput): PlantStatus {
  const {
    lastWateredAt,
    growthPercentage,
    gracePeriodDays = 7,
    hasLoggedToday = false,
    hasWateredToday = false,
  } = input

  // Mature plants stay mature (celebration state)
  if (growthPercentage >= 100) {
    return 'mature'
  }

  // Thriving: Logged today (full engagement)
  if (hasLoggedToday) {
    return 'thriving'
  }

  // Growing: Watered today but not logged
  if (hasWateredToday) {
    return 'growing'
  }

  // Calculate days since last activity
  const daysInactive = calculateDaysInactive(lastWateredAt)

  // Resting: 1-3 days inactive
  if (daysInactive <= 3) {
    return 'resting'
  }

  // Waiting: 4 days to grace period
  if (daysInactive <= gracePeriodDays) {
    return 'waiting'
  }

  // Sleeping: Beyond grace period (peaceful dormancy)
  return 'sleeping'
}

/**
 * Calculate days since last activity
 */
export function calculateDaysInactive(lastWateredAt: string | null): number {
  if (!lastWateredAt) return 999 // Never watered

  const lastDate = new Date(lastWateredAt)
  const today = new Date()
  const diffTime = today.getTime() - lastDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  return Math.max(0, diffDays)
}

// =====================================================
// Status Info & Messaging
// =====================================================

/**
 * Get friendly status info for UI display
 */
export function getPlantStateInfo(plant: Plant, hasLoggedToday = false): PlantStateInfo {
  const today = new Date().toISOString().split('T')[0]
  const hasWateredToday = plant.last_watered_at
    ? new Date(plant.last_watered_at).toISOString().split('T')[0] === today
    : false

  const status = calculatePlantStatus({
    lastWateredAt: plant.last_watered_at,
    growthPercentage: plant.growth_percentage,
    gracePeriodDays: plant.grace_period_days || 7,
    hasLoggedToday,
    hasWateredToday,
  })

  const daysInactive = calculateDaysInactive(plant.last_watered_at)

  return {
    status,
    daysInactive,
    canWater: !hasWateredToday,
    isResting: status === 'resting',
    ...getStatusMessage(status, daysInactive),
  }
}

/**
 * Get gentle, encouraging message for status
 */
function getStatusMessage(status: PlantStatus, daysInactive: number): { message: string; emoji: string } {
  switch (status) {
    case 'thriving':
      return {
        message: 'Growing beautifully!',
        emoji: '🌱',
      }
    case 'growing':
      return {
        message: 'Ready for action',
        emoji: '💪',
      }
    case 'resting':
      return {
        message: 'Taking a rest day',
        emoji: '💤',
      }
    case 'waiting':
      return {
        message: `Waiting for you when you're ready`,
        emoji: '🌙',
      }
    case 'sleeping':
      return {
        message: 'Sleeping peacefully. Wake anytime',
        emoji: '💚',
      }
    case 'mature':
      return {
        message: 'A wise old tree',
        emoji: '🌳',
      }
    default:
      return {
        message: 'Ready to grow',
        emoji: '🌱',
      }
  }
}

// =====================================================
// Visual Stage Calculation
// =====================================================

/**
 * Calculate visual stage based on maturity and age
 */
export function calculateVisualStage(
  growthPercentage: number,
  totalWaterings: number,
  maturityLevel: number
): VisualStage {
  // Legendary: 1000+ waterings (nearly 3 years daily)
  if (totalWaterings >= 1000) return 'legendary'

  // Ancient: 730+ waterings (2 years)
  if (totalWaterings >= 730) return 'ancient'

  // Established: 365+ waterings (1 year)
  if (totalWaterings >= 365) return 'established'

  // Mature: 100% growth
  if (growthPercentage >= 100) return 'mature'

  // Growing: 50-99%
  if (growthPercentage >= 50) return 'growing'

  // Sprout: 25-49%
  if (growthPercentage >= 25) return 'sprout'

  // Seed: 0-24%
  return 'seed'
}

/**
 * Calculate maturity level (1-10)
 */
export function calculateMaturityLevel(
  growthPercentage: number,
  totalWaterings: number,
  currentStreak: number,
  longestStreak: number
): number {
  // Base level from growth (1-5)
  let level = Math.min(5, Math.floor(growthPercentage / 20) + 1)

  // Bonus from consistency
  if (totalWaterings >= 365) level += 2
  else if (totalWaterings >= 100) level += 1

  // Bonus from streaks
  if (longestStreak >= 30) level += 2
  else if (longestStreak >= 14) level += 1

  // Bonus from current engagement
  if (currentStreak >= 7) level += 1

  return Math.min(10, level)
}

// =====================================================
// Rhythm Calculation
// =====================================================

/**
 * Calculate rhythm stats for a plant
 */
export function calculateRhythm(activityDates: string[]): {
  daysThisWeek: number
  daysThisMonth: number
  consistencyPercentage: number
} {
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday
  startOfWeek.setHours(0, 0, 0, 0)

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  // Count days this week
  const daysThisWeek = activityDates.filter(date => {
    const d = new Date(date)
    return d >= startOfWeek
  }).length

  // Count days this month
  const daysThisMonth = activityDates.filter(date => {
    const d = new Date(date)
    return d >= startOfMonth
  }).length

  // Calculate consistency (last 30 days)
  const thirtyDaysAgo = new Date(today)
  thirtyDaysAgo.setDate(today.getDate() - 30)

  const daysLast30 = activityDates.filter(date => {
    const d = new Date(date)
    return d >= thirtyDaysAgo
  }).length

  const consistencyPercentage = Math.round((daysLast30 / 30) * 100)

  return {
    daysThisWeek,
    daysThisMonth,
    consistencyPercentage,
  }
}

// =====================================================
// Status Badge Colors
// =====================================================

export function getStatusColor(status: PlantStatus): {
  bg: string
  text: string
  border: string
} {
  switch (status) {
    case 'thriving':
      return {
        bg: 'bg-emerald-500',
        text: 'text-white',
        border: 'border-emerald-400',
      }
    case 'growing':
      return {
        bg: 'bg-green-500',
        text: 'text-white',
        border: 'border-green-400',
      }
    case 'resting':
      return {
        bg: 'bg-blue-500',
        text: 'text-white',
        border: 'border-blue-400',
      }
    case 'waiting':
      return {
        bg: 'bg-amber-500',
        text: 'text-white',
        border: 'border-amber-400',
      }
    case 'sleeping':
      return {
        bg: 'bg-slate-500',
        text: 'text-white',
        border: 'border-slate-400',
      }
    case 'mature':
      return {
        bg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
        text: 'text-white',
        border: 'border-teal-400',
      }
    default:
      return {
        bg: 'bg-slate-500',
        text: 'text-white',
        border: 'border-slate-400',
      }
  }
}

/**
 * Get display label for status (friendly, no harsh terms)
 */
export function getStatusLabel(status: PlantStatus): string {
  switch (status) {
    case 'thriving':
      return 'Thriving'
    case 'growing':
      return 'Growing'
    case 'resting':
      return 'Resting'
    case 'waiting':
      return 'Waiting'
    case 'sleeping':
      return 'Sleeping'
    case 'mature':
      return 'Mature'
    default:
      return 'Growing'
  }
}

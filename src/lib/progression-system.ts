/**
 * Habien 2.0 - Progressive Disclosure System
 *
 * Manages tier unlocks, slot limits, and user phases
 */

import type { Profile, PlantTier, UserPhase } from '@/types/database'

// ============================================
// Types
// ============================================

export interface TierRequirement {
  level: number
  maturePlants: number
  longestStreak: number
  noDeathDays: number
  achievements?: string[]
}

export interface TierInfo {
  tier: PlantTier
  name: string
  nameVi: string
  theme: string
  tolerance: string
  color: string
  bgColor: string
}

export interface SlotCheckResult {
  hasSlot: boolean
  currentCount: number
  maxSlots: number
  message?: string
}

export interface TierCheckResult {
  allowed: boolean
  reason?: string
  missingRequirements?: string[]
}

// ============================================
// Constants
// ============================================

/**
 * Tier requirements for unlocking each tier
 */
export const TIER_REQUIREMENTS: Record<PlantTier, TierRequirement> = {
  1: { level: 1, maturePlants: 0, longestStreak: 0, noDeathDays: 0 },
  2: { level: 7, maturePlants: 1, longestStreak: 7, noDeathDays: 0 },
  3: { level: 10, maturePlants: 3, longestStreak: 30, noDeathDays: 14 },
  4: { level: 14, maturePlants: 5, longestStreak: 66, noDeathDays: 30 },
  5: {
    level: 18,
    maturePlants: 10,
    longestStreak: 100,
    noDeathDays: 60,
    achievements: ['rose_master', 'bamboo_patience', 'perfect_month']
  },
}

/**
 * Tier display information
 */
export const TIER_INFO: Record<PlantTier, TierInfo> = {
  1: {
    tier: 1,
    name: 'Forgiving Friends',
    nameVi: 'Bạn Hiền',
    theme: 'You cannot fail here',
    tolerance: '3-14 days',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  2: {
    tier: 2,
    name: 'Reliable Partners',
    nameVi: 'Đồng Hành',
    theme: 'Building real consistency',
    tolerance: '2-4 days',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  3: {
    tier: 3,
    name: 'Demanding Beauties',
    nameVi: 'Sắc Đẹp',
    theme: 'Beauty requires dedication',
    tolerance: '1-2 days',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  4: {
    tier: 4,
    name: 'Life Companions',
    nameVi: 'Tri Kỷ',
    theme: 'Identity-level transformation',
    tolerance: '2-5 days (long maturity)',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  5: {
    tier: 5,
    name: 'Garden Legends',
    nameVi: 'Huyền Thoại',
    theme: 'Earned, not planted',
    tolerance: 'Variable',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
  },
}

/**
 * Max plants by level
 */
const SLOT_LIMITS: [number, number][] = [
  [1, 1],   // Level 1-3: 1 plant
  [4, 2],   // Level 4-5: 2 plants
  [6, 3],   // Level 6-8: 3 plants
  [9, 4],   // Level 9-11: 4 plants
  [12, 5],  // Level 12-14: 5 plants
  [15, Infinity], // Level 15+: Unlimited
]

// ============================================
// Core Functions
// ============================================

/**
 * Get maximum plants allowed for a given level
 */
export function getMaxPlants(level: number): number {
  if (level >= 15) return Infinity
  if (level >= 12) return 5
  if (level >= 9) return 4
  if (level >= 6) return 3
  if (level >= 4) return 2
  return 1
}

/**
 * Get user phase based on level
 */
export function getUserPhase(level: number): UserPhase {
  if (level >= 13) return 'sage'
  if (level >= 6) return 'gardener'
  return 'seedling'
}

/**
 * Get unlocked tiers for a given level (simplified - just level check)
 * Full tier unlock requires checking other requirements
 */
export function getBasicUnlockedTiers(level: number): PlantTier[] {
  const tiers: PlantTier[] = [1]
  if (level >= 7) tiers.push(2)
  if (level >= 10) tiers.push(3)
  if (level >= 14) tiers.push(4)
  if (level >= 18) tiers.push(5)
  return tiers
}

/**
 * Get tier requirements
 */
export function getTierRequirements(tier: PlantTier): TierRequirement {
  return TIER_REQUIREMENTS[tier]
}

/**
 * Get tier display info
 */
export function getTierInfo(tier: PlantTier): TierInfo {
  return TIER_INFO[tier]
}

/**
 * Check if user has available plant slot
 */
export function checkSlotAvailability(
  profile: Profile,
  currentPlantCount: number
): SlotCheckResult {
  const maxSlots = profile.max_plants ?? getMaxPlants(profile.level)
  const hasSlot = currentPlantCount < maxSlots

  return {
    hasSlot,
    currentCount: currentPlantCount,
    maxSlots: maxSlots === Infinity ? -1 : maxSlots, // -1 = unlimited
    message: hasSlot
      ? undefined
      : `You have reached your plant limit (${maxSlots}). Level up to unlock more slots!`,
  }
}

/**
 * Check if user can plant a specific tier
 * Simplified version - only checks level requirement
 */
export function canPlantTier(
  profile: Profile,
  tier: PlantTier
): TierCheckResult {
  const req = TIER_REQUIREMENTS[tier]
  const missingRequirements: string[] = []

  // Check level
  if (profile.level < req.level) {
    missingRequirements.push(`Level ${req.level} required (current: ${profile.level})`)
  }

  // Check mature plants
  const maturePlants = profile.total_mature_plants ?? 0
  if (maturePlants < req.maturePlants) {
    missingRequirements.push(`${req.maturePlants} mature plants required (current: ${maturePlants})`)
  }

  // Check longest streak
  const longestStreak = profile.longest_streak ?? 0
  if (longestStreak < req.longestStreak) {
    missingRequirements.push(`${req.longestStreak}-day streak required (best: ${longestStreak})`)
  }

  // Note: noDeathDays and achievements require additional data
  // Will be implemented in full version

  if (missingRequirements.length > 0) {
    return {
      allowed: false,
      reason: missingRequirements[0],
      missingRequirements,
    }
  }

  return { allowed: true }
}

/**
 * Check if a tier is unlocked for user (quick check using profile.unlocked_tiers)
 */
export function isTierUnlocked(profile: Profile, tier: PlantTier): boolean {
  const unlockedTiers = profile.unlocked_tiers ?? [1]
  return unlockedTiers.includes(tier)
}

/**
 * Calculate profile progression fields based on current stats
 */
export function calculateProgressionFields(
  level: number,
  maturePlants: number,
  longestStreak: number
): {
  max_plants: number
  unlocked_tiers: number[]
  phase: UserPhase
} {
  const max_plants = getMaxPlants(level)
  const phase = getUserPhase(level)

  // Calculate unlocked tiers based on all requirements
  const unlocked_tiers: number[] = [1]

  // Tier 2: Level 7, 1 mature plant, 7-day streak
  if (level >= 7 && maturePlants >= 1 && longestStreak >= 7) {
    unlocked_tiers.push(2)
  }

  // Tier 3: Level 10, 3 mature plants, 30-day streak
  if (level >= 10 && maturePlants >= 3 && longestStreak >= 30) {
    unlocked_tiers.push(3)
  }

  // Tier 4: Level 14, 5 mature plants, 66-day streak
  if (level >= 14 && maturePlants >= 5 && longestStreak >= 66) {
    unlocked_tiers.push(4)
  }

  // Tier 5: Level 18, 10 mature plants, 100-day streak (+ achievements)
  if (level >= 18 && maturePlants >= 10 && longestStreak >= 100) {
    unlocked_tiers.push(5)
  }

  return {
    max_plants: max_plants === Infinity ? 999 : max_plants,
    unlocked_tiers,
    phase,
  }
}

/**
 * Map difficulty to tier (for backward compatibility with existing plants)
 */
export function difficultyToTier(difficulty: 'easy' | 'medium' | 'hard'): PlantTier {
  switch (difficulty) {
    case 'easy': return 1
    case 'medium': return 2
    case 'hard': return 3
  }
}

/**
 * Get tier unlock level (minimum level to unlock this tier)
 */
export function getTierUnlockLevel(tier: PlantTier): number {
  return TIER_REQUIREMENTS[tier].level
}

// ============================================
// Garden Expansion System (Phase 2)
// ============================================

/**
 * Decoration types available in the garden
 */
export type DecorationType =
  | 'bush'
  | 'rock'
  | 'mushroom'
  | 'flower-patch'
  | 'lantern'
  | 'fence-post'
  | 'fence-corner'
  | 'pond'
  | 'fountain'

/**
 * Level unlock information
 */
export interface LevelUnlock {
  type: 'garden' | 'decoration' | 'slot' | 'tier'
  name: string
  icon: string
  description?: string
}

/**
 * Garden size thresholds by level
 * Level 1-5:   3x3  (9 tiles)   - Seedling's patch
 * Level 6-8:   5x5  (25 tiles)  - Gardener's plot
 * Level 9-11:  7x7  (49 tiles)  - Growing estate
 * Level 12+:   Dynamic (0)      - Full garden (no minimum)
 */
export function getGardenSize(level: number): number {
  if (level >= 12) return 0 // Dynamic (no minimum)
  if (level >= 9) return 7 // 7x7
  if (level >= 6) return 5 // 5x5
  return 3 // 3x3
}

/**
 * Get garden size name for display
 */
export function getGardenSizeName(level: number): string {
  if (level >= 12) return 'Unlimited Garden'
  if (level >= 9) return 'Growing Estate'
  if (level >= 6) return "Gardener's Plot"
  return "Seedling's Patch"
}

/**
 * Get decorations unlocked at a given level
 *
 * Level 1:   Basic (bushes, rocks)
 * Level 5:   Mushrooms, flower patches
 * Level 8:   Lanterns (night glow effect)
 * Level 10:  Garden fence/border decorations
 * Level 12:  Ponds/water features
 */
export function getUnlockedDecorations(level: number): DecorationType[] {
  const decos: DecorationType[] = ['bush', 'rock']
  if (level >= 5) decos.push('mushroom', 'flower-patch')
  if (level >= 8) decos.push('lantern')
  if (level >= 10) decos.push('fence-post', 'fence-corner')
  if (level >= 12) decos.push('pond', 'fountain')
  return decos
}

/**
 * Check if a specific decoration type is unlocked at the given level
 */
export function isDecorationUnlocked(level: number, decoType: DecorationType): boolean {
  return getUnlockedDecorations(level).includes(decoType)
}

/**
 * Get all unlocks that happen at a specific level
 * Used for level-up celebrations
 */
export function getLevelUnlocks(level: number): LevelUnlock[] {
  const unlocks: LevelUnlock[] = []

  // Slot unlocks
  if (level === 4) {
    unlocks.push({ type: 'slot', name: '2nd Plant Slot', icon: '🌱', description: 'You can now grow 2 plants!' })
  }
  if (level === 6) {
    unlocks.push({ type: 'slot', name: '3rd Plant Slot', icon: '🌿', description: 'You can now grow 3 plants!' })
  }
  if (level === 9) {
    unlocks.push({ type: 'slot', name: '4th Plant Slot', icon: '🪴', description: 'You can now grow 4 plants!' })
  }
  if (level === 12) {
    unlocks.push({ type: 'slot', name: '5th Plant Slot', icon: '🌳', description: 'You can now grow 5 plants!' })
  }
  if (level === 15) {
    unlocks.push({ type: 'slot', name: 'Unlimited Slots', icon: '✨', description: 'No plant limits!' })
  }

  // Garden size upgrades
  if (level === 6) {
    unlocks.push({ type: 'garden', name: '5×5 Garden', icon: '🏡', description: "Gardener's Plot unlocked!" })
  }
  if (level === 9) {
    unlocks.push({ type: 'garden', name: '7×7 Garden', icon: '🏘️', description: 'Growing Estate unlocked!' })
  }
  if (level === 12) {
    unlocks.push({ type: 'garden', name: 'Unlimited Garden', icon: '🏰', description: 'Your garden has no boundaries!' })
  }

  // Decoration unlocks
  if (level === 5) {
    unlocks.push({ type: 'decoration', name: 'Mushrooms & Flowers', icon: '🍄', description: 'New garden decorations!' })
  }
  if (level === 8) {
    unlocks.push({ type: 'decoration', name: 'Garden Lanterns', icon: '🏮', description: 'Light up your nights!' })
  }
  if (level === 10) {
    unlocks.push({ type: 'decoration', name: 'Garden Fences', icon: '🪵', description: 'Border decorations unlocked!' })
  }
  if (level === 12) {
    unlocks.push({ type: 'decoration', name: 'Water Features', icon: '💧', description: 'Ponds and fountains!' })
  }

  // Crafting & Workshop unlocks
  if (level === 3) {
    unlocks.push({ type: 'decoration', name: 'Crafting Workshop', icon: '🔨', description: 'Craft decorations from materials!' })
  }
  if (level === 5) {
    unlocks.push({ type: 'decoration', name: 'Nature Recipes', icon: '🌸', description: 'Nature decoration recipes unlocked!' })
  }
  if (level === 8) {
    unlocks.push({ type: 'decoration', name: 'Lighting Recipes', icon: '💡', description: 'Lighting decoration recipes unlocked!' })
  }
  if (level === 10) {
    unlocks.push({ type: 'decoration', name: 'Special Recipes', icon: '⚗️', description: 'Rare decoration recipes unlocked!' })
  }

  // Tier unlocks
  if (level === 7) {
    unlocks.push({ type: 'tier', name: 'Tier 2 Plants', icon: '⭐⭐', description: 'Reliable Partners unlocked!' })
  }
  if (level === 10) {
    unlocks.push({ type: 'tier', name: 'Tier 3 Plants', icon: '⭐⭐⭐', description: 'Demanding Beauties unlocked!' })
  }
  if (level === 14) {
    unlocks.push({ type: 'tier', name: 'Tier 4 Plants', icon: '⭐⭐⭐⭐', description: 'Life Companions unlocked!' })
  }
  if (level === 18) {
    unlocks.push({ type: 'tier', name: 'Tier 5 Plants', icon: '⭐⭐⭐⭐⭐', description: 'Garden Legends unlocked!' })
  }

  return unlocks
}

/**
 * Check if a level has any unlocks (for showing celebration)
 */
export function hasLevelUnlocks(level: number): boolean {
  return getLevelUnlocks(level).length > 0
}

/**
 * Get the next level that has unlocks (for motivation display)
 */
export function getNextUnlockLevel(currentLevel: number): number | null {
  const unlockLevels = [4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 18]
  return unlockLevels.find(l => l > currentLevel) || null
}

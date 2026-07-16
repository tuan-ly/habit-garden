import { describe, it, expect } from 'vitest'
import {
  getMaxPlants,
  getUserPhase,
  getBasicUnlockedTiers,
  getTierRequirements,
  getTierInfo,
  checkSlotAvailability,
  canPlantTier,
  isTierUnlocked,
  calculateProgressionFields,
  difficultyToTier,
  getTierUnlockLevel,
  getGardenSize,
  getGardenSizeName,
  getLevelUnlocks,
  hasLevelUnlocks,
  getNextUnlockLevel,
  TIER_REQUIREMENTS,
  TIER_INFO,
} from '../progression-system'
import type { Profile, PlantTier } from '@/types/database'

// Helper to create mock profile
function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    avatar_url: null,
    level: 1,
    current_xp: 0,
    total_xp: 0,
    max_plants: 1,
    unlocked_tiers: [1],
    phase: 'seedling',
    total_mature_plants: 0,
    longest_streak: 0,
    water_reserves: 3,
    timezone: 'UTC',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  } as Profile
}

// ============================================
// Slot Limits Tests
// ============================================

describe('Slot Limits (getMaxPlants)', () => {
  it('returns 1 plant for levels 1-3', () => {
    expect(getMaxPlants(1)).toBe(1)
    expect(getMaxPlants(2)).toBe(1)
    expect(getMaxPlants(3)).toBe(1)
  })

  it('returns 2 plants for levels 4-5', () => {
    expect(getMaxPlants(4)).toBe(2)
    expect(getMaxPlants(5)).toBe(2)
  })

  it('returns 3 plants for levels 6-8', () => {
    expect(getMaxPlants(6)).toBe(3)
    expect(getMaxPlants(7)).toBe(3)
    expect(getMaxPlants(8)).toBe(3)
  })

  it('returns 4 plants for levels 9-11', () => {
    expect(getMaxPlants(9)).toBe(4)
    expect(getMaxPlants(10)).toBe(4)
    expect(getMaxPlants(11)).toBe(4)
  })

  it('returns 5 plants for levels 12-14', () => {
    expect(getMaxPlants(12)).toBe(5)
    expect(getMaxPlants(13)).toBe(5)
    expect(getMaxPlants(14)).toBe(5)
  })

  it('returns unlimited (Infinity) at level 15+', () => {
    expect(getMaxPlants(15)).toBe(Infinity)
    expect(getMaxPlants(20)).toBe(Infinity)
    expect(getMaxPlants(100)).toBe(Infinity)
  })

  it('handles edge case level 0 as 1', () => {
    expect(getMaxPlants(0)).toBe(1)
  })
})

// ============================================
// User Phases Tests
// ============================================

describe('User Phases (getUserPhase)', () => {
  it('returns seedling phase for levels 1-5', () => {
    expect(getUserPhase(1)).toBe('seedling')
    expect(getUserPhase(3)).toBe('seedling')
    expect(getUserPhase(5)).toBe('seedling')
  })

  it('returns gardener phase for levels 6-12', () => {
    expect(getUserPhase(6)).toBe('gardener')
    expect(getUserPhase(9)).toBe('gardener')
    expect(getUserPhase(12)).toBe('gardener')
  })

  it('returns sage phase for levels 13+', () => {
    expect(getUserPhase(13)).toBe('sage')
    expect(getUserPhase(15)).toBe('sage')
    expect(getUserPhase(20)).toBe('sage')
  })
})

// ============================================
// Tier Unlocks Tests
// ============================================

describe('Tier Unlocks (getBasicUnlockedTiers)', () => {
  it('only tier 1 unlocked at level 1', () => {
    expect(getBasicUnlockedTiers(1)).toEqual([1])
  })

  it('tiers 1-2 unlocked at level 7', () => {
    expect(getBasicUnlockedTiers(7)).toContain(1)
    expect(getBasicUnlockedTiers(7)).toContain(2)
    expect(getBasicUnlockedTiers(6)).not.toContain(2)
  })

  it('tiers 1-3 unlocked at level 10', () => {
    expect(getBasicUnlockedTiers(10)).toContain(3)
    expect(getBasicUnlockedTiers(9)).not.toContain(3)
  })

  it('tiers 1-4 unlocked at level 14', () => {
    expect(getBasicUnlockedTiers(14)).toContain(4)
    expect(getBasicUnlockedTiers(13)).not.toContain(4)
  })

  it('all tiers (1-5) unlocked at level 18', () => {
    const tiers = getBasicUnlockedTiers(18)
    expect(tiers).toContain(1)
    expect(tiers).toContain(2)
    expect(tiers).toContain(3)
    expect(tiers).toContain(4)
    expect(tiers).toContain(5)
  })

  it('tier 5 not unlocked at level 17', () => {
    expect(getBasicUnlockedTiers(17)).not.toContain(5)
  })
})

// ============================================
// Tier Requirements Tests
// ============================================

describe('Tier Requirements (getTierRequirements)', () => {
  it('tier 1 has no requirements', () => {
    const req = getTierRequirements(1)
    expect(req.level).toBe(1)
    expect(req.maturePlants).toBe(0)
    expect(req.longestStreak).toBe(0)
  })

  it('tier 2 requires level 7, 1 mature plant, 7-day streak', () => {
    const req = getTierRequirements(2)
    expect(req.level).toBe(7)
    expect(req.maturePlants).toBe(1)
    expect(req.longestStreak).toBe(7)
  })

  it('tier 3 requires level 10, 3 mature plants, 30-day streak', () => {
    const req = getTierRequirements(3)
    expect(req.level).toBe(10)
    expect(req.maturePlants).toBe(3)
    expect(req.longestStreak).toBe(30)
  })

  it('tier 5 has achievements requirement', () => {
    const req = getTierRequirements(5)
    expect(req.achievements).toBeDefined()
    expect(req.achievements).toContain('rose_master')
  })
})

// ============================================
// Tier Info Tests
// ============================================

describe('Tier Info (getTierInfo)', () => {
  it('returns correct info for tier 1', () => {
    const info = getTierInfo(1)
    expect(info.tier).toBe(1)
    expect(info.name).toBe('Forgiving Friends')
    expect(info.nameVi).toBe('Bạn Hiền')
    expect(info.color).toBe('text-green-600')
  })

  it('returns correct info for tier 5', () => {
    const info = getTierInfo(5)
    expect(info.tier).toBe(5)
    expect(info.name).toBe('Garden Legends')
    expect(info.nameVi).toBe('Huyền Thoại')
    expect(info.theme).toBe('Earned, not planted')
  })

  it('each tier has unique color', () => {
    const colors = [1, 2, 3, 4, 5].map((t) => getTierInfo(t as PlantTier).color)
    const uniqueColors = new Set(colors)
    expect(uniqueColors.size).toBe(5)
  })
})

// ============================================
// Slot Availability Check Tests
// ============================================

describe('Slot Availability Check (checkSlotAvailability)', () => {
  it('allows planting when under limit', () => {
    const profile = createMockProfile({ level: 5, max_plants: 2 })
    const result = checkSlotAvailability(profile, 1)

    expect(result.hasSlot).toBe(true)
    expect(result.currentCount).toBe(1)
    expect(result.maxSlots).toBe(2)
    expect(result.message).toBeUndefined()
  })

  it('blocks planting when at limit', () => {
    const profile = createMockProfile({ level: 3, max_plants: 1 })
    const result = checkSlotAvailability(profile, 1)

    expect(result.hasSlot).toBe(false)
    expect(result.message).toBeDefined()
    expect(result.message).toContain('limit')
  })

  it('allows planting when limit is 0 (no plants yet)', () => {
    const profile = createMockProfile({ level: 1, max_plants: 1 })
    const result = checkSlotAvailability(profile, 0)

    expect(result.hasSlot).toBe(true)
  })

  it('uses calculated max_plants when not set in profile', () => {
    const profile = createMockProfile({ level: 6, max_plants: undefined })
    const result = checkSlotAvailability(profile, 2)

    expect(result.maxSlots).toBe(3) // Level 6 = 3 plants
    expect(result.hasSlot).toBe(true)
  })

  it('returns -1 for unlimited slots', () => {
    // max_plants must be undefined to trigger level-based calculation
    const profile = createMockProfile({ level: 15, max_plants: undefined })
    const result = checkSlotAvailability(profile, 10)

    expect(result.maxSlots).toBe(-1) // -1 = unlimited
    expect(result.hasSlot).toBe(true)
  })
})

// ============================================
// Tier Planting Check Tests
// ============================================

describe('Tier Planting Check (canPlantTier)', () => {
  it('allows tier 1 for any user', () => {
    const profile = createMockProfile({ level: 1, total_mature_plants: 0, longest_streak: 0 })
    const result = canPlantTier(profile, 1)

    expect(result.allowed).toBe(true)
    expect(result.missingRequirements).toBeUndefined()
  })

  it('blocks tier 2 for low level user', () => {
    const profile = createMockProfile({ level: 5, total_mature_plants: 0, longest_streak: 0 })
    const result = canPlantTier(profile, 2)

    expect(result.allowed).toBe(false)
    expect(result.missingRequirements).toBeDefined()
    expect(result.missingRequirements).toContain('Level 7 required (current: 5)')
  })

  it('blocks tier 2 when missing mature plants', () => {
    const profile = createMockProfile({ level: 7, total_mature_plants: 0, longest_streak: 7 })
    const result = canPlantTier(profile, 2)

    expect(result.allowed).toBe(false)
    expect(result.missingRequirements?.some((m) => m.includes('mature plants'))).toBe(true)
  })

  it('blocks tier 2 when missing streak', () => {
    const profile = createMockProfile({ level: 7, total_mature_plants: 1, longest_streak: 3 })
    const result = canPlantTier(profile, 2)

    expect(result.allowed).toBe(false)
    expect(result.missingRequirements?.some((m) => m.includes('streak'))).toBe(true)
  })

  it('allows tier 2 when all requirements met', () => {
    const profile = createMockProfile({ level: 7, total_mature_plants: 1, longest_streak: 7 })
    const result = canPlantTier(profile, 2)

    expect(result.allowed).toBe(true)
  })

  it('blocks tier 5 without all requirements', () => {
    const profile = createMockProfile({ level: 18, total_mature_plants: 5, longest_streak: 50 })
    const result = canPlantTier(profile, 5)

    expect(result.allowed).toBe(false)
    expect(result.missingRequirements).toBeDefined()
  })

  it('allows tier 5 when all requirements met', () => {
    const profile = createMockProfile({ level: 18, total_mature_plants: 10, longest_streak: 100 })
    const result = canPlantTier(profile, 5)

    expect(result.allowed).toBe(true)
  })
})

// ============================================
// Tier Unlock Check Tests
// ============================================

describe('Tier Unlock Check (isTierUnlocked)', () => {
  it('returns true when tier is in unlocked_tiers', () => {
    const profile = createMockProfile({ unlocked_tiers: [1, 2, 3] })

    expect(isTierUnlocked(profile, 1)).toBe(true)
    expect(isTierUnlocked(profile, 2)).toBe(true)
    expect(isTierUnlocked(profile, 3)).toBe(true)
  })

  it('returns false when tier is not in unlocked_tiers', () => {
    const profile = createMockProfile({ unlocked_tiers: [1, 2] })

    expect(isTierUnlocked(profile, 4)).toBe(false)
    expect(isTierUnlocked(profile, 5)).toBe(false)
  })

  it('defaults to [1] when unlocked_tiers is undefined', () => {
    const profile = createMockProfile({ unlocked_tiers: undefined })

    expect(isTierUnlocked(profile, 1)).toBe(true)
    expect(isTierUnlocked(profile, 2)).toBe(false)
  })
})

// ============================================
// Progression Fields Calculation Tests
// ============================================

describe('Progression Fields Calculation (calculateProgressionFields)', () => {
  it('calculates fields for seedling user', () => {
    const fields = calculateProgressionFields(3, 0, 3)

    expect(fields.max_plants).toBe(1)
    expect(fields.unlocked_tiers).toEqual([1])
    expect(fields.phase).toBe('seedling')
  })

  it('calculates fields for intermediate user', () => {
    const fields = calculateProgressionFields(8, 2, 14)

    expect(fields.max_plants).toBe(3)
    expect(fields.unlocked_tiers).toContain(1)
    expect(fields.unlocked_tiers).toContain(2)
    expect(fields.phase).toBe('gardener')
  })

  it('calculates fields for advanced user', () => {
    // Tier 5 requires level 18, 10 mature plants, 100-day streak
    const fields = calculateProgressionFields(18, 10, 100)

    expect(fields.max_plants).toBe(999) // Capped at 999 instead of Infinity
    expect(fields.unlocked_tiers).toContain(5)
    expect(fields.phase).toBe('sage')
  })

  it('tier 3 requires all conditions to be met', () => {
    // Level 10, but not enough mature plants
    const fields1 = calculateProgressionFields(10, 1, 30)
    expect(fields1.unlocked_tiers).not.toContain(3)

    // All conditions met
    const fields2 = calculateProgressionFields(10, 3, 30)
    expect(fields2.unlocked_tiers).toContain(3)
  })
})

// ============================================
// Difficulty to Tier Mapping Tests
// ============================================

describe('Difficulty to Tier Mapping (difficultyToTier)', () => {
  it('maps easy to tier 1', () => {
    expect(difficultyToTier('easy')).toBe(1)
  })

  it('maps medium to tier 2', () => {
    expect(difficultyToTier('medium')).toBe(2)
  })

  it('maps hard to tier 3', () => {
    expect(difficultyToTier('hard')).toBe(3)
  })
})

// ============================================
// Tier Unlock Level Tests
// ============================================

describe('Tier Unlock Level (getTierUnlockLevel)', () => {
  it('tier 1 unlocks at level 1', () => {
    expect(getTierUnlockLevel(1)).toBe(1)
  })

  it('tier 2 unlocks at level 7', () => {
    expect(getTierUnlockLevel(2)).toBe(7)
  })

  it('tier 5 unlocks at level 18', () => {
    expect(getTierUnlockLevel(5)).toBe(18)
  })
})

// ============================================
// Garden Size Tests
// ============================================

describe('Garden Size (getGardenSize)', () => {
  it('returns 3x3 for levels 1-5', () => {
    expect(getGardenSize(1)).toBe(3)
    expect(getGardenSize(3)).toBe(3)
    expect(getGardenSize(5)).toBe(3)
  })

  it('returns 5x5 for levels 6-8', () => {
    expect(getGardenSize(6)).toBe(5)
    expect(getGardenSize(7)).toBe(5)
    expect(getGardenSize(8)).toBe(5)
  })

  it('returns 7x7 for levels 9-11', () => {
    expect(getGardenSize(9)).toBe(7)
    expect(getGardenSize(10)).toBe(7)
    expect(getGardenSize(11)).toBe(7)
  })

  it('returns 0 (unlimited) for levels 12+', () => {
    expect(getGardenSize(12)).toBe(0)
    expect(getGardenSize(15)).toBe(0)
    expect(getGardenSize(20)).toBe(0)
  })
})

// ============================================
// Garden Size Name Tests
// ============================================

describe('Garden Size Name (getGardenSizeName)', () => {
  it('returns "Seedling\'s Patch" for levels 1-5', () => {
    expect(getGardenSizeName(1)).toBe("Seedling's Patch")
    expect(getGardenSizeName(5)).toBe("Seedling's Patch")
  })

  it('returns "Gardener\'s Plot" for levels 6-8', () => {
    expect(getGardenSizeName(6)).toBe("Gardener's Plot")
  })

  it('returns "Growing Estate" for levels 9-11', () => {
    expect(getGardenSizeName(9)).toBe('Growing Estate')
  })

  it('returns "Unlimited Garden" for levels 12+', () => {
    expect(getGardenSizeName(12)).toBe('Unlimited Garden')
  })
})

// ============================================
// Level Unlocks Tests
// ============================================

describe('Level Unlocks (getLevelUnlocks)', () => {
  it('level 4 unlocks 2nd plant slot', () => {
    const unlocks = getLevelUnlocks(4)
    expect(unlocks.some((u) => u.name === '2nd Plant Slot')).toBe(true)
  })

  it('level 6 unlocks 3rd slot and 5x5 garden', () => {
    const unlocks = getLevelUnlocks(6)
    expect(unlocks.some((u) => u.name === '3rd Plant Slot')).toBe(true)
    expect(unlocks.some((u) => u.name === '5×5 Garden')).toBe(true)
  })

  it('level 7 unlocks tier 2 plants', () => {
    const unlocks = getLevelUnlocks(7)
    expect(unlocks.some((u) => u.name === 'Tier 2 Plants')).toBe(true)
  })

  it('level 12 unlocks the fifth slot and unlimited garden', () => {
    const unlocks = getLevelUnlocks(12)
    expect(unlocks).toHaveLength(2)
    expect(unlocks.some((u) => u.type === 'slot')).toBe(true)
    expect(unlocks.some((u) => u.type === 'garden')).toBe(true)
  })

  it('level 15 unlocks unlimited slots', () => {
    const unlocks = getLevelUnlocks(15)
    expect(unlocks.some((u) => u.name === 'Unlimited Slots')).toBe(true)
  })

  it('level 3 unlocks the crafting workshop', () => {
    const unlocks = getLevelUnlocks(3)
    expect(unlocks.some((u) => u.name === 'Crafting Workshop')).toBe(true)
  })
})

// ============================================
// Has Level Unlocks Tests
// ============================================

describe('Has Level Unlocks (hasLevelUnlocks)', () => {
  it('returns true for levels with unlocks', () => {
    expect(hasLevelUnlocks(4)).toBe(true)
    expect(hasLevelUnlocks(7)).toBe(true)
    expect(hasLevelUnlocks(12)).toBe(true)
  })

  it('returns false for levels without unlocks', () => {
    expect(hasLevelUnlocks(2)).toBe(false)
    expect(hasLevelUnlocks(3)).toBe(true)
    expect(hasLevelUnlocks(11)).toBe(false)
  })
})

// ============================================
// Next Unlock Level Tests
// ============================================

describe('Next Unlock Level (getNextUnlockLevel)', () => {
  it('returns 4 for level 1', () => {
    expect(getNextUnlockLevel(1)).toBe(4)
  })

  it('returns 5 for level 4', () => {
    expect(getNextUnlockLevel(4)).toBe(5)
  })

  it('returns 6 for level 5', () => {
    expect(getNextUnlockLevel(5)).toBe(6)
  })

  it('returns null for level 18+', () => {
    expect(getNextUnlockLevel(18)).toBeNull()
    expect(getNextUnlockLevel(20)).toBeNull()
  })
})

// ============================================
// Constants Integrity Tests
// ============================================

describe('Constants Integrity', () => {
  it('TIER_REQUIREMENTS has all 5 tiers', () => {
    expect(Object.keys(TIER_REQUIREMENTS)).toHaveLength(5)
    expect(TIER_REQUIREMENTS[1]).toBeDefined()
    expect(TIER_REQUIREMENTS[5]).toBeDefined()
  })

  it('TIER_INFO has all 5 tiers', () => {
    expect(Object.keys(TIER_INFO)).toHaveLength(5)
    expect(TIER_INFO[1]).toBeDefined()
    expect(TIER_INFO[5]).toBeDefined()
  })

  it('tier levels are strictly increasing', () => {
    const levels = [1, 2, 3, 4, 5].map((t) => TIER_REQUIREMENTS[t as PlantTier].level)
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i]).toBeGreaterThan(levels[i - 1])
    }
  })
})

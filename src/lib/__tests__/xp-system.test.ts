import { describe, it, expect } from 'vitest'
import {
  getXpForLevel,
  getXpToNextLevel,
  getLevelFromXp,
  getLevelProgress,
  getLevelInfo,
  getLevelTitle,
  getLevelBadge,
  calculateWateringXp,
  calculateNoteBonus,
  getLevelReward,
  checkLevelUp,
  XP_REWARDS,
  LEVEL_REWARDS,
} from '../xp-system'

// ============================================
// Level Thresholds Tests
// ============================================

describe('Level Thresholds (getXpForLevel)', () => {
  it('level 1 requires 0 XP', () => {
    expect(getXpForLevel(1)).toBe(0)
  })

  it('level 2 requires 100 XP', () => {
    expect(getXpForLevel(2)).toBe(100)
  })

  it('XP requirements increase with each level', () => {
    const lvl2 = getXpForLevel(2)
    const lvl3 = getXpForLevel(3)
    const lvl4 = getXpForLevel(4)

    expect(lvl3).toBeGreaterThan(lvl2)
    expect(lvl4).toBeGreaterThan(lvl3)
  })

  it('higher levels require significantly more XP', () => {
    const lvl5 = getXpForLevel(5)
    const lvl10 = getXpForLevel(10)
    const lvl15 = getXpForLevel(15)

    expect(lvl10).toBeGreaterThan(lvl5 * 2) // At least double
    expect(lvl15).toBeGreaterThan(lvl10 * 2) // At least double
  })

  it('handles edge cases', () => {
    expect(getXpForLevel(0)).toBe(0)
    expect(getXpForLevel(-1)).toBe(0)
  })
})

// ============================================
// XP to Next Level Tests
// ============================================

describe('XP to Next Level (getXpToNextLevel)', () => {
  it('level 1 to 2 requires 100 XP', () => {
    expect(getXpToNextLevel(1)).toBe(100)
  })

  it('XP requirements scale exponentially', () => {
    const lvl1To2 = getXpToNextLevel(1)
    const lvl2To3 = getXpToNextLevel(2)
    const lvl3To4 = getXpToNextLevel(3)

    expect(lvl2To3).toBeGreaterThan(lvl1To2)
    expect(lvl3To4).toBeGreaterThan(lvl2To3)
  })

  it('follows 1.5x multiplier pattern', () => {
    const lvl1 = getXpToNextLevel(1)
    const lvl2 = getXpToNextLevel(2)

    // Should be approximately 1.5x (with rounding)
    expect(lvl2).toBe(Math.floor(100 * 1.5))
  })
})

// ============================================
// Level from XP Tests
// ============================================

describe('Level from XP (getLevelFromXp)', () => {
  it('0 XP = level 1', () => {
    expect(getLevelFromXp(0)).toBe(1)
  })

  it('50 XP = level 1 (not enough for level 2)', () => {
    expect(getLevelFromXp(50)).toBe(1)
  })

  it('100 XP = level 2', () => {
    expect(getLevelFromXp(100)).toBe(2)
  })

  it('99 XP = still level 1', () => {
    expect(getLevelFromXp(99)).toBe(1)
  })

  it('handles large XP values', () => {
    const level = getLevelFromXp(10000)
    expect(level).toBeGreaterThan(5)
    expect(level).toBeLessThan(20) // Reasonable bounds
  })

  it('is consistent with getXpForLevel', () => {
    // If we have exactly enough XP for level 5, we should be level 5
    const xpForLevel5 = getXpForLevel(5)
    expect(getLevelFromXp(xpForLevel5)).toBe(5)

    // Just under level 5 should be level 4
    expect(getLevelFromXp(xpForLevel5 - 1)).toBe(4)
  })
})

// ============================================
// Level Progress Tests
// ============================================

describe('Level Progress (getLevelProgress)', () => {
  it('0 XP = 0% progress', () => {
    expect(getLevelProgress(0)).toBe(0)
  })

  it('50 XP = 50% progress to level 2', () => {
    // Level 1 needs 100 XP to reach level 2
    expect(getLevelProgress(50)).toBe(50)
  })

  it('progress resets at level boundary', () => {
    // At 100 XP, we're at level 2 with 0% progress
    const xpForLevel2 = getXpForLevel(2)
    expect(getLevelProgress(xpForLevel2)).toBe(0)
  })

  it('calculates mid-level progress correctly', () => {
    const xpForLevel2 = getXpForLevel(2)
    const xpToLevel3 = getXpToNextLevel(2)
    const midPoint = xpForLevel2 + Math.floor(xpToLevel3 / 2)

    const progress = getLevelProgress(midPoint)
    expect(progress).toBeGreaterThan(45)
    expect(progress).toBeLessThan(55)
  })

  it('caps at 100%', () => {
    expect(getLevelProgress(999999)).toBeLessThanOrEqual(100)
  })
})

// ============================================
// Level Info Tests
// ============================================

describe('Level Info (getLevelInfo)', () => {
  it('returns correct info for level 1', () => {
    const info = getLevelInfo(0)

    expect(info.level).toBe(1)
    expect(info.totalXp).toBe(0)
    expect(info.xpInCurrentLevel).toBe(0)
    expect(info.xpToNextLevel).toBe(100)
    expect(info.progress).toBe(0)
    expect(info.title).toBeDefined()
    expect(info.badge).toBeDefined()
  })

  it('returns correct info for level 2', () => {
    const info = getLevelInfo(100)

    expect(info.level).toBe(2)
    expect(info.xpInCurrentLevel).toBe(0)
  })

  it('includes title and badge', () => {
    const info = getLevelInfo(500)

    expect(typeof info.title).toBe('string')
    expect(info.title.length).toBeGreaterThan(0)
    expect(typeof info.badge).toBe('string')
  })
})

// ============================================
// Level Titles and Badges Tests
// ============================================

describe('Level Titles (getLevelTitle)', () => {
  it('level 1 is Seedling', () => {
    expect(getLevelTitle(1)).toBe('Seedling')
  })

  it('level 10 is Botanical Sage', () => {
    expect(getLevelTitle(10)).toBe('Botanical Sage')
  })

  it('level 15 is Eden Creator', () => {
    expect(getLevelTitle(15)).toBe('Eden Creator')
  })

  it('levels beyond 15 have numbered titles', () => {
    expect(getLevelTitle(16)).toBe('Eden Creator 2')
    expect(getLevelTitle(17)).toBe('Eden Creator 3')
  })
})

describe('Level Badges (getLevelBadge)', () => {
  it('level 1 is a seedling emoji', () => {
    expect(getLevelBadge(1)).toBe('🌱')
  })

  it('level 10 is sparkles', () => {
    expect(getLevelBadge(10)).toBe('✨')
  })

  it('level 15 is crown', () => {
    expect(getLevelBadge(15)).toBe('👑')
  })

  it('levels beyond 15 use crown', () => {
    expect(getLevelBadge(20)).toBe('👑')
  })
})

// ============================================
// Watering XP Calculation Tests
// ============================================

describe('Watering XP Calculation (calculateWateringXp)', () => {
  it('base watering gives 10 XP', () => {
    const result = calculateWateringXp({ streak: 0, isMorning: false })

    expect(result.breakdown.base).toBe(10)
    expect(result.total).toBe(10)
  })

  it('morning bonus adds 5 XP', () => {
    const result = calculateWateringXp({ streak: 0, isMorning: true })

    expect(result.breakdown.morningBonus).toBe(5)
    expect(result.total).toBe(15)
  })

  it('3-day streak adds 5 XP', () => {
    const result = calculateWateringXp({ streak: 3, isMorning: false })

    expect(result.breakdown.streakBonus).toBe(5)
    expect(result.total).toBe(15)
  })

  it('7-day streak adds 15 XP', () => {
    const result = calculateWateringXp({ streak: 7, isMorning: false })

    expect(result.breakdown.streakBonus).toBe(15)
    expect(result.total).toBe(25)
  })

  it('14-day streak adds 30 XP', () => {
    const result = calculateWateringXp({ streak: 14, isMorning: false })

    expect(result.breakdown.streakBonus).toBe(30)
    expect(result.total).toBe(40)
  })

  it('30-day streak adds 50 XP', () => {
    const result = calculateWateringXp({ streak: 30, isMorning: false })

    expect(result.breakdown.streakBonus).toBe(50)
    expect(result.total).toBe(60)
  })

  it('hard difficulty adds 10 XP', () => {
    const result = calculateWateringXp({ streak: 0, isMorning: false, difficulty: 'hard' })

    expect(result.breakdown.difficultyBonus).toBe(10)
    expect(result.total).toBe(20)
  })

  it('medium difficulty adds 5 XP', () => {
    const result = calculateWateringXp({ streak: 0, isMorning: false, difficulty: 'medium' })

    expect(result.breakdown.difficultyBonus).toBe(5)
    expect(result.total).toBe(15)
  })

  it('rainbow day adds 20 XP', () => {
    const result = calculateWateringXp({ streak: 0, isMorning: false, isRainbowDay: true })

    expect(result.breakdown.weatherBonus).toBe(20)
    expect(result.total).toBe(30)
  })

  it('rainy day adds 5 XP', () => {
    const result = calculateWateringXp({ streak: 0, isMorning: false, isRainyDay: true })

    expect(result.breakdown.weatherBonus).toBe(5)
    expect(result.total).toBe(15)
  })

  it('rainbow day takes precedence over rainy day', () => {
    const result = calculateWateringXp({
      streak: 0,
      isMorning: false,
      isRainbowDay: true,
      isRainyDay: true,
    })

    expect(result.breakdown.weatherBonus).toBe(20) // Rainbow, not rainy
  })

  it('stacks all bonuses correctly', () => {
    const result = calculateWateringXp({
      streak: 7,
      isMorning: true,
      difficulty: 'hard',
      isRainbowDay: true,
    })

    // Base: 10 + Morning: 5 + Streak (7-day): 15 + Difficulty: 10 + Weather: 20 = 60
    expect(result.total).toBe(60)
  })

  it('special effect bonus multiplies total', () => {
    const result = calculateWateringXp({
      streak: 0,
      isMorning: false,
      specialEffectBonus: 50, // 50% bonus
    })

    // Base: 10, then +5 from special effect (50% of 10)
    expect(result.breakdown.specialEffectBonus).toBe(5)
    expect(result.total).toBe(15)
  })

  it('streak between thresholds uses lower tier', () => {
    // 5 days is between 3 and 7, should get 3-day bonus
    const result = calculateWateringXp({ streak: 5, isMorning: false })
    expect(result.breakdown.streakBonus).toBe(5) // 3-day bonus

    // 10 days is between 7 and 14, should get 7-day bonus
    const result2 = calculateWateringXp({ streak: 10, isMorning: false })
    expect(result2.breakdown.streakBonus).toBe(15) // 7-day bonus
  })
})

// ============================================
// Note Bonus Calculation Tests
// ============================================

describe('Note Bonus Calculation (calculateNoteBonus)', () => {
  it('no note = no bonus', () => {
    const result = calculateNoteBonus({ noteLength: 0, journalStreak: 0 })

    expect(result.total).toBe(0)
  })

  it('any note adds 3 XP base', () => {
    const result = calculateNoteBonus({ noteLength: 10, journalStreak: 0 })

    expect(result.breakdown.noteBase).toBe(3)
    expect(result.total).toBe(3)
  })

  it('notes > 50 chars add thoughtful bonus', () => {
    const result = calculateNoteBonus({ noteLength: 60, journalStreak: 0 })

    expect(result.breakdown.noteBase).toBe(3)
    expect(result.breakdown.thoughtfulNote).toBe(2)
    expect(result.total).toBe(5)
  })

  it('notes > 100 chars add detailed bonus', () => {
    const result = calculateNoteBonus({ noteLength: 120, journalStreak: 0 })

    expect(result.breakdown.noteBase).toBe(3)
    expect(result.breakdown.thoughtfulNote).toBe(2)
    expect(result.breakdown.detailedNote).toBe(2)
    expect(result.total).toBe(7)
  })

  it('3-day journal streak adds 3 XP', () => {
    const result = calculateNoteBonus({ noteLength: 10, journalStreak: 3 })

    expect(result.breakdown.journalStreakBonus).toBe(3)
    expect(result.total).toBe(6) // 3 base + 3 streak
  })

  it('7-day journal streak adds 5 XP', () => {
    const result = calculateNoteBonus({ noteLength: 10, journalStreak: 7 })

    expect(result.breakdown.journalStreakBonus).toBe(5)
    expect(result.total).toBe(8)
  })

  it('14-day journal streak adds 8 XP', () => {
    const result = calculateNoteBonus({ noteLength: 10, journalStreak: 14 })

    expect(result.breakdown.journalStreakBonus).toBe(8)
    expect(result.total).toBe(11)
  })

  it('30-day journal streak adds 12 XP', () => {
    const result = calculateNoteBonus({ noteLength: 10, journalStreak: 30 })

    expect(result.breakdown.journalStreakBonus).toBe(12)
    expect(result.total).toBe(15)
  })

  it('no journal streak bonus if no note', () => {
    const result = calculateNoteBonus({ noteLength: 0, journalStreak: 30 })

    expect(result.breakdown.journalStreakBonus).toBeUndefined()
    expect(result.total).toBe(0)
  })

  it('stacks all note bonuses', () => {
    const result = calculateNoteBonus({ noteLength: 150, journalStreak: 30 })

    // Base: 3 + Thoughtful: 2 + Detailed: 2 + Journal streak (30): 12 = 19
    expect(result.total).toBe(19)
  })
})

// ============================================
// Level Rewards Tests
// ============================================

describe('Level Rewards (getLevelReward)', () => {
  it('returns null for level 1', () => {
    expect(getLevelReward(1)).toBeNull()
  })

  it('returns reward for level 2', () => {
    const reward = getLevelReward(2)

    expect(reward).not.toBeNull()
    expect(reward?.level).toBe(2)
    expect(reward?.title).toBeDefined()
    expect(reward?.reward).toContain('Water Reserve')
  })

  it('returns reward for level 5', () => {
    const reward = getLevelReward(5)

    expect(reward).not.toBeNull()
    expect(reward?.level).toBe(5)
    expect(reward?.unlocks).toBeDefined()
  })

  it('returns null for levels without rewards', () => {
    expect(getLevelReward(4)).toBeNull()
    expect(getLevelReward(6)).toBeNull()
    expect(getLevelReward(8)).toBeNull()
  })

  it('level 15 has all features unlocked', () => {
    const reward = getLevelReward(15)

    expect(reward).not.toBeNull()
    expect(reward?.unlocks).toContain('All features unlocked')
  })
})

// ============================================
// Level Up Detection Tests
// ============================================

describe('Level Up Detection (checkLevelUp)', () => {
  it('detects level up from 1 to 2', () => {
    const result = checkLevelUp(0, 100)

    expect(result.leveledUp).toBe(true)
    expect(result.newLevel).toBe(2)
  })

  it('no level up when under threshold', () => {
    const result = checkLevelUp(0, 50)

    expect(result.leveledUp).toBe(false)
    expect(result.newLevel).toBe(1)
  })

  it('detects multiple level ups', () => {
    const result = checkLevelUp(0, 500)

    expect(result.leveledUp).toBe(true)
    expect(result.newLevel).toBeGreaterThan(2)
  })

  it('returns reward if available', () => {
    const result = checkLevelUp(0, 100)

    expect(result.reward).not.toBeNull()
    expect(result.reward?.level).toBe(2)
  })

  it('no level up when already at level', () => {
    const xpForLevel3 = getXpForLevel(3)
    const result = checkLevelUp(xpForLevel3, xpForLevel3 + 10)

    expect(result.leveledUp).toBe(false)
    expect(result.newLevel).toBe(3)
  })

  it('detects level up at exact threshold', () => {
    const xpForLevel2 = getXpForLevel(2)
    const result = checkLevelUp(0, xpForLevel2)

    expect(result.leveledUp).toBe(true)
    expect(result.newLevel).toBe(2)
  })
})

// ============================================
// XP Rewards Constants Tests
// ============================================

describe('XP Rewards Constants', () => {
  it('has all expected reward types', () => {
    expect(XP_REWARDS.WATER_PLANT).toBeDefined()
    expect(XP_REWARDS.STREAK_3_DAYS).toBeDefined()
    expect(XP_REWARDS.STREAK_7_DAYS).toBeDefined()
    expect(XP_REWARDS.STREAK_14_DAYS).toBeDefined()
    expect(XP_REWARDS.STREAK_30_DAYS).toBeDefined()
    expect(XP_REWARDS.MORNING_BONUS).toBeDefined()
    expect(XP_REWARDS.HARD_DAY_BONUS).toBeDefined()
    expect(XP_REWARDS.PLANT_MATURED).toBeDefined()
    expect(XP_REWARDS.RAINBOW_DAY_BONUS).toBeDefined()
    expect(XP_REWARDS.NOTE_BASE_BONUS).toBeDefined()
  })

  it('streak bonuses increase with streak length', () => {
    expect(XP_REWARDS.STREAK_7_DAYS).toBeGreaterThan(XP_REWARDS.STREAK_3_DAYS)
    expect(XP_REWARDS.STREAK_14_DAYS).toBeGreaterThan(XP_REWARDS.STREAK_7_DAYS)
    expect(XP_REWARDS.STREAK_30_DAYS).toBeGreaterThan(XP_REWARDS.STREAK_14_DAYS)
  })

  it('achievement tiers increase in value', () => {
    expect(XP_REWARDS.ACHIEVEMENT_TIER_2).toBeGreaterThan(XP_REWARDS.ACHIEVEMENT_TIER_1)
    expect(XP_REWARDS.ACHIEVEMENT_TIER_3).toBeGreaterThan(XP_REWARDS.ACHIEVEMENT_TIER_2)
    expect(XP_REWARDS.ACHIEVEMENT_TIER_4).toBeGreaterThan(XP_REWARDS.ACHIEVEMENT_TIER_3)
  })
})

// ============================================
// Level Rewards Array Tests
// ============================================

describe('Level Rewards Array', () => {
  it('has expected number of rewards', () => {
    expect(LEVEL_REWARDS.length).toBeGreaterThanOrEqual(5)
  })

  it('rewards are sorted by level', () => {
    for (let i = 1; i < LEVEL_REWARDS.length; i++) {
      expect(LEVEL_REWARDS[i].level).toBeGreaterThan(LEVEL_REWARDS[i - 1].level)
    }
  })

  it('all rewards have required fields', () => {
    for (const reward of LEVEL_REWARDS) {
      expect(reward.level).toBeDefined()
      expect(reward.title).toBeDefined()
      expect(reward.description).toBeDefined()
      expect(reward.reward).toBeDefined()
    }
  })
})

// ============================================
// Level Cap Tests (Subscription Tiers)
// ============================================

describe('Level Cap Functionality', () => {
  describe('getLevelFromXp with maxLevel', () => {
    it('returns capped level when XP exceeds cap', () => {
      // XP for level 15 is quite high, let's use a smaller cap
      const xpForLevel12 = getXpForLevel(12)
      const level = getLevelFromXp(xpForLevel12 + 1000, 10)

      expect(level).toBe(10)
    })

    it('returns uncapped level when under cap', () => {
      const xpForLevel5 = getXpForLevel(5) + 50
      const level = getLevelFromXp(xpForLevel5, 10)

      expect(level).toBe(5)
    })

    it('returns level at cap when exactly at cap', () => {
      const xpForLevel10 = getXpForLevel(10)
      const level = getLevelFromXp(xpForLevel10, 10)

      expect(level).toBe(10)
    })

    it('returns normal level without cap', () => {
      const xpForLevel12 = getXpForLevel(12)
      const level = getLevelFromXp(xpForLevel12)

      expect(level).toBe(12)
    })
  })

  describe('getLevelProgress with maxLevel', () => {
    it('returns 100% when at level cap', () => {
      const xpForLevel12 = getXpForLevel(12)
      const progress = getLevelProgress(xpForLevel12, 10)

      expect(progress).toBe(100)
    })

    it('returns normal progress when under cap', () => {
      const xpForLevel5 = getXpForLevel(5)
      const progress = getLevelProgress(xpForLevel5 + 50, 10)

      // Should be between 0 and 100
      expect(progress).toBeGreaterThan(0)
      expect(progress).toBeLessThan(100)
    })
  })

  describe('getLevelInfo with maxLevel', () => {
    it('includes isAtCap when at level cap', () => {
      const xpForLevel12 = getXpForLevel(12)
      const info = getLevelInfo(xpForLevel12, 10)

      expect(info.level).toBe(10)
      expect(info.isAtCap).toBe(true)
      expect(info.maxLevel).toBe(10)
      expect(info.progress).toBe(100)
    })

    it('isAtCap is false when under cap', () => {
      const xpForLevel5 = getXpForLevel(5)
      const info = getLevelInfo(xpForLevel5, 10)

      expect(info.level).toBe(5)
      expect(info.isAtCap).toBe(false)
    })

    it('isAtCap is undefined without cap', () => {
      const xpForLevel5 = getXpForLevel(5)
      const info = getLevelInfo(xpForLevel5)

      expect(info.isAtCap).toBe(false)
    })
  })

  describe('checkLevelUp with maxLevel', () => {
    it('detects hitting level cap', () => {
      const xpForLevel9 = getXpForLevel(9)
      const xpForLevel11 = getXpForLevel(11)
      const result = checkLevelUp(xpForLevel9, xpForLevel11, 10)

      expect(result.leveledUp).toBe(true)
      expect(result.newLevel).toBe(10)
      expect(result.hitLevelCap).toBe(true)
      expect(result.uncappedLevel).toBe(11)
    })

    it('does not indicate cap hit when under cap', () => {
      const xpForLevel3 = getXpForLevel(3)
      const xpForLevel5 = getXpForLevel(5)
      const result = checkLevelUp(xpForLevel3, xpForLevel5, 10)

      expect(result.leveledUp).toBe(true)
      expect(result.newLevel).toBe(5)
      expect(result.hitLevelCap).toBe(false)
    })

    it('still reports level up when going to cap', () => {
      const xpForLevel9 = getXpForLevel(9)
      const xpForLevel10 = getXpForLevel(10)
      const result = checkLevelUp(xpForLevel9, xpForLevel10, 10)

      expect(result.leveledUp).toBe(true)
      expect(result.newLevel).toBe(10)
      // Exactly at cap, not beyond
      expect(result.hitLevelCap).toBe(false)
    })

    it('works without maxLevel parameter', () => {
      const result = checkLevelUp(0, 100)

      expect(result.leveledUp).toBe(true)
      expect(result.newLevel).toBe(2)
      expect(result.hitLevelCap).toBe(false)
    })
  })
})

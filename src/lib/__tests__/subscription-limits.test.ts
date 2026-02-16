import { describe, it, expect } from 'vitest'
import {
  getTierLimits,
  getTierDisplayInfo,
  hasFeature,
  canAddPlant,
  canPlantTierLevel,
  canAddGoal,
  isWithinLevelCap,
  applyXpMultiplier,
  getRemainingPlantSlots,
  getRemainingGoalSlots,
  getUpgradePrompt,
  isTierHigher,
  getRequiredTierForFeature,
  getMinimumSubscriptionForPlantTier,
  TIER_LIMITS,
  TIER_INFO,
  TIER_PRICING,
} from '../subscription-limits'

describe('subscription-limits', () => {
  describe('TIER_LIMITS', () => {
    it('should have correct free tier limits', () => {
      const free = TIER_LIMITS.free
      expect(free.maxPlants).toBe(3)
      expect(free.maxTier).toBe(2)
      expect(free.gardenSize).toBe(3)
      expect(free.maxGoals).toBe(0)
      expect(free.hasGoals).toBe(false)
      expect(free.hasIdentity).toBe(false)
      expect(free.levelCap).toBe(10)
      expect(free.xpMultiplier).toBe(1.0)
      expect(free.hasAds).toBe(true)
    })

    it('should have correct pro tier limits', () => {
      const pro = TIER_LIMITS.pro
      expect(pro.maxPlants).toBe(8)
      expect(pro.maxTier).toBe(4)
      expect(pro.gardenSize).toBe(5)
      expect(pro.maxGoals).toBe(5)
      expect(pro.hasGoals).toBe(true)
      expect(pro.hasIdentity).toBe(false)
      expect(pro.levelCap).toBe(15)
      expect(pro.xpMultiplier).toBe(1.2)
      expect(pro.hasAds).toBe(false)
    })

    it('should have correct premium tier limits', () => {
      const premium = TIER_LIMITS.premium
      expect(premium.maxPlants).toBe(-1) // unlimited
      expect(premium.maxTier).toBe(5)
      expect(premium.gardenSize).toBe(7)
      expect(premium.maxGoals).toBe(-1) // unlimited
      expect(premium.hasGoals).toBe(true)
      expect(premium.hasIdentity).toBe(true)
      expect(premium.levelCap).toBe(20)
      expect(premium.xpMultiplier).toBe(1.5)
      expect(premium.hasAds).toBe(false)
      expect(premium.earlyAccess).toBe(true)
      expect(premium.aiSuggestions).toBe(true)
    })
  })

  describe('TIER_INFO', () => {
    it('should have correct tier display info', () => {
      expect(TIER_INFO.free.name).toBe('Seedling')
      expect(TIER_INFO.free.icon).toBe('🌱')

      expect(TIER_INFO.pro.name).toBe('Gardener')
      expect(TIER_INFO.pro.icon).toBe('🌿')

      expect(TIER_INFO.premium.name).toBe('Sage')
      expect(TIER_INFO.premium.icon).toBe('🌳')
    })
  })

  describe('TIER_PRICING', () => {
    it('should have correct pro pricing', () => {
      expect(TIER_PRICING.pro.monthly.usd).toBe(499)
      expect(TIER_PRICING.pro.yearly.usd).toBe(4799)
    })

    it('should have correct premium pricing', () => {
      expect(TIER_PRICING.premium.monthly.usd).toBe(999)
      expect(TIER_PRICING.premium.yearly.usd).toBe(9599)
    })
  })

  describe('getTierLimits', () => {
    it('should return correct limits for each tier', () => {
      expect(getTierLimits('free').maxPlants).toBe(3)
      expect(getTierLimits('pro').maxPlants).toBe(8)
      expect(getTierLimits('premium').maxPlants).toBe(-1)
    })

    it('should return free tier for unknown tier', () => {
      // @ts-expect-error Testing invalid input
      expect(getTierLimits('unknown').maxPlants).toBe(3)
    })
  })

  describe('getTierDisplayInfo', () => {
    it('should return correct display info', () => {
      expect(getTierDisplayInfo('free').name).toBe('Seedling')
      expect(getTierDisplayInfo('pro').name).toBe('Gardener')
      expect(getTierDisplayInfo('premium').name).toBe('Sage')
    })
  })

  describe('hasFeature', () => {
    it('should correctly check feature access for free tier', () => {
      expect(hasFeature('free', 'goals')).toBe(false)
      expect(hasFeature('free', 'identity')).toBe(false)
      expect(hasFeature('free', 'metrics')).toBe(false)
      expect(hasFeature('free', 'backfill')).toBe(false)
    })

    it('should correctly check feature access for pro tier', () => {
      expect(hasFeature('pro', 'goals')).toBe(true)
      expect(hasFeature('pro', 'identity')).toBe(false)
      expect(hasFeature('pro', 'metrics')).toBe(true)
      expect(hasFeature('pro', 'backfill')).toBe(true)
    })

    it('should correctly check feature access for premium tier', () => {
      expect(hasFeature('premium', 'goals')).toBe(true)
      expect(hasFeature('premium', 'identity')).toBe(true)
      expect(hasFeature('premium', 'metrics')).toBe(true)
      expect(hasFeature('premium', 'backfill')).toBe(true)
      expect(hasFeature('premium', 'ai_suggestions')).toBe(true)
    })
  })

  describe('canAddPlant', () => {
    it('should allow adding plants within limit for free tier', () => {
      expect(canAddPlant('free', 0)).toBe(true)
      expect(canAddPlant('free', 1)).toBe(true)
      expect(canAddPlant('free', 2)).toBe(true)
      expect(canAddPlant('free', 3)).toBe(false)
      expect(canAddPlant('free', 5)).toBe(false)
    })

    it('should allow adding plants within limit for pro tier', () => {
      expect(canAddPlant('pro', 0)).toBe(true)
      expect(canAddPlant('pro', 7)).toBe(true)
      expect(canAddPlant('pro', 8)).toBe(false)
    })

    it('should always allow adding plants for premium tier', () => {
      expect(canAddPlant('premium', 0)).toBe(true)
      expect(canAddPlant('premium', 100)).toBe(true)
      expect(canAddPlant('premium', 1000)).toBe(true)
    })
  })

  describe('canPlantTierLevel', () => {
    it('should check plant tier access for free tier', () => {
      expect(canPlantTierLevel('free', 1)).toBe(true)
      expect(canPlantTierLevel('free', 2)).toBe(true)
      expect(canPlantTierLevel('free', 3)).toBe(false)
      expect(canPlantTierLevel('free', 4)).toBe(false)
      expect(canPlantTierLevel('free', 5)).toBe(false)
    })

    it('should check plant tier access for pro tier', () => {
      expect(canPlantTierLevel('pro', 1)).toBe(true)
      expect(canPlantTierLevel('pro', 4)).toBe(true)
      expect(canPlantTierLevel('pro', 5)).toBe(false)
    })

    it('should check plant tier access for premium tier', () => {
      expect(canPlantTierLevel('premium', 1)).toBe(true)
      expect(canPlantTierLevel('premium', 5)).toBe(true)
    })
  })

  describe('canAddGoal', () => {
    it('should not allow goals for free tier', () => {
      expect(canAddGoal('free', 0)).toBe(false)
    })

    it('should allow goals within limit for pro tier', () => {
      expect(canAddGoal('pro', 0)).toBe(true)
      expect(canAddGoal('pro', 4)).toBe(true)
      expect(canAddGoal('pro', 5)).toBe(false)
    })

    it('should always allow goals for premium tier', () => {
      expect(canAddGoal('premium', 0)).toBe(true)
      expect(canAddGoal('premium', 100)).toBe(true)
    })
  })

  describe('isWithinLevelCap', () => {
    it('should check level cap for each tier', () => {
      expect(isWithinLevelCap('free', 10)).toBe(true)
      expect(isWithinLevelCap('free', 11)).toBe(false)

      expect(isWithinLevelCap('pro', 15)).toBe(true)
      expect(isWithinLevelCap('pro', 16)).toBe(false)

      expect(isWithinLevelCap('premium', 20)).toBe(true)
      expect(isWithinLevelCap('premium', 21)).toBe(false)
    })
  })

  describe('applyXpMultiplier', () => {
    it('should apply correct multiplier for each tier', () => {
      expect(applyXpMultiplier('free', 100)).toBe(100)
      expect(applyXpMultiplier('pro', 100)).toBe(120)
      expect(applyXpMultiplier('premium', 100)).toBe(150)
    })

    it('should floor the result', () => {
      expect(applyXpMultiplier('pro', 10)).toBe(12)
      expect(applyXpMultiplier('premium', 10)).toBe(15)
    })
  })

  describe('getRemainingPlantSlots', () => {
    it('should return remaining slots for limited tiers', () => {
      expect(getRemainingPlantSlots('free', 0)).toBe(3)
      expect(getRemainingPlantSlots('free', 2)).toBe(1)
      expect(getRemainingPlantSlots('free', 3)).toBe(0)
      expect(getRemainingPlantSlots('free', 5)).toBe(0)

      expect(getRemainingPlantSlots('pro', 5)).toBe(3)
    })

    it('should return unlimited for premium tier', () => {
      expect(getRemainingPlantSlots('premium', 0)).toBe('unlimited')
      expect(getRemainingPlantSlots('premium', 100)).toBe('unlimited')
    })
  })

  describe('getRemainingGoalSlots', () => {
    it('should return 0 for free tier', () => {
      expect(getRemainingGoalSlots('free', 0)).toBe(0)
    })

    it('should return remaining slots for pro tier', () => {
      expect(getRemainingGoalSlots('pro', 0)).toBe(5)
      expect(getRemainingGoalSlots('pro', 3)).toBe(2)
      expect(getRemainingGoalSlots('pro', 5)).toBe(0)
    })

    it('should return unlimited for premium tier', () => {
      expect(getRemainingGoalSlots('premium', 0)).toBe('unlimited')
    })
  })

  describe('getUpgradePrompt', () => {
    it('should return correct prompt for level 6 trigger', () => {
      const prompt = getUpgradePrompt('level_6_goals')
      expect(prompt.targetTier).toBe('pro')
      expect(prompt.hasTrial).toBe(true)
      expect(prompt.benefits.length).toBeGreaterThan(0)
    })

    it('should return correct prompt for level 13 trigger', () => {
      const prompt = getUpgradePrompt('level_13_identity')
      expect(prompt.targetTier).toBe('premium')
      expect(prompt.hasTrial).toBe(false)
    })

    it('should return correct prompt for plant limit trigger', () => {
      const prompt = getUpgradePrompt('plant_limit')
      expect(prompt.targetTier).toBe('pro')
    })

    it('should include context in tier limit prompt', () => {
      const prompt = getUpgradePrompt('tier_limit', 'Rose')
      expect(prompt.title).toContain('Rose')
    })
  })

  describe('isTierHigher', () => {
    it('should correctly compare tiers', () => {
      expect(isTierHigher('pro', 'free')).toBe(true)
      expect(isTierHigher('premium', 'free')).toBe(true)
      expect(isTierHigher('premium', 'pro')).toBe(true)

      expect(isTierHigher('free', 'pro')).toBe(false)
      expect(isTierHigher('pro', 'premium')).toBe(false)
      expect(isTierHigher('free', 'free')).toBe(false)
    })
  })

  describe('getRequiredTierForFeature', () => {
    it('should return correct required tier for features', () => {
      expect(getRequiredTierForFeature('goals')).toBe('pro')
      expect(getRequiredTierForFeature('identity')).toBe('premium')
      expect(getRequiredTierForFeature('metrics')).toBe('pro')
      expect(getRequiredTierForFeature('ai_suggestions')).toBe('premium')
    })
  })

  describe('getMinimumSubscriptionForPlantTier', () => {
    it('should return correct subscription for plant tier', () => {
      expect(getMinimumSubscriptionForPlantTier(1)).toBe('free')
      expect(getMinimumSubscriptionForPlantTier(2)).toBe('free')
      expect(getMinimumSubscriptionForPlantTier(3)).toBe('pro')
      expect(getMinimumSubscriptionForPlantTier(4)).toBe('pro')
      expect(getMinimumSubscriptionForPlantTier(5)).toBe('premium')
    })
  })
})

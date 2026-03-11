/**
 * Subscription Tier Limits System
 *
 * Manages feature access and limits based on subscription tier (FREE, PRO, PREMIUM)
 * Works alongside the level-based progression system
 */

export type SubscriptionTier = 'free' | 'pro' | 'premium'

export interface TierLimits {
  // Plants & Garden
  maxPlants: number // -1 = unlimited
  maxTier: number // Plant tier limit (1-5)
  gardenSize: number // 3, 5, 7 or 0 for dynamic

  // Goals
  maxGoals: number // -1 = unlimited
  hasGoals: boolean
  hasIdentity: boolean
  hasMetrics: boolean
  hasWeeklyReports: boolean

  // Watering
  backfillDays: number
  quickNoteChars: number // -1 = unlimited

  // Gamification
  levelCap: number
  xpMultiplier: number

  // App Features
  hasAds: boolean
  themes: string[]
  decorations: string[]
  offlineDays: number
  devices: number // -1 = unlimited

  // Decorations & Crafting
  maxPlacedDecorations: number // max decorations on grid
  hasCrafting: boolean
  hasShop: boolean

  // Premium only
  earlyAccess?: boolean
  prioritySupport?: boolean
  aiSuggestions?: boolean
}

/**
 * Static tier limits (fallback when DB is unavailable)
 */
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxPlants: 3,
    maxTier: 2,
    gardenSize: 3,
    maxGoals: 0,
    hasGoals: false,
    hasIdentity: false,
    hasMetrics: false,
    hasWeeklyReports: false,
    backfillDays: 0,
    quickNoteChars: 50,
    levelCap: 10,
    xpMultiplier: 1.0,
    hasAds: true,
    themes: ['default'],
    decorations: ['basic'],
    offlineDays: 0,
    devices: 1,
  },
  pro: {
    maxPlants: 8,
    maxTier: 4,
    gardenSize: 5,
    maxGoals: 5,
    hasGoals: true,
    hasIdentity: false,
    hasMetrics: true,
    hasWeeklyReports: true,
    backfillDays: 3,
    quickNoteChars: 500,
    levelCap: 15,
    xpMultiplier: 1.2,
    hasAds: false,
    themes: ['default', 'forest', 'desert', 'ocean', 'mountain', 'zen'],
    decorations: ['basic', 'advanced'],
    offlineDays: 3,
    devices: 3,
  },
  premium: {
    maxPlants: -1,
    maxTier: 5,
    gardenSize: 7,
    maxGoals: -1,
    hasGoals: true,
    hasIdentity: true,
    hasMetrics: true,
    hasWeeklyReports: true,
    backfillDays: 7,
    quickNoteChars: -1,
    levelCap: 20,
    xpMultiplier: 1.5,
    hasAds: false,
    themes: ['all'],
    decorations: ['all'],
    offlineDays: 30,
    devices: -1,
    earlyAccess: true,
    prioritySupport: true,
    aiSuggestions: true,
  },
}

/**
 * Tier display information
 */
export const TIER_INFO: Record<SubscriptionTier, { name: string; tagline: string; icon: string }> = {
  free: { name: 'Seedling', tagline: 'Bắt đầu thói quen', icon: '🌱' },
  pro: { name: 'Gardener', tagline: 'Đạt mục tiêu', icon: '🌿' },
  premium: { name: 'Sage', tagline: 'Trở thành ai đó', icon: '🌳' },
}

/**
 * Tier pricing (in cents)
 */
export const TIER_PRICING = {
  pro: {
    monthly: { usd: 499, vnd: 99000 },
    yearly: { usd: 4799, vnd: 950000 },
  },
  premium: {
    monthly: { usd: 999, vnd: 199000 },
    yearly: { usd: 9599, vnd: 1900000 },
  },
}

// ============================================
// Core Functions
// ============================================

/**
 * Get tier limits for a given subscription tier
 */
export function getTierLimits(tier: SubscriptionTier): TierLimits {
  return TIER_LIMITS[tier] ?? TIER_LIMITS.free
}

/**
 * Get tier info for display
 */
export function getTierDisplayInfo(tier: SubscriptionTier) {
  return TIER_INFO[tier] ?? TIER_INFO.free
}

/**
 * Check if a feature is available for a tier
 */
export type Feature =
  | 'goals'
  | 'identity'
  | 'metrics'
  | 'weekly_reports'
  | 'backfill'
  | 'ai_suggestions'
  | 'early_access'
  | 'priority_support'

export function hasFeature(tier: SubscriptionTier, feature: Feature): boolean {
  const limits = getTierLimits(tier)

  switch (feature) {
    case 'goals':
      return limits.hasGoals
    case 'identity':
      return limits.hasIdentity
    case 'metrics':
      return limits.hasMetrics
    case 'weekly_reports':
      return limits.hasWeeklyReports
    case 'backfill':
      return limits.backfillDays > 0
    case 'ai_suggestions':
      return limits.aiSuggestions ?? false
    case 'early_access':
      return limits.earlyAccess ?? false
    case 'priority_support':
      return limits.prioritySupport ?? false
    default:
      return false
  }
}

/**
 * Check if user can add more plants
 */
export function canAddPlant(tier: SubscriptionTier, currentCount: number): boolean {
  const limits = getTierLimits(tier)
  if (limits.maxPlants === -1) return true
  return currentCount < limits.maxPlants
}

/**
 * Check if user can plant a specific tier
 */
export function canPlantTierLevel(subscriptionTier: SubscriptionTier, plantTier: number): boolean {
  const limits = getTierLimits(subscriptionTier)
  return plantTier <= limits.maxTier
}

/**
 * Check if user can create more goals
 */
export function canAddGoal(tier: SubscriptionTier, currentCount: number): boolean {
  const limits = getTierLimits(tier)
  if (!limits.hasGoals) return false
  if (limits.maxGoals === -1) return true
  return currentCount < limits.maxGoals
}

/**
 * Check if level is within tier cap
 */
export function isWithinLevelCap(tier: SubscriptionTier, level: number): boolean {
  const limits = getTierLimits(tier)
  return level <= limits.levelCap
}

/**
 * Apply XP multiplier based on tier
 */
export function applyXpMultiplier(tier: SubscriptionTier, baseXp: number): number {
  const limits = getTierLimits(tier)
  return Math.floor(baseXp * limits.xpMultiplier)
}

/**
 * Get remaining slots for plants
 */
export function getRemainingPlantSlots(tier: SubscriptionTier, currentCount: number): number | 'unlimited' {
  const limits = getTierLimits(tier)
  if (limits.maxPlants === -1) return 'unlimited'
  return Math.max(0, limits.maxPlants - currentCount)
}

/**
 * Get remaining goal slots
 */
export function getRemainingGoalSlots(tier: SubscriptionTier, currentCount: number): number | 'unlimited' {
  const limits = getTierLimits(tier)
  if (!limits.hasGoals) return 0
  if (limits.maxGoals === -1) return 'unlimited'
  return Math.max(0, limits.maxGoals - currentCount)
}

// ============================================
// Upgrade Triggers
// ============================================

export type UpgradeTrigger =
  | 'level_6_goals'
  | 'level_13_identity'
  | 'plant_limit'
  | 'tier_limit'
  | 'goal_limit'
  | 'feature_gate'

export interface UpgradePrompt {
  trigger: UpgradeTrigger
  targetTier: 'pro' | 'premium'
  title: string
  message: string
  benefits: string[]
  ctaText: string
  hasTrial: boolean
}

/**
 * Get upgrade prompt for a specific trigger
 */
export function getUpgradePrompt(trigger: UpgradeTrigger, context?: string): UpgradePrompt {
  switch (trigger) {
    case 'level_6_goals':
      return {
        trigger,
        targetTier: 'pro',
        title: 'Goals Unlocked!',
        message: "You've proven you can maintain habits. Now let's set real goals for your plants.",
        benefits: [
          'Set measurable goals for each habit',
          'Track your progress with metrics',
          'Get weekly insights on your growth',
          'Unlock 5 more plant slots',
        ],
        ctaText: 'Try PRO free for 7 days',
        hasTrial: true,
      }

    case 'level_13_identity':
      return {
        trigger,
        targetTier: 'premium',
        title: 'Identity Awaits!',
        message: "After 250+ days, habits become who you are. It's time to define your identity.",
        benefits: [
          'Create identities ("I am a reader")',
          'Group goals under identities',
          'Legendary Tier 5 plants',
          'Unlimited everything',
        ],
        ctaText: 'Upgrade to PREMIUM',
        hasTrial: false,
      }

    case 'plant_limit':
      return {
        trigger,
        targetTier: 'pro',
        title: 'Your garden is full!',
        message: 'You have 3 plants growing beautifully. PRO members can grow up to 8 plants.',
        benefits: ['Grow up to 8 plants', 'Access Tier 3-4 plants', 'Goals & metrics tracking'],
        ctaText: 'See PRO benefits',
        hasTrial: true,
      }

    case 'tier_limit':
      return {
        trigger,
        targetTier: 'pro',
        title: `${context || 'This plant'} requires PRO`,
        message: 'Tier 3+ plants need more care and dedication. They are available for PRO gardeners.',
        benefits: ['Access Tier 3-4 plants', 'More challenging habits', 'Greater rewards'],
        ctaText: 'Learn about PRO',
        hasTrial: true,
      }

    case 'goal_limit':
      return {
        trigger,
        targetTier: 'premium',
        title: 'Goal limit reached',
        message: "You've set 5 goals. PREMIUM members have unlimited goals.",
        benefits: ['Unlimited goals', 'N:1 goal-plant linking', 'Identity system', 'AI suggestions'],
        ctaText: 'Upgrade to PREMIUM',
        hasTrial: false,
      }

    case 'feature_gate':
    default:
      return {
        trigger,
        targetTier: 'pro',
        title: 'PRO Feature',
        message: `${context || 'This feature'} is available for PRO members.`,
        benefits: ['Goals system', 'Metrics tracking', 'Weekly reports', 'No ads'],
        ctaText: 'Learn about PRO',
        hasTrial: true,
      }
  }
}

// ============================================
// Tier Comparison
// ============================================

/**
 * Check if a tier is higher than another
 */
export function isTierHigher(tier1: SubscriptionTier, tier2: SubscriptionTier): boolean {
  const order: Record<SubscriptionTier, number> = { free: 0, pro: 1, premium: 2 }
  return order[tier1] > order[tier2]
}

/**
 * Get the tier required for a feature
 */
export function getRequiredTierForFeature(feature: Feature): SubscriptionTier {
  if (hasFeature('free', feature)) return 'free'
  if (hasFeature('pro', feature)) return 'pro'
  return 'premium'
}

/**
 * Get the minimum tier for a plant tier
 */
export function getMinimumSubscriptionForPlantTier(plantTier: number): SubscriptionTier {
  if (plantTier <= 2) return 'free'
  if (plantTier <= 4) return 'pro'
  return 'premium'
}

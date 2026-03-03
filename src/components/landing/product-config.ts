/**
 * Paddle Product Configuration for Habit Garden Subscriptions
 *
 * Configure these price IDs in your .env.local file:
 * - NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID
 * - NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID
 * - NEXT_PUBLIC_PADDLE_PREMIUM_MONTHLY_PRICE_ID
 * - NEXT_PUBLIC_PADDLE_PREMIUM_YEARLY_PRICE_ID
 */

export type PaddleTier = 'pro' | 'premium'
export type BillingCycle = 'monthly' | 'yearly'

export interface PriceConfig {
  priceId: string
  price: string
  priceVND: string
  savings?: string
}

export interface TierConfig {
  monthly: PriceConfig
  yearly: PriceConfig
}

export const PADDLE_PRODUCTS: Record<PaddleTier, TierConfig> = {
  pro: {
    monthly: {
      priceId: process.env.NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID || 'pri_pro_monthly_placeholder',
      price: '$4.99',
      priceVND: '99,000 VND',
    },
    yearly: {
      priceId: process.env.NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID || 'pri_pro_yearly_placeholder',
      price: '$47.99',
      priceVND: '950,000 VND',
      savings: '20%',
    },
  },
  premium: {
    monthly: {
      priceId: process.env.NEXT_PUBLIC_PADDLE_PREMIUM_MONTHLY_PRICE_ID || 'pri_premium_monthly_placeholder',
      price: '$9.99',
      priceVND: '199,000 VND',
    },
    yearly: {
      priceId: process.env.NEXT_PUBLIC_PADDLE_PREMIUM_YEARLY_PRICE_ID || 'pri_premium_yearly_placeholder',
      price: '$95.99',
      priceVND: '1,900,000 VND',
      savings: '20%',
    },
  },
}

/**
 * Tier features for display on pricing page
 */
export const TIER_FEATURES = {
  free: {
    name: 'Seedling',
    tagline: 'Start your habit journey',
    features: [
      '3 plant slots',
      'Tier 1-2 plants',
      '3x3 garden',
      'Basic decorations',
      'Levels 1-10',
    ],
  },
  pro: {
    name: 'Gardener',
    tagline: 'Achieve your goals',
    features: [
      '8 plant slots',
      'Tier 1-4 plants',
      '5x5 garden',
      'Advanced decorations',
      'Levels 1-15',
      'Goals & metrics tracking',
      'Weekly reports',
      '1.2x XP boost',
      'No ads',
    ],
    highlighted: true,
  },
  premium: {
    name: 'Sage',
    tagline: 'Transform your identity',
    features: [
      'Unlimited plant slots',
      'Tier 1-5 plants (Legendary)',
      '7x7+ dynamic garden',
      'All decorations',
      'Levels 1-20+',
      'Identity system',
      'Unlimited goals',
      'AI suggestions',
      '1.5x XP boost',
      'Priority support',
    ],
  },
} as const

/**
 * Get price ID for a tier and billing cycle
 */
export function getPriceId(tier: PaddleTier, cycle: BillingCycle): string {
  return PADDLE_PRODUCTS[tier][cycle].priceId
}

/**
 * Get formatted price for display
 */
export function getFormattedPrice(
  tier: PaddleTier,
  cycle: BillingCycle,
  currency: 'usd' | 'vnd' = 'usd'
): string {
  const config = PADDLE_PRODUCTS[tier][cycle]
  return currency === 'vnd' ? config.priceVND : config.price
}

/**
 * Check if price IDs are properly configured
 */
export function isPricingConfigured(): boolean {
  return (
    !PADDLE_PRODUCTS.pro.monthly.priceId.includes('placeholder') &&
    !PADDLE_PRODUCTS.pro.yearly.priceId.includes('placeholder') &&
    !PADDLE_PRODUCTS.premium.monthly.priceId.includes('placeholder') &&
    !PADDLE_PRODUCTS.premium.yearly.priceId.includes('placeholder')
  )
}

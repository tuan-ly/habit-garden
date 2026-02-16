/**
 * Paddle Utility Functions
 *
 * Server-side utilities for handling Paddle webhooks and subscription management
 */

import type { SubscriptionTier, SubscriptionStatus } from '@/types/database'

/**
 * Map Paddle price ID to subscription tier
 */
export function mapPriceIdToTier(priceId: string): SubscriptionTier {
  const proMonthly = process.env.NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID
  const proYearly = process.env.NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID
  const premiumMonthly = process.env.NEXT_PUBLIC_PADDLE_PREMIUM_MONTHLY_PRICE_ID
  const premiumYearly = process.env.NEXT_PUBLIC_PADDLE_PREMIUM_YEARLY_PRICE_ID

  if (priceId === proMonthly || priceId === proYearly) {
    return 'pro'
  }

  if (priceId === premiumMonthly || priceId === premiumYearly) {
    return 'premium'
  }

  // Default to free for unknown price IDs
  return 'free'
}

/**
 * Map Paddle subscription status to our status
 */
export function mapPaddleStatus(paddleStatus: string): SubscriptionStatus {
  switch (paddleStatus) {
    case 'active':
      return 'active'
    case 'trialing':
      return 'trialing'
    case 'past_due':
      return 'past_due'
    case 'canceled':
      return 'canceled'
    case 'paused':
      return 'canceled' // Treat paused as canceled for simplicity
    default:
      return 'active'
  }
}

/**
 * Extract user ID from Paddle custom data
 */
export function extractUserId(customData: unknown): string | undefined {
  if (typeof customData === 'object' && customData !== null) {
    const data = customData as Record<string, unknown>
    if (typeof data.user_id === 'string') {
      return data.user_id
    }
  }
  return undefined
}

/**
 * Extract price ID from Paddle subscription/transaction data
 */
export function extractPriceId(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null) {
    return undefined
  }

  const dataObj = data as Record<string, unknown>

  // Try items array (subscription data)
  if (Array.isArray(dataObj.items) && dataObj.items.length > 0) {
    const firstItem = dataObj.items[0] as Record<string, unknown>
    if (typeof firstItem.price === 'object' && firstItem.price !== null) {
      const price = firstItem.price as Record<string, unknown>
      if (typeof price.id === 'string') {
        return price.id
      }
    }
    // Also try direct priceId on item
    if (typeof firstItem.priceId === 'string') {
      return firstItem.priceId
    }
  }

  return undefined
}

/**
 * Extract customer email from Paddle data
 */
export function extractCustomerEmail(data: unknown): string | undefined {
  if (typeof data !== 'object' || data === null) {
    return undefined
  }

  const dataObj = data as Record<string, unknown>

  // Try customer object
  if (typeof dataObj.customer === 'object' && dataObj.customer !== null) {
    const customer = dataObj.customer as Record<string, unknown>
    if (typeof customer.email === 'string') {
      return customer.email
    }
  }

  // Try direct email field
  if (typeof dataObj.customerEmail === 'string') {
    return dataObj.customerEmail
  }

  return undefined
}

/**
 * Extract billing period from Paddle subscription data
 */
export function extractBillingPeriod(data: unknown): {
  startsAt: string | null
  endsAt: string | null
} {
  if (typeof data !== 'object' || data === null) {
    return { startsAt: null, endsAt: null }
  }

  const dataObj = data as Record<string, unknown>

  if (
    typeof dataObj.currentBillingPeriod === 'object' &&
    dataObj.currentBillingPeriod !== null
  ) {
    const period = dataObj.currentBillingPeriod as Record<string, unknown>
    return {
      startsAt: typeof period.startsAt === 'string' ? period.startsAt : null,
      endsAt: typeof period.endsAt === 'string' ? period.endsAt : null,
    }
  }

  return { startsAt: null, endsAt: null }
}

/**
 * Subscription event types we track
 */
export type SubscriptionEventType =
  | 'created'
  | 'activated'
  | 'updated'
  | 'upgraded'
  | 'downgraded'
  | 'canceled'
  | 'paused'
  | 'resumed'
  | 'renewed'
  | 'payment_failed'
  | 'trial_started'
  | 'trial_ended'

/**
 * Determine event type from old and new tier
 */
export function determineEventType(
  eventName: string,
  oldTier?: SubscriptionTier,
  newTier?: SubscriptionTier
): SubscriptionEventType {
  if (eventName.includes('created') || eventName.includes('activated')) {
    return 'created'
  }

  if (eventName.includes('canceled')) {
    return 'canceled'
  }

  if (eventName.includes('paused')) {
    return 'paused'
  }

  if (eventName.includes('resumed')) {
    return 'resumed'
  }

  if (eventName.includes('updated') && oldTier && newTier) {
    const tierOrder: Record<SubscriptionTier, number> = { free: 0, pro: 1, premium: 2 }
    if (tierOrder[newTier] > tierOrder[oldTier]) {
      return 'upgraded'
    }
    if (tierOrder[newTier] < tierOrder[oldTier]) {
      return 'downgraded'
    }
  }

  return 'updated'
}

/**
 * Format Paddle amount (in smallest currency unit) to display string
 */
export function formatPaddleAmount(amount: number, currencyCode: string): string {
  // Paddle amounts are in smallest currency unit
  const displayAmount = amount / 100

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
  }).format(displayAmount)
}

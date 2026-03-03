'use server'

import { cookies } from 'next/headers'
import type { SubscriptionTier } from '@/types/database'

const DEV_TIER_COOKIE = 'habien-dev-tier'

/**
 * DEV ONLY: Set subscription tier override via cookie
 * This allows server actions to respect dev panel overrides
 * without modifying the database.
 */
export async function devSetSubscriptionTier(tier: SubscriptionTier): Promise<{
  success: boolean
  error?: string
}> {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return { success: false, error: 'Dev actions only available in development mode' }
  }

  const cookieStore = await cookies()

  cookieStore.set(DEV_TIER_COOKIE, tier, {
    httpOnly: false, // Allow JS access for debugging
    secure: false,   // Dev mode doesn't need HTTPS
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  })

  console.log(`[DEV] Subscription tier override set to: ${tier}`)
  return { success: true }
}

/**
 * DEV ONLY: Reset subscription tier override
 */
export async function devResetSubscriptionTier(): Promise<{
  success: boolean
  error?: string
}> {
  if (process.env.NODE_ENV !== 'development') {
    return { success: false, error: 'Dev actions only available in development mode' }
  }

  const cookieStore = await cookies()
  cookieStore.delete(DEV_TIER_COOKIE)

  console.log('[DEV] Subscription tier override cleared')
  return { success: true }
}

/**
 * DEV ONLY: Get subscription tier override from cookie
 * Returns null if no override is set
 */
export async function getDevTierOverride(): Promise<SubscriptionTier | null> {
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const cookieStore = await cookies()
  const tierCookie = cookieStore.get(DEV_TIER_COOKIE)

  if (!tierCookie?.value) {
    return null
  }

  const value = tierCookie.value.toLowerCase()
  if (value === 'free' || value === 'pro' || value === 'premium') {
    return value as SubscriptionTier
  }

  return null
}

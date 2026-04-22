'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth-cached'
import type { SubscriptionTier } from '@/types/database'

const DEV_TIER_COOKIE = 'habien-dev-tier'
const DEV_PLANT_BYPASS_COOKIE = 'habien-dev-plant-bypass'

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

/**
 * DEV ONLY: Toggle bypass for plant slot/tier restrictions in createPlant().
 */
export async function devSetPlantBypass(enabled: boolean): Promise<{
  success: boolean
  error?: string
}> {
  if (process.env.NODE_ENV !== 'development') {
    return { success: false, error: 'Dev actions only available in development mode' }
  }

  const cookieStore = await cookies()

  if (enabled) {
    cookieStore.set(DEV_PLANT_BYPASS_COOKIE, '1', {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
  } else {
    cookieStore.delete(DEV_PLANT_BYPASS_COOKIE)
  }

  console.log(`[DEV] Plant bypass ${enabled ? 'ENABLED' : 'disabled'}`)
  return { success: true }
}

/**
 * DEV ONLY: Read plant bypass cookie.
 */
export async function getDevPlantBypass(): Promise<boolean> {
  if (process.env.NODE_ENV !== 'development') return false

  const cookieStore = await cookies()
  return cookieStore.get(DEV_PLANT_BYPASS_COOKIE)?.value === '1'
}

/**
 * DEV ONLY: Force-update a plant's grid_size, growth_percentage, status.
 * Ownership-checked. Gated by NODE_ENV=development.
 */
export async function devSetPlantParams(
  plantId: string,
  params: {
    grid_size?: number
    growth_percentage?: number
    status?: string
  }
): Promise<{ success: boolean; error?: string }> {
  if (process.env.NODE_ENV !== 'development') {
    return { success: false, error: 'Dev actions only available in development mode' }
  }

  const user = await getAuthUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const supabase = await createClient()

  // Ownership check
  const { data: plant, error: fetchError } = await supabase
    .from('plants')
    .select('id, user_id')
    .eq('id', plantId)
    .single()

  if (fetchError || !plant || plant.user_id !== user.id) {
    return { success: false, error: 'Plant not found' }
  }

  // Build update payload from provided params only
  const update: Record<string, unknown> = {}
  if (params.grid_size !== undefined) {
    update.grid_size = Math.max(1, Math.min(4, Math.floor(params.grid_size)))
  }
  if (params.growth_percentage !== undefined) {
    update.growth_percentage = Math.max(0, Math.min(100, params.growth_percentage))
  }
  if (params.status !== undefined) {
    update.status = params.status
  }

  if (Object.keys(update).length === 0) {
    return { success: false, error: 'No params provided' }
  }

  const { error: updateError } = await supabase
    .from('plants')
    .update(update)
    .eq('id', plantId)
    .eq('user_id', user.id)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  console.log(`[DEV] Plant ${plantId} updated:`, update)
  revalidatePath('/dashboard')
  revalidatePath('/garden')
  return { success: true }
}

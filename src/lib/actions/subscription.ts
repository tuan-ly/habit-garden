'use server'

import { createClient } from '@/lib/supabase/server'
import { getAuthUser } from '@/lib/auth-cached'
import type { SubscriptionTier, SubscriptionStatus } from '@/types/database'
import type { UpgradeTrigger } from '@/lib/subscription-limits'

// Get user's current subscription
export async function getSubscription() {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, subscription_tiers(*)')
    .eq('user_id', user.id)
    .single()

  if (error) {
    // No subscription found, return default free tier
    if (error.code === 'PGRST116') {
      return {
        tier_id: 'free' as SubscriptionTier,
        status: 'active' as SubscriptionStatus,
        subscription_tiers: null,
      }
    }
    console.error('Error fetching subscription:', error)
    return null
  }

  return data
}

// Get all subscription tiers
export async function getSubscriptionTiers() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subscription_tiers')
    .select('id, name, description, price_monthly, price_yearly, features, is_active, sort_order, created_at')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching subscription tiers:', error)
    return []
  }

  return data
}

// Track upgrade prompt shown
export async function trackUpgradePrompt(
  promptType: UpgradeTrigger,
  featureContext?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase.from('upgrade_prompts').insert({
    user_id: user.id,
    prompt_type: promptType,
    feature_context: featureContext,
  })

  if (error) {
    console.error('Error tracking upgrade prompt:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Update upgrade prompt action (when user clicks/dismisses)
export async function updateUpgradePromptAction(
  promptType: UpgradeTrigger,
  action: 'dismissed' | 'clicked_upgrade' | 'started_trial' | 'converted'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Find the most recent prompt of this type
  const { data: prompt, error: findError } = await supabase
    .from('upgrade_prompts')
    .select('id')
    .eq('user_id', user.id)
    .eq('prompt_type', promptType)
    .order('shown_at', { ascending: false })
    .limit(1)
    .single()

  if (findError || !prompt) {
    // No prompt found, create one with the action
    const { error: insertError } = await supabase.from('upgrade_prompts').insert({
      user_id: user.id,
      prompt_type: promptType,
      action,
      converted: action === 'converted',
      converted_at: action === 'converted' ? new Date().toISOString() : null,
    })

    if (insertError) {
      console.error('Error creating upgrade prompt:', insertError)
      return { success: false, error: insertError.message }
    }

    return { success: true }
  }

  // Update existing prompt
  const { error } = await supabase
    .from('upgrade_prompts')
    .update({
      action,
      converted: action === 'converted',
      converted_at: action === 'converted' ? new Date().toISOString() : null,
    })
    .eq('id', prompt.id)

  if (error) {
    console.error('Error updating upgrade prompt:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Check if user has seen a specific prompt recently (within 7 days)
export async function hasSeenPromptRecently(
  promptType: UpgradeTrigger
): Promise<boolean> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) return false

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { count, error } = await supabase
    .from('upgrade_prompts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('prompt_type', promptType)
    .gte('shown_at', sevenDaysAgo.toISOString())

  if (error) {
    console.error('Error checking prompt history:', error)
    return false
  }

  return (count ?? 0) > 0
}

// Log subscription event (for analytics)
export async function logSubscriptionEvent(
  eventType: string,
  fromTier?: SubscriptionTier,
  toTier?: SubscriptionTier,
  metadata?: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Get subscription ID
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const { error } = await supabase.from('subscription_events').insert({
    subscription_id: subscription?.id,
    user_id: user.id,
    event_type: eventType,
    from_tier: fromTier,
    to_tier: toTier,
    metadata: metadata ?? {},
  })

  if (error) {
    console.error('Error logging subscription event:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Get user's subscription tier (quick check)
// In dev mode, checks for dev panel override first
export async function getUserTier(): Promise<SubscriptionTier> {
  // Check for dev tier override first (dev mode only)
  if (process.env.NODE_ENV === 'development') {
    const { getDevTierOverride } = await import('./dev')
    const devTier = await getDevTierOverride()
    if (devTier) {
      return devTier
    }
  }

  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) return 'free'

  const { data, error } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    return 'free'
  }

  return (data.subscription_tier as SubscriptionTier) ?? 'free'
}

// Check if user can access a feature based on tier
export async function canAccessFeature(
  feature: 'goals' | 'identity' | 'metrics' | 'weekly_reports'
): Promise<boolean> {
  const tier = await getUserTier()

  switch (feature) {
    case 'goals':
    case 'metrics':
    case 'weekly_reports':
      return tier === 'pro' || tier === 'premium'
    case 'identity':
      return tier === 'premium'
    default:
      return true
  }
}

// Check plant/goal limits
export async function checkLimits(): Promise<{
  canAddPlant: boolean
  canAddGoal: boolean
  plantsUsed: number
  plantsLimit: number
  goalsUsed: number
  goalsLimit: number
}> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) {
    return {
      canAddPlant: false,
      canAddGoal: false,
      plantsUsed: 0,
      plantsLimit: 3,
      goalsUsed: 0,
      goalsLimit: 0,
    }
  }

  // Get tier limits
  const tier = await getUserTier()
  const limits = {
    free: { plants: 3, goals: 0 },
    pro: { plants: 8, goals: 5 },
    premium: { plants: -1, goals: -1 }, // -1 = unlimited
  }
  const tierLimits = limits[tier]

  // Count current plants
  const { count: plantCount } = await supabase
    .from('plants')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .or('status.neq.dead,death_acknowledged_at.is.null')

  // Count current active goals
  const { count: goalCount } = await supabase
    .from('goals')
    .select('*', { count: 'exact', head: true })
    .eq('season_status', 'active')

  const plantsUsed = plantCount ?? 0
  const goalsUsed = goalCount ?? 0

  return {
    canAddPlant: tierLimits.plants === -1 || plantsUsed < tierLimits.plants,
    canAddGoal: tierLimits.goals === -1 || goalsUsed < tierLimits.goals,
    plantsUsed,
    plantsLimit: tierLimits.plants,
    goalsUsed,
    goalsLimit: tierLimits.goals,
  }
}

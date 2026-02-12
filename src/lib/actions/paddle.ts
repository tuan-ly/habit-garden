'use server'

import { createClient } from '@/lib/supabase/server'
import { Environment, Paddle } from '@paddle/paddle-node-sdk'

/**
 * Get Paddle server client
 */
function getPaddleClient(): Paddle | null {
  const apiKey = process.env.PADDLE_API_KEY

  if (!apiKey) {
    console.warn('PADDLE_API_KEY not configured')
    return null
  }

  return new Paddle(apiKey, {
    environment:
      process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production'
        ? Environment.production
        : Environment.sandbox,
  })
}

/**
 * Get Paddle customer portal URL for the current user
 */
export async function getCustomerPortalUrl(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    // Get subscription with Paddle customer ID
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('provider_customer_id')
      .eq('user_id', user.id)
      .eq('payment_provider', 'paddle')
      .single()

    if (!subscription?.provider_customer_id) {
      console.log('No Paddle customer ID found for user')
      return null
    }

    const paddle = getPaddleClient()
    if (!paddle) return null

    // Generate customer portal session
    const portalSession = await paddle.customers.generateAuthToken(
      subscription.provider_customer_id
    )

    // Construct portal URL
    const portalDomain =
      process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production'
        ? 'customer-portal.paddle.com'
        : 'sandbox-customer-portal.paddle.com'

    return `https://${portalDomain}/cpl_${portalSession}`
  } catch (error) {
    console.error('Error getting customer portal URL:', error)
    return null
  }
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscription(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('provider_subscription_id')
      .eq('user_id', user.id)
      .eq('payment_provider', 'paddle')
      .single()

    if (!subscription?.provider_subscription_id) {
      return { success: false, error: 'No active subscription found' }
    }

    const paddle = getPaddleClient()
    if (!paddle) {
      return { success: false, error: 'Payment system not configured' }
    }

    // Cancel at end of billing period
    await paddle.subscriptions.cancel(subscription.provider_subscription_id, {
      effectiveFrom: 'next_billing_period',
    })

    // Update local record
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    return { success: true }
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return { success: false, error: 'Failed to cancel subscription' }
  }
}

/**
 * Resume a canceled subscription (if still within billing period)
 */
export async function resumeSubscription(): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('provider_subscription_id, cancel_at_period_end')
      .eq('user_id', user.id)
      .eq('payment_provider', 'paddle')
      .single()

    if (!subscription?.provider_subscription_id) {
      return { success: false, error: 'No subscription found' }
    }

    if (!subscription.cancel_at_period_end) {
      return { success: false, error: 'Subscription is not canceled' }
    }

    const paddle = getPaddleClient()
    if (!paddle) {
      return { success: false, error: 'Payment system not configured' }
    }

    // Resume the subscription (remove scheduled cancellation)
    await paddle.subscriptions.update(subscription.provider_subscription_id, {
      scheduledChange: null,
    })

    // Update local record
    await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        canceled_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)

    return { success: true }
  } catch (error) {
    console.error('Resume subscription error:', error)
    return { success: false, error: 'Failed to resume subscription' }
  }
}

/**
 * Update subscription to a different plan
 */
export async function updateSubscriptionPlan(
  newPriceId: string
): Promise<{
  success: boolean
  error?: string
}> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('provider_subscription_id')
      .eq('user_id', user.id)
      .eq('payment_provider', 'paddle')
      .single()

    if (!subscription?.provider_subscription_id) {
      return { success: false, error: 'No active subscription found' }
    }

    const paddle = getPaddleClient()
    if (!paddle) {
      return { success: false, error: 'Payment system not configured' }
    }

    // Get current subscription to find item ID
    const paddleSubscription = await paddle.subscriptions.get(
      subscription.provider_subscription_id
    )

    if (!paddleSubscription.items || paddleSubscription.items.length === 0) {
      return { success: false, error: 'No subscription items found' }
    }

    const currentItem = paddleSubscription.items[0]

    // Update to new price
    await paddle.subscriptions.update(subscription.provider_subscription_id, {
      items: [
        {
          priceId: newPriceId,
          quantity: 1,
        },
      ],
      prorationBillingMode: 'prorated_immediately',
    })

    return { success: true }
  } catch (error) {
    console.error('Update subscription error:', error)
    return { success: false, error: 'Failed to update subscription' }
  }
}

/**
 * Get subscription details for the current user
 */
export async function getSubscriptionDetails(): Promise<{
  tier: string
  status: string
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
  paymentProvider: string | null
} | null> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier_id, status, cancel_at_period_end, current_period_end, payment_provider')
      .eq('user_id', user.id)
      .single()

    if (!subscription) {
      return {
        tier: 'free',
        status: 'active',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        paymentProvider: null,
      }
    }

    return {
      tier: subscription.tier_id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: subscription.current_period_end,
      paymentProvider: subscription.payment_provider,
    }
  } catch (error) {
    console.error('Error getting subscription details:', error)
    return null
  }
}

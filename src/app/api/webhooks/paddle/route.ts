import { NextRequest, NextResponse } from 'next/server'
import { Environment, Paddle, EventName } from '@paddle/paddle-node-sdk'
import { createClient } from '@supabase/supabase-js'
import {
  mapPriceIdToTier,
  mapPaddleStatus,
  extractUserId,
  extractPriceId,
  extractCustomerEmail,
  extractBillingPeriod,
  determineEventType,
} from '@/lib/paddle-utils'
import type { SubscriptionTier } from '@/types/database'

// Initialize Paddle server SDK
const getPaddleClient = () => {
  const apiKey = process.env.PADDLE_API_KEY
  if (!apiKey) {
    throw new Error('PADDLE_API_KEY not configured')
  }

  return new Paddle(apiKey, {
    environment:
      process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT === 'production'
        ? Environment.production
        : Environment.sandbox,
  })
}

// Supabase admin client for webhook operations
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('paddle-signature')
    const rawBody = await request.text()
    const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET

    if (!signature) {
      console.error('Webhook: Missing paddle-signature header')
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    if (!webhookSecret) {
      console.error('Webhook: PADDLE_WEBHOOK_SECRET not configured')
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
    }

    // Verify and parse the webhook
    const paddle = getPaddleClient()
    let event

    try {
      event = await paddle.webhooks.unmarshal(rawBody, webhookSecret, signature)
    } catch (error) {
      console.error('Webhook verification failed:', error)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    console.log('Paddle webhook received:', event.eventType)

    const supabase = getSupabaseAdmin()

    // Extract common data - cast to unknown first for type safety
    const eventData = event.data as unknown as Record<string, unknown>
    const customData = eventData.customData
    const userId = extractUserId(customData)
    const customerEmail = extractCustomerEmail(eventData)

    // Handle different event types
    switch (event.eventType) {
      case EventName.SubscriptionCreated:
      case EventName.SubscriptionActivated:
        await handleSubscriptionCreated(supabase, eventData, userId, customerEmail)
        break

      case EventName.SubscriptionUpdated:
        await handleSubscriptionUpdated(supabase, eventData, userId)
        break

      case EventName.SubscriptionCanceled:
        await handleSubscriptionCanceled(supabase, eventData, userId)
        break

      case EventName.SubscriptionPaused:
        await handleSubscriptionPaused(supabase, eventData, userId)
        break

      case EventName.SubscriptionResumed:
        await handleSubscriptionResumed(supabase, eventData, userId)
        break

      case EventName.TransactionCompleted:
        await handleTransactionCompleted(supabase, eventData, userId, customerEmail)
        break

      case EventName.TransactionPaymentFailed:
        await handlePaymentFailed(supabase, eventData, userId)
        break

      default:
        console.log(`Unhandled event type: ${event.eventType}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

// ============================================
// Handler Functions
// ============================================

async function handleSubscriptionCreated(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  data: Record<string, unknown>,
  userId?: string,
  customerEmail?: string
) {
  const targetUserId = await resolveUserId(supabase, userId, customerEmail)
  if (!targetUserId) {
    console.error('Subscription created but no user found')
    return
  }

  const priceId = extractPriceId(data)
  const tier = priceId ? mapPriceIdToTier(priceId) : 'pro'
  const status = mapPaddleStatus(data.status as string)
  const billingPeriod = extractBillingPeriod(data)

  // Upsert subscription
  const { error: subError } = await supabase.from('subscriptions').upsert(
    {
      user_id: targetUserId,
      tier_id: tier,
      status,
      payment_provider: 'paddle',
      provider_subscription_id: data.id as string,
      provider_customer_id: data.customerId as string,
      current_period_start: billingPeriod.startsAt,
      current_period_end: billingPeriod.endsAt,
      cancel_at_period_end: false,
      metadata: { paddle_data: data },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  )

  if (subError) {
    console.error('Error upserting subscription:', subError)
    return
  }

  // Log event
  await logSubscriptionEvent(supabase, targetUserId, 'created', undefined, tier, data)

  console.log(`Subscription created for user ${targetUserId}: ${tier}`)
}

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  data: Record<string, unknown>,
  userId?: string
) {
  const subscriptionId = data.id as string

  // Find existing subscription
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('user_id, tier_id')
    .eq('provider_subscription_id', subscriptionId)
    .single()

  const targetUserId = existing?.user_id || userId
  if (!targetUserId) {
    console.error('Subscription updated but no user found')
    return
  }

  const oldTier = existing?.tier_id as SubscriptionTier | undefined
  const priceId = extractPriceId(data)
  const newTier = priceId ? mapPriceIdToTier(priceId) : oldTier || 'pro'
  const status = mapPaddleStatus(data.status as string)
  const billingPeriod = extractBillingPeriod(data)

  // Update subscription
  const { error } = await supabase
    .from('subscriptions')
    .update({
      tier_id: newTier,
      status,
      current_period_start: billingPeriod.startsAt,
      current_period_end: billingPeriod.endsAt,
      metadata: { paddle_data: data },
      updated_at: new Date().toISOString(),
    })
    .eq('provider_subscription_id', subscriptionId)

  if (error) {
    console.error('Error updating subscription:', error)
    return
  }

  // Log event
  const eventType = determineEventType('updated', oldTier, newTier)
  await logSubscriptionEvent(supabase, targetUserId, eventType, oldTier, newTier, data)

  console.log(`Subscription updated for user ${targetUserId}: ${oldTier} -> ${newTier}`)
}

async function handleSubscriptionCanceled(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  data: Record<string, unknown>,
  userId?: string
) {
  const subscriptionId = data.id as string

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('user_id, tier_id')
    .eq('provider_subscription_id', subscriptionId)
    .single()

  const targetUserId = existing?.user_id || userId
  if (!targetUserId) {
    console.error('Subscription canceled but no user found')
    return
  }

  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    })
    .eq('provider_subscription_id', subscriptionId)

  if (error) {
    console.error('Error canceling subscription:', error)
    return
  }

  await logSubscriptionEvent(
    supabase,
    targetUserId,
    'canceled',
    existing?.tier_id as SubscriptionTier,
    'free',
    data
  )

  console.log(`Subscription canceled for user ${targetUserId}`)
}

async function handleSubscriptionPaused(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  data: Record<string, unknown>,
  userId?: string
) {
  const subscriptionId = data.id as string

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('provider_subscription_id', subscriptionId)
    .single()

  const targetUserId = existing?.user_id || userId

  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled', // Treat paused as canceled
      updated_at: new Date().toISOString(),
    })
    .eq('provider_subscription_id', subscriptionId)

  if (targetUserId) {
    await logSubscriptionEvent(supabase, targetUserId, 'paused', undefined, undefined, data)
  }

  console.log(`Subscription paused for user ${targetUserId}`)
}

async function handleSubscriptionResumed(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  data: Record<string, unknown>,
  userId?: string
) {
  const subscriptionId = data.id as string

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('user_id, tier_id')
    .eq('provider_subscription_id', subscriptionId)
    .single()

  const targetUserId = existing?.user_id || userId
  const tier = existing?.tier_id as SubscriptionTier

  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      cancel_at_period_end: false,
      canceled_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('provider_subscription_id', subscriptionId)

  if (targetUserId) {
    await logSubscriptionEvent(supabase, targetUserId, 'resumed', undefined, tier, data)
  }

  console.log(`Subscription resumed for user ${targetUserId}`)
}

async function handleTransactionCompleted(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  data: Record<string, unknown>,
  userId?: string,
  customerEmail?: string
) {
  // Transaction completed - may be a one-time payment or subscription payment
  // For subscriptions, subscription.created/activated handles the subscription
  // This is mainly for logging and confirmation

  const targetUserId = await resolveUserId(supabase, userId, customerEmail)

  if (targetUserId) {
    console.log(`Transaction completed for user ${targetUserId}`)
  }
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  data: Record<string, unknown>,
  userId?: string
) {
  const subscriptionId = data.subscriptionId as string | undefined

  if (!subscriptionId) {
    console.log('Payment failed for non-subscription transaction')
    return
  }

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('provider_subscription_id', subscriptionId)
    .single()

  const targetUserId = existing?.user_id || userId

  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('provider_subscription_id', subscriptionId)

  if (targetUserId) {
    await logSubscriptionEvent(supabase, targetUserId, 'payment_failed', undefined, undefined, data)
  }

  console.log(`Payment failed for subscription ${subscriptionId}`)
}

// ============================================
// Helper Functions
// ============================================

async function resolveUserId(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId?: string,
  email?: string
): Promise<string | undefined> {
  if (userId) return userId

  if (email) {
    // Try to find user by email in auth.users
    const { data: authUser } = await supabase.auth.admin.getUserById(email)
    if (authUser?.user?.id) return authUser.user.id

    // Fallback: look in profiles (if email is stored there)
    // Note: profiles may not have email, depends on your schema
  }

  return undefined
}

async function logSubscriptionEvent(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  eventType: string,
  fromTier?: SubscriptionTier,
  toTier?: SubscriptionTier,
  metadata?: Record<string, unknown>
) {
  // Get subscription ID
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('user_id', userId)
    .single()

  await supabase.from('subscription_events').insert({
    subscription_id: subscription?.id,
    user_id: userId,
    event_type: eventType,
    from_tier: fromTier,
    to_tier: toTier,
    metadata: metadata ?? {},
  })
}

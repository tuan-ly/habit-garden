import { initializePaddle, Paddle, type PaddleEventData } from '@paddle/paddle-js'

let paddleInstance: Paddle | undefined

// Event names from Paddle.js
type PaddleEventName =
  | 'checkout.loaded'
  | 'checkout.closed'
  | 'checkout.completed'
  | 'checkout.error'
  | 'checkout.customer.created'
  | 'checkout.payment.selected'
  | 'checkout.payment.initiated'
  | 'checkout.payment.failed'

/**
 * Get or initialize the Paddle client instance
 */
export const getPaddleInstance = async (): Promise<Paddle | undefined> => {
  if (paddleInstance) return paddleInstance

  const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
  const environment = process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as 'sandbox' | 'production'

  if (!clientToken) {
    console.warn('Paddle client token not configured. Set NEXT_PUBLIC_PADDLE_CLIENT_TOKEN in .env.local')
    return undefined
  }

  try {
    paddleInstance = await initializePaddle({
      environment: environment || 'sandbox',
      token: clientToken,
      eventCallback: (event: PaddleEventData) => {
        const eventName = event.name as PaddleEventName
        console.log('Paddle Event:', eventName, event)

        // Dispatch custom events for React components to listen to
        if (typeof window !== 'undefined') {
          switch (eventName) {
            case 'checkout.completed':
              window.dispatchEvent(
                new CustomEvent('paddle:checkout-complete', { detail: event })
              )
              break
            case 'checkout.closed':
              window.dispatchEvent(
                new CustomEvent('paddle:checkout-closed', { detail: event })
              )
              break
            case 'checkout.error':
              window.dispatchEvent(
                new CustomEvent('paddle:checkout-error', { detail: event })
              )
              break
          }
        }
      },
    })

    return paddleInstance
  } catch (error) {
    console.error('Failed to initialize Paddle:', error)
    return undefined
  }
}

/**
 * Open Paddle checkout overlay with user context
 */
export interface OpenCheckoutOptions {
  priceId: string
  userEmail?: string
  userId?: string
  successUrl?: string
}

export const openCheckout = async ({
  priceId,
  userEmail,
  userId,
  successUrl,
}: OpenCheckoutOptions): Promise<void> => {
  const paddle = await getPaddleInstance()

  if (!paddle) {
    console.error('Paddle not initialized')
    // Show error toast or fallback
    return
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin

  paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customer: userEmail ? { email: userEmail } : undefined,
    customData: userId ? { user_id: userId } : undefined,
    settings: {
      displayMode: 'overlay',
      theme: 'light',
      locale: 'en',
      successUrl: successUrl || `${siteUrl}/dashboard?subscription=success`,
    },
  })
}

/**
 * Open Paddle checkout for a specific tier
 */
export type BillingCycle = 'monthly' | 'yearly'
export type SubscriptionTierType = 'pro' | 'premium'

export const openTierCheckout = async (
  tier: SubscriptionTierType,
  billingCycle: BillingCycle,
  userEmail?: string,
  userId?: string
): Promise<void> => {
  const priceIds: Record<SubscriptionTierType, Record<BillingCycle, string | undefined>> = {
    pro: {
      monthly: process.env.NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID,
      yearly: process.env.NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID,
    },
    premium: {
      monthly: process.env.NEXT_PUBLIC_PADDLE_PREMIUM_MONTHLY_PRICE_ID,
      yearly: process.env.NEXT_PUBLIC_PADDLE_PREMIUM_YEARLY_PRICE_ID,
    },
  }

  const priceId = priceIds[tier][billingCycle]

  if (!priceId) {
    console.error(`Price ID not configured for ${tier} ${billingCycle}`)
    return
  }

  await openCheckout({ priceId, userEmail, userId })
}

/**
 * Check if Paddle is properly configured
 */
export const isPaddleConfigured = (): boolean => {
  return !!process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
}

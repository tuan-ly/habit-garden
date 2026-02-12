'use client'

import { useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { PADDLE_PRODUCTS, TIER_FEATURES, type BillingCycle } from './product-config'
import { openCheckout, isPaddleConfigured } from '@/lib/paddle'
import { cn } from '@/lib/utils'

export function PricingSection() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleCheckout = async (tier: 'pro' | 'premium') => {
    if (!isPaddleConfigured()) {
      console.warn('Paddle not configured')
      return
    }

    setIsLoading(tier)
    try {
      const priceId = PADDLE_PRODUCTS[tier][billingCycle].priceId
      await openCheckout({ priceId })
    } catch (error) {
      console.error('Checkout error:', error)
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <section className="py-24" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Invest In Your Growth</h2>
          <p className="text-xl text-muted-foreground">
            Choose the plan that best fits your journey. Start for free, upgrade when you&apos;re
            ready to commit.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Label
            htmlFor="billing-toggle"
            className={cn('text-sm', billingCycle === 'monthly' && 'font-semibold')}
          >
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={billingCycle === 'yearly'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
          />
          <Label
            htmlFor="billing-toggle"
            className={cn('text-sm', billingCycle === 'yearly' && 'font-semibold')}
          >
            Yearly{' '}
            <span className="text-emerald-600 font-medium">(Save 20%)</span>
          </Label>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Tier */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2">
                <span>{TIER_FEATURES.free.name}</span>
                <span className="text-lg">🌱</span>
              </CardTitle>
              <CardDescription>{TIER_FEATURES.free.tagline}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">$0</span>
                <span className="text-muted-foreground">/forever</span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {TIER_FEATURES.free.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button className="w-full" variant="outline" asChild>
                <a href="/signup">Start Free</a>
              </Button>
            </CardFooter>
          </Card>

          {/* Pro Tier */}
          <Card className="flex flex-col border-emerald-500 shadow-lg scale-105 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-medium">
              Most Popular
            </div>
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2 text-emerald-600">
                <span>{TIER_FEATURES.pro.name}</span>
                <span className="text-lg">🌿</span>
              </CardTitle>
              <CardDescription>{TIER_FEATURES.pro.tagline}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {PADDLE_PRODUCTS.pro[billingCycle].price}
                </span>
                <span className="text-muted-foreground">
                  /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
                {billingCycle === 'yearly' && (
                  <span className="ml-2 text-sm text-emerald-600">
                    Save {PADDLE_PRODUCTS.pro.yearly.savings}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {TIER_FEATURES.pro.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={() => handleCheckout('pro')}
                disabled={isLoading === 'pro'}
              >
                {isLoading === 'pro' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Subscribe to Pro
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Tier */}
          <Card className="flex flex-col border-amber-500/50">
            <CardHeader>
              <CardTitle className="text-2xl flex items-center gap-2 text-amber-600">
                <span>{TIER_FEATURES.premium.name}</span>
                <span className="text-lg">🌳</span>
              </CardTitle>
              <CardDescription>{TIER_FEATURES.premium.tagline}</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {PADDLE_PRODUCTS.premium[billingCycle].price}
                </span>
                <span className="text-muted-foreground">
                  /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                </span>
                {billingCycle === 'yearly' && (
                  <span className="ml-2 text-sm text-amber-600">
                    Save {PADDLE_PRODUCTS.premium.yearly.savings}
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {TIER_FEATURES.premium.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2">
                    <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-amber-600 hover:bg-amber-700"
                onClick={() => handleCheckout('premium')}
                disabled={isLoading === 'premium'}
              >
                {isLoading === 'premium' ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Subscribe to Premium
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </section>
  )
}

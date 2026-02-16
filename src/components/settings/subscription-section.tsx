'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Crown, Loader2, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useSubscription } from '@/lib/context'
import { TIER_INFO } from '@/lib/subscription-limits'
import {
  getSubscriptionDetails,
  getCustomerPortalUrl,
  cancelSubscription,
  resumeSubscription,
} from '@/lib/actions/paddle'
import { openTierCheckout } from '@/lib/paddle'
import { createClient } from '@/lib/supabase/client'

interface SubscriptionDetails {
  tier: string
  status: string
  cancelAtPeriodEnd: boolean
  currentPeriodEnd: string | null
  paymentProvider: string | null
}

export function SubscriptionSection() {
  const { tier, refreshTier } = useSubscription()
  const [details, setDetails] = useState<SubscriptionDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [userInfo, setUserInfo] = useState<{ email?: string; id?: string } | null>(null)

  // Fetch subscription details
  useEffect(() => {
    async function fetchDetails() {
      try {
        const [subDetails, supabase] = await Promise.all([
          getSubscriptionDetails(),
          createClient(),
        ])
        setDetails(subDetails)

        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setUserInfo({ email: user.email, id: user.id })
        }
      } catch (error) {
        console.error('Failed to fetch subscription details:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchDetails()
  }, [])

  const handleManageSubscription = async () => {
    setIsProcessing(true)
    try {
      const portalUrl = await getCustomerPortalUrl()
      if (portalUrl) {
        window.open(portalUrl, '_blank')
      } else {
        toast.error('Unable to open subscription portal')
      }
    } catch (error) {
      console.error('Failed to get portal URL:', error)
      toast.error('Failed to open subscription portal')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleCancelSubscription = async () => {
    setIsProcessing(true)
    try {
      const result = await cancelSubscription()
      if (result.success) {
        toast.success('Subscription will cancel at end of billing period')
        const newDetails = await getSubscriptionDetails()
        setDetails(newDetails)
      } else {
        toast.error(result.error || 'Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      toast.error('Failed to cancel subscription')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleResumeSubscription = async () => {
    setIsProcessing(true)
    try {
      const result = await resumeSubscription()
      if (result.success) {
        toast.success('Subscription resumed successfully')
        const newDetails = await getSubscriptionDetails()
        setDetails(newDetails)
        refreshTier()
      } else {
        toast.error(result.error || 'Failed to resume subscription')
      }
    } catch (error) {
      console.error('Failed to resume subscription:', error)
      toast.error('Failed to resume subscription')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleUpgrade = async (targetTier: 'pro' | 'premium') => {
    setIsProcessing(true)
    try {
      await openTierCheckout(targetTier, 'monthly', userInfo?.email, userInfo?.id)
    } catch (error) {
      console.error('Failed to open checkout:', error)
      toast.error('Failed to open checkout')
    } finally {
      setIsProcessing(false)
    }
  }

  // Listen for checkout completion
  useEffect(() => {
    const handleCheckoutComplete = async () => {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      const newDetails = await getSubscriptionDetails()
      setDetails(newDetails)
      refreshTier()
      toast.success('Subscription activated!')
    }

    window.addEventListener('paddle:checkout-complete', handleCheckoutComplete)
    return () => {
      window.removeEventListener('paddle:checkout-complete', handleCheckoutComplete)
    }
  }, [refreshTier])

  const tierInfo = TIER_INFO[tier]
  const isPaid = tier !== 'free'
  const isCanceling = details?.cancelAtPeriodEnd

  // Format date
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Subscription
        </CardTitle>
        <CardDescription>Manage your subscription and billing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Plan */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                tier === 'premium'
                  ? 'bg-amber-100 text-amber-600'
                  : tier === 'pro'
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">{tierInfo.name}</p>
                <Badge
                  variant={isPaid ? 'default' : 'secondary'}
                  className={
                    tier === 'premium'
                      ? 'bg-amber-500'
                      : tier === 'pro'
                      ? 'bg-emerald-500'
                      : ''
                  }
                >
                  {tier.toUpperCase()}
                </Badge>
                {isCanceling && (
                  <Badge variant="destructive">Canceling</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{tierInfo.tagline}</p>
            </div>
          </div>
        </div>

        {/* Billing Info for Paid Users */}
        {isPaid && details?.currentPeriodEnd && (
          <>
            <Separator />
            <div className="text-sm text-muted-foreground">
              {isCanceling ? (
                <p>
                  Your subscription will end on{' '}
                  <span className="font-medium text-foreground">
                    {formatDate(details.currentPeriodEnd)}
                  </span>
                </p>
              ) : (
                <p>
                  Next billing date:{' '}
                  <span className="font-medium text-foreground">
                    {formatDate(details.currentPeriodEnd)}
                  </span>
                </p>
              )}
            </div>
          </>
        )}

        <Separator />

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          {isPaid ? (
            <>
              {details?.paymentProvider === 'paddle' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSubscription}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <ExternalLink className="h-4 w-4 mr-2" />
                  )}
                  Manage Billing
                </Button>
              )}

              {tier === 'pro' && !isCanceling && (
                <Button
                  size="sm"
                  onClick={() => handleUpgrade('premium')}
                  disabled={isProcessing}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  Upgrade to Premium
                </Button>
              )}

              {isCanceling ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResumeSubscription}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Resume Subscription
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      Cancel Subscription
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Your subscription will remain active until{' '}
                        {formatDate(details?.currentPeriodEnd || null)}. After that,
                        you&apos;ll be downgraded to the free plan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelSubscription}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Cancel Subscription
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </>
          ) : (
            <>
              <Button
                size="sm"
                onClick={() => handleUpgrade('pro')}
                disabled={isProcessing}
                className="bg-emerald-500 hover:bg-emerald-600"
              >
                Upgrade to Pro
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUpgrade('premium')}
                disabled={isProcessing}
              >
                Upgrade to Premium
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

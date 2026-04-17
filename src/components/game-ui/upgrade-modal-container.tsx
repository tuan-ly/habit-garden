'use client'

import { useState, useEffect } from 'react'
import { useSubscription, useUpgradeModalState } from '@/lib/context'
import { UpgradeModal } from './upgrade-modal'
import { updateUpgradePromptAction } from '@/lib/actions/subscription'
import { openTierCheckout, isPaddleConfigured } from '@/lib/paddle'
import { createClient } from '@/lib/supabase/client'

/**
 * Global upgrade modal container
 * Renders the upgrade modal based on subscription context state
 * Integrates with Paddle checkout for payment
 */
export function UpgradeModalContainer() {
  const { tier, hideUpgradeModal, refreshTier } = useSubscription()
  const upgradeModal = useUpgradeModalState()
  const [isProcessing, setIsProcessing] = useState(false)
  const [userInfo, setUserInfo] = useState<{ email?: string; id?: string } | null>(null)

  // Fetch user info for checkout
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          setUserInfo({ email: user.email, id: user.id })
        }
      } catch (error) {
        console.error('Failed to fetch user info:', error)
      }
    }
    fetchUserInfo()
  }, [])

  // Listen for checkout complete events
  useEffect(() => {
    const handleCheckoutComplete = async () => {
      // Wait a moment for webhook to process
      await new Promise((resolve) => setTimeout(resolve, 2000))
      // Refresh tier to reflect new subscription
      await refreshTier()
      hideUpgradeModal()
    }

    window.addEventListener('paddle:checkout-complete', handleCheckoutComplete)
    return () => {
      window.removeEventListener('paddle:checkout-complete', handleCheckoutComplete)
    }
  }, [refreshTier, hideUpgradeModal])

  // Handle URL params for subscription success
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('subscription') === 'success') {
      // Clean URL
      window.history.replaceState({}, '', window.location.pathname)
      // Refresh tier
      refreshTier()
    }
  }, [refreshTier])

  const handleUpgrade = async (targetTier: 'pro' | 'premium') => {
    setIsProcessing(true)

    try {
      // Track the upgrade click
      await updateUpgradePromptAction(upgradeModal.trigger, 'clicked_upgrade')

      // Check if Paddle is configured
      if (!isPaddleConfigured()) {
        // Fallback to pricing page if Paddle not configured
        console.warn('Paddle not configured, redirecting to pricing page')
        window.location.href = '/pricing'
        return
      }

      // Open Paddle checkout
      await openTierCheckout(targetTier, 'monthly', userInfo?.email, userInfo?.id)

      // Note: Modal stays open during checkout
      // It will close when checkout completes via event listener
    } catch (error) {
      console.error('Failed to open checkout:', error)
      // Fallback to pricing page
      window.location.href = '/pricing'
    } finally {
      setIsProcessing(false)
    }
  }

  const handleStartTrial = async () => {
    setIsProcessing(true)

    try {
      // Track the trial start
      await updateUpgradePromptAction(upgradeModal.trigger, 'started_trial')

      // Check if Paddle is configured
      if (!isPaddleConfigured()) {
        window.location.href = '/pricing?trial=true'
        return
      }

      // Open Paddle checkout for PRO trial
      // Note: Trial setup should be configured in Paddle dashboard
      await openTierCheckout('pro', 'monthly', userInfo?.email, userInfo?.id)
    } catch (error) {
      console.error('Failed to start trial:', error)
      window.location.href = '/pricing?trial=true'
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOpenChange = async (open: boolean) => {
    if (!open && !isProcessing) {
      // Track dismissal
      await updateUpgradePromptAction(upgradeModal.trigger, 'dismissed')
      hideUpgradeModal()
    }
  }

  return (
    <UpgradeModal
      open={upgradeModal.open}
      onOpenChange={handleOpenChange}
      trigger={upgradeModal.trigger}
      context={upgradeModal.context}
      currentTier={tier}
      onUpgrade={handleUpgrade}
      onStartTrial={handleStartTrial}
    />
  )
}

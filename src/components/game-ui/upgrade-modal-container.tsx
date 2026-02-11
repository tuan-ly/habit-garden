'use client'

import { useSubscription } from '@/lib/context'
import { UpgradeModal } from './upgrade-modal'
import { updateUpgradePromptAction } from '@/lib/actions/subscription'

/**
 * Global upgrade modal container
 * Renders the upgrade modal based on subscription context state
 */
export function UpgradeModalContainer() {
  const { tier, upgradeModal, hideUpgradeModal } = useSubscription()

  const handleUpgrade = async (targetTier: 'pro' | 'premium') => {
    // Track the upgrade click
    await updateUpgradePromptAction(upgradeModal.trigger, 'clicked_upgrade')

    // TODO: Redirect to pricing/checkout page
    // For now, just close the modal
    window.location.href = '/pricing'
  }

  const handleStartTrial = async () => {
    // Track the trial start
    await updateUpgradePromptAction(upgradeModal.trigger, 'started_trial')

    // TODO: Start trial flow
    // For now, redirect to pricing page
    window.location.href = '/pricing?trial=true'
  }

  const handleOpenChange = async (open: boolean) => {
    if (!open) {
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

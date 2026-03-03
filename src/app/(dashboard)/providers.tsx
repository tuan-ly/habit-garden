'use client'

import { MoodProvider } from '@/lib/context/mood-context'
import { GardenSettingsProvider } from '@/lib/context/garden-settings-context'
import { SubscriptionProvider } from '@/lib/context/subscription-context'
import { DevDebugProvider, DevDebugPanel } from '@/components/dev'
import { UpgradeModalContainer } from '@/components/game-ui/upgrade-modal-container'
import type { MoodLevel } from '@/lib/mood-system'
import type { SubscriptionTier } from '@/lib/subscription-limits'
import type { ReactNode } from 'react'

interface DashboardProvidersProps {
  children: ReactNode
  initialMood?: MoodLevel
  initialTier?: SubscriptionTier
}

export function DashboardProviders({
  children,
  initialMood,
  initialTier = 'free',
}: DashboardProvidersProps) {
  return (
    <DevDebugProvider>
      <SubscriptionProvider initialTier={initialTier}>
        <MoodProvider initialMood={initialMood}>
          <GardenSettingsProvider>
            {children}
            {/* Dev Debug Panel - only renders in development */}
            <DevDebugPanel />
            {/* Global upgrade modal */}
            <UpgradeModalContainer />
          </GardenSettingsProvider>
        </MoodProvider>
      </SubscriptionProvider>
    </DevDebugProvider>
  )
}

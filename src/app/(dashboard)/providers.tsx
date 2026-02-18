'use client'

import { MoodProvider } from '@/lib/context/mood-context'
import { WeedsProvider } from '@/lib/context/weeds-context'
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
  initialWeeds?: { [plantId: string]: number }
  initialTier?: SubscriptionTier
}

export function DashboardProviders({
  children,
  initialMood,
  initialWeeds = {},
  initialTier = 'free',
}: DashboardProvidersProps) {
  return (
    <DevDebugProvider>
      <SubscriptionProvider initialTier={initialTier}>
        <MoodProvider initialMood={initialMood}>
          <WeedsProvider initialWeeds={initialWeeds}>
            <GardenSettingsProvider>
              {children}
              {/* Dev Debug Panel - only renders in development */}
              <DevDebugPanel />
              {/* Global upgrade modal */}
              <UpgradeModalContainer />
            </GardenSettingsProvider>
          </WeedsProvider>
        </MoodProvider>
      </SubscriptionProvider>
    </DevDebugProvider>
  )
}

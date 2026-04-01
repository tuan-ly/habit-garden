'use client'

import { MoodProvider } from '@/lib/context/mood-context'
import { GardenSettingsProvider } from '@/lib/context/garden-settings-context'
import { SubscriptionProvider } from '@/lib/context/subscription-context'
import { DashboardDataProvider } from '@/lib/context/dashboard-data-context'
import { InventoryProvider } from '@/lib/context'
import { DevDebugProvider, DevDebugPanel } from '@/components/dev'
import { UpgradeModalContainer } from '@/components/game-ui/upgrade-modal-container'
import type { MoodLevel } from '@/lib/mood-system'
import type { SubscriptionTier } from '@/lib/subscription-limits'
import type { Profile, PlantType } from '@/types/database'
import type { User } from '@supabase/supabase-js'
import type { ReactNode } from 'react'

interface DashboardProvidersProps {
  children: ReactNode
  initialMood?: MoodLevel
  user: User
  profile: Profile | null
  plantTypes: PlantType[]
}

export function DashboardProviders({
  children,
  initialMood,
  user,
  profile,
  plantTypes,
}: DashboardProvidersProps) {
  const initialTier: SubscriptionTier = (profile?.subscription_tier as SubscriptionTier) ?? 'free'

  return (
    <DevDebugProvider>
      <DashboardDataProvider
        initialUser={user}
        initialProfile={profile!}
        initialPlantTypes={plantTypes}
      >
        <SubscriptionProvider initialTier={initialTier}>
          <MoodProvider initialMood={initialMood}>
            <GardenSettingsProvider>
              <InventoryProvider>
                {children}
                {/* Dev Debug Panel - only renders in development */}
                <DevDebugPanel />
                {/* Global upgrade modal */}
                <UpgradeModalContainer />
              </InventoryProvider>
            </GardenSettingsProvider>
          </MoodProvider>
        </SubscriptionProvider>
      </DashboardDataProvider>
    </DevDebugProvider>
  )
}

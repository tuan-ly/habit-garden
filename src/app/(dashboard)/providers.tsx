'use client'

import dynamic from 'next/dynamic'
import { MoodProvider } from '@/lib/context/mood-context'
import { GardenSettingsProvider } from '@/lib/context/garden-settings-context'
import { SubscriptionProvider, useUpgradeModalState } from '@/lib/context/subscription-context'
import { DashboardDataProvider } from '@/lib/context/dashboard-data-context'
import { InventoryProvider } from '@/lib/context/inventory-context'
import { DevDebugProvider } from '@/components/dev/dev-debug-context'
import { DevDebugPanel } from '@/components/dev/dev-debug-panel'
import type { MoodLevel } from '@/lib/mood-system'
import type { SubscriptionTier } from '@/lib/subscription-limits'
import type { Profile, PlantType } from '@/types/database'
import type { User } from '@supabase/supabase-js'
import type { ReactNode } from 'react'

// Dynamic import — UpgradeModalContainer includes Paddle SDK and is rarely shown
const UpgradeModalContainer = dynamic(
  () => import('@/components/game-ui/upgrade-modal-container').then(m => ({ default: m.UpgradeModalContainer })),
  { ssr: false }
)

function UpgradeModalBoundary() {
  const { open } = useUpgradeModalState()
  return open ? <UpgradeModalContainer /> : null
}

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
              <InventoryProvider initialCoins={profile?.coins ?? 0}>
                {children}
                {/* Dev Debug Panel - only renders in development */}
                <DevDebugPanel />
                {/* Global upgrade modal */}
                <UpgradeModalBoundary />
              </InventoryProvider>
            </GardenSettingsProvider>
          </MoodProvider>
        </SubscriptionProvider>
      </DashboardDataProvider>
    </DevDebugProvider>
  )
}

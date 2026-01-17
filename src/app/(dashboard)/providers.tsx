'use client'

import { EnergyProvider } from '@/lib/context/energy-context'
import { WeedsProvider } from '@/lib/context/weeds-context'
import type { EnergyLevel } from '@/lib/energy-system'
import type { ReactNode } from 'react'

interface DashboardProvidersProps {
  children: ReactNode
  initialEnergy?: EnergyLevel
  initialWeeds?: { [plantId: string]: number }
}

export function DashboardProviders({
  children,
  initialEnergy,
  initialWeeds = {},
}: DashboardProvidersProps) {
  return (
    <EnergyProvider initialEnergy={initialEnergy}>
      <WeedsProvider initialWeeds={initialWeeds}>{children}</WeedsProvider>
    </EnergyProvider>
  )
}

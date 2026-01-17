'use client'

import { MoodProvider } from '@/lib/context/mood-context'
import { WeedsProvider } from '@/lib/context/weeds-context'
import type { MoodLevel } from '@/lib/mood-system'
import type { ReactNode } from 'react'

interface DashboardProvidersProps {
  children: ReactNode
  initialMood?: MoodLevel
  initialWeeds?: { [plantId: string]: number }
}

export function DashboardProviders({
  children,
  initialMood,
  initialWeeds = {},
}: DashboardProvidersProps) {
  return (
    <MoodProvider initialMood={initialMood}>
      <WeedsProvider initialWeeds={initialWeeds}>{children}</WeedsProvider>
    </MoodProvider>
  )
}

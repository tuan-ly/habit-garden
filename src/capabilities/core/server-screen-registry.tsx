import type { ReactNode } from 'react'
import { ReadingCompletionPage } from '@/capabilities/reading/pages/completion-page'
import { ReadingPlanPage } from '@/capabilities/reading/pages/plan-page'
import { ReadingSessionPage } from '@/capabilities/reading/pages/session-page'
import { createCapabilityRegistry } from '@/capabilities/core/registry'
import type { CapabilityKey } from '@/capabilities/core/types'

export type CapabilityScreenKey = 'session' | 'completion' | 'plan'

interface CapabilityScreenProps {
  plantId: string
  sessionId?: string
}

type CapabilityScreenRenderer = (props: CapabilityScreenProps) => Promise<ReactNode>
type CapabilityScreens = Partial<Record<CapabilityScreenKey, CapabilityScreenRenderer>>

const screenRegistry = createCapabilityRegistry<CapabilityScreens>({
  reading: {
    session: ReadingSessionPage,
    completion: ReadingCompletionPage,
    plan: ReadingPlanPage,
  },
} satisfies Record<CapabilityKey, CapabilityScreens>)

export async function renderCapabilityScreen(
  capabilityType: string,
  screen: CapabilityScreenKey,
  props: CapabilityScreenProps
): Promise<ReactNode | null> {
  const screens = screenRegistry.get(capabilityType)
  const renderer = screens?.[screen]
  return renderer ? renderer(props) : null
}

export function hasCapabilityScreens(capabilityType: string): boolean {
  const screens = screenRegistry.get(capabilityType)
  return Boolean(screens && Object.keys(screens).length > 0)
}

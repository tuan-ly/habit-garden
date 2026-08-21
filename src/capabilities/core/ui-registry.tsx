import type { ReactNode } from 'react'
import { ReadingHome } from '@/components/reading/reading-home'
import { createCapabilityRegistry } from '@/capabilities/core/registry'
import type { ReadingJourneySnapshot } from '@/types/habits'
import type { CapabilityKey } from '@/capabilities/core/types'

type JourneyRenderer = (snapshot: unknown) => ReactNode

const uiRegistry = createCapabilityRegistry<JourneyRenderer>({
  reading: snapshot => (
    <ReadingHome snapshot={snapshot as ReadingJourneySnapshot} />
  ),
} satisfies Record<CapabilityKey, JourneyRenderer>)

export function renderCapabilityJourney(key: string, snapshot: unknown): ReactNode | null {
  const renderer = uiRegistry.get(key)
  return renderer ? renderer(snapshot) : null
}

export function hasCapabilityJourneyRenderer(key: string): boolean {
  return uiRegistry.has(key)
}

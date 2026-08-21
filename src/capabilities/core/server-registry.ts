import { getReadingJourneySnapshot } from '@/lib/actions/habit-sessions'
import { createCapabilityRegistry } from '@/capabilities/core/registry'
import type { CapabilityKey } from '@/capabilities/core/types'

export type CapabilityJourneyResult =
  | { success: true; data: unknown }
  | { success: false; code: string; error: string }

export interface CapabilityServerDriver {
  key: CapabilityKey
  loadJourney: (plantId: string) => Promise<CapabilityJourneyResult>
}

const serverRegistry = createCapabilityRegistry<CapabilityServerDriver>({
  reading: {
    key: 'reading',
    loadJourney: getReadingJourneySnapshot,
  },
} satisfies Record<CapabilityKey, CapabilityServerDriver>)

export function getCapabilityServerDriver(key: string): CapabilityServerDriver | null {
  return serverRegistry.get(key)
}

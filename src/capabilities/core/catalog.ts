import { READING_CAPABILITY_MANIFEST } from '@/capabilities/reading/manifest'
import { createCapabilityRegistry } from '@/capabilities/core/registry'
import type { CapabilityKey, CapabilityManifest } from '@/capabilities/core/types'

const catalog = createCapabilityRegistry<CapabilityManifest>({
  reading: READING_CAPABILITY_MANIFEST,
} satisfies Record<CapabilityKey, CapabilityManifest>)

export const CAPABILITY_CATALOG = catalog.entries

export function getCapabilityManifest(key: string): CapabilityManifest | null {
  return catalog.get(key)
}

export function listCapabilityManifests(): CapabilityManifest[] {
  return catalog.list()
}

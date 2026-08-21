import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  getCapabilityManifest,
  listCapabilityManifests,
} from '@/capabilities/core/catalog'
import { hasCapabilityFocusAction } from '@/capabilities/core/client-ui-registry'
import {
  getCapabilityCompletionHref,
  getCapabilityPlanHref,
  getCapabilitySessionHref,
} from '@/capabilities/core/routes'
import { createCapabilityRegistry } from '@/capabilities/core/registry'
import { getCapabilityServerDriver } from '@/capabilities/core/server-registry'
import { hasCapabilityScreens } from '@/capabilities/core/server-screen-registry'
import { hasCapabilityJourneyRenderer } from '@/capabilities/core/ui-registry'

describe('capability plugin platform', () => {
  it('registers every catalog entry across server and UI extension points', () => {
    const manifests = listCapabilityManifests()

    expect(manifests).not.toHaveLength(0)
    for (const manifest of manifests) {
      expect(getCapabilityManifest(manifest.key)).toBe(manifest)
      expect(getCapabilityServerDriver(manifest.key)?.key).toBe(manifest.key)
      expect(hasCapabilityJourneyRenderer(manifest.key)).toBe(true)
      expect(hasCapabilityScreens(manifest.key)).toBe(true)
      expect(hasCapabilityFocusAction(manifest.key)).toBe(true)
    }
    expect(getCapabilityManifest('unknown')).toBeNull()
    expect(getCapabilityServerDriver('unknown')).toBeNull()
  })

  it('keeps every capability destination under one generic plant journey', () => {
    expect(getCapabilitySessionHref('plant-1', 'session-1')).toBe(
      '/plant/plant-1/journey/session?id=session-1'
    )
    expect(getCapabilityCompletionHref('plant-1', 'session-1')).toBe(
      '/plant/plant-1/journey/completion?id=session-1'
    )
    expect(getCapabilityPlanHref('plant-1')).toBe('/plant/plant-1/journey/plan')
  })

  it('can register a second test capability without changing Garden or lifecycle code', () => {
    const testRegistry = createCapabilityRegistry({
      reading: { key: 'reading' },
      movement: { key: 'movement' },
    })

    expect(testRegistry.list().map(entry => entry.key)).toEqual([
      'reading',
      'movement',
    ])
    expect(testRegistry.get('movement')).toEqual({ key: 'movement' })
    expect(testRegistry.has('movement')).toBe(true)
  })

  it('keeps Reading-specific branches out of Garden and the plant dispatcher', () => {
    const genericFiles = [
      'src/components/garden/isometric-plant.tsx',
      'src/components/garden/sanctuary-garden-chrome.tsx',
      'src/components/garden/sanctuary-plant-detail-sheet.tsx',
      'src/app/(dashboard)/plant/[plantId]/page.tsx',
      'src/app/(dashboard)/plant/[plantId]/journey/session/page.tsx',
      'src/app/(dashboard)/plant/[plantId]/journey/completion/page.tsx',
      'src/app/(dashboard)/plant/[plantId]/journey/plan/page.tsx',
    ]

    for (const file of genericFiles) {
      const source = readFileSync(resolve(file), 'utf8').toLowerCase()
      expect(source, file).not.toContain('reading')
    }
  })

  it('keeps paused capabilities out of executable journey screens', () => {
    const screenFiles = [
      'src/app/(dashboard)/plant/[plantId]/journey/session/page.tsx',
      'src/app/(dashboard)/plant/[plantId]/journey/completion/page.tsx',
      'src/app/(dashboard)/plant/[plantId]/journey/plan/page.tsx',
    ]

    for (const file of screenFiles) {
      const source = readFileSync(resolve(file), 'utf8')
      expect(source, file).toContain('!capability.data?.is_active')
    }
  })
})

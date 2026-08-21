import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PlantWithType } from '@/types/database'
import { getGuidedHabitHref } from '../sanctuary-plant-detail-sheet'
import { hasActiveCapability } from '../isometric-plant'

const sanctuaryChrome = readFileSync(
  resolve('src/components/garden/sanctuary-garden-chrome.tsx'),
  'utf8'
)
const isometricGarden = readFileSync(
  resolve('src/components/garden/isometric-garden.tsx'),
  'utf8'
)

function plantWithCapability(
  type: string,
  isActive = true
): PlantWithType {
  return {
    id: 'plant-1',
    guided_habit: {
      id: 'habit-1',
      plant_id: 'plant-1',
      type,
      is_active: isActive,
    },
  } as PlantWithType
}

describe('guided plant capability routing', () => {
  it('routes any active capability from its real plant', () => {
    const plant = plantWithCapability('reading')

    expect(getGuidedHabitHref(plant)).toBe('/plant/plant-1')
    expect(hasActiveCapability(plant)).toBe(true)
    expect(getGuidedHabitHref(plantWithCapability('movement'))).toBe('/plant/plant-1')
    expect(hasActiveCapability(plantWithCapability('movement'))).toBe(true)
  })

  it('keeps inactive capabilities in the normal plant flow', () => {
    expect(getGuidedHabitHref(plantWithCapability('reading', false))).toBeNull()
    expect(hasActiveCapability(plantWithCapability('reading', false))).toBe(false)
  })

  it('keeps journey management reachable without competing with the primary focus action', () => {
    expect(sanctuaryChrome).toContain('aria-label={`Mở chi tiết ${focusedPlant.name}`}')
    expect(sanctuaryChrome).toContain('Chi tiết')
    expect(isometricGarden).toContain('interactions.handleShowInfo(sanctuaryDisplayPlant)')
  })
})

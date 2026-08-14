import { describe, expect, it } from 'vitest'
import type { PlantWithType } from '@/types/database'
import { getGuidedHabitHref } from '../sanctuary-plant-detail-sheet'
import { hasActiveReadingCapability } from '../isometric-plant'

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
  it('routes an active reading capability from its real plant', () => {
    const plant = plantWithCapability('reading')

    expect(getGuidedHabitHref(plant)).toBe('/plant/plant-1')
    expect(hasActiveReadingCapability(plant)).toBe(true)
  })

  it('keeps inactive and unsupported capabilities in the normal plant flow', () => {
    expect(getGuidedHabitHref(plantWithCapability('reading', false))).toBeNull()
    expect(getGuidedHabitHref(plantWithCapability('exercise'))).toBeNull()
    expect(hasActiveReadingCapability(plantWithCapability('reading', false))).toBe(false)
    expect(hasActiveReadingCapability(plantWithCapability('exercise'))).toBe(false)
  })
})

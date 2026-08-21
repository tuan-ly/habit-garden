import { describe, expect, it } from 'vitest'
import {
  getPlantHref,
  getReadingCompletionHref,
  getReadingGrowthPlanHref,
  getReadingSessionHref,
} from '@/lib/reading-routes'

describe('plant-scoped Reading routes', () => {
  it('keeps the plant as the canonical resource path', () => {
    expect(getPlantHref('plant-1')).toBe('/plant/plant-1')
  })

  it('nests every Reading destination under the same plant', () => {
    expect(getReadingSessionHref('plant-1')).toBe('/plant/plant-1/journey/session')
    expect(getReadingSessionHref('plant-1', 'session-1')).toBe(
      '/plant/plant-1/journey/session?id=session-1'
    )
    expect(getReadingCompletionHref('plant-1', 'session-1')).toBe(
      '/plant/plant-1/journey/completion?id=session-1'
    )
    expect(getReadingGrowthPlanHref('plant-1')).toBe(
      '/plant/plant-1/journey/plan'
    )
  })
})

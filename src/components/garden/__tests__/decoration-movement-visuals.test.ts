import { describe, expect, it } from 'vitest'
import { isPlantSelectedForMove, shouldRenderPlacementGhost } from '../garden-tile-grid'
import { getTileContentScale } from '../isometric-tile'

describe('decoration movement visuals', () => {
  it('keeps arranged decoration content at its authored size', () => {
    expect(getTileContentScale(true, false, true)).toBe(1)
  })

  it('preserves the existing hover affordance for normal plant content', () => {
    expect(getTileContentScale(true, false, false)).toBe(1.2)
  })

  it('does not duplicate the selected decoration at its original anchor', () => {
    expect(shouldRenderPlacementGhost(true, true)).toBe(false)
  })

  it('renders the movement ghost after it leaves the selected anchor', () => {
    expect(shouldRenderPlacementGhost(true, false)).toBe(true)
  })

  it('does not mark decoration tiles as selected when no plant exists on them', () => {
    expect(isPlantSelectedForMove(undefined, undefined)).toBe(false)
  })

  it('marks only the matching plant as selected for movement', () => {
    expect(isPlantSelectedForMove('plant-1', 'plant-1')).toBe(true)
    expect(isPlantSelectedForMove('plant-2', 'plant-1')).toBe(false)
  })
})

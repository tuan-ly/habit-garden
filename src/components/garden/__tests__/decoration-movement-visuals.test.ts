import { describe, expect, it } from 'vitest'
import {
  isPlantSelectedForMove,
  shouldDisableContentHoverScale,
  shouldShowPlantAddHint,
} from '../garden-tile-grid'
import { getPlantShadowScale, getTileContentScale } from '../isometric-tile'
import { findInitialGhostPlacement } from '../edit-mode/use-edit-mode'
import { getDecorationGhostWorldPosition } from '../edit-mode/decoration-placement-ghost-layer'

describe('decoration movement visuals', () => {
  it('shows a newly selected inventory decoration at the free anchor nearest the garden centre', () => {
    const placement = findInitialGhostPlacement(5, 2, new Set(['1-1', '1-2', '2-1', '2-2']))

    expect(placement).toEqual({ position: { row: 1, col: 3 }, isValid: true })
  })

  it('still shows an invalid ghost when no anchor is free', () => {
    const occupiedCells = new Set(Array.from({ length: 4 }, (_, index) => `${Math.floor(index / 2)}-${index % 2}`))

    expect(findInitialGhostPlacement(2, 1, occupiedCells)).toEqual({
      position: { row: 0, col: 0 },
      isValid: false,
    })
  })

  it('hides the plant add hint while placing a decoration', () => {
    expect(shouldShowPlantAddHint('arrange', false, true)).toBe(false)
  })

  it('shows the plant add hint only when arrange mode has no active placement', () => {
    expect(shouldShowPlantAddHint('arrange', false, false)).toBe(true)
    expect(shouldShowPlantAddHint('interact', false, false)).toBe(false)
  })

  it('keeps arranged decoration content at its authored size', () => {
    expect(getTileContentScale(true, false, true)).toBe(1)
  })

  it('preserves the existing hover affordance for normal plant content', () => {
    expect(getTileContentScale(true, false, false)).toBe(1.2)
  })

  it('disables hover enlargement for decorations in every garden mode', () => {
    expect(shouldDisableContentHoverScale(null, true)).toBe(true)
  })

  it('keeps hover enlargement enabled for plants outside focused state', () => {
    expect(shouldDisableContentHoverScale(null, false)).toBe(false)
  })

  it('keeps focused garden content at its authored focus size', () => {
    expect(getTileContentScale(true, false, true)).toBe(1)
  })

  it('anchors the decoration ghost to the centre of its isometric footprint', () => {
    expect(getDecorationGhostWorldPosition({
      row: 2,
      col: 3,
      gridSize: 8,
      tileSize: 100,
      footprint: 2,
    })).toEqual({ left: 450, top: 175 })
  })

  it('does not mark decoration tiles as selected when no plant exists on them', () => {
    expect(isPlantSelectedForMove(undefined, undefined)).toBe(false)
  })

  it('marks only the matching plant as selected for movement', () => {
    expect(isPlantSelectedForMove('plant-1', 'plant-1')).toBe(true)
    expect(isPlantSelectedForMove('plant-2', 'plant-1')).toBe(false)
  })
})

describe('plant shadow scale', () => {
  it('keeps young plant shadows smaller than mature plant shadows', () => {
    expect(getPlantShadowScale(5)).toBe(0.46)
    expect(getPlantShadowScale(20)).toBe(0.58)
    expect(getPlantShadowScale(100)).toBe(1)
  })

  it('grows monotonically across growth stages', () => {
    const stages = [0, 10, 25, 50, 75, 100].map(getPlantShadowScale)
    expect(stages).toEqual([...stages].sort((a, b) => a - b))
  })
})

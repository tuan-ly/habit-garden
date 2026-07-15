import { describe, expect, it } from 'vitest'
import { getGroundedArtTransform, getTileOffsetTransform } from '../game-asset-display'

describe('grounded asset display transforms', () => {
  it('scales around the reviewed contact point', () => {
    expect(getGroundedArtTransform({ anchorX: 0.42, anchorY: 0.9, scale: 1.12 })).toEqual({
      transform: 'translate(8%, 10%) scale(1.12)',
      transformOrigin: '42% 90%',
    })
  })

  it('resolves offsets in tile pixels on an independent wrapper', () => {
    expect(getTileOffsetTransform({ offsetX: 0.125, offsetY: -0.2 }, 140)).toEqual({
      transform: 'translate(17.5px, -28px)',
    })
    expect(getTileOffsetTransform({ offsetX: 0, offsetY: 0 }, 140)).toEqual({})
  })
})

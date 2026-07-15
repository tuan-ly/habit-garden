import { describe, expect, it } from 'vitest'
import { getDecorationArtSpec, getGroundedArtTransform } from '../decoration-art-spec'

describe('decoration art anchors', () => {
  it('uses measured alpha contact point for the sanctuary rock lantern', () => {
    const spec = getDecorationArtSpec('stone-lantern', true)

    expect(spec.anchorX).toBeCloseTo(0.3862)
    expect(spec.anchorY).toBeCloseTo(0.7608)
    expect(getGroundedArtTransform(spec).transformOrigin).toBe('38.62% 76.08%')
  })

  it('compensates emoji glyphs whose optical center sits to the right', () => {
    expect(getDecorationArtSpec('stepping-stone', false).anchorX).toBeGreaterThan(0.5)
    expect(getDecorationArtSpec('paper-lantern', false).anchorX).toBeGreaterThan(0.5)
  })

  it('keeps fallback anchors inside the source box', () => {
    for (const hasImage of [true, false]) {
      const spec = getDecorationArtSpec('unknown-decoration', hasImage)
      expect(spec.anchorX).toBeGreaterThan(0)
      expect(spec.anchorX).toBeLessThan(1)
      expect(spec.anchorY).toBeGreaterThan(0)
      expect(spec.anchorY).toBeLessThanOrEqual(1)
      expect(spec.scale).toBe(1)
      expect(spec.offsetX).toBe(0)
      expect(spec.offsetY).toBe(0)
    }
  })
})

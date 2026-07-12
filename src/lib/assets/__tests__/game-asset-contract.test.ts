import { describe, expect, it } from 'vitest'
import { getDecorationAssetSpec, getPlantAssetSpec } from '../game-asset-contract'

describe('game asset contract', () => {
  it('loads measured decoration grounding data', () => {
    const asset = getDecorationAssetSpec('stone-lantern')
    expect(asset?.kind).toBe('decoration')
    expect(asset?.display.anchorY).toBeGreaterThan(0.7)
    expect(asset?.analysis.transparent).toBe(true)
  })

  it('loads every plant stage by canonical runtime filename', () => {
    for (const filename of ['01-seed.png', '02-sprout.png', '03-growing.png', '04-blooming.png', '05-mature.png']) {
      expect(getPlantAssetSpec('cactus', filename)?.path).toBe(`/plants/cactus/${filename}`)
    }
  })
})

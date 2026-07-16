import { describe, expect, it } from 'vitest'
import { resolveGameAssetDisplay, type GameAssetEntry } from '../game-asset-contract'
import { getGardenEntityRenderMetrics, getGardenTileSize } from '../game-asset-render-metrics'

const display = { anchorX: 0.5, anchorY: 0.9, scale: 1, offsetX: 0, offsetY: 0 }

describe('footprint-aware garden render contract', () => {
  it('resolves an exact footprint profile before the base display', () => {
    const asset = {
      display,
      displayByFootprint: { '2': { ...display, scale: 0.88 } },
    } as Pick<GameAssetEntry, 'display' | 'displayByFootprint'>
    expect(resolveGameAssetDisplay(asset, 2).scale).toBe(0.88)
    expect(resolveGameAssetDisplay(asset, 3).scale).toBe(1)
  })

  it('uses the same logical tile sizes as sanctuary production', () => {
    expect(getGardenTileSize(390, true)).toBe(132)
    expect(getGardenTileSize(768, true)).toBe(120)
    expect(getGardenTileSize(1440, true)).toBe(140)
  })

  it('keeps editor magnification outside entity-to-tile render metrics', () => {
    const plant = getGardenEntityRenderMetrics({ kind: 'plant', tileSize: 140, footprint: 4, growthPercentage: 100 })
    const decoration = getGardenEntityRenderMetrics({ kind: 'decoration', tileSize: 140, footprint: 3 })
    expect(plant.artBoxSize).toBe(64)
    expect(plant.artSize).toBeCloseTo(64 * 1.2 * 3.4)
    expect(decoration.artSize).toBeCloseTo(140 * (0.62 + 3 * 0.62))
  })
})

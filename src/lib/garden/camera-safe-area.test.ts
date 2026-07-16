import { describe, expect, it } from 'vitest'
import runtimeManifest from '@/generated/game-asset-runtime-manifest.json'
import type { PlantWithType } from '@/types/database'
import {
  calculateGardenVisualBounds,
  fitVisualBoundsToSafeArea,
  getSanctuarySafeInsets,
  getTransformedAssetBounds,
  unionVisualBounds,
  type VisualBounds,
} from './camera-safe-area'

function projectScene(bounds: VisualBounds, fit: ReturnType<typeof fitVisualBoundsToSafeArea>, viewport: { width: number; height: number }, container: { width: number; height: number }) {
  return {
    left: viewport.width / 2 + fit.translateX + (bounds.left - container.width / 2) * fit.baseScale,
    top: viewport.height / 2 + fit.translateY + (bounds.top - container.height / 2) * fit.baseScale,
    right: viewport.width / 2 + fit.translateX + (bounds.right - container.width / 2) * fit.baseScale,
    bottom: viewport.height / 2 + fit.translateY + (bounds.bottom - container.height / 2) * fit.baseScale,
  }
}

describe('camera safe area geometry', () => {
  it('keeps reviewed offsets independent from art, growth and footprint scale', () => {
    const common = {
      contactX: 100,
      contactY: 120,
      sourceBounds: { left: 0.2, top: 0.1, right: 0.8, bottom: 0.9 },
      display: { anchorX: 0.45, anchorY: 0.85, scale: 1.1, offsetX: 0.1, offsetY: -0.2 },
      boxSize: 64,
      tileSize: 140,
    }
    const normal = getTransformedAssetBounds({ ...common, renderScale: 1 })
    const grown = getTransformedAssetBounds({ ...common, renderScale: 2.5 })
    const noOffset = getTransformedAssetBounds({ ...common, display: { ...common.display, offsetX: 0, offsetY: 0 }, renderScale: 2.5 })
    expect(grown.left - noOffset.left).toBeCloseTo(14)
    expect(grown.top - noOffset.top).toBeCloseTo(-28)
    expect(grown.right - grown.left).toBeGreaterThan(normal.right - normal.left)
  })

  it('uses the ground plane for an empty garden and full-box bounds for missing art', () => {
    expect(calculateGardenVisualBounds({ gridSize: 4, tileSize: 100, containerHeight: 250, plants: [], decorations: [] })).toEqual({
      left: 0, top: 0, right: 400, bottom: 250,
    })

    const deadPlant = {
      grid_row: 0,
      grid_col: 0,
      grid_size: 1,
      growth_percentage: 100,
      status: 'dead',
      plant_type: { name: 'Unknown species' },
    } as PlantWithType
    const withFallback = calculateGardenVisualBounds({
      gridSize: 1,
      tileSize: 100,
      containerHeight: 50,
      plants: [deadPlant],
      decorations: [],
    })
    expect(withFallback.top).toBeLessThan(0)
    expect(withFallback.right).toBeGreaterThanOrEqual(100)
  })

  it.each([
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 },
  ])('fits asymmetric scene bounds inside the safe frame at $width×$height', (viewport) => {
    const container = { width: 1120, height: 650 }
    const scene = { left: -95, top: -180, right: 1190, bottom: 720 }
    const fit = fitVisualBoundsToSafeArea({
      viewportWidth: viewport.width,
      viewportHeight: viewport.height,
      containerWidth: container.width,
      containerHeight: container.height,
      sceneBounds: scene,
      insets: getSanctuarySafeInsets(viewport.width),
    })
    const projected = projectScene(scene, fit, viewport, container)
    expect(fit.baseScale).toBeLessThanOrEqual(1)
    expect(projected.left).toBeGreaterThanOrEqual(fit.safeBounds.left - 0.001)
    expect(projected.top).toBeGreaterThanOrEqual(fit.safeBounds.top - 0.001)
    expect(projected.right).toBeLessThanOrEqual(fit.safeBounds.right + 0.001)
    expect(projected.bottom).toBeLessThanOrEqual(fit.safeBounds.bottom + 0.001)
  })

  it('batch-fits every manifest silhouette at garden corners for the three reference viewports', () => {
    const container = { width: 1120, height: 650 }
    const ground = { left: 0, top: 0, right: container.width, bottom: container.height }
    const contacts = [{ x: 0, y: 0 }, { x: 1120, y: 0 }, { x: 0, y: 650 }, { x: 1120, y: 650 }]
    for (const asset of runtimeManifest.assets) {
      const silhouettes = contacts.map((contact) => getTransformedAssetBounds({
        contactX: contact.x,
        contactY: contact.y,
        sourceBounds: asset.analysis.bounds,
        display: asset.display,
        boxSize: asset.kind === 'plant' ? 64 : 174,
        renderScale: asset.kind === 'plant' ? 3.84 : 1,
        tileSize: 140,
      }))
      const scene = unionVisualBounds(ground, ...silhouettes)
      for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
        const fit = fitVisualBoundsToSafeArea({
          viewportWidth: viewport.width,
          viewportHeight: viewport.height,
          containerWidth: container.width,
          containerHeight: container.height,
          sceneBounds: scene,
          insets: getSanctuarySafeInsets(viewport.width),
        })
        const projected = projectScene(scene, fit, viewport, container)
        expect(projected.left).toBeGreaterThanOrEqual(fit.safeBounds.left - 0.001)
        expect(projected.right).toBeLessThanOrEqual(fit.safeBounds.right + 0.001)
        expect(projected.top).toBeGreaterThanOrEqual(fit.safeBounds.top - 0.001)
        expect(projected.bottom).toBeLessThanOrEqual(fit.safeBounds.bottom + 0.001)
      }
    }
  })
})

import { describe, expect, it } from 'vitest'
import {
  createLivingEmbankmentGeometry,
  getGroundPlaneHeight,
  LIVING_EMBANKMENT_FRONT_DEPTH_RATIO,
  LIVING_EMBANKMENT_MAX_WOBBLE_RATIO,
  LIVING_EMBANKMENT_SAMPLE_COUNT,
  LIVING_EMBANKMENT_SIDE_DEPTH_RATIO,
} from '../ground-plane-geometry'

const CASES = [
  { gridSize: 3, tileSize: 132 },
  { gridSize: 5, tileSize: 140 },
  { gridSize: 7, tileSize: 140 },
  { gridSize: 11, tileSize: 100 },
]

describe('Living Embankment geometry', () => {
  it.each(CASES)('is deterministic and finite for $gridSize×$gridSize', ({ gridSize, tileSize }) => {
    const first = createLivingEmbankmentGeometry(gridSize, tileSize)
    const second = createLivingEmbankmentGeometry(gridSize, tileSize)

    expect(second).toEqual(first)
    expect(first.left.top).toHaveLength(LIVING_EMBANKMENT_SAMPLE_COUNT)
    expect(first.left.bottom).toHaveLength(LIVING_EMBANKMENT_SAMPLE_COUNT)
    expect(first.right.top).toHaveLength(LIVING_EMBANKMENT_SAMPLE_COUNT)
    expect(first.right.bottom).toHaveLength(LIVING_EMBANKMENT_SAMPLE_COUNT)

    for (const point of [
      ...first.left.top,
      ...first.left.bottom,
      ...first.right.top,
      ...first.right.bottom,
    ]) {
      expect(Number.isFinite(point.x)).toBe(true)
      expect(Number.isFinite(point.y)).toBe(true)
    }
  })

  it.each(CASES)('keeps depth ratios and a sealed front seam for $gridSize×$gridSize', ({ gridSize, tileSize }) => {
    const geometry = createLivingEmbankmentGeometry(gridSize, tileSize)

    expect(geometry.sideDepth).toBeCloseTo(tileSize * LIVING_EMBANKMENT_SIDE_DEPTH_RATIO)
    expect(geometry.frontDepth).toBeCloseTo(tileSize * LIVING_EMBANKMENT_FRONT_DEPTH_RATIO)
    expect(geometry.left.top.at(-1)).toBe(geometry.frontTop)
    expect(geometry.right.top.at(-1)).toBe(geometry.frontTop)
    expect(geometry.left.bottom.at(-1)).toBe(geometry.frontBottom)
    expect(geometry.right.bottom.at(-1)).toBe(geometry.frontBottom)

    for (const face of [geometry.left, geometry.right]) {
      let previousDepth = -Infinity
      face.top.forEach((topPoint, index) => {
        const t = index / (LIVING_EMBANKMENT_SAMPLE_COUNT - 1)
        const expectedBaseRatio = LIVING_EMBANKMENT_SIDE_DEPTH_RATIO
          + (LIVING_EMBANKMENT_FRONT_DEPTH_RATIO - LIVING_EMBANKMENT_SIDE_DEPTH_RATIO) * t
        const depth = face.bottom[index].y - topPoint.y
        const wobbleRatio = depth / tileSize - expectedBaseRatio

        expect(Math.abs(wobbleRatio)).toBeLessThanOrEqual(LIVING_EMBANKMENT_MAX_WOBBLE_RATIO)
        expect(depth).toBeGreaterThan(previousDepth)
        previousDepth = depth
      })
    }
  })

  it.each(CASES)('supports both rounded grass caps without a floating overhang for $gridSize×$gridSize', ({ gridSize, tileSize }) => {
    const geometry = createLivingEmbankmentGeometry(gridSize, tileSize)
    const width = gridSize * tileSize
    const diamondHeight = gridSize * (tileSize / 2)
    const organicRadius = Math.max(16, tileSize * 0.22)
    const capInset = organicRadius * 1.12 / 2

    expect(geometry.left.top[0]).toEqual({ x: capInset, y: diamondHeight / 2 })
    expect(geometry.right.top[0]).toEqual({ x: width - capInset, y: diamondHeight / 2 })
    expect(geometry.left.top[1].x).toBeGreaterThan(geometry.left.top[0].x)
    expect(geometry.right.top[1].x).toBeLessThan(geometry.right.top[0].x)
  })

  it.each(CASES)('meets the rounded front cap without exposing a center wedge for $gridSize×$gridSize', ({ gridSize, tileSize }) => {
    const geometry = createLivingEmbankmentGeometry(gridSize, tileSize)
    const width = gridSize * tileSize
    const diamondHeight = gridSize * (tileSize / 2)
    const organicRadius = Math.max(16, tileSize * 0.22)
    const capRise = organicRadius * 0.48 / 2

    expect(geometry.frontTop).toEqual({ x: width / 2, y: diamondHeight - capRise })
    expect(geometry.left.top.at(-2)).toEqual({
      x: width / 2 - organicRadius,
      y: diamondHeight - capRise * 2,
    })
    expect(geometry.right.top.at(-2)).toEqual({
      x: width / 2 + organicRadius,
      y: diamondHeight - capRise * 2,
    })
  })

  it.each(CASES)('keeps every sampled path point inside its canvas for $gridSize×$gridSize', ({ gridSize, tileSize }) => {
    const geometry = createLivingEmbankmentGeometry(gridSize, tileSize)
    const width = gridSize * tileSize
    const height = getGroundPlaneHeight(gridSize, tileSize, true)

    expect(geometry.canvasHeight).toBe(height)
    for (const point of [
      ...geometry.left.top,
      ...geometry.left.bottom,
      ...geometry.right.top,
      ...geometry.right.bottom,
    ]) {
      expect(point.x).toBeGreaterThanOrEqual(0)
      expect(point.x).toBeLessThanOrEqual(width)
      expect(point.y).toBeGreaterThanOrEqual(0)
      expect(point.y).toBeLessThan(height)
    }
  })
})

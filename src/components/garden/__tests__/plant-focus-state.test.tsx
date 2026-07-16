import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PlantWithType } from '@/types/database'
import {
  getPlantFocusCameraScale,
  getPlantFocusFrameSize,
  getPlantFocusTargetYOffset,
  getPlantFocusTargetY,
} from '../plant-focus-frame'
import { PlantInfoBar } from '../plant-tooltip'

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const plant = {
  id: 'plant-1',
  name: 'Cây đọc sách',
  status: 'growing',
  current_moisture: 72,
  growth_percentage: 48,
  current_streak: 3,
  plant_type: {
    name: 'Monstera',
    icon: '🌿',
  },
} as unknown as PlantWithType

describe('exclusive plant focus state', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    root = createRoot(container)
  })

  afterEach(() => {
    act(() => root.unmount())
    container.remove()
  })

  it('shows hover information outside focus', () => {
    act(() => root.render(<PlantInfoBar plant={plant} />))

    expect(container.textContent).toContain('Cây đọc sách')
    expect(container.textContent).toContain('Chạm để xem')
  })

  it('suppresses hover information while focus is active', () => {
    act(() => root.render(<PlantInfoBar plant={plant} suppressed />))

    expect(container).toBeEmptyDOMElement()
  })

  it('adapts the focus frame to larger plant footprints', () => {
    const singleCell = getPlantFocusFrameSize(140, 1)
    const multiCell = getPlantFocusFrameSize(140, 3)

    expect(multiCell.width).toBeGreaterThan(singleCell.width)
    expect(multiCell.height).toBeGreaterThan(singleCell.height)
  })

  it('places the focused plant lower in the viewport near its information panel', () => {
    expect(getPlantFocusTargetYOffset(883, 869)).toBeCloseTo(104.28)
    expect(getPlantFocusTargetYOffset(390, 844)).toBeCloseTo(37.98)
  })

  it('keeps a stable gap between the focused plant and the information panel', () => {
    expect(getPlantFocusTargetY(1454, 900, 512)).toBe(488)
    expect(getPlantFocusTargetY(390, 844, 610)).toBeCloseTo(459.98)
    expect(getPlantFocusTargetY(390, 844, 610)).toBeLessThanOrEqual(590)
  })

  it('uses the authored focus scale instead of inheriting user zoom on a laptop', () => {
    expect(getPlantFocusCameraScale({
      viewportWidth: 1915,
      viewportHeight: 872,
      tileSize: 140,
      gridSize: 1,
    })).toBeCloseTo(1.18)
  })

  it('shrinks focus to fit short viewports and larger plant frames', () => {
    const regularDesktop = getPlantFocusCameraScale({
      viewportWidth: 1440,
      viewportHeight: 900,
      tileSize: 140,
      gridSize: 1,
    })
    const shortDesktop = getPlantFocusCameraScale({
      viewportWidth: 1024,
      viewportHeight: 560,
      tileSize: 140,
      gridSize: 3,
    })

    expect(regularDesktop).toBeCloseTo(1.18)
    expect(shortDesktop).toBeLessThan(regularDesktop)
  })

  it('keeps tall plant silhouettes below the desktop HUD safe area', () => {
    const viewportHeight = 900
    const targetY = getPlantFocusTargetY(1454, viewportHeight)
    const plantBounds = { left: -92, top: -430, right: 88, bottom: 0 }
    const scale = getPlantFocusCameraScale({
      viewportWidth: 1454,
      viewportHeight,
      tileSize: 140,
      gridSize: 1,
      plantBounds,
    })

    expect(targetY + plantBounds.top * scale).toBeGreaterThanOrEqual(128)
    expect(scale).toBeLessThan(1.18)
  })

  it('keeps mobile focus below the HUD without exceeding its authored scale', () => {
    const viewportHeight = 844
    const targetY = getPlantFocusTargetY(390, viewportHeight)
    const frame = getPlantFocusFrameSize(132, 1)
    const scale = getPlantFocusCameraScale({
      viewportWidth: 390,
      viewportHeight,
      tileSize: 132,
      gridSize: 1,
    })

    expect(scale).toBeLessThanOrEqual(1.28)
    expect(targetY - (frame.height - frame.bottom) * scale).toBeGreaterThanOrEqual(120)
  })
})

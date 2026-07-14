import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { PlantWithType } from '@/types/database'
import { getPlantFocusFrameSize, getPlantFocusTargetYOffset } from '../plant-focus-frame'
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
})

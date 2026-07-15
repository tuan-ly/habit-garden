import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AssetStudioClient } from './asset-studio-client'
import type { GameAssetStudioEntry } from '@/lib/assets/asset-studio-types'

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const asset: GameAssetStudioEntry = {
  id: 'plant:cactus:05-mature',
  kind: 'plant',
  slug: 'cactus',
  variant: '05-mature',
  path: '/plants/cactus/05-mature.png',
  autoDisplay: { anchorX: 0.5, anchorY: 0.9, scale: 1, offsetX: 0, offsetY: 0 },
  display: { anchorX: 0.5, anchorY: 0.9, scale: 1, offsetX: 0, offsetY: 0 },
  analysis: {
    width: 1024,
    height: 1024,
    alphaCoverage: 0.25,
    bounds: { left: 0.2, top: 0.1, right: 0.8, bottom: 0.9 },
    centroid: { x: 0.5, y: 0.55 },
    transparent: true,
    touchesEdge: false,
  },
  checks: [{ code: 'transparent-background', level: 'pass', message: 'Có nền trong suốt.' }],
}

describe('AssetStudioClient', () => {
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
    vi.restoreAllMocks()
  })

  it('keeps an unsaved draft, validates its reason and resets to auto values', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    await act(async () => root.render(<AssetStudioClient initialAssets={[asset]} initialOverrides={{}} />))
    const scale = container.querySelector<HTMLInputElement>('#field-scale')!

    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(scale, '1.12')
      scale.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(scale.valueAsNumber).toBe(1.12)

    const save = [...container.querySelectorAll('button')].find((button) => button.textContent?.trim() === 'Save')!
    await act(async () => save.click())
    expect(container.textContent).toContain('tối thiểu 3 ký tự')
    expect(fetchSpy).not.toHaveBeenCalled()

    const reset = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Reset'))!
    await act(async () => reset.click())
    expect(scale.valueAsNumber).toBe(1)
  })

  it('toggles preview overlays without changing the current calibration', async () => {
    await act(async () => root.render(<AssetStudioClient initialAssets={[asset]} initialOverrides={{}} />))
    const firstSwitch = container.querySelector<HTMLButtonElement>('[role="switch"]')!
    expect(firstSwitch.dataset.state).toBe('checked')
    await act(async () => firstSwitch.click())
    expect(firstSwitch.dataset.state).toBe('unchecked')
    expect(container.querySelector<HTMLInputElement>('#field-anchorX')?.valueAsNumber).toBe(0.5)
  })
})

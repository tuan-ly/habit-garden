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

const decoration: GameAssetStudioEntry = {
  ...asset,
  id: 'decoration:stone-lantern:default',
  kind: 'decoration',
  slug: 'stone-lantern',
  variant: 'default',
  path: '/garden/decorations/sanctuary-rock-lantern.png',
  canonicalFootprint: 2,
}

describe('AssetStudioClient', () => {
  let container: HTMLDivElement
  let root: Root

  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    Element.prototype.scrollIntoView = vi.fn()
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

  it('renders every occupied footprint cell and keeps editor zoom outside the asset ratio', async () => {
    await act(async () => root.render(<AssetStudioClient initialAssets={[asset]} initialOverrides={{}} />))
    const three = [...container.querySelectorAll('button')].find((button) => button.textContent?.trim() === '3×3')!
    await act(async () => three.click())
    expect(container.querySelectorAll('[data-testid="footprint-cell"]')).toHaveLength(9)

    const art = container.querySelector<HTMLElement>('[data-testid="asset-offset-wrapper"]')!
    const artWidth = art.style.width
    const zoom = container.querySelector<HTMLButtonElement>('[aria-label="Editor zoom"]')!
    await act(async () => zoom.click())
    const option = [...document.querySelectorAll<HTMLElement>('[role="option"]')].find((item) => item.textContent === '250%')!
    await act(async () => option.click())
    expect(container.querySelector<HTMLElement>('[data-testid="asset-offset-wrapper"]')?.style.width).toBe(artWidth)
  })

  it('keeps the production sandbox collapsed until the final-check preview is requested', async () => {
    await act(async () => root.render(<AssetStudioClient initialAssets={[asset]} initialOverrides={{}} />))
    const details = container.querySelector('details')!
    expect(details.open).toBe(false)
    const summary = [...container.querySelectorAll('summary')].find((item) => item.textContent?.includes('Production Sandbox'))!
    await act(async () => summary.click())
    expect(details.open).toBe(true)
  })

  it('nudges tile-relative offsets from the keyboard', async () => {
    await act(async () => root.render(<AssetStudioClient initialAssets={[asset]} initialOverrides={{}} />))
    const art = container.querySelector<HTMLElement>('[aria-label^="Di chuyển"]')!
    await act(async () => art.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })))
    expect(container.querySelector<HTMLInputElement>('#field-offsetX')?.valueAsNumber).toBe(0.01)
  })

  it('drafts a canonical decoration footprint separately from visual progression', async () => {
    await act(async () => root.render(<AssetStudioClient
      initialAssets={[decoration]}
      initialOverrides={{}}
      initialCatalog={{ schemaVersion: 1, decorations: { 'stone-lantern': { canonicalFootprint: 2, reason: 'Production catalog' } } }}
    />))
    const three = [...container.querySelectorAll('button')].find((button) => button.textContent?.trim() === '3×3')!
    await act(async () => three.click())
    const canonical = [...container.querySelectorAll('button')].find((button) => button.textContent?.includes('Đặt làm canonical'))!
    await act(async () => canonical.click())
    expect(container.textContent).toContain('Canonical3×3')
  })
})

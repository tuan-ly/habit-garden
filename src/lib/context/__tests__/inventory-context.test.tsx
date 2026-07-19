import { act, useEffect } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  InventoryProvider,
  useInventory,
} from '../inventory-context'
import type {
  DecorationType,
  InventoryItemWithDetails,
  PlacedDecorationWithType,
} from '@/types/database'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean })
  .IS_REACT_ACT_ENVIRONMENT = true

const mocks = vi.hoisted(() => ({
  getUserInventory: vi.fn(),
  getCoinBalance: vi.fn(),
  getPlacedDecorations: vi.fn(),
  placeDecoration: vi.fn(),
  pickUpDecoration: vi.fn(),
  moveDecoration: vi.fn(),
}))

vi.mock('@/lib/actions/inventory', () => ({
  getUserInventory: mocks.getUserInventory,
}))

vi.mock('@/lib/actions/coins', () => ({
  getCoinBalance: mocks.getCoinBalance,
}))

vi.mock('@/lib/actions/decorations', () => ({
  getPlacedDecorations: mocks.getPlacedDecorations,
  placeDecoration: mocks.placeDecoration,
  pickUpDecoration: mocks.pickUpDecoration,
  moveDecoration: mocks.moveDecoration,
}))

const decorationType: DecorationType = {
  id: 'type-1',
  slug: 'lantern',
  name: 'Đèn đá',
  description: null,
  icon: '🏮',
  image_url: null,
  grid_size: 1,
  category: 'lighting',
  rarity: 'common',
  unlock_level: 1,
  coin_price: 10,
  subscription_tier: 'free',
  is_craftable: false,
  created_at: '2026-07-13T00:00:00.000Z',
}

const inventoryItem: InventoryItemWithDetails = {
  id: 'inventory-1',
  user_id: 'user-1',
  item_type: 'decoration',
  material_id: null,
  decoration_type_id: decorationType.id,
  quantity: 1,
  acquired_via: 'purchase',
  created_at: '2026-07-13T00:00:00.000Z',
  updated_at: '2026-07-13T00:00:00.000Z',
  decoration_type: decorationType,
}

const placedDecoration: PlacedDecorationWithType = {
  id: 'placed-1',
  user_id: 'user-1',
  decoration_type_id: decorationType.id,
  grid_row: 1,
  grid_col: 1,
  grid_size: 1,
  rotation: 0,
  placed_at: '2026-07-13T00:00:00.000Z',
  decoration_type: decorationType,
}

let context: ReturnType<typeof useInventory>
let root: Root | null = null

function ContextProbe() {
  const value = useInventory()
  useEffect(() => {
    context = value
  }, [value])
  return null
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((next) => { resolve = next })
  return { promise, resolve }
}

function renderProvider(node: React.ReactNode) {
  const container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => { root?.render(node) })
}

describe('InventoryProvider optimistic decoration mutations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getUserInventory.mockResolvedValue({ materials: [], decorations: [inventoryItem] })
    mocks.getCoinBalance.mockResolvedValue({ coins: 0 })
    mocks.getPlacedDecorations.mockResolvedValue({ decorations: [] })
  })

  afterEach(() => {
    act(() => { root?.unmount() })
    root = null
    document.body.innerHTML = ''
  })

  it('renders a newly placed decoration before the server action resolves', async () => {
    const pending = deferred<{ success: true; decorationId: string }>()
    mocks.placeDecoration.mockReturnValue(pending.promise)
    renderProvider(<InventoryProvider><ContextProbe /></InventoryProvider>)

    await act(async () => { await context.refreshInventory() })

    let resultPromise!: ReturnType<typeof context.placeDecoration>
    act(() => {
      resultPromise = context.placeDecoration(inventoryItem.id, 3, 4)
    })

    expect(context.placedDecorations).toHaveLength(1)
    expect(context.placedDecorations[0]).toMatchObject({ grid_row: 3, grid_col: 4 })
    expect(context.placedDecorations[0].id).toMatch(/^optimistic-/)
    expect(context.decorations).toHaveLength(0)

    pending.resolve({ success: true, decorationId: 'placed-from-server' })
    await act(async () => { await resultPromise })

    expect(context.placedDecorations[0].id).toBe('placed-from-server')
    expect(mocks.getPlacedDecorations).toHaveBeenCalledTimes(1)
  })

  it('moves immediately and rolls back the same decoration on failure', async () => {
    const pending = deferred<{ error: string }>()
    mocks.moveDecoration.mockReturnValue(pending.promise)
    renderProvider(
      <InventoryProvider initialPlacedDecorations={[placedDecoration]}>
        <ContextProbe />
      </InventoryProvider>
    )

    let resultPromise!: ReturnType<typeof context.moveDecoration>
    act(() => {
      resultPromise = context.moveDecoration(placedDecoration.id, 5, 6)
    })

    expect(context.placedDecorations[0]).toMatchObject({ grid_row: 5, grid_col: 6 })

    pending.resolve({ error: 'Space is occupied' })
    await act(async () => { await resultPromise })

    expect(context.placedDecorations[0]).toMatchObject({ grid_row: 1, grid_col: 1 })
    expect(mocks.getPlacedDecorations).not.toHaveBeenCalled()
  })

  it('removes a picked-up decoration immediately and reconciles the canonical inventory item', async () => {
    const canonicalInventoryItem = { ...inventoryItem, quantity: 2 }
    const pending = deferred<{ success: true; inventoryItem: InventoryItemWithDetails }>()
    mocks.pickUpDecoration.mockReturnValue(pending.promise)
    renderProvider(
      <InventoryProvider initialPlacedDecorations={[placedDecoration]}>
        <ContextProbe />
      </InventoryProvider>
    )

    let resultPromise!: ReturnType<typeof context.pickUpDecoration>
    act(() => {
      resultPromise = context.pickUpDecoration(placedDecoration.id)
    })

    expect(context.placedDecorations).toHaveLength(0)
    expect(context.decorations).toHaveLength(0)

    pending.resolve({ success: true, inventoryItem: canonicalInventoryItem })
    await act(async () => { await resultPromise })

    expect(context.decorations).toEqual([canonicalInventoryItem])
    expect(mocks.getUserInventory).not.toHaveBeenCalled()
  })

  it('restores a picked-up decoration when the server mutation fails', async () => {
    const pending = deferred<{ error: string }>()
    mocks.pickUpDecoration.mockReturnValue(pending.promise)
    renderProvider(
      <InventoryProvider initialPlacedDecorations={[placedDecoration]}>
        <ContextProbe />
      </InventoryProvider>
    )

    let resultPromise!: ReturnType<typeof context.pickUpDecoration>
    act(() => {
      resultPromise = context.pickUpDecoration(placedDecoration.id)
    })

    expect(context.placedDecorations).toHaveLength(0)

    pending.resolve({ error: 'Decoration pickup failed' })
    await act(async () => { await resultPromise })

    expect(context.placedDecorations).toEqual([placedDecoration])
    expect(context.decorations).toHaveLength(0)
  })
})

import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { queuePendingGardenEncounter } from '@/lib/garden-encounter-pending'
import type { PlantWithType } from '@/types/database'
import { useDailyGardenEncounter } from '../use-daily-garden-encounter'

const plant = {
  id: 'plant-encounter',
  name: 'Cây đọc sách',
  status: 'growing',
  last_watered_at: null,
  plant_type: { id: 'oak' },
} as PlantWithType

function createMemoryStorage(): Storage {
  const values = new Map<string, string>()
  return {
    get length() {
      return values.size
    },
    clear: () => { values.clear() },
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key) },
    setItem: (key, value) => { values.set(key, value) },
  }
}

describe('useDailyGardenEncounter', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: createMemoryStorage(),
    })
  })

  it('reveals at most one fresh encounter per day and restores it without replaying', async () => {
    const firstRender = renderHook(() => useDailyGardenEncounter({
      plants: [plant],
      weather: 'sunny',
      enabled: true,
    }))

    await waitFor(() => expect(firstRender.result.current.atmosphere).not.toBeNull())

    act(() => firstRender.result.current.revealEncounter(plant, 'rest'))
    const firstEncounterId = firstRender.result.current.memory?.encounter.id

    act(() => firstRender.result.current.revealEncounter(
      { ...plant, id: 'another-plant', name: 'Cây khác' },
      'care'
    ))

    expect(firstRender.result.current.freshEncounter?.actionKind).toBe('rest')
    expect(firstRender.result.current.memory?.encounter.id).toBe(firstEncounterId)
    expect(firstRender.result.current.memory?.plantId).toBe(plant.id)

    firstRender.unmount()

    const restoredRender = renderHook(() => useDailyGardenEncounter({
      plants: [plant],
      weather: 'sunny',
      enabled: true,
    }))

    await waitFor(() => expect(restoredRender.result.current.memory).not.toBeNull())
    expect(restoredRender.result.current.memory?.encounter.id).toBe(firstEncounterId)
    expect(restoredRender.result.current.freshEncounter).toBeNull()
  })

  it('consumes a guided-session signal before inferring other activity and never replays it', async () => {
    const inferredPlant = {
      ...plant,
      id: 'recent-plant',
      name: 'Cây vừa chăm trong Garden',
      last_watered_at: new Date().toISOString(),
    }

    queuePendingGardenEncounter({
      plantId: plant.id,
      plantName: plant.name,
      actionKind: 'care',
    })

    const firstRender = renderHook(() => useDailyGardenEncounter({
      plants: [inferredPlant],
      weather: 'sunny',
      enabled: true,
    }))

    await waitFor(() => expect(firstRender.result.current.freshEncounter).not.toBeNull())
    expect(firstRender.result.current.freshEncounter?.plantId).toBe(plant.id)
    expect(firstRender.result.current.memory?.plantName).toBe(plant.name)

    firstRender.unmount()

    const restoredRender = renderHook(() => useDailyGardenEncounter({
      plants: [inferredPlant],
      weather: 'sunny',
      enabled: true,
    }))

    await waitFor(() => expect(restoredRender.result.current.memory).not.toBeNull())
    expect(restoredRender.result.current.memory?.plantId).toBe(plant.id)
    expect(restoredRender.result.current.freshEncounter).toBeNull()
  })
})

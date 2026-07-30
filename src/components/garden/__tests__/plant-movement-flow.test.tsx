import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PlantWithType } from '@/types/database'
import { useGardenInteractions } from '../use-garden-interactions'

const plant = {
  id: 'plant-1',
  grid_row: 0,
  grid_col: 0,
  grid_size: 1,
} as PlantWithType

describe('plant movement flow', () => {
  it('moves the selected real plant when the destination tile is empty', async () => {
    const movePlant = vi.fn().mockResolvedValue({ success: true })
    const { result } = renderHook(() => useGardenInteractions({
      movePlant,
      recordActivity: vi.fn(),
      welcomeBackPending: false,
      mode: 'arrange',
      didPan: false,
      resetDidPan: vi.fn(),
      livingPlants: [plant],
      editSelectedItem: null,
      editGhostRotation: 0,
    }))

    act(() => result.current.handleTileClick(0, 0, plant))
    expect(result.current.moveState.selectedPlant?.id).toBe(plant.id)

    act(() => result.current.handleTileClick(2, 2))

    await waitFor(() => {
      expect(movePlant).toHaveBeenCalledWith(plant.id, 2, 2)
    })
    expect(result.current.moveState.selectedPlant).toBeNull()
  })
})

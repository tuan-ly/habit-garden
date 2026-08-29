import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { PlantWithType } from '@/types/database'
import { useGardenInteractions } from '../use-garden-interactions'

const plant = {
  id: 'plant-1',
  name: 'Cây nhỏ',
  current_streak: 2,
  longest_streak: 4,
  current_moisture: 50,
  growth_percentage: 20,
  total_waterings: 3,
  last_watered_at: null,
  status: 'growing',
  goal_mode: null,
  plant_type: {
    id: 'oak',
    icon: 'leaf',
    moisture_boost: 20,
    maturity_days: 30,
  },
} as PlantWithType

function renderInteractions(onActivitySuccess: ReturnType<typeof vi.fn>) {
  return renderHook(() => useGardenInteractions({
    movePlant: vi.fn(),
    recordActivity: vi.fn().mockResolvedValue({ success: true }),
    welcomeBackPending: false,
    mode: 'interact',
    didPan: false,
    resetDidPan: vi.fn(),
    livingPlants: [plant],
    editSelectedItem: null,
    editGhostRotation: 0,
    calmFeedback: true,
    onActivitySuccess,
  }))
}

describe('garden encounter action integration', () => {
  it('reveals the same encounter path for an intentional rest', async () => {
    const onActivitySuccess = vi.fn()
    const { result } = renderInteractions(onActivitySuccess)

    act(() => result.current.handleQuickWaterRequest(plant, 'water', 'rest'))
    await act(async () => {
      await result.current.handleWaterConfirm(undefined, 0, 'rest')
    })

    await waitFor(() => {
      expect(onActivitySuccess).toHaveBeenCalledWith(plant, 'rest')
    })
  })

  it('preserves the tiny-action intent after a successful save', async () => {
    const onActivitySuccess = vi.fn()
    const { result } = renderInteractions(onActivitySuccess)

    act(() => result.current.handleQuickWaterRequest(plant, 'log', 'tiny'))
    await act(async () => {
      await result.current.handleLogAndWaterConfirm(undefined, undefined, 10, 'tiny')
    })

    await waitFor(() => {
      expect(onActivitySuccess).toHaveBeenCalledWith(plant, 'tiny')
    })
  })
})

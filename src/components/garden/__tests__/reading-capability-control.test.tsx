import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PlantWithType } from '@/types/database'
import { ReadingCapabilityControl } from '../reading-capability-control'

const mocks = vi.hoisted(() => ({
  attach: vi.fn(),
  refresh: vi.fn(),
  updatePlant: vi.fn(),
  toastSuccess: vi.fn(),
  toastError: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}))

vi.mock('@/lib/actions/habit-sessions', () => ({
  attachReadingCapabilityToPlant: mocks.attach,
}))

vi.mock('@/lib/context/plants-context', () => ({
  usePlants: () => ({
    plants: [
      {
        id: 'old-plant',
        name: 'Cây cũ',
        guided_habit: {
          id: 'habit-1',
          plant_id: 'old-plant',
          type: 'reading',
          is_active: true,
        },
      },
      { id: 'new-plant', name: 'Cây mới', guided_habit: null },
    ],
    updatePlant: mocks.updatePlant,
  }),
}))

vi.mock('sonner', () => ({
  toast: {
    success: mocks.toastSuccess,
    error: mocks.toastError,
  },
}))

describe('ReadingCapabilityControl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.attach.mockResolvedValue({
      success: true,
      data: {
        outcome: 'moved',
        habit: {
          id: 'habit-1',
          plant_id: 'new-plant',
          type: 'reading',
          is_active: true,
        },
      },
    })
  })

  it('moves the Reading capability and reconciles both plants', async () => {
    const onAttached = vi.fn()
    const plant = { id: 'new-plant', name: 'Cây mới' } as PlantWithType

    render(<ReadingCapabilityControl plant={plant} onAttached={onAttached} />)
    fireEvent.click(screen.getByRole('button', { name: 'Chuyển theo dõi sang cây này' }))

    await waitFor(() => {
      expect(mocks.attach).toHaveBeenCalledWith('new-plant')
    })
    expect(mocks.updatePlant).toHaveBeenCalledWith('old-plant', { guided_habit: null })
    expect(mocks.updatePlant).toHaveBeenCalledWith('new-plant', {
      guided_habit: {
        id: 'habit-1',
        plant_id: 'new-plant',
        type: 'reading',
        is_active: true,
      },
    })
    expect(onAttached).toHaveBeenCalledOnce()
    expect(mocks.refresh).toHaveBeenCalledOnce()
  })
})

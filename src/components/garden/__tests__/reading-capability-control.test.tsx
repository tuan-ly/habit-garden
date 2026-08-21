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
        outcome: 'attached',
        habit: {
          id: 'habit-1',
          type: 'reading',
          is_active: true,
        },
      },
    })
  })

  it('attaches the shared Reading capability without clearing the first plant', async () => {
    const onAttached = vi.fn()
    const plant = { id: 'new-plant', name: 'Cây mới' } as PlantWithType

    render(<ReadingCapabilityControl plant={plant} onAttached={onAttached} />)
    expect(screen.getByText(/Nhiều cây có thể dùng chung một hành trình/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Gắn theo dõi đọc sách' }))

    await waitFor(() => {
      expect(mocks.attach).toHaveBeenCalledWith('new-plant')
    })
    expect(mocks.updatePlant).toHaveBeenCalledTimes(1)
    expect(mocks.updatePlant).not.toHaveBeenCalledWith(
      'old-plant',
      expect.objectContaining({ guided_habit: null })
    )
    expect(mocks.updatePlant).toHaveBeenCalledWith('new-plant', {
      guided_habit: {
        id: 'habit-1',
        plant_id: 'new-plant',
        type: 'reading',
        is_active: true,
      },
    })
    expect(mocks.toastSuccess).toHaveBeenCalledWith('Đã gắn theo dõi đọc sách', {
      description: 'Cây mới dùng chung log và tiến trình của hành trình đọc.',
    })
    expect(onAttached).toHaveBeenCalledOnce()
    expect(mocks.refresh).toHaveBeenCalledOnce()
  })
})

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PlantWithType } from '@/types/database'
import { ReadingCapabilityControl } from '../reading-capability-control'

const mocks = vi.hoisted(() => ({
  attach: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}))

vi.mock('@/lib/actions/capabilities', () => ({
  attachCapabilityToPlant: mocks.attach,
}))

vi.mock('@/components/plants/plant-image', () => ({
  PlantImage: ({ plant }: { plant: PlantWithType }) => <div>{plant.name}</div>,
}))

describe('ReadingCapabilityControl compatibility wrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.attach.mockResolvedValue({
      success: true,
      data: {
        capabilityKey: 'reading',
        outcome: 'attached',
        habit: {
          id: 'habit-2',
          type: 'reading',
          is_active: true,
        },
      },
    })
  })

  it('uses the generic library and requires an explicit reading-intent confirmation', async () => {
    const onAttached = vi.fn()
    const plant = { id: 'new-plant', name: 'Cây đọc sách', guided_habit: null } as PlantWithType

    render(<ReadingCapabilityControl plant={plant} onAttached={onAttached} />)
    fireEvent.click(screen.getByRole('button', { name: 'Chọn hành trình' }))
    fireEvent.click(screen.getByRole('button', { name: /Đọc sâu hơn/ }))

    const attachButton = screen.getByRole('button', { name: 'Bắt đầu hành trình đọc' })
    expect(attachButton).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /Cây này đại diện cho việc đọc/ }))
    expect(attachButton).toBeEnabled()
    fireEvent.click(attachButton)

    await waitFor(() => {
      expect(mocks.attach).toHaveBeenCalledWith({
        plantId: 'new-plant',
        capabilityKey: 'reading',
        confirmedIntent: true,
      })
    })
    expect(onAttached).toHaveBeenCalledOnce()
    expect(mocks.refresh).toHaveBeenCalledOnce()
    expect(await screen.findByRole('link', { name: /Tiếp tục hành trình/ })).toHaveAttribute(
      'href',
      '/plant/new-plant'
    )
  })
})

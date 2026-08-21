import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CapabilitySlot } from '@/components/capabilities/capability-slot'
import type { PlantWithType } from '@/types/database'

const mocks = vi.hoisted(() => ({
  pause: vi.fn(),
  resume: vi.fn(),
  remove: vi.fn(),
  refresh: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}))

vi.mock('@/lib/actions/capabilities', () => ({
  attachCapabilityToPlant: vi.fn(),
  pauseCapabilityOnPlant: mocks.pause,
  resumeCapabilityOnPlant: mocks.resume,
  removeCapabilityFromPlant: mocks.remove,
}))

vi.mock('@/components/plants/plant-image', () => ({
  PlantImage: () => <div />,
}))

describe('CapabilitySlot', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.pause.mockResolvedValue({
      success: true,
      data: {
        state: 'paused',
        habit: { id: 'habit-1', type: 'reading', is_active: false },
      },
    })
    mocks.resume.mockResolvedValue({
      success: true,
      data: {
        state: 'active',
        habit: { id: 'habit-1', type: 'reading', is_active: true },
      },
    })
    mocks.remove.mockResolvedValue({
      success: true,
      data: {
        state: 'removed',
        habit: { id: 'habit-1', type: 'reading', is_active: false },
      },
    })
  })

  it('shows the assigned journey as a destination instead of another attach control', () => {
    const plant = {
      id: 'plant-1',
      name: 'Cây đọc sách',
      guided_habit: {
        id: 'habit-1',
        plant_id: 'plant-1',
        type: 'reading',
        is_active: true,
      },
    } as PlantWithType

    render(<CapabilitySlot plant={plant} />)

    expect(screen.getByText('Đọc sâu hơn')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Tiếp tục hành trình/ })).toHaveAttribute(
      'href',
      '/plant/plant-1'
    )
    expect(screen.queryByRole('button', { name: 'Chọn hành trình' })).not.toBeInTheDocument()
  })

  it('keeps an unassigned plant complete while offering the optional library', () => {
    const plant = {
      id: 'plant-2',
      name: 'Cây bình yên',
      guided_habit: null,
    } as PlantWithType

    render(<CapabilitySlot plant={plant} />)

    expect(screen.getByText(/Bạn có thể để trống/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Chọn hành trình' })).toBeInTheDocument()
  })

  it('returns keyboard focus to the library trigger after closing with Escape', async () => {
    const plant = {
      id: 'plant-2',
      name: 'Cây bình yên',
      guided_habit: null,
    } as PlantWithType

    render(<CapabilitySlot plant={plant} />)
    const trigger = screen.getByRole('button', { name: 'Chọn hành trình' })

    fireEvent.click(trigger)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Đóng thư viện hành trình' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })

    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('pauses and resumes without removing the assigned journey', async () => {
    const onCapabilityChange = vi.fn()
    const plant = {
      id: 'plant-1',
      name: 'Cây đọc sách',
      guided_habit: {
        id: 'habit-1',
        plant_id: 'plant-1',
        type: 'reading',
        is_active: true,
      },
    } as PlantWithType

    render(<CapabilitySlot plant={plant} onCapabilityChange={onCapabilityChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạm dừng' }))

    await screen.findByText('Đang tạm dừng')
    expect(mocks.pause).toHaveBeenCalledWith('plant-1')
    expect(onCapabilityChange).toHaveBeenLastCalledWith({
      id: 'habit-1',
      plant_id: 'plant-1',
      type: 'reading',
      is_active: false,
    })

    const resumeButton = screen.getByRole('button', { name: 'Tiếp tục đồng hành' })
    await waitFor(() => expect(resumeButton).toBeEnabled())
    fireEvent.click(resumeButton)
    await screen.findByText('Đang đồng hành')
    expect(mocks.resume).toHaveBeenCalledWith('plant-1')
    expect(mocks.refresh).toHaveBeenCalledTimes(2)
  })

  it('removes the slot only after confirming that history stays preserved', async () => {
    const onCapabilityChange = vi.fn()
    const plant = {
      id: 'plant-1',
      name: 'Cây đọc sách',
      guided_habit: {
        id: 'habit-1',
        plant_id: 'plant-1',
        type: 'reading',
        is_active: true,
      },
    } as PlantWithType

    render(<CapabilitySlot plant={plant} onCapabilityChange={onCapabilityChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Gỡ khỏi cây' }))

    expect(screen.getByText(/Toàn bộ phiên, tiến độ và ghi chú cũ vẫn được lưu lại/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Gỡ nhưng giữ nhật ký' }))

    await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith('plant-1'))
    expect(onCapabilityChange).toHaveBeenLastCalledWith(null)
    expect(await screen.findByRole('button', { name: 'Chọn hành trình' })).toBeInTheDocument()
  })
})

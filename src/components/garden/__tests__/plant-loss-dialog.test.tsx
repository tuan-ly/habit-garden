import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PlantWithType } from '@/types/database'
import { PlantLossDialog } from '../plant-loss-dialog'

const mocks = vi.hoisted(() => ({
  acknowledgePlantDeath: vi.fn(),
}))

const plants = [
  {
    id: 'older-loss',
    name: 'Cây đọc sách',
    status: 'dead',
    died_at: '2026-08-10T08:00:00.000Z',
    death_acknowledged_at: null,
    total_waterings: 12,
    plant_type: { name: 'Bamboo', icon: '🎋' },
  },
  {
    id: 'newer-loss',
    name: 'Cây chạy bộ',
    status: 'dead',
    died_at: '2026-08-11T08:00:00.000Z',
    death_acknowledged_at: null,
    total_waterings: 3,
    plant_type: { name: 'Sunflower', icon: '🌻' },
  },
] as PlantWithType[]

vi.mock('@/lib/context/plants-context', () => ({
  usePlants: () => ({
    plants,
    acknowledgePlantDeath: mocks.acknowledgePlantDeath,
  }),
}))

vi.mock('@/components/plants/plant-image', () => ({
  PlantImage: ({ plant }: { plant: PlantWithType }) => <div>{plant.name} image</div>,
}))

describe('PlantLossDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.acknowledgePlantDeath.mockResolvedValue({ success: true })
  })

  it('opens with the oldest unacknowledged plant loss', () => {
    render(<PlantLossDialog />)

    expect(screen.getByText('Cây đọc sách đã khép lại')).toBeVisible()
    expect(screen.queryByText('Cây chạy bộ đã khép lại')).not.toBeInTheDocument()
  })

  it('persists acknowledgement when the user says goodbye', async () => {
    render(<PlantLossDialog />)
    fireEvent.click(screen.getByRole('button', { name: 'Tạm biệt, Cây đọc sách' }))

    await waitFor(() => {
      expect(mocks.acknowledgePlantDeath).toHaveBeenCalledWith('older-loss')
    })
  })
})

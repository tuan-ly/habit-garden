import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PlantStoryView } from './plant-story-view'
import type { PlantStoryEntry, PlantStorySnapshot } from '@/lib/plant-story'

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }))

vi.mock('next/image', () => ({
  default: () => <div data-testid="background-image" />,
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/components/plants/plant-image', () => ({
  PlantImage: ({ plant }: { plant: { name: string } }) => <div data-testid="plant-image">{plant.name}</div>,
}))

function storyEntry(id: string, date: string, note: string | null): PlantStoryEntry {
  return {
    id,
    plantId: 'plant-1',
    date,
    occurredAt: `${date}T06:00:00.000Z`,
    activityType: 'completed',
    value: null,
    note,
    xpEarned: 25,
    isPersonalRecord: false,
    title: 'Đã hoàn thành',
    subtitle: `Ngày ${Number(date.slice(8))} tháng ${Number(date.slice(5, 7))}`,
  }
}

const currentEntries = [
  storyEntry('current-1', '2026-08-21', 'Khoảnh khắc thứ nhất'),
  storyEntry('current-2', '2026-08-18', 'Khoảnh khắc thứ hai'),
  storyEntry('current-3', '2026-08-15', 'Khoảnh khắc thứ ba'),
]
const julyEntry = storyEntry('july-1', '2026-07-20', 'Ghi chú tháng bảy')

const story: PlantStorySnapshot = {
  plant: {
    id: 'plant-1',
    name: 'Chạy bộ',
    habitDescription: 'Chạy nhẹ mỗi sáng',
    whyIStarted: null,
    startedAt: '2026-05-12T08:00:00.000Z',
    status: 'growing',
    growthPercentage: 64,
    visualStage: 'growing',
    gridSize: 1,
    plantType: {
      id: 'cactus',
      name: 'Cactus',
      nameVi: 'Xương rồng',
      icon: 'cactus',
    },
  },
  plantOptions: [{ id: 'plant-1', name: 'Chạy bộ', icon: 'cactus', status: 'growing' }],
  totalEntryCount: 4,
  totalActiveDays: 4,
  currentMonth: {
    key: '2026-08',
    title: 'Tháng 8 năm 2026',
    subtitle: '3 khoảnh khắc trong tháng này',
    entryCount: 3,
    activeDayCount: 3,
    isCurrent: true,
    entries: currentEntries,
  },
  chapters: [
    {
      key: '2026-08',
      title: 'Tháng 8 năm 2026',
      subtitle: '3 khoảnh khắc trong tháng này',
      entryCount: 3,
      activeDayCount: 3,
      isCurrent: true,
      entries: currentEntries,
    },
    {
      key: '2026-07',
      title: 'Tháng 7 năm 2026',
      subtitle: '1 khoảnh khắc · Những ngày đầu gieo hạt',
      entryCount: 1,
      activeDayCount: 1,
      isCurrent: false,
      entries: [julyEntry],
    },
  ],
  recentEntries: currentEntries.slice(0, 2),
}

describe('PlantStoryView', () => {
  beforeEach(() => {
    pushMock.mockReset()
  })

  it('shows exactly two current-month previews before expanding', () => {
    render(<PlantStoryView story={story} />)

    expect(screen.getByText('Khoảnh khắc thứ nhất')).toBeInTheDocument()
    expect(screen.getByText('Khoảnh khắc thứ hai')).toBeInTheDocument()
    expect(screen.queryByText('Khoảnh khắc thứ ba')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Xem tất cả 3 khoảnh khắc' }))

    expect(screen.getByText('Khoảnh khắc thứ ba')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thu gọn tháng này' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('expands an archived chapter through its full-width row', () => {
    render(<PlantStoryView story={story} />)

    expect(screen.queryByText('Ghi chú tháng bảy')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Tháng 7 năm 2026/ }))

    expect(screen.getByText('Ghi chú tháng bảy')).toBeInTheDocument()
  })

  it('does not surface XP or coin rewards in the story', () => {
    render(<PlantStoryView story={story} />)

    expect(screen.queryByText(/XP/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/xu/i)).not.toBeInTheDocument()
  })

  it('filters archived chapters to months that contain notes', async () => {
    render(
      <PlantStoryView
        story={{
          ...story,
          chapters: [
            ...story.chapters,
            {
              key: '2026-06',
              title: 'Tháng 6 năm 2026',
              subtitle: '1 khoảnh khắc · Giữ nhịp xanh',
              entryCount: 1,
              activeDayCount: 1,
              isCurrent: false,
              entries: [storyEntry('june-1', '2026-06-12', null)],
            },
          ],
        }}
      />
    )

    fireEvent.keyDown(screen.getByRole('button', { name: 'Lọc các tháng trước' }), {
      key: 'ArrowDown',
    })
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Có ghi chú' }))

    expect(screen.getByRole('button', { name: /Tháng 7 năm 2026/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Tháng 6 năm 2026/ })).not.toBeInTheDocument()
  })

  it('switches to another plant story from the identity card', async () => {
    render(
      <PlantStoryView
        story={{
          ...story,
          plantOptions: [
            ...story.plantOptions,
            { id: 'plant-2', name: 'Đọc sách', icon: 'bonsai', status: 'growing' },
          ],
        }}
      />
    )

    fireEvent.keyDown(
      screen.getByRole('button', { name: 'Đổi cây. Đang xem Chạy bộ' }),
      { key: 'ArrowDown' }
    )
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Đọc sách' }))

    expect(pushMock).toHaveBeenCalledWith('/overview/plant-2')
  })
})

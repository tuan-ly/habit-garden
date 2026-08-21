import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ActiveSessionBanner } from '@/components/game-ui/ActiveSessionBanner'
import type { ActiveCapabilitySession } from '@/types/habits'

const mocks = vi.hoisted(() => ({
  activePathname: '/garden',
  getActiveSession: vi.fn(),
  push: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => mocks.activePathname,
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('@/lib/actions/capabilities', () => ({
  getActiveCapabilitySession: mocks.getActiveSession,
}))

const runningSession: ActiveCapabilitySession = {
  id: 'session-1',
  plant_id: 'plant-1',
  capability_type: 'reading',
  habit_id: 'habit-1',
  user_id: 'user-1',
  source_plant_id: 'plant-1',
  status: 'running',
  target_value: 5,
  duration_seconds: 1800,
  accumulated_seconds: 90,
  last_resumed_at: null,
  ambient_enabled: false,
  result_value: null,
  reflection: null,
  reward_points: 0,
  started_at: '2026-07-29T00:00:00.000Z',
  paused_at: null,
  finished_at: null,
  completed_at: null,
  created_at: '2026-07-29T00:00:00.000Z',
  updated_at: '2026-07-29T00:00:00.000Z',
}

describe('ActiveSessionBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.activePathname = '/garden'
    mocks.getActiveSession.mockResolvedValue({ success: true, data: null })
  })

  it('shows a running capability session and resumes it through the generic route', () => {
    render(<ActiveSessionBanner activeSession={runningSession} />)

    expect(screen.getByText('Hành trình đang mở')).toBeInTheDocument()
    expect(screen.getByText('Đọc · 1:30')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục hành trình Đọc' }))
    expect(mocks.push).toHaveBeenCalledWith('/plant/plant-1/journey/session?id=session-1')
  })

  it('stays hidden for a paused session', () => {
    render(
      <ActiveSessionBanner
        activeSession={{ ...runningSession, status: 'paused' }}
      />
    )

    expect(screen.queryByText('Hành trình đang mở')).not.toBeInTheDocument()
  })

  it('loads a newly started session after client-side navigation', async () => {
    const { rerender } = render(<ActiveSessionBanner activeSession={null} />)

    expect(mocks.getActiveSession).not.toHaveBeenCalled()

    mocks.getActiveSession.mockResolvedValue({
      success: true,
      data: runningSession,
    })
    mocks.activePathname = '/plant/plant-1/journey/session'
    rerender(<ActiveSessionBanner activeSession={null} />)

    expect(await screen.findByText('Hành trình đang mở')).toBeInTheDocument()
    expect(mocks.getActiveSession).toHaveBeenCalledTimes(1)
  })

  it('clears a stale running session after navigating to completion', async () => {
    const { rerender } = render(
      <ActiveSessionBanner activeSession={runningSession} />
    )

    mocks.activePathname = '/plant/plant-1/journey/completion'
    rerender(<ActiveSessionBanner activeSession={runningSession} />)

    await waitFor(() => {
      expect(screen.queryByText('Hành trình đang mở')).not.toBeInTheDocument()
    })
    expect(mocks.getActiveSession).toHaveBeenCalledTimes(1)
  })
})

import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ActiveSessionBanner } from '@/components/game-ui/ActiveSessionBanner'
import type { ActiveReadingSession } from '@/types/habits'

const push = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}))

const runningSession: ActiveReadingSession = {
  id: 'session-1',
  plant_id: 'plant-1',
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
  beforeEach(() => push.mockReset())

  it('shows a running reading session and resumes it', () => {
    render(<ActiveSessionBanner activeSession={runningSession} />)

    expect(screen.getByText('Reading: 1:30')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
    expect(push).toHaveBeenCalledWith('/plant/plant-1/reading/session')
  })

  it('stays hidden for a paused session', () => {
    render(
      <ActiveSessionBanner
        activeSession={{ ...runningSession, status: 'paused' }}
      />
    )

    expect(screen.queryByText(/Reading:/)).not.toBeInTheDocument()
  })
})

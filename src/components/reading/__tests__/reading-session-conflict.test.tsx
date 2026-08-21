import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ReadingStartButton } from '@/components/reading/reading-start-button'
import { FocusSessionClient } from '@/components/reading/focus-session-client'
import type { ActiveCapabilitySession, Habit, HabitSession } from '@/types/habits'

const mocks = vi.hoisted(() => ({
  finish: vi.fn(),
  info: vi.fn(),
  pause: vi.fn(),
  push: vi.fn(),
  resume: vi.fn(),
  setAmbient: vi.fn(),
  start: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}))

vi.mock('sonner', () => ({
  toast: {
    info: mocks.info,
  },
}))

vi.mock('@/components/garden/background-audio', () => ({
  BackgroundAudio: () => null,
}))

vi.mock('@/lib/actions/habit-sessions', () => ({
  finishReadingSession: mocks.finish,
  pauseReadingSession: mocks.pause,
  resumeReadingSession: mocks.resume,
  setReadingAmbient: mocks.setAmbient,
  startReadingSession: mocks.start,
}))

const habit: Habit = {
  id: 'habit-paused',
  user_id: 'user-1',
  type: 'reading',
  name: 'Đọc sách mỗi ngày',
  description: null,
  unit: 'pages',
  custom_unit: null,
  session_duration_minutes: 30,
  is_active: true,
  created_at: '2026-08-21T00:00:00.000Z',
  updated_at: '2026-08-21T00:00:00.000Z',
}

const pausedSession: HabitSession = {
  id: 'session-paused',
  habit_id: habit.id,
  user_id: habit.user_id,
  source_plant_id: 'plant-paused',
  status: 'paused',
  target_value: 5,
  duration_seconds: 1800,
  accumulated_seconds: 120,
  last_resumed_at: null,
  ambient_enabled: false,
  result_value: null,
  reflection: null,
  reward_points: 0,
  started_at: '2026-08-21T00:00:00.000Z',
  paused_at: '2026-08-21T00:02:00.000Z',
  finished_at: null,
  completed_at: null,
  created_at: '2026-08-21T00:00:00.000Z',
  updated_at: '2026-08-21T00:02:00.000Z',
}

const runningSession: ActiveCapabilitySession = {
  ...pausedSession,
  id: 'session-running',
  habit_id: 'habit-running',
  source_plant_id: 'plant-running',
  status: 'running',
  accumulated_seconds: 60,
  last_resumed_at: '2026-08-21T00:01:00.000Z',
  paused_at: null,
  plant_id: 'plant-running',
  capability_type: 'reading',
}

const conflictResult = {
  success: false as const,
  code: 'ACTIVE_SESSION_CONFLICT' as const,
  error: 'Một hành trình khác đang chạy.',
  activeSession: runningSession,
}

describe('Reading session conflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('redirects a new start intent to the session already running on another plant', async () => {
    mocks.start.mockResolvedValue(conflictResult)

    render(
      <ReadingStartButton
        plantId="plant-new"
        activeSession={null}
        completedToday={false}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu đọc' }))

    await waitFor(() => {
      expect(mocks.push).toHaveBeenCalledWith(
        '/plant/plant-running/journey/session?id=session-running'
      )
    })
    expect(mocks.info).toHaveBeenCalledWith(
      'Một hành trình khác đang chạy. Đang mở phiên đó.'
    )
  })

  it('redirects a resume intent when another plant owns the running timer', async () => {
    mocks.resume.mockResolvedValue(conflictResult)

    render(
      <FocusSessionClient
        plantId="plant-paused"
        habit={habit}
        initialSession={pausedSession}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tiếp tục' }))

    await waitFor(() => {
      expect(mocks.resume).toHaveBeenCalledWith('session-paused')
      expect(mocks.push).toHaveBeenCalledWith(
        '/plant/plant-running/journey/session?id=session-running'
      )
    })
  })
})

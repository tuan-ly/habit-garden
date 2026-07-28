import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CompletionClient } from '@/components/reading/completion-client'
import { FocusSessionClient } from '@/components/reading/focus-session-client'
import { GrowthPlanView } from '@/components/reading/growth-plan-view'
import { ReadingHome } from '@/components/reading/reading-home'
import type {
  GoalPlan,
  GrowthState,
  Habit,
  HabitSession,
  ReadingCompletionSnapshot,
  ReadingJourneySnapshot,
} from '@/types/habits'

vi.mock('@/components/garden/background-audio', () => ({
  BackgroundAudio: ({ isPlaying }: { isPlaying: boolean }) => (
    <div data-testid="ambient-audio">{isPlaying ? 'playing' : 'stopped'}</div>
  ),
}))

vi.mock('@/lib/actions/habit-sessions', () => ({
  startReadingSession: vi.fn(),
  pauseReadingSession: vi.fn(),
  resumeReadingSession: vi.fn(),
  finishReadingSession: vi.fn(),
  setReadingAmbient: vi.fn(),
  completeReadingSession: vi.fn(),
}))

const habit: Habit = {
  id: 'habit-1',
  user_id: 'user-1',
  type: 'reading',
  name: 'Đọc sách mỗi ngày',
  description: 'Một phiên đọc yên tĩnh.',
  unit: 'pages',
  custom_unit: null,
  session_duration_minutes: 30,
  is_active: true,
  created_at: '2026-07-28T00:00:00.000Z',
  updated_at: '2026-07-28T00:00:00.000Z',
}

const plan: GoalPlan = {
  id: 'plan-1',
  habit_id: habit.id,
  user_id: habit.user_id,
  start_target: 5,
  end_target: 30,
  timeframe_weeks: 10,
  increment_value: 5,
  review_period_days: 7,
  performance_threshold: 0.8,
  started_on: '2026-07-28',
  target_end_on: '2026-10-06',
  created_at: '2026-07-28T00:00:00.000Z',
  updated_at: '2026-07-28T00:00:00.000Z',
}

const growth: GrowthState = {
  id: 'growth-1',
  habit_id: habit.id,
  user_id: habit.user_id,
  current_target: 5,
  previous_target: null,
  next_target: 10,
  review_period_started_on: '2026-07-28',
  next_review_on: '2026-08-04',
  last_reviewed_on: null,
  consistency_score: 0,
  current_streak: 0,
  best_streak: 0,
  last_completed_on: null,
  total_growth_points: 0,
  plant_stage: 'seed',
  history: [],
  created_at: '2026-07-28T00:00:00.000Z',
  updated_at: '2026-07-28T00:00:00.000Z',
}

const pausedSession: HabitSession = {
  id: 'session-1',
  habit_id: habit.id,
  user_id: habit.user_id,
  status: 'paused',
  target_value: 5,
  duration_seconds: 1800,
  accumulated_seconds: 120,
  last_resumed_at: null,
  ambient_enabled: true,
  result_value: null,
  reflection: null,
  reward_points: 0,
  started_at: '2026-07-28T00:00:00.000Z',
  paused_at: '2026-07-28T00:02:00.000Z',
  finished_at: null,
  completed_at: null,
  created_at: '2026-07-28T00:00:00.000Z',
  updated_at: '2026-07-28T00:02:00.000Z',
}

const journey: ReadingJourneySnapshot = {
  habit,
  plan,
  growth,
  today: null,
  active_session: null,
  latest_completed_session: null,
}

describe('reading habit vertical slice UI', () => {
  it('shows the reading plant, today target, and both primary destinations', () => {
    render(<ReadingHome snapshot={journey} />)

    expect(screen.getByRole('heading', { name: 'Đọc sách mỗi ngày' })).toBeInTheDocument()
    expect(screen.getByText('0/5 trang')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bắt đầu đọc' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Growth Plan/i })).toHaveAttribute(
      'href',
      '/reading/growth-plan'
    )
    expect(screen.getByRole('progressbar', { name: 'Tiến độ đọc hôm nay' })).toHaveAttribute(
      'aria-valuenow',
      '0'
    )
  })

  it('restores a paused focus session with target and remaining time', () => {
    render(<FocusSessionClient habit={habit} initialSession={pausedSession} />)

    expect(screen.getByText('Đang tạm dừng')).toBeInTheDocument()
    expect(screen.getByText('28:00')).toBeInTheDocument()
    expect(screen.getByText('5 trang')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tiếp tục' })).toBeInTheDocument()
    expect(screen.getByTestId('ambient-audio')).toHaveTextContent('stopped')
  })

  it('shows persisted completion reward, growth, streak, and target comparison', () => {
    const completedAt = '2026-07-28T00:26:00.000Z'
    const completedSession: HabitSession = {
      ...pausedSession,
      status: 'completed',
      result_value: 8,
      reward_points: 8,
      reflection: 'Một chương rất hay.',
      finished_at: '2026-07-28T00:25:00.000Z',
      completed_at: completedAt,
    }
    const completedGrowth: GrowthState = {
      ...growth,
      current_streak: 1,
      total_growth_points: 8,
    }
    const completion: ReadingCompletionSnapshot = {
      habit,
      plan,
      growth: completedGrowth,
      session: completedSession,
      daily_progress: {
        id: 'daily-1',
        habit_id: habit.id,
        user_id: habit.user_id,
        progress_date: '2026-07-28',
        target_value: 5,
        completed_value: 8,
        session_count: 1,
        met_target: true,
        completed_at: completedAt,
        created_at: completedAt,
        updated_at: completedAt,
      },
    }

    render(
      <CompletionClient
        initialSession={completedSession}
        initialCompletion={completion}
      />
    )

    expect(screen.getByText('8 trang đã thành tăng trưởng')).toBeInTheDocument()
    expect(screen.getByText('Bạn đạt target và vượt 3 trang.')).toBeInTheDocument()
    expect(screen.getByText('+8 growth')).toBeInTheDocument()
    expect(screen.getByText('1 ngày')).toBeInTheDocument()
    expect(screen.getByText('“Một chương rất hay.”')).toBeInTheDocument()
  })

  it('shows deterministic milestones and an honest empty history state', () => {
    render(<GrowthPlanView snapshot={journey} />)

    expect(screen.getByRole('heading', { name: '5→30 trang mỗi ngày' })).toBeInTheDocument()
    expect(screen.getByText('Target hiện tại')).toBeInTheDocument()
    expect(screen.getByText('10 trang')).toBeInTheDocument()
    expect(screen.getByText(/Review mỗi 7 ngày/)).toBeInTheDocument()
    expect(screen.getByText('Chưa đến kỳ review đầu tiên')).toBeInTheDocument()
  })
})

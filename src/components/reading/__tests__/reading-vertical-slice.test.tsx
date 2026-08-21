import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CompletionClient } from '@/components/reading/completion-client'
import { FocusSessionClient } from '@/components/reading/focus-session-client'
import { GrowthPlanView } from '@/components/reading/growth-plan-view'
import { ReadingHome } from '@/components/reading/reading-home'
import type { PlantWithType } from '@/types/database'
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

vi.mock('@/components/plants/plant-image', () => ({
  PlantImage: ({ plant }: { plant: PlantWithType }) => (
    <div
      data-testid="reading-plant-image"
      data-plant-id={plant.id}
      data-plant-type={plant.plant_type.name}
    >
      {plant.name}
    </div>
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

const linkedPlant = {
  id: 'plant-1',
  user_id: habit.user_id,
  plant_type_id: 'plant-type-lavender',
  name: 'Cây Oải Hương',
  habit_description: 'Đọc một chương mỗi ngày.',
  started_at: '2026-07-01T00:00:00.000Z',
  current_moisture: 72,
  growth_percentage: 48,
  total_waterings: 12,
  current_streak: 3,
  longest_streak: 7,
  last_watered_at: null,
  status: 'growing',
  matured_at: null,
  died_at: null,
  death_reason: null,
  goal_mode: null,
  reminder_time: null,
  reminder_enabled: false,
  adaptive_mode: 'suggest',
  position: 0,
  grid_size: 1,
  grid_row: 2,
  grid_col: 3,
  weed_count: 0,
  last_weed_added: null,
  weeds_cleared_total: 0,
  why_i_started: 'Giữ một khoảng yên tĩnh mỗi ngày.',
  maturity_level: 4,
  visual_stage: 'growing',
  grace_period_days: 3,
  days_this_week: 2,
  days_this_month: 8,
  consistency_percentage: 67,
  easy_mode: true,
  tiny_seed: 'Đọc 2 trang',
  created_at: '2026-07-01T00:00:00.000Z',
  updated_at: '2026-07-28T00:00:00.000Z',
  plant_type: {
    id: 'plant-type-lavender',
    name: 'Lavender',
    name_vi: 'Oải hương',
    icon: '🌿',
    description: 'A calm flowering herb.',
    description_vi: 'Một loài thảo mộc có hoa dịu dàng.',
    maturity_days: 30,
    frequency_type: 'daily',
    frequency_target: 1,
    moisture_decay_rate: 10,
    moisture_boost: 30,
    special_effect: null,
    category: 'herb',
    difficulty: 'easy',
    is_premium: false,
    tier: 1,
    tier_unlock_level: 1,
    created_at: '2026-07-01T00:00:00.000Z',
  },
  guided_habit: {
    id: habit.id,
    plant_id: 'plant-1',
    type: habit.type,
    is_active: habit.is_active,
  },
  goal: null,
  today_logs: [],
  today_log_count: 0,
} satisfies PlantWithType

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
  source_plant_id: 'plant-1',
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
  plant: linkedPlant,
  plan,
  growth,
  today: null,
  active_session: null,
  latest_completed_session: null,
}

describe('reading habit vertical slice UI', () => {
  it('shows the reading plant, today target, and both primary destinations', () => {
    render(<ReadingHome snapshot={journey} />)

    expect(screen.getByTestId('reading-plant-image')).toHaveAttribute(
      'data-plant-id',
      linkedPlant.id
    )
    expect(screen.getByTestId('reading-plant-image')).toHaveAttribute(
      'data-plant-type',
      linkedPlant.plant_type.name
    )
    expect(screen.getByTestId('reading-plant-image')).toHaveTextContent(linkedPlant.name)
    expect(screen.getByRole('heading', { name: linkedPlant.name })).toBeInTheDocument()
    expect(screen.getByText('0/5 trang')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Bắt đầu đọc' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Growth Plan/i })).toHaveAttribute(
      'href',
      '/plant/plant-1/reading/growth-plan'
    )
    expect(screen.getByRole('progressbar', { name: 'Tiến độ đọc hôm nay' })).toHaveAttribute(
      'aria-valuenow',
      '0'
    )
  })

  it('acknowledges persisted progress even while the plant is still a seed', () => {
    render(
      <ReadingHome
        snapshot={{
          ...journey,
          today: {
            id: 'daily-1',
            habit_id: habit.id,
            user_id: habit.user_id,
            progress_date: '2026-07-28',
            target_value: 5,
            completed_value: 7,
            session_count: 1,
            met_target: true,
            completed_at: '2026-07-28T00:26:00.000Z',
            created_at: '2026-07-28T00:26:00.000Z',
            updated_at: '2026-07-28T00:26:00.000Z',
          },
        }}
      />
    )

    expect(screen.getByText('7/5 trang')).toBeInTheDocument()
    expect(screen.getByText('Hôm nay bạn đã nuôi cây bằng 7 trang và đạt mục tiêu.')).toBeInTheDocument()
    expect(screen.queryByText('Cây tri thức đang chờ phiên đọc đầu tiên.')).not.toBeInTheDocument()
  })

  it('restores a paused focus session with target and remaining time', () => {
    render(
      <FocusSessionClient
        plantId={linkedPlant.id}
        habit={habit}
        initialSession={pausedSession}
      />
    )

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
        plantId={linkedPlant.id}
        initialSession={completedSession}
        initialCompletion={completion}
      />
    )

    expect(screen.getByText('8 trang đã thành tăng trưởng')).toBeInTheDocument()
    expect(screen.getByText('Bạn đạt target và vượt 3 trang.')).toBeInTheDocument()
    expect(screen.getByText('+8 growth')).toBeInTheDocument()
    expect(screen.getByText('1 ngày')).toBeInTheDocument()
    expect(screen.getByText('“Một chương rất hay.”')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Về cây hôm nay' })).toHaveAttribute(
      'href',
      '/plant/plant-1'
    )
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

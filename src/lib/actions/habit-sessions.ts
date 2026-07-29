'use server'

import { getAuthUser } from '@/lib/auth-cached'
import {
  addUtcDays,
  getSessionElapsedSeconds,
  READING_HABIT_TEMPLATE,
  validateCompletedValue,
} from '@/lib/habit-growth'
import { createClient } from '@/lib/supabase/server'
import type {
  DailyProgress,
  GoalPlan,
  GrowthState,
  Habit,
  HabitSession,
  ReadingCompletionSnapshot,
  ReadingJourneySnapshot,
} from '@/types/habits'

const HABIT_COLUMNS = [
  'id',
  'user_id',
  'type',
  'name',
  'description',
  'unit',
  'custom_unit',
  'session_duration_minutes',
  'is_active',
  'created_at',
  'updated_at',
].join(',')

const GOAL_PLAN_COLUMNS = [
  'id',
  'habit_id',
  'user_id',
  'start_target',
  'end_target',
  'timeframe_weeks',
  'increment_value',
  'review_period_days',
  'performance_threshold',
  'started_on',
  'target_end_on',
  'created_at',
  'updated_at',
].join(',')

const SESSION_COLUMNS = [
  'id',
  'habit_id',
  'user_id',
  'status',
  'target_value',
  'duration_seconds',
  'accumulated_seconds',
  'last_resumed_at',
  'ambient_enabled',
  'result_value',
  'reflection',
  'reward_points',
  'started_at',
  'paused_at',
  'finished_at',
  'completed_at',
  'created_at',
  'updated_at',
].join(',')

const DAILY_PROGRESS_COLUMNS = [
  'id',
  'habit_id',
  'user_id',
  'progress_date',
  'target_value',
  'completed_value',
  'session_count',
  'met_target',
  'completed_at',
  'created_at',
  'updated_at',
].join(',')

const GROWTH_STATE_COLUMNS = [
  'id',
  'habit_id',
  'user_id',
  'current_target',
  'previous_target',
  'next_target',
  'review_period_started_on',
  'next_review_on',
  'last_reviewed_on',
  'consistency_score',
  'current_streak',
  'best_streak',
  'last_completed_on',
  'total_growth_points',
  'plant_stage',
  'history',
  'created_at',
  'updated_at',
].join(',')

const OPEN_SESSION_STATUSES = ['running', 'paused', 'awaiting_completion']
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type ReadingActionErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'INVALID_STATE'
  | 'PERSISTENCE_ERROR'

export type ReadingActionResult<T> =
  | { success: true; data: T }
  | { success: false; code: ReadingActionErrorCode; error: string }

function fail<T>(
  code: ReadingActionErrorCode,
  error: string
): ReadingActionResult<T> {
  return { success: false, code, error }
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10)
}

function asHabit(value: unknown): Habit {
  return value as Habit
}

function asGoalPlan(value: unknown): GoalPlan {
  return value as GoalPlan
}

function asSession(value: unknown): HabitSession {
  return value as HabitSession
}

function asDailyProgress(value: unknown): DailyProgress {
  return value as DailyProgress
}

function asGrowthState(value: unknown): GrowthState {
  return value as GrowthState
}

async function requireUser() {
  const user = await getAuthUser()
  if (!user) return null
  return user
}

async function ensureReadingJourney(userId: string): Promise<ReadingActionResult<{
  habit: Habit
  plan: GoalPlan
  growth: GrowthState
}>> {
  const supabase = await createClient()
  const today = todayIsoDate()

  let { data: habitRow, error: habitError } = await supabase
    .from('habits')
    .select(HABIT_COLUMNS)
    .eq('user_id', userId)
    .eq('type', READING_HABIT_TEMPLATE.type)
    .maybeSingle()

  if (habitError) {
    console.error('Unable to load reading habit:', habitError)
    return fail('PERSISTENCE_ERROR', 'Không thể tải thói quen đọc lúc này.')
  }

  if (!habitRow) {
    const { error: insertError } = await supabase
      .from('habits')
      .insert({
        user_id: userId,
        type: READING_HABIT_TEMPLATE.type,
        name: READING_HABIT_TEMPLATE.name,
        description: READING_HABIT_TEMPLATE.description,
        unit: READING_HABIT_TEMPLATE.unit,
        custom_unit: null,
        session_duration_minutes: READING_HABIT_TEMPLATE.sessionDurationMinutes,
      })

    if (insertError && insertError.code !== '23505') {
      console.error('Unable to create reading habit:', insertError)
      return fail('PERSISTENCE_ERROR', 'Không thể tạo thói quen đọc lúc này.')
    }

    const reloaded = await supabase
      .from('habits')
      .select(HABIT_COLUMNS)
      .eq('user_id', userId)
      .eq('type', READING_HABIT_TEMPLATE.type)
      .single()
    habitRow = reloaded.data
    habitError = reloaded.error
  }

  if (habitError || !habitRow) {
    console.error('Reading habit bootstrap did not produce a habit:', habitError)
    return fail('PERSISTENCE_ERROR', 'Thói quen đọc chưa sẵn sàng.')
  }

  const habit = asHabit(habitRow)
  const targetEndOn = addUtcDays(today, READING_HABIT_TEMPLATE.timeframeWeeks * 7)

  const { error: planInsertError } = await supabase
    .from('goal_plans')
    .upsert({
      habit_id: habit.id,
      user_id: userId,
      start_target: READING_HABIT_TEMPLATE.startTarget,
      end_target: READING_HABIT_TEMPLATE.endTarget,
      timeframe_weeks: READING_HABIT_TEMPLATE.timeframeWeeks,
      increment_value: READING_HABIT_TEMPLATE.incrementValue,
      review_period_days: READING_HABIT_TEMPLATE.reviewPeriodDays,
      performance_threshold: READING_HABIT_TEMPLATE.performanceThreshold,
      started_on: today,
      target_end_on: targetEndOn,
    }, {
      onConflict: 'habit_id',
      ignoreDuplicates: true,
    })

  if (planInsertError) {
    console.error('Unable to ensure reading goal plan:', planInsertError)
    return fail('PERSISTENCE_ERROR', 'Không thể tải kế hoạch tăng trưởng.')
  }

  const { error: growthInsertError } = await supabase
    .from('growth_states')
    .upsert({
      habit_id: habit.id,
      user_id: userId,
      current_target: READING_HABIT_TEMPLATE.startTarget,
      previous_target: null,
      next_target: Math.min(
        READING_HABIT_TEMPLATE.endTarget,
        READING_HABIT_TEMPLATE.startTarget + READING_HABIT_TEMPLATE.incrementValue
      ),
      review_period_started_on: today,
      next_review_on: addUtcDays(today, READING_HABIT_TEMPLATE.reviewPeriodDays),
    }, {
      onConflict: 'habit_id',
      ignoreDuplicates: true,
    })

  if (growthInsertError) {
    console.error('Unable to ensure reading growth state:', growthInsertError)
    return fail('PERSISTENCE_ERROR', 'Không thể tải trạng thái tăng trưởng.')
  }

  const [planResult, growthResult] = await Promise.all([
    supabase
      .from('goal_plans')
      .select(GOAL_PLAN_COLUMNS)
      .eq('habit_id', habit.id)
      .eq('user_id', userId)
      .single(),
    supabase
      .from('growth_states')
      .select(GROWTH_STATE_COLUMNS)
      .eq('habit_id', habit.id)
      .eq('user_id', userId)
      .single(),
  ])

  if (planResult.error || growthResult.error || !planResult.data || !growthResult.data) {
    console.error('Reading journey bootstrap is incomplete:', {
      plan: planResult.error,
      growth: growthResult.error,
    })
    return fail('PERSISTENCE_ERROR', 'Dữ liệu hành trình đọc chưa đầy đủ.')
  }

  return {
    success: true,
    data: {
      habit,
      plan: asGoalPlan(planResult.data),
      growth: asGrowthState(growthResult.data),
    },
  }
}

export async function getReadingJourneySnapshot(): Promise<
  ReadingActionResult<ReadingJourneySnapshot>
> {
  const user = await requireUser()
  if (!user) return fail('NOT_AUTHENTICATED', 'Bạn cần đăng nhập để mở hành trình đọc.')

  const ensured = await ensureReadingJourney(user.id)
  if (!ensured.success) return ensured

  const supabase = await createClient()
  const { habit, plan, growth } = ensured.data
  const today = todayIsoDate()

  const [todayResult, activeSessionResult, completedSessionResult] = await Promise.all([
    supabase
      .from('daily_progress')
      .select(DAILY_PROGRESS_COLUMNS)
      .eq('habit_id', habit.id)
      .eq('user_id', user.id)
      .eq('progress_date', today)
      .maybeSingle(),
    supabase
      .from('habit_sessions')
      .select(SESSION_COLUMNS)
      .eq('habit_id', habit.id)
      .eq('user_id', user.id)
      .in('status', OPEN_SESSION_STATUSES)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('habit_sessions')
      .select(SESSION_COLUMNS)
      .eq('habit_id', habit.id)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .gte('completed_at', `${today}T00:00:00.000Z`)
      .lt('completed_at', `${addUtcDays(today, 1)}T00:00:00.000Z`)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const readError = todayResult.error || activeSessionResult.error || completedSessionResult.error
  if (readError) {
    console.error('Unable to load reading journey snapshot:', readError)
    return fail('PERSISTENCE_ERROR', 'Không thể làm mới hành trình đọc.')
  }

  return {
    success: true,
    data: {
      habit,
      plan,
      growth,
      today: todayResult.data ? asDailyProgress(todayResult.data) : null,
      active_session: activeSessionResult.data ? asSession(activeSessionResult.data) : null,
      latest_completed_session: completedSessionResult.data
        ? asSession(completedSessionResult.data)
        : null,
    },
  }
}

export async function startReadingSession(): Promise<ReadingActionResult<HabitSession>> {
  const user = await requireUser()
  if (!user) return fail('NOT_AUTHENTICATED', 'Bạn cần đăng nhập để bắt đầu đọc.')

  const ensured = await ensureReadingJourney(user.id)
  if (!ensured.success) return ensured

  const supabase = await createClient()
  const { habit, growth } = ensured.data
  const existing = await supabase
    .from('habit_sessions')
    .select(SESSION_COLUMNS)
    .eq('habit_id', habit.id)
    .eq('user_id', user.id)
    .in('status', OPEN_SESSION_STATUSES)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing.error) {
    console.error('Unable to find open reading session:', existing.error)
    return fail('PERSISTENCE_ERROR', 'Không thể kiểm tra phiên đọc hiện tại.')
  }
  if (existing.data) {
    return { success: true, data: asSession(existing.data) }
  }

  const now = new Date().toISOString()
  const created = await supabase
    .from('habit_sessions')
    .insert({
      habit_id: habit.id,
      user_id: user.id,
      status: 'running',
      target_value: growth.current_target,
      duration_seconds: habit.session_duration_minutes * 60,
      accumulated_seconds: 0,
      last_resumed_at: now,
      ambient_enabled: false,
    })
    .select(SESSION_COLUMNS)
    .single()

  if (created.error || !created.data) {
    if (created.error?.code === '23505') {
      const concurrent = await supabase
        .from('habit_sessions')
        .select(SESSION_COLUMNS)
        .eq('habit_id', habit.id)
        .eq('user_id', user.id)
        .in('status', OPEN_SESSION_STATUSES)
        .limit(1)
        .single()
      if (concurrent.data) {
        return { success: true, data: asSession(concurrent.data) }
      }
    }

    console.error('Unable to start reading session:', created.error)
    return fail('PERSISTENCE_ERROR', 'Không thể bắt đầu phiên đọc.')
  }

  return { success: true, data: asSession(created.data) }
}

async function getOwnedSession(
  sessionId: string,
  userId: string
): Promise<ReadingActionResult<HabitSession>> {
  if (!UUID_PATTERN.test(sessionId)) {
    return fail('INVALID_INPUT', 'Mã phiên đọc không hợp lệ.')
  }

  const supabase = await createClient()
  const result = await supabase
    .from('habit_sessions')
    .select(SESSION_COLUMNS)
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  if (result.error || !result.data) {
    return fail('NOT_FOUND', 'Không tìm thấy phiên đọc này.')
  }
  return { success: true, data: asSession(result.data) }
}

export async function getReadingSession(
  sessionId?: string
): Promise<ReadingActionResult<HabitSession>> {
  const user = await requireUser()
  if (!user) return fail('NOT_AUTHENTICATED', 'Bạn cần đăng nhập để mở phiên đọc.')

  if (sessionId) return getOwnedSession(sessionId, user.id)

  const snapshot = await getReadingJourneySnapshot()
  if (!snapshot.success) return snapshot
  if (!snapshot.data.active_session) {
    return fail('NOT_FOUND', 'Chưa có phiên đọc đang mở.')
  }
  return { success: true, data: snapshot.data.active_session }
}

export async function pauseReadingSession(
  sessionId: string
): Promise<ReadingActionResult<HabitSession>> {
  const user = await requireUser()
  if (!user) return fail('NOT_AUTHENTICATED', 'Bạn cần đăng nhập để tạm dừng.')

  const owned = await getOwnedSession(sessionId, user.id)
  if (!owned.success) return owned
  const session = owned.data

  if (session.status === 'paused' || session.status === 'awaiting_completion') {
    return { success: true, data: session }
  }
  if (session.status !== 'running') {
    return fail('INVALID_STATE', 'Phiên đọc này không còn chạy.')
  }

  const now = new Date()
  const elapsed = Math.min(
    session.duration_seconds,
    getSessionElapsedSeconds(
      session.accumulated_seconds,
      session.status,
      session.last_resumed_at,
      now
    )
  )
  const reachedEnd = elapsed >= session.duration_seconds
  const supabase = await createClient()
  const updated = await supabase
    .from('habit_sessions')
    .update({
      status: reachedEnd ? 'awaiting_completion' : 'paused',
      accumulated_seconds: elapsed,
      last_resumed_at: null,
      paused_at: reachedEnd ? null : now.toISOString(),
      finished_at: reachedEnd ? now.toISOString() : null,
      updated_at: now.toISOString(),
    })
    .eq('id', session.id)
    .eq('user_id', user.id)
    .eq('status', 'running')
    .select(SESSION_COLUMNS)
    .single()

  if (updated.error || !updated.data) {
    console.error('Unable to pause reading session:', updated.error)
    return fail('PERSISTENCE_ERROR', 'Không thể tạm dừng phiên đọc.')
  }
  return { success: true, data: asSession(updated.data) }
}

export async function resumeReadingSession(
  sessionId: string
): Promise<ReadingActionResult<HabitSession>> {
  const user = await requireUser()
  if (!user) return fail('NOT_AUTHENTICATED', 'Bạn cần đăng nhập để tiếp tục.')

  const owned = await getOwnedSession(sessionId, user.id)
  if (!owned.success) return owned
  const session = owned.data

  if (session.status === 'running' || session.status === 'awaiting_completion') {
    return { success: true, data: session }
  }
  if (session.status !== 'paused') {
    return fail('INVALID_STATE', 'Phiên đọc này không thể tiếp tục.')
  }

  const now = new Date().toISOString()
  const supabase = await createClient()
  const updated = await supabase
    .from('habit_sessions')
    .update({
      status: 'running',
      last_resumed_at: now,
      paused_at: null,
      updated_at: now,
    })
    .eq('id', session.id)
    .eq('user_id', user.id)
    .eq('status', 'paused')
    .select(SESSION_COLUMNS)
    .single()

  if (updated.error || !updated.data) {
    console.error('Unable to resume reading session:', updated.error)
    return fail('PERSISTENCE_ERROR', 'Không thể tiếp tục phiên đọc.')
  }
  return { success: true, data: asSession(updated.data) }
}

export async function finishReadingSession(
  sessionId: string
): Promise<ReadingActionResult<HabitSession>> {
  const user = await requireUser()
  if (!user) return fail('NOT_AUTHENTICATED', 'Bạn cần đăng nhập để hoàn tất phiên đọc.')

  const owned = await getOwnedSession(sessionId, user.id)
  if (!owned.success) return owned
  const session = owned.data

  if (session.status === 'awaiting_completion' || session.status === 'completed') {
    return { success: true, data: session }
  }
  if (session.status !== 'running' && session.status !== 'paused') {
    return fail('INVALID_STATE', 'Phiên đọc này không thể hoàn tất.')
  }

  const now = new Date()
  const elapsed = Math.min(
    session.duration_seconds,
    getSessionElapsedSeconds(
      session.accumulated_seconds,
      session.status,
      session.last_resumed_at,
      now
    )
  )
  const supabase = await createClient()
  const updated = await supabase
    .from('habit_sessions')
    .update({
      status: 'awaiting_completion',
      accumulated_seconds: elapsed,
      last_resumed_at: null,
      paused_at: null,
      finished_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .eq('id', session.id)
    .eq('user_id', user.id)
    .in('status', ['running', 'paused'])
    .select(SESSION_COLUMNS)
    .single()

  if (updated.error || !updated.data) {
    console.error('Unable to finish reading session:', updated.error)
    return fail('PERSISTENCE_ERROR', 'Không thể kết thúc phiên đọc.')
  }
  return { success: true, data: asSession(updated.data) }
}

export async function setReadingAmbient(
  sessionId: string,
  enabled: boolean
): Promise<ReadingActionResult<HabitSession>> {
  const user = await requireUser()
  if (!user) return fail('NOT_AUTHENTICATED', 'Bạn cần đăng nhập để đổi âm thanh.')

  const owned = await getOwnedSession(sessionId, user.id)
  if (!owned.success) return owned
  if (!OPEN_SESSION_STATUSES.includes(owned.data.status)) {
    return fail('INVALID_STATE', 'Phiên đọc này đã kết thúc.')
  }

  const supabase = await createClient()
  const updated = await supabase
    .from('habit_sessions')
    .update({
      ambient_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select(SESSION_COLUMNS)
    .single()

  if (updated.error || !updated.data) {
    console.error('Unable to persist ambient preference:', updated.error)
    return fail('PERSISTENCE_ERROR', 'Không thể lưu lựa chọn âm thanh.')
  }
  return { success: true, data: asSession(updated.data) }
}

export async function completeReadingSession(
  sessionId: string,
  completedPages: number,
  reflection?: string
): Promise<ReadingActionResult<ReadingCompletionSnapshot>> {
  const user = await requireUser()
  if (!user) return fail('NOT_AUTHENTICATED', 'Bạn cần đăng nhập để lưu kết quả.')
  if (!UUID_PATTERN.test(sessionId)) {
    return fail('INVALID_INPUT', 'Mã phiên đọc không hợp lệ.')
  }

  const validationError = validateCompletedValue(completedPages)
  if (validationError) return fail('INVALID_INPUT', validationError)
  if (reflection && reflection.length > 2000) {
    return fail('INVALID_INPUT', 'Ghi chú tối đa 2.000 ký tự.')
  }

  const supabase = await createClient()
  const result = await supabase.rpc('complete_habit_session_atomic', {
    p_session_id: sessionId,
    p_completed_value: completedPages,
    p_reflection: reflection?.trim() || null,
  })

  if (result.error || !result.data) {
    console.error('Unable to complete reading session:', result.error)
    const invalidState = result.error?.code === '55000'
    return fail(
      invalidState ? 'INVALID_STATE' : 'PERSISTENCE_ERROR',
      invalidState
        ? 'Hãy kết thúc bộ đếm trước khi lưu số trang.'
        : 'Không thể lưu kết quả phiên đọc.'
    )
  }

  const payload = result.data as {
    session: HabitSession
    daily_progress: DailyProgress
    growth_state: GrowthState
  }
  const ensured = await ensureReadingJourney(user.id)
  if (!ensured.success) return ensured

  // TODO Phase 2: Log to activity_logs once schema supports virtual plants
  // Currently blocked by:
  // 1. activity_logs.plant_id has FK constraint to plants table (requires UUID)
  // 2. No metadata field to store habit session context
  // 3. No activity_type for 'habit_session_completed'
  //
  // Planned implementation:
  // await logActivity({
  //   plant_id: habit.id, // Will map to virtual plant via habit-plant-mapping
  //   activity_type: 'habit_session_completed',
  //   value: completedPages,
  //   notes: reflection?.trim() || undefined,
  //   metadata: {
  //     session_id: payload.session.id,
  //     habit_type: habit.type,
  //     duration_seconds: payload.session.duration_seconds
  //   }
  // })

  return {
    success: true,
    data: {
      habit: ensured.data.habit,
      plan: ensured.data.plan,
      growth: asGrowthState(payload.growth_state),
      daily_progress: asDailyProgress(payload.daily_progress),
      session: asSession(payload.session),
    },
  }
}

export async function getReadingCompletion(
  sessionId: string
): Promise<ReadingActionResult<ReadingCompletionSnapshot>> {
  const user = await requireUser()
  if (!user) return fail('NOT_AUTHENTICATED', 'Bạn cần đăng nhập để xem kết quả.')

  const owned = await getOwnedSession(sessionId, user.id)
  if (!owned.success) return owned
  if (owned.data.status !== 'completed' || !owned.data.completed_at) {
    return fail('INVALID_STATE', 'Phiên đọc này chưa có kết quả.')
  }

  const ensured = await ensureReadingJourney(user.id)
  if (!ensured.success) return ensured
  const supabase = await createClient()
  const progressDate = owned.data.completed_at.slice(0, 10)
  const daily = await supabase
    .from('daily_progress')
    .select(DAILY_PROGRESS_COLUMNS)
    .eq('habit_id', owned.data.habit_id)
    .eq('user_id', user.id)
    .eq('progress_date', progressDate)
    .single()

  if (daily.error || !daily.data) {
    console.error('Unable to load completed reading progress:', daily.error)
    return fail('PERSISTENCE_ERROR', 'Không thể tải kết quả đã lưu.')
  }

  return {
    success: true,
    data: {
      habit: ensured.data.habit,
      plan: ensured.data.plan,
      growth: ensured.data.growth,
      daily_progress: asDailyProgress(daily.data),
      session: owned.data,
    },
  }
}


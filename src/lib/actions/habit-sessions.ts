'use server'

import { getAuthUser } from '@/lib/auth-cached'
import {
  addUtcDays,
  getSessionElapsedSeconds,
  READING_HABIT_TEMPLATE,
  validateCompletedValue,
} from '@/lib/habit-growth'
import { createClient } from '@/lib/supabase/server'
import { logActivity } from '@/lib/actions/activity'
import { attachCapabilityToPlant } from '@/lib/actions/capabilities'
import type {
  DailyProgress,
  GoalPlan,
  GrowthState,
  Habit,
  HabitSession,
  ReadingCompletionSnapshot,
  ReadingJourneySnapshot,
} from '@/types/habits'
import type { PlantWithType } from '@/types/database'

const HABIT_COLUMNS = [
  'id',
  'user_id',
  'type',
  'name',
  'description',
  'unit',
  'custom_unit',
  'session_duration_minutes',
  'config',
  'definition_version',
  'is_active',
  'archived_at',
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
  'source_plant_id',
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

function asPlant(value: unknown): PlantWithType {
  return value as PlantWithType
}

async function requireUser() {
  const user = await getAuthUser()
  if (!user) return null
  return user
}

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

async function loadAssignedReadingHabit(
  supabase: ServerSupabaseClient,
  userId: string,
  plantId: string
): Promise<ReadingActionResult<Habit>> {
  const assignmentResult = await supabase
    .from('plant_capability_assignments')
    .select('habit_id')
    .eq('plant_id', plantId)
    .eq('user_id', userId)
    .maybeSingle()

  if (assignmentResult.error) {
    console.error('Unable to load the plant capability assignment:', assignmentResult.error)
    return fail('PERSISTENCE_ERROR', 'Không thể tải tính năng của cây lúc này.')
  }
  if (!assignmentResult.data) {
    return fail('NOT_FOUND', 'Cây này chưa được gắn tính năng theo dõi đọc sách.')
  }

  const habitResult = await supabase
    .from('habits')
    .select(HABIT_COLUMNS)
    .eq('id', assignmentResult.data.habit_id)
    .eq('user_id', userId)
    .eq('type', READING_HABIT_TEMPLATE.type)
    .eq('is_active', true)
    .maybeSingle()

  if (habitResult.error) {
    console.error('Unable to load the assigned reading capability:', habitResult.error)
    return fail('PERSISTENCE_ERROR', 'Không thể tải tính năng đọc sách lúc này.')
  }
  if (!habitResult.data) {
    return fail('NOT_FOUND', 'Cây này chưa được gắn tính năng theo dõi đọc sách.')
  }

  return { success: true, data: asHabit(habitResult.data) }
}

async function resolveAssignedPlantId(
  supabase: ServerSupabaseClient,
  userId: string,
  habitId: string,
  preferredPlantId?: string | null
): Promise<ReadingActionResult<string>> {
  if (preferredPlantId) {
    const preferred = await supabase
      .from('plant_capability_assignments')
      .select('plant_id')
      .eq('plant_id', preferredPlantId)
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .maybeSingle()

    if (preferred.error) {
      console.error('Unable to validate the session source plant:', preferred.error)
      return fail('PERSISTENCE_ERROR', 'Không thể xác định cây của phiên đọc lúc này.')
    }
    if (preferred.data) return { success: true, data: preferred.data.plant_id }
  }

  const fallback = await supabase
    .from('plant_capability_assignments')
    .select('plant_id')
    .eq('habit_id', habitId)
    .eq('user_id', userId)
    .order('assigned_at', { ascending: true })
    .order('plant_id', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (fallback.error) {
    console.error('Unable to resolve an assigned plant:', fallback.error)
    return fail('PERSISTENCE_ERROR', 'Không thể xác định cây của phiên đọc lúc này.')
  }
  if (!fallback.data) {
    return fail('NOT_FOUND', 'Hành trình đọc chưa được gắn với cây nào trong khu vườn.')
  }

  return { success: true, data: fallback.data.plant_id }
}

export type ReadingCapabilityAttachment = {
  habit: Habit
  outcome: 'attached' | 'already_attached'
}

export async function attachReadingCapabilityToPlant(
  plantId: string
): Promise<ReadingActionResult<ReadingCapabilityAttachment>> {
  const result = await attachCapabilityToPlant({
    plantId,
    capabilityKey: 'reading',
    confirmedIntent: true,
  })

  if (!result.success) return fail(result.code, result.error)

  return {
    success: true,
    data: {
      habit: result.data.habit,
      outcome: result.data.outcome,
    },
  }
}

async function ensureReadingJourney(
  userId: string,
  plantId: string
): Promise<ReadingActionResult<{
  habit: Habit
  plan: GoalPlan
  growth: GrowthState
}>> {
  if (!UUID_PATTERN.test(plantId)) {
    return fail('INVALID_INPUT', 'Cây được chọn không hợp lệ.')
  }

  const supabase = await createClient()
  const today = todayIsoDate()

  const assigned = await loadAssignedReadingHabit(supabase, userId, plantId)
  if (!assigned.success) return assigned
  const habit = assigned.data
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
      onConflict: 'habit_id,user_id',
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
      onConflict: 'habit_id,user_id',
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

async function loadReadingJourneyByHabit(
  supabase: ServerSupabaseClient,
  userId: string,
  habitId: string
): Promise<ReadingActionResult<{
  habit: Habit
  plan: GoalPlan
  growth: GrowthState
}>> {
  const [habitResult, planResult, growthResult] = await Promise.all([
    supabase
      .from('habits')
      .select(HABIT_COLUMNS)
      .eq('id', habitId)
      .eq('user_id', userId)
      .eq('type', READING_HABIT_TEMPLATE.type)
      .eq('is_active', true)
      .maybeSingle(),
    supabase
      .from('goal_plans')
      .select(GOAL_PLAN_COLUMNS)
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('growth_states')
      .select(GROWTH_STATE_COLUMNS)
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .maybeSingle(),
  ])

  if (
    habitResult.error
    || planResult.error
    || growthResult.error
    || !habitResult.data
    || !planResult.data
    || !growthResult.data
  ) {
    console.error('Unable to load the capability instance journey:', {
      habit: habitResult.error,
      plan: planResult.error,
      growth: growthResult.error,
    })
    return fail('PERSISTENCE_ERROR', 'Dữ liệu hành trình đọc chưa đầy đủ.')
  }

  return {
    success: true,
    data: {
      habit: asHabit(habitResult.data),
      plan: asGoalPlan(planResult.data),
      growth: asGrowthState(growthResult.data),
    },
  }
}

export async function getReadingJourneySnapshot(plantId: string): Promise<
  ReadingActionResult<ReadingJourneySnapshot>
> {
  const user = await requireUser()
  if (!user) return fail('NOT_AUTHENTICATED', 'Bạn cần đăng nhập để mở hành trình đọc.')

  const ensured = await ensureReadingJourney(user.id, plantId)
  if (!ensured.success) return ensured

  const supabase = await createClient()
  const { habit, plan, growth } = ensured.data
  const today = todayIsoDate()

  const [plantResult, todayResult, activeSessionResult, completedSessionResult] = await Promise.all([
    supabase
      .from('plants')
      .select('*, plant_type:plant_types(*)')
      .eq('id', plantId)
      .eq('user_id', user.id)
      .maybeSingle(),
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

  const readError = plantResult.error
    || todayResult.error
    || activeSessionResult.error
    || completedSessionResult.error
  if (readError) {
    console.error('Unable to load reading journey snapshot:', readError)
    return fail('PERSISTENCE_ERROR', 'Không thể làm mới hành trình đọc.')
  }

  if (!plantResult.data) {
    return fail(
      'NOT_FOUND',
      'Không tìm thấy cây đang gắn với hành trình đọc trong khu vườn của bạn.'
    )
  }

  return {
    success: true,
    data: {
      habit,
      plant: asPlant(plantResult.data),
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

export async function startReadingSession(
  plantId: string
): Promise<ReadingActionResult<HabitSession>> {
  const user = await requireUser()
  if (!user) return fail('NOT_AUTHENTICATED', 'Bạn cần đăng nhập để bắt đầu đọc.')

  const ensured = await ensureReadingJourney(user.id, plantId)
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
      source_plant_id: plantId,
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
  plantId: string,
  sessionId?: string
): Promise<ReadingActionResult<HabitSession>> {
  const user = await requireUser()
  if (!user) return fail('NOT_AUTHENTICATED', 'Bạn cần đăng nhập để mở phiên đọc.')
  if (!UUID_PATTERN.test(plantId)) return fail('INVALID_INPUT', 'Cây được chọn không hợp lệ.')

  const supabase = await createClient()
  const assignedHabit = await loadAssignedReadingHabit(supabase, user.id, plantId)
  if (!assignedHabit.success) return assignedHabit

  if (sessionId) {
    const owned = await getOwnedSession(sessionId, user.id)
    if (!owned.success) return owned
    if (owned.data.habit_id !== assignedHabit.data.id) {
      return fail('NOT_FOUND', 'Phiên đọc này không thuộc tính năng của cây được chọn.')
    }
    return owned
  }

  const sessionResult = await supabase
    .from('habit_sessions')
    .select(SESSION_COLUMNS)
    .eq('habit_id', assignedHabit.data.id)
    .eq('user_id', user.id)
    .in('status', OPEN_SESSION_STATUSES)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (sessionResult.error) {
    console.error('Unable to load the plant reading session:', sessionResult.error)
    return fail('PERSISTENCE_ERROR', 'Không thể tải phiên đọc lúc này.')
  }
  if (!sessionResult.data) {
    return fail('NOT_FOUND', 'Chưa có phiên đọc đang mở.')
  }
  return { success: true, data: asSession(sessionResult.data) }
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
  const journey = await loadReadingJourneyByHabit(
    supabase,
    user.id,
    payload.session.habit_id
  )
  if (!journey.success) return journey

  const sourcePlant = await resolveAssignedPlantId(
    supabase,
    user.id,
    payload.session.habit_id,
    payload.session.source_plant_id
  )
  if (sourcePlant.success) {
    const plantActivity = await logActivity({
      mutationId: payload.session.id,
      plant_id: sourcePlant.data,
      // Plant care is a one-time side effect. Pages stay exclusively in the
      // plant's capability-instance log so it cannot contaminate a legacy goal.
      activity_type: 'completed',
      notes: reflection?.trim() || undefined,
    })

    if (!plantActivity.success) {
      console.error('Reading completion could not update its source plant:', plantActivity.error)
    }
  } else {
    console.error('Reading completion has no assigned source plant:', sourcePlant.error)
  }

  return {
    success: true,
    data: {
      habit: journey.data.habit,
      plan: journey.data.plan,
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

  const supabase = await createClient()
  const journey = await loadReadingJourneyByHabit(supabase, user.id, owned.data.habit_id)
  if (!journey.success) return journey
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
      habit: journey.data.habit,
      plan: journey.data.plan,
      growth: journey.data.growth,
      daily_progress: asDailyProgress(daily.data),
      session: owned.data,
    },
  }
}


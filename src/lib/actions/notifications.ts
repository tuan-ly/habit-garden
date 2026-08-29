'use server'

import { getAuthUser } from '@/lib/auth-cached'
import { getGoalsForPlants } from '@/lib/actions/goals'
import { normalizeReminderTime } from '@/lib/notification-system'
import { createClient } from '@/lib/supabase/server'
import type {
  HabitReminderSetting,
  NotificationInboxItem,
  WebPushSubscriptionInput,
} from '@/types/notifications'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/
const PUSH_KEY_PATTERN = /^[A-Za-z0-9_-]+$/

function isValidPushSubscription(input: WebPushSubscriptionInput): boolean {
  if (
    !input
    || typeof input.endpoint !== 'string'
    || input.endpoint.length < 16
    || input.endpoint.length > 4096
    || typeof input.keys?.p256dh !== 'string'
    || typeof input.keys?.auth !== 'string'
    || input.keys.p256dh.length < 16
    || input.keys.p256dh.length > 512
    || input.keys.auth.length < 8
    || input.keys.auth.length > 256
    || !PUSH_KEY_PATTERN.test(input.keys.p256dh)
    || !PUSH_KEY_PATTERN.test(input.keys.auth)
  ) return false

  try {
    const endpoint = new URL(input.endpoint)
    return endpoint.protocol === 'https:'
  } catch {
    return false
  }
}

function getCapabilityUnit(unit: string, customUnit: string | null): string {
  switch (unit) {
    case 'pages':
      return 'trang'
    case 'minutes':
      return 'phút'
    case 'repetitions':
      return 'lần'
    case 'sessions':
      return 'phiên'
    case 'other':
      return customUnit || 'đơn vị'
    default:
      return unit
  }
}

export async function getNotifications(limit = 40): Promise<NotificationInboxItem[]> {
  const user = await getAuthUser()
  if (!user) return []

  const supabase = await createClient()
  const safeLimit = Math.min(80, Math.max(1, Math.floor(limit)))
  const { data, error } = await supabase
    .from('notifications')
    .select('id, type, title, title_vi, message, message_vi, data, read, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(safeLimit)

  if (error) {
    console.error('Unable to load notifications:', error)
    return []
  }

  return (data ?? []).map(notification => ({
    id: notification.id,
    type: notification.type,
    title: notification.title,
    titleVi: notification.title_vi,
    message: notification.message,
    messageVi: notification.message_vi,
    data: notification.data,
    read: notification.read ?? false,
    createdAt: notification.created_at ?? new Date(0).toISOString(),
  }))
}

export async function markNotificationsRead(
  notificationIds: string[]
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const ids = Array.from(new Set(notificationIds))
    .filter(id => UUID_PATTERN.test(id))
    .slice(0, 80)

  if (ids.length === 0) return { success: true }

  const supabase = await createClient()
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .in('id', ids)

  if (error) {
    console.error('Unable to mark notifications as read:', error)
    return { success: false, error: 'Không thể cập nhật thông báo.' }
  }

  return { success: true }
}

export async function registerPushSubscription(
  subscription: WebPushSubscriptionInput,
  userAgent?: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthUser()
  if (!user) return { success: false, error: 'Not authenticated' }
  if (!isValidPushSubscription(subscription)) {
    return { success: false, error: 'Thông tin đăng ký Web Push không hợp lệ.' }
  }

  const expirationTime = subscription.expirationTime == null
    ? null
    : Number.isSafeInteger(subscription.expirationTime) && subscription.expirationTime >= 0
      ? subscription.expirationTime
      : null
  const now = new Date().toISOString()
  const supabase = await createClient()
  const { error } = await supabase
    .from('push_subscriptions')
    .upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
      expiration_time: expirationTime,
      user_agent: typeof userAgent === 'string' ? userAgent.slice(0, 512) : null,
      updated_at: now,
      last_seen_at: now,
    }, { onConflict: 'endpoint' })

  if (error) {
    console.error('Unable to register Web Push subscription:', error)
    return { success: false, error: 'Không thể đăng ký thiết bị nhận Web Push.' }
  }

  return { success: true }
}

export async function unregisterPushSubscription(
  endpoint: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthUser()
  if (!user) return { success: false, error: 'Not authenticated' }
  if (typeof endpoint !== 'string' || endpoint.length < 16 || endpoint.length > 4096) {
    return { success: false, error: 'Web Push subscription không hợp lệ.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .eq('endpoint', endpoint)

  if (error) {
    console.error('Unable to unregister Web Push subscription:', error)
    return { success: false, error: 'Không thể tắt Web Push trên thiết bị này.' }
  }

  return { success: true }
}

export async function updateHabitReminder(input: {
  plantId: string
  enabled: boolean
  time: string
}): Promise<{ success: boolean; error?: string }> {
  const user = await getAuthUser()
  if (!user) return { success: false, error: 'Not authenticated' }
  if (!UUID_PATTERN.test(input.plantId)) {
    return { success: false, error: 'Habit không hợp lệ.' }
  }

  const time = normalizeReminderTime(input.time)
  if (!TIME_PATTERN.test(time)) {
    return { success: false, error: 'Giờ nhắc không hợp lệ.' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('plants')
    .update({
      reminder_enabled: input.enabled,
      reminder_time: time,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.plantId)
    .eq('user_id', user.id)
    .select('id')
    .maybeSingle()

  if (error) {
    console.error('Unable to update habit reminder:', error)
    return { success: false, error: 'Không thể lưu lịch nhắc.' }
  }
  if (!data) return { success: false, error: 'Không tìm thấy habit.' }

  return { success: true }
}

export async function getHabitReminderSettings(): Promise<HabitReminderSetting[]> {
  const user = await getAuthUser()
  if (!user) return []

  const supabase = await createClient()
  const { data: plants, error: plantsError } = await supabase
    .from('plants')
    .select(`
      id,
      name,
      habit_description,
      why_i_started,
      reminder_enabled,
      reminder_time,
      status,
      plant_type:plant_types(icon)
    `)
    .eq('user_id', user.id)
    .neq('status', 'dead')
    .order('created_at', { ascending: true })

  if (plantsError) {
    console.error('Unable to load habit reminder settings:', plantsError)
    return []
  }

  const plantIds = (plants ?? []).map(plant => plant.id)
  if (plantIds.length === 0) return []

  const [goalMap, assignmentsResult] = await Promise.all([
    getGoalsForPlants(plantIds),
    supabase
      .from('plant_capability_assignments')
      .select('plant_id, habit_id')
      .eq('user_id', user.id)
      .in('plant_id', plantIds),
  ])

  if (assignmentsResult.error) {
    console.error('Unable to load reminder capability assignments:', assignmentsResult.error)
  }

  const assignments = assignmentsResult.data ?? []
  const habitIds = assignments.map(assignment => assignment.habit_id)
  const [habitsResult, growthResult] = habitIds.length > 0
    ? await Promise.all([
      supabase
        .from('habits')
        .select('id, unit, custom_unit, is_active')
        .eq('user_id', user.id)
        .is('archived_at', null)
        .in('id', habitIds),
      supabase
        .from('growth_states')
        .select('habit_id, current_target')
        .eq('user_id', user.id)
        .in('habit_id', habitIds),
    ])
    : [{ data: [], error: null }, { data: [], error: null }]

  if (habitsResult.error) {
    console.error('Unable to load reminder capabilities:', habitsResult.error)
  }
  if (growthResult.error) {
    console.error('Unable to load reminder capability goals:', growthResult.error)
  }

  const assignmentByPlant = new Map(
    assignments.map(assignment => [assignment.plant_id, assignment.habit_id])
  )
  const habitById = new Map((habitsResult.data ?? []).map(habit => [habit.id, habit]))
  const growthByHabit = new Map(
    (growthResult.data ?? []).map(growth => [growth.habit_id, Number(growth.current_target)])
  )

  return (plants ?? []).map(plant => {
    const goal = goalMap.get(plant.id)
    const habitId = assignmentByPlant.get(plant.id)
    const habit = habitId ? habitById.get(habitId) : null
    const capabilityTarget = habitId ? growthByHabit.get(habitId) : null
    const plantType = plant.plant_type as { icon?: string } | null

    return {
      plantId: plant.id,
      plantName: plant.name,
      plantIcon: plantType?.icon || '🌱',
      motivation: plant.why_i_started || plant.habit_description,
      enabled: Boolean(plant.reminder_enabled && plant.reminder_time),
      time: normalizeReminderTime(plant.reminder_time),
      goal: goal
        ? {
          source: 'goal' as const,
          target: goal.currentPeriodTarget,
          progress: goal.periodProgress,
          unit: goal.unit,
          periodLabel: goal.frequency === 'daily'
            ? 'hôm nay'
            : goal.frequency === 'monthly'
              ? 'tháng này'
              : 'tuần này',
        }
        : habit && habit.is_active && capabilityTarget
          ? {
            source: 'capability' as const,
            target: capabilityTarget,
            progress: 0,
            unit: getCapabilityUnit(habit.unit, habit.custom_unit),
            periodLabel: 'hôm nay',
          }
          : null,
    }
  })
}

export async function getDailyReminderEnabled(): Promise<boolean> {
  const user = await getAuthUser()
  if (!user) return false

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('daily_reminder_enabled')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Unable to load the daily reminder switch:', error)
    return false
  }

  return data?.daily_reminder_enabled ?? false
}

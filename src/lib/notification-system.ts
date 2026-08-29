import type { Json } from '@/types/supabase'
import type {
  HabitReminderSetting,
  NotificationInboxItem,
} from '@/types/notifications'

const DEFAULT_REMINDER_TIME = '20:00'
const APP_RELATIVE_HREF_PATTERN = /^\/(?!\/)[^\u0000-\u001F\u007F\\]*$/

export function normalizeReminderTime(value: string | null | undefined): string {
  const match = value?.match(/^(?:[01]\d|2[0-3]):[0-5]\d/)
  return match?.[0] ?? DEFAULT_REMINDER_TIME
}

export function isReminderStillDueToday(
  reminderTime: string,
  referenceDate = new Date()
): boolean {
  const [hour, minute] = normalizeReminderTime(reminderTime).split(':').map(Number)
  const scheduledAt = new Date(referenceDate)
  scheduledAt.setHours(hour, minute, 0, 0)
  return referenceDate.getTime() < scheduledAt.getTime()
}

export function formatGoalValue(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 1,
  }).format(value)
}

export function buildHabitReminderCopy(setting: HabitReminderSetting): {
  title: string
  body: string
} {
  if (setting.goal) {
    const target = formatGoalValue(setting.goal.target)
    const period = setting.goal.periodLabel.trim().toLocaleLowerCase('vi-VN')
    return {
      title: `Đến giờ chăm ${setting.plantName}`,
      body: `Mục tiêu ${period}: ${target} ${setting.goal.unit}. Một bước nhỏ vẫn làm khu vườn đổi khác.`,
    }
  }

  return {
    title: `Đến giờ chăm ${setting.plantName}`,
    body: setting.motivation || 'Một bước nhỏ là đủ để giữ nhịp hôm nay.',
  }
}

export function getNotificationCopy(notification: NotificationInboxItem): {
  title: string
  body: string
} {
  return {
    title: notification.titleVi || notification.title,
    body: notification.messageVi || notification.message,
  }
}

export function getNotificationHref(data: Json | null): string | null {
  if (!data || Array.isArray(data) || typeof data !== 'object') return null
  const href = data.href
  return typeof href === 'string' && APP_RELATIVE_HREF_PATTERN.test(href)
    ? href
    : null
}

export function getNativeNotificationId(plantId: string, slot = 0): number {
  let hash = 2166136261
  for (const character of `habit-reminder:${plantId}:${slot}`) {
    hash ^= character.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }

  return 100_000 + ((hash >>> 0) % 2_000_000_000)
}

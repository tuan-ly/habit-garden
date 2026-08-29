'use client'

import { Capacitor } from '@capacitor/core'
import type {
  DeviceNotificationPermission,
  HabitReminderSetting,
  NotificationInboxItem,
} from '@/types/notifications'
import {
  buildHabitReminderCopy,
  getNativeNotificationId,
  getNotificationCopy,
  getNotificationHref,
  isReminderStillDueToday,
  normalizeReminderTime,
} from '@/lib/notification-system'

const REMINDER_CHANNEL_ID = 'habit-reminders'
const HABIT_COMPLETED_EVENT = 'habit-garden:habit-completed'

interface HabitCompletedEventDetail {
  plantId: string
}

function getNativeReminderNotification(
  setting: HabitReminderSetting,
  weekday: number,
  hour: number,
  minute: number
) {
  const copy = buildHabitReminderCopy(setting)

  return {
    id: getNativeNotificationId(setting.plantId, weekday),
    title: copy.title,
    body: copy.body,
    channelId: REMINDER_CHANNEL_ID,
    schedule: {
      on: { weekday, hour, minute },
      repeats: true as const,
      allowWhileIdle: true as const,
    },
    extra: {
      habitGardenType: 'habit-reminder',
      plantId: setting.plantId,
      weekday,
      href: `/plant/${setting.plantId}`,
    },
  }
}

export function isNativeNotificationPlatform(): boolean {
  return Capacitor.isNativePlatform()
}

export async function getDeviceNotificationPermission(): Promise<DeviceNotificationPermission> {
  if (isNativeNotificationPlatform()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const permission = await LocalNotifications.checkPermissions()
    return permission.display === 'granted'
      ? 'granted'
      : permission.display === 'denied'
        ? 'denied'
        : 'prompt'
  }

  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return window.Notification.permission === 'default'
    ? 'prompt'
    : window.Notification.permission
}

export async function requestDeviceNotificationPermission(): Promise<DeviceNotificationPermission> {
  if (isNativeNotificationPlatform()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    const permission = await LocalNotifications.requestPermissions()
    return permission.display === 'granted'
      ? 'granted'
      : permission.display === 'denied'
        ? 'denied'
        : 'prompt'
  }

  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  const permission = await window.Notification.requestPermission()
  return permission === 'default' ? 'prompt' : permission
}

export async function syncNativeHabitReminders(
  settings: HabitReminderSetting[],
  globallyEnabled: boolean
): Promise<void> {
  if (!isNativeNotificationPlatform()) return

  const { LocalNotifications } = await import('@capacitor/local-notifications')
  const permission = await LocalNotifications.checkPermissions()
  if (permission.display !== 'granted') return

  if (Capacitor.getPlatform() === 'android') {
    await LocalNotifications.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'Nhắc habit hằng ngày',
      description: 'Nhắc nhẹ về từng habit và mục tiêu trong Habit Garden',
      importance: 3,
      visibility: 0,
      vibration: true,
    })
  }

  const pending = await LocalNotifications.getPending()
  const existingReminderIds = pending.notifications
    .filter(notification => notification.extra?.habitGardenType === 'habit-reminder')
    .map(notification => ({ id: notification.id }))

  if (existingReminderIds.length > 0) {
    await LocalNotifications.cancel({ notifications: existingReminderIds })
  }

  if (!globallyEnabled) return

  const notifications = settings
    .filter(setting => setting.enabled)
    .flatMap(setting => {
      const [hour, minute] = normalizeReminderTime(setting.time).split(':').map(Number)
      return Array.from({ length: 7 }, (_, index) => (
        getNativeReminderNotification(setting, index + 1, hour, minute)
      ))
    })

  if (notifications.length > 0) {
    await LocalNotifications.schedule({ notifications })
  }
}

export function notifyHabitCompletionForReminders(plantId: string): void {
  if (!isNativeNotificationPlatform() || typeof window === 'undefined') return

  window.dispatchEvent(new CustomEvent<HabitCompletedEventDetail>(
    HABIT_COMPLETED_EVENT,
    { detail: { plantId } }
  ))
}

export function bindHabitCompletionReminder(
  onCompleted: (plantId: string) => void
): () => void {
  if (typeof window === 'undefined') return () => undefined

  const handleCompleted = (event: Event) => {
    const detail = (event as CustomEvent<HabitCompletedEventDetail>).detail
    if (typeof detail?.plantId === 'string' && detail.plantId.length > 0) {
      onCompleted(detail.plantId)
    }
  }

  window.addEventListener(HABIT_COMPLETED_EVENT, handleCompleted)
  return () => window.removeEventListener(HABIT_COMPLETED_EVENT, handleCompleted)
}

export async function deferNativeHabitReminderUntilTomorrow(
  setting: HabitReminderSetting
): Promise<void> {
  if (
    !isNativeNotificationPlatform()
    || !setting.enabled
    || !isReminderStillDueToday(setting.time)
  ) return

  const { LocalNotifications } = await import('@capacitor/local-notifications')
  // Capacitor weekdays are Sunday=1 through Saturday=7.
  const todayWeekday = new Date().getDay() + 1
  const notificationId = getNativeNotificationId(setting.plantId, todayWeekday)
  await LocalNotifications.cancel({ notifications: [{ id: notificationId }] })
}

export async function bindNativeNotificationNavigation(): Promise<() => void> {
  if (!isNativeNotificationPlatform()) return () => undefined

  const { LocalNotifications } = await import('@capacitor/local-notifications')
  const handle = await LocalNotifications.addListener(
    'localNotificationActionPerformed',
    event => {
      const href = getNotificationHref(event.notification.extra ?? null)
      if (href) {
        window.location.assign(href)
      }
    }
  )

  return () => {
    void handle.remove()
  }
}

export function showBrowserNotification(notification: NotificationInboxItem): void {
  if (
    isNativeNotificationPlatform()
    || typeof window === 'undefined'
    || !('Notification' in window)
    || window.Notification.permission !== 'granted'
  ) {
    return
  }

  const copy = getNotificationCopy(notification)
  const href = getNotificationHref(notification.data)
  const systemNotification = new window.Notification(copy.title, {
    body: copy.body,
    icon: '/icons/icon-192x192.png',
    tag: notification.id,
    data: { href },
  })

  systemNotification.onclick = () => {
    window.focus()
    if (href) window.location.assign(href)
    systemNotification.close()
  }
}

'use client'

import { Capacitor } from '@capacitor/core'
import {
  registerPushSubscription,
  unregisterPushSubscription,
} from '@/lib/actions/notifications'
import type {
  DeviceNotificationState,
  DeviceNotificationPermission,
  HabitReminderSetting,
  NotificationInboxItem,
  WebPushSubscriptionInput,
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
const WEB_PUSH_PUBLIC_KEY = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY?.trim() ?? ''
const SERVICE_WORKER_READY_TIMEOUT_MS = 10_000

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

function isWebPushSupported(): boolean {
  return typeof window !== 'undefined'
    && window.isSecureContext
    && 'Notification' in window
    && 'serviceWorker' in navigator
    && 'PushManager' in window
}

function urlBase64ToArrayBuffer(value: string): ArrayBuffer {
  const padding = '='.repeat((4 - (value.length % 4)) % 4)
  const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/')
  const decoded = window.atob(base64)
  const bytes = new Uint8Array(decoded.length)
  for (let index = 0; index < decoded.length; index += 1) {
    bytes[index] = decoded.charCodeAt(index)
  }
  return bytes.buffer
}

async function getWebPushRegistration(
  registerWhenMissing: boolean
): Promise<ServiceWorkerRegistration | null> {
  if (!isWebPushSupported()) return null
  if (process.env.NODE_ENV !== 'production') return null

  const existing = await navigator.serviceWorker.getRegistration('/')
  if (existing?.active) return existing
  if (!existing && !registerWhenMissing) return null

  if (!existing) {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  }

  // iOS may expose a registration while its worker is still installing. Wait
  // for an active worker before touching PushManager, even for an existing one.
  let timeoutId: number | undefined
  const timeout = new Promise<null>(resolve => {
    timeoutId = window.setTimeout(resolve, SERVICE_WORKER_READY_TIMEOUT_MS, null)
  })
  const ready = await Promise.race([navigator.serviceWorker.ready, timeout])
  if (timeoutId !== undefined) window.clearTimeout(timeoutId)
  return ready?.active ? ready : null
}

function toPushSubscriptionInput(
  subscription: PushSubscription
): WebPushSubscriptionInput | null {
  const serialized = subscription.toJSON()
  if (!serialized.endpoint || !serialized.keys?.p256dh || !serialized.keys.auth) return null

  return {
    endpoint: serialized.endpoint,
    expirationTime: subscription.expirationTime,
    keys: {
      p256dh: serialized.keys.p256dh,
      auth: serialized.keys.auth,
    },
  }
}

async function ensureAndroidReminderChannel(): Promise<void> {
  if (!isNativeNotificationPlatform() || Capacitor.getPlatform() !== 'android') return

  const { LocalNotifications } = await import('@capacitor/local-notifications')
  await LocalNotifications.createChannel({
    id: REMINDER_CHANNEL_ID,
    name: 'Nhắc habit hằng ngày',
    description: 'Nhắc nhẹ về từng habit và mục tiêu trong Habit Garden',
    importance: 3,
    visibility: 0,
    vibration: true,
  })
}

export async function getDeviceNotificationState(): Promise<DeviceNotificationState> {
  if (isNativeNotificationPlatform()) {
    const permission = await getDeviceNotificationPermission()
    return {
      permission,
      mode: 'native-local',
      configured: true,
      subscribed: permission === 'granted',
    }
  }

  if (!isWebPushSupported()) {
    return {
      permission: 'unsupported',
      mode: 'unsupported',
      configured: false,
      subscribed: false,
    }
  }

  const permission = window.Notification.permission === 'default'
    ? 'prompt'
    : window.Notification.permission
  const configuredForWebPush = WEB_PUSH_PUBLIC_KEY.length > 0
    && process.env.NODE_ENV === 'production'

  if (!configuredForWebPush) {
    return {
      permission,
      mode: 'web-push',
      configured: false,
      subscribed: false,
      error: 'Web Push chỉ hoạt động trên bản production/PWA, không chạy cùng next dev ở localhost.',
    }
  }

  // Start installation while the settings page is open, before the user taps
  // the permission button. This avoids an iOS cold-launch activation race.
  const registration = await getWebPushRegistration(true)
  const subscription = await registration?.pushManager.getSubscription()

  return {
    permission,
    mode: 'web-push',
    configured: true,
    subscribed: Boolean(subscription),
  }
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

export async function enableDeviceNotifications(): Promise<DeviceNotificationState> {
  if (isNativeNotificationPlatform()) {
    const permission = await requestDeviceNotificationPermission()
    if (permission === 'granted') await ensureAndroidReminderChannel()
    return {
      permission,
      mode: 'native-local',
      configured: true,
      subscribed: permission === 'granted',
    }
  }

  if (!isWebPushSupported()) return getDeviceNotificationState()
  if (!WEB_PUSH_PUBLIC_KEY || process.env.NODE_ENV !== 'production') {
    return {
      permission: window.Notification.permission === 'default'
        ? 'prompt'
        : window.Notification.permission,
      mode: 'web-push',
      configured: false,
      subscribed: false,
      error: process.env.NODE_ENV === 'production'
        ? 'Web Push chưa được cấu hình cho môi trường này.'
        : 'Web Push chỉ hoạt động trên bản production/PWA, không chạy cùng next dev ở localhost.',
    }
  }

  const permission = await window.Notification.requestPermission()
  if (permission !== 'granted') {
    return {
      permission: permission === 'default' ? 'prompt' : permission,
      mode: 'web-push',
      configured: true,
      subscribed: false,
    }
  }

  try {
    const registration = await getWebPushRegistration(true)
    if (!registration) {
      return {
        permission: 'granted',
        mode: 'web-push',
        configured: true,
        subscribed: false,
        error: 'Service Worker đang khởi động. Hãy giữ PWA mở vài giây rồi thử lại.',
      }
    }

    const existing = await registration.pushManager.getSubscription()
    const subscription = existing ?? await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToArrayBuffer(WEB_PUSH_PUBLIC_KEY),
    })
    const input = toPushSubscriptionInput(subscription)
    if (!input) throw new Error('Browser returned an incomplete PushSubscription')

    const result = await registerPushSubscription(input, navigator.userAgent)
    if (!result.success) {
      if (!existing) await subscription.unsubscribe()
      return {
        permission: 'granted',
        mode: 'web-push',
        configured: true,
        subscribed: false,
        error: result.error,
      }
    }

    return {
      permission: 'granted',
      mode: 'web-push',
      configured: true,
      subscribed: true,
    }
  } catch (error) {
    console.error('Unable to enable Web Push:', error)
    const waitingForWorker = error instanceof DOMException
      && error.name === 'InvalidStateError'
    return {
      permission: 'granted',
      mode: 'web-push',
      configured: true,
      subscribed: false,
      error: waitingForWorker
        ? 'Service Worker đang khởi động. Hãy giữ PWA mở vài giây rồi thử lại.'
        : 'Không thể đăng ký Web Push trên thiết bị này.',
    }
  }
}

export async function disableDeviceNotifications(): Promise<DeviceNotificationState> {
  if (isNativeNotificationPlatform()) {
    const permission = await getDeviceNotificationPermission()
    return {
      permission,
      mode: 'native-local',
      configured: true,
      subscribed: permission === 'granted',
      error: 'Quyền native notification được quản lý trong cài đặt hệ điều hành.',
    }
  }

  const state = await getDeviceNotificationState()
  if (state.mode !== 'web-push') return state

  const registration = await getWebPushRegistration(false)
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return { ...state, subscribed: false }

  const result = await unregisterPushSubscription(subscription.endpoint)
  if (!result.success) return { ...state, error: result.error }

  const unsubscribed = await subscription.unsubscribe()
  return {
    ...state,
    subscribed: !unsubscribed,
    error: unsubscribed ? undefined : 'Trình duyệt chưa gỡ được Web Push subscription.',
  }
}

export async function showDeviceNotificationPreview(): Promise<boolean> {
  const state = await getDeviceNotificationState()
  if (state.permission !== 'granted') return false

  if (state.mode === 'native-local') {
    const { LocalNotifications } = await import('@capacitor/local-notifications')
    await ensureAndroidReminderChannel()
    await LocalNotifications.schedule({
      notifications: [{
        id: 2_000_000_001,
        title: 'Habit Garden đã sẵn sàng',
        body: 'Thiết bị này có thể nhắc bạn chăm habit đúng giờ.',
        channelId: REMINDER_CHANNEL_ID,
        schedule: { at: new Date(Date.now() + 1_000) },
        extra: { href: '/garden' },
      }],
    })
    return true
  }

  const registration = await getWebPushRegistration(false)
  if (!registration) return false
  await registration.showNotification('Habit Garden đã sẵn sàng', {
    body: 'Thiết bị này có thể nhận lời nhắc ngay cả khi trang đã đóng.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'habit-garden-device-preview',
    data: { url: '/garden' },
  })
  return true
}

export async function syncNativeHabitReminders(
  settings: HabitReminderSetting[],
  globallyEnabled: boolean
): Promise<void> {
  if (!isNativeNotificationPlatform()) return

  const { LocalNotifications } = await import('@capacitor/local-notifications')
  const permission = await LocalNotifications.checkPermissions()
  if (permission.display !== 'granted') return

  await ensureAndroidReminderChannel()

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

export async function showBrowserNotification(notification: NotificationInboxItem): Promise<void> {
  if (
    isNativeNotificationPlatform()
    || typeof window === 'undefined'
    || !('Notification' in window)
    || window.Notification.permission !== 'granted'
  ) {
    return
  }

  const state = await getDeviceNotificationState()
  if (state.mode === 'web-push' && state.subscribed) return

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

import type { Json } from '@/types/supabase'

export type DeviceNotificationPermission =
  | 'granted'
  | 'denied'
  | 'prompt'
  | 'unsupported'

export type DeviceNotificationMode =
  | 'native-local'
  | 'web-push'
  | 'unsupported'

export interface DeviceNotificationState {
  permission: DeviceNotificationPermission
  mode: DeviceNotificationMode
  configured: boolean
  subscribed: boolean
  error?: string
}

export interface WebPushSubscriptionInput {
  endpoint: string
  expirationTime: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

export interface NotificationInboxItem {
  id: string
  type: string
  title: string
  titleVi: string | null
  message: string
  messageVi: string | null
  data: Json | null
  read: boolean
  createdAt: string
}

export interface HabitReminderGoalSummary {
  source: 'goal' | 'capability'
  target: number
  progress: number
  unit: string
  periodLabel: string
}

export interface HabitReminderSetting {
  plantId: string
  plantName: string
  plantIcon: string
  motivation: string | null
  enabled: boolean
  time: string
  goal: HabitReminderGoalSummary | null
}

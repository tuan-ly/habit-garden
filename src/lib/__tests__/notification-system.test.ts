import { describe, expect, it } from 'vitest'
import {
  buildHabitReminderCopy,
  getNativeNotificationId,
  getNotificationHref,
  isReminderStillDueToday,
  normalizeReminderTime,
} from '@/lib/notification-system'
import type { HabitReminderSetting } from '@/types/notifications'

const reminder: HabitReminderSetting = {
  plantId: '11111111-1111-4111-8111-111111111111',
  plantName: 'Chạy bộ sáng',
  plantIcon: '🌻',
  motivation: 'Mình muốn bắt đầu ngày mới với nhiều năng lượng.',
  enabled: true,
  time: '06:30',
  goal: null,
}

describe('daily habit notification helpers', () => {
  it('normalizes database time values and falls back to a gentle evening default', () => {
    expect(normalizeReminderTime('06:30:00')).toBe('06:30')
    expect(normalizeReminderTime('23:55')).toBe('23:55')
    expect(normalizeReminderTime(null)).toBe('20:00')
    expect(normalizeReminderTime('not-a-time')).toBe('20:00')
  })

  it('uses motivation for simple habits and the current target for goal habits', () => {
    expect(buildHabitReminderCopy(reminder)).toEqual({
      title: 'Đến giờ chăm Chạy bộ sáng',
      body: 'Mình muốn bắt đầu ngày mới với nhiều năng lượng.',
    })

    expect(buildHabitReminderCopy({
      ...reminder,
      goal: {
        source: 'goal',
        target: 30,
        progress: 0,
        unit: 'phút',
        periodLabel: 'hôm nay',
      },
    })).toEqual({
      title: 'Đến giờ chăm Chạy bộ sáng',
      body: 'Mục tiêu hôm nay: 30 phút. Một bước nhỏ vẫn làm khu vườn đổi khác.',
    })
  })

  it('accepts only app-relative notification links', () => {
    expect(getNotificationHref({ href: '/plant/plant-1' })).toBe('/plant/plant-1')
    expect(getNotificationHref({ href: 'https://example.com' })).toBeNull()
    expect(getNotificationHref({ href: '//example.com' })).toBeNull()
    expect(getNotificationHref({ href: '/\\example.com' })).toBeNull()
    expect(getNotificationHref(['/plant/plant-1'])).toBeNull()
  })

  it('creates stable positive native notification ids per plant', () => {
    const id = getNativeNotificationId(reminder.plantId)
    expect(id).toBe(getNativeNotificationId(reminder.plantId))
    expect(id).toBeGreaterThanOrEqual(100_000)
    expect(id).toBeLessThanOrEqual(2_000_100_000)
    expect(id).not.toBe(getNativeNotificationId('22222222-2222-4222-8222-222222222222'))
    expect(id).not.toBe(getNativeNotificationId(reminder.plantId, 2))
  })

  it('cancels only a reminder that has not fired yet today', () => {
    const morning = new Date(2026, 7, 24, 9, 0, 0)
    expect(isReminderStillDueToday('09:05', morning)).toBe(true)
    expect(isReminderStillDueToday('09:00', morning)).toBe(false)
    expect(isReminderStillDueToday('08:55', morning)).toBe(false)
  })
})

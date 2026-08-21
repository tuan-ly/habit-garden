import { READING_HABIT_TEMPLATE } from '@/lib/habit-growth'
import type { CapabilityManifest } from '@/capabilities/core/types'

export interface ReadingCapabilityConfig extends Record<string, unknown> {
  startTarget: number
  endTarget: number
  incrementValue: number
  reviewPeriodDays: number
  performanceThreshold: number
  timeframeWeeks: number
}

export const READING_CAPABILITY_MANIFEST = {
  key: 'reading',
  version: 1,
  label: 'Đọc sâu hơn',
  shortLabel: 'Đọc',
  description: 'Mục tiêu theo trang, phiên tập trung và nhật ký riêng cho cây.',
  outcome: 'Biến việc đọc thành một hành trình dịu dàng, có nhịp và nhìn thấy được.',
  icon: 'book-open',
  tone: 'canopy',
  eligibility: {
    mode: 'explicit_match',
    domain: 'reading',
    confirmationTitle: 'Cây này đại diện cho việc đọc?',
    confirmationDescription:
      'Hành trình đọc nên đồng hành với một cây dành cho việc đọc, không thêm việc đọc vào một thói quen khác.',
  },
  sessionModel: 'guided',
  highlights: [
    {
      icon: 'gentle-growth',
      title: '5 trang để bắt đầu',
      description: 'Cây tăng nhịp từ từ, không phạt ngày bỏ lỡ.',
    },
    {
      icon: 'session',
      title: 'Phiên đọc 30 phút',
      description: 'Tạm dừng, tiếp tục và ghi lại điều đáng nhớ.',
    },
  ],
  defaults: {
    name: READING_HABIT_TEMPLATE.name,
    description: READING_HABIT_TEMPLATE.description,
    unit: READING_HABIT_TEMPLATE.unit,
    customUnit: null,
    sessionDurationMinutes: READING_HABIT_TEMPLATE.sessionDurationMinutes,
    config: {
      startTarget: READING_HABIT_TEMPLATE.startTarget,
      endTarget: READING_HABIT_TEMPLATE.endTarget,
      incrementValue: READING_HABIT_TEMPLATE.incrementValue,
      reviewPeriodDays: READING_HABIT_TEMPLATE.reviewPeriodDays,
      performanceThreshold: READING_HABIT_TEMPLATE.performanceThreshold,
      timeframeWeeks: READING_HABIT_TEMPLATE.timeframeWeeks,
    },
  },
} satisfies CapabilityManifest<ReadingCapabilityConfig>

import { describe, it, expect } from 'vitest'
import { XP_VALUES, isMorningTime } from '../xp-constants'

// ============================================
// Watering XP Rules Tests
// ============================================
// These tests codify the watering XP rules:
// - "Just checking in" (watering) → 0 base XP, note bonus only
// - "I did it" (completed/progress) → WATERING_BASE + morning bonus if first of day
// - Note bonus applies to all activity types

/**
 * Simulate the XP calculation logic from activity.ts logActivity()
 * to test the rules without hitting Supabase.
 */
function calculateActivityXp(params: {
  activityType: 'watering' | 'completed' | 'progress'
  isFirstActivityToday: boolean
  isMorning: boolean
  noteLength: number
  journalStreak: number
  isPersonalRecord?: boolean
}): number {
  let totalXp = 0

  if (params.activityType === 'completed' || params.activityType === 'progress') {
    if (params.isFirstActivityToday) {
      totalXp += XP_VALUES.WATERING_BASE
      if (params.isMorning) {
        totalXp += XP_VALUES.MORNING_BONUS
      }
    }
    if (params.activityType === 'progress' && params.isPersonalRecord) {
      totalXp += XP_VALUES.PERSONAL_RECORD_BONUS
    }
  } else if (params.activityType === 'watering') {
    // "Just checking in" / "Not today" — no base XP
  }

  // Note bonus
  if (params.noteLength > 0) {
    totalXp += XP_VALUES.NOTE_ANY
    if (params.noteLength > 50) totalXp += XP_VALUES.NOTE_LONG
    if (params.noteLength > 100) totalXp += XP_VALUES.NOTE_VERY_LONG
  }

  return totalXp
}

describe('Watering XP Rules', () => {
  describe('"Just checking in" (activity_type = watering)', () => {
    it('awards 0 base XP without notes', () => {
      const xp = calculateActivityXp({
        activityType: 'watering',
        isFirstActivityToday: true,
        isMorning: false,
        noteLength: 0,
        journalStreak: 0,
      })
      expect(xp).toBe(0)
    })

    it('awards only note bonus with a short note', () => {
      const xp = calculateActivityXp({
        activityType: 'watering',
        isFirstActivityToday: true,
        isMorning: false,
        noteLength: 20,
        journalStreak: 0,
      })
      expect(xp).toBe(XP_VALUES.NOTE_ANY) // 3 XP
    })

    it('awards note + thoughtful bonus with 60-char note', () => {
      const xp = calculateActivityXp({
        activityType: 'watering',
        isFirstActivityToday: true,
        isMorning: false,
        noteLength: 60,
        journalStreak: 0,
      })
      expect(xp).toBe(XP_VALUES.NOTE_ANY + XP_VALUES.NOTE_LONG) // 5 XP
    })

    it('awards full note bonus with 120-char note', () => {
      const xp = calculateActivityXp({
        activityType: 'watering',
        isFirstActivityToday: true,
        isMorning: false,
        noteLength: 120,
        journalStreak: 0,
      })
      expect(xp).toBe(XP_VALUES.NOTE_ANY + XP_VALUES.NOTE_LONG + XP_VALUES.NOTE_VERY_LONG) // 7 XP
    })

    it('awards 0 XP even in morning without notes', () => {
      const xp = calculateActivityXp({
        activityType: 'watering',
        isFirstActivityToday: true,
        isMorning: true,
        noteLength: 0,
        journalStreak: 0,
      })
      expect(xp).toBe(0)
    })

    it('awards 0 base XP even when first activity of day', () => {
      const xp = calculateActivityXp({
        activityType: 'watering',
        isFirstActivityToday: true,
        isMorning: false,
        noteLength: 0,
        journalStreak: 0,
      })
      expect(xp).toBe(0)
    })
  })

  describe('"I did it" (activity_type = completed)', () => {
    it('awards base XP on first activity of day', () => {
      const xp = calculateActivityXp({
        activityType: 'completed',
        isFirstActivityToday: true,
        isMorning: false,
        noteLength: 0,
        journalStreak: 0,
      })
      expect(xp).toBe(XP_VALUES.WATERING_BASE) // 10 XP
    })

    it('awards base + morning bonus in morning', () => {
      const xp = calculateActivityXp({
        activityType: 'completed',
        isFirstActivityToday: true,
        isMorning: true,
        noteLength: 0,
        journalStreak: 0,
      })
      expect(xp).toBe(XP_VALUES.WATERING_BASE + XP_VALUES.MORNING_BONUS) // 13 XP
    })

    it('awards 0 base XP on second activity of day', () => {
      const xp = calculateActivityXp({
        activityType: 'completed',
        isFirstActivityToday: false,
        isMorning: false,
        noteLength: 0,
        journalStreak: 0,
      })
      expect(xp).toBe(0)
    })

    it('awards note bonus even on second activity', () => {
      const xp = calculateActivityXp({
        activityType: 'completed',
        isFirstActivityToday: false,
        isMorning: false,
        noteLength: 30,
        journalStreak: 0,
      })
      expect(xp).toBe(XP_VALUES.NOTE_ANY) // 3 XP
    })

    it('stacks base + morning + full note bonus', () => {
      const xp = calculateActivityXp({
        activityType: 'completed',
        isFirstActivityToday: true,
        isMorning: true,
        noteLength: 120,
        journalStreak: 0,
      })
      const expected = XP_VALUES.WATERING_BASE + XP_VALUES.MORNING_BONUS
        + XP_VALUES.NOTE_ANY + XP_VALUES.NOTE_LONG + XP_VALUES.NOTE_VERY_LONG
      expect(xp).toBe(expected) // 20 XP
    })
  })

  describe('"I did it" with progress (activity_type = progress)', () => {
    it('awards base XP like completed', () => {
      const xp = calculateActivityXp({
        activityType: 'progress',
        isFirstActivityToday: true,
        isMorning: false,
        noteLength: 0,
        journalStreak: 0,
      })
      expect(xp).toBe(XP_VALUES.WATERING_BASE) // 10 XP
    })

    it('awards personal record bonus when applicable', () => {
      const xp = calculateActivityXp({
        activityType: 'progress',
        isFirstActivityToday: true,
        isMorning: false,
        noteLength: 0,
        journalStreak: 0,
        isPersonalRecord: true,
      })
      expect(xp).toBe(XP_VALUES.WATERING_BASE + XP_VALUES.PERSONAL_RECORD_BONUS) // 35 XP
    })

    it('personal record bonus stacks with everything', () => {
      const xp = calculateActivityXp({
        activityType: 'progress',
        isFirstActivityToday: true,
        isMorning: true,
        noteLength: 120,
        journalStreak: 0,
        isPersonalRecord: true,
      })
      const expected = XP_VALUES.WATERING_BASE + XP_VALUES.MORNING_BONUS
        + XP_VALUES.PERSONAL_RECORD_BONUS
        + XP_VALUES.NOTE_ANY + XP_VALUES.NOTE_LONG + XP_VALUES.NOTE_VERY_LONG
      expect(xp).toBe(expected) // 45 XP
    })
  })

  describe('Watering vs Completed XP comparison', () => {
    it('watering always gives less XP than completed (first activity, no notes)', () => {
      const wateringXp = calculateActivityXp({
        activityType: 'watering',
        isFirstActivityToday: true,
        isMorning: false,
        noteLength: 0,
        journalStreak: 0,
      })
      const completedXp = calculateActivityXp({
        activityType: 'completed',
        isFirstActivityToday: true,
        isMorning: false,
        noteLength: 0,
        journalStreak: 0,
      })
      expect(wateringXp).toBeLessThan(completedXp)
      expect(wateringXp).toBe(0)
      expect(completedXp).toBe(10)
    })

    it('watering with notes gives less XP than completed with notes', () => {
      const wateringXp = calculateActivityXp({
        activityType: 'watering',
        isFirstActivityToday: true,
        isMorning: true,
        noteLength: 120,
        journalStreak: 0,
      })
      const completedXp = calculateActivityXp({
        activityType: 'completed',
        isFirstActivityToday: true,
        isMorning: true,
        noteLength: 120,
        journalStreak: 0,
      })
      expect(wateringXp).toBe(7)   // note bonus only
      expect(completedXp).toBe(20) // base + morning + note
      expect(wateringXp).toBeLessThan(completedXp)
    })
  })
})

// ============================================
// XP Constants Integrity
// ============================================

describe('XP Constants', () => {
  it('WATERING_BASE is 10', () => {
    expect(XP_VALUES.WATERING_BASE).toBe(10)
  })

  it('MORNING_BONUS is 3', () => {
    expect(XP_VALUES.MORNING_BONUS).toBe(3)
  })

  it('note bonuses stack correctly: 3 + 2 + 2 = 7 max', () => {
    expect(XP_VALUES.NOTE_ANY + XP_VALUES.NOTE_LONG + XP_VALUES.NOTE_VERY_LONG).toBe(7)
  })

  it('PERSONAL_RECORD_BONUS is 25', () => {
    expect(XP_VALUES.PERSONAL_RECORD_BONUS).toBe(25)
  })
})

// ============================================
// isMorningTime helper
// ============================================

describe('isMorningTime', () => {
  it('returns true for 5am', () => {
    expect(isMorningTime(new Date('2026-03-17T05:00:00'))).toBe(true)
  })

  it('returns true for 8:59am', () => {
    expect(isMorningTime(new Date('2026-03-17T08:59:00'))).toBe(true)
  })

  it('returns false for 9am', () => {
    expect(isMorningTime(new Date('2026-03-17T09:00:00'))).toBe(false)
  })

  it('returns false for 4:59am', () => {
    expect(isMorningTime(new Date('2026-03-17T04:59:00'))).toBe(false)
  })

  it('returns false for afternoon', () => {
    expect(isMorningTime(new Date('2026-03-17T14:00:00'))).toBe(false)
  })
})

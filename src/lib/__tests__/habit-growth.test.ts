import { describe, expect, it } from 'vitest'
import {
  calculateSessionReward,
  evaluateGrowthProgression,
  getHabitPlantStage,
  getSessionElapsedSeconds,
  validateCompletedValue,
} from '@/lib/habit-growth'

const baseInput = {
  currentTarget: 5,
  endTarget: 30,
  incrementValue: 5,
  reviewPeriodDays: 7,
  performanceThreshold: 0.8,
  periodStartedOn: '2026-07-01',
  nextReviewOn: '2026-07-08',
  referenceDate: '2026-07-08',
}

describe('habit growth progression', () => {
  it('does not evaluate before the configured review date', () => {
    const result = evaluateGrowthProgression({
      ...baseInput,
      referenceDate: '2026-07-07',
      progress: Array.from({ length: 7 }, (_, index) => ({
        date: `2026-07-0${index + 1}`,
        completedValue: 5,
        targetValue: 5,
      })),
    })

    expect(result.action).toBe('not_due')
    expect(result.nextTarget).toBe(5)
    expect(result.historyEntry).toBeNull()
  })

  it('advances one configured increment when the threshold is met', () => {
    const result = evaluateGrowthProgression({
      ...baseInput,
      progress: Array.from({ length: 6 }, (_, index) => ({
        date: `2026-07-0${index + 1}`,
        completedValue: 5,
        targetValue: 5,
      })),
    })

    expect(result.consistency).toBeCloseTo(6 / 7)
    expect(result.action).toBe('advanced')
    expect(result.nextTarget).toBe(10)
    expect(result.followingTarget).toBe(15)
    expect(result.historyEntry?.reason).toBe('threshold_met')
  })

  it('gently holds the target after missed days and records why', () => {
    const result = evaluateGrowthProgression({
      ...baseInput,
      progress: Array.from({ length: 5 }, (_, index) => ({
        date: `2026-07-0${index + 1}`,
        completedValue: 5,
        targetValue: 5,
      })),
    })

    expect(result.consistency).toBeCloseTo(5 / 7)
    expect(result.action).toBe('held')
    expect(result.nextTarget).toBe(5)
    expect(result.historyEntry).toMatchObject({
      action: 'held',
      reason: 'threshold_not_met',
      successful_days: 5,
    })
  })

  it('caps progression at the configured end target', () => {
    const result = evaluateGrowthProgression({
      ...baseInput,
      currentTarget: 28,
      progress: Array.from({ length: 7 }, (_, index) => ({
        date: `2026-07-0${index + 1}`,
        completedValue: 28,
        targetValue: 28,
      })),
    })

    expect(result.action).toBe('completed')
    expect(result.nextTarget).toBe(30)
    expect(result.followingTarget).toBeNull()
  })

  it('uses persisted timestamps to restore running elapsed time', () => {
    expect(getSessionElapsedSeconds(
      120,
      'running',
      '2026-07-28T01:00:00.000Z',
      new Date('2026-07-28T01:05:15.000Z')
    )).toBe(435)
    expect(getSessionElapsedSeconds(120, 'paused', null)).toBe(120)
  })

  it('validates reading results and calculates deterministic rewards/stages', () => {
    expect(validateCompletedValue(0)).toContain('ít nhất 1')
    expect(validateCompletedValue(2.5)).toContain('số nguyên')
    expect(validateCompletedValue(25)).toBeNull()
    expect(calculateSessionReward(4, 5)).toBe(5)
    expect(calculateSessionReward(5, 5)).toBe(8)
    expect(getHabitPlantStage(9)).toBe('seed')
    expect(getHabitPlantStage(10)).toBe('sprout')
    expect(getHabitPlantStage(160)).toBe('mature')
  })
})

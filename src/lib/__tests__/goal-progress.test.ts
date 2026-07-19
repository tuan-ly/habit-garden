import { describe, expect, it } from 'vitest'
import {
  applyGoalLogToPeriod,
  formatGoalValue,
  getGoalLogCopy,
  getPeriodContext,
  getRemainingGoalValue,
} from '@/lib/goal-progress'

describe('goal progress helpers', () => {
  it('accumulates logs for total progress goals', () => {
    expect(applyGoalLogToPeriod('total_progress', 3, 2.5)).toBe(5.5)
  })

  it('keeps the best result for build capacity goals', () => {
    expect(applyGoalLogToPeriod('build_capacity', 4, 3)).toBe(4)
    expect(applyGoalLogToPeriod('build_capacity', 4, 6.2)).toBe(6.2)
  })

  it('never returns a negative remaining value', () => {
    expect(getRemainingGoalValue(3.2, 5)).toBe(1.8)
    expect(getRemainingGoalValue(7, 5)).toBe(0)
  })

  it('uses intent-based copy for each goal mode', () => {
    expect(getGoalLogCopy('total_progress', 'km')).toEqual({
      label: 'How much did you add today?',
      hint: 'This amount will be added to your current period total in km.',
    })
    expect(getGoalLogCopy('build_capacity', 'km')).toEqual({
      label: 'What was your best result today?',
      hint: 'Enter your strongest single effort in km.',
    })
  })

  it('formats values and period labels for user feedback', () => {
    expect(formatGoalValue(2.04)).toBe('2')
    expect(formatGoalValue(2.06)).toBe('2.1')
    expect(getPeriodContext('Week 3')).toBe('this week')
    expect(getPeriodContext('Day 4')).toBe('today')
  })
})

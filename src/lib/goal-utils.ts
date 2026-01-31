// Goal utility functions (pure functions, no server actions)

import type { Goal, GoalFrequency } from '@/types/database'

// Helper: Get period info based on frequency
export function getPeriodInfo(goal: Goal, referenceDate: Date = new Date()) {
  const startDate = new Date(goal.started_at)
  const daysSinceStart = Math.floor((referenceDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const frequency = (goal.frequency || 'weekly') as GoalFrequency

  let periodNumber: number
  let periodStart: Date
  let periodEnd: Date
  let periodLabel: string
  let totalPeriods: number

  if (frequency === 'daily') {
    periodNumber = Math.max(1, daysSinceStart + 1)
    periodStart = new Date(referenceDate)
    periodStart.setHours(0, 0, 0, 0)
    periodEnd = new Date(periodStart)
    periodEnd.setHours(23, 59, 59, 999)
    periodLabel = `Day ${periodNumber}`
    totalPeriods = goal.duration_weeks * 7
  } else if (frequency === 'monthly') {
    // Calculate months since start
    const monthsDiff = (referenceDate.getFullYear() - startDate.getFullYear()) * 12 +
                       (referenceDate.getMonth() - startDate.getMonth())
    periodNumber = Math.max(1, monthsDiff + 1)
    periodStart = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1)
    periodEnd = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0, 23, 59, 59, 999)
    periodLabel = referenceDate.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })
    totalPeriods = Math.ceil(goal.duration_weeks / 4)
  } else {
    // Weekly (default)
    periodNumber = Math.max(1, Math.floor(daysSinceStart / 7) + 1)
    periodStart = new Date(startDate)
    periodStart.setDate(startDate.getDate() + (periodNumber - 1) * 7)
    periodEnd = new Date(periodStart)
    periodEnd.setDate(periodStart.getDate() + 6)
    periodEnd.setHours(23, 59, 59, 999)
    periodLabel = `Week ${periodNumber}`
    totalPeriods = goal.duration_weeks
  }

  const periodDateRange = frequency === 'daily'
    ? referenceDate.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })
    : `${periodStart.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })} - ${periodEnd.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short' })}`

  return {
    periodNumber,
    periodStart,
    periodEnd,
    periodLabel,
    periodDateRange,
    totalPeriods,
    frequency,
  }
}

// Helper: Get target for a specific period
export function getPeriodTarget(goal: Goal, periodNumber: number): number {
  const weeklyTargets = goal.weekly_targets as number[] || []
  const frequency = (goal.frequency || 'weekly') as GoalFrequency

  if (frequency === 'daily') {
    // Daily targets come from weekly targets divided by 7 or use progression
    const weekNumber = Math.ceil(periodNumber / 7)
    const weekTarget = weeklyTargets[Math.min(weekNumber - 1, weeklyTargets.length - 1)] || goal.target_value
    // For build_capacity, daily target = weekly target (same each day)
    // For total_progress, daily target = weekly target / 7
    return goal.goal_mode === 'build_capacity' ? weekTarget : Math.round((weekTarget / 7) * 10) / 10
  } else if (frequency === 'monthly') {
    // Monthly targets = 4 weeks combined
    const startWeek = (periodNumber - 1) * 4
    let monthTarget = 0
    for (let i = 0; i < 4; i++) {
      const weekIdx = Math.min(startWeek + i, weeklyTargets.length - 1)
      monthTarget += weeklyTargets[weekIdx] || goal.target_value
    }
    return goal.goal_mode === 'build_capacity'
      ? weeklyTargets[Math.min(startWeek + 3, weeklyTargets.length - 1)] || goal.target_value
      : monthTarget
  } else {
    // Weekly
    return weeklyTargets[Math.min(periodNumber - 1, weeklyTargets.length - 1)] || goal.target_value
  }
}

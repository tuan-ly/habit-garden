// Adaptive Goals Analysis Utilities
// These are pure functions that can be used on both client and server

import type { Goal, GoalLog, AdjustmentType } from '@/types/database'

// Performance score thresholds
export const PERFORMANCE_THRESHOLDS = {
  EXCEPTIONAL: 130,
  EXCEEDING: 110,
  ON_TRACK_HIGH: 100,
  ON_TRACK_LOW: 90,
  BELOW: 70,
  STRUGGLING: 50,
  CRITICAL: 0,
} as const

// Performance categories
export type PerformanceCategory =
  | 'exceptional'
  | 'exceeding'
  | 'on_track'
  | 'below'
  | 'struggling'
  | 'critical'

// Trend directions
export type TrendDirection = 'upward' | 'downward' | 'stable' | 'volatile'

// Trigger types
export type TriggerType = 'increase' | 'decrease' | 'warning' | 'recovery' | 'none'

export interface WeeklyPerformance {
  weekNumber: number
  target: number
  actual: number
  score: number // percentage
  category: PerformanceCategory
  logsCount: number
}

export interface PerformanceAnalysis {
  weeklyScores: WeeklyPerformance[]
  averageScore: number
  currentCategory: PerformanceCategory
  trend: TrendDirection
  variance: number
  consecutiveAbove110: number
  consecutiveBelow80: number
  missedWeeks: number
}

export interface TriggerResult {
  type: TriggerType
  reason: string
  suggestedAdjustment?: {
    type: AdjustmentType
    percentage?: number
    newTarget?: number
    newDuration?: number
  }
  confidenceScore: number // 0-100
}

export interface AdaptiveSuggestion {
  id: string
  type: AdjustmentType
  title: string
  description: string
  options: SuggestionOption[]
  performanceData: PerformanceAnalysis
  createdAt: Date
}

export interface SuggestionOption {
  id: string
  label: string
  description: string
  isRecommended?: boolean
  changes: {
    field: string
    oldValue: unknown
    newValue: unknown
  }[]
}

/**
 * Calculate performance score for a week
 * Score = (Actual / Target) × 100%
 */
export function calculateWeeklyScore(actual: number, target: number): number {
  if (target <= 0) return 0
  return Math.round((actual / target) * 100)
}

/**
 * Categorize performance based on score
 */
export function categorizePerformance(score: number): PerformanceCategory {
  if (score >= PERFORMANCE_THRESHOLDS.EXCEPTIONAL) return 'exceptional'
  if (score >= PERFORMANCE_THRESHOLDS.EXCEEDING) return 'exceeding'
  if (score >= PERFORMANCE_THRESHOLDS.ON_TRACK_LOW) return 'on_track'
  if (score >= PERFORMANCE_THRESHOLDS.BELOW) return 'below'
  if (score >= PERFORMANCE_THRESHOLDS.STRUGGLING) return 'struggling'
  return 'critical'
}

/**
 * Analyze trend from weekly scores
 */
export function analyzeTrend(weeklyScores: number[]): TrendDirection {
  if (weeklyScores.length < 2) return 'stable'

  // Take last 4 weeks for trend analysis
  const recent = weeklyScores.slice(-4)
  if (recent.length < 2) return 'stable'

  let increasing = 0
  let decreasing = 0

  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i] - recent[i - 1]
    if (diff > 5) increasing++
    else if (diff < -5) decreasing++
  }

  // Check for volatile pattern
  if (increasing > 0 && decreasing > 0) {
    const maxDiff = Math.max(...recent) - Math.min(...recent)
    if (maxDiff > 30) return 'volatile'
    return 'stable'
  }

  if (increasing >= recent.length - 1) return 'upward'
  if (decreasing >= recent.length - 1) return 'downward'

  return 'stable'
}

/**
 * Calculate variance of scores
 */
export function calculateVariance(scores: number[]): number {
  if (scores.length < 2) return 0

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length
  const squaredDiffs = scores.map(score => Math.pow(score - mean, 2))
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / scores.length

  return Math.round(Math.sqrt(variance))
}

/**
 * Analyze goal performance over time
 */
export function analyzePerformance(
  goal: Goal,
  logs: GoalLog[]
): PerformanceAnalysis {
  const weeklyTargets = (goal.weekly_targets || []) as number[]
  const startDate = new Date(goal.started_at)
  const now = new Date()
  const daysSinceStart = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const currentWeek = Math.floor(daysSinceStart / 7) + 1

  // Group logs by week
  const logsByWeek: Map<number, GoalLog[]> = new Map()
  logs.forEach(log => {
    const week = log.week_number || 1
    if (!logsByWeek.has(week)) {
      logsByWeek.set(week, [])
    }
    logsByWeek.get(week)!.push(log)
  })

  // Calculate weekly performance
  const weeklyScores: WeeklyPerformance[] = []
  let consecutiveAbove110 = 0
  let consecutiveBelow80 = 0
  let tempAbove110 = 0
  let tempBelow80 = 0
  let missedWeeks = 0

  for (let week = 1; week < currentWeek; week++) {
    const target = weeklyTargets[week - 1] || goal.target_value / goal.duration_weeks
    const weekLogs = logsByWeek.get(week) || []

    let actual = 0
    if (goal.goal_mode === 'total_progress') {
      actual = weekLogs.reduce((sum, log) => sum + Number(log.value), 0)
    } else {
      actual = weekLogs.length > 0 ? Math.max(...weekLogs.map(l => Number(l.value))) : 0
    }

    const score = calculateWeeklyScore(actual, target)
    const category = categorizePerformance(score)

    weeklyScores.push({
      weekNumber: week,
      target,
      actual,
      score,
      category,
      logsCount: weekLogs.length,
    })

    // Track consecutive weeks
    if (score >= 110) {
      tempAbove110++
      tempBelow80 = 0
    } else if (score < 80) {
      tempBelow80++
      tempAbove110 = 0
    } else {
      tempAbove110 = 0
      tempBelow80 = 0
    }

    consecutiveAbove110 = Math.max(consecutiveAbove110, tempAbove110)
    consecutiveBelow80 = Math.max(consecutiveBelow80, tempBelow80)

    if (weekLogs.length === 0) {
      missedWeeks++
    }
  }

  const scores = weeklyScores.map(w => w.score)
  const averageScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 100

  return {
    weeklyScores,
    averageScore,
    currentCategory: categorizePerformance(averageScore),
    trend: analyzeTrend(scores),
    variance: calculateVariance(scores),
    consecutiveAbove110: tempAbove110,
    consecutiveBelow80: tempBelow80,
    missedWeeks,
  }
}

/**
 * Detect if adjustment should be triggered
 */
export function detectTrigger(analysis: PerformanceAnalysis): TriggerResult {
  const {
    consecutiveAbove110,
    consecutiveBelow80,
    missedWeeks,
    trend,
    averageScore,
    variance,
    weeklyScores,
  } = analysis

  // Valley of Death warning (weeks 2-4)
  const currentWeek = weeklyScores.length + 1
  if (currentWeek >= 2 && currentWeek <= 4 && averageScore < 100) {
    return {
      type: 'warning',
      reason: 'valley_of_death',
      confidenceScore: 60,
    }
  }

  // High variance warning
  if (variance > 25) {
    return {
      type: 'warning',
      reason: 'high_variance',
      confidenceScore: 70,
    }
  }

  // Trigger INCREASE
  // Performance > 110% for 3 consecutive weeks
  if (consecutiveAbove110 >= 3) {
    return {
      type: 'increase',
      reason: 'consistent_exceeding_3_weeks',
      suggestedAdjustment: {
        type: 'increase',
        percentage: 15,
      },
      confidenceScore: 85,
    }
  }

  // Performance > 130% for 2 consecutive weeks
  const lastTwo = weeklyScores.slice(-2)
  if (lastTwo.length === 2 && lastTwo.every(w => w.score >= 130)) {
    return {
      type: 'increase',
      reason: 'exceptional_2_weeks',
      suggestedAdjustment: {
        type: 'increase',
        percentage: 20,
      },
      confidenceScore: 90,
    }
  }

  // Trigger DECREASE
  // Performance < 80% for 3 consecutive weeks
  if (consecutiveBelow80 >= 3) {
    return {
      type: 'decrease',
      reason: 'struggling_3_weeks',
      suggestedAdjustment: {
        type: 'decrease',
        percentage: 15,
      },
      confidenceScore: 80,
    }
  }

  // Missed 2 weeks completely
  if (missedWeeks >= 2) {
    return {
      type: 'recovery',
      reason: 'missed_weeks',
      suggestedAdjustment: {
        type: 'recovery_week',
      },
      confidenceScore: 75,
    }
  }

  // Downward trend for 3+ weeks with below performance
  if (trend === 'downward' && averageScore < 90) {
    return {
      type: 'decrease',
      reason: 'downward_trend',
      suggestedAdjustment: {
        type: 'decrease',
        percentage: 10,
      },
      confidenceScore: 70,
    }
  }

  // Critical performance - suggest recovery
  if (averageScore < 50) {
    return {
      type: 'recovery',
      reason: 'critical_performance',
      suggestedAdjustment: {
        type: 'recovery_week',
      },
      confidenceScore: 85,
    }
  }

  return {
    type: 'none',
    reason: 'on_track',
    confidenceScore: 100,
  }
}

/**
 * Generate suggestion based on trigger
 */
export function generateSuggestion(
  goal: Goal,
  trigger: TriggerResult,
  analysis: PerformanceAnalysis
): AdaptiveSuggestion | null {
  if (trigger.type === 'none') return null

  const id = `suggestion_${Date.now()}`
  const weeklyTargets = (goal.weekly_targets || []) as number[]
  const currentWeek = analysis.weeklyScores.length + 1
  const currentTarget = weeklyTargets[currentWeek - 1] || goal.target_value

  switch (trigger.type) {
    case 'increase': {
      const increasePercent = trigger.suggestedAdjustment?.percentage || 15
      const newTarget = Math.round(currentTarget * (1 + increasePercent / 100))
      const newFinalTarget = Math.round(Number(goal.target_value) * (1 + increasePercent / 100))
      const reducedWeeks = Math.max(1, Math.round(goal.duration_weeks * (1 - increasePercent / 100)))

      return {
        id,
        type: 'increase',
        title: "You're doing great!",
        description: `Over the past ${analysis.weeklyScores.length} weeks you exceeded your target with an average performance of ${analysis.averageScore}%`,
        options: [
          {
            id: 'increase_target',
            label: 'Increase target',
            description: `Increase target from ${goal.target_value}${goal.unit} to ${newFinalTarget}${goal.unit}`,
            isRecommended: true,
            changes: [
              { field: 'target_value', oldValue: goal.target_value, newValue: newFinalTarget },
            ],
          },
          {
            id: 'shorten_timeline',
            label: 'Finish early',
            description: `Shorten from ${goal.duration_weeks} weeks to ${reducedWeeks} weeks`,
            changes: [
              { field: 'duration_weeks', oldValue: goal.duration_weeks, newValue: reducedWeeks },
            ],
          },
          {
            id: 'keep',
            label: 'Keep as is',
            description: 'Continue with current plan',
            changes: [],
          },
        ],
        performanceData: analysis,
        createdAt: new Date(),
      }
    }

    case 'decrease': {
      const decreasePercent = trigger.suggestedAdjustment?.percentage || 15
      const newTarget = Math.round(currentTarget * (1 - decreasePercent / 100))
      const newFinalTarget = Math.round(Number(goal.target_value) * (1 - decreasePercent / 100))
      const extendedWeeks = Math.round(goal.duration_weeks * (1 + decreasePercent / 100))

      return {
        id,
        type: 'decrease',
        title: 'Adjust your plan?',
        description: `It looks like you've been struggling over the past ${analysis.consecutiveBelow80} weeks. Adjusting is completely normal!`,
        options: [
          {
            id: 'extend_timeline',
            label: 'Extend timeline',
            description: `Increase from ${goal.duration_weeks} to ${extendedWeeks} weeks`,
            isRecommended: trigger.reason === 'downward_trend',
            changes: [
              { field: 'duration_weeks', oldValue: goal.duration_weeks, newValue: extendedWeeks },
            ],
          },
          {
            id: 'reduce_target',
            label: 'Reduce target',
            description: `Reduce from ${goal.target_value}${goal.unit} to ${newFinalTarget}${goal.unit}`,
            isRecommended: trigger.reason === 'struggling_3_weeks',
            changes: [
              { field: 'target_value', oldValue: goal.target_value, newValue: newFinalTarget },
            ],
          },
          {
            id: 'recovery_week',
            label: 'Take recovery week',
            description: 'Next week target reduced by 50%, not counted in trend',
            changes: [
              { field: 'recovery_week', oldValue: false, newValue: true },
            ],
          },
          {
            id: 'keep',
            label: 'Keep as is',
            description: "I'm fine, let's continue!",
            changes: [],
          },
        ],
        performanceData: analysis,
        createdAt: new Date(),
      }
    }

    case 'recovery': {
      return {
        id,
        type: 'recovery_week',
        title: 'Take a break?',
        description: 'Recovery week helps you recover without losing your streak',
        options: [
          {
            id: 'take_recovery',
            label: 'Take recovery week',
            description: 'Next week target reduced by 50%, keeps streak',
            isRecommended: true,
            changes: [
              { field: 'recovery_week', oldValue: false, newValue: true },
            ],
          },
          {
            id: 'keep',
            label: 'Continue normally',
            description: 'I can handle it!',
            changes: [],
          },
        ],
        performanceData: analysis,
        createdAt: new Date(),
      }
    }

    case 'warning': {
      let title = 'Some suggestions'
      let description = ''

      if (trigger.reason === 'valley_of_death') {
        title = 'Valley of Death'
        description = 'Weeks 2-4 are usually the hardest. Stay strong, you will get through this!'
      } else if (trigger.reason === 'high_variance') {
        title = 'Inconsistent results'
        description = 'Try to maintain consistency for better results'
      }

      return {
        id,
        type: 'decrease', // Using decrease type for warnings
        title,
        description,
        options: [
          {
            id: 'acknowledge',
            label: 'Got it',
            description: 'Thanks for the reminder!',
            changes: [],
          },
        ],
        performanceData: analysis,
        createdAt: new Date(),
      }
    }

    default:
      return null
  }
}

/**
 * Calculate new weekly targets after adjustment
 */
export function recalculateWeeklyTargets(
  goal: Goal,
  adjustment: {
    type: AdjustmentType
    newTargetValue?: number
    newDurationWeeks?: number
    recoveryWeek?: boolean
  }
): number[] {
  const { generateProgressionPlan } = require('@/lib/progression')

  const targetValue = adjustment.newTargetValue ?? goal.target_value
  const durationWeeks = adjustment.newDurationWeeks ?? goal.duration_weeks
  const progressionType = goal.progression_type

  const newTargets = generateProgressionPlan({
    startValue: goal.start_value || 0,
    endValue: targetValue,
    totalWeeks: durationWeeks,
    type: progressionType,
    stepSize: goal.step_size,
  })

  // If recovery week, reduce next week's target by 50%
  if (adjustment.recoveryWeek) {
    const currentWeek = Math.floor(
      (Date.now() - new Date(goal.started_at).getTime()) / (1000 * 60 * 60 * 24 * 7)
    )
    if (newTargets[currentWeek] !== undefined) {
      newTargets[currentWeek] = Math.round(newTargets[currentWeek] * 0.5)
    }
  }

  return newTargets
}

/**
 * Get performance emoji based on category
 */
export function getPerformanceEmoji(category: PerformanceCategory): string {
  switch (category) {
    case 'exceptional': return '🌟'
    case 'exceeding': return '🚀'
    case 'on_track': return '✅'
    case 'below': return '⚠️'
    case 'struggling': return '😟'
    case 'critical': return '🆘'
  }
}

/**
 * Get trend emoji
 */
export function getTrendEmoji(trend: TrendDirection): string {
  switch (trend) {
    case 'upward': return '📈'
    case 'downward': return '📉'
    case 'stable': return '➡️'
    case 'volatile': return '📊'
  }
}

/**
 * Format performance score with color class
 */
export function getPerformanceColorClass(score: number): string {
  if (score >= 110) return 'text-green-600'
  if (score >= 90) return 'text-blue-600'
  if (score >= 70) return 'text-yellow-600'
  if (score >= 50) return 'text-orange-600'
  return 'text-red-600'
}

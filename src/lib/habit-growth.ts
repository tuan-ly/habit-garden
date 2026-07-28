import type {
  GrowthHistoryAction,
  GrowthHistoryEntry,
  HabitPlantStage,
} from '@/types/habits'

export const READING_HABIT_TEMPLATE = {
  type: 'reading',
  name: 'Đọc sách mỗi ngày',
  description: 'Một phiên đọc yên tĩnh để nuôi cây tri thức.',
  unit: 'pages',
  sessionDurationMinutes: 30,
  startTarget: 5,
  endTarget: 30,
  timeframeWeeks: 10,
  incrementValue: 5,
  reviewPeriodDays: 7,
  performanceThreshold: 0.8,
} as const

export interface GrowthProgressSample {
  date: string
  completedValue: number
  targetValue: number
}

export interface GrowthEvaluationInput {
  currentTarget: number
  endTarget: number
  incrementValue: number
  reviewPeriodDays: number
  performanceThreshold: number
  periodStartedOn: string
  nextReviewOn: string
  referenceDate: string
  progress: GrowthProgressSample[]
}

export interface GrowthEvaluation {
  due: boolean
  currentTarget: number
  nextTarget: number
  followingTarget: number | null
  consistency: number
  successfulDays: number
  action: GrowthHistoryAction | 'not_due'
  historyEntry: GrowthHistoryEntry | null
  nextReviewOn: string
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function parseIsoDate(value: string): Date {
  if (!ISO_DATE_PATTERN.test(value)) {
    throw new Error(`Expected an ISO date, received "${value}"`)
  }

  const date = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid ISO date "${value}"`)
  }
  return date
}

export function addUtcDays(value: string, days: number): string {
  const date = parseIsoDate(value)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function clampTarget(value: number, endTarget: number): number {
  return Math.min(endTarget, Math.max(0, value))
}

export function getFollowingTarget(
  currentTarget: number,
  endTarget: number,
  incrementValue: number
): number | null {
  if (currentTarget >= endTarget) return null
  return clampTarget(currentTarget + incrementValue, endTarget)
}

export function evaluateGrowthProgression(input: GrowthEvaluationInput): GrowthEvaluation {
  if (input.reviewPeriodDays < 1) {
    throw new Error('reviewPeriodDays must be at least 1')
  }
  if (input.incrementValue <= 0) {
    throw new Error('incrementValue must be greater than 0')
  }
  if (input.performanceThreshold <= 0 || input.performanceThreshold > 1) {
    throw new Error('performanceThreshold must be greater than 0 and at most 1')
  }
  if (input.currentTarget > input.endTarget) {
    throw new Error('currentTarget cannot exceed endTarget')
  }

  const due = parseIsoDate(input.referenceDate) >= parseIsoDate(input.nextReviewOn)
  const followingTarget = getFollowingTarget(
    input.currentTarget,
    input.endTarget,
    input.incrementValue
  )

  if (!due) {
    return {
      due: false,
      currentTarget: input.currentTarget,
      nextTarget: input.currentTarget,
      followingTarget,
      consistency: 0,
      successfulDays: 0,
      action: 'not_due',
      historyEntry: null,
      nextReviewOn: input.nextReviewOn,
    }
  }

  const periodEndedOn = addUtcDays(input.periodStartedOn, input.reviewPeriodDays - 1)
  const successfulDates = new Set(
    input.progress
      .filter((sample) => (
        sample.date >= input.periodStartedOn
        && sample.date <= periodEndedOn
        && sample.completedValue >= sample.targetValue
      ))
      .map((sample) => sample.date)
  )
  const successfulDays = successfulDates.size
  const consistency = successfulDays / input.reviewPeriodDays

  let nextTarget = input.currentTarget
  let action: GrowthHistoryAction = 'held'
  let reason: GrowthHistoryEntry['reason'] = 'threshold_not_met'

  if (input.currentTarget >= input.endTarget) {
    action = 'completed'
    reason = 'end_target_reached'
  } else if (consistency >= input.performanceThreshold) {
    nextTarget = getFollowingTarget(
      input.currentTarget,
      input.endTarget,
      input.incrementValue
    ) ?? input.endTarget
    action = nextTarget >= input.endTarget ? 'completed' : 'advanced'
    reason = nextTarget >= input.endTarget ? 'end_target_reached' : 'threshold_met'
  }

  const historyEntry: GrowthHistoryEntry = {
    reviewed_on: input.referenceDate,
    period_started_on: input.periodStartedOn,
    period_ended_on: periodEndedOn,
    previous_target: input.currentTarget,
    new_target: nextTarget,
    consistency,
    successful_days: successfulDays,
    review_period_days: input.reviewPeriodDays,
    action,
    reason,
  }

  return {
    due: true,
    currentTarget: input.currentTarget,
    nextTarget,
    followingTarget: getFollowingTarget(nextTarget, input.endTarget, input.incrementValue),
    consistency,
    successfulDays,
    action,
    historyEntry,
    nextReviewOn: addUtcDays(input.referenceDate, input.reviewPeriodDays),
  }
}

export function validateCompletedValue(value: number): string | null {
  if (!Number.isFinite(value)) return 'Số trang phải là một con số.'
  if (!Number.isInteger(value)) return 'Số trang phải là số nguyên.'
  if (value < 1) return 'Hãy ghi ít nhất 1 trang đã đọc.'
  if (value > 5000) return 'Số trang tối đa cho một phiên là 5.000.'
  return null
}

export function calculateSessionReward(completedValue: number, targetValue: number): number {
  const targetBonus = completedValue >= targetValue ? 3 : 0
  return 5 + targetBonus
}

export function getHabitPlantStage(totalGrowthPoints: number): HabitPlantStage {
  if (totalGrowthPoints >= 160) return 'mature'
  if (totalGrowthPoints >= 80) return 'blooming'
  if (totalGrowthPoints >= 30) return 'growing'
  if (totalGrowthPoints >= 10) return 'sprout'
  return 'seed'
}

export function getSessionElapsedSeconds(
  accumulatedSeconds: number,
  status: 'running' | 'paused' | 'awaiting_completion' | 'completed' | 'cancelled',
  lastResumedAt: string | null,
  referenceTime: Date = new Date()
): number {
  if (status !== 'running' || !lastResumedAt) {
    return Math.max(0, accumulatedSeconds)
  }

  const runningSeconds = Math.max(
    0,
    Math.floor((referenceTime.getTime() - new Date(lastResumedAt).getTime()) / 1000)
  )
  return Math.max(0, accumulatedSeconds + runningSeconds)
}


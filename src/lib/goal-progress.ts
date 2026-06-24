import type { GoalMode } from '@/types/database'

export function roundGoalValue(value: number): number {
  return Math.round(value * 10) / 10
}

export function applyGoalLogToPeriod(
  goalMode: GoalMode,
  currentProgress: number,
  loggedValue: number
): number {
  const nextProgress = goalMode === 'total_progress'
    ? currentProgress + loggedValue
    : Math.max(currentProgress, loggedValue)

  return roundGoalValue(nextProgress)
}

export function getRemainingGoalValue(progress: number, target: number): number {
  return roundGoalValue(Math.max(0, target - progress))
}

export function formatGoalValue(value: number): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 1,
  }).format(roundGoalValue(value))
}

export function getGoalLogCopy(goalMode: GoalMode, unit: string) {
  const unitLabel = unit.trim()

  if (goalMode === 'build_capacity') {
    return {
      label: 'What was your best result today?',
      hint: unitLabel
        ? `Enter your strongest single effort in ${unitLabel}.`
        : 'Enter your strongest single effort.',
    }
  }

  return {
    label: 'How much did you add today?',
    hint: unitLabel
      ? `This amount will be added to your current period total in ${unitLabel}.`
      : 'This amount will be added to your current period total.',
  }
}

export function getPeriodContext(periodLabel?: string): string {
  const normalized = periodLabel?.trim().toLowerCase()
  if (!normalized) return 'this period'
  if (normalized.startsWith('day')) return 'today'
  if (normalized.startsWith('week')) return 'this week'
  return normalized
}

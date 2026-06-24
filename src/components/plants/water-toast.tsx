'use client'

import { toast } from 'sonner'
import {
  formatGoalValue,
  getPeriodContext,
  getRemainingGoalValue,
} from '@/lib/goal-progress'

interface WaterToastOptions {
  plantName: string
  plantIcon?: string
  xpEarned: number
  xpBreakdown?: Record<string, number>
  streakCount?: number
  newAchievements?: string[]
  onUndo?: () => void
}

/**
 * Custom water toast with game-style feedback.
 * Shows XP earned, streak info, and optional undo button.
 */
export function showWaterToast({
  plantName,
  plantIcon = '🌱',
  xpEarned,
  xpBreakdown,
  streakCount,
  newAchievements,
  onUndo,
}: WaterToastOptions) {
  // Build description
  let description = `Watered ${plantName}`
  if (streakCount && streakCount > 1) {
    description += ` • 🔥 ${streakCount} day streak!`
  }

  // Show achievement if any
  if (newAchievements && newAchievements.length > 0) {
    toast.success(
      <div className="flex items-center gap-3">
        <span className="text-2xl animate-bounce">{plantIcon}</span>
        <div>
          <div className="font-bold text-emerald-400">+{xpEarned} XP</div>
          <div className="text-xs text-slate-400">{description}</div>
        </div>
      </div>,
      {
        description: (
          <div className="flex items-center gap-2 mt-1 text-amber-400">
            <span>🏆</span>
            <span className="font-medium">New: {newAchievements[0]}</span>
          </div>
        ),
        duration: 4000,
        action: onUndo
          ? {
              label: 'Undo',
              onClick: onUndo,
            }
          : undefined,
      }
    )
    return
  }

  // Regular toast
  toast.success(
    <div className="flex items-center gap-3">
      <span className="text-2xl">{plantIcon}</span>
      <div>
        <div className="font-bold text-emerald-400">+{xpEarned} XP</div>
        <div className="text-xs text-slate-400">{description}</div>
      </div>
    </div>,
    {
      duration: 3000,
      action: onUndo
        ? {
            label: 'Undo',
            onClick: onUndo,
          }
        : undefined,
    }
  )
}

/**
 * Toast for when a goal value is logged.
 */
export function showGoalLogToast({
  plantName,
  plantIcon = '📊',
  value,
  unit,
  xpEarned,
  isPersonalRecord,
  periodProgress,
  periodTarget,
  periodLabel,
  consistencyDayAdded = false,
}: {
  plantName: string
  plantIcon?: string
  value: number
  unit: string
  xpEarned: number
  isPersonalRecord?: boolean
  periodProgress?: number
  periodTarget?: number
  periodLabel?: string
  consistencyDayAdded?: boolean
}) {
  const hasPeriodProgress = periodProgress !== undefined
    && periodTarget !== undefined
    && periodTarget > 0
  const remaining = hasPeriodProgress
    ? getRemainingGoalValue(periodProgress, periodTarget)
    : undefined
  const periodContext = getPeriodContext(periodLabel)
  const progressMessage = remaining === undefined
    ? 'Goal progress updated.'
    : remaining === 0
      ? `Target complete ${periodContext}.`
      : `${formatGoalValue(remaining)} ${unit} left ${periodContext}.`
  const consistencyMessage = consistencyDayAdded
    ? 'Your tree gained a consistency day.'
    : 'Your tree already counted today; goal progress still increased.'

  toast.success(
    <div className="flex items-center gap-3">
      <span className="text-2xl">{plantIcon}</span>
      <div>
        <div className="font-bold text-emerald-400">
          Logged {formatGoalValue(value)} {unit}
        </div>
        <div className="text-xs text-slate-400">
          {plantName}{xpEarned > 0 ? ` - +${xpEarned} XP` : ''}
        </div>
      </div>
    </div>,
    {
      description: (
        <div className="mt-1 space-y-1 text-sm">
          <div>{progressMessage}</div>
          <div className="text-xs text-muted-foreground">{consistencyMessage}</div>
          {isPersonalRecord && (
            <div className="font-medium text-amber-500">New personal record.</div>
          )}
        </div>
      ),
      duration: 3500,
    }
  )
}

/**
 * Toast for when watering is already done today.
 */
export function showAlreadyWateredToast(plantName: string) {
  toast.info(
    <div className="flex items-center gap-3">
      <span className="text-2xl">✅</span>
      <div>
        <div className="font-medium">Already watered today</div>
        <div className="text-xs text-slate-400">Come back tomorrow to water {plantName}</div>
      </div>
    </div>,
    {
      duration: 2500,
    }
  )
}

/**
 * Toast for errors.
 */
export function showWaterErrorToast(message: string) {
  toast.error('Failed to water', {
    description: message,
    duration: 4000,
  })
}

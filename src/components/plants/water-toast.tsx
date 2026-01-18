'use client'

import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
  exceededTarget,
}: {
  plantName: string
  plantIcon?: string
  value: number
  unit: string
  xpEarned: number
  isPersonalRecord?: boolean
  exceededTarget?: boolean
}) {
  let bonusText = ''
  if (isPersonalRecord) {
    bonusText = '🏆 Personal Record!'
  } else if (exceededTarget) {
    bonusText = '⭐ Target exceeded!'
  }

  toast.success(
    <div className="flex items-center gap-3">
      <span className="text-2xl">{plantIcon}</span>
      <div>
        <div className="font-bold text-emerald-400">
          +{xpEarned} XP • {value} {unit}
        </div>
        <div className="text-xs text-slate-400">Logged for {plantName}</div>
      </div>
    </div>,
    {
      description: bonusText ? (
        <div className="text-amber-400 text-sm font-medium mt-1">{bonusText}</div>
      ) : undefined,
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

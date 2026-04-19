'use client'

import { cn } from '@/lib/utils'
import type { AchievementDefinition } from '@/lib/achievements'
import { useEffect, useRef, useState } from 'react'

interface AchievementPopupProps {
  achievement: AchievementDefinition | null
  show: boolean
  onClose: () => void
}

export function AchievementPopup({ achievement, show, onClose }: AchievementPopupProps) {
  const [isVisible, setIsVisible] = useState(false)
  // Always call latest onClose — prevents stale-callback bug if parent re-renders mid-timeout
  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (show && achievement) {
      setIsVisible(true)
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onCloseRef.current(), 500)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [show, achievement])

  if (!isVisible || !achievement) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 pointer-events-none">
      <div
        className={cn(
          'bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30',
          'border-2 border-yellow-400 dark:border-yellow-600',
          'rounded-xl shadow-2xl p-6 text-center max-w-sm mx-4',
          'pointer-events-auto cursor-pointer',
          'achievement-popup'
        )}
        onClick={onClose}
      >
        {/* Achievement Icon */}
        <div className="text-5xl mb-3">{achievement.icon}</div>

        {/* Title */}
        <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-400 mb-1">
          Achievement Unlocked!
        </h3>

        {/* Achievement Name */}
        <p className="text-xl font-semibold text-foreground mb-2">{achievement.name}</p>

        {/* Description */}
        <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>

        {/* XP Reward */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-200/50 dark:bg-yellow-800/30 rounded-full">
          <span className="text-yellow-600 dark:text-yellow-400">+{achievement.xpReward} XP</span>
        </div>

        {/* Tier indicator */}
        <div className="mt-3 flex justify-center gap-1">
          {[1, 2, 3, 4].map((t) => (
            <div
              key={t}
              className={cn(
                'w-2 h-2 rounded-full',
                t <= achievement.tier
                  ? 'bg-yellow-500'
                  : 'bg-gray-300 dark:bg-gray-600'
              )}
            />
          ))}
        </div>

        {/* Click to dismiss hint */}
        <p className="text-xs text-muted-foreground mt-3">Click to dismiss</p>
      </div>
    </div>
  )
}

// Achievement queue manager for multiple achievements
interface AchievementQueueProps {
  achievements: AchievementDefinition[]
  onComplete: () => void
}

export function AchievementQueue({ achievements, onComplete }: AchievementQueueProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const handleClose = () => {
    if (currentIndex < achievements.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      onComplete()
    }
  }

  if (achievements.length === 0 || currentIndex >= achievements.length) {
    return null
  }

  return (
    <AchievementPopup
      achievement={achievements[currentIndex]}
      show={true}
      onClose={handleClose}
    />
  )
}

// Mini achievement notification for toast-like display
interface AchievementToastProps {
  achievement: AchievementDefinition
  className?: string
}

export function AchievementToast({ achievement, className }: AchievementToastProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg',
        'bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/30 dark:to-amber-900/30',
        'border border-yellow-300 dark:border-yellow-700',
        className
      )}
    >
      <span className="text-2xl">{achievement.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{achievement.name}</p>
        <p className="text-xs text-muted-foreground truncate">{achievement.description}</p>
      </div>
      <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
        +{achievement.xpReward}
      </span>
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'
import { getLevelInfo, getLevelTitle, getLevelBadge } from '@/lib/xp-system'
import { useEffect, useState } from 'react'

interface XpProgressProps {
  totalXp: number
  previousXp?: number
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
  className?: string
  onLevelUp?: (newLevel: number) => void
}

export function XpProgress({
  totalXp,
  previousXp,
  size = 'md',
  showDetails = true,
  className,
  onLevelUp,
}: XpProgressProps) {
  const [displayXp, setDisplayXp] = useState(previousXp ?? totalXp)
  const [isAnimating, setIsAnimating] = useState(false)
  const [showLevelUp, setShowLevelUp] = useState(false)

  const currentInfo = getLevelInfo(totalXp)
  const previousInfo = previousXp !== undefined ? getLevelInfo(previousXp) : null

  // Animate XP gain
  useEffect(() => {
    if (previousXp !== undefined && totalXp > previousXp) {
      setIsAnimating(true)

      // Animate the XP counter
      const duration = 1000
      const startTime = Date.now()
      const startXp = previousXp

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Easing function
        const eased = 1 - Math.pow(1 - progress, 3)
        const currentXp = Math.round(startXp + (totalXp - startXp) * eased)

        setDisplayXp(currentXp)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)

          // Check for level up
          if (previousInfo && currentInfo.level > previousInfo.level) {
            setShowLevelUp(true)
            onLevelUp?.(currentInfo.level)
            setTimeout(() => setShowLevelUp(false), 3000)
          }
        }
      }

      requestAnimationFrame(animate)
    } else {
      setDisplayXp(totalXp)
    }
  }, [totalXp, previousXp, previousInfo, currentInfo.level, onLevelUp])

  const displayInfo = getLevelInfo(displayXp)

  const sizeClasses = {
    sm: {
      container: 'p-2',
      badge: 'text-xl',
      title: 'text-xs',
      level: 'text-sm',
      bar: 'h-1.5',
      xp: 'text-xs',
    },
    md: {
      container: 'p-3',
      badge: 'text-2xl',
      title: 'text-sm',
      level: 'text-base',
      bar: 'h-2',
      xp: 'text-sm',
    },
    lg: {
      container: 'p-4',
      badge: 'text-3xl',
      title: 'text-base',
      level: 'text-lg',
      bar: 'h-3',
      xp: 'text-base',
    },
  }

  const s = sizeClasses[size]

  return (
    <div className={cn('relative', className)}>
      {/* Level Up Celebration */}
      {showLevelUp && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/80 rounded-lg level-up-effect">
          <div className="text-center">
            <span className="text-4xl block mb-2">{currentInfo.badge}</span>
            <span className="text-xl font-bold text-primary">Level Up!</span>
            <p className="text-sm text-muted-foreground">
              Level {currentInfo.level} - {currentInfo.title}
            </p>
          </div>
        </div>
      )}

      <div className={cn('rounded-lg bg-card border', s.container)}>
        <div className="flex items-center gap-3 mb-2">
          {/* Level Badge */}
          <span className={cn(s.badge, isAnimating && 'animate-bounce')}>
            {displayInfo.badge}
          </span>

          {/* Level Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={cn('font-semibold', s.level)}>
                Level {displayInfo.level}
              </span>
              <span className={cn('text-muted-foreground', s.xp)}>
                {displayInfo.xpInCurrentLevel.toLocaleString()} / {displayInfo.xpToNextLevel.toLocaleString()} XP
              </span>
            </div>
            <p className={cn('text-muted-foreground truncate', s.title)}>
              {displayInfo.title}
            </p>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className={cn('w-full bg-muted rounded-full overflow-hidden', s.bar)}>
          <div
            className={cn(
              'h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-500',
              isAnimating && 'xp-bar-fill'
            )}
            style={{
              width: `${displayInfo.progress}%`,
              '--xp-from': previousInfo ? `${previousInfo.progress}%` : '0%',
              '--xp-to': `${displayInfo.progress}%`,
            } as React.CSSProperties}
          />
        </div>

        {/* Detailed Stats */}
        {showDetails && (
          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Total XP: {displayInfo.totalXp.toLocaleString()}</span>
            <span>Next level: {displayInfo.xpForNextLevel.toLocaleString()} XP</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Compact XP display for headers/navbars
interface XpBadgeProps {
  totalXp: number
  className?: string
}

export function XpBadge({ totalXp, className }: XpBadgeProps) {
  const info = getLevelInfo(totalXp)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-gradient-to-r from-emerald-500/10 to-green-400/10 border border-emerald-500/20',
        className
      )}
    >
      <span className="text-sm">{info.badge}</span>
      <span className="text-xs font-medium">Lv.{info.level}</span>
      <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-green-400"
          style={{ width: `${info.progress}%` }}
        />
      </div>
    </div>
  )
}

// XP Popup for when XP is earned
interface XpGainPopupProps {
  amount: number
  breakdown?: Record<string, number>
  show: boolean
  onComplete?: () => void
}

export function XpGainPopup({ amount, breakdown, show, onComplete }: XpGainPopupProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (show) {
      setVisible(true)
      const timer = setTimeout(() => {
        setVisible(false)
        onComplete?.()
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [show, onComplete])

  if (!visible) return null

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 xp-popup">
      <div className="bg-card border rounded-lg shadow-lg p-4 text-center">
        <span className="text-3xl font-bold text-yellow-500">+{amount} XP</span>

        {breakdown && Object.keys(breakdown).length > 1 && (
          <div className="mt-2 space-y-1 text-xs text-muted-foreground">
            {Object.entries(breakdown).map(([key, value]) => (
              <div key={key} className="flex justify-between gap-4">
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                <span>+{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Level Up Modal
interface LevelUpModalProps {
  level: number
  show: boolean
  onClose: () => void
}

export function LevelUpModal({ level, show, onClose }: LevelUpModalProps) {
  if (!show) return null

  const title = getLevelTitle(level)
  const badge = getLevelBadge(level)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card border rounded-xl shadow-2xl p-8 text-center max-w-sm mx-4 level-up-effect">
        <div className="text-6xl mb-4">{badge}</div>
        <h2 className="text-2xl font-bold text-primary mb-2">Level Up!</h2>
        <p className="text-lg font-semibold mb-1">Level {level}</p>
        <p className="text-muted-foreground mb-6">{title}</p>

        {/* Confetti-like decoration */}
        <div className="flex justify-center gap-2 mb-6">
          {['✨', '🎉', '🌟', '🎊', '✨'].map((emoji, i) => (
            <span
              key={i}
              className="text-xl sparkle"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {emoji}
            </span>
          ))}
        </div>

        <button
          onClick={onClose}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          Continue Growing
        </button>
      </div>
    </div>
  )
}

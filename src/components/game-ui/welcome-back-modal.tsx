'use client'

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { cn } from '@/lib/utils'

interface WelcomeBackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Plants with status 'sleeping' or 'waiting' */
  sleepingPlantCount: number
  /** Days since last visit (>= 3) */
  daysMissed: number
  /** Called when user clicks "Water a plant" CTA */
  onStartWatering: () => void
}

function getEmoji(daysMissed: number): string {
  if (daysMissed >= 31) return '🌿'
  if (daysMissed >= 15) return '✨'
  if (daysMissed >= 8) return '🌙'
  return '💧'
}

function getSubtext(daysMissed: number): string {
  if (daysMissed >= 31) {
    return 'Welcome back. Some gardens wait years for their gardener to return.'
  }
  if (daysMissed >= 15) {
    return "It's been a while. Your garden is still here, still growing in its own way."
  }
  if (daysMissed >= 8) {
    return `You've been away for ${daysMissed} days. Life happens — no judgment.`
  }
  return `It's been ${daysMissed} days. Your plants have been quietly waiting.`
}

export function WelcomeBackModal({
  open,
  onOpenChange,
  sleepingPlantCount,
  daysMissed,
  onStartWatering,
}: WelcomeBackModalProps) {
  const emoji = getEmoji(daysMissed)
  const subtext = getSubtext(daysMissed)

  const handleStartWatering = () => {
    onStartWatering()
    onOpenChange(false)
  }

  const handleJustLooking = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-sm p-0 overflow-hidden',
          'bg-gradient-to-b from-amber-950 to-stone-950',
          'border-2 border-amber-700/40',
          'shadow-2xl shadow-amber-900/30'
        )}
      >
        <VisuallyHidden>
          <DialogTitle>Welcome Back</DialogTitle>
        </VisuallyHidden>

        {/* Warm ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-56 h-24 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative p-6 text-center">
          {/* Central emoji */}
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-amber-800/60 to-stone-800/80 flex items-center justify-center border border-amber-700/30 shadow-xl shadow-amber-900/40">
            <span className="text-4xl">{emoji}</span>
          </div>

          {/* Heading */}
          <h2 className="text-xl font-bold text-amber-100 mb-2">
            Your garden missed you
          </h2>

          {/* Contextual subtext */}
          <p className="text-sm text-amber-300/80 leading-relaxed mb-4">
            {subtext}
          </p>

          {/* Sleeping plants badge */}
          {sleepingPlantCount > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 rounded-full bg-amber-900/50 border border-amber-700/40">
              <span className="text-sm">🌿</span>
              <span className="text-xs font-semibold text-amber-200">
                {sleepingPlantCount} {sleepingPlantCount === 1 ? 'plant' : 'plants'} waiting
              </span>
            </div>
          )}

          {/* XP bonus highlight */}
          <div className="flex items-center justify-center gap-2 mb-5 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-base">💧</span>
            <span className="text-xs font-semibold text-amber-300">
              +25 XP Welcome Back bonus on your first water
            </span>
          </div>

          {/* CTA: Water a plant */}
          <Button
            onClick={handleStartWatering}
            className={cn(
              'w-full py-5 text-sm font-bold mb-2',
              'bg-gradient-to-r from-amber-600 to-amber-700',
              'hover:from-amber-500 hover:to-amber-600',
              'text-amber-50',
              'shadow-lg shadow-amber-900/50',
              'border border-amber-500/30'
            )}
          >
            Water a plant 💧
          </Button>

          {/* Secondary: Just looking */}
          <button
            onClick={handleJustLooking}
            className="text-xs text-amber-500/70 hover:text-amber-400 transition-colors underline underline-offset-2"
          >
            Just looking
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { cn } from '@/lib/utils'
import {
  getLevelUnlocks,
  getGardenSizeName,
  getUserPhase,
  type LevelUnlock,
} from '@/lib/progression-system'
import { Sparkles, Trophy, ChevronRight, Crown, Target, User } from 'lucide-react'
import { useSubscription } from '@/lib/context'
import type { UpgradeTrigger } from '@/lib/subscription-limits'

interface LevelUpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newLevel: number
  oldLevel?: number
}

// Feature unlock triggers by level (for FREE users)
const UPGRADE_TRIGGERS: Record<number, { trigger: UpgradeTrigger; feature: string; icon: React.ReactNode }> = {
  6: { trigger: 'level_6_goals', feature: 'Goals', icon: <Target className="w-5 h-5" /> },
  13: { trigger: 'level_13_identity', feature: 'Identity', icon: <User className="w-5 h-5" /> },
}

// Phase names and icons
const PHASE_INFO: Record<string, { name: string; icon: string; color: string }> = {
  seedling: { name: 'Seedling', icon: '🌱', color: 'text-green-500' },
  gardener: { name: 'Gardener', icon: '🌿', color: 'text-emerald-500' },
  sage: { name: 'Garden Sage', icon: '🌳', color: 'text-amber-500' },
}

// Level titles (every 3 levels)
function getLevelTitle(level: number): string {
  if (level >= 18) return 'Grand Master Gardener'
  if (level >= 15) return 'Master Gardener'
  if (level >= 12) return 'Expert Cultivator'
  if (level >= 9) return 'Skilled Horticulturist'
  if (level >= 6) return 'Devoted Gardener'
  if (level >= 3) return 'Apprentice Gardener'
  return 'Budding Gardener'
}

// Unlock type colors
const UNLOCK_COLORS: Record<string, string> = {
  garden: 'from-emerald-400 to-green-500',
  decoration: 'from-purple-400 to-pink-500',
  slot: 'from-blue-400 to-cyan-500',
  tier: 'from-amber-400 to-orange-500',
}

export function LevelUpModal({
  open,
  onOpenChange,
  newLevel,
  oldLevel,
}: LevelUpModalProps) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [confettiParticles, setConfettiParticles] = useState<
    { left: number; duration: number }[]
  >([])
  const { tier, showUpgradeModal } = useSubscription()

  const unlocks = getLevelUnlocks(newLevel)
  const phase = getUserPhase(newLevel)
  const phaseInfo = PHASE_INFO[phase]
  const gardenSizeName = getGardenSizeName(newLevel)
  const levelTitle = getLevelTitle(newLevel)

  // Check if this level unlocks a feature that requires upgrade
  const upgradeInfo = UPGRADE_TRIGGERS[newLevel]
  const showFeatureUnlock = upgradeInfo && tier === 'free'

  // Check if phase changed
  const oldPhase = oldLevel ? getUserPhase(oldLevel) : phase
  const phaseChanged = phase !== oldPhase

  // Animation sequence
  useEffect(() => {
    if (open) {
      // Generate confetti particle positions client-side only (avoid SSR mismatch)
      setConfettiParticles(
        Array.from({ length: 20 }, () => ({
          left: Math.random() * 100,
          duration: 2 + Math.random(),
        }))
      )
      // Start confetti immediately
      setShowConfetti(true)

      // Show content after brief delay
      const contentTimer = setTimeout(() => setShowContent(true), 300)

      return () => {
        clearTimeout(contentTimer)
      }
    } else {
      setShowConfetti(false)
      setShowContent(false)
      setConfettiParticles([])
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md p-0 overflow-hidden',
          'bg-gradient-to-b from-slate-900 to-slate-950',
          'border-2 border-amber-500/30',
          'shadow-2xl shadow-amber-500/20'
        )}
      >
        <VisuallyHidden>
          <DialogTitle>Level Up!</DialogTitle>
        </VisuallyHidden>

        {/* Confetti effect (CSS-based) */}
        {showConfetti && confettiParticles.length > 0 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confettiParticles.map((p, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full animate-confetti"
                style={{
                  left: `${p.left}%`,
                  top: '-10px',
                  backgroundColor: ['#fbbf24', '#f97316', '#22c55e', '#3b82f6', '#a855f7'][
                    i % 5
                  ],
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: `${p.duration}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Header glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-amber-500/20 rounded-full blur-3xl" />

        {/* Content */}
        <div
          className={cn(
            'relative p-6 text-center transition-all duration-500',
            showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          )}
        >
          {/* Trophy icon */}
          <div className="mx-auto mb-4 relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/40 animate-bounce-slow">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-300 animate-pulse" />
          </div>

          {/* Level up text */}
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 mb-1">
            LEVEL UP!
          </h2>

          {/* New level display */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {oldLevel && (
              <>
                <span className="text-3xl font-bold text-slate-500">{oldLevel}</span>
                <ChevronRight className="w-6 h-6 text-amber-500" />
              </>
            )}
            <span className="text-5xl font-black text-white">{newLevel}</span>
          </div>

          {/* Title */}
          <p className="text-lg font-semibold text-amber-400 mb-1">{levelTitle}</p>
          <p className="text-sm text-slate-400 mb-4">{gardenSizeName}</p>

          {/* Phase change notification */}
          {phaseChanged && (
            <div className="mb-4 p-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30">
              <p className="text-xs text-amber-300 uppercase tracking-wide mb-1">
                New Phase Unlocked!
              </p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-2xl">{phaseInfo.icon}</span>
                <span className={cn('text-lg font-bold', phaseInfo.color)}>
                  {phaseInfo.name}
                </span>
              </div>
            </div>
          )}

          {/* Unlocks */}
          {unlocks.length > 0 && (
            <div className="space-y-2 mb-6">
              <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">
                New Unlocks
              </p>
              {unlocks.map((unlock, i) => (
                <UnlockItem key={i} unlock={unlock} delay={i * 100} />
              ))}
            </div>
          )}

          {/* PRO Feature Unlock Prompt */}
          {showFeatureUnlock && (
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-xl border border-emerald-500/30">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-bold text-emerald-300">
                  {upgradeInfo.feature} Now Available!
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-3">
                {newLevel === 6
                  ? "You've proven your dedication! Goals help you track progress and achieve more."
                  : "Master gardener! Identity lets you become who you want to be."}
              </p>
              <Button
                onClick={() => {
                  onOpenChange(false)
                  setTimeout(() => showUpgradeModal(upgradeInfo.trigger), 300)
                }}
                className={cn(
                  'w-full py-3 text-sm font-bold',
                  'bg-gradient-to-r from-emerald-500 to-teal-500',
                  'hover:from-emerald-400 hover:to-teal-400',
                  'shadow-lg shadow-emerald-500/30'
                )}
              >
                <Crown className="w-4 h-4 mr-2" />
                Unlock {upgradeInfo.feature}
              </Button>
            </div>
          )}

          {/* Continue button */}
          <Button
            onClick={() => onOpenChange(false)}
            variant={showFeatureUnlock ? 'outline' : 'default'}
            className={cn(
              'w-full py-6 text-lg font-bold',
              showFeatureUnlock
                ? 'border-slate-600 text-slate-300 hover:bg-slate-800'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-lg shadow-amber-500/30'
            )}
          >
            {showFeatureUnlock ? 'Maybe Later' : 'Continue'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Individual unlock item with animation
function UnlockItem({ unlock, delay }: { unlock: LevelUnlock; delay: number }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShow(true), 300 + delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-xl',
        `bg-gradient-to-r ${UNLOCK_COLORS[unlock.type]} bg-opacity-20`,
        'border border-white/10',
        'transition-all duration-300',
        show ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
      )}
    >
      <span className="text-2xl">{unlock.icon}</span>
      <div className="text-left flex-1">
        <p className="font-semibold text-white text-sm">{unlock.name}</p>
        {unlock.description && (
          <p className="text-xs text-slate-300">{unlock.description}</p>
        )}
      </div>
    </div>
  )
}

// CSS for confetti animation - add to globals.css
// @keyframes confetti {
//   0% { transform: translateY(0) rotate(0deg); opacity: 1; }
//   100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
// }
// .animate-confetti { animation: confetti 3s ease-out forwards; }

'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { cn } from '@/lib/utils'
import {
  getUpgradePrompt,
  getTierDisplayInfo,
  TIER_PRICING,
  type UpgradeTrigger,
  type SubscriptionTier,
} from '@/lib/subscription-limits'
import { Crown, Sparkles, Check, X, Zap } from 'lucide-react'

interface UpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: UpgradeTrigger
  context?: string // e.g., plant name for tier_limit
  currentTier?: SubscriptionTier
  onUpgrade?: (targetTier: 'pro' | 'premium') => void
  onStartTrial?: () => void
}

// Tier gradient colors
const TIER_GRADIENTS = {
  pro: {
    bg: 'from-emerald-500/20 to-teal-500/20',
    border: 'border-emerald-500/40',
    button: 'from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400',
    glow: 'shadow-emerald-500/30',
    text: 'from-emerald-300 to-teal-400',
  },
  premium: {
    bg: 'from-amber-500/20 to-orange-500/20',
    border: 'border-amber-500/40',
    button: 'from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400',
    glow: 'shadow-amber-500/30',
    text: 'from-amber-300 to-orange-400',
  },
}

export function UpgradeModal({
  open,
  onOpenChange,
  trigger,
  context,
  currentTier = 'free',
  onUpgrade,
  onStartTrial,
}: UpgradeModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const prompt = getUpgradePrompt(trigger, context)
  const targetTierInfo = getTierDisplayInfo(prompt.targetTier)
  const colors = TIER_GRADIENTS[prompt.targetTier]
  const pricing = TIER_PRICING[prompt.targetTier]

  const handleUpgrade = async () => {
    setIsLoading(true)
    try {
      if (prompt.hasTrial && onStartTrial) {
        onStartTrial()
      } else if (onUpgrade) {
        onUpgrade(prompt.targetTier)
      }
    } finally {
      setIsLoading(false)
      onOpenChange(false)
    }
  }

  const handleDismiss = () => {
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-md p-0 overflow-hidden',
          'bg-gradient-to-b from-slate-900 to-slate-950',
          `border-2 ${colors.border}`,
          `shadow-2xl ${colors.glow}`
        )}
      >
        <VisuallyHidden>
          <DialogTitle>{prompt.title}</DialogTitle>
        </VisuallyHidden>

        {/* Header glow */}
        <div
          className={cn(
            'absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 rounded-full blur-3xl',
            prompt.targetTier === 'premium' ? 'bg-amber-500/20' : 'bg-emerald-500/20'
          )}
        />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1 rounded-full bg-slate-800/50 hover:bg-slate-700/50 transition-colors z-10"
        >
          <X className="w-4 h-4 text-slate-400" />
        </button>

        {/* Content */}
        <div className="relative p-6 text-center">
          {/* Icon */}
          <div className="mx-auto mb-4 relative">
            <div
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center shadow-xl animate-bounce-slow',
                `bg-gradient-to-br ${colors.button} ${colors.glow}`
              )}
            >
              {prompt.targetTier === 'premium' ? (
                <Crown className="w-10 h-10 text-white" />
              ) : (
                <Zap className="w-10 h-10 text-white" />
              )}
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-300 animate-pulse" />
          </div>

          {/* Title */}
          <h2
            className={cn(
              'text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r mb-2',
              colors.text
            )}
          >
            {prompt.title}
          </h2>

          {/* Message */}
          <p className="text-slate-300 text-sm mb-6 max-w-xs mx-auto">{prompt.message}</p>

          {/* Benefits */}
          <div className="space-y-2 mb-6">
            {prompt.benefits.map((benefit, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl text-left',
                  `bg-gradient-to-r ${colors.bg}`,
                  'border border-white/10'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                    `bg-gradient-to-br ${colors.button}`
                  )}
                >
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-white">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Tier badge */}
          <div
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4',
              `bg-gradient-to-r ${colors.bg}`,
              `border ${colors.border}`
            )}
          >
            <span className="text-lg">{targetTierInfo.icon}</span>
            <span className={cn('font-bold text-transparent bg-clip-text bg-gradient-to-r', colors.text)}>
              {targetTierInfo.name.toUpperCase()}
            </span>
          </div>

          {/* Pricing */}
          <div className="mb-6">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-3xl font-black text-white">
                ${(pricing.monthly.usd / 100).toFixed(2)}
              </span>
              <span className="text-slate-400">/month</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              or ${(pricing.yearly.usd / 100).toFixed(2)}/year (save 20%)
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleUpgrade}
              disabled={isLoading}
              className={cn(
                'w-full py-6 text-lg font-bold',
                `bg-gradient-to-r ${colors.button}`,
                `shadow-lg ${colors.glow}`
              )}
            >
              {isLoading ? 'Processing...' : prompt.ctaText}
            </Button>

            <button
              onClick={handleDismiss}
              className="w-full py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              Maybe later
            </button>
          </div>

          {/* Trial note */}
          {prompt.hasTrial && (
            <p className="text-xs text-slate-500 mt-4">
              7-day free trial. Cancel anytime.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Feature lock inline component (for blocked features)
interface FeatureLockProps {
  feature: string
  requiredTier: 'pro' | 'premium'
  onUpgrade?: () => void
}

export function FeatureLock({ feature, requiredTier, onUpgrade }: FeatureLockProps) {
  const tierInfo = getTierDisplayInfo(requiredTier)
  const colors = TIER_GRADIENTS[requiredTier]

  return (
    <div
      className={cn(
        'p-4 rounded-xl text-center',
        `bg-gradient-to-br ${colors.bg}`,
        `border ${colors.border}`
      )}
    >
      <div className="flex items-center justify-center gap-2 mb-2">
        <span className="text-xl">{tierInfo.icon}</span>
        <span className={cn('font-bold text-transparent bg-clip-text bg-gradient-to-r', colors.text)}>
          {requiredTier.toUpperCase()} Feature
        </span>
      </div>
      <p className="text-sm text-slate-300 mb-3">
        {feature} requires {tierInfo.name} subscription.
      </p>
      {onUpgrade && (
        <Button
          onClick={onUpgrade}
          size="sm"
          className={cn('bg-gradient-to-r', colors.button)}
        >
          Unlock with {tierInfo.name}
        </Button>
      )}
    </div>
  )
}

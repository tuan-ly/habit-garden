'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { getTierInfo, type TierInfo } from '@/lib/progression-system'
import type { PlantTier } from '@/types/database'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Star } from 'lucide-react'

interface TierBadgeProps {
  tier: PlantTier
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  showTooltip?: boolean
  locked?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

const containerClasses = {
  sm: 'gap-0.5 text-xs',
  md: 'gap-0.5 text-sm',
  lg: 'gap-1 text-base',
}

export function TierBadge({
  tier,
  size = 'sm',
  showLabel = false,
  showTooltip = true,
  locked = false,
  className,
}: TierBadgeProps) {
  const info = getTierInfo(tier)

  const stars = Array.from({ length: tier }, (_, i) => (
    <Star
      key={i}
      className={cn(
        sizeClasses[size],
        locked ? 'text-muted-foreground/40' : info.color,
        'fill-current'
      )}
    />
  ))

  const badge = (
    <div
      className={cn(
        'inline-flex items-center',
        containerClasses[size],
        locked && 'opacity-50',
        className
      )}
    >
      <div className="flex">{stars}</div>
      {showLabel && (
        <span className={cn('ml-1 font-medium', locked ? 'text-muted-foreground' : info.color)}>
          {info.name}
        </span>
      )}
    </div>
  )

  if (!showTooltip) {
    return badge
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold">
              Tier {tier}: {info.name}
            </p>
            <p className="text-xs text-muted-foreground">{info.theme}</p>
            <p className="text-xs">Tolerance: {info.tolerance}</p>
            {locked && (
              <p className="text-xs text-amber-600 mt-1">
                Locked - Level up to unlock!
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Compact version for plant cards
export function TierStars({
  tier,
  size = 'sm',
  locked = false,
  className,
}: Omit<TierBadgeProps, 'showLabel' | 'showTooltip'>) {
  const info = getTierInfo(tier)

  return (
    <div className={cn('flex', containerClasses[size], className)}>
      {Array.from({ length: tier }, (_, i) => (
        <Star
          key={i}
          className={cn(
            sizeClasses[size],
            locked ? 'text-muted-foreground/40' : info.color,
            'fill-current'
          )}
        />
      ))}
    </div>
  )
}

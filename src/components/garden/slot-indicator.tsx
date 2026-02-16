'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Sprout, Infinity } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface SlotIndicatorProps {
  currentCount: number
  maxSlots: number // -1 or 999 for unlimited
  className?: string
  showIcon?: boolean
  variant?: 'default' | 'compact' | 'progress'
}

export function SlotIndicator({
  currentCount,
  maxSlots,
  className,
  showIcon = true,
  variant = 'default',
}: SlotIndicatorProps) {
  const isUnlimited = maxSlots === -1 || maxSlots >= 999
  const isFull = !isUnlimited && currentCount >= maxSlots
  const isNearFull = !isUnlimited && currentCount >= maxSlots - 1

  const percentage = isUnlimited ? 0 : Math.min(100, (currentCount / maxSlots) * 100)

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium',
                isFull
                  ? 'text-red-600'
                  : isNearFull
                  ? 'text-amber-600'
                  : 'text-muted-foreground',
                className
              )}
            >
              {showIcon && <Sprout className="h-3 w-3" />}
              <span>
                {currentCount}/{isUnlimited ? <Infinity className="inline h-3 w-3" /> : maxSlots}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isUnlimited
                ? 'Unlimited plant slots'
                : isFull
                ? 'Garden is full! Level up for more slots.'
                : `${maxSlots - currentCount} slot${maxSlots - currentCount !== 1 ? 's' : ''} remaining`}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (variant === 'progress') {
    return (
      <div className={cn('space-y-1', className)}>
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Plant Slots</span>
          <span
            className={cn(
              'font-medium',
              isFull ? 'text-red-600' : isNearFull ? 'text-amber-600' : ''
            )}
          >
            {currentCount}/{isUnlimited ? '∞' : maxSlots}
          </span>
        </div>
        {!isUnlimited && (
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                isFull
                  ? 'bg-red-500'
                  : isNearFull
                  ? 'bg-amber-500'
                  : 'bg-green-500'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
    )
  }

  // Default variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-2 px-2 py-1 rounded-md text-sm',
              isFull
                ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
                : isNearFull
                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                : 'bg-muted text-muted-foreground',
              className
            )}
          >
            {showIcon && <Sprout className="h-4 w-4" />}
            <span className="font-medium">
              {currentCount}
              <span className="text-muted-foreground">/</span>
              {isUnlimited ? <Infinity className="inline h-4 w-4" /> : maxSlots}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">
              {isUnlimited
                ? 'Unlimited Slots'
                : isFull
                ? 'Garden Full!'
                : `${maxSlots - currentCount} Slot${maxSlots - currentCount !== 1 ? 's' : ''} Available`}
            </p>
            {!isUnlimited && !isFull && (
              <p className="text-xs text-muted-foreground">
                Level up to unlock more plant slots
              </p>
            )}
            {isFull && (
              <p className="text-xs text-amber-600">
                Reach the next level to plant more!
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

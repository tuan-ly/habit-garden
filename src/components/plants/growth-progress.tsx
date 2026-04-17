'use client'

import { cn } from '@/lib/utils'
import { Sprout, TreeDeciduous, Skull, Sparkles, Leaf } from 'lucide-react'
import type { PlantStatus } from '@/types/database'

interface GrowthProgressProps {
  value: number
  status: PlantStatus
  maturityDays: number
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function GrowthProgress({
  value,
  status,
  maturityDays,
  showLabel = true,
  size = 'sm'
}: GrowthProgressProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'dead':
        return <Skull className="h-3.5 w-3.5 text-ash" />
      case 'mature':
        return <TreeDeciduous className="h-3.5 w-3.5 text-leaf" />
      default:
        if (value >= 75) return <Sparkles className="h-3.5 w-3.5 text-bloom" />
        if (value >= 25) return <Leaf className="h-3.5 w-3.5 text-leaf" />
        return <Sprout className="h-3.5 w-3.5 text-moss" />
    }
  }

  const getToneColor = () => {
    if (status === 'dead') return { bar: 'bg-ash', text: 'text-ash' }
    if (status === 'mature') return { bar: 'bg-leaf', text: 'text-leaf' }
    if (value >= 75) return { bar: 'bg-growth', text: 'text-leaf' }
    return { bar: 'bg-moss', text: 'text-leaf' }
  }

  const getStatusText = () => {
    if (status === 'dead') return 'Plant has died'
    if (status === 'mature') return 'Fully grown'
    const daysLeft = Math.ceil(maturityDays * (100 - value) / 100)
    if (daysLeft <= 1) return 'Almost there'
    return `~${daysLeft} days to mature`
  }

  const tone = getToneColor()

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
            {getStatusIcon()}
            Growth
          </span>
          <span className={cn('font-display font-semibold tabular-nums', tone.text)}>
            {Math.round(value)}%
          </span>
        </div>
      )}
      <div className={cn(
        'w-full rounded-full bg-mist dark:bg-muted overflow-hidden relative',
        size === 'sm' ? 'h-2' : 'h-3'
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-700 ease-out',
            tone.bar,
            status === 'mature' && 'animate-shimmer'
          )}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
        {/* Milestone markers */}
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {[25, 50, 75].map(mark => (
            <div
              key={mark}
              className="absolute top-0 bottom-0 w-px bg-white/40 dark:bg-black/20"
              style={{ left: `${mark}%` }}
            />
          ))}
        </div>
      </div>
      {showLabel && (
        <p className={cn('text-[10px] text-right', tone.text, 'opacity-80')}>
          {getStatusText()}
        </p>
      )}
    </div>
  )
}

'use client'

import { cn } from '@/lib/utils'
import { Droplets, AlertTriangle } from 'lucide-react'

interface MoistureBarProps {
  value: number
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function MoistureBar({ value, showLabel = true, size = 'sm' }: MoistureBarProps) {
  // Living Garden tone — one accent per zone, no gradients
  const tone =
    value >= 70 ? { bar: 'bg-moisture', text: 'text-moisture' }
      : value >= 40 ? { bar: 'bg-bloom', text: 'text-bloom' }
        : value >= 20 ? { bar: 'bg-moisture-low', text: 'text-moisture-low' }
          : { bar: 'bg-moisture-low', text: 'text-moisture-low' }

  const Icon = value < 20 ? AlertTriangle : Droplets

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
            <Droplets className={cn('h-3.5 w-3.5', tone.text)} />
            Moisture
          </span>
          <span className={cn('font-display font-semibold tabular-nums flex items-center gap-1', tone.text)}>
            <Icon className="h-3 w-3" />
            {Math.round(value)}%
          </span>
        </div>
      )}
      <div className={cn(
        'w-full rounded-full bg-mist dark:bg-muted overflow-hidden',
        size === 'sm' ? 'h-2' : 'h-3'
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-700 ease-out',
            tone.bar,
            value < 30 && 'animate-pulse'
          )}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  )
}

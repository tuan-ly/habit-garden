'use client'

import { cn } from '@/lib/utils'
import { Droplets } from 'lucide-react'

interface MoistureBarProps {
  value: number
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function MoistureBar({ value, showLabel = true, size = 'sm' }: MoistureBarProps) {
  const getMoistureGradient = (moisture: number) => {
    if (moisture >= 70) return 'bg-gradient-to-r from-blue-400 to-cyan-400'
    if (moisture >= 40) return 'bg-gradient-to-r from-yellow-400 to-amber-400'
    if (moisture >= 20) return 'bg-gradient-to-r from-orange-400 to-amber-500'
    return 'bg-gradient-to-r from-red-400 to-rose-500'
  }

  const getMoistureIcon = (moisture: number) => {
    if (moisture >= 70) return '💧'
    if (moisture >= 40) return '💧'
    if (moisture >= 20) return '⚠️'
    return '🏜️'
  }

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
            <Droplets className={cn(
              'h-3.5 w-3.5',
              value >= 70 && 'text-blue-500',
              value >= 40 && value < 70 && 'text-yellow-500',
              value >= 20 && value < 40 && 'text-orange-500',
              value < 20 && 'text-red-500'
            )} />
            Moisture
          </span>
          <span className={cn(
            'font-bold flex items-center gap-1',
            value >= 70 && 'text-blue-600 dark:text-blue-400',
            value >= 40 && value < 70 && 'text-yellow-600 dark:text-yellow-400',
            value >= 20 && value < 40 && 'text-orange-600 dark:text-orange-400',
            value < 20 && 'text-red-600 dark:text-red-400'
          )}>
            <span className="text-xs">{getMoistureIcon(value)}</span>
            {Math.round(value)}%
          </span>
        </div>
      )}
      <div className={cn(
        'w-full rounded-full bg-muted/50 overflow-hidden shadow-inner',
        size === 'sm' ? 'h-2.5' : 'h-3.5'
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out shadow-sm',
            getMoistureGradient(value),
            value < 30 && 'animate-pulse'
          )}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  )
}

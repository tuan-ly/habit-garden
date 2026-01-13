'use client'

import { cn } from '@/lib/utils'
import { Droplets } from 'lucide-react'

interface MoistureBarProps {
  value: number
  showLabel?: boolean
  size?: 'sm' | 'md'
}

export function MoistureBar({ value, showLabel = true, size = 'sm' }: MoistureBarProps) {
  const getMoistureColor = (moisture: number) => {
    if (moisture >= 70) return 'bg-blue-500'
    if (moisture >= 40) return 'bg-yellow-500'
    if (moisture >= 20) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Droplets className="h-3 w-3" />
            Moisture
          </span>
          <span className={cn(
            'font-medium',
            value >= 70 && 'text-blue-600',
            value >= 40 && value < 70 && 'text-yellow-600',
            value >= 20 && value < 40 && 'text-orange-600',
            value < 20 && 'text-red-600'
          )}>
            {Math.round(value)}%
          </span>
        </div>
      )}
      <div className={cn(
        'w-full rounded-full bg-secondary overflow-hidden',
        size === 'sm' ? 'h-2' : 'h-3'
      )}>
        <div
          className={cn(
            'h-full transition-all duration-500',
            getMoistureColor(value)
          )}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  )
}

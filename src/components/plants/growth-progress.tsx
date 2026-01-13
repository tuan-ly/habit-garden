'use client'

import { cn } from '@/lib/utils'
import { Sprout, TreeDeciduous, Skull } from 'lucide-react'
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
        return <Skull className="h-3 w-3" />
      case 'mature':
        return <TreeDeciduous className="h-3 w-3" />
      default:
        return <Sprout className="h-3 w-3" />
    }
  }

  const getProgressColor = () => {
    if (status === 'dead') return 'bg-gray-400'
    if (status === 'mature') return 'bg-green-500'
    if (value >= 75) return 'bg-green-400'
    if (value >= 50) return 'bg-emerald-400'
    if (value >= 25) return 'bg-lime-400'
    return 'bg-lime-300'
  }

  const getStatusText = () => {
    if (status === 'dead') return 'Dead'
    if (status === 'mature') return 'Mature!'
    return `${maturityDays} days to mature`
  }

  return (
    <div className="space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1 text-muted-foreground">
            {getStatusIcon()}
            Growth
          </span>
          <span className={cn(
            'font-medium',
            status === 'dead' && 'text-gray-500',
            status === 'mature' && 'text-green-600',
            status === 'growing' && 'text-emerald-600'
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
            getProgressColor()
          )}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-[10px] text-muted-foreground text-right">
          {getStatusText()}
        </p>
      )}
    </div>
  )
}

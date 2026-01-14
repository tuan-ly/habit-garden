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
        return <Skull className="h-3.5 w-3.5 text-gray-400" />
      case 'mature':
        return <TreeDeciduous className="h-3.5 w-3.5 text-green-500" />
      default:
        if (value >= 75) return <Sparkles className="h-3.5 w-3.5 text-yellow-500" />
        if (value >= 25) return <Leaf className="h-3.5 w-3.5 text-emerald-500" />
        return <Sprout className="h-3.5 w-3.5 text-lime-500" />
    }
  }

  const getProgressGradient = () => {
    if (status === 'dead') return 'bg-gradient-to-r from-gray-300 to-gray-400'
    if (status === 'mature') return 'bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500'
    if (value >= 75) return 'bg-gradient-to-r from-yellow-400 via-green-400 to-emerald-500'
    if (value >= 50) return 'bg-gradient-to-r from-lime-400 to-green-500'
    if (value >= 25) return 'bg-gradient-to-r from-lime-300 to-lime-500'
    return 'bg-gradient-to-r from-lime-200 to-lime-400'
  }

  const getStatusText = () => {
    if (status === 'dead') return 'Plant has died 🥺'
    if (status === 'mature') return '🎉 Fully grown!'
    const daysLeft = Math.ceil(maturityDays * (100 - value) / 100)
    if (daysLeft <= 1) return 'Almost there! ✨'
    return `~${daysLeft} days to mature`
  }

  const getGrowthEmoji = () => {
    if (status === 'dead') return '💀'
    if (status === 'mature') return '🌳'
    if (value >= 75) return '🌸'
    if (value >= 50) return '🌱'
    if (value >= 25) return '🌿'
    return '🪴'
  }

  return (
    <div className="space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
            {getStatusIcon()}
            Growth
          </span>
          <span className={cn(
            'font-bold flex items-center gap-1',
            status === 'dead' && 'text-gray-500',
            status === 'mature' && 'text-green-600 dark:text-green-400',
            status === 'growing' && 'text-emerald-600 dark:text-emerald-400'
          )}>
            <span className="text-xs">{getGrowthEmoji()}</span>
            {Math.round(value)}%
          </span>
        </div>
      )}
      <div className={cn(
        'w-full rounded-full bg-muted/50 overflow-hidden shadow-inner relative',
        size === 'sm' ? 'h-2.5' : 'h-3.5'
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-700 ease-out shadow-sm',
            getProgressGradient(),
            status === 'mature' && 'animate-shimmer'
          )}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
        {/* Milestone markers */}
        <div className="absolute inset-0 flex items-center">
          <div className="w-1/4 border-r border-white/20 dark:border-black/20" />
          <div className="w-1/4 border-r border-white/20 dark:border-black/20" />
          <div className="w-1/4 border-r border-white/20 dark:border-black/20" />
          <div className="w-1/4" />
        </div>
      </div>
      {showLabel && (
        <p className={cn(
          'text-[10px] text-right font-medium',
          status === 'dead' && 'text-gray-400',
          status === 'mature' && 'text-green-500',
          status === 'growing' && 'text-muted-foreground'
        )}>
          {getStatusText()}
        </p>
        
      )}
    </div>
  )
}

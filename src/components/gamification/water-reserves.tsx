'use client'

import { cn } from '@/lib/utils'
import {
  getMaxReserves,
  getReserveStatus,
  formatReserveDisplay,
} from '@/lib/water-reserves'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Droplets, Shield, AlertTriangle } from 'lucide-react'

interface WaterReservesDisplayProps {
  current: number
  level: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  className?: string
}

export function WaterReservesDisplay({
  current,
  level,
  size = 'md',
  showLabel = true,
  className,
}: WaterReservesDisplayProps) {
  const max = getMaxReserves(level)
  const status = getReserveStatus(current, max)

  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const statusColors = {
    full: 'text-blue-500',
    partial: 'text-blue-400',
    critical: 'text-orange-500',
    empty: 'text-red-500',
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1.5',
              sizeClasses[size],
              statusColors[status.status],
              className
            )}
          >
            <Droplets className={iconSizes[size]} />
            <span className="font-medium">
              {current}/{max}
            </span>
            {showLabel && <span className="text-muted-foreground">reserves</span>}
            {status.status === 'critical' && (
              <AlertTriangle className={cn(iconSizes[size], 'text-orange-500')} />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-medium">Water Reserves</p>
            <p className="text-sm text-muted-foreground">{status.message}</p>
            <p className="text-xs text-muted-foreground">
              Protects your streak when you miss a day
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Detailed water reserves card
interface WaterReservesCardProps {
  current: number
  level: number
  className?: string
}

export function WaterReservesCard({ current, level, className }: WaterReservesCardProps) {
  const max = getMaxReserves(level)
  const status = getReserveStatus(current, max)
  const percentage = Math.round((current / max) * 100)

  return (
    <div
      className={cn(
        'p-4 rounded-lg border bg-gradient-to-br',
        status.status === 'full' && 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800',
        status.status === 'partial' && 'from-blue-50 to-slate-50 dark:from-blue-900/20 dark:to-slate-900/20 border-blue-200 dark:border-blue-800',
        status.status === 'critical' && 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800',
        status.status === 'empty' && 'from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'p-2 rounded-lg',
            status.status === 'full' && 'bg-blue-100 dark:bg-blue-900/30',
            status.status === 'partial' && 'bg-blue-100 dark:bg-blue-900/30',
            status.status === 'critical' && 'bg-orange-100 dark:bg-orange-900/30',
            status.status === 'empty' && 'bg-red-100 dark:bg-red-900/30'
          )}
        >
          <Shield
            className={cn(
              'h-6 w-6',
              status.status === 'full' && 'text-blue-500',
              status.status === 'partial' && 'text-blue-400',
              status.status === 'critical' && 'text-orange-500',
              status.status === 'empty' && 'text-red-500'
            )}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-semibold">Water Reserves</h4>
            <span className="text-lg font-bold">
              {current}/{max}
            </span>
          </div>

          <p className="text-sm text-muted-foreground mb-2">{status.message}</p>

          {/* Progress bar */}
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-500',
                status.status === 'full' && 'bg-blue-500',
                status.status === 'partial' && 'bg-blue-400',
                status.status === 'critical' && 'bg-orange-500',
                status.status === 'empty' && 'bg-red-500'
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Reserve drops visualization */}
          <div className="flex gap-1 mt-2">
            {Array.from({ length: max }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center text-xs transition-all',
                  i < current
                    ? 'bg-blue-500 text-white'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                💧
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info text */}
      <p className="text-xs text-muted-foreground mt-3">
        Each reserve protects your streak for 1 missed day. Earn more by leveling up and
        growing plants to maturity.
      </p>
    </div>
  )
}

// Compact badge for header
interface WaterReservesBadgeProps {
  current: number
  level: number
  className?: string
}

export function WaterReservesBadge({ current, level, className }: WaterReservesBadgeProps) {
  const max = getMaxReserves(level)
  const status = getReserveStatus(current, max)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              status.status === 'full' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
              status.status === 'partial' && 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
              status.status === 'critical' && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
              status.status === 'empty' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
              className
            )}
          >
            <Droplets className="h-3 w-3" />
            {current}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">Water Reserves: {current}/{max}</p>
          <p className="text-xs text-muted-foreground">{status.message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Reserve usage notification
interface ReserveUsedNotificationProps {
  reservesUsed: number
  plantName: string
  streakSaved: boolean
  onClose?: () => void
}

export function ReserveUsedNotification({
  reservesUsed,
  plantName,
  streakSaved,
  onClose,
}: ReserveUsedNotificationProps) {
  return (
    <div
      className={cn(
        'fixed top-20 left-1/2 -translate-x-1/2 z-50',
        'bg-card border rounded-lg shadow-lg p-4 max-w-sm mx-4',
        'animate-in fade-in slide-in-from-top-4'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
          <Shield className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold">
            {streakSaved ? 'Streak Protected!' : 'Reserve Used'}
          </h4>
          <p className="text-sm text-muted-foreground">
            {reservesUsed} water reserve{reservesUsed > 1 ? 's' : ''} used to protect your
            streak for <strong>{plantName}</strong>
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}

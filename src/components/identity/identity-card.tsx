'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { IdentityWithGoals, IdentityColor, IdentityStatus } from '@/types/database'
import { Target, Pause, Trophy, ChevronRight } from 'lucide-react'

// Color gradients for identity cards
const IDENTITY_GRADIENTS: Record<IdentityColor, string> = {
  purple: 'from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30',
  blue: 'from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30',
  green: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
  amber: 'from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30',
  rose: 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30',
  cyan: 'from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30',
  pink: 'from-pink-50 to-fuchsia-50 dark:from-pink-950/30 dark:to-fuchsia-950/30',
  orange: 'from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30',
}

const IDENTITY_BORDER_COLORS: Record<IdentityColor, string> = {
  purple: 'border-purple-200 dark:border-purple-800',
  blue: 'border-blue-200 dark:border-blue-800',
  green: 'border-green-200 dark:border-green-800',
  amber: 'border-amber-200 dark:border-amber-800',
  rose: 'border-rose-200 dark:border-rose-800',
  cyan: 'border-cyan-200 dark:border-cyan-800',
  pink: 'border-pink-200 dark:border-pink-800',
  orange: 'border-orange-200 dark:border-orange-800',
}

const IDENTITY_ACCENT_COLORS: Record<IdentityColor, string> = {
  purple: 'text-purple-600 dark:text-purple-400',
  blue: 'text-blue-600 dark:text-blue-400',
  green: 'text-green-600 dark:text-green-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
  cyan: 'text-cyan-600 dark:text-cyan-400',
  pink: 'text-pink-600 dark:text-pink-400',
  orange: 'text-orange-600 dark:text-orange-400',
}

const STATUS_CONFIG: Record<IdentityStatus, { icon: typeof Target; label: string; className: string }> = {
  active: {
    icon: Target,
    label: 'Active',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  },
  achieved: {
    icon: Trophy,
    label: 'Achieved',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  },
  paused: {
    icon: Pause,
    label: 'Paused',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  },
}

interface IdentityCardProps {
  identity: IdentityWithGoals
  onClick?: () => void
  compact?: boolean
}

export function IdentityCard({ identity, onClick, compact = false }: IdentityCardProps) {
  const statusConfig = STATUS_CONFIG[identity.status]
  const StatusIcon = statusConfig.icon

  return (
    <Card
      className={cn(
        'group cursor-pointer transition-all duration-300',
        'hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1.5',
        'relative overflow-hidden border-2',
        'bg-gradient-to-br',
        IDENTITY_GRADIENTS[identity.color],
        IDENTITY_BORDER_COLORS[identity.color],
        identity.status === 'paused' && 'opacity-70'
      )}
      onClick={onClick}
    >
      <CardContent className={cn('p-4', compact && 'p-3')}>
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'flex-shrink-0 flex items-center justify-center rounded-xl text-2xl',
              'bg-white/80 dark:bg-slate-800/80 shadow-sm',
              compact ? 'w-10 h-10' : 'w-12 h-12'
            )}
          >
            {identity.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3
                className={cn(
                  'font-bold truncate',
                  IDENTITY_ACCENT_COLORS[identity.color],
                  compact ? 'text-base' : 'text-lg'
                )}
              >
                {identity.name}
              </h3>
              <Badge variant="secondary" className={cn('text-xs flex-shrink-0', statusConfig.className)}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>

            {identity.description && !compact && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{identity.description}</p>
            )}

            {/* Stats */}
            <div className={cn('flex items-center gap-4 text-sm', compact ? 'mt-1' : 'mt-2')}>
              <span className="text-muted-foreground">
                <Target className="w-4 h-4 inline mr-1" />
                {identity.goals_count} {identity.goals_count === 1 ? 'goal' : 'goals'}
              </span>
              <span className={cn('font-medium', IDENTITY_ACCENT_COLORS[identity.color])}>
                {Math.round(identity.progress_percentage)}% progress
              </span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight
            className={cn(
              'w-5 h-5 text-muted-foreground/50',
              'group-hover:translate-x-1 transition-transform'
            )}
          />
        </div>

        {/* Progress bar */}
        {!compact && (
          <div className="mt-4">
            <div className="h-2 bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  'bg-gradient-to-r',
                  identity.color === 'purple' && 'from-purple-500 to-violet-500',
                  identity.color === 'blue' && 'from-blue-500 to-sky-500',
                  identity.color === 'green' && 'from-green-500 to-emerald-500',
                  identity.color === 'amber' && 'from-amber-500 to-yellow-500',
                  identity.color === 'rose' && 'from-rose-500 to-pink-500',
                  identity.color === 'cyan' && 'from-cyan-500 to-teal-500',
                  identity.color === 'pink' && 'from-pink-500 to-fuchsia-500',
                  identity.color === 'orange' && 'from-orange-500 to-amber-500'
                )}
                style={{ width: `${Math.min(identity.progress_percentage, 100)}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Compact version for lists
export function IdentityCardCompact({ identity, onClick }: Omit<IdentityCardProps, 'compact'>) {
  return <IdentityCard identity={identity} onClick={onClick} compact />
}

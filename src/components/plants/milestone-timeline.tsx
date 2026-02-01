'use client'

/**
 * Milestone Timeline - Journey visualization for plant habits
 *
 * Shows milestones as a vertical timeline:
 * - Unlocked milestones with celebration visuals
 * - Locked milestones with progress indicators
 * - Reflection integration for deeper connection
 */

import { cn } from '@/lib/utils'
import {
  Trophy,
  Calendar,
  Star,
  Sparkles,
  Lock,
  Check,
  ChevronRight,
  Pencil,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { MilestoneData } from '@/lib/actions/journal'

interface MilestoneTimelineProps {
  milestones: MilestoneData[]
  onAddReflection?: (milestone: MilestoneData) => void
  className?: string
}

export function MilestoneTimeline({
  milestones,
  onAddReflection,
  className,
}: MilestoneTimelineProps) {
  if (milestones.length === 0) {
    return <MilestoneEmptyState />
  }

  // Separate unlocked and locked
  const unlockedMilestones = milestones.filter(m => m.unlocked)
  const lockedMilestones = milestones.filter(m => !m.unlocked)
  const nextMilestone = lockedMilestones[0]

  return (
    <div className={cn('space-y-4', className)}>
      {/* Unlocked milestones */}
      {unlockedMilestones.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <Trophy className="h-3.5 w-3.5 text-amber-500" />
            Achieved
          </h4>
          <div className="space-y-2">
            {unlockedMilestones.map(milestone => (
              <MilestoneCard
                key={milestone.type}
                milestone={milestone}
                onAddReflection={onAddReflection}
              />
            ))}
          </div>
        </div>
      )}

      {/* Next milestone (highlighted) */}
      {nextMilestone && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-indigo-500" />
            Next Up
          </h4>
          <MilestoneCard milestone={nextMilestone} highlighted />
        </div>
      )}

      {/* Remaining locked milestones (collapsed) */}
      {lockedMilestones.length > 1 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Coming Later
          </h4>
          <div className="flex flex-wrap gap-2">
            {lockedMilestones.slice(1).map(milestone => (
              <MilestoneChip key={milestone.type} milestone={milestone} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface MilestoneCardProps {
  milestone: MilestoneData
  highlighted?: boolean
  onAddReflection?: (milestone: MilestoneData) => void
}

export function MilestoneCard({
  milestone,
  highlighted,
  onAddReflection,
}: MilestoneCardProps) {
  const { icon, gradientBg, iconBg } = getMilestoneStyle(milestone)
  const hasReflection = !!milestone.reflection

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl',
        'transition-all',
        milestone.unlocked
          ? 'bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/80'
          : 'bg-slate-100/80 dark:bg-slate-800/40',
        highlighted && !milestone.unlocked && 'ring-2 ring-indigo-300/50 dark:ring-indigo-500/30'
      )}
    >
      {/* Celebration gradient for unlocked */}
      {milestone.unlocked && (
        <div
          className={cn(
            'absolute inset-0 opacity-20 dark:opacity-10',
            gradientBg
          )}
        />
      )}

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'p-2.5 rounded-xl flex-shrink-0',
              milestone.unlocked ? iconBg : 'bg-slate-200/80 dark:bg-slate-700/50'
            )}
          >
            {milestone.unlocked ? (
              icon
            ) : (
              <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h5
                className={cn(
                  'font-semibold',
                  milestone.unlocked
                    ? 'text-slate-800 dark:text-slate-100'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                {milestone.title}
              </h5>
              {milestone.unlocked && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/50">
                  <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                </span>
              )}
            </div>

            <p
              className={cn(
                'text-sm leading-relaxed',
                milestone.unlocked
                  ? 'text-slate-600 dark:text-slate-300'
                  : 'text-slate-400 dark:text-slate-500'
              )}
            >
              {milestone.description}
            </p>

            {/* Progress for locked */}
            {!milestone.unlocked && milestone.progress !== undefined && (
              <div className="mt-3 space-y-1.5">
                <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500 transition-all"
                    style={{ width: `${milestone.progress}%` }}
                  />
                </div>
                {milestone.daysToGo !== undefined && (
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {milestone.daysToGo} days to go
                  </p>
                )}
              </div>
            )}

            {/* Unlocked date and reflection */}
            {milestone.unlocked && (
              <div className="mt-3 space-y-2">
                {milestone.unlockedAt && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatMilestoneDate(milestone.unlockedAt)}
                  </p>
                )}

                {/* Reflection preview or add button */}
                {hasReflection ? (
                  <div className="p-3 rounded-lg bg-purple-50/80 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/30">
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1 flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      Your reflection
                    </p>
                    <p className="text-sm text-purple-700 dark:text-purple-300 line-clamp-2">
                      {milestone.reflection?.personal_note || 'No note added'}
                    </p>
                  </div>
                ) : onAddReflection ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/30"
                    onClick={() => onAddReflection(milestone)}
                  >
                    <Pencil className="h-3 w-3 mr-1.5" />
                    Add reflection
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface MilestoneChipProps {
  milestone: MilestoneData
}

function MilestoneChip({ milestone }: MilestoneChipProps) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
      <Lock className="h-3 w-3" />
      <span className="text-xs font-medium">{milestone.title}</span>
    </div>
  )
}

function getMilestoneStyle(milestone: MilestoneData) {
  const type = milestone.type

  if (type === 'days_7' || type === 'days_14') {
    return {
      icon: <Calendar className="h-5 w-5 text-emerald-600" />,
      gradientBg: 'bg-gradient-to-r from-emerald-400 to-teal-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
    }
  }

  if (type === 'days_30' || type === 'days_100' || type === 'year_1') {
    return {
      icon: <Trophy className="h-5 w-5 text-amber-600" />,
      gradientBg: 'bg-gradient-to-r from-amber-400 to-orange-400',
      iconBg: 'bg-amber-100 dark:bg-amber-900/50',
    }
  }

  if (type === 'first_pr') {
    return {
      icon: <Star className="h-5 w-5 text-indigo-600" />,
      gradientBg: 'bg-gradient-to-r from-indigo-400 to-purple-400',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/50',
    }
  }

  if (type === 'first_note') {
    return {
      icon: <Pencil className="h-5 w-5 text-purple-600" />,
      gradientBg: 'bg-gradient-to-r from-purple-400 to-pink-400',
      iconBg: 'bg-purple-100 dark:bg-purple-900/50',
    }
  }

  if (type === 'season_complete') {
    return {
      icon: <Sparkles className="h-5 w-5 text-rose-600" />,
      gradientBg: 'bg-gradient-to-r from-rose-400 to-pink-400',
      iconBg: 'bg-rose-100 dark:bg-rose-900/50',
    }
  }

  // Default
  return {
    icon: <Star className="h-5 w-5 text-slate-600" />,
    gradientBg: 'bg-gradient-to-r from-slate-400 to-slate-500',
    iconBg: 'bg-slate-100 dark:bg-slate-700',
  }
}

function formatMilestoneDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function MilestoneEmptyState() {
  return (
    <div className="text-center py-8 px-4">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30 mb-3">
        <Sparkles className="h-6 w-6 text-amber-500" />
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Your first milestone is just around the corner
      </p>
    </div>
  )
}

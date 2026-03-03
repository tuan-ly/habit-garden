'use client'

/**
 * Journal Timeline - Chronological view of plant activity notes
 *
 * Shows entries grouped by: Today | Yesterday | This Week | Earlier
 * Each entry displays: type icon, notes, value, XP earned, personal record badge
 */

import { cn } from '@/lib/utils'
import {
  Droplets,
  TrendingUp,
  Sparkles,
  Trophy,
  BookOpen,
  Zap,
  CheckCircle2,
} from 'lucide-react'
import type { JournalEntry } from '@/lib/actions/journal'
import { ScrollArea } from '@/components/ui/scroll-area'

interface JournalTimelineProps {
  entries: JournalEntry[]
  className?: string
}

export function JournalTimeline({ entries, className }: JournalTimelineProps) {
  if (entries.length === 0) {
    return <JournalEmptyState />
  }

  // Group entries by date group
  const groups = groupEntries(entries)

  return (
    <div className={cn('space-y-6', className)}>
      {groups.map(group => (
        <div key={group.label} className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {group.label}
          </h4>
          <div className="space-y-2">
            {group.entries.map(entry => (
              <JournalEntryCard key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

interface EntryGroup {
  label: string
  entries: JournalEntry[]
}

function groupEntries(entries: JournalEntry[]): EntryGroup[] {
  const groups: Record<string, JournalEntry[]> = {
    today: [],
    yesterday: [],
    this_week: [],
    earlier: [],
  }

  for (const entry of entries) {
    groups[entry.dateGroup].push(entry)
  }

  const result: EntryGroup[] = []
  if (groups.today.length > 0) {
    result.push({ label: 'Today', entries: groups.today })
  }
  if (groups.yesterday.length > 0) {
    result.push({ label: 'Yesterday', entries: groups.yesterday })
  }
  if (groups.this_week.length > 0) {
    result.push({ label: 'This Week', entries: groups.this_week })
  }
  if (groups.earlier.length > 0) {
    result.push({ label: 'Earlier', entries: groups.earlier })
  }

  return result
}

interface JournalEntryCardProps {
  entry: JournalEntry
}

function JournalEntryCard({ entry }: JournalEntryCardProps) {
  const { icon, iconBg, borderColor } = getEntryStyle(entry)
  const formattedDate = formatEntryDate(entry.date)

  return (
    <div
      className={cn(
        'relative p-4 rounded-xl overflow-hidden',
        'bg-white/60 dark:bg-slate-800/40',
        'border border-slate-200/50 dark:border-slate-700/30',
        'transition-all hover:bg-white/80 dark:hover:bg-slate-800/60',
        entry.isPersonalRecord && 'ring-1 ring-amber-300/50 dark:ring-amber-500/30'
      )}
    >
      {/* Left accent border */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1 rounded-l-xl', borderColor)} />

      <div className="flex items-start gap-3 pl-1">
        {/* Icon */}
        <div className={cn('p-2 rounded-lg flex-shrink-0', iconBg)}>
          {icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {formattedDate}
              </span>
              {entry.isPersonalRecord && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                  <Trophy className="h-2.5 w-2.5" />
                  PR
                </span>
              )}
            </div>
            {entry.xpEarned && entry.xpEarned > 0 && (
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <Zap className="h-3 w-3" />
                +{entry.xpEarned}
              </span>
            )}
          </div>

          {/* Value (for progress logs) */}
          {entry.value && entry.activityType === 'progress' && (
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Logged {entry.value}
            </p>
          )}

          {/* Notes */}
          {entry.notes ? (
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {entry.notes}
            </p>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500 italic">
              {getNoNoteMessage(entry)}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function getEntryStyle(entry: JournalEntry) {
  if (entry.activityType === 'completed') {
    return {
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      iconBg: 'bg-green-100 dark:bg-green-900/50',
      iconColor: 'text-green-500',
      borderColor: 'bg-green-400 dark:bg-green-500',
    }
  }

  if (entry.activityType === 'progress') {
    return {
      icon: <TrendingUp className="h-4 w-4 text-indigo-500" />,
      iconBg: 'bg-indigo-100 dark:bg-indigo-900/50',
      iconColor: 'text-indigo-500',
      borderColor: 'bg-indigo-400 dark:bg-indigo-500',
    }
  }

  if (entry.type === 'reflection') {
    return {
      icon: <Sparkles className="h-4 w-4 text-purple-500" />,
      iconBg: 'bg-purple-100 dark:bg-purple-900/50',
      iconColor: 'text-purple-500',
      borderColor: 'bg-purple-400 dark:bg-purple-500',
    }
  }

  // Default: watering (just checking in)
  return {
    icon: <Droplets className="h-4 w-4 text-blue-500" />,
    iconBg: 'bg-blue-100 dark:bg-blue-900/50',
    iconColor: 'text-blue-500',
    borderColor: 'bg-blue-400 dark:bg-blue-500',
  }
}

function getNoNoteMessage(entry: JournalEntry): string {
  if (entry.activityType === 'completed') return 'Did it today!'
  if (entry.activityType === 'progress') return 'Progress logged'
  return 'Showed up today'
}

function formatEntryDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function JournalEmptyState() {
  return (
    <div className="text-center py-12 px-4">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 mb-4">
        <BookOpen className="h-8 w-8 text-slate-400 dark:text-slate-500" />
      </div>
      <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">
        Start Your Journey
      </h4>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[240px] mx-auto leading-relaxed">
        Add notes when you water or log progress.
        <br />
        They become memories here.
      </p>
    </div>
  )
}

/**
 * Compact version for showing recent entries
 */
interface RecentEntriesProps {
  entries: JournalEntry[]
  limit?: number
}

export function RecentEntries({ entries, limit = 3 }: RecentEntriesProps) {
  const recentWithNotes = entries
    .filter(e => e.notes && e.notes.trim().length > 0)
    .slice(0, limit)

  if (recentWithNotes.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {recentWithNotes.map(entry => (
        <div
          key={entry.id}
          className="p-3 rounded-lg bg-slate-50/80 dark:bg-slate-800/40"
        >
          <p className="text-xs text-slate-400 mb-1">
            {formatEntryDate(entry.date)}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
            {entry.notes}
          </p>
        </div>
      ))}
    </div>
  )
}

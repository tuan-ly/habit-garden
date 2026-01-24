'use client'

import { useMemo } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { PlantPeriodStats } from '@/lib/actions/plants'
import { Droplets, FileText, TrendingUp, Calendar, Sparkles } from 'lucide-react'

interface StatsDetailSheetProps {
  stats: PlantPeriodStats | null
  open: boolean
  onOpenChange: (open: boolean) => void
  periodLabel?: string
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function StatsDetailSheet({
  stats,
  open,
  onOpenChange,
  periodLabel,
}: StatsDetailSheetProps) {
  // Combine and sort all logs by date
  const allLogs = useMemo(() => {
    if (!stats) return []

    const logs: Array<{
      type: 'watering' | 'goal'
      date: string
      time: string
      xp?: number
      value?: number
      notes?: string | null
    }> = []

    // Add watering logs
    for (const w of stats.waterings || []) {
      logs.push({
        type: 'watering',
        date: formatDate(w.watered_at),
        time: formatTime(w.watered_at),
        xp: w.xp_earned,
        notes: w.notes,
      })
    }

    // Add goal logs
    for (const g of stats.goal_logs || []) {
      logs.push({
        type: 'goal',
        date: formatDate(g.logged_at),
        time: formatTime(g.logged_at),
        value: g.value,
        notes: g.notes,
      })
    }

    // Sort by date (most recent first)
    return logs.sort((a, b) => {
      const dateA = new Date(a.date + ' ' + a.time).getTime()
      const dateB = new Date(b.date + ' ' + b.time).getTime()
      return dateB - dateA
    })
  }, [stats])

  if (!stats) return null

  const hasGoal = stats.has_goal && stats.goal_stats

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl">{stats.plant_icon}</span>
            </div>
            <div>
              <SheetTitle className="text-xl">{stats.plant_name}</SheetTitle>
              <SheetDescription className="text-sm">
                {stats.plant_type_name} • {periodLabel || 'Activity'}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {/* Stats Summary Cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Watering Count */}
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Droplets className="w-4 h-4 text-cyan-500" />
                <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">Waterings</span>
              </div>
              <span className="text-2xl font-bold text-cyan-700 dark:text-cyan-300">
                {stats.watering_count}
              </span>
            </div>

            {/* XP Earned */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-medium text-yellow-600 dark:text-yellow-400">XP Earned</span>
              </div>
              <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                {stats.total_xp}
              </span>
            </div>

            {/* Goal Stats (if applicable) */}
            {hasGoal && stats.goal_stats && (
              <>
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-violet-500" />
                    <span className="text-xs font-medium text-violet-600 dark:text-violet-400">
                      Total {stats.goal_unit || ''}
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                    {stats.goal_stats.total}
                  </span>
                </div>

                <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-violet-500" />
                    <span className="text-xs font-medium text-violet-600 dark:text-violet-400">Avg/Log</span>
                  </div>
                  <span className="text-2xl font-bold text-violet-700 dark:text-violet-300">
                    {stats.goal_stats.avg}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    (min: {stats.goal_stats.min}, max: {stats.goal_stats.max})
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Activity Log */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Activity Log ({allLogs.length} entries)
            </h3>

            {allLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <span className="text-3xl block mb-2">📝</span>
                <p className="text-sm">No activity recorded</p>
              </div>
            ) : (
              <div className="space-y-2">
                {allLogs.map((log, index) => (
                  <div
                    key={index}
                    className={cn(
                      'p-3 rounded-xl border',
                      log.type === 'watering'
                        ? 'bg-cyan-500/5 border-cyan-500/20'
                        : 'bg-violet-500/5 border-violet-500/20'
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {log.type === 'watering' ? '💧' : '📊'}
                        </span>
                        <span className="text-xs font-medium">
                          {log.date} at {log.time}
                        </span>
                      </div>
                      <div className="text-xs font-semibold">
                        {log.type === 'watering' ? (
                          <span className="text-yellow-600 dark:text-yellow-400">
                            +{log.xp} XP
                          </span>
                        ) : (
                          <span className="text-violet-600 dark:text-violet-400">
                            {log.value} {stats.goal_unit || ''}
                          </span>
                        )}
                      </div>
                    </div>
                    {log.notes && (
                      <p className="text-xs text-muted-foreground bg-black/5 dark:bg-white/5 rounded-lg p-2 mt-2">
                        {log.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

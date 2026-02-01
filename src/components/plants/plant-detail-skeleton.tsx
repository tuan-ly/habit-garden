'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface PlantDetailSkeletonProps {
  tab: 'overview' | 'journal' | 'stats'
}

export function PlantDetailSkeleton({ tab }: PlantDetailSkeletonProps) {
  if (tab === 'overview') {
    return <OverviewSkeleton />
  }
  if (tab === 'journal') {
    return <JournalSkeleton />
  }
  return <StatsSkeleton />
}

function OverviewSkeleton() {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Why I Started card */}
      <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20">
        <div className="flex items-start gap-3">
          <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>

      {/* Quick rhythm view */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-3 rounded-full" />
          ))}
        </div>
      </div>

      {/* Action button */}
      <Skeleton className="h-12 w-full rounded-xl" />
    </div>
  )
}

function JournalSkeleton() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Journal Timeline */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />

        {/* Entry cards */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50',
              'bg-white/50 dark:bg-slate-800/30'
            )}
          >
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />

        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/40"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-40" />
                </div>
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Moisture & Growth */}
      <div className="rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 p-4 space-y-4">
        {/* Moisture */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>

        {/* Growth */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-lg" />
              <Skeleton className="h-4 w-14" />
            </div>
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full" />
        </div>
      </div>

      {/* Streak stats */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-20" />
        <div className="grid grid-cols-4 gap-2">
          <div className="col-span-2 p-3 rounded-xl bg-orange-50/50 dark:bg-orange-950/20">
            <Skeleton className="h-3 w-12 mx-auto mb-1" />
            <Skeleton className="h-7 w-8 mx-auto" />
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60">
            <Skeleton className="h-3.5 w-3.5 mx-auto mb-1 rounded-full" />
            <Skeleton className="h-5 w-6 mx-auto" />
          </div>
          <div className="p-2.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/60">
            <Skeleton className="h-3.5 w-3.5 mx-auto mb-1 rounded-full" />
            <Skeleton className="h-5 w-6 mx-auto" />
          </div>
        </div>
      </div>

      {/* Activity Rhythm */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-28" />
        <div className="rounded-2xl bg-slate-900/80 p-4 space-y-4">
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-3 rounded-full bg-slate-700" />
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-700/50">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="text-center">
                <Skeleton className="h-5 w-6 mx-auto bg-slate-700" />
                <Skeleton className="h-2 w-12 mx-auto mt-1 bg-slate-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

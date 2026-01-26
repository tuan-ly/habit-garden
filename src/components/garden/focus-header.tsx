'use client'

import { cn } from '@/lib/utils'

interface FocusHeaderProps {
  completed: number
  total: number
  urgent: number
  className?: string
}

export function FocusHeader({ completed, total, urgent, className }: FocusHeaderProps) {
  const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0
  const remaining = total - completed

  return (
    <div className={cn(
      "fixed top-28 sm:top-16 left-1/2 -translate-x-1/2 z-20 pointer-events-none w-full max-w-sm px-4",
      className
    )}>
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-lg p-3">
        {/* Progress bar */}
        <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
          {/* Shimmer effect */}
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-300">
              Today: <span className="font-bold text-white">{completed}/{total}</span>
            </span>
            {urgent > 0 && (
              <span className="flex items-center gap-1 text-amber-400 font-medium animate-pulse">
                <span className="text-sm">🔥</span>
                {urgent} urgent
              </span>
            )}
          </div>
          {remaining > 0 ? (
            <span className="text-slate-400">
              {remaining} to go
            </span>
          ) : (
            <span className="text-emerald-400 font-medium flex items-center gap-1">
              <span className="text-sm">✨</span>
              All done!
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

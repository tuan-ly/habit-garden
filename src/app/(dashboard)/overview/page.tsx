'use client'

import { useState, useEffect, useTransition } from 'react'
import { ChevronLeft, ChevronRight, Droplets, Sparkles, TreeDeciduous } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { StatsGarden } from '@/components/garden/stats-garden'
import { getGardenStats, type GardenStatsData } from '@/lib/actions/plants'

type Period = 'day' | 'week' | 'month' | 'year'

// Format date as YYYY-MM-DD in local timezone (not UTC)
function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Format date display based on period
function formatPeriodDisplay(period: Period, date: Date): string {
  switch (period) {
    case 'day':
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    case 'week': {
      const startOfWeek = new Date(date)
      const dayOfWeek = startOfWeek.getDay()
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      startOfWeek.setDate(startOfWeek.getDate() + diffToMonday)
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)

      return `${startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    case 'month':
      return date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    case 'year':
      return date.getFullYear().toString()
  }
}

// Navigate date based on period
function navigateDate(date: Date, period: Period, direction: 'prev' | 'next'): Date {
  const newDate = new Date(date)
  const delta = direction === 'next' ? 1 : -1

  switch (period) {
    case 'day':
      newDate.setDate(newDate.getDate() + delta)
      break
    case 'week':
      newDate.setDate(newDate.getDate() + delta * 7)
      break
    case 'month':
      newDate.setMonth(newDate.getMonth() + delta)
      break
    case 'year':
      newDate.setFullYear(newDate.getFullYear() + delta)
      break
  }

  return newDate
}

export default function OverviewPage() {
  const [period, setPeriod] = useState<Period>('month')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [stats, setStats] = useState<GardenStatsData | null>(null)
  const [isPending, startTransition] = useTransition()

  // Load stats when period or date changes
  useEffect(() => {
    startTransition(async () => {
      const dateStr = formatDateLocal(currentDate)
      const data = await getGardenStats(period, dateStr)
      setStats(data)
    })
  }, [period, currentDate])

  const handlePrevious = () => {
    setCurrentDate((prev) => navigateDate(prev, period, 'prev'))
  }

  const handleNext = () => {
    const nextDate = navigateDate(currentDate, period, 'next')
    // Don't allow navigating to the future
    if (nextDate <= new Date()) {
      setCurrentDate(nextDate)
    }
  }

  // Check if we can go to next (not future)
  const canGoNext = navigateDate(currentDate, period, 'next') <= new Date()

  return (
    <div className="h-full flex flex-col relative">
      {/* Header section with controls and stats - now a transparent overlay */}
      <div className="sticky top-0 z-40 transition-all px-4 pt-4 pb-2 space-y-4">
        {/* Main Controls Container */}
        <div className="max-w-md mx-auto bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-1.5 relative z-50 overflow-hidden">
          {/* Subtle Glow Effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

          <div className="flex flex-col gap-1 relative z-10">
            {/* Period selector tabs */}
            <div className="flex justify-center">
              <div className="flex w-full gap-1 p-1 rounded-2xl bg-black/20">
                {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={cn(
                      'flex-1 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-300',
                      period === p
                        ? 'bg-white text-slate-900 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Date navigation */}
            <div className="flex items-center justify-between px-2 py-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10 rounded-xl shrink-0"
                onClick={handlePrevious}
                disabled={isPending}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>

              <span className="text-sm sm:text-base font-black text-white tracking-tight drop-shadow-sm truncate px-2">
                {formatPeriodDisplay(period, currentDate)}
              </span>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-white/80 hover:text-white hover:bg-white/10 rounded-xl shrink-0"
                onClick={handleNext}
                disabled={isPending || !canGoNext}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Summary - Floating Cards */}
        {stats && (
          <div className="flex justify-center gap-3 animate-in fade-in zoom-in-95 duration-700 relative z-50">
            {[
              { label: 'Waterings', value: stats.totalWaterings, icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
              { label: 'Plants', value: stats.uniquePlants, icon: TreeDeciduous, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
              { label: 'Total XP', value: stats.totalXp, icon: Sparkles, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  "flex flex-col items-center min-w-[80px] sm:min-w-[100px] p-2 rounded-2xl",
                  "bg-slate-900/40 backdrop-blur-md border border-white/10 shadow-lg",
                  "transition-all hover:scale-105"
                )}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={cn("p-1.5 rounded-xl mb-1 border", stat.bg, stat.border)}>
                  <stat.icon className={cn("h-4 w-4 sm:h-5 sm:w-5", stat.color)} />
                </div>
                <span className="text-base sm:text-xl font-black text-white leading-none">{stat.value}</span>
                <span className="text-[10px] text-white/50 font-bold uppercase tracking-tighter mt-1">{stat.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Garden visualization area */}
      <div className="flex-1 relative overflow-hidden">
        {isPending ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-50">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
          </div>
        ) : stats ? (
          <StatsGarden
            waterings={stats.waterings}
            weather={stats.weather}
            maxDisplay={period === 'year' ? 100 : period === 'month' ? 50 : 30}
            className="h-full"
            skyContained={false}
          />
        ) : (
          <div className="h-full flex items-center justify-center relative z-10">
            <div className="text-center p-6 max-w-xs bg-black/20 backdrop-blur-md rounded-3xl border border-white/10">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 rounded-2xl bg-white/10 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">📊</span>
              </div>
              <p className="text-sm sm:text-base text-white font-bold">No data available</p>
              <p className="text-xs sm:text-sm text-white/60 mt-1">Start watering your plants to see activity here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

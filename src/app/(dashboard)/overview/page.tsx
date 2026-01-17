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
    <div className="min-h-full flex flex-col">
      {/* Header section with controls and stats */}
      <div className="bg-background/80 backdrop-blur-md border-b sticky top-0 z-40 transition-all">
        {/* Period selector tabs */}
        <div className="flex justify-center py-2 px-2">
          <div className="flex gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-lg bg-muted/50">
            {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-2.5 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all',
                  period === p
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Date navigation */}
        <div className="flex items-center justify-center gap-1 sm:gap-2 py-2 px-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={handlePrevious}
            disabled={isPending}
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <span className="text-sm sm:text-lg font-semibold min-w-40 sm:min-w-50 text-center">
            {formatPeriodDisplay(period, currentDate)}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={handleNext}
            disabled={isPending || !canGoNext}
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {/* Stats summary */}
        {stats && (
          <div className="px-2 sm:px-4 py-2 sm:py-3 animate-in fade-in slide-in-from-top-2 duration-500">
            <div className="flex justify-center gap-4 sm:gap-8">
              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
                  <p className="text-base sm:text-xl font-bold">{stats.totalWaterings}</p>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Waterings</p>
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <TreeDeciduous className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                  <p className="text-base sm:text-xl font-bold">{stats.uniquePlants}</p>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">Plants</p>
              </div>

              <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                  <p className="text-base sm:text-xl font-bold">{stats.totalXp}</p>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-medium">XP</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Garden visualization area */}
      <div className="flex-1 relative overflow-hidden">
        {isPending ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-sm z-50">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          </div>
        ) : stats ? (
          <StatsGarden
            waterings={stats.waterings}
            weather={stats.weather}
            maxDisplay={period === 'year' ? 100 : period === 'month' ? 50 : 30}
            className="h-full "
            skyContained={true}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center p-6 max-w-xs">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 rounded-xl sm:rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">📊</span>
              </div>
              <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">No data available</p>
              <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 mt-1">Start watering your plants to see activity here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

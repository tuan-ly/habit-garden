'use client'

import { useState, useEffect, useTransition, useCallback, useRef } from 'react'
import { ChevronLeft, ChevronRight, Droplets, Sparkles, TreeDeciduous } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { StatsGarden } from '@/components/garden/stats-garden'
import { StatsDetailSheet } from '@/components/garden/stats-detail-sheet'
import { getAggregatedGardenStats, type AggregatedGardenStats, type PlantPeriodStats } from '@/lib/actions/plants'

type Period = 'day' | 'week' | 'month' | 'year'

// Format date as YYYY-MM-DD in local timezone (not UTC)
function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

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

interface OverviewClientProps {
  initialPeriod: Period
  initialStats: AggregatedGardenStats | null
}

export default function OverviewClient({ initialPeriod, initialStats }: OverviewClientProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [stats, setStats] = useState<AggregatedGardenStats | null>(initialStats)
  const [isPending, startTransition] = useTransition()
  const isFirstRun = useRef(true)

  const [selectedPlant, setSelectedPlant] = useState<PlantPeriodStats | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  // Only fetch on client if period/date changes from initial SSR values.
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    startTransition(async () => {
      const dateStr = formatDateLocal(currentDate)
      const data = await getAggregatedGardenStats(period, dateStr)
      setStats(data)
    })
  }, [period, currentDate])

  const handlePrevious = () => {
    setCurrentDate((prev) => navigateDate(prev, period, 'prev'))
  }

  const handleNext = () => {
    const nextDate = navigateDate(currentDate, period, 'next')
    if (nextDate <= new Date()) {
      setCurrentDate(nextDate)
    }
  }

  const handlePlantClick = useCallback((plant: PlantPeriodStats) => {
    setSelectedPlant(plant)
    setDetailOpen(true)
  }, [])

  const canGoNext = navigateDate(currentDate, period, 'next') <= new Date()
  const periodLabel = formatPeriodDisplay(period, currentDate)

  const headerContent = (
    <div className="px-4 pt-4 pb-2 space-y-3">
      <div className="max-w-md mx-auto bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-1.5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <div className="flex flex-col gap-1 relative z-10">
          <div className="flex justify-center">
            <div className="flex w-full gap-1 p-1 rounded-xl bg-black/20">
              {(['day', 'week', 'month', 'year'] as Period[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={cn(
                    'flex-1 px-3 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all duration-300',
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
          <div className="flex items-center justify-between px-2 py-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-lg shrink-0"
              onClick={handlePrevious}
              disabled={isPending}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs sm:text-sm font-black text-white tracking-tight drop-shadow-sm truncate px-2">
              {periodLabel}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white/80 hover:text-white hover:bg-white/10 rounded-lg shrink-0"
              onClick={handleNext}
              disabled={isPending || !canGoNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {stats && (
        <div className="flex justify-center gap-2 animate-in fade-in zoom-in-95 duration-500">
          {[
            { label: 'Waterings', value: stats.totalWaterings, icon: Droplets, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
            { label: 'Plants', value: stats.uniquePlants, icon: TreeDeciduous, color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' },
            { label: 'Total XP', value: stats.totalXp, icon: Sparkles, color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20' },
          ].map((stat, i) => (
            <div
              key={stat.label}
              className={cn(
                'flex items-center gap-1.5 px-2 py-1 rounded-lg',
                'bg-slate-900/60 backdrop-blur-md border border-white/10 shadow-lg'
              )}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={cn('p-1 rounded-md border', stat.bg, stat.border)}>
                <stat.icon className={cn('h-3 w-3', stat.color)} />
              </div>
              <span className="text-xs font-black text-white leading-none">{stat.value}</span>
              <span className="text-[8px] text-white/50 font-bold uppercase tracking-tighter hidden sm:inline">{stat.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="h-full flex flex-col relative">
      <div className="flex-1 relative overflow-hidden">
        {isPending ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-sm z-50">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
          </div>
        ) : stats ? (
          <StatsGarden
            plants={stats.plants}
            weather={stats.weather}
            className="h-full"
            skyContained={false}
            timeOfDay="day"
            onPlantClick={handlePlantClick}
            headerContent={headerContent}
          />
        ) : (
          <StatsGarden
            plants={[]}
            weather={null}
            className="h-full"
            skyContained={false}
            timeOfDay="day"
            headerContent={headerContent}
          />
        )}
      </div>

      <StatsDetailSheet
        stats={selectedPlant}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        periodLabel={periodLabel}
      />
    </div>
  )
}

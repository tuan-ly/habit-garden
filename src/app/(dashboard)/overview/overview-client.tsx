'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Leaf,
  Loader2,
  Sprout,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getAggregatedGardenStats,
  type AggregatedGardenStats,
} from '@/lib/actions/plants'

type Period = 'day' | 'week' | 'month' | 'year'

function formatDateLocal(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatPeriodDisplay(period: Period, date: Date): string {
  const formatter = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' })
  if (period === 'day') {
    return new Intl.DateTimeFormat('vi-VN', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date)
  }
  if (period === 'week') {
    const start = new Date(date)
    const day = start.getDay()
    start.setDate(start.getDate() + (day === 0 ? -6 : 1 - day))
    const end = new Date(start)
    end.setDate(start.getDate() + 6)
    return `${start.getDate()}/${start.getMonth() + 1} – ${end.getDate()}/${end.getMonth() + 1}`
  }
  if (period === 'year') return `Năm ${date.getFullYear()}`
  return formatter.format(date)
}

function navigateDate(date: Date, period: Period, direction: 'prev' | 'next'): Date {
  const next = new Date(date)
  const delta = direction === 'next' ? 1 : -1
  if (period === 'day') next.setDate(next.getDate() + delta)
  if (period === 'week') next.setDate(next.getDate() + delta * 7)
  if (period === 'month') next.setMonth(next.getMonth() + delta)
  if (period === 'year') next.setFullYear(next.getFullYear() + delta)
  return next
}

function getGardenLetter(stats: AggregatedGardenStats | null): { title: string; body: string } {
  if (!stats || stats.totalWaterings === 0) {
    return {
      title: 'Trang này vẫn đang chờ câu chuyện của bạn',
      body: 'Một lần chăm cây, một ngày nghỉ có chủ ý, hay một ghi chú nhỏ đều có thể bắt đầu chương tiếp theo.',
    }
  }

  if (stats.uniquePlants === 1) {
    return {
      title: 'Một mối quan hệ đang bén rễ',
      body: `Bạn đã quay lại ${stats.totalWaterings} lần với cùng một cây. Nhịp nhỏ này đang trở thành một phần của khu vườn.`,
    }
  }

  return {
    title: 'Khu vườn đang tìm được nhịp riêng',
    body: `Bạn đã chăm ${stats.uniquePlants} cây qua ${stats.totalWaterings} khoảnh khắc. Không ngày nào cần hoàn hảo để câu chuyện tiếp tục.`,
  }
}

interface OverviewClientProps {
  initialPeriod: Period
  initialStats: AggregatedGardenStats | null
}

export default function OverviewClient({ initialPeriod, initialStats }: OverviewClientProps) {
  const [period, setPeriod] = useState<Period>(initialPeriod)
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [stats, setStats] = useState<AggregatedGardenStats | null>(initialStats)
  const [isPending, startTransition] = useTransition()
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    startTransition(async () => {
      const nextStats = await getAggregatedGardenStats(period, formatDateLocal(currentDate))
      setStats(nextStats)
    })
  }, [period, currentDate])

  const canGoNext = navigateDate(currentDate, period, 'next') <= new Date()
  const periodLabel = formatPeriodDisplay(period, currentDate)
  const letter = getGardenLetter(stats)
  const periodOptions: Array<{ value: Period; label: string }> = [
    { value: 'week', label: 'Tuần' },
    { value: 'month', label: 'Tháng' },
    { value: 'year', label: 'Năm' },
  ]

  return (
    <div className="relative h-full overflow-y-auto bg-[#edf1e7] pb-32 text-[#293e27]">
      <Image
        src="/garden/backgrounds/sanctuary-golden-hour.webp"
        alt=""
        fill
        sizes="100vw"
        className="fixed object-cover opacity-25"
      />
      <div className="fixed inset-0 bg-[#f7f2e8]/72 backdrop-blur-[2px]" aria-hidden="true" />

      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <header className="flex items-center justify-between py-2">
          <Link
            href="/garden"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white/70 px-3.5 text-sm font-bold text-[#59704f] shadow-sm backdrop-blur-xl"
          >
            <Leaf className="h-4 w-4 fill-[#789a68]/20" />
            Về vườn
          </Link>
          <div className="text-right">
            <p className="font-display text-2xl font-semibold text-[#315027]">Hành trình</p>
            <p className="text-xs text-[#74806e]">Những mùa bạn đã đi qua</p>
          </div>
        </header>

        <section className="mt-5 overflow-hidden rounded-[2rem] border border-white/80 bg-[#fffaf0]/88 p-5 shadow-[0_18px_50px_rgba(58,82,49,0.12)] backdrop-blur-xl sm:p-7">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#7b936e]">
            <Sprout className="h-4 w-4" />
            Thư từ khu vườn
          </div>
          <h1 className="mt-3 font-display text-2xl font-semibold leading-tight text-[#315027] sm:text-3xl">
            {letter.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#667361] sm:text-base">
            {letter.body}
          </p>
        </section>

        <section className="mt-5 rounded-[1.75rem] border border-white/70 bg-white/65 p-3 shadow-[0_14px_38px_rgba(58,82,49,0.09)] backdrop-blur-xl">
          <div className="grid grid-cols-3 gap-1 rounded-full bg-[#e5ebdc] p-1">
            {periodOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPeriod(option.value)}
                className={cn(
                  'min-h-10 rounded-full px-3 text-sm font-bold transition',
                  period === option.value
                    ? 'bg-[#5f854f] text-white shadow-[0_6px_15px_rgba(69,105,57,0.2)]'
                    : 'text-[#67745f] hover:bg-white/55'
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="mt-2 flex items-center justify-between px-1">
            <button
              type="button"
              onClick={() => setCurrentDate((previous) => navigateDate(previous, period, 'prev'))}
              disabled={isPending}
              className="grid h-11 w-11 place-items-center rounded-full text-[#62745a] hover:bg-white/60 disabled:opacity-40"
              aria-label="Kỳ trước"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="flex items-center gap-2 text-sm font-bold capitalize text-[#40583a]">
              <CalendarDays className="h-4 w-4 text-[#789a68]" />
              {periodLabel}
            </p>
            <button
              type="button"
              onClick={() => setCurrentDate((previous) => navigateDate(previous, period, 'next'))}
              disabled={isPending || !canGoNext}
              className="grid h-11 w-11 place-items-center rounded-full text-[#62745a] hover:bg-white/60 disabled:opacity-30"
              aria-label="Kỳ sau"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        <section className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-[1.5rem] bg-[#31523b]/92 p-4 text-[#fff9e8] shadow-[0_16px_35px_rgba(36,74,45,0.17)]">
            <Droplets className="h-5 w-5 text-[#dce9b8]" />
            <p className="mt-4 font-display text-3xl font-semibold">{stats?.totalWaterings ?? 0}</p>
            <p className="mt-1 text-xs text-[#dce5d0]">khoảnh khắc chăm cây</p>
          </div>
          <div className="rounded-[1.5rem] bg-[#fffaf0]/90 p-4 text-[#315027] shadow-[0_16px_35px_rgba(58,82,49,0.1)]">
            <Leaf className="h-5 w-5 fill-[#789a68]/20 text-[#6f925e]" />
            <p className="mt-4 font-display text-3xl font-semibold">{stats?.uniquePlants ?? 0}</p>
            <p className="mt-1 text-xs text-[#6d7a67]">cây cùng viết nên kỳ này</p>
          </div>
        </section>

        <section className="mt-7">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="font-display text-xl font-semibold text-[#315027]">Các chương đang sống</p>
              <p className="mt-1 text-sm text-[#6f7d69]">Mở một cây để xem lại những lần bạn đã hiện diện.</p>
            </div>
            {isPending && <Loader2 className="h-5 w-5 animate-spin text-[#6f925e]" />}
          </div>

          <div className="mt-3 overflow-hidden rounded-[1.75rem] border border-white/70 bg-[#fffaf0]/78 shadow-[0_16px_42px_rgba(58,82,49,0.1)] backdrop-blur-xl">
            {stats?.plants.length ? (
              stats.plants.map((plant, index) => (
                <Link
                  key={plant.plant_id}
                  href={`/overview/${plant.plant_id}`}
                  className={cn(
                    'flex min-h-[5.5rem] w-full items-center gap-4 px-4 text-left transition hover:bg-white/55',
                    index > 0 && 'border-t border-[#dfe6d7]'
                  )}
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#e4ecd9] text-[#5f854f]">
                    <Leaf className="h-6 w-6 fill-[#789a68]/20" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate font-bold text-[#334d2e]">{plant.plant_name}</p>
                      <span className="shrink-0 text-xs font-semibold text-[#71806b]">
                        {plant.watering_count} lần
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#dfe6d7]">
                      <div
                        className="h-full rounded-full bg-[#789a68]"
                        style={{ width: `${Math.min(100, plant.growth_percentage)}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-[#74806e]">
                      {plant.goal_stats?.count
                        ? `${plant.goal_stats.count} lần ghi nhận tiến trình`
                        : 'Mỗi lần quay lại đều được giữ trong chương này'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-[#8a9983]" />
                </Link>
              ))
            ) : (
              <div className="px-5 py-8 text-center">
                <Sprout className="mx-auto h-8 w-8 text-[#789a68]" />
                <p className="mt-3 font-bold text-[#40583a]">Chưa có chương nào trong kỳ này</p>
                <p className="mt-1 text-sm text-[#75816f]">Trở về vườn và chăm một cây để bắt đầu.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

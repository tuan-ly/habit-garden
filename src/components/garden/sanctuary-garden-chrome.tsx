'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useUser } from '@/lib/context/dashboard-data-context'
import { cn } from '@/lib/utils'
import type { PlantWithType } from '@/types/database'
import {
  Check,
  ChevronRight,
  Clock3,
  Leaf,
  MapPinned,
  Moon,
  Plus,
  Sparkles,
  Sprout,
  X,
} from 'lucide-react'

interface SanctuaryGardenChromeProps {
  activePlant: PlantWithType | null
  focusedPlant?: PlantWithType | null
  activePlantCompleted?: boolean
  focusClosing?: boolean
  completedCount: number
  totalCount: number
  isSyncing?: boolean
  welcomeBackDays?: number
  onPrimaryAction: () => void
  onTinyAction: () => void
  onRestAction: () => void
  onOpenDetails: () => void
  onCloseFocus: () => void
  onAddPlant: () => void
}

function getGardenDate(): string {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date())
}

function getTeaser(plant: PlantWithType | null): string {
  if (!plant) return 'Một hạt giống mới đang chờ bạn'
  const growth = Math.max(0, Math.min(100, plant.growth_percentage))
  if (growth >= 90) return 'Một mùa nở hoa đang rất gần'
  if (growth >= 60) return 'Tán lá mới đang dần mở ra'
  if (growth >= 35) return 'Rễ đã vững hơn sau mỗi lần chăm'
  if (growth >= 15) return 'Chồi non đang tìm ánh sáng'
  return 'Mầm nhỏ đã bắt đầu thức giấc'
}

function getVisitCopy(plant: PlantWithType, isComplete: boolean): string {
  if (isComplete) return 'Cây đang giữ lại khoảnh khắc bạn vừa hiện diện.'
  if (plant.status === 'sleeping' || plant.status === 'waiting') {
    return 'Cây đang yên nghỉ. Một bước thật nhỏ cũng đủ để đánh thức nó.'
  }
  return plant.tiny_seed || 'Hôm nay cây chỉ cần một chút hiện diện từ bạn.'
}

export function SanctuaryGardenChrome({
  activePlant,
  focusedPlant = null,
  activePlantCompleted = false,
  focusClosing = false,
  completedCount,
  totalCount,
  isSyncing = false,
  welcomeBackDays = 0,
  onPrimaryAction,
  onTinyAction,
  onRestAction,
  onOpenDetails,
  onCloseFocus,
  onAddPlant,
}: SanctuaryGardenChromeProps) {
  const user = useUser()
  const allDone = totalCount > 0 && completedCount >= totalCount
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0
  const initials = (user?.user_metadata?.full_name || user?.email || 'G')
    .trim()
    .charAt(0)
    .toUpperCase()

  return (
    <div className="pointer-events-none absolute inset-0 z-40 mx-auto w-full max-w-[520px] overflow-hidden text-[#263f22]">
      <header className="pointer-events-auto absolute inset-x-0 top-0 flex items-start justify-between px-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <Link
          href="/overview"
          className="group flex min-h-12 items-center gap-2 rounded-full border border-white/65 bg-[#fffaf0]/88 px-3.5 text-sm font-semibold text-[#49693f] shadow-[0_10px_30px_rgba(41,69,38,0.13)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789a68]"
          aria-label="Mở hành trình"
        >
          <MapPinned className="h-5 w-5" />
          <span className="hidden min-[380px]:inline">Hành trình</span>
        </Link>

        <div className="min-w-0 px-3 text-center drop-shadow-[0_1px_0_rgba(255,255,255,0.7)]">
          <p className="font-display text-lg font-semibold leading-tight text-[#476f37] sm:text-xl">
            Khu vườn hôm nay
          </p>
          <p className="mt-1 text-xs font-medium capitalize text-[#5d7655]">
            {getGardenDate()}
          </p>
        </div>

        <Link
          href="/profile"
          className="rounded-full bg-[#fffaf0]/90 p-1.5 shadow-[0_10px_30px_rgba(41,69,38,0.13)] ring-1 ring-white/70 backdrop-blur-xl transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789a68]"
          aria-label="Mở hồ sơ"
        >
          <Avatar className="h-9 w-9">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt="" />
            <AvatarFallback className="bg-[#dce8cb] text-sm font-bold text-[#49693f]">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Link>
      </header>

      <section
        className={cn(
          'absolute left-1/2 top-[5.6rem] -translate-x-1/2 text-center transition-all duration-300 sm:top-[6.25rem]',
          focusedPlant && 'pointer-events-none -translate-y-3 opacity-0'
        )}
      >
        <div
          className="relative grid h-[4.4rem] w-[4.4rem] place-items-center rounded-full p-[6px] shadow-[0_12px_35px_rgba(38,65,32,0.16)]"
          style={{
            background: `conic-gradient(#5d8a48 ${progress * 3.6}deg, rgba(255,250,240,0.72) 0deg)`,
          }}
          role="img"
          aria-label={`Đã chăm ${completedCount} trên ${totalCount} cây hôm nay`}
        >
          <div className="grid h-full w-full place-items-center rounded-full bg-[#fffaf0]/94 font-display text-xl font-semibold text-[#315027] backdrop-blur-md">
            {completedCount}/{totalCount}
          </div>
        </div>
        {welcomeBackDays >= 3 && (
          <p className="mt-2 whitespace-nowrap rounded-full bg-[#fffaf0]/78 px-3 py-1 text-[11px] font-medium text-[#58704d] backdrop-blur-md">
            Khu vườn vẫn ở đây, chờ bạn trở lại
          </p>
        )}
      </section>

      {activePlant && !focusedPlant && (
        <button
          type="button"
          onClick={onOpenDetails}
          className="pointer-events-auto absolute left-1/2 top-[11.7rem] max-w-[82%] -translate-x-1/2 rounded-2xl border border-white/70 bg-[#fffaf0]/90 px-4 py-2.5 text-left shadow-[0_10px_30px_rgba(45,72,38,0.14)] backdrop-blur-xl transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789a68] sm:top-[12.5rem]"
        >
          <span className="flex items-center justify-center gap-2 text-sm font-bold text-[#315027]">
            <Leaf className="h-4 w-4 fill-[#6f995b]/20 text-[#628a50]" />
            <span className="max-w-[14rem] truncate">{activePlant.name}</span>
            <ChevronRight className="h-4 w-4 text-[#789a68]" />
          </span>
          <span className="mt-0.5 block text-center text-xs text-[#61725b]">
            {allDone ? 'đã được chăm hôm nay' : 'một bước nhỏ là đủ'}
          </span>
        </button>
      )}

      <div className="pointer-events-auto absolute inset-x-3 bottom-[max(1rem,env(safe-area-inset-bottom))] sm:inset-x-5">
        {focusedPlant ? (
          <section
            role="dialog"
            aria-modal="false"
            aria-labelledby="sanctuary-focus-title"
            className={cn(
              'rounded-[2rem] border border-white/70 bg-[#fffaf0]/95 px-4 pb-4 pt-3 text-[#2f472a] shadow-[0_24px_70px_rgba(20,47,29,0.32)] backdrop-blur-2xl transition-all duration-300 ease-out motion-reduce:duration-150',
              focusClosing ? 'translate-y-[115%] opacity-0' : 'translate-y-0 opacity-100'
            )}
          >
            <div className="mx-auto h-1.5 w-11 rounded-full bg-[#cbd8bf]" aria-hidden="true" />

            <div className="mt-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[#78906d]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Đang đến thăm
                </p>
                <h2 id="sanctuary-focus-title" className="mt-1 truncate font-display text-2xl font-semibold text-[#315027]">
                  {focusedPlant.name}
                </h2>
                <p className="mt-1 text-sm leading-5 text-[#687763]">
                  {getVisitCopy(focusedPlant, activePlantCompleted)}
                </p>
              </div>
              <button
                type="button"
                onClick={onCloseFocus}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e7edda] text-[#49633f] transition hover:bg-[#dce6ce] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789a68]"
                aria-label={`Rời ${focusedPlant.name}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-3 flex items-center gap-3 rounded-2xl bg-[#edf2e6] px-3 py-2.5">
              <Sprout className="h-5 w-5 shrink-0 text-[#6f925e]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#58704f]">
                  <span>Chặng lớn lên tiếp theo</span>
                  <span>{Math.round(Math.min(100, focusedPlant.growth_percentage))}%</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/85">
                  <div
                    className="h-full rounded-full bg-[#789a68] transition-[width] duration-500"
                    style={{ width: `${Math.min(100, focusedPlant.growth_percentage)}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-[1fr_1.18fr_1fr] items-end gap-2">
              <button
                type="button"
                onClick={onTinyAction}
                disabled={activePlantCompleted || isSyncing}
                className="flex min-h-14 items-center justify-center gap-1.5 rounded-full border border-[#d9e3d0] bg-white/80 px-2 text-xs font-semibold text-[#49693f] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
              >
                <Clock3 className="h-4 w-4" />
                2 phút
              </button>
              <button
                type="button"
                onClick={onPrimaryAction}
                disabled={activePlantCompleted || isSyncing}
                className="flex min-h-16 items-center justify-center gap-2 rounded-full border-2 border-white bg-[#496d3d] px-3 font-bold text-[#fffaf0] shadow-[0_10px_24px_rgba(46,82,45,0.24)] transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transform-none"
              >
                {activePlantCompleted ? <Check className="h-5 w-5" /> : <Leaf className="h-5 w-5 fill-current/25" />}
                {activePlantCompleted ? 'Đã chăm' : 'Chăm cây'}
              </button>
              <button
                type="button"
                onClick={onRestAction}
                disabled={activePlantCompleted || isSyncing}
                className="flex min-h-14 items-center justify-center gap-1.5 rounded-full border border-[#d9e3d0] bg-white/80 px-2 text-xs font-semibold text-[#625f4f] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transform-none"
              >
                <Moon className="h-4 w-4" />
                Nghỉ
              </button>
            </div>
          </section>
        ) : (
        <div className="rounded-[2rem] border border-white/55 bg-[#314b36]/72 px-4 pb-4 pt-3 shadow-[0_24px_70px_rgba(20,47,29,0.35)] backdrop-blur-2xl">
          {activePlant ? (
            <>
              <div className="grid grid-cols-[1fr_1.28fr_1fr] items-end gap-2">
                <button
                  type="button"
                  onClick={onTinyAction}
                  disabled={allDone || isSyncing}
                  className="flex min-h-[4.75rem] flex-col items-center justify-center gap-1 rounded-full border border-white/50 bg-[#fffaf0]/92 px-2 text-xs font-semibold text-[#49693f] shadow-[0_8px_24px_rgba(18,45,26,0.18)] transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transform-none"
                >
                  <Clock3 className="h-5 w-5" />
                  2 phút
                </button>

                <button
                  type="button"
                  onClick={onPrimaryAction}
                  disabled={allDone || isSyncing}
                  className={cn(
                    'flex min-h-[6rem] flex-col items-center justify-center gap-1 rounded-full border-2 border-white/75 bg-[#fffaf0] px-3 font-bold text-[#416633] shadow-[0_14px_35px_rgba(13,37,20,0.28)] transition hover:-translate-y-1.5 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transform-none',
                    !allDone && 'sanctuary-primary-pulse'
                  )}
                >
                  {allDone ? <Check className="h-8 w-8" /> : <Leaf className="h-8 w-8 fill-[#6f995b]/35" />}
                  <span>{allDone ? 'Đã xong' : 'Đã làm'}</span>
                </button>

                <button
                  type="button"
                  onClick={onRestAction}
                  disabled={allDone || isSyncing}
                  className="flex min-h-[4.75rem] flex-col items-center justify-center gap-1 rounded-full border border-white/50 bg-[#fffaf0]/92 px-2 text-xs font-semibold text-[#625f4f] shadow-[0_8px_24px_rgba(18,45,26,0.18)] transition hover:-translate-y-1 disabled:cursor-not-allowed disabled:opacity-55 motion-reduce:transform-none"
                >
                  <Moon className="h-5 w-5" />
                  Nghỉ
                </button>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2 text-center text-xs font-medium text-[#f7f0d9]">
                <Sprout className="h-4 w-4 text-[#dce9b8]" />
                <span>{allDone ? 'Khu vườn có thể yên nghỉ hôm nay' : getTeaser(activePlant)}</span>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={onAddPlant}
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#fffaf0] px-5 font-bold text-[#416633] shadow-[0_12px_30px_rgba(13,37,20,0.25)]"
            >
              <Plus className="h-5 w-5" />
              Gieo hạt giống đầu tiên
            </button>
          )}
        </div>
        )}
      </div>
    </div>
  )
}

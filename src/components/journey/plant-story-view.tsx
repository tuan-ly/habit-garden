'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpenText,
  Check,
  ChevronDown,
  ChevronRight,
  CircleCheck,
  Leaf,
  MessageCircleMore,
  Moon,
  Sprout,
} from 'lucide-react'
import { PlantImage } from '@/components/plants/plant-image'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import type {
  PlantStoryChapter,
  PlantStoryEntry,
  PlantStoryPlant,
  PlantStorySnapshot,
} from '@/lib/plant-story'
import type { PlantWithType } from '@/types/database'

interface PlantStoryViewProps {
  story: PlantStorySnapshot
}

type ArchiveFilter = 'all' | 'notes'

function asPlantImageModel(plant: PlantStoryPlant): PlantWithType {
  return {
    id: plant.id,
    name: plant.name,
    status: plant.status,
    growth_percentage: plant.growthPercentage,
    visual_stage: plant.visualStage,
    grid_size: plant.gridSize,
    current_moisture: 100,
    plant_type: {
      id: plant.plantType.id,
      name: plant.plantType.name,
      name_vi: plant.plantType.nameVi,
      icon: plant.plantType.icon,
    },
  } as PlantWithType
}

function formatDate(date: string, options: Intl.DateTimeFormatOptions): string {
  const [year, month, day] = date.slice(0, 10).split('-').map(Number)
  return new Intl.DateTimeFormat('vi-VN', options).format(new Date(year, month - 1, day))
}

function getMonthLabel(monthKey: string): string {
  const [, month] = monthKey.split('-').map(Number)
  return `Tháng ${month}`
}

function getCurrentChapterHeading(chapter: PlantStoryChapter): string {
  const [, theme] = chapter.subtitle.split(' · ')
  if (theme) return theme.replace(/^./, (character) => character.toUpperCase())
  if (chapter.entryCount > 0) return 'Nhịp tháng này'
  return 'Một chương mới đang chờ'
}

function getCurrentChapterSummary(chapter: PlantStoryChapter): string {
  if (chapter.entryCount === 0) return chapter.subtitle
  return `${chapter.entryCount} khoảnh khắc · ${chapter.activeDayCount} ngày hiện diện`
}

function StoryEntryIcon({ entry }: { entry: PlantStoryEntry }) {
  if (entry.activityType === 'reflection') {
    return <MessageCircleMore className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
  }
  if (entry.activityType === 'completed') {
    return <CircleCheck className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
  }
  if (entry.activityType === 'progress') {
    return <Sprout className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
  }
  if (entry.activityType === 'rest_day') {
    return <Moon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
  }
  return <Leaf className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
}

function StoryEntryRow({ entry, compact = false }: { entry: PlantStoryEntry; compact?: boolean }) {
  const readableDate = formatDate(entry.date, { day: 'numeric', month: 'long' })

  return (
    <article
      className={cn(
        'grid grid-cols-[2.5rem_5.75rem_minmax(0,1fr)] items-start gap-3 py-4 sm:grid-cols-[2.75rem_7rem_minmax(0,1fr)]',
        compact && 'py-3.5'
      )}
    >
      <div className="grid h-10 w-10 place-items-center rounded-full bg-[#e5edd7] text-[#5e7e52]">
        <StoryEntryIcon entry={entry} />
      </div>
      <p className="pt-2 text-sm font-extrabold text-[#355132]">
        {readableDate}
      </p>
      <div className="min-w-0 pt-1">
        {entry.note ? (
          <>
            <p className="text-sm leading-6 text-[#354433] sm:text-base">{entry.note}</p>
            <p className="mt-1 text-xs font-bold text-[#7b8875]">{entry.title}</p>
          </>
        ) : (
          <p className="text-sm leading-6 text-[#354433] sm:text-base">{entry.title}</p>
        )}
        {entry.isPersonalRecord && (
          <span className="mt-2 inline-flex rounded-full bg-[#edf2df] px-2.5 py-1 text-[0.68rem] font-extrabold uppercase tracking-[0.08em] text-[#5d7754]">
            Dấu mốc riêng
          </span>
        )}
      </div>
    </article>
  )
}

function CurrentChapterCard({ chapter, recentEntries }: {
  chapter: PlantStoryChapter
  recentEntries: PlantStoryEntry[]
}) {
  const [showAll, setShowAll] = useState(false)
  const previewEntries = recentEntries.slice(0, 2)
  const visibleEntries = showAll ? chapter.entries : previewEntries
  const canExpand = chapter.entries.length > previewEntries.length

  return (
    <section
      aria-labelledby="current-chapter-heading"
      className="overflow-hidden rounded-[1.8rem] border border-[#d9c99e] bg-[#fffaf0]/94 shadow-[0_18px_45px_rgba(72,76,47,0.13)] backdrop-blur-xl sm:rounded-[2rem]"
    >
      <div className="p-5 sm:p-7">
        <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#507046]">
          {getMonthLabel(chapter.key)}
        </p>
        <h2
          id="current-chapter-heading"
          className="mt-2 font-display text-[2rem] font-semibold leading-[1.08] text-[#244222] sm:text-[2.65rem]"
        >
          {getCurrentChapterHeading(chapter)}
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-6 text-[#596657] sm:text-base">
          {getCurrentChapterSummary(chapter)}
        </p>

        {visibleEntries.length > 0 ? (
          <div className="mt-5 divide-y divide-[#ddd8bf] border-y border-[#ddd8bf]">
            {visibleEntries.map((entry) => (
              <StoryEntryRow key={entry.id} entry={entry} compact />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-[1.4rem] bg-[#edf2e5] px-5 py-6 text-center">
            <Sprout className="mx-auto h-7 w-7 text-[#6f8f63]" aria-hidden="true" />
            <p className="mt-3 font-bold text-[#3e5938]">Chưa có khoảnh khắc nào trong tháng này</p>
            <p className="mt-1 text-sm leading-6 text-[#6d7968]">
              Một lần chăm cây hay một ghi chú nhỏ đều có thể mở đầu chương mới.
            </p>
            <Link
              href="/garden"
              className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#5f854f] px-5 text-sm font-extrabold text-white shadow-leaf transition hover:bg-[#527646] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315027] focus-visible:ring-offset-2"
            >
              Về thăm cây
            </Link>
          </div>
        )}
      </div>

      {(canExpand || showAll) && (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          aria-expanded={showAll}
          className="flex min-h-14 w-full items-center justify-center gap-2 border-t border-[#ddd8bf] bg-[#fbf7e9]/80 px-5 text-sm font-extrabold text-[#315b2d] transition hover:bg-[#edf2df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6f8f63] sm:text-base"
        >
          {showAll ? 'Thu gọn tháng này' : `Xem tất cả ${chapter.entryCount} khoảnh khắc`}
          <ChevronRight className={cn('h-5 w-5 transition-transform', showAll && 'rotate-90')} aria-hidden="true" />
        </button>
      )}
    </section>
  )
}

function ChapterRow({ chapter, plant }: { chapter: PlantStoryChapter; plant: PlantStoryPlant }) {
  const [open, setOpen] = useState(false)
  const plantImageModel = useMemo(() => asPlantImageModel(plant), [plant])
  const panelId = `chapter-${chapter.key}`

  return (
    <div className="border-b border-[#ded8c4] last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-[5.75rem] w-full items-center gap-3 px-3 py-3 text-left transition hover:bg-[#f4f2e5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6f8f63] sm:min-h-[6.5rem] sm:gap-4 sm:px-4"
      >
        <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[1.2rem] bg-[#e3ead7] sm:h-[4.5rem] sm:w-[4.5rem]">
          <PlantImage
            plant={plantImageModel}
            size="xl"
            showStatusIndicator={false}
            className="origin-bottom scale-[1.08]"
          />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-xl font-semibold leading-tight text-[#274427] sm:text-2xl">
            {chapter.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm leading-5 text-[#606b5d]">{chapter.subtitle}</p>
        </div>
        <div className="hidden shrink-0 text-right xs:block">
          <p className="text-sm font-bold text-[#42603b]">{chapter.entryCount} khoảnh khắc</p>
          <p className="mt-1 text-xs text-[#7b8875]">{chapter.activeDayCount} ngày hiện diện</p>
        </div>
        <ChevronRight
          className={cn('h-6 w-6 shrink-0 text-[#37603a] transition-transform', open && 'rotate-90')}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div id={panelId} className="bg-[#fbf8ec]/75 px-4 pb-3 sm:px-5">
          <div className="divide-y divide-[#e3decb] border-t border-[#e3decb]">
            {chapter.entries.map((entry) => (
              <StoryEntryRow key={entry.id} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function PlantIdentityCard({ story }: { story: PlantStorySnapshot }) {
  const router = useRouter()
  const plantImageModel = useMemo(() => asPlantImageModel(story.plant), [story.plant])
  const plantOptions = useMemo(
    () => [...story.plantOptions].sort((left, right) => {
      if (left.id === story.plant.id) return -1
      if (right.id === story.plant.id) return 1
      return left.name.localeCompare(right.name, 'vi')
    }),
    [story.plant.id, story.plantOptions]
  )
  const hasSwitcher = plantOptions.length > 1
  const startDate = formatDate(story.plant.startedAt, { day: 'numeric', month: 'long', year: 'numeric' })

  const content = (
    <div className="flex min-w-0 flex-1 items-center gap-4 text-left sm:gap-5">
      <div className="grid h-[4.75rem] w-[4.75rem] shrink-0 place-items-center overflow-hidden rounded-[1.5rem] bg-[#dfe8d2] sm:h-24 sm:w-24">
        <PlantImage
          plant={plantImageModel}
          size="2xl"
          showStatusIndicator={false}
          priority
          className="origin-bottom scale-[1.15] sm:scale-[1.3]"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[#718567]">
          Câu chuyện của
        </p>
        <h1 className="mt-1 truncate font-display text-[1.65rem] font-semibold leading-tight text-[#244222] sm:text-[2.15rem]">
          {story.plant.name}
        </h1>
        <p className="mt-1 text-sm font-semibold text-[#52704d]">Bắt đầu {startDate}</p>
        {story.plant.habitDescription && (
          <p className="mt-1 hidden truncate text-sm text-[#74806e] sm:block">{story.plant.habitDescription}</p>
        )}
      </div>
    </div>
  )

  return (
    <section className="rounded-[2rem] border border-white/75 bg-[#edf1df]/92 p-3 shadow-[0_14px_38px_rgba(58,82,49,0.1)] backdrop-blur-xl sm:p-4">
      {hasSwitcher ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex min-h-20 w-full items-center gap-3 rounded-[1.55rem] p-1 pr-3 transition hover:bg-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f8f63] sm:min-h-28"
              aria-label={`Đổi cây. Đang xem ${story.plant.name}`}
            >
              {content}
              <ChevronDown className="h-6 w-6 shrink-0 text-[#3d6337]" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="max-h-[min(26rem,70vh)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto overscroll-contain rounded-[1.35rem] border-[#d8dfcb] bg-[#fffaf0] p-2 shadow-[0_18px_48px_rgba(45,68,40,0.2)]"
            style={{ scrollbarColor: '#9baa8e transparent', scrollbarWidth: 'thin' }}
          >
            <DropdownMenuLabel className="px-3 py-2 text-xs font-extrabold uppercase tracking-[0.12em] text-[#78876f]">
              Chọn câu chuyện của cây
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#e3decf]" />
            {plantOptions.map((option) => (
              <DropdownMenuItem
                key={option.id}
                onSelect={() => router.push(`/overview/${encodeURIComponent(option.id)}`)}
                className="min-h-12 rounded-xl px-3 text-[#344f31] focus:bg-[#eaf0df]"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-[#e4ecd9] text-[#5f854f]" aria-hidden="true">
                  <Leaf className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 truncate font-bold">{option.name}</span>
                {option.id === story.plant.id && <Check className="h-4 w-4 text-[#5f854f]" aria-hidden="true" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex min-h-20 items-center rounded-[1.55rem] p-1 sm:min-h-28">{content}</div>
      )}
    </section>
  )
}

export function PlantStoryView({ story }: PlantStoryViewProps) {
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all')
  const archiveChapters = useMemo(
    () => story.chapters.filter((chapter) => chapter.key !== story.currentMonth.key),
    [story.chapters, story.currentMonth.key]
  )
  const visibleArchiveChapters = useMemo(
    () => archiveFilter === 'notes'
      ? archiveChapters.filter((chapter) => chapter.entries.some((entry) => entry.note))
      : archiveChapters,
    [archiveChapters, archiveFilter]
  )

  return (
    <div className="relative h-full overflow-y-auto bg-[#edf1e7] pb-32 text-[#293e27]">
      <Image
        src="/garden/backgrounds/sanctuary-golden-hour.webp"
        alt=""
        fill
        sizes="100vw"
        className="fixed object-cover opacity-20"
        loading="eager"
      />
      <div className="fixed inset-0 bg-[#fbf8ef]/86 backdrop-blur-[2px]" aria-hidden="true" />

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:px-8">
        <header className="flex min-h-12 items-center justify-between gap-4 py-1">
          <Link
            href="/overview"
            className="inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-base font-extrabold text-[#31502e] transition hover:bg-white/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f8f63]"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            Hành trình
          </Link>
          <div className="hidden items-center gap-2 rounded-full bg-white/55 px-3 py-2 text-xs font-bold text-[#64745f] shadow-sm sm:flex">
            <BookOpenText className="h-4 w-4 text-[#6f8f63]" aria-hidden="true" />
            {story.totalEntryCount} khoảnh khắc · {story.totalActiveDays} ngày
          </div>
        </header>

        <div className="mt-5">
          <PlantIdentityCard story={story} />
        </div>

        <div className="mt-5 grid items-start gap-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
          <CurrentChapterCard chapter={story.currentMonth} recentEntries={story.recentEntries} />

          <section aria-labelledby="archive-heading">
            <div className="flex min-h-12 items-end justify-between gap-3 px-1">
              <div>
                <h2 id="archive-heading" className="whitespace-nowrap font-display text-2xl font-semibold text-[#244222] sm:text-3xl">
                  Các tháng trước
                </h2>
                <p className="mt-1 hidden text-sm text-[#707d6b] sm:block">Mở một tháng để xem lại từng khoảnh khắc.</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#aeba91] bg-[#f7f6e9]/80 px-3.5 text-sm font-bold text-[#3c5636] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f8f63]"
                    aria-label="Lọc các tháng trước"
                  >
                    {archiveFilter === 'all' ? 'Tất cả thời gian' : 'Có ghi chú'}
                    <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl border-[#d8dfcb] bg-[#fffaf0] p-1.5">
                  <DropdownMenuItem
                    onSelect={() => setArchiveFilter('all')}
                    className="min-h-11 rounded-lg px-3 text-[#344f31] focus:bg-[#eaf0df]"
                  >
                    Tất cả thời gian
                    {archiveFilter === 'all' && <Check className="ml-auto h-4 w-4" aria-hidden="true" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setArchiveFilter('notes')}
                    className="min-h-11 rounded-lg px-3 text-[#344f31] focus:bg-[#eaf0df]"
                  >
                    Có ghi chú
                    {archiveFilter === 'notes' && <Check className="ml-auto h-4 w-4" aria-hidden="true" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-4 overflow-hidden rounded-[1.45rem] border border-[#d8c99f] bg-[#fffdf7]/86 shadow-[0_14px_35px_rgba(72,76,47,0.09)] backdrop-blur-xl">
              {visibleArchiveChapters.length > 0 ? (
                visibleArchiveChapters.map((chapter) => (
                  <ChapterRow key={chapter.key} chapter={chapter} plant={story.plant} />
                ))
              ) : (
                <div className="px-5 py-9 text-center">
                  <Leaf className="mx-auto h-7 w-7 text-[#789a68]" aria-hidden="true" />
                  <p className="mt-3 font-bold text-[#40583a]">
                    {archiveFilter === 'notes' ? 'Chưa có tháng nào có ghi chú' : 'Chưa có tháng trước để xem lại'}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-[#75816f]">
                    Ghi chú luôn là lựa chọn, không phải điều kiện để câu chuyện được lưu lại.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

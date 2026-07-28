import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  CalendarClock,
  Check,
  Clock3,
  Route,
  Sprout,
} from 'lucide-react'
import { ReadingShell } from '@/components/reading/reading-shell'
import { ReadingStartButton } from '@/components/reading/reading-start-button'
import type { HabitPlantStage, ReadingJourneySnapshot } from '@/types/habits'

const STAGE_META: Record<HabitPlantStage, {
  label: string
  image: string
  message: string
}> = {
  seed: {
    label: 'Hạt giống',
    image: '/plants/generic/01-seed.png',
    message: 'Cây tri thức đang chờ phiên đọc đầu tiên.',
  },
  sprout: {
    label: 'Mầm non',
    image: '/plants/generic/02-sprout.png',
    message: 'Những trang sách đầu tiên đã thành một mầm xanh.',
  },
  growing: {
    label: 'Đang lớn',
    image: '/plants/generic/03-growing.png',
    message: 'Nhịp đọc đều đang làm tán lá dày hơn.',
  },
  blooming: {
    label: 'Nở hoa',
    image: '/plants/generic/04-blooming.png',
    message: 'Sự đều đặn đang nở thành một thói quen sống.',
  },
  mature: {
    label: 'Trưởng thành',
    image: '/plants/generic/05-mature.png',
    message: 'Cây tri thức đã trưởng thành và vẫn tiếp tục lớn.',
  },
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: 'numeric',
    month: 'long',
  }).format(new Date(`${value}T00:00:00`))
}

export function ReadingHome({ snapshot }: { snapshot: ReadingJourneySnapshot }) {
  const { habit, plan, growth, today, active_session: activeSession } = snapshot
  const completed = Number(today?.completed_value ?? 0)
  const target = Number(growth.current_target)
  const progress = Math.min(100, (completed / target) * 100)
  const completedToday = completed > 0
  const stage = STAGE_META[growth.plant_stage]

  return (
    <ReadingShell
      eyebrow="Home Garden · Hôm nay"
      title={habit.name}
      description="Một phiên 30 phút. Một mục tiêu vừa sức. Cây sẽ lớn theo nhịp bạn thật sự giữ được."
    >
      <section className="mx-auto mt-8 grid max-w-3xl overflow-hidden rounded-[2rem] border border-white/75 bg-[#fffaf0]/92 shadow-[0_26px_80px_rgba(47,72,42,.2)] backdrop-blur-2xl md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[300px] overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#f9efc9_0%,#dce8c9_52%,#b9cfaa_100%)]">
          <div className="absolute inset-x-8 bottom-5 h-14 rounded-[50%] bg-[#6e8b5c]/20 blur-sm" aria-hidden="true" />
          <Image
            src={stage.image}
            alt={`Cây đọc sách ở giai đoạn ${stage.label}`}
            fill
            sizes="(max-width: 768px) 100vw, 45vw"
            className="object-contain object-bottom p-8"
          />
          <div className="absolute left-4 top-4 rounded-full border border-white/70 bg-[#fffaf0]/88 px-3 py-1.5 text-xs font-extrabold text-[#527047] shadow-sm backdrop-blur-xl">
            {stage.label}
          </div>
        </div>

        <div className="flex flex-col p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#7b906e]">
                Mục tiêu hôm nay
              </p>
              <p className="mt-1 font-display text-3xl font-semibold text-[#315027]">
                {completed}/{target} trang
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold ${
                today?.met_target
                  ? 'bg-[#dcebd4] text-[#42623b]'
                  : 'bg-[#edf1e7] text-[#64765d]'
              }`}
            >
              {today?.met_target ? <Check className="h-3.5 w-3.5" /> : <Sprout className="h-3.5 w-3.5" />}
              {today?.met_target ? 'Đã đạt' : 'Đang nuôi cây'}
            </span>
          </div>

          <div
            className="mt-4 h-3 overflow-hidden rounded-full bg-[#e1e8d7]"
            role="progressbar"
            aria-label="Tiến độ đọc hôm nay"
            aria-valuemin={0}
            aria-valuemax={target}
            aria-valuenow={completed}
          >
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#7aa269,#4f7c49)] transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="mt-4 text-sm leading-6 text-[#62735b]">{stage.message}</p>

          <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-[#eef3e7] p-3">
              <dt className="flex items-center gap-1.5 text-xs font-bold text-[#74836d]">
                <Clock3 className="h-3.5 w-3.5" />
                Focus Session
              </dt>
              <dd className="mt-1 font-extrabold text-[#3d5936]">
                {habit.session_duration_minutes} phút
              </dd>
            </div>
            <div className="rounded-2xl bg-[#eef3e7] p-3">
              <dt className="flex items-center gap-1.5 text-xs font-bold text-[#74836d]">
                <CalendarClock className="h-3.5 w-3.5" />
                Review tiếp theo
              </dt>
              <dd className="mt-1 font-extrabold text-[#3d5936]">
                {formatDate(growth.next_review_on)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <ReadingStartButton
              activeSession={activeSession}
              completedToday={completedToday}
            />
            <Link
              href="/reading/growth-plan"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#bfcdb4] bg-white/70 px-5 text-sm font-extrabold text-[#537048] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789a68]"
            >
              <Route className="h-4 w-4" />
              Growth Plan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-4 text-xs leading-5 text-[#7a8873]">
            Lộ trình {plan.start_target}→{plan.end_target} trang/ngày · tăng theo độ đều, không phạt ngày lỡ.
          </p>
        </div>
      </section>
    </ReadingShell>
  )
}


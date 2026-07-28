import {
  ArrowUpRight,
  CalendarDays,
  Check,
  Circle,
  History,
  Leaf,
  ShieldCheck,
  Sprout,
} from 'lucide-react'
import { ReadingShell } from '@/components/reading/reading-shell'
import { ReadingStartButton } from '@/components/reading/reading-start-button'
import type { GrowthHistoryEntry, ReadingJourneySnapshot } from '@/types/habits'

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`))
}

function getActionCopy(entry: GrowthHistoryEntry): string {
  if (entry.action === 'held') {
    return `Giữ ${entry.new_target} trang — nhịp tuần này cần thêm thời gian.`
  }
  if (entry.action === 'completed') {
    return `Chạm mốc ${entry.new_target} trang/ngày.`
  }
  return `Tăng từ ${entry.previous_target} lên ${entry.new_target} trang/ngày.`
}

export function GrowthPlanView({ snapshot }: { snapshot: ReadingJourneySnapshot }) {
  const { plan, growth, active_session: activeSession, today } = snapshot
  const milestones: number[] = []
  for (
    let target = Number(plan.start_target);
    target <= Number(plan.end_target);
    target += Number(plan.increment_value)
  ) {
    milestones.push(Math.min(target, Number(plan.end_target)))
  }
  if (milestones.at(-1) !== Number(plan.end_target)) {
    milestones.push(Number(plan.end_target))
  }

  const history = [...growth.history].reverse()
  const completedToday = Number(today?.completed_value ?? 0) > 0

  return (
    <ReadingShell
      eyebrow="Growth Plan"
      title={`${plan.start_target}→${plan.end_target} trang mỗi ngày`}
      description="Một quỹ đạo rõ ràng, chỉ thay đổi sau kỳ review. Lỡ ngày không làm target tụt xuống hay nhảy bất ngờ."
      backHref="/reading"
    >
      <section className="mx-auto mt-8 max-w-3xl rounded-[2rem] border border-white/75 bg-[#fffaf0]/94 p-5 shadow-[0_26px_80px_rgba(47,72,42,.18)] backdrop-blur-2xl sm:p-8">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#edf2e7] p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#7b8973]">
              Mốc trước
            </p>
            <p className="mt-1 text-xl font-extrabold text-[#4f6948]">
              {growth.previous_target ? `${growth.previous_target} trang` : 'Khởi đầu'}
            </p>
          </div>
          <div className="rounded-2xl bg-[#dcebd4] p-4 ring-2 ring-[#789a68]/35">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#627b58]">
              Target hiện tại
            </p>
            <p className="mt-1 text-2xl font-extrabold text-[#315027]">
              {growth.current_target} trang
            </p>
          </div>
          <div className="rounded-2xl bg-[#edf2e7] p-4">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#7b8973]">
              Mốc tiếp theo
            </p>
            <p className="mt-1 text-xl font-extrabold text-[#4f6948]">
              {growth.next_target ? `${growth.next_target} trang` : 'Đã chạm đích'}
            </p>
          </div>
        </div>

        <div className="mt-8 overflow-x-auto pb-2">
          <ol
            className="flex min-w-[560px] items-start"
            aria-label="Các mốc của kế hoạch đọc"
          >
            {milestones.map((milestone, index) => {
              const reached = milestone < Number(growth.current_target)
              const current = milestone === Number(growth.current_target)
              return (
                <li key={milestone} className="relative flex flex-1 flex-col items-center">
                  {index > 0 && (
                    <span
                      className={`absolute right-1/2 top-3 h-1 w-full ${
                        reached || current ? 'bg-[#789a68]' : 'bg-[#d5dfcc]'
                      }`}
                      aria-hidden="true"
                    />
                  )}
                  <span className={`relative z-10 grid h-7 w-7 place-items-center rounded-full border-2 ${
                    reached
                      ? 'border-[#5f854f] bg-[#5f854f] text-white'
                      : current
                        ? 'border-[#5f854f] bg-[#fffaf0] text-[#5f854f] ring-4 ring-[#b9cdaa]/45'
                        : 'border-[#c4d1bb] bg-[#f8f6ec] text-[#91a087]'
                  }`}>
                    {reached ? <Check className="h-4 w-4" /> : current ? <Sprout className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                  </span>
                  <span className={`mt-2 text-sm font-extrabold ${
                    current ? 'text-[#315027]' : 'text-[#6b7a65]'
                  }`}>
                    {milestone}
                  </span>
                  <span className="text-[11px] font-medium text-[#879280]">trang/ngày</span>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#d7e1ce] bg-white/60 p-4">
            <p className="flex items-center gap-2 text-sm font-extrabold text-[#4c6745]">
              <ShieldCheck className="h-5 w-5 text-[#6f925e]" />
              Quy tắc tăng trưởng
            </p>
            <p className="mt-2 text-sm leading-6 text-[#66765f]">
              Review mỗi {plan.review_period_days} ngày. Khi đạt target ít nhất{' '}
              {Math.round(Number(plan.performance_threshold) * 100)}% số ngày, target tăng{' '}
              {plan.increment_value} trang và không vượt {plan.end_target}.
            </p>
            <p className="mt-2 text-sm leading-6 text-[#66765f]">
              Nếu chưa đạt, kế hoạch giữ nguyên mốc hiện tại trong kỳ tiếp theo — không trừ điểm, không tăng bù.
            </p>
          </div>
          <dl className="rounded-2xl border border-[#d7e1ce] bg-white/60 p-4 text-sm">
            <div className="flex items-center justify-between gap-4 py-1">
              <dt className="flex items-center gap-2 font-bold text-[#718069]">
                <CalendarDays className="h-4 w-4" />
                Bắt đầu
              </dt>
              <dd className="font-extrabold text-[#45613f]">{formatDate(plan.started_on)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-[#e3e9dd] py-2">
              <dt className="font-bold text-[#718069]">Review tiếp theo</dt>
              <dd className="font-extrabold text-[#45613f]">{formatDate(growth.next_review_on)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-[#e3e9dd] py-2">
              <dt className="font-bold text-[#718069]">Đích dự kiến</dt>
              <dd className="font-extrabold text-[#45613f]">{formatDate(plan.target_end_on)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-[#e3e9dd] py-2">
              <dt className="font-bold text-[#718069]">Độ đều kỳ gần nhất</dt>
              <dd className="font-extrabold text-[#45613f]">
                {Math.round(Number(growth.consistency_score) * 100)}%
              </dd>
            </div>
          </dl>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <ReadingStartButton
            activeSession={activeSession}
            completedToday={completedToday}
          />
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[#788671]">
            <ArrowUpRight className="h-4 w-4" />
            Nhịp hiện tại: {growth.current_streak} ngày · tốt nhất {growth.best_streak}
          </p>
        </div>
      </section>

      <section className="mx-auto mt-5 max-w-3xl rounded-[2rem] border border-white/75 bg-[#fffaf0]/88 p-5 shadow-xl backdrop-blur-xl sm:p-7">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-[#e6eddc] text-[#628555]">
            <History className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-xl font-semibold text-[#315027]">Lịch sử progression</h2>
            <p className="text-xs text-[#7a8873]">Mỗi thay đổi đều có ngày, dữ liệu và lý do.</p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#cbd7c2] bg-white/45 px-4 py-6 text-center">
            <Leaf className="mx-auto h-6 w-6 text-[#8ba17e]" />
            <p className="mt-2 text-sm font-bold text-[#61725b]">Chưa đến kỳ review đầu tiên</p>
            <p className="mt-1 text-xs leading-5 text-[#83907d]">
              Lịch sử sẽ xuất hiện sau {plan.review_period_days} ngày quan sát đầu tiên.
            </p>
          </div>
        ) : (
          <ol className="mt-5 space-y-3">
            {history.map((entry, index) => (
              <li
                key={`${entry.reviewed_on}-${index}`}
                className="rounded-2xl border border-[#dbe3d5] bg-white/55 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-extrabold text-[#45613f]">{getActionCopy(entry)}</p>
                  <time className="text-xs font-bold text-[#7f8b79]">{formatDate(entry.reviewed_on)}</time>
                </div>
                <p className="mt-1 text-sm text-[#6a7964]">
                  {entry.successful_days}/{entry.review_period_days} ngày đạt target ·{' '}
                  {Math.round(entry.consistency * 100)}% consistency
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </ReadingShell>
  )
}


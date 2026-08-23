'use client'

import { FormEvent, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BookCheck,
  Check,
  Flame,
  Leaf,
  Loader2,
  Route,
  Sparkles,
  Sprout,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { completeReadingSession } from '@/lib/actions/habit-sessions'
import { queuePendingGardenEncounter } from '@/lib/garden-encounter-pending'
import { validateCompletedValue } from '@/lib/habit-growth'
import { getPlantHref, getReadingGrowthPlanHref } from '@/lib/reading-routes'
import type {
  HabitPlantStage,
  HabitSession,
  ReadingCompletionSnapshot,
} from '@/types/habits'

const PLANT_STAGE_LABELS: Record<HabitPlantStage, string> = {
  seed: 'Hạt giống',
  sprout: 'Mầm non',
  growing: 'Đang lớn',
  blooming: 'Nở hoa',
  mature: 'Trưởng thành',
}

interface CompletionClientProps {
  plantId: string
  plantName: string
  initialSession: HabitSession
  initialCompletion?: ReadingCompletionSnapshot
}

export function CompletionClient({
  plantId,
  plantName,
  initialSession,
  initialCompletion,
}: CompletionClientProps) {
  const [completion, setCompletion] = useState(initialCompletion ?? null)
  const [pages, setPages] = useState(() => String(initialSession.target_value))
  const [reflection, setReflection] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    const parsedPages = Number(pages)
    const validationError = validateCompletedValue(parsedPages)
    if (validationError) {
      setError(validationError)
      return
    }

    startTransition(async () => {
      const result = await completeReadingSession(
        initialSession.id,
        parsedPages,
        reflection
      )
      if (!result.success) {
        setError(result.error)
        return
      }
      queuePendingGardenEncounter({
        plantId,
        plantName,
        actionKind: 'care',
      })
      setCompletion(result.data)
    })
  }

  if (!completion) {
    return (
      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-8 w-full max-w-xl rounded-[2rem] border border-white/75 bg-[#fffaf0]/94 p-5 shadow-[0_28px_90px_rgba(43,68,39,.22)] backdrop-blur-2xl sm:p-8"
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#dcebd4] text-[#507b47]">
          <BookCheck className="h-8 w-8" />
        </div>
        <div className="mt-4 text-center">
          <h2 className="font-display text-2xl font-semibold text-[#315027]">
            Bạn đã đọc được bao nhiêu?
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#687763]">
            Target của phiên là {initialSession.target_value} trang. Ghi con số thật — cây lớn từ sự hiện diện, không phải sự hoàn hảo.
          </p>
        </div>

        <div className="mt-6">
          <label htmlFor="completed-pages" className="text-sm font-extrabold text-[#4d6845]">
            Số trang đã đọc
          </label>
          <div className="relative mt-2">
            <Input
              id="completed-pages"
              name="completedPages"
              type="number"
              inputMode="numeric"
              min={1}
              max={5000}
              step={1}
              required
              value={pages}
              onChange={(event) => setPages(event.target.value)}
              aria-describedby="completed-pages-hint"
              className="h-14 rounded-2xl border-[#bdcdb2] bg-white/85 pr-20 text-lg font-extrabold text-[#315027]"
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-sm font-bold text-[#75846e]">
              trang
            </span>
          </div>
          <p id="completed-pages-hint" className="mt-2 text-xs leading-5 text-[#7a8873]">
            Nhập số nguyên từ 1 đến 5.000.
          </p>
        </div>

        <div className="mt-5">
          <label htmlFor="reading-reflection" className="text-sm font-extrabold text-[#4d6845]">
            Một dòng muốn nhớ <span className="font-medium text-[#819078]">(không bắt buộc)</span>
          </label>
          <Textarea
            id="reading-reflection"
            name="reflection"
            maxLength={2000}
            value={reflection}
            onChange={(event) => setReflection(event.target.value)}
            placeholder="Ý tưởng, câu văn, hoặc cảm giác còn lại…"
            className="mt-2 min-h-28 rounded-2xl border-[#bdcdb2] bg-white/85"
          />
          <p className="mt-1 text-right text-xs text-[#899582]">{reflection.length}/2.000</p>
        </div>

        {error && (
          <p className="mt-4 rounded-2xl bg-[#f6e6df] px-4 py-3 text-sm font-semibold text-[#934f46]" role="alert">
            {error}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="mt-6 min-h-12 w-full rounded-2xl bg-[#5f854f] text-base font-extrabold text-white hover:bg-[#527847]"
        >
          {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sprout className="h-5 w-5" />}
          {isPending ? 'Đang nuôi cây…' : 'Lưu kết quả'}
        </Button>
      </form>
    )
  }

  const resultPages = Number(completion.session.result_value ?? 0)
  const target = Number(completion.session.target_value)
  const difference = resultPages - target
  const metTarget = difference >= 0
  const latestReview = completion.growth.history.at(-1)
  const reviewedThisSession = latestReview?.reviewed_on === completion.daily_progress.progress_date

  return (
    <section className="mx-auto mt-8 w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/75 bg-[#fffaf0]/94 shadow-[0_28px_90px_rgba(43,68,39,.22)] backdrop-blur-2xl">
      <div className="bg-[linear-gradient(135deg,#dcebd4,#f7ebc5)] px-5 py-7 text-center sm:px-8">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/80 text-[#507b47] shadow-sm">
          <Check className="h-8 w-8" />
        </div>
        <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.16em] text-[#69805f]">
          Phiên đọc đã được lưu
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-[#315027]">
          {resultPages} trang đã thành tăng trưởng
        </h2>
        <p className="mt-2 text-sm font-semibold text-[#61725b]">
          {metTarget
            ? `Bạn đạt target và vượt ${difference} trang.`
            : `Bạn đã hiện diện. Còn ${Math.abs(difference)} trang so với target, không có hình phạt.`}
        </p>
      </div>

      <div className="p-5 sm:p-8">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl bg-[#edf2e7] p-3 text-center">
            <dt className="text-xs font-bold text-[#788570]">Hôm nay</dt>
            <dd className="mt-1 font-extrabold text-[#3d5a36]">
              {completion.daily_progress.completed_value}/{completion.daily_progress.target_value}
            </dd>
          </div>
          <div className="rounded-2xl bg-[#edf2e7] p-3 text-center">
            <dt className="flex items-center justify-center gap-1 text-xs font-bold text-[#788570]">
              <Sparkles className="h-3.5 w-3.5" />
              Reward
            </dt>
            <dd className="mt-1 font-extrabold text-[#3d5a36]">
              +{completion.session.reward_points} growth
            </dd>
          </div>
          <div className="rounded-2xl bg-[#edf2e7] p-3 text-center">
            <dt className="flex items-center justify-center gap-1 text-xs font-bold text-[#788570]">
              <Flame className="h-3.5 w-3.5" />
              Nhịp
            </dt>
            <dd className="mt-1 font-extrabold text-[#3d5a36]">
              {completion.growth.current_streak} ngày
            </dd>
          </div>
          <div className="rounded-2xl bg-[#edf2e7] p-3 text-center">
            <dt className="flex items-center justify-center gap-1 text-xs font-bold text-[#788570]">
              <Leaf className="h-3.5 w-3.5" />
              Cây
            </dt>
            <dd className="mt-1 font-extrabold text-[#3d5a36]">
              {PLANT_STAGE_LABELS[completion.growth.plant_stage]}
            </dd>
          </div>
        </dl>

        <div className="mt-5 rounded-2xl border border-[#d7e1ce] bg-white/65 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7b8973]">
                Growth Plan
              </p>
              <p className="mt-1 text-lg font-extrabold text-[#3d5a36]">
                Target hiện tại: {completion.growth.current_target} trang/ngày
              </p>
            </div>
            <Route className="h-6 w-6 shrink-0 text-[#789a68]" />
          </div>
          {reviewedThisSession && latestReview && (
            <p className="mt-3 rounded-xl bg-[#edf2e7] px-3 py-2 text-sm leading-5 text-[#61725b]">
              {latestReview.action === 'held'
                ? `Kỳ review đạt ${Math.round(latestReview.consistency * 100)}%. Target được giữ nhẹ nhàng ở ${latestReview.new_target} trang.`
                : `Kỳ review đạt ${Math.round(latestReview.consistency * 100)}%. Target mới là ${latestReview.new_target} trang.`}
            </p>
          )}
        </div>

        {completion.session.reflection && (
          <blockquote className="mt-5 rounded-2xl border-l-4 border-[#8aaa75] bg-[#f5f0df] px-4 py-3 text-sm italic leading-6 text-[#64705c]">
            “{completion.session.reflection}”
          </blockquote>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <Button asChild size="lg" className="min-h-12 rounded-2xl bg-[#5f854f] text-white">
            <Link href={getPlantHref(plantId)}>
              <Leaf className="h-5 w-5" />
              Về cây hôm nay
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="min-h-12 rounded-2xl border-[#bdcdb2] bg-white/70">
            <Link href={getReadingGrowthPlanHref(plantId)}>
              Xem Growth Plan
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}

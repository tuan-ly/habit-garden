'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  BookOpenText,
  CheckCircle2,
  Headphones,
  Loader2,
  Pause,
  Play,
  VolumeX,
} from 'lucide-react'
import { toast } from 'sonner'
import { getCapabilitySessionHref } from '@/capabilities/core/routes'
import { BackgroundAudio } from '@/components/garden/background-audio'
import { Button } from '@/components/ui/button'
import {
  finishReadingSession,
  pauseReadingSession,
  resumeReadingSession,
  setReadingAmbient,
} from '@/lib/actions/habit-sessions'
import { getSessionElapsedSeconds } from '@/lib/habit-growth'
import {
  getPlantHref,
  getReadingCompletionHref,
} from '@/lib/reading-routes'
import type { Habit, HabitSession } from '@/types/habits'

function formatClock(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

interface FocusSessionClientProps {
  plantId: string
  habit: Habit
  initialSession: HabitSession
}

export function FocusSessionClient({
  plantId,
  habit,
  initialSession,
}: FocusSessionClientProps) {
  const router = useRouter()
  const [session, setSession] = useState(initialSession)
  const [clock, setClock] = useState(() => Date.now())
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const autoFinishStarted = useRef(false)

  useEffect(() => {
    if (session.status !== 'running') return
    const timer = window.setInterval(() => setClock(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [session.status])

  const elapsed = useMemo(() => getSessionElapsedSeconds(
    session.accumulated_seconds,
    session.status,
    session.last_resumed_at,
    new Date(clock)
  ), [clock, session])
  const cappedElapsed = Math.min(session.duration_seconds, elapsed)
  const remaining = Math.max(0, session.duration_seconds - cappedElapsed)
  const progress = Math.min(100, (cappedElapsed / session.duration_seconds) * 100)

  useEffect(() => {
    if (
      session.status !== 'running'
      || remaining > 0
      || autoFinishStarted.current
    ) return

    autoFinishStarted.current = true
    startTransition(async () => {
      const result = await finishReadingSession(session.id)
      if (!result.success) {
        autoFinishStarted.current = false
        setError(result.error)
        return
      }
      router.replace(getReadingCompletionHref(plantId, result.data.id))
    })
  }, [plantId, remaining, router, session.id, session.status])

  function handlePauseOrResume() {
    setError(null)
    startTransition(async () => {
      const result = session.status === 'running'
        ? await pauseReadingSession(session.id)
        : await resumeReadingSession(session.id)
      if (!result.success) {
        if (result.code === 'ACTIVE_SESSION_CONFLICT' && result.activeSession) {
          toast.info('Một hành trình khác đang chạy. Đang mở phiên đó.')
          router.push(getCapabilitySessionHref(
            result.activeSession.plant_id,
            result.activeSession.id
          ))
          return
        }

        setError(result.error)
        return
      }
      setSession(result.data)
      setClock(Date.now())
    })
  }

  function handleFinish() {
    setError(null)
    startTransition(async () => {
      const result = await finishReadingSession(session.id)
      if (!result.success) {
        setError(result.error)
        return
      }
      router.push(getReadingCompletionHref(plantId, result.data.id))
    })
  }

  function handleAmbientToggle() {
    setError(null)
    const nextEnabled = !session.ambient_enabled
    startTransition(async () => {
      const result = await setReadingAmbient(session.id, nextEnabled)
      if (!result.success) {
        setError(result.error)
        return
      }
      setSession(result.data)
    })
  }

  const paused = session.status === 'paused'

  return (
    <div className="relative mx-auto mt-8 w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/75 bg-[#fffaf0]/94 p-5 shadow-[0_28px_90px_rgba(43,68,39,.24)] backdrop-blur-2xl sm:p-8">
      <BackgroundAudio
        isPlaying={session.ambient_enabled && session.status === 'running'}
        currentTrackIndex={0}
        className="absolute right-4 top-4 z-10"
      />

      <div className="text-center">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-extrabold ${
          paused
            ? 'bg-[#eee6d6] text-[#806b4e]'
            : 'bg-[#dcebd4] text-[#496c40]'
        }`}>
          {paused ? <Pause className="h-3.5 w-3.5" /> : <BookOpenText className="h-3.5 w-3.5" />}
          {paused ? 'Đang tạm dừng' : 'Đang đọc'}
        </span>

        <p className="mt-5 text-sm font-bold text-[#718068]">Còn lại</p>
        <p
          className="mt-1 font-mono text-6xl font-semibold tracking-[-0.06em] text-[#315027] sm:text-7xl"
          aria-live="off"
          aria-label={`Còn ${Math.ceil(remaining / 60)} phút`}
        >
          {formatClock(remaining)}
        </p>
        <p className="mt-3 text-sm text-[#6a7964]">
          Đã đọc {formatClock(cappedElapsed)} · Phiên {habit.session_duration_minutes} phút
        </p>
      </div>

      <div
        className="mt-7 h-3 overflow-hidden rounded-full bg-[#dfe7d6]"
        role="progressbar"
        aria-label="Thời gian phiên đọc"
        aria-valuemin={0}
        aria-valuemax={session.duration_seconds}
        aria-valuenow={cappedElapsed}
      >
        <div
          className="h-full rounded-full bg-[linear-gradient(90deg,#8eae72,#4f7c49)] transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#edf2e7] p-4 text-center">
          <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#7a8972]">
            Target
          </dt>
          <dd className="mt-1 text-xl font-extrabold text-[#3d5a36]">
            {session.target_value} trang
          </dd>
        </div>
        <div className="rounded-2xl bg-[#edf2e7] p-4 text-center">
          <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[#7a8972]">
            Ambient
          </dt>
          <dd className="mt-1 text-sm font-extrabold text-[#3d5a36]">
            {session.ambient_enabled ? 'Rừng yên tĩnh' : 'Đang tắt'}
          </dd>
        </div>
      </dl>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={handlePauseOrResume}
          disabled={isPending}
          className="min-h-12 rounded-2xl border-[#bdcdb2] bg-white/70 text-base font-extrabold text-[#4d6c45]"
        >
          {isPending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : paused ? (
            <Play className="h-5 w-5 fill-[#4d6c45]/20" />
          ) : (
            <Pause className="h-5 w-5" />
          )}
          {paused ? 'Tiếp tục' : 'Tạm dừng'}
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={handleFinish}
          disabled={isPending}
          className="min-h-12 rounded-2xl bg-[#5f854f] text-base font-extrabold text-white hover:bg-[#527847]"
        >
          <CheckCircle2 className="h-5 w-5" />
          Kết thúc & ghi trang
        </Button>
      </div>

      <button
        type="button"
        onClick={handleAmbientToggle}
        disabled={isPending}
        aria-pressed={session.ambient_enabled}
        className="mx-auto mt-4 flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-[#62735b] transition hover:bg-[#edf2e7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789a68] disabled:opacity-50"
      >
        {session.ambient_enabled
          ? <VolumeX className="h-4 w-4" />
          : <Headphones className="h-4 w-4" />}
        {session.ambient_enabled ? 'Tắt âm thanh rừng' : 'Bật âm thanh rừng'}
      </button>

      {error && (
        <p className="mt-4 rounded-2xl bg-[#f6e6df] px-4 py-3 text-center text-sm font-semibold text-[#934f46]" role="alert">
          {error}
        </p>
      )}

      <p className="mt-5 text-center text-xs leading-5 text-[#7d8977]">
        Bạn có thể rời trang này. Timer và trạng thái pause vẫn được lưu.
      </p>
      <div className="mt-2 text-center">
        <Link
          href={getPlantHref(plantId)}
          className="inline-flex min-h-10 items-center text-sm font-bold text-[#5b7651] underline decoration-[#9fb493] underline-offset-4"
        >
          Rời phiên, giữ timer
        </Link>
      </div>
    </div>
  )
}


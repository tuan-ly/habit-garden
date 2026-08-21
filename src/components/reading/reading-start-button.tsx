'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Loader2, Play } from 'lucide-react'
import { toast } from 'sonner'
import { getCapabilitySessionHref } from '@/capabilities/core/routes'
import { startReadingSession } from '@/lib/actions/habit-sessions'
import { Button } from '@/components/ui/button'
import {
  getReadingCompletionHref,
  getReadingSessionHref,
} from '@/lib/reading-routes'
import type { HabitSession } from '@/types/habits'

interface ReadingStartButtonProps {
  plantId: string
  activeSession: HabitSession | null
  completedToday: boolean
}

export function ReadingStartButton({
  plantId,
  activeSession,
  completedToday,
}: ReadingStartButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const label = activeSession?.status === 'awaiting_completion'
    ? 'Ghi kết quả'
    : activeSession
      ? 'Tiếp tục đọc'
      : completedToday
        ? 'Đọc thêm'
        : 'Bắt đầu đọc'

  function handleStart() {
    setError(null)
    if (activeSession?.status === 'awaiting_completion') {
      router.push(getReadingCompletionHref(plantId, activeSession.id))
      return
    }
    if (activeSession) {
      router.push(getReadingSessionHref(plantId, activeSession.id))
      return
    }

    startTransition(async () => {
      const result = await startReadingSession(plantId)
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
      router.push(getReadingSessionHref(plantId, result.data.id))
    })
  }

  return (
    <div>
      <Button
        type="button"
        size="lg"
        onClick={handleStart}
        disabled={isPending}
        className="min-h-12 w-full rounded-2xl bg-[#5f854f] px-6 text-base font-extrabold text-white shadow-[0_12px_28px_rgba(66,105,56,.25)] hover:bg-[#527847] sm:w-auto"
      >
        {isPending ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : completedToday && !activeSession ? (
          <BookOpen className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 fill-white/20" />
        )}
        {isPending ? 'Đang mở phiên…' : label}
      </Button>
      {error && (
        <p className="mt-2 text-sm font-medium text-[#9a4f47]" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}


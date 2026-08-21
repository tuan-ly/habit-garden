'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Loader2 } from 'lucide-react'
import { startReadingSession } from '@/lib/actions/habit-sessions'
import { getReadingCompletionHref, getReadingSessionHref } from '@/lib/reading-routes'
import { cn } from '@/lib/utils'

interface ReadingFocusActionProps {
  plantId: string
  className?: string
}

export function ReadingFocusAction({ plantId, className }: ReadingFocusActionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleStart() {
    startTransition(async () => {
      const result = await startReadingSession(plantId)
      if (!result.success) return

      const href = result.data.status === 'awaiting_completion'
        ? getReadingCompletionHref(plantId, result.data.id)
        : getReadingSessionHref(plantId, result.data.id)
      router.push(href)
    })
  }

  return (
    <button
      type="button"
      onClick={handleStart}
      disabled={isPending}
      className={cn(
        'flex min-h-16 items-center justify-center gap-2 rounded-full border-2 border-white bg-[#31523b] px-3 font-bold text-[#fffaf0] shadow-[0_10px_24px_rgba(46,82,45,0.24)] transition hover:-translate-y-1 disabled:cursor-wait disabled:opacity-60 motion-reduce:transform-none',
        className
      )}
    >
      {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <BookOpen className="h-5 w-5" />}
      {isPending ? 'Đang mở…' : 'Đọc cùng cây'}
    </button>
  )
}

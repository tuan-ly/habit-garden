import { redirect } from 'next/navigation'
import { FocusSessionClient } from '@/components/reading/focus-session-client'
import { ReadingShell } from '@/components/reading/reading-shell'
import { ReadingStartButton } from '@/components/reading/reading-start-button'
import {
  getReadingJourneySnapshot,
  getReadingSession,
} from '@/lib/actions/habit-sessions'

interface FocusSessionPageProps {
  searchParams: Promise<{ id?: string | string[] }>
}

export default async function FocusSessionPage({
  searchParams,
}: FocusSessionPageProps) {
  const params = await searchParams
  const sessionId = typeof params.id === 'string' ? params.id : undefined
  const [journeyResult, sessionResult] = await Promise.all([
    getReadingJourneySnapshot(),
    getReadingSession(sessionId),
  ])

  if (sessionResult.success && (
    sessionResult.data.status === 'awaiting_completion'
    || sessionResult.data.status === 'completed'
  )) {
    redirect(`/reading/completion?id=${sessionResult.data.id}`)
  }

  if (!journeyResult.success || !sessionResult.success) {
    const message = !journeyResult.success
      ? journeyResult.error
      : !sessionResult.success
        ? sessionResult.error
        : 'Chưa có phiên đọc đang mở.'
    return (
      <ReadingShell
        eyebrow="Focus Session"
        title="Chưa có phiên đọc đang mở"
        description={message}
        backHref="/reading"
      >
        <div className="mx-auto mt-8 max-w-md rounded-[2rem] border border-white/75 bg-[#fffaf0]/92 p-6 text-center shadow-xl">
          <p className="text-sm leading-6 text-[#65745f]">
            Bắt đầu một phiên mới khi bạn đã sẵn sàng. Không cần bù lại thời gian đã lỡ.
          </p>
          <div className="mt-5">
            <ReadingStartButton activeSession={null} completedToday={false} />
          </div>
        </div>
      </ReadingShell>
    )
  }

  return (
    <ReadingShell
      eyebrow="Focus Session"
      title="30 phút cùng một cuốn sách"
      description="Timer được lưu trên máy chủ, nên refresh hoặc rời trang không làm mất phiên."
      backHref="/reading"
    >
      <FocusSessionClient
        habit={journeyResult.data.habit}
        initialSession={sessionResult.data}
      />
    </ReadingShell>
  )
}

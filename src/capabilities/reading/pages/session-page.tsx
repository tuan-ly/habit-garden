import { redirect } from 'next/navigation'
import { FocusSessionClient } from '@/components/reading/focus-session-client'
import { ReadingShell } from '@/components/reading/reading-shell'
import { ReadingStartButton } from '@/components/reading/reading-start-button'
import { getReadingJourneySnapshot, getReadingSession } from '@/lib/actions/habit-sessions'
import { getPlantHref, getReadingCompletionHref } from '@/lib/reading-routes'

interface ReadingSessionPageProps {
  plantId: string
  sessionId?: string
}

export async function ReadingSessionPage({ plantId, sessionId }: ReadingSessionPageProps) {
  const [journeyResult, sessionResult] = await Promise.all([
    getReadingJourneySnapshot(plantId),
    getReadingSession(plantId, sessionId),
  ])

  if (sessionResult.success && (
    sessionResult.data.status === 'awaiting_completion'
    || sessionResult.data.status === 'completed'
  )) {
    redirect(getReadingCompletionHref(plantId, sessionResult.data.id))
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
        backHref={getPlantHref(plantId)}
      >
        <div className="mx-auto mt-8 max-w-md rounded-[2rem] border border-white/75 bg-[#fffaf0]/92 p-6 text-center shadow-xl">
          <p className="text-sm leading-6 text-[#65745f]">
            Bắt đầu một phiên mới khi bạn đã sẵn sàng. Không cần bù lại thời gian đã lỡ.
          </p>
          <div className="mt-5">
            <ReadingStartButton plantId={plantId} activeSession={null} completedToday={false} />
          </div>
        </div>
      </ReadingShell>
    )
  }

  return (
    <ReadingShell
      eyebrow="Focus Session"
      title={`30 phút cùng ${journeyResult.data.plant.name}`}
      description={`Timer được lưu trên máy chủ. Mọi trang bạn ghi nhận trong phiên này đều nuôi lớn ${journeyResult.data.plant.name}.`}
      backHref={getPlantHref(plantId)}
    >
      <FocusSessionClient
        plantId={plantId}
        habit={journeyResult.data.habit}
        initialSession={sessionResult.data}
      />
    </ReadingShell>
  )
}

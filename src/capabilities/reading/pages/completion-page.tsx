import { redirect } from 'next/navigation'
import { CompletionClient } from '@/components/reading/completion-client'
import { ReadingShell } from '@/components/reading/reading-shell'
import {
  getReadingCompletion,
  getReadingJourneySnapshot,
  getReadingSession,
} from '@/lib/actions/habit-sessions'
import { getPlantHref, getReadingSessionHref } from '@/lib/reading-routes'

interface ReadingCompletionPageProps {
  plantId: string
  sessionId?: string
}

export async function ReadingCompletionPage({ plantId, sessionId }: ReadingCompletionPageProps) {
  if (!sessionId) redirect(getPlantHref(plantId))

  const [journeyResult, sessionResult] = await Promise.all([
    getReadingJourneySnapshot(plantId),
    getReadingSession(plantId, sessionId),
  ])

  if (!sessionResult.success || !journeyResult.success) {
    redirect(getPlantHref(plantId))
  }

  if (sessionResult.data.status === 'running' || sessionResult.data.status === 'paused') {
    redirect(getReadingSessionHref(plantId, sessionResult.data.id))
  }

  const completionResult = sessionResult.data.status === 'completed'
    ? await getReadingCompletion(sessionResult.data.id)
    : null
  const plantName = journeyResult.data.plant.name

  return (
    <ReadingShell
      eyebrow="Completion"
      title={completionResult?.success ? `${plantName} đã nhận phiên đọc` : `Khép lại phiên đọc cho ${plantName}`}
      description={completionResult?.success
        ? `Kết quả, nhịp đọc và tăng trưởng đều đã được lưu vào ${plantName}.`
        : `Ghi lại số trang thật để ${plantName} phản hồi đúng với hành trình của bạn.`}
      backHref={completionResult?.success
        ? getPlantHref(plantId)
        : getReadingSessionHref(plantId, sessionResult.data.id)}
    >
      <CompletionClient
        plantId={plantId}
        initialSession={sessionResult.data}
        initialCompletion={completionResult?.success ? completionResult.data : undefined}
      />
    </ReadingShell>
  )
}

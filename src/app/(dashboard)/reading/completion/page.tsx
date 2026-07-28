import { redirect } from 'next/navigation'
import { CompletionClient } from '@/components/reading/completion-client'
import { ReadingShell } from '@/components/reading/reading-shell'
import {
  getReadingCompletion,
  getReadingJourneySnapshot,
  getReadingSession,
} from '@/lib/actions/habit-sessions'

interface CompletionPageProps {
  searchParams: Promise<{ id?: string | string[] }>
}

export default async function CompletionPage({
  searchParams,
}: CompletionPageProps) {
  const params = await searchParams
  const sessionId = typeof params.id === 'string' ? params.id : undefined
  if (!sessionId) redirect('/reading')

  const [journeyResult, sessionResult] = await Promise.all([
    getReadingJourneySnapshot(),
    getReadingSession(sessionId),
  ])

  if (!sessionResult.success || !journeyResult.success) {
    redirect('/reading')
  }

  if (sessionResult.data.status === 'running' || sessionResult.data.status === 'paused') {
    redirect(`/reading/session?id=${sessionResult.data.id}`)
  }

  const completionResult = sessionResult.data.status === 'completed'
    ? await getReadingCompletion(sessionResult.data.id)
    : null

  return (
    <ReadingShell
      eyebrow="Completion"
      title={completionResult?.success ? 'Cây đã nhận phiên đọc' : 'Khép lại phiên đọc'}
      description={completionResult?.success
        ? 'Kết quả, nhịp đọc và tăng trưởng đều đã được lưu.'
        : 'Ghi lại số trang thật để cây phản hồi đúng với hành trình của bạn.'}
      backHref={completionResult?.success ? '/reading' : `/reading/session?id=${sessionResult.data.id}`}
    >
      <CompletionClient
        initialSession={sessionResult.data}
        initialCompletion={completionResult?.success ? completionResult.data : undefined}
      />
    </ReadingShell>
  )
}

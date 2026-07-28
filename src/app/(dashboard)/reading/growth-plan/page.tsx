import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { GrowthPlanView } from '@/components/reading/growth-plan-view'
import { ReadingShell } from '@/components/reading/reading-shell'
import { getReadingJourneySnapshot } from '@/lib/actions/habit-sessions'

export default async function GrowthPlanPage() {
  const result = await getReadingJourneySnapshot()

  if (!result.success) {
    return (
      <ReadingShell
        eyebrow="Growth Plan"
        title="Chưa thể mở lộ trình"
        description={result.error}
        backHref="/reading"
      >
        <div className="mx-auto mt-8 max-w-md rounded-[2rem] border border-white/75 bg-[#fffaf0]/92 p-6 text-center shadow-xl">
          <Link
            href="/reading/growth-plan"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#5f854f] px-5 text-sm font-extrabold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Link>
        </div>
      </ReadingShell>
    )
  }

  return <GrowthPlanView snapshot={result.data} />
}


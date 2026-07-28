import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { ReadingHome } from '@/components/reading/reading-home'
import { ReadingShell } from '@/components/reading/reading-shell'
import { getReadingJourneySnapshot } from '@/lib/actions/habit-sessions'

export default async function ReadingHomePage() {
  const result = await getReadingJourneySnapshot()

  if (!result.success) {
    return (
      <ReadingShell
        eyebrow="Home Garden"
        title="Cây đọc sách chưa thức dậy"
        description={result.error}
      >
        <div className="mx-auto mt-8 max-w-md rounded-[2rem] border border-white/75 bg-[#fffaf0]/92 p-6 text-center shadow-xl">
          <p className="text-sm leading-6 text-[#63745d]">
            Dữ liệu của bạn vẫn được giữ nguyên. Hãy thử tải lại khi kết nối ổn định.
          </p>
          <Link
            href="/reading"
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#5f854f] px-5 text-sm font-extrabold text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Link>
        </div>
      </ReadingShell>
    )
  }

  return <ReadingHome snapshot={result.data} />
}


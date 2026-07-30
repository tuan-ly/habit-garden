import Link from 'next/link'
import { BookOpen, RefreshCw, Sprout } from 'lucide-react'
import { ReadingHome } from '@/components/reading/reading-home'
import { ReadingShell } from '@/components/reading/reading-shell'
import { getReadingJourneySnapshot } from '@/lib/actions/habit-sessions'

export default async function ReadingHomePage() {
  const result = await getReadingJourneySnapshot()

  if (!result.success) {
    const needsAttachment = result.code === 'NOT_FOUND'

    return (
      <ReadingShell
        eyebrow="Home Garden"
        title={needsAttachment ? 'Chọn cây cho hành trình đọc' : 'Cây đọc sách chưa thức dậy'}
        description={result.error}
      >
        <div className="mx-auto mt-8 max-w-md rounded-[2rem] border border-white/75 bg-[#fffaf0]/92 p-6 text-center shadow-xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e5ead7] text-[#49673f]">
            {needsAttachment
              ? <BookOpen className="h-7 w-7" />
              : <RefreshCw className="h-7 w-7" />}
          </div>
          <p className="text-sm leading-6 text-[#63745d]">
            {needsAttachment
              ? 'Mở một cây bình thường trong khu vườn, rồi chọn “Gắn theo dõi đọc sách”. Không có cây mới nào được tạo tự động.'
              : 'Dữ liệu của bạn vẫn được giữ nguyên. Hãy thử tải lại khi kết nối ổn định.'}
          </p>
          <Link
            href={needsAttachment ? '/garden' : '/reading'}
            className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#5f854f] px-5 text-sm font-extrabold text-white"
          >
            {needsAttachment
              ? <Sprout className="h-4 w-4" />
              : <RefreshCw className="h-4 w-4" />}
            {needsAttachment ? 'Chọn một cây trong vườn' : 'Thử lại'}
          </Link>
        </div>
      </ReadingShell>
    )
  }

  return <ReadingHome snapshot={result.data} />
}


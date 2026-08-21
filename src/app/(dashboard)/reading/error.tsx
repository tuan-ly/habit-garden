'use client'

import Link from 'next/link'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ReadingError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="grid h-full place-items-center bg-[#e8efe3] px-4 text-[#30482d]">
      <div className="w-full max-w-md rounded-[2rem] border border-white/80 bg-[#fffaf0]/94 p-7 text-center shadow-xl">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#819278]">
          Kết nối bị gián đoạn
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold">Cây vẫn đang chờ bạn</h1>
        <p className="mt-3 text-sm leading-6 text-[#66765f]">
          Không có tiến độ nào bị mất. Bạn có thể thử lại hoặc quay về khu vườn.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-2xl bg-[#5f854f] px-5 text-white"
          >
            <RefreshCw className="h-4 w-4" />
            Thử lại
          </Button>
          <Button asChild variant="outline" className="min-h-11 rounded-2xl px-5">
            <Link href="/garden">Về khu vườn</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}


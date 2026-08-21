'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'

export default function PlantStoryError({ reset }: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="relative grid h-full place-items-center overflow-hidden bg-[#edf1e7] px-4 text-[#293e27]">
      <Image
        src="/garden/backgrounds/sanctuary-golden-hour.webp"
        alt=""
        fill
        sizes="100vw"
        className="fixed object-cover opacity-20"
        loading="eager"
      />
      <div className="fixed inset-0 bg-[#fbf8ef]/86 backdrop-blur-[2px]" aria-hidden="true" />
      <main className="relative z-10 w-full max-w-md rounded-[2rem] border border-white/80 bg-[#fffaf0]/94 p-7 text-center shadow-[0_20px_55px_rgba(58,82,49,0.14)]">
        <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#819278]">
          Kết nối bị gián đoạn
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-[#315027]">Câu chuyện vẫn còn nguyên</h1>
        <p className="mt-3 text-sm leading-6 text-[#66765f]">
          Nhật ký chưa thể mở lúc này. Bạn có thể thử lại hoặc trở về Hành trình.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#5f854f] px-5 text-sm font-extrabold text-white shadow-leaf transition hover:bg-[#527646] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315027] focus-visible:ring-offset-2"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Thử lại
          </button>
          <Link
            href="/overview"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#cdd8c5] bg-white/75 px-5 text-sm font-extrabold text-[#4d6946] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6f8f63]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Về Hành trình
          </Link>
        </div>
      </main>
    </div>
  )
}

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Sprout } from 'lucide-react'

export default function PlantStoryNotFound() {
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
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e4ecd9] text-[#628056]">
          <Sprout className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-4 font-display text-3xl font-semibold text-[#315027]">Chưa tìm thấy câu chuyện này</h1>
        <p className="mt-3 text-sm leading-6 text-[#66765f]">
          Cây có thể đã được chuyển khỏi khu vườn hoặc đường dẫn này không còn đúng.
        </p>
        <Link
          href="/overview"
          className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#5f854f] px-5 text-sm font-extrabold text-white shadow-leaf transition hover:bg-[#527646] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#315027] focus-visible:ring-offset-2"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Về Hành trình
        </Link>
      </main>
    </div>
  )
}

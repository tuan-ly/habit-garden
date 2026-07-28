import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BookOpenText } from 'lucide-react'
import type { ReactNode } from 'react'

interface ReadingShellProps {
  eyebrow: string
  title: string
  description?: string
  backHref?: string
  children: ReactNode
}

export function ReadingShell({
  eyebrow,
  title,
  description,
  backHref = '/garden',
  children,
}: ReadingShellProps) {
  return (
    <div className="relative h-full overflow-y-auto bg-[#e9efe3] pb-32 text-[#283f2a]">
      <Image
        src="/garden/backgrounds/sanctuary-golden-hour.webp"
        alt=""
        fill
        sizes="100vw"
        className="fixed object-cover opacity-30"
        priority
      />
      <div
        className="fixed inset-0 bg-[linear-gradient(180deg,rgba(249,245,232,.74),rgba(229,238,223,.9))]"
        aria-hidden="true"
      />

      <main className="relative z-10 mx-auto w-full max-w-4xl px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <header className="flex items-start justify-between gap-4 py-2">
          <Link
            href={backHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/70 bg-[#fffaf0]/88 px-3.5 text-sm font-bold text-[#59704f] shadow-sm backdrop-blur-xl transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789a68]"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>
          <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/70 bg-[#fffaf0]/82 px-3.5 text-sm font-bold text-[#5d7655] shadow-sm backdrop-blur-xl">
            <BookOpenText className="h-4 w-4" />
            Reading
          </span>
        </header>

        <div className="mx-auto mt-6 max-w-2xl text-center">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#78906d]">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold text-[#315027] sm:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#61725b] sm:text-base">
              {description}
            </p>
          )}
        </div>

        {children}
      </main>
    </div>
  )
}


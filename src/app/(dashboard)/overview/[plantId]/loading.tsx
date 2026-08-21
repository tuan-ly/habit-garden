import Image from 'next/image'
import { Skeleton } from '@/components/ui/skeleton'

export default function PlantStoryLoading() {
  return (
    <div className="relative h-full overflow-hidden bg-[#edf1e7] text-[#293e27]">
      <Image
        src="/garden/backgrounds/sanctuary-golden-hour.webp"
        alt=""
        fill
        sizes="100vw"
        className="fixed object-cover opacity-20"
        loading="eager"
      />
      <div className="fixed inset-0 bg-[#fbf8ef]/86 backdrop-blur-[2px]" aria-hidden="true" />

      <main className="relative z-10 mx-auto w-full max-w-6xl animate-pulse px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:px-8">
        <div className="flex min-h-12 items-center justify-between py-1">
          <Skeleton className="h-11 w-32 rounded-full bg-[#e1e8d9]" />
          <Skeleton className="hidden h-9 w-44 rounded-full bg-[#e1e8d9] sm:block" />
        </div>

        <section className="mt-5 flex min-h-32 items-center gap-4 rounded-[2rem] border border-white/75 bg-[#edf1df]/92 p-4 shadow-sm">
          <Skeleton className="h-24 w-24 shrink-0 rounded-[1.5rem] bg-[#dbe5d0]" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-3 w-28 bg-[#dbe5d0]" />
            <Skeleton className="h-8 w-2/3 bg-[#dbe5d0]" />
            <Skeleton className="h-4 w-40 bg-[#dbe5d0]" />
          </div>
        </section>

        <div className="mt-5 grid items-start gap-7 lg:grid-cols-[minmax(0,1.08fr)_minmax(22rem,0.92fr)]">
          <section className="rounded-[2rem] border border-[#d9c99e] bg-[#fffaf0]/94 p-6 shadow-sm">
            <Skeleton className="h-3 w-20 bg-[#ece5d5]" />
            <Skeleton className="mt-4 h-11 w-3/4 bg-[#ece5d5]" />
            <Skeleton className="mt-3 h-5 w-full bg-[#ece5d5]" />
            <Skeleton className="mt-2 h-5 w-4/5 bg-[#ece5d5]" />
            <div className="mt-6 space-y-4 border-y border-[#e2dbc8] py-4">
              <Skeleton className="h-14 w-full bg-[#ece5d5]" />
              <Skeleton className="h-14 w-full bg-[#ece5d5]" />
            </div>
          </section>

          <section>
            <Skeleton className="h-10 w-52 bg-[#e1e8d9]" />
            <div className="mt-4 space-y-px overflow-hidden rounded-[1.45rem] border border-[#d8c99f] bg-[#fffdf7]/86">
              {[0, 1, 2].map((item) => (
                <div key={item} className="flex min-h-24 items-center gap-4 p-3">
                  <Skeleton className="h-16 w-16 shrink-0 rounded-[1.2rem] bg-[#e4ead9]" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-3/4 bg-[#ece5d5]" />
                    <Skeleton className="h-4 w-full bg-[#ece5d5]" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

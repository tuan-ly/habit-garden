import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Leaf, Sparkles } from 'lucide-react'
import { CapabilitySlot } from '@/components/capabilities/capability-slot'
import { PlantImage } from '@/components/plants/plant-image'
import type { PlantWithType } from '@/types/database'

export function PlantCapabilityHome({ plant }: { plant: PlantWithType }) {
  const typeName = plant.plant_type.name_vi || plant.plant_type.name
  const hasPausedJourney = Boolean(plant.guided_habit && !plant.guided_habit.is_active)

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

      <main className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-10 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <Link
          href="/garden"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/70 bg-[#fffaf0]/88 px-3.5 text-sm font-bold text-[#59704f] shadow-sm backdrop-blur-xl"
        >
          <ArrowLeft className="h-4 w-4" />
          Về khu vườn
        </Link>

        <section className="mx-auto mt-8 grid max-w-2xl overflow-hidden rounded-[2rem] border border-white/75 bg-[#fffaf0]/92 shadow-[0_26px_80px_rgba(47,72,42,.2)] backdrop-blur-2xl sm:grid-cols-[0.9fr_1.1fr]">
          <div className="relative flex min-h-[300px] items-end justify-center overflow-hidden bg-[radial-gradient(circle_at_50%_30%,#f9efc9_0%,#dce8c9_52%,#b9cfaa_100%)] pb-10">
            <PlantImage
              plant={plant}
              size="2xl"
              showStatusIndicator={false}
              priority
              className="origin-bottom scale-[2.15]"
            />
          </div>

          <div className="flex flex-col justify-center p-6 sm:p-8">
            <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#78906d]">
              <Leaf className="h-4 w-4" />
              {typeName}
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold text-[#315027]">
              {plant.name}
            </h1>
            <div className="mt-5 rounded-2xl border border-[#d7e1ce] bg-[#eef3e7] p-4">
              <p className="flex items-center gap-2 font-extrabold text-[#45613f]">
                <Sparkles className="h-5 w-5" />
                {hasPausedJourney ? 'Hành trình đang nghỉ' : 'Chưa có hành trình riêng'}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#66765f]">
                {hasPausedJourney
                  ? 'Nhật ký vẫn còn nguyên. Bạn có thể tiếp tục khi thấy đúng nhịp, hoặc gỡ để chọn một Hành trình khác.'
                  : 'Cây vẫn trọn vẹn và có thể được chăm như bình thường. Bạn chỉ cần chọn hành trình nếu muốn cây hướng dẫn thói quen này sâu hơn.'}
              </p>
            </div>
            <div className="mt-5">
              <CapabilitySlot plant={plant} />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

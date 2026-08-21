'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { attachReadingCapabilityToPlant } from '@/lib/actions/habit-sessions'
import { usePlants } from '@/lib/context/plants-context'
import type { PlantWithType } from '@/types/database'

interface ReadingCapabilityControlProps {
  plant: PlantWithType
  onAttached?: () => void
  compact?: boolean
}

export function ReadingCapabilityControl({
  plant,
  onAttached,
  compact = false,
}: ReadingCapabilityControlProps) {
  const router = useRouter()
  const { updatePlant } = usePlants()
  const [isPending, startTransition] = useTransition()

  const handleAttach = () => {
    startTransition(async () => {
      const result = await attachReadingCapabilityToPlant(plant.id)
      if (!result.success) {
        toast.error('Chưa thể gắn theo dõi đọc sách', {
          description: result.error,
        })
        return
      }

      updatePlant(plant.id, {
        guided_habit: {
          id: result.data.habit.id,
          plant_id: plant.id,
          type: result.data.habit.type,
          is_active: result.data.habit.is_active,
        },
      })

      toast.success('Đã gắn theo dõi đọc sách', {
        description: `${plant.name} dùng chung log và tiến trình của hành trình đọc.`,
      })
      onAttached?.()
      router.refresh()
    })
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={handleAttach}
        disabled={isPending}
        className="mt-3 flex min-h-14 w-full items-center gap-3 rounded-2xl border border-[#d8dfc8] bg-[#f2f0df] px-3 text-left text-[#315027] transition hover:bg-[#e9ead7] disabled:cursor-wait disabled:opacity-65"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#31523b] text-[#fff9e8]">
          <BookOpen className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-bold">
            {isPending ? 'Đang gắn…' : 'Gắn theo dõi đọc sách'}
          </span>
          <span className="mt-0.5 block truncate text-xs font-medium text-[#6a7763]">
            Dùng chung hành trình; không chuyển khỏi cây khác
          </span>
        </span>
      </button>
    )
  }

  return (
    <section className="rounded-[1.75rem] border border-[#d8dfc8] bg-[#f2f0df] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#31523b] text-[#fff9e8]">
          <BookOpen className="h-5 w-5" />
        </div>
        <div>
          <p className="font-display text-lg font-semibold text-[#315027]">
            Theo dõi đọc sách
          </p>
          <p className="mt-1 text-sm leading-6 text-[#697561]">
            Gắn hành trình đọc vào cây này. Nhiều cây có thể dùng chung một hành trình,
            còn mỗi cây chỉ giữ một capability.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={handleAttach}
        disabled={isPending}
        className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#31523b] px-5 text-sm font-bold text-[#fff9e8] transition hover:bg-[#274633] disabled:cursor-wait disabled:opacity-65"
      >
        {isPending ? 'Đang gắn…' : 'Gắn theo dõi đọc sách'}
      </button>
    </section>
  )
}

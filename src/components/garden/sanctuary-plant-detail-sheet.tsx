'use client'

import Link from 'next/link'
import { getPlantHref } from '@/capabilities/core/routes'
import { CapabilitySlot } from '@/components/capabilities/capability-slot'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PlantImage } from '@/components/plants/plant-image'
import { usePlants } from '@/lib/context/plants-context'
import { isToday } from '@/lib/utils'
import type { PlantWithType } from '@/types/database'
import { CalendarDays, Check, ChevronRight, Leaf, Moon, Sprout } from 'lucide-react'

interface SanctuaryPlantDetailSheetProps {
  plant: PlantWithType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function getGuidedHabitHref(plant: PlantWithType): string | null {
  if (!plant.guided_habit?.is_active) return null
  return getPlantHref(plant.id)
}

function getStateCopy(plant: PlantWithType): { label: string; body: string } {
  if (isToday(plant.last_watered_at)) {
    return { label: 'Đã được chăm hôm nay', body: 'Cây đang giữ lại khoảnh khắc bạn vừa hiện diện.' }
  }
  if (plant.status === 'sleeping' || plant.status === 'waiting') {
    return { label: 'Đang yên nghỉ', body: 'Cây không mất đi. Nó sẽ thức dậy khi bạn sẵn sàng.' }
  }
  return { label: 'Đang chờ một bước nhỏ', body: 'Không cần hoàn hảo — một lần quay lại là đủ.' }
}

export function SanctuaryPlantDetailSheet({
  plant,
  open,
  onOpenChange,
}: SanctuaryPlantDetailSheetProps) {
  const { updatePlant } = usePlants()
  if (!plant) return null
  const state = getStateCopy(plant)
  const purpose = plant.why_i_started || plant.habit_description || plant.tiny_seed
  const goalProgress = plant.goal?.current_period_target
    ? Math.min(100, (plant.goal.period_progress / plant.goal.current_period_target) * 100)
    : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        closeLabel={`Đóng chi tiết ${plant.name}`}
        className="h-[90dvh] overflow-y-auto rounded-t-[2.25rem] border-x border-t border-white/80 bg-[#fffaf0] px-0 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-[#2f472a] shadow-[0_-24px_80px_rgba(31,62,39,0.28)] motion-reduce:animate-none motion-reduce:transition-none sm:left-1/2 sm:max-w-2xl sm:-translate-x-1/2"
      >
        <div className="mx-auto mt-1 h-1.5 w-12 rounded-full bg-[#cdd8c2]" aria-hidden="true" />

        <SheetHeader className="px-6 pb-5 pt-5 text-left sm:px-8">
          <div className="flex items-center gap-5">
            <div className="flex h-28 w-28 shrink-0 items-end justify-center rounded-[2rem] bg-[#e7edda] p-3 shadow-inner">
              <PlantImage plant={plant} size="2xl" alignBottom showStatusIndicator={false} className="!w-24" />
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#759068]">
                <Leaf className="h-4 w-4 fill-[#789a68]/20" />
                {plant.plant_type.name}
              </p>
              <SheetTitle className="mt-2 truncate font-display text-3xl font-semibold text-[#315027]">
                {plant.name}
              </SheetTitle>
              <SheetDescription className="mt-1 text-sm leading-5 text-[#6d7868]">
                Một mối quan hệ đang lớn lên cùng bạn.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4 px-5 sm:px-8">
          <section className="rounded-[1.75rem] bg-[#31523b] p-5 text-[#fff9e8] shadow-[0_16px_38px_rgba(36,74,45,0.18)]">
            <p className="flex items-center gap-2 text-sm font-bold">
              {isToday(plant.last_watered_at) ? <Check className="h-5 w-5" /> : <Sprout className="h-5 w-5" />}
              {state.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#dce5d0]">{state.body}</p>
          </section>

          <CapabilitySlot
            plant={plant}
            onCapabilityChange={capability => {
              updatePlant(plant.id, {
                guided_habit: capability,
              })
            }}
            onNavigate={() => onOpenChange(false)}
          />

          {purpose && (
            <section className="rounded-[1.75rem] border border-[#dbe4d2] bg-white/65 p-5">
              <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#7b8d72]">
                <Leaf className="h-4 w-4" />
                Vì sao mình bắt đầu
              </p>
              <blockquote className="mt-3 font-display text-xl italic leading-8 text-[#3c5735]">
                “{purpose}”
              </blockquote>
            </section>
          )}

          <section className="rounded-[1.75rem] border border-[#dbe4d2] bg-white/65 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#7b8d72]">Cây đang lớn</p>
                <p className="mt-1 font-display text-2xl font-semibold text-[#315027]">
                  {Math.round(plant.growth_percentage)}%
                </p>
              </div>
              <Sprout className="h-7 w-7 text-[#6f925e]" />
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#dfe7d7]">
              <div
                className="h-full rounded-full bg-[#789a68]"
                style={{ width: `${Math.min(100, plant.growth_percentage)}%` }}
              />
            </div>
            <p className="mt-3 text-sm leading-6 text-[#6c7966]">
              Mỗi lần quay lại để lại một dấu vết. Cây không cần lớn nhanh để trở nên có ý nghĩa.
            </p>
          </section>

          {goalProgress !== null && plant.goal && (
            <section className="rounded-[1.75rem] border border-[#dbe4d2] bg-[#eef2e6] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 font-bold text-[#40583a]">
                  <CalendarDays className="h-5 w-5" />
                  {plant.goal.period_label || 'Mùa hiện tại'}
                </p>
                <span className="text-sm font-bold text-[#5f7557]">
                  {plant.goal.period_progress}/{plant.goal.current_period_target} {plant.goal.unit}
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/75">
                <div className="h-full rounded-full bg-[#6f925e]" style={{ width: `${goalProgress}%` }} />
              </div>
            </section>
          )}

          <section className="grid grid-cols-3 gap-2 rounded-[1.75rem] border border-[#dbe4d2] bg-white/55 p-3 text-center">
            <div className="rounded-2xl px-2 py-3">
              <p className="font-display text-xl font-semibold text-[#315027]">{plant.total_waterings}</p>
              <p className="mt-1 text-[11px] text-[#74806e]">lần chăm</p>
            </div>
            <div className="rounded-2xl border-x border-[#e1e7db] px-2 py-3">
              <p className="font-display text-xl font-semibold text-[#315027]">{plant.current_streak}</p>
              <p className="mt-1 text-[11px] text-[#74806e]">nhịp hiện tại</p>
            </div>
            <div className="rounded-2xl px-2 py-3">
              <p className="flex items-center justify-center gap-1 font-display text-xl font-semibold text-[#315027]">
                <Moon className="h-4 w-4" />
                {plant.status === 'resting' ? 'Có' : '—'}
              </p>
              <p className="mt-1 text-[11px] text-[#74806e]">đang nghỉ</p>
            </div>
          </section>

          <Link
            href="/overview"
            onClick={() => onOpenChange(false)}
            className="flex min-h-14 items-center justify-between rounded-full bg-[#e4ecd9] px-5 font-bold text-[#40583a] transition hover:bg-[#d9e4cc]"
          >
            Xem toàn bộ hành trình
            <ChevronRight className="h-5 w-5" />
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}

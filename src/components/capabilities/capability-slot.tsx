'use client'

import { useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Loader2, Pause, Play, Plus, Sparkles, Trash2 } from 'lucide-react'
import { getCapabilityManifest } from '@/capabilities/core/catalog'
import { getPlantHref } from '@/capabilities/core/routes'
import type { CapabilityAttachment } from '@/lib/actions/capabilities'
import {
  pauseCapabilityOnPlant,
  removeCapabilityFromPlant,
  resumeCapabilityOnPlant,
} from '@/lib/actions/capabilities'
import { CapabilityIcon } from '@/components/capabilities/capability-icon'
import { CapabilityLibraryDialog } from '@/components/capabilities/capability-library-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { PlantWithType } from '@/types/database'
import type { PlantCapabilitySummary } from '@/types/habits'

interface CapabilitySlotProps {
  plant: PlantWithType
  onAttached?: (attachment: CapabilityAttachment) => void
  onCapabilityChange?: (capability: PlantCapabilitySummary | null) => void
  onNavigate?: () => void
}

export function CapabilitySlot({
  plant,
  onAttached,
  onCapabilityChange,
  onNavigate,
}: CapabilitySlotProps) {
  const router = useRouter()
  const chooseJourneyButtonRef = useRef<HTMLButtonElement>(null)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [attached, setAttached] = useState<PlantCapabilitySummary | null>(plant.guided_habit ?? null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const manifest = attached ? getCapabilityManifest(attached.type) : null

  function handleAttached(attachment: CapabilityAttachment) {
    const summary = {
      id: attachment.habit.id,
      plant_id: plant.id,
      type: attachment.habit.type,
      is_active: attachment.habit.is_active,
    }
    setAttached(summary)
    onAttached?.(attachment)
    onCapabilityChange?.(summary)
  }

  function handleManagement(action: 'pause' | 'resume' | 'remove') {
    setError(null)
    startTransition(async () => {
      const result = action === 'pause'
        ? await pauseCapabilityOnPlant(plant.id)
        : action === 'resume'
          ? await resumeCapabilityOnPlant(plant.id)
          : await removeCapabilityFromPlant(plant.id)

      if (!result.success) {
        setError(result.error)
        return
      }

      const summary = result.data.state === 'removed'
        ? null
        : {
            id: result.data.habit.id,
            plant_id: plant.id,
            type: result.data.habit.type,
            is_active: result.data.state === 'active',
          }
      setAttached(summary)
      onCapabilityChange?.(summary)
      router.refresh()
    })
  }

  if (attached && manifest) {
    const isActive = attached.is_active

    return (
      <section className="overflow-hidden rounded-[1.75rem] border border-[#d8dfc8] bg-[#f2f0df]">
        <div className="flex items-start gap-3 px-5 pb-4 pt-5">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#31523b] text-[#fff9e8]">
            <CapabilityIcon icon={manifest.icon} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#718064]">Hành trình của cây</p>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? 'bg-[#dce8d3] text-[#527148]' : 'bg-[#e8dfcf] text-[#796b55]'}`}>
                {isActive ? 'Đang đồng hành' : 'Đang tạm dừng'}
              </span>
            </div>
            <p className="mt-1 font-display text-xl font-semibold text-[#315027]">{manifest.label}</p>
            <p className="mt-1 text-sm leading-6 text-[#697561]">
              {isActive
                ? manifest.description
                : 'Nhật ký cũ vẫn được giữ. Cây quay về nhịp chăm bình thường cho đến khi bạn tiếp tục.'}
            </p>
          </div>
        </div>

        {error && (
          <p className="mx-4 mb-3 rounded-2xl bg-[#f8e7e2] px-4 py-3 text-sm font-medium text-[#8d4b43]" role="alert">
            {error}
          </p>
        )}

        {isActive ? (
          <Link
            href={getPlantHref(plant.id)}
            onClick={onNavigate}
            className="flex min-h-14 items-center justify-between border-y border-[#d8dfc8] bg-[#31523b] px-5 text-sm font-bold text-[#fff9e8] transition hover:bg-[#274633]"
          >
            Tiếp tục hành trình
            <ChevronRight className="h-5 w-5" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => handleManagement('resume')}
            disabled={isPending}
            className="flex min-h-14 w-full items-center justify-center gap-2 border-y border-[#d8dfc8] bg-[#31523b] px-5 text-sm font-bold text-[#fff9e8] transition hover:bg-[#274633] disabled:cursor-wait disabled:opacity-60"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
            Tiếp tục đồng hành
          </button>
        )}

        <div className="grid grid-cols-2 divide-x divide-[#d8dfc8] bg-white/45">
          {isActive ? (
            <button
              type="button"
              onClick={() => handleManagement('pause')}
              disabled={isPending}
              className="flex min-h-12 items-center justify-center gap-2 px-3 text-xs font-bold text-[#5d6f56] transition hover:bg-white/65 disabled:cursor-wait disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
              Tạm dừng
            </button>
          ) : (
            <span className="flex min-h-12 items-center justify-center px-3 text-xs font-medium text-[#7a8674]">
              Giữ nguyên nhật ký
            </span>
          )}

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                disabled={isPending}
                className="flex min-h-12 items-center justify-center gap-2 px-3 text-xs font-bold text-[#8b5b4f] transition hover:bg-[#f8ebe4] disabled:cursor-wait disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Gỡ khỏi cây
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-[#d8dfc8] bg-[#fffaf0] text-[#2f472a] sm:rounded-[1.75rem]">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-display text-2xl text-[#315027]">
                  Gỡ {manifest.shortLabel} khỏi {plant.name}?
                </AlertDialogTitle>
                <AlertDialogDescription className="leading-6 text-[#697561]">
                  Phần Hành trình của cây sẽ trống để bạn chọn hướng khác. Toàn bộ phiên, tiến độ và ghi chú cũ vẫn được lưu lại.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-full">Giữ lại</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleManagement('remove')}
                  className="rounded-full bg-[#9a5949] text-white hover:bg-[#874b3e]"
                >
                  Gỡ nhưng giữ nhật ký
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="rounded-[1.75rem] border border-dashed border-[#bdcbb5] bg-[#f7f4e7] p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e2ead9] text-[#58764f]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#718064]">Hành trình của cây</p>
            <p className="mt-1 font-display text-xl font-semibold text-[#315027]">Cây sẽ đồng hành theo cách nào?</p>
            <p className="mt-1 text-sm leading-6 text-[#697561]">
              Tùy chọn này thêm hướng dẫn cho chính thói quen của cây. Bạn có thể để trống và chăm cây như bình thường.
            </p>
          </div>
        </div>
        <button
          ref={chooseJourneyButtonRef}
          type="button"
          onClick={() => setLibraryOpen(true)}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#e2ead9] px-5 text-sm font-bold text-[#405f3a] transition hover:bg-[#d8e4cf] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789a68]"
        >
          <Plus className="h-5 w-5" />
          Chọn hành trình
        </button>
      </section>

      <CapabilityLibraryDialog
        plant={plant}
        open={libraryOpen}
        onOpenChange={setLibraryOpen}
        onAttached={handleAttached}
        onReturnFocus={() => chooseJourneyButtonRef.current?.focus()}
      />
    </>
  )
}

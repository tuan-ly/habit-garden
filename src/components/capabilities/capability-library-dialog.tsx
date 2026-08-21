'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, ChevronRight, Clock3, Leaf, Loader2, Sparkles } from 'lucide-react'
import { getCapabilityManifest, listCapabilityManifests } from '@/capabilities/core/catalog'
import type { CapabilityHighlightIconKey } from '@/capabilities/core/types'
import type { CapabilityAttachment } from '@/lib/actions/capabilities'
import { attachCapabilityToPlant } from '@/lib/actions/capabilities'
import { CapabilityIcon } from '@/components/capabilities/capability-icon'
import { PlantImage } from '@/components/plants/plant-image'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { PlantWithType } from '@/types/database'

interface CapabilityLibraryDialogProps {
  plant: PlantWithType
  open: boolean
  onOpenChange: (open: boolean) => void
  onAttached?: (attachment: CapabilityAttachment) => void
  onReturnFocus?: () => void
}

function CapabilityHighlightIcon({ icon }: { icon: CapabilityHighlightIconKey }) {
  if (icon === 'session') return <Clock3 className="h-5 w-5 text-[#6d905c]" />
  return <Leaf className="h-5 w-5 text-[#6d905c]" />
}

export function CapabilityLibraryDialog({
  plant,
  open,
  onOpenChange,
  onAttached,
  onReturnFocus,
}: CapabilityLibraryDialogProps) {
  const router = useRouter()
  const manifests = listCapabilityManifests()
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [confirmedIntent, setConfirmedIntent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const selected = selectedKey ? getCapabilityManifest(selectedKey) : null

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setSelectedKey(null)
      setConfirmedIntent(false)
      setError(null)
    }
    onOpenChange(nextOpen)
  }

  function handleAttach() {
    if (!selected) return
    setError(null)

    startTransition(async () => {
      const result = await attachCapabilityToPlant({
        plantId: plant.id,
        capabilityKey: selected.key,
        confirmedIntent,
      })

      if (!result.success) {
        setError(result.error)
        return
      }

      onAttached?.(result.data)
      handleOpenChange(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[92dvh] overflow-y-auto border-[#d5dfca] bg-[#fffaf0] p-0 text-[#2f472a] motion-reduce:animate-none motion-reduce:transition-none sm:max-w-lg sm:rounded-[2rem]"
        closeLabel="Đóng thư viện hành trình"
        onCloseAutoFocus={event => {
          event.preventDefault()
          onReturnFocus?.()
        }}
      >
        {selected ? (
          <div>
            <div className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,#f7edc4_0%,#e4ecd8_52%,#d3e1c8_100%)] px-6 pb-4 pt-5">
              <button
                type="button"
                onClick={() => {
                  setSelectedKey(null)
                  setConfirmedIntent(false)
                  setError(null)
                }}
                className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-[#fffaf0]/85 text-[#4f6948] shadow-sm backdrop-blur-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789a68]"
                aria-label="Quay lại thư viện hành trình"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>

              <div className="mx-auto flex h-24 w-24 items-end justify-center rounded-[1.75rem] border border-white/70 bg-white/40 p-3 shadow-inner">
                <PlantImage
                  plant={plant}
                  size="2xl"
                  alignBottom
                  showStatusIndicator={false}
                  className="!w-20"
                />
              </div>
              <div className="mx-auto -mt-4 grid h-10 w-10 place-items-center rounded-xl border-2 border-[#fffaf0] bg-[#31523b] text-[#fff9e8] shadow-[0_10px_24px_rgba(41,72,43,.22)]">
                <CapabilityIcon icon={selected.icon} />
              </div>
            </div>

            <div className="px-6 pb-5 pt-4 sm:px-8">
              <DialogHeader className="text-left">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#78906d]">
                  Hành trình của {plant.name}
                </p>
                <DialogTitle className="mt-2 font-display text-3xl font-semibold leading-tight text-[#315027]">
                  {selected.label}
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-sm leading-6 text-[#687763]">
                  {selected.outcome}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 divide-y divide-[#dce4d4] rounded-[1.5rem] bg-[#eef3e7] px-4">
                {selected.highlights.map(highlight => (
                  <div key={highlight.title} className="flex items-center gap-3 py-3">
                    <CapabilityHighlightIcon icon={highlight.icon} />
                    <div>
                      <p className="text-sm font-bold text-[#40583a]">{highlight.title}</p>
                      <p className="mt-0.5 text-xs text-[#6e7c68]">{highlight.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {selected.eligibility.mode === 'explicit_match' && (
                <button
                  type="button"
                  aria-pressed={confirmedIntent}
                  onClick={() => setConfirmedIntent(value => !value)}
                  className="mt-4 flex w-full items-start gap-3 rounded-[1.35rem] border border-[#d8dfc8] bg-white/70 p-3 text-left transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#789a68]"
                >
                  <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${confirmedIntent ? 'border-[#496d3d] bg-[#496d3d] text-white' : 'border-[#aebca6] text-transparent'}`}>
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-[#40583a]">
                      {selected.eligibility.confirmationTitle}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[#6d7967]">
                      {selected.eligibility.confirmationDescription}
                    </span>
                  </span>
                </button>
              )}

              {error && (
                <p className="mt-4 rounded-2xl bg-[#f8e7e2] px-4 py-3 text-sm font-medium text-[#8d4b43]" role="alert">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleAttach}
                disabled={isPending || (selected.eligibility.mode === 'explicit_match' && !confirmedIntent)}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#31523b] px-5 text-sm font-bold text-[#fff9e8] shadow-[0_12px_28px_rgba(41,72,43,.2)] transition hover:bg-[#274633] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                {isPending
                  ? 'Đang bắt đầu…'
                  : `Bắt đầu hành trình ${selected.shortLabel.toLocaleLowerCase('vi-VN')}`}
              </button>
            </div>
          </div>
        ) : (
          <div className="px-6 pb-7 pt-8 sm:px-8">
            <DialogHeader className="text-left">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#78906d]">
                Hành trình của cây
              </p>
              <DialogTitle className="mt-2 font-display text-3xl font-semibold leading-tight text-[#315027]">
                Chọn cách {plant.name} đồng hành
              </DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-6 text-[#687763]">
                Cây vẫn trọn vẹn nếu bạn chưa chọn. Hành trình chỉ thêm một cách hướng dẫn cho chính thói quen này.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-6 overflow-hidden rounded-[1.6rem] border border-[#d8dfc8] bg-white/65">
              {manifests.map(manifest => (
                <button
                  key={manifest.key}
                  type="button"
                  onClick={() => setSelectedKey(manifest.key)}
                  className="flex min-h-24 w-full items-center gap-4 px-4 py-4 text-left transition hover:bg-[#f2f0df] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#789a68]"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#31523b] text-[#fff9e8] shadow-sm">
                    <CapabilityIcon icon={manifest.icon} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="font-display text-xl font-semibold text-[#315027]">{manifest.label}</span>
                      <span className="rounded-full bg-[#dfe9d6] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#56744d]">Sẵn sàng</span>
                    </span>
                    <span className="mt-1 block text-sm leading-5 text-[#697561]">{manifest.description}</span>
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-[#789a68]" />
                </button>
              ))}
            </div>

            <p className="mt-4 text-center text-xs leading-5 text-[#7b8875]">
              Những hành trình mới sẽ xuất hiện ở đây khi đã đủ dịu dàng và hữu ích để đồng hành cùng bạn.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

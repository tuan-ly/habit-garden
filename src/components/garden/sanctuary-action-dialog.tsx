'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PlantImage } from '@/components/plants/plant-image'
import type { WateringActionMode } from '@/components/plants/gentle-watering-modal'
import type { GardenActionKind } from '@/lib/garden-encounters'
import type { PlantWithType } from '@/types/database'
import { ArrowLeft, Check, Leaf, Moon, Sprout } from 'lucide-react'

interface SanctuaryActionDialogProps {
  plant: PlantWithType | null
  open: boolean
  initialMode: WateringActionMode
  actionKind: GardenActionKind
  onOpenChange: (open: boolean) => void
  onWater: (notes: string | undefined, estimatedXp: number, actionKind?: GardenActionKind) => Promise<void>
  onLogAndWater: (value: number | undefined, notes: string | undefined, estimatedXp: number, actionKind?: GardenActionKind) => Promise<void>
  onDetails: () => void
}

export function SanctuaryActionDialog({
  plant,
  open,
  initialMode,
  actionKind,
  onOpenChange,
  onWater,
  onLogAndWater,
  onDetails,
}: SanctuaryActionDialogProps) {
  const [selectedMode, setSelectedMode] = useState<WateringActionMode | null>(null)
  const [value, setValue] = useState('')
  const [notes, setNotes] = useState('')
  const mode = selectedMode ?? initialMode
  const hasGoal = !!plant?.goal_mode

  const closeAndReset = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSelectedMode(null)
      setValue('')
      setNotes('')
    }
    onOpenChange(nextOpen)
  }

  const submitCompleted = () => {
    if (!plant) return
    const numericValue = value.trim() ? Number(value) : undefined
    if (hasGoal && (numericValue === undefined || Number.isNaN(numericValue))) return

    closeAndReset(false)
    void onLogAndWater(
      numericValue,
      notes.trim() || undefined,
      10,
      actionKind === 'tiny' ? 'tiny' : 'care'
    )
  }

  const submitRest = () => {
    if (!plant) return
    closeAndReset(false)
    void onWater(notes.trim() || undefined, 0, 'rest')
  }

  return (
    <Dialog open={open} onOpenChange={closeAndReset}>
      <DialogContent className="max-h-[calc(100dvh-1.5rem)] gap-0 overflow-y-auto rounded-[2rem] border border-white/70 bg-[#fffaf0]/96 p-0 text-[#2f472a] shadow-[0_30px_90px_rgba(31,62,39,0.3)] backdrop-blur-2xl sm:max-w-md">
        {plant && (
          <>
            <DialogHeader className="border-b border-[#dce5cf] px-6 pb-5 pt-6 text-left">
              <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-end justify-center rounded-[1.5rem] bg-[#e9efd9] p-2 shadow-inner">
                  <PlantImage plant={plant} size="2xl" alignBottom showStatusIndicator={false} />
                </div>
                <div className="min-w-0">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-[#6a855d]">
                    <Sprout className="h-4 w-4" />
                    Một bước nhỏ hôm nay
                  </p>
                  <DialogTitle className="truncate font-display text-2xl font-semibold text-[#315027]">
                    {plant.name}
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-sm leading-5 text-[#65725f]">
                    {plant.tiny_seed || plant.why_i_started || 'Chỉ cần hiện diện một chút cũng đã có ý nghĩa.'}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 px-6 py-5">
              {mode !== 'choose' && (
                <button
                  type="button"
                  onClick={() => setSelectedMode('choose')}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full px-2 text-sm font-semibold text-[#657a5c] hover:text-[#315027]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Chọn cách khác
                </button>
              )}

              {mode === 'choose' && (
                <div className="space-y-3">
                  <Button
                    type="button"
                    onClick={() => setSelectedMode('log')}
                    className="h-14 w-full justify-start gap-3 rounded-2xl bg-[#5f854f] px-4 text-base font-bold text-white shadow-[0_12px_24px_rgba(69,105,57,0.2)] hover:bg-[#4c713e]"
                  >
                    <Check className="h-5 w-5" />
                    Mình đã làm
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedMode('water')}
                    className="h-14 w-full justify-start gap-3 rounded-2xl border-[#ccd9bf] bg-white/60 px-4 text-base font-semibold text-[#4f6548] hover:bg-[#edf2e4]"
                  >
                    <Moon className="h-5 w-5" />
                    Hôm nay mình nghỉ
                  </Button>
                  <button
                    type="button"
                    onClick={onDetails}
                    className="min-h-11 w-full text-sm font-semibold text-[#708068] hover:text-[#315027]"
                  >
                    Xem hành trình của cây
                  </button>
                </div>
              )}

              {mode === 'log' && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[#e9f0dc] p-4 text-sm leading-6 text-[#526849]">
                    <p className="flex items-center gap-2 font-bold text-[#315027]">
                      <Leaf className="h-5 w-5 fill-[#71935f]/25" />
                      Khu vườn sẽ phản hồi ngay sau bước này
                    </p>
                    <p className="mt-1">Không cần hoàn hảo — chỉ cần thành thật với điều bạn đã làm.</p>
                  </div>

                  {hasGoal && (
                    <label className="block text-sm font-semibold text-[#3d5637]">
                      Giá trị hôm nay
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          value={value}
                          onChange={(event) => setValue(event.target.value)}
                          inputMode="decimal"
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0"
                          className="h-12 rounded-2xl border-[#cdd9c1] bg-white/80 text-lg"
                        />
                        {plant.goal?.unit && (
                          <span className="shrink-0 text-sm font-medium text-[#687663]">{plant.goal.unit}</span>
                        )}
                      </div>
                    </label>
                  )}

                  <label className="block text-sm font-semibold text-[#3d5637]">
                    Ghi lại một điều nhỏ <span className="font-normal text-[#84917d]">(không bắt buộc)</span>
                    <Textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Hôm nay có điều gì đáng nhớ?"
                      className="mt-2 min-h-24 resize-none rounded-2xl border-[#cdd9c1] bg-white/80"
                    />
                  </label>

                  <Button
                    type="button"
                    onClick={submitCompleted}
                    disabled={hasGoal && !value.trim()}
                    className="h-14 w-full rounded-full bg-[#5f854f] text-base font-bold text-white shadow-[0_12px_26px_rgba(69,105,57,0.25)] hover:bg-[#4c713e]"
                  >
                    <Leaf className="h-5 w-5 fill-white/20" />
                    Ghi nhận và chăm cây
                  </Button>
                </div>
              )}

              {mode === 'water' && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[#e8eee5] p-4 text-sm leading-6 text-[#566657]">
                    <p className="flex items-center gap-2 font-bold text-[#334d35]">
                      <Moon className="h-5 w-5" />
                      Nghỉ cũng là một phần của trưởng thành
                    </p>
                    <p className="mt-1">Cây sẽ yên lặng chờ bạn. Không có chuỗi nào bị phá vỡ ở đây.</p>
                  </div>

                  <label className="block text-sm font-semibold text-[#3d5637]">
                    Bạn muốn nhắn gì cho ngày hôm nay? <span className="font-normal text-[#84917d]">(không bắt buộc)</span>
                    <Textarea
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                      placeholder="Mệt, bận, hoặc chỉ muốn thở chậm lại…"
                      className="mt-2 min-h-24 resize-none rounded-2xl border-[#cdd9c1] bg-white/80"
                    />
                  </label>

                  <Button
                    type="button"
                    onClick={submitRest}
                    className="h-14 w-full rounded-full bg-[#667b68] text-base font-bold text-white hover:bg-[#516454]"
                  >
                    <Moon className="h-5 w-5" />
                    Cho cây một ngày yên
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { Leaf, Sprout } from 'lucide-react'
import { toast } from 'sonner'
import { PlantImage } from '@/components/plants/plant-image'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { usePlants } from '@/lib/context/plants-context'
import { isPendingPlantDeath } from '@/lib/plant-status'

function oldestDeathFirst(a: { died_at: string | null }, b: { died_at: string | null }) {
  return (a.died_at ? new Date(a.died_at).getTime() : 0)
    - (b.died_at ? new Date(b.died_at).getTime() : 0)
}

export function PlantLossDialog() {
  const { plants, acknowledgePlantDeath } = usePlants()
  const [isAcknowledging, setIsAcknowledging] = useState(false)
  const plant = useMemo(
    () => plants.filter(isPendingPlantDeath).sort(oldestDeathFirst)[0] ?? null,
    [plants]
  )

  const handleAcknowledge = async () => {
    if (!plant || isAcknowledging) return

    setIsAcknowledging(true)
    const result = await acknowledgePlantDeath(plant.id)
    setIsAcknowledging(false)

    if (!result.success) {
      toast.error('Chưa thể lưu lời tạm biệt', {
        description: result.error || 'Hãy thử lại một lần nữa nhé.',
      })
    }
  }

  return (
    <AlertDialog open={Boolean(plant)}>
      {plant && (
        <AlertDialogContent className="max-w-md overflow-hidden rounded-[2rem] border-[#d8d0bf] bg-[#fffaf0] p-0 text-[#3a4934] shadow-[0_28px_100px_rgba(39,49,34,0.38)]">
          <div className="relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,#e8dfc8_0%,#d4c8ae_44%,#a69d8e_100%)] px-8 pb-5 pt-8 text-center">
            <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,transparent,rgba(93,81,60,0.18))]" aria-hidden="true" />
            <div className="relative mx-auto flex h-32 w-32 items-end justify-center rounded-full border border-white/45 bg-[#d9d3c5]/55 p-3 shadow-inner">
              <PlantImage plant={plant} size="2xl" alignBottom showStatusIndicator={false} className="!w-28" />
            </div>
          </div>

          <AlertDialogHeader className="px-7 pb-2 pt-6 text-center">
            <div className="mx-auto flex w-fit items-center gap-2 rounded-full bg-[#eee6d6] px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#746c5c]">
              <Leaf className="h-3.5 w-3.5" />
              Một lời tạm biệt
            </div>
            <AlertDialogTitle className="pt-4 font-display text-3xl font-semibold tracking-tight text-[#394432]">
              {plant.name} đã khép lại
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2 text-sm leading-6 text-[#697061]">
              Cây này đã cùng bạn đi qua {plant.total_waterings} lần chăm sóc. Dấu vết của hành trình vẫn được giữ lại, ngay cả khi hôm nay nó dừng ở đây.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="mx-7 my-4 rounded-2xl border border-[#e3d9c7] bg-[#f7f0e3] p-4 text-sm leading-6 text-[#65705d]">
            <p className="flex items-start gap-2">
              <Sprout className="mt-0.5 h-4 w-4 shrink-0 text-[#8b9d72]" />
              Không phải mọi hạt giống đều lớn thành cây. Khi bạn sẵn sàng, khoảng đất này sẽ chờ một khởi đầu mới.
            </p>
          </div>

          <AlertDialogFooter className="border-t border-[#e7dfd0] bg-[#fffdf7] px-7 py-5 sm:justify-center">
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault()
                void handleAcknowledge()
              }}
              disabled={isAcknowledging}
              className="min-h-12 w-full rounded-full bg-[#45583d] px-6 font-bold text-[#fffaf0] hover:bg-[#364a31] sm:w-full"
            >
              {isAcknowledging ? 'Đang lưu...' : `Tạm biệt, ${plant.name}`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      )}
    </AlertDialog>
  )
}

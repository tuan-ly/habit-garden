'use client'

import { useEffect } from 'react'
import { Leaf, Sparkles } from 'lucide-react'

interface SanctuaryGardenReactionProps {
  active: boolean
  plantName?: string
  onComplete: () => void
}

export function SanctuaryGardenReaction({
  active,
  plantName,
  onComplete,
}: SanctuaryGardenReactionProps) {
  useEffect(() => {
    if (!active) return
    const timer = setTimeout(onComplete, 2600)
    return () => clearTimeout(timer)
  }, [active, onComplete])

  if (!active) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[90] overflow-hidden" aria-live="polite">
      <div className="sanctuary-reaction-glow absolute left-1/2 top-[42%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f5e99d]/25 blur-2xl" />

      <div className="sanctuary-reaction-leaves absolute left-1/2 top-[39%] -translate-x-1/2 -translate-y-1/2 text-[#f7efbd]">
        <Sparkles className="h-12 w-12 drop-shadow-[0_0_18px_rgba(255,246,176,0.95)]" />
      </div>

      <div className="sanctuary-reaction-copy absolute left-1/2 top-[56%] w-[min(88vw,22rem)] -translate-x-1/2 rounded-full border border-white/50 bg-[#294532]/82 px-5 py-3 text-center text-[#fff9e8] shadow-[0_18px_45px_rgba(23,53,31,0.28)] backdrop-blur-xl">
        <p className="flex items-center justify-center gap-2 font-display text-lg font-semibold">
          <Leaf className="h-5 w-5 fill-[#dce9b8]/30" />
          {plantName ? `${plantName} đang sáng lên` : 'Khu vườn đang sáng lên'}
        </p>
        <p className="mt-0.5 text-xs text-[#e1e9cf]">Một bước nhỏ đã được ghi nhận</p>
      </div>
    </div>
  )
}

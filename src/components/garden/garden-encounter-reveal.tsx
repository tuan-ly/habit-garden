'use client'

import { useEffect } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Feather,
  Flower2,
  Leaf,
  MoonStar,
  Snail,
  Sparkles,
  Sun,
  Wind,
} from 'lucide-react'
import type { DailyGardenEncounterMemory } from './use-daily-garden-encounter'

interface GardenEncounterRevealProps {
  memory: DailyGardenEncounterMemory
  reducedMotion: boolean
  onComplete: () => void
}

const encounterIcons: Record<DailyGardenEncounterMemory['encounter']['icon'], LucideIcon> = {
  sparkles: Sparkles,
  snail: Snail,
  feather: Feather,
  flower: Flower2,
  moon: MoonStar,
  leaf: Leaf,
  wind: Wind,
  sun: Sun,
}

export function GardenEncounterReveal({
  memory,
  reducedMotion,
  onComplete,
}: GardenEncounterRevealProps) {
  const EncounterIcon = encounterIcons[memory.encounter.icon]

  useEffect(() => {
    const timer = setTimeout(onComplete, reducedMotion ? 4600 : 6800)
    return () => clearTimeout(timer)
  }, [onComplete, reducedMotion])

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[95] overflow-hidden"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="absolute left-1/2 top-[43%] -translate-x-1/2 -translate-y-1/2">
        <div className={reducedMotion ? undefined : 'garden-encounter-icon'}>
          <div className="grid h-20 w-20 place-items-center rounded-full border border-[#fff8d8]/75 bg-[#31523b]/88 text-[#f7efbd] shadow-[0_0_55px_rgba(246,230,143,0.55)] backdrop-blur-xl">
            <EncounterIcon className="h-9 w-9" strokeWidth={1.7} />
          </div>
        </div>
      </div>

      <div className="absolute left-1/2 top-[57%] w-[min(88vw,25rem)] -translate-x-1/2">
        <div className={reducedMotion ? undefined : 'garden-encounter-card'}>
          <div className="rounded-[1.75rem] border border-white/65 bg-[#fffaf0]/95 px-5 py-4 text-center text-[#315027] shadow-[0_24px_70px_rgba(22,52,31,0.3)] backdrop-blur-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#78906d]">
              Khu vườn vừa kể
            </p>
            <h2 className="mt-2 font-display text-xl font-semibold leading-tight">
              {memory.copy.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#65725f]">
              {memory.copy.body}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

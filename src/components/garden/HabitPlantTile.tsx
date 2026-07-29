'use client'

import { BookOpen, Play } from 'lucide-react'
import type { VirtualPlant } from '@/lib/habit-plant-mapping'
import type { HabitPlantStage } from '@/types/habits'

interface HabitPlantTileProps {
  plant: VirtualPlant
  isActive?: boolean
}

const STAGE_STYLES: Record<HabitPlantStage, { size: string; surface: string }> = {
  seed: {
    size: 'h-12 w-12',
    surface: 'from-[#b68449] to-[#815b35] ring-[#f6dfa5]/55',
  },
  sprout: {
    size: 'h-14 w-14',
    surface: 'from-[#91ad63] to-[#557944] ring-[#e6f0bd]/60',
  },
  growing: {
    size: 'h-16 w-16',
    surface: 'from-[#76a268] to-[#3f7048] ring-[#dcebbc]/60',
  },
  blooming: {
    size: 'h-[4.5rem] w-[4.5rem]',
    surface: 'from-[#6ea58a] to-[#356e5d] ring-[#f4dfa8]/65',
  },
  mature: {
    size: 'h-20 w-20',
    surface: 'from-[#557f69] to-[#274f43] ring-[#f6dfa5]/70',
  },
}

export function HabitPlantTile({ plant, isActive = false }: HabitPlantTileProps) {
  const stage = STAGE_STYLES[plant.plant_stage]

  return (
    <div className="relative flex w-24 flex-col items-center gap-1.5" data-habit-plant={plant.habit_id}>
      <div
        className={`relative flex items-center justify-center rounded-full bg-gradient-to-br shadow-[0_10px_24px_rgba(50,65,37,0.28)] ring-2 ${stage.size} ${stage.surface}`}
      >
        <BookOpen className="h-1/2 w-1/2 text-[#fff7df]" strokeWidth={1.8} />
        {isActive && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#315f52] text-[#fff7df] shadow-md ring-2 ring-[#fff1bf] motion-safe:animate-pulse">
            <Play className="h-3 w-3 fill-current" aria-hidden="true" />
            <span className="sr-only">Reading session active</span>
          </span>
        )}
      </div>

      <span className="max-w-24 truncate rounded-full bg-[#fff8e8]/90 px-2.5 py-1 text-[11px] font-semibold text-[#38513a] shadow-sm ring-1 ring-[#6e865f]/20">
        {plant.name}
      </span>

      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-[#476348]/20" aria-label={`${Math.round(plant.growth_percentage)}% growth`}>
        <span
          className="block h-full rounded-full bg-[#6f965f]"
          style={{ width: `${Math.max(0, Math.min(100, plant.growth_percentage))}%` }}
        />
      </span>
    </div>
  )
}

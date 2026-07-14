'use client'

import { cn } from '@/lib/utils'

interface PlantFocusFrameProps {
  tileSize: number
  gridSize: number
  closing?: boolean
}

export function getPlantFocusFrameSize(tileSize: number, gridSize: number) {
  const footprintAdjustment = Math.min(Math.max(gridSize - 1, 0), 2)

  return {
    width: tileSize * (1.68 + footprintAdjustment * 0.12),
    height: tileSize * (1.94 + footprintAdjustment * 0.1),
    bottom: -tileSize * (0.12 + footprintAdjustment * 0.02),
  }
}

export function getPlantFocusTargetYOffset(viewportWidth: number, viewportHeight: number) {
  if (viewportWidth < 640) {
    return Math.min(52, Math.max(24, viewportHeight * 0.045))
  }

  return Math.min(112, Math.max(48, viewportHeight * 0.12))
}

/**
 * A world-space frame for the focused plant. It shares the plant's tile anchor,
 * so camera movement and responsive garden scaling keep the composition intact.
 */
export function PlantFocusFrame({ tileSize, gridSize, closing = false }: PlantFocusFrameProps) {
  const frameSize = getPlantFocusFrameSize(tileSize, gridSize)

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 z-0 -translate-x-1/2"
      style={frameSize}
    >
      <div
        data-plant-focus-frame="true"
        className={cn(
          'relative h-full w-full overflow-hidden rounded-[2.5rem] border border-[#e7cf91]/80',
          'bg-[linear-gradient(180deg,rgba(255,251,235,0.78),rgba(239,244,224,0.52))]',
          'shadow-[inset_0_0_32px_rgba(255,255,238,0.82),0_22px_60px_rgba(48,72,38,0.2),0_0_42px_rgba(238,211,137,0.24)]',
          'backdrop-blur-[2px] transition-[opacity,transform] duration-500 ease-out',
          'motion-reduce:transition-opacity motion-reduce:duration-150',
          closing ? 'scale-95 opacity-0' : 'animate-in fade-in zoom-in-95 scale-100 opacity-100'
        )}
      >
        <div className="absolute inset-2 rounded-[2rem] border border-white/65" />
        <div className="absolute inset-x-[18%] top-0 h-px bg-gradient-to-r from-transparent via-white to-transparent" />
        <div className="absolute -left-[20%] -top-[12%] size-[70%] rounded-full bg-[#fff7c7]/35 blur-2xl" />
        <div className="absolute inset-x-[12%] bottom-[6%] h-[18%] rounded-full bg-[#789a68]/12 blur-xl" />
      </div>
    </div>
  )
}

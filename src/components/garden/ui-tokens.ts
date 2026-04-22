/**
 * Premium Garden UI Tokens (Phase 4)
 *
 * Single source of truth for glassmorphism, radii, shadows, and colors
 * across HUD, bottom nav, zoom controls, mode toolbar, tooltips.
 *
 * Goal: stop "3 different dev" feel. Every floating UI chrome should
 * import from here.
 */

import { cn } from '@/lib/utils'

/** Base glass panel — dark, high blur, subtle border. */
export const glassPanel = cn(
  'backdrop-blur-xl',
  'bg-slate-900/70',
  'border border-white/10',
  'shadow-[0_8px_32px_-4px_rgba(0,0,0,0.3)]'
)

/** Lighter glass variant — for hoverable items over the panel. */
export const glassHover = cn(
  'hover:bg-white/10 active:bg-white/5',
  'transition-colors duration-150'
)

/** Radius scale — use these instead of ad-hoc rounded-* values. */
export const radius = {
  pill: 'rounded-full',
  panel: 'rounded-2xl',
  control: 'rounded-xl',
  chip: 'rounded-lg',
} as const

/** Interactive hit targets — accessibility min 40px on touch. */
export const hitTarget = {
  icon: 'w-9 h-9 sm:w-10 sm:h-10',
  compact: 'w-8 h-8',
} as const

/** Typography for floating UI labels. */
export const uiText = {
  label: 'text-xs font-medium text-white/90',
  caption: 'text-[10px] text-white/60',
  value: 'text-sm font-semibold text-white',
} as const

/** Motion — shared duration curve. */
export const motion = {
  fast: 'transition-all duration-150 ease-out',
  base: 'transition-all duration-300 ease-out',
} as const

/** Combined glass pill — most common use case for floating HUD chips. */
export const glassPill = cn(glassPanel, radius.pill, 'px-3 py-1.5', uiText.label)

/** Combined glass button. */
export const glassButton = cn(
  glassPanel,
  radius.control,
  hitTarget.icon,
  glassHover,
  motion.fast,
  'flex items-center justify-center text-white/90'
)

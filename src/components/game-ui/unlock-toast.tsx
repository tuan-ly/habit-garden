'use client'

import { toast } from 'sonner'
import type { LevelUnlock } from '@/lib/progression-system'

/**
 * Show a toast notification for a single unlock
 */
export function showUnlockToast(unlock: LevelUnlock) {
  const typeLabels: Record<string, string> = {
    garden: 'Garden Expanded',
    decoration: 'New Decorations',
    slot: 'Plant Slot Unlocked',
    tier: 'New Plants Available',
  }

  toast.custom(
    (t) => (
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl border border-amber-500/30 shadow-xl shadow-amber-500/10 min-w-[280px]">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
          <span className="text-2xl">{unlock.icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-amber-400 font-medium uppercase tracking-wide">
            {typeLabels[unlock.type] || 'Unlocked'}
          </p>
          <p className="text-white font-bold truncate">{unlock.name}</p>
          {unlock.description && (
            <p className="text-xs text-slate-400 truncate">{unlock.description}</p>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={() => toast.dismiss(t)}
          className="flex-shrink-0 p-1 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    ),
    {
      duration: 4000,
      position: 'bottom-center',
    }
  )
}

/**
 * Show multiple unlock toasts in sequence
 */
export function showUnlockToasts(unlocks: LevelUnlock[]) {
  unlocks.forEach((unlock, index) => {
    setTimeout(() => {
      showUnlockToast(unlock)
    }, index * 800) // Stagger toasts by 800ms
  })
}

/**
 * Show a garden expansion toast
 */
export function showGardenExpansionToast(newSize: string) {
  toast.custom(
    (t) => (
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-900 to-emerald-800 rounded-xl border border-emerald-500/30 shadow-xl shadow-emerald-500/10 min-w-[280px]">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse">
          <span className="text-2xl">🏡</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-emerald-400 font-medium uppercase tracking-wide">
            Garden Expanded!
          </p>
          <p className="text-white font-bold">{newSize}</p>
          <p className="text-xs text-emerald-300/70">More room for your plants</p>
        </div>

        {/* Close button */}
        <button
          onClick={() => toast.dismiss(t)}
          className="flex-shrink-0 p-1 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    ),
    {
      duration: 5000,
      position: 'bottom-center',
    }
  )
}

/**
 * Show a decoration unlock toast
 */
export function showDecorationUnlockToast(decorationName: string, icon: string) {
  toast.custom(
    (t) => (
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-900 to-purple-800 rounded-xl border border-purple-500/30 shadow-xl shadow-purple-500/10 min-w-[280px]">
        {/* Icon */}
        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <span className="text-2xl">{icon}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-purple-400 font-medium uppercase tracking-wide">
            New Decorations!
          </p>
          <p className="text-white font-bold">{decorationName}</p>
          <p className="text-xs text-purple-300/70">Added to your garden</p>
        </div>

        {/* Close button */}
        <button
          onClick={() => toast.dismiss(t)}
          className="flex-shrink-0 p-1 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    ),
    {
      duration: 4000,
      position: 'bottom-center',
    }
  )
}

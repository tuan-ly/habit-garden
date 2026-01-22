'use client'

import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'

const HINT_STORAGE_KEY = 'garden-gesture-hint-seen'

interface GestureHintProps {
  onDismiss?: () => void
}

export function GestureHint({ onDismiss }: GestureHintProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Check if user has seen the hint before
    if (typeof window !== 'undefined') {
      const seen = localStorage.getItem(HINT_STORAGE_KEY)
      if (!seen) {
        // Show hint after a short delay
        const timer = setTimeout(() => setShow(true), 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [])

  const handleDismiss = useCallback(() => {
    setShow(false)
    if (typeof window !== 'undefined') {
      localStorage.setItem(HINT_STORAGE_KEY, 'true')
    }
    onDismiss?.()
  }, [onDismiss])

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (show) {
      const timer = setTimeout(handleDismiss, 8000)
      return () => clearTimeout(timer)
    }
  }, [show, handleDismiss])

  if (!show) return null

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 animate-slide-down">
      <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl px-4 py-3 shadow-xl border border-slate-700/50 max-w-xs">
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 p-1 bg-slate-800 rounded-full border border-slate-700 hover:bg-slate-700 transition-colors"
        >
          <X className="h-3 w-3 text-slate-400" />
        </button>

        <div className="text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-base">👆</span>
            <span><strong className="text-white">Tap plant</strong> = Water / Log</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">👆👆</span>
            <span><strong className="text-white">Double-tap</strong> = Details / Add plant</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">👆⏱️</span>
            <span><strong className="text-white">Long press</strong> = Info card / Move</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base">✋</span>
            <span><strong className="text-white">Drag</strong> = Pan view</span>
          </div>
        </div>
      </div>
    </div>
  )
}

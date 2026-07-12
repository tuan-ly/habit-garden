'use client'

import { Button } from '@/components/ui/button'
import { Archive, Check, RotateCcw, Undo2 } from 'lucide-react'

interface EditModeToolbarProps {
  canUndo: boolean
  hasSelectedItem: boolean
  selectedDecorationName?: string
  isBusy?: boolean
  onUndo: () => void
  onRotate: () => void
  onStore: () => void
  onDone: () => void
}

export function EditModeToolbar({
  canUndo,
  hasSelectedItem,
  selectedDecorationName,
  isBusy = false,
  onUndo,
  onRotate,
  onStore,
  onDone,
}: EditModeToolbarProps) {
  return (
    <div className="absolute bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/70 bg-[#fffaf0]/95 p-1.5 shadow-[0_14px_36px_rgba(47,66,39,0.22)] backdrop-blur-md">
      <Button
        variant="ghost"
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
        className="h-9 gap-1.5 rounded-full px-3 text-[#49693f]"
        title="Undo"
      >
        <Undo2 className="h-4 w-4" />
        <span className="hidden sm:inline">Hoàn tác</span>
      </Button>

      {(hasSelectedItem || selectedDecorationName) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRotate}
          disabled={isBusy}
          className="h-9 gap-1.5 rounded-full px-3 text-[#49693f]"
          title="Xoay vật trang trí"
        >
          <RotateCcw className="h-4 w-4" />
          <span className="hidden sm:inline">Xoay</span>
        </Button>
      )}

      {selectedDecorationName && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onStore}
          disabled={isBusy}
          className="h-9 gap-1.5 rounded-full px-3 text-[#765f3d] hover:bg-[#f2e7d3] hover:text-[#5d482c]"
          title={`Cất ${selectedDecorationName} vào kho`}
        >
          <Archive className="h-4 w-4" />
          <span>Cất kho</span>
        </Button>
      )}

      <div className="w-px h-6 bg-border" />

      <Button
        variant="default"
        size="sm"
        onClick={onDone}
        className="h-9 gap-1 rounded-full bg-[#5f7d52] px-4 hover:bg-[#4f6d45]"
      >
        <Check className="h-4 w-4" />
        Xong
      </Button>
    </div>
  )
}

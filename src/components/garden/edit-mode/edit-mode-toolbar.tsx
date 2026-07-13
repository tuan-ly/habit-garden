'use client'

import { Button } from '@/components/ui/button'
import { Archive, Check, RotateCcw, Sprout, Undo2, X } from 'lucide-react'

interface EditModeToolbarProps {
  canUndo: boolean
  hasSelectedItem: boolean
  selectedDecorationName?: string
  movingPlantName?: string
  isBusy?: boolean
  onUndo: () => void
  onRotate: () => void
  onStore: () => void
  onDone: () => void
  onCancelPlantMove?: () => void
}

export function EditModeToolbar({
  canUndo,
  hasSelectedItem,
  selectedDecorationName,
  movingPlantName,
  isBusy = false,
  onUndo,
  onRotate,
  onStore,
  onDone,
  onCancelPlantMove,
}: EditModeToolbarProps) {
  return (
    <div className="absolute bottom-5 left-1/2 z-50 flex max-w-[calc(100%-1.5rem)] -translate-x-1/2 flex-col items-stretch gap-1.5 rounded-[1.5rem] border border-white/70 bg-[#fffaf0]/95 p-1.5 shadow-[0_14px_36px_rgba(47,66,39,0.22)] backdrop-blur-md sm:flex-row sm:items-center sm:rounded-full">
      {movingPlantName && (
        <>
          <div className="flex min-w-0 items-center gap-2 px-2 py-1 sm:pl-3">
            <Sprout className="h-5 w-5 shrink-0 text-[#5f7d52]" aria-hidden="true" />
            <div
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="min-w-0 flex-1"
            >
              <p className="truncate text-xs font-semibold text-[#365331]">
                Đang di chuyển {movingPlantName}
              </p>
              <p className="whitespace-nowrap text-[11px] text-[#71806b]">
                Chạm ô trống để đặt
              </p>
            </div>
            {onCancelPlantMove && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancelPlantMove}
                className="h-8 shrink-0 gap-1 rounded-full px-2.5 text-[#765f3d] hover:bg-[#f2e7d3] hover:text-[#5d482c]"
                aria-label={`Hủy di chuyển ${movingPlantName}`}
              >
                <X className="h-4 w-4" />
                <span>Hủy</span>
              </Button>
            )}
          </div>

          <div className="h-px bg-border sm:h-6 sm:w-px" />
        </>
      )}

      <div className="flex items-center justify-center gap-1.5">
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

        <div className="h-6 w-px bg-border" />

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
    </div>
  )
}

'use client'

import { Button } from '@/components/ui/button'
import { Undo2, Grid3X3, Check, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditModeToolbarProps {
  canUndo: boolean
  showGridLines: boolean
  hasSelectedItem: boolean
  onUndo: () => void
  onToggleGrid: () => void
  onRotate: () => void
  onDone: () => void
}

export function EditModeToolbar({
  canUndo,
  showGridLines,
  hasSelectedItem,
  onUndo,
  onToggleGrid,
  onRotate,
  onDone,
}: EditModeToolbarProps) {
  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg border">
      <Button
        variant="ghost"
        size="sm"
        onClick={onUndo}
        disabled={!canUndo}
        className="h-8 w-8 p-0"
        title="Undo"
      >
        <Undo2 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleGrid}
        className={cn('h-8 w-8 p-0', showGridLines && 'bg-accent')}
        title="Toggle grid"
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>

      {hasSelectedItem && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRotate}
          className="h-8 w-8 p-0"
          title="Rotate"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      )}

      <div className="w-px h-6 bg-border" />

      <Button
        variant="default"
        size="sm"
        onClick={onDone}
        className="h-8 px-3 gap-1"
      >
        <Check className="h-4 w-4" />
        Done
      </Button>
    </div>
  )
}

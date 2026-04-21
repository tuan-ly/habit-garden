'use client'

import { useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useInventory } from '@/lib/context/inventory-context'
import { useEditMode } from './use-edit-mode'
import { EditModeToolbar } from './edit-mode-toolbar'
import { InventoryPanel } from '@/components/inventory/inventory-panel'
import type { InventoryItemWithDetails, PlacedDecorationWithType } from '@/types/database'

interface EditModeOverlayProps {
  isActive: boolean
  gridSize: number
  occupiedCells: Set<string>
  onDone: () => void
  onTileClick?: (row: number, col: number) => void
  onDecorationClick?: (decoration: PlacedDecorationWithType) => void
}

export function EditModeOverlay({
  isActive,
  onDone,
}: EditModeOverlayProps) {
  const inventory = useInventory()
  const editMode = useEditMode()

  // Enter/exit edit mode and load inventory
  useEffect(() => {
    if (isActive) {
      editMode.enterEditMode()
      inventory.refreshInventory()
    } else {
      editMode.exitEditMode()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  const handleSelectItem = useCallback(
    (item: InventoryItemWithDetails) => {
      if (editMode.selectedItem?.id === item.id) {
        editMode.deselectItem()
      } else {
        editMode.selectItem(item)
      }
    },
    [editMode]
  )

  const handleUndo = useCallback(async () => {
    const action = editMode.popUndo()
    if (!action) return

    switch (action.type) {
      case 'place':
        await inventory.pickUpDecoration(action.placedDecoId)
        break
      case 'pickup':
        // Re-placing after a pickup requires knowing where it was — refresh to sync
        await inventory.refreshInventory()
        break
      case 'move':
        await inventory.moveDecoration(action.placedDecoId, action.fromRow, action.fromCol)
        break
    }
  }, [editMode, inventory])

  const handleDone = useCallback(() => {
    editMode.exitEditMode()
    onDone()
  }, [editMode, onDone])

  if (!isActive) return null

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Top toolbar */}
          <EditModeToolbar
            canUndo={editMode.undoStack.length > 0}
            showGridLines={editMode.showGridLines}
            hasSelectedItem={!!editMode.selectedItem}
            onUndo={handleUndo}
            onToggleGrid={editMode.toggleGridLines}
            onRotate={editMode.rotateGhost}
            onDone={handleDone}
          />

          {/* Bottom inventory panel */}
          <InventoryPanel
            materials={inventory.materials}
            decorations={inventory.decorations}
            selectedItemId={editMode.selectedItem?.id ?? null}
            onSelectItem={handleSelectItem}
          />

          {/* Edit-mode border highlight */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-10 bg-blue-500/5 border-4 border-dashed border-blue-300/30 rounded-lg"
          />
        </>
      )}
    </AnimatePresence>
  )
}

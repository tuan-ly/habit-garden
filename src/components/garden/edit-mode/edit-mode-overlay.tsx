'use client'

import { useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useInventory } from '@/lib/context/inventory-context'
import type { UseEditModeReturn } from './use-edit-mode'
import { EditModeToolbar } from './edit-mode-toolbar'
import type { InventoryItemWithDetails, PlacedDecorationWithType } from '@/types/database'
import { DecorationImage } from '../decoration-image'
import { Button } from '@/components/ui/button'
import { PackageOpen, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface EditModeOverlayProps {
  isActive: boolean
  gridSize: number
  occupiedCells: Set<string>
  onDone: () => void
  onTileClick?: (row: number, col: number) => void
  onDecorationClick?: (decoration: PlacedDecorationWithType) => void
  editMode: UseEditModeReturn
}

export function EditModeOverlay({
  isActive,
  onDone,
  editMode,
}: EditModeOverlayProps) {
  const inventory = useInventory()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [isCatalogLoading, setIsCatalogLoading] = useState(false)

  // Enter/exit edit mode. Inventory is loaded before opening the catalog so a
  // server-action refresh cannot race with and unmount the open picker.
  useEffect(() => {
    if (isActive) {
      editMode.enterEditMode()
    } else {
      editMode.exitEditMode()
      setPickerOpen(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  const handleOpenCatalog = useCallback(async () => {
    if (isCatalogLoading) return
    setIsCatalogLoading(true)
    try {
      await inventory.refreshInventory()
      setPickerOpen(true)
    } finally {
      setIsCatalogLoading(false)
    }
  }, [inventory, isCatalogLoading])

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
        await inventory.placeDecoration(action.inventoryItemId, action.row, action.col)
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

  const handleRotate = useCallback(async () => {
    if (editMode.selectedDecoration) {
      const result = await inventory.rotateDecoration(editMode.selectedDecoration.id)
      if (result.success) {
        editMode.deselectDecoration()
      } else {
        toast.error('Chưa thể xoay vật trang trí', { description: result.error })
      }
      return
    }
    editMode.rotateGhost()
  }, [editMode, inventory])

  const handleStore = useCallback(async () => {
    const selected = editMode.selectedDecoration
    if (!selected) return
    const result = await inventory.pickUpDecoration(selected.id)
    if (result.success) {
      if (result.inventoryItemId) {
        editMode.pushUndo({
          type: 'pickup',
          placedDecoId: selected.id,
          inventoryItemId: result.inventoryItemId,
          decoTypeId: selected.decoration_type_id,
          row: selected.grid_row,
          col: selected.grid_col,
        })
      }
      editMode.deselectDecoration()
      toast.success(`Đã cất ${selected.decoration_type.name} vào kho`)
    } else {
      toast.error('Chưa thể cất vật trang trí', { description: result.error })
    }
  }, [editMode, inventory])

  if (!isActive) return null

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Top toolbar */}
          <EditModeToolbar
            canUndo={editMode.undoStack.length > 0}
            hasSelectedItem={!!editMode.selectedItem}
            selectedDecorationName={editMode.selectedDecoration?.decoration_type.name}
            isBusy={inventory.isLoading}
            onUndo={handleUndo}
            onRotate={handleRotate}
            onStore={handleStore}
            onDone={handleDone}
          />

          {/* The catalog is opened on demand so the garden remains the editing surface. */}
          <Button
            type="button"
            onClick={handleOpenCatalog}
            disabled={isCatalogLoading}
            className="absolute bottom-24 left-4 z-50 h-12 gap-2 rounded-full bg-[#fffaf0]/95 px-4 text-[#49693f] shadow-xl ring-1 ring-white/70 hover:bg-white"
          >
            <PackageOpen className="h-5 w-5" />
            {isCatalogLoading ? 'Đang mở kho…' : 'Thêm vật trang trí'}
          </Button>

          {pickerOpen && (
            <div className="absolute inset-0 z-[60] flex justify-end bg-[#20351f]/20 backdrop-blur-[2px]" onClick={() => setPickerOpen(false)}>
              <aside
                className="h-full w-[min(88vw,360px)] overflow-y-auto rounded-l-[28px] bg-[#fffaf0]/98 p-5 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
                aria-label="Kho vật trang trí"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[#365331]">Kho trang trí</h2>
                    <p className="text-sm text-[#71806b]">Chọn một vật rồi chạm tile để đặt.</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setPickerOpen(false)} aria-label="Đóng kho trang trí">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {inventory.decorations.map((item) => {
                    const type = item.decoration_type
                    if (!type) return null
                    const selected = editMode.selectedItem?.id === item.id
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => { handleSelectItem(item); setPickerOpen(false) }}
                        className={`rounded-2xl border p-3 text-left transition ${selected ? 'border-[#6f8f62] bg-[#e8efdd]' : 'border-[#dfe6d5] bg-white/75 hover:border-[#9aae8d]'}`}
                      >
                        <div className="flex h-20 items-center justify-center">
                          <DecorationImage decorationType={type} size={type.grid_size >= 3 ? 'xl' : type.grid_size === 2 ? 'lg' : 'md'} />
                        </div>
                        <div className="mt-2 truncate text-sm font-medium text-[#365331]">{type.name}</div>
                        <div className="text-xs text-[#71806b]">{type.grid_size}×{type.grid_size} · còn {item.quantity}</div>
                      </button>
                    )
                  })}
                </div>
              </aside>
            </div>
          )}

        </>
      )}
    </AnimatePresence>
  )
}

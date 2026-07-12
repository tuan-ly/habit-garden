'use client'

import { useState, useCallback } from 'react'
import type {
  InventoryItemWithDetails,
  DecorationRotation,
  PlacedDecorationWithType,
} from '@/types/database'

export type EditAction =
  | { type: 'place'; placedDecoId: string; inventoryItemId: string; row: number; col: number }
  | { type: 'pickup'; placedDecoId: string; inventoryItemId: string; decoTypeId: string; row: number; col: number }
  | { type: 'move'; placedDecoId: string; fromRow: number; fromCol: number; toRow: number; toCol: number }

export interface EditModeState {
  isActive: boolean
  selectedItem: InventoryItemWithDetails | null
  selectedDecoration: PlacedDecorationWithType | null
  ghostPosition: { row: number; col: number } | null
  ghostRotation: DecorationRotation
  isGhostValid: boolean
  undoStack: EditAction[]
}

const MAX_UNDO = 20

export type UseEditModeReturn = ReturnType<typeof useEditMode>

export function useEditMode() {
  const [isActive, setIsActive] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithDetails | null>(null)
  const [selectedDecoration, setSelectedDecoration] = useState<PlacedDecorationWithType | null>(null)
  const [ghostPosition, setGhostPosition] = useState<{ row: number; col: number } | null>(null)
  const [ghostRotation, setGhostRotation] = useState<DecorationRotation>(0)
  const [isGhostValid, setIsGhostValid] = useState(true)
  const [undoStack, setUndoStack] = useState<EditAction[]>([])

  const enterEditMode = useCallback(() => {
    setIsActive(true)
    setUndoStack([])
    setSelectedItem(null)
    setSelectedDecoration(null)
    setGhostPosition(null)
  }, [])

  const exitEditMode = useCallback(() => {
    setIsActive(false)
    setSelectedItem(null)
    setSelectedDecoration(null)
    setGhostPosition(null)
    setGhostRotation(0)
    setUndoStack([])
  }, [])

  const selectItem = useCallback((item: InventoryItemWithDetails) => {
    setSelectedItem(item)
    setSelectedDecoration(null)
    setGhostPosition(null)
    setGhostRotation(0)
    setIsGhostValid(true)
  }, [])

  const deselectItem = useCallback(() => {
    setSelectedItem(null)
    setGhostPosition(null)
  }, [])

  const selectDecoration = useCallback((decoration: PlacedDecorationWithType) => {
    setSelectedDecoration(decoration)
    setSelectedItem(null)
    setGhostPosition({ row: decoration.grid_row, col: decoration.grid_col })
    setIsGhostValid(true)
  }, [])

  const deselectDecoration = useCallback(() => {
    setSelectedDecoration(null)
    setGhostPosition(null)
    setIsGhostValid(true)
  }, [])

  const rotateGhost = useCallback(() => {
    setGhostRotation(prev => {
      const rotations: DecorationRotation[] = [0, 90, 180, 270]
      const idx = rotations.indexOf(prev)
      return rotations[(idx + 1) % rotations.length]
    })
  }, [])

  const pushUndo = useCallback((action: EditAction) => {
    setUndoStack(prev => [...prev.slice(-MAX_UNDO + 1), action])
  }, [])

  const popUndo = useCallback((): EditAction | undefined => {
    let action: EditAction | undefined
    setUndoStack(prev => {
      if (prev.length === 0) return prev
      action = prev[prev.length - 1]
      return prev.slice(0, -1)
    })
    return action
  }, [])

  return {
    // State
    isActive,
    selectedItem,
    selectedDecoration,
    ghostPosition,
    ghostRotation,
    isGhostValid,
    undoStack,

    // Actions
    enterEditMode,
    exitEditMode,
    selectItem,
    deselectItem,
    selectDecoration,
    deselectDecoration,
    setGhostPosition,
    setGhostRotation,
    setIsGhostValid,
    rotateGhost,
    pushUndo,
    popUndo,
  }
}

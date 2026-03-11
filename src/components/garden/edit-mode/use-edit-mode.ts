'use client'

import { useState, useCallback } from 'react'
import type {
  InventoryItemWithDetails,
  DecorationRotation,
} from '@/types/database'

export type EditAction =
  | { type: 'place'; placedDecoId: string; inventoryItemId: string; row: number; col: number }
  | { type: 'pickup'; placedDecoId: string; decoTypeId: string; row: number; col: number }
  | { type: 'move'; placedDecoId: string; fromRow: number; fromCol: number; toRow: number; toCol: number }

export interface EditModeState {
  isActive: boolean
  selectedItem: InventoryItemWithDetails | null
  ghostPosition: { row: number; col: number } | null
  ghostRotation: DecorationRotation
  isGhostValid: boolean
  undoStack: EditAction[]
  showGridLines: boolean
}

const MAX_UNDO = 20

export function useEditMode() {
  const [isActive, setIsActive] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItemWithDetails | null>(null)
  const [ghostPosition, setGhostPosition] = useState<{ row: number; col: number } | null>(null)
  const [ghostRotation, setGhostRotation] = useState<DecorationRotation>(0)
  const [isGhostValid, setIsGhostValid] = useState(true)
  const [undoStack, setUndoStack] = useState<EditAction[]>([])
  const [showGridLines, setShowGridLines] = useState(true)

  const enterEditMode = useCallback(() => {
    setIsActive(true)
    setUndoStack([])
    setSelectedItem(null)
    setGhostPosition(null)
  }, [])

  const exitEditMode = useCallback(() => {
    setIsActive(false)
    setSelectedItem(null)
    setGhostPosition(null)
    setGhostRotation(0)
    setUndoStack([])
  }, [])

  const selectItem = useCallback((item: InventoryItemWithDetails) => {
    setSelectedItem(item)
    setGhostPosition(null)
    setGhostRotation(0)
    setIsGhostValid(true)
  }, [])

  const deselectItem = useCallback(() => {
    setSelectedItem(null)
    setGhostPosition(null)
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

  const toggleGridLines = useCallback(() => {
    setShowGridLines(prev => !prev)
  }, [])

  return {
    // State
    isActive,
    selectedItem,
    ghostPosition,
    ghostRotation,
    isGhostValid,
    undoStack,
    showGridLines,

    // Actions
    enterEditMode,
    exitEditMode,
    selectItem,
    deselectItem,
    setGhostPosition,
    setGhostRotation,
    setIsGhostValid,
    rotateGhost,
    pushUndo,
    popUndo,
    toggleGridLines,
  }
}

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

export interface InitialGhostPlacement {
  position: { row: number; col: number }
  isValid: boolean
}

/**
 * Give a newly selected inventory decoration an immediate, useful preview.
 * Prefer the free anchor nearest the garden centre; if the garden is full,
 * still return the centre anchor so the invalid ghost can explain the collision.
 */
export function findInitialGhostPlacement(
  gridSize: number,
  footprint: number,
  occupiedCells: Set<string>
): InitialGhostPlacement | null {
  const maxAnchor = gridSize - footprint
  if (gridSize <= 0 || footprint <= 0 || maxAnchor < 0) return null

  const centre = maxAnchor / 2
  const candidates: Array<{ row: number; col: number; distance: number }> = []

  for (let row = 0; row <= maxAnchor; row++) {
    for (let col = 0; col <= maxAnchor; col++) {
      candidates.push({
        row,
        col,
        distance: (row - centre) ** 2 + (col - centre) ** 2,
      })
    }
  }

  candidates.sort((a, b) => a.distance - b.distance || a.row - b.row || a.col - b.col)

  const isFree = ({ row, col }: { row: number; col: number }) => {
    for (let rowOffset = 0; rowOffset < footprint; rowOffset++) {
      for (let colOffset = 0; colOffset < footprint; colOffset++) {
        if (occupiedCells.has(`${row + rowOffset}-${col + colOffset}`)) return false
      }
    }
    return true
  }

  const freeCandidate = candidates.find(isFree)
  if (freeCandidate) {
    return {
      position: { row: freeCandidate.row, col: freeCandidate.col },
      isValid: true,
    }
  }

  const fallback = candidates[0]
  return {
    position: { row: fallback.row, col: fallback.col },
    isValid: false,
  }
}

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

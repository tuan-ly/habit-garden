'use client'

import Image from 'next/image'
import { useMemo } from 'react'

interface SanctuaryAmbientScenesProps {
  gridSize: number
  tileSize: number
  occupiedCells: Set<string>
  compact?: boolean
}

interface Cell {
  row: number
  col: number
}

function pickFreeCell(candidates: Cell[], occupiedCells: Set<string>, gridSize: number): Cell {
  return candidates.find(({ row, col }) => (
    row >= 0 && col >= 0 && row < gridSize && col < gridSize
      && !occupiedCells.has(`${row}-${col}`)
  )) ?? candidates[0]
}

function cellCenter(cell: Cell, gridSize: number, tileSize: number) {
  return {
    x: gridSize * tileSize / 2 + (cell.col - cell.row) * tileSize / 2,
    y: (cell.col + cell.row) * tileSize / 4 + tileSize / 4,
  }
}

export function SanctuaryAmbientScenes({
  gridSize,
  tileSize,
  occupiedCells,
  compact = false,
}: SanctuaryAmbientScenesProps) {
  const scenes = useMemo(() => {
    const edge = gridSize - 1
    const leftCandidates = compact ? [
      { row: Math.max(0, Math.floor(edge * 0.6)), col: Math.max(0, Math.floor(edge * 0.4)) },
      { row: Math.max(0, Math.floor(edge * 0.5)), col: Math.max(0, Math.floor(edge * 0.3)) },
    ] : [
      { row: Math.max(0, Math.floor(edge * 0.4)), col: 0 },
      { row: Math.max(0, edge - 1), col: Math.max(0, Math.floor(edge * 0.28)) },
      { row: Math.max(0, edge - 1), col: 0 },
      { row: edge, col: Math.max(0, Math.floor(edge * 0.55)) },
    ]
    const pondCandidates = compact ? [
      { row: Math.max(0, Math.floor(edge * 0.4)), col: Math.max(0, Math.floor(edge * 0.6)) },
      { row: Math.max(0, Math.floor(edge * 0.3)), col: Math.max(0, Math.floor(edge * 0.5)) },
    ] : [
      { row: Math.max(0, Math.floor(edge * 0.6)), col: Math.max(0, edge - 2) },
      { row: Math.max(0, Math.floor(edge * 0.4)), col: Math.max(0, edge - 2) },
      { row: 0, col: Math.max(0, edge - 1) },
    ]
    const leftCell = pickFreeCell(leftCandidates, occupiedCells, gridSize)
    const pondCell = pickFreeCell(pondCandidates, occupiedCells, gridSize)

    return {
      rock: cellCenter(leftCell, gridSize, tileSize),
      pond: cellCenter(pondCell, gridSize, tileSize),
    }
  }, [gridSize, tileSize, occupiedCells, compact])

  const rockSize = Math.round(tileSize * (compact ? 0.82 : 1.05))
  const pondSize = Math.round(tileSize * (compact ? 1 : 1.32))
  const rockOffset = tileSize * (compact ? 0.2 : 1)
  const pondOffset = tileSize * (compact ? 0.2 : 0.45)

  return (
    <div className="pointer-events-none absolute inset-0 z-[6]" aria-hidden="true">
      <div
        className="absolute"
        style={{
          left: scenes.rock.x,
          top: scenes.rock.y + rockOffset,
          width: rockSize,
          height: rockSize,
          transform: 'translate(-50%, -72%)',
        }}
      >
        <div className="absolute bottom-[14%] left-[16%] h-[15%] w-[68%] -rotate-[8deg] rounded-full bg-[#3c3828]/25 blur-[7px]" />
        <Image
          src="/garden/decorations/sanctuary-rock-lantern.png"
          alt=""
          fill
          loading="eager"
          sizes={`${rockSize}px`}
          className="object-contain drop-shadow-[3px_-2px_3px_rgba(255,229,157,0.16)]"
        />
      </div>

      <div
        className="absolute"
        style={{
          left: scenes.pond.x,
          top: scenes.pond.y + pondOffset,
          width: pondSize,
          height: pondSize,
          transform: 'translate(-50%, -58%)',
        }}
      >
        <div className="absolute bottom-[17%] left-[10%] h-[16%] w-[80%] rotate-[5deg] rounded-full bg-[#343a2e]/20 blur-[8px]" />
        <Image
          src="/garden/decorations/sanctuary-pond.png"
          alt=""
          fill
          loading="eager"
          sizes={`${pondSize}px`}
          className="object-contain drop-shadow-[3px_-2px_3px_rgba(255,229,157,0.12)]"
        />
      </div>
    </div>
  )
}

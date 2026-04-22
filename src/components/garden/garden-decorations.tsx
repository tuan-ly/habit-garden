'use client'

import { useMemo } from 'react'
import type { TimeOfDay } from './themes'
import type { DecorationType } from '@/lib/progression-system'

interface GardenDecorationsProps {
  gridSize: number
  tileSize: number
  timeOfDay?: TimeOfDay
  /** Decoration types unlocked at user's current level */
  unlockedTypes?: DecorationType[]
  /** Set of "row-col" strings for cells already occupied by plants. Decorations will avoid these. */
  occupiedCells?: Set<string>
}

// Decorative element types - extended with new decorations
type DecoType = 'bush' | 'rock' | 'mushroom' | 'flower-patch' | 'fence-post' | 'fence-corner' | 'lantern' | 'pond' | 'fountain'

interface DecoElement {
  type: DecoType
  x: number
  y: number
  scale: number
  flip: boolean
  zIndex: number
}

// Default unlocked types (level 1)
const DEFAULT_UNLOCKED: DecoType[] = ['bush', 'rock']

// Inverse isometric projection: given pixel (x, y), return which grid cell (row, col) contains it.
// Matches the forward projection used in isometric-tile.tsx / ground-plane-canvas.tsx.
// centerX is diamondWidth/2 (= svgWidth/2). The diamond's top corner is at (centerX, 0).
function pixelToGridCell(
  x: number,
  y: number,
  tileSize: number,
  centerX: number
): { row: number; col: number } {
  // Forward: x = centerX + (col - row) * tileSize/2;  y = (col + row) * tileSize/4  (top corner of tile)
  // Inverse:
  const a = (x - centerX) / (tileSize / 2) // col - row
  const b = y / (tileSize / 4)             // col + row
  const col = Math.floor((a + b) / 2)
  const row = Math.floor((b - a) / 2)
  return { row, col }
}

// Given a tile (row, col), return its diamond-center pixel position.
function gridCellCenter(
  row: number,
  col: number,
  tileSize: number,
  centerX: number
): { x: number; y: number } {
  return {
    x: centerX + (col - row) * (tileSize / 2),
    // top corner Y = (col + row) * tileSize/4; center is tileSize/4 below that
    y: (col + row) * (tileSize / 4) + tileSize / 4,
  }
}

// Push a point away from the tile center toward the tile edge, so decorations
// never sit exactly at the visual center of a tile. Returns adjusted {x, y}.
function offsetFromTileCenter(
  x: number,
  y: number,
  tileSize: number,
  centerX: number,
  rand: number,        // 0..1 — direction choice
  radiusFrac: number   // 0..1 — fraction of tileSize/2 to push
): { x: number; y: number } {
  const cell = pixelToGridCell(x, y, tileSize, centerX)
  const center = gridCellCenter(cell.row, cell.col, tileSize, centerX)
  const dx = x - center.x
  const dy = y - center.y
  const distSq = dx * dx + dy * dy
  // Only push if we're close to center (within 25% of tileSize)
  const threshold = tileSize * 0.25
  if (distSq > threshold * threshold) return { x, y }
  // Pick a directional push: 4 diagonal quadrants within the diamond
  const angle = rand * Math.PI * 2
  const push = tileSize * 0.35 * (0.6 + radiusFrac * 0.4)
  // Project onto isometric space (diamond is 2:1 w:h)
  return {
    x: center.x + Math.cos(angle) * push,
    y: center.y + Math.sin(angle) * push * 0.5,
  }
}

// Generate deterministic random decorations around the garden
function generateDecorations(
  gridSize: number,
  tileSize: number,
  unlockedTypes: DecoType[] = DEFAULT_UNLOCKED,
  occupiedCells: Set<string> = new Set(),
  seed: number = 777
): DecoElement[] {
  const decos: DecoElement[] = []

  const random = (i: number) => {
    const x = Math.sin(seed + i * 1234) * 10000
    // Round to 6 decimal places to avoid SSR/client hydration mismatch
    return Math.round((x - Math.floor(x)) * 1000000) / 1000000
  }

  const isUnlocked = (type: DecoType) => unlockedTypes.includes(type)

  const diamondWidth = gridSize * tileSize
  const diamondHeight = gridSize * (tileSize / 2)
  const centerX = diamondWidth / 2

  // Guard: returns adjusted position if placement is valid (not on a plant tile).
  // Returns null if placement falls on a plant cell (caller should skip).
  const tryPlace = (
    rawX: number,
    rawY: number,
    offsetRand: number,
    radiusFrac: number
  ): { x: number; y: number } | null => {
    // First, offset away from center so decoration lands on tile edge
    const { x, y } = offsetFromTileCenter(rawX, rawY, tileSize, centerX, offsetRand, radiusFrac)
    // Check which tile this lands in
    const { row, col } = pixelToGridCell(x, y, tileSize, centerX)
    if (row < 0 || col < 0 || row >= gridSize || col >= gridSize) {
      // Outside the grid — that's fine, decoration is in the border area
      return { x, y }
    }
    // Inside the grid: reject if this cell has a plant
    if (occupiedCells.has(`${row}-${col}`)) return null
    return { x, y }
  }

  // Add bushes (level 1)
  if (isUnlocked('bush')) {
    const bushCount = Math.floor(gridSize * 1.2)
    for (let i = 0; i < bushCount; i++) {
      const angle = (i / bushCount) * Math.PI * 2 + 0.3
      const distance = diamondWidth * 0.45 + random(i + 100) * diamondWidth * 0.12
      const rawX = centerX + Math.cos(angle) * distance * 0.5
      const rawY = diamondHeight * 0.5 + Math.sin(angle) * distance * 0.25

      if (rawY > diamondHeight * 0.85) continue

      const placed = tryPlace(rawX, rawY, random(i + 103), random(i + 104))
      if (!placed) continue

      decos.push({
        type: 'bush',
        x: Math.round(placed.x * 10000) / 10000,
        y: Math.round(placed.y * 10000) / 10000,
        scale: Math.round((0.5 + random(i + 101) * 0.3) * 10000) / 10000,
        flip: random(i + 102) > 0.5,
        zIndex: Math.floor(placed.y),
      })
    }
  }

  // Add rocks (level 1)
  if (isUnlocked('rock')) {
    const rockCount = Math.floor(gridSize * 0.8)
    for (let i = 0; i < rockCount; i++) {
      const angle = (i / rockCount) * Math.PI * 2 + 0.7
      const distance = diamondWidth * 0.42 + random(i + 200) * diamondWidth * 0.1
      const rawX = centerX + Math.cos(angle) * distance * 0.5
      const rawY = diamondHeight * 0.5 + Math.sin(angle) * distance * 0.25

      if (rawY > diamondHeight * 0.8) continue

      const placed = tryPlace(rawX, rawY, random(i + 203), random(i + 204))
      if (!placed) continue

      decos.push({
        type: 'rock',
        x: Math.round(placed.x * 10000) / 10000,
        y: Math.round(placed.y * 10000) / 10000,
        scale: Math.round((0.4 + random(i + 201) * 0.4) * 10000) / 10000,
        flip: random(i + 202) > 0.5,
        zIndex: Math.floor(placed.y),
      })
    }
  }

  // Add mushrooms (level 5)
  if (isUnlocked('mushroom')) {
    const mushroomCount = Math.floor(gridSize * 0.5)
    for (let i = 0; i < mushroomCount; i++) {
      const angle = (i / mushroomCount) * Math.PI * 2 + 1.2
      const distance = diamondWidth * 0.4 + random(i + 300) * diamondWidth * 0.08
      const rawX = centerX + Math.cos(angle) * distance * 0.5
      const rawY = diamondHeight * 0.5 + Math.sin(angle) * distance * 0.25

      if (rawY > diamondHeight * 0.75) continue

      const placed = tryPlace(rawX, rawY, random(i + 303), random(i + 304))
      if (!placed) continue

      decos.push({
        type: 'mushroom',
        x: Math.round(placed.x * 10000) / 10000,
        y: Math.round(placed.y * 10000) / 10000,
        scale: Math.round((0.3 + random(i + 301) * 0.25) * 10000) / 10000,
        flip: random(i + 302) > 0.5,
        zIndex: Math.floor(placed.y),
      })
    }
  }

  // Add flower patches (level 5)
  if (isUnlocked('flower-patch')) {
    const flowerCount = Math.floor(gridSize * 0.6)
    for (let i = 0; i < flowerCount; i++) {
      const angle = (i / flowerCount) * Math.PI * 2 + 0.5
      const distance = diamondWidth * 0.38 + random(i + 400) * diamondWidth * 0.1
      const rawX = centerX + Math.cos(angle) * distance * 0.5
      const rawY = diamondHeight * 0.5 + Math.sin(angle) * distance * 0.25

      if (rawY > diamondHeight * 0.75) continue

      const placed = tryPlace(rawX, rawY, random(i + 403), random(i + 404))
      if (!placed) continue

      decos.push({
        type: 'flower-patch',
        x: Math.round(placed.x * 10000) / 10000,
        y: Math.round(placed.y * 10000) / 10000,
        scale: Math.round((0.35 + random(i + 401) * 0.2) * 10000) / 10000,
        flip: random(i + 402) > 0.5,
        zIndex: Math.floor(placed.y),
      })
    }
  }

  // Add lanterns (level 8) - spaced around garden edges
  if (isUnlocked('lantern')) {
    const lanternCount = Math.max(2, Math.floor(gridSize * 0.3))
    for (let i = 0; i < lanternCount; i++) {
      const angle = (i / lanternCount) * Math.PI * 2 + 0.9
      const distance = diamondWidth * 0.48 + random(i + 500) * diamondWidth * 0.05
      const rawX = centerX + Math.cos(angle) * distance * 0.5
      const rawY = diamondHeight * 0.5 + Math.sin(angle) * distance * 0.25

      if (rawY > diamondHeight * 0.8) continue

      const placed = tryPlace(rawX, rawY, random(i + 503), random(i + 504))
      if (!placed) continue

      decos.push({
        type: 'lantern',
        x: Math.round(placed.x * 10000) / 10000,
        y: Math.round(placed.y * 10000) / 10000,
        scale: Math.round((0.5 + random(i + 501) * 0.2) * 10000) / 10000,
        flip: random(i + 502) > 0.5,
        zIndex: Math.floor(placed.y),
      })
    }
  }

  // Add fence posts (level 10) - along edges
  if (isUnlocked('fence-post')) {
    const fenceCount = Math.max(4, Math.floor(gridSize * 0.6))
    for (let i = 0; i < fenceCount; i++) {
      const angle = (i / fenceCount) * Math.PI * 2
      const distance = diamondWidth * 0.52
      const x = centerX + Math.cos(angle) * distance * 0.5
      const y = diamondHeight * 0.5 + Math.sin(angle) * distance * 0.25

      if (y > diamondHeight * 0.85) continue

      decos.push({
        type: 'fence-post',
        x: Math.round(x * 10000) / 10000,
        y: Math.round(y * 10000) / 10000,
        scale: Math.round((0.45 + random(i + 600) * 0.1) * 10000) / 10000,
        flip: false,
        zIndex: Math.floor(y),
      })
    }
  }

  // Add fence corners (level 10) - at cardinal directions
  if (isUnlocked('fence-corner')) {
    const corners = [0, Math.PI / 2, Math.PI, Math.PI * 1.5]
    for (let i = 0; i < corners.length; i++) {
      const angle = corners[i]
      const distance = diamondWidth * 0.54
      const x = centerX + Math.cos(angle) * distance * 0.5
      const y = diamondHeight * 0.5 + Math.sin(angle) * distance * 0.25

      if (y > diamondHeight * 0.85) continue

      decos.push({
        type: 'fence-corner',
        x: Math.round(x * 10000) / 10000,
        y: Math.round(y * 10000) / 10000,
        scale: 0.5,
        flip: i > 1,
        zIndex: Math.floor(y),
      })
    }
  }

  // Add pond (level 12) - single large pond near edge
  if (isUnlocked('pond')) {
    const pondAngle = Math.PI * 0.75 // Upper-left area
    const pondDistance = diamondWidth * 0.35
    const pondX = centerX + Math.cos(pondAngle) * pondDistance * 0.5
    const pondY = diamondHeight * 0.5 + Math.sin(pondAngle) * pondDistance * 0.25

    if (pondY <= diamondHeight * 0.7) {
      decos.push({
        type: 'pond',
        x: Math.round(pondX * 10000) / 10000,
        y: Math.round(pondY * 10000) / 10000,
        scale: 0.8,
        flip: false,
        zIndex: Math.floor(pondY) - 1, // Below other elements
      })
    }
  }

  // Add fountain (level 12) - centerish if unlocked
  if (isUnlocked('fountain')) {
    const fountainAngle = Math.PI * 1.25 // Lower-right area
    const fountainDistance = diamondWidth * 0.3
    const fountainX = centerX + Math.cos(fountainAngle) * fountainDistance * 0.5
    const fountainY = diamondHeight * 0.5 + Math.sin(fountainAngle) * fountainDistance * 0.25

    if (fountainY <= diamondHeight * 0.75) {
      decos.push({
        type: 'fountain',
        x: Math.round(fountainX * 10000) / 10000,
        y: Math.round(fountainY * 10000) / 10000,
        scale: 0.7,
        flip: false,
        zIndex: Math.floor(fountainY),
      })
    }
  }

  return decos.sort((a, b) => a.zIndex - b.zIndex)
}

// SVG Components for each decoration type
function PineTree({ scale, flip }: { scale: number; flip: boolean }) {
  return (
    <g transform={`scale(${flip ? -scale : scale}, ${scale})`}>
      {/* Trunk */}
      <rect x="-4" y="0" width="8" height="20" fill="#5d4037" rx="2" />
      {/* Tree layers */}
      <polygon points="0,-45 -18,-10 18,-10" fill="#2d5a27" />
      <polygon points="0,-35 -15,-5 15,-5" fill="#3d7a37" />
      <polygon points="0,-25 -12,5 12,5" fill="#4d8a47" />
      {/* Snow caps (light touch) */}
      <polygon points="0,-45 -6,-35 6,-35" fill="#a5d6a7" opacity="0.5" />
    </g>
  )
}

function OakTree({ scale, flip }: { scale: number; flip: boolean }) {
  return (
    <g transform={`scale(${flip ? -scale : scale}, ${scale})`}>
      {/* Trunk */}
      <rect x="-5" y="0" width="10" height="25" fill="#6d4c41" rx="2" />
      {/* Foliage clusters */}
      <circle cx="-12" cy="-15" r="14" fill="#388e3c" />
      <circle cx="12" cy="-18" r="12" fill="#43a047" />
      <circle cx="0" cy="-25" r="16" fill="#4caf50" />
      <circle cx="-8" cy="-30" r="10" fill="#66bb6a" />
      <circle cx="10" cy="-28" r="11" fill="#81c784" />
      {/* Highlights */}
      <circle cx="-5" cy="-32" r="6" fill="#a5d6a7" opacity="0.6" />
    </g>
  )
}

function Bush({ scale, flip }: { scale: number; flip: boolean }) {
  return (
    <g transform={`scale(${flip ? -scale : scale}, ${scale})`}>
      <ellipse cx="-8" cy="-5" rx="10" ry="8" fill="#6B8C5E" />
      <ellipse cx="8" cy="-6" rx="9" ry="7" fill="#7FA076" />
      <ellipse cx="0" cy="-10" rx="12" ry="9" fill="#8FAE82" />
      {/* Berries — muted warm rose */}
      <circle cx="-4" cy="-8" r="2" fill="#D4A0A0" opacity="0.75" />
      <circle cx="5" cy="-10" r="1.5" fill="#D4A0A0" opacity="0.75" />
    </g>
  )
}

function Rock({ scale, flip }: { scale: number; flip: boolean }) {
  return (
    <g transform={`scale(${flip ? -scale : scale}, ${scale})`}>
      <ellipse cx="0" cy="-5" rx="15" ry="10" fill="#A08060" />
      <ellipse cx="-5" cy="-8" rx="8" ry="6" fill="#BFA080" />
      <ellipse cx="6" cy="-4" rx="6" ry="4" fill="#7C5E48" />
      {/* Moss — muted sage */}
      <ellipse cx="-8" cy="-6" rx="4" ry="2" fill="#8FAE82" opacity="0.5" />
    </g>
  )
}

function Mushroom({ scale, flip }: { scale: number; flip: boolean }) {
  return (
    <g transform={`scale(${flip ? -scale : scale}, ${scale})`}>
      {/* Stem — warm cream */}
      <rect x="-3" y="-5" width="6" height="10" fill="#F0E6D4" rx="2" />
      {/* Cap — warm russet, not fire-engine red */}
      <ellipse cx="0" cy="-8" rx="10" ry="6" fill="#C47A5A" />
      {/* Spots */}
      <circle cx="-4" cy="-10" r="2" fill="#FBF5E6" opacity="0.85" />
      <circle cx="4" cy="-7" r="1.5" fill="#FBF5E6" opacity="0.85" />
      <circle cx="0" cy="-11" r="1.2" fill="#FBF5E6" opacity="0.85" />
    </g>
  )
}

function FlowerPatch({ scale, flip }: { scale: number; flip: boolean }) {
  return (
    <g transform={`scale(${flip ? -scale : scale}, ${scale})`}>
      {/* Grass base — warm sage */}
      <path d="M-10,0 Q-8,-8 -6,0" stroke="#7FA076" fill="none" strokeWidth="2" />
      <path d="M-5,0 Q-3,-10 -1,0" stroke="#8FAE82" fill="none" strokeWidth="2" />
      <path d="M0,0 Q2,-9 4,0" stroke="#7FA076" fill="none" strokeWidth="2" />
      <path d="M5,0 Q7,-8 9,0" stroke="#6B8C5E" fill="none" strokeWidth="2" />
      {/* Flowers — Art Bible muted tones */}
      <circle cx="-6" cy="-10" r="4" fill="#E8C547" opacity="0.8" />
      <circle cx="3" cy="-12" r="3.5" fill="#D4A0A0" opacity="0.8" />
      <circle cx="-2" cy="-8" r="3" fill="#B8C8A0" opacity="0.8" />
      {/* Centers — warm earth */}
      <circle cx="-6" cy="-10" r="1.5" fill="#D4A870" />
      <circle cx="3" cy="-12" r="1.2" fill="#C47A5A" />
      <circle cx="-2" cy="-8" r="1" fill="#8FAE82" />
    </g>
  )
}

function Lantern({ scale, flip, isNight }: { scale: number; flip: boolean; isNight: boolean }) {
  return (
    <g transform={`scale(${flip ? -scale : scale}, ${scale})`}>
      {/* Post — warm wood */}
      <rect x="-2" y="0" width="4" height="25" fill="#7C5E48" rx="1" />
      {/* Lantern body — dark warm earth */}
      <rect x="-6" y="-15" width="12" height="15" fill="#5A4A3A" rx="2" />
      <rect x="-4" y="-13" width="8" height="11" fill={isNight ? '#E8C547' : '#FBF5E6'} opacity={isNight ? 0.85 : 0.4} rx="1" />
      {/* Top cap — warm dark */}
      <polygon points="0,-18 -8,-15 8,-15" fill="#6B5A48" />
      {/* Glow effect for night — warm golden */}
      {isNight && (
        <circle cx="0" cy="-8" r="18" fill="#E8C547" opacity="0.12" className="animate-pulse" />
      )}
    </g>
  )
}

// Fence post - wooden post decoration (level 10)
function FencePost({ scale }: { scale: number; flip: boolean }) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Main post — warm wood */}
      <rect x="-3" y="-25" width="6" height="30" fill="#A08060" rx="1" />
      {/* Post cap */}
      <polygon points="0,-28 -5,-25 5,-25" fill="#7C5E48" />
      {/* Wood grain */}
      <line x1="-1" y1="-20" x2="-1" y2="0" stroke="#6B5040" strokeWidth="0.5" opacity="0.4" />
      <line x1="1" y1="-15" x2="1" y2="2" stroke="#6B5040" strokeWidth="0.5" opacity="0.4" />
    </g>
  )
}

// Fence corner - corner post with crossbeams (level 10)
function FenceCorner({ scale, flip }: { scale: number; flip: boolean }) {
  return (
    <g transform={`scale(${flip ? -scale : scale}, ${scale})`}>
      {/* Main corner post — warm wood */}
      <rect x="-4" y="-30" width="8" height="35" fill="#A08060" rx="1" />
      {/* Post cap */}
      <polygon points="0,-33 -6,-30 6,-30" fill="#7C5E48" />
      {/* Horizontal beam left — lighter warm wood */}
      <rect x="-25" y="-20" width="22" height="4" fill="#BFA080" rx="1" />
      <rect x="-25" y="-10" width="22" height="4" fill="#BFA080" rx="1" />
      {/* Horizontal beam right */}
      <rect x="3" y="-20" width="22" height="4" fill="#BFA080" rx="1" />
      <rect x="3" y="-10" width="22" height="4" fill="#BFA080" rx="1" />
    </g>
  )
}

// Pond - water feature with lily pads (level 12) — Art Bible warm palette
function Pond({ scale }: { scale: number; flip: boolean }) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Pond base — muted teal, not saturated blue */}
      <ellipse cx="0" cy="0" rx="40" ry="25" fill="#5A8A8A" opacity="0.5" />
      <ellipse cx="0" cy="0" rx="35" ry="20" fill="#7AABA8" opacity="0.55" />
      {/* Water shimmer — cream-tinted highlights */}
      <ellipse cx="-10" cy="-5" rx="8" ry="4" fill="#B8D4D8" opacity="0.4" />
      <ellipse cx="15" cy="5" rx="6" ry="3" fill="#B8D4D8" opacity="0.3" />
      {/* Lily pads — warm sage */}
      <ellipse cx="-15" cy="8" rx="8" ry="5" fill="#7FA076" />
      <ellipse cx="-17" cy="7" rx="2" ry="1.5" fill="#5A7A50" />
      <ellipse cx="20" cy="-3" rx="6" ry="4" fill="#8FAE82" />
      <ellipse cx="22" cy="-4" rx="1.5" ry="1" fill="#6B8C5E" />
      {/* Lily flower — cream with warm center */}
      <circle cx="-12" cy="6" r="3" fill="#FBF5E6" opacity="0.85" />
      <circle cx="-12" cy="6" r="1" fill="#E8C547" />
      {/* Rocks around edge — warm earth */}
      <ellipse cx="-35" cy="5" rx="6" ry="4" fill="#A08060" />
      <ellipse cx="32" cy="-8" rx="5" ry="3" fill="#BFA080" />
      <ellipse cx="-25" cy="-15" rx="4" ry="3" fill="#7C5E48" />
    </g>
  )
}

// Fountain - stone fountain with water spray (level 12) — Art Bible warm palette
function Fountain({ scale, isNight }: { scale: number; flip: boolean; isNight: boolean }) {
  return (
    <g transform={`scale(${scale})`}>
      {/* Base pool — warm stone */}
      <ellipse cx="0" cy="5" rx="30" ry="15" fill="#A08060" />
      <ellipse cx="0" cy="3" rx="25" ry="12" fill="#7AABA8" opacity="0.55" />
      {/* Middle tier — warm earth stone */}
      <ellipse cx="0" cy="-5" rx="18" ry="10" fill="#BFA080" />
      <ellipse cx="0" cy="-7" rx="14" ry="7" fill="#8ABAB5" opacity="0.45" />
      {/* Top tier */}
      <ellipse cx="0" cy="-15" rx="10" ry="6" fill="#D4C9B0" />
      <ellipse cx="0" cy="-17" rx="6" ry="3" fill="#B8D4D8" opacity="0.4" />
      {/* Center spout — cream stone */}
      <rect x="-3" y="-30" width="6" height="15" fill="#D4C9B0" rx="2" />
      {/* Water spray particles — cream-tinted */}
      <circle cx="-5" cy="-35" r="2" fill="#E8E0D0" opacity="0.7" />
      <circle cx="4" cy="-38" r="1.5" fill="#D4C9B0" opacity="0.6" />
      <circle cx="0" cy="-40" r="2.5" fill="#E8E0D0" opacity="0.8" />
      <circle cx="-8" cy="-32" r="1" fill="#D4C9B0" opacity="0.5" />
      <circle cx="7" cy="-33" r="1.5" fill="#E8E0D0" opacity="0.6" />
      {/* Night glow from water */}
      {isNight && (
        <ellipse cx="0" cy="-5" rx="20" ry="10" fill="#B8D4D8" opacity="0.1" className="animate-pulse" />
      )}
    </g>
  )
}

// Render a single decoration
function DecorationElement({ deco, timeOfDay }: { deco: DecoElement; timeOfDay: TimeOfDay }) {
  const isNight = timeOfDay === 'night'

  return (
    <g
      transform={`translate(${deco.x}, ${deco.y})`}
      style={{ opacity: isNight ? 0.7 : 1 }}
    >
      {/* Trees disabled to avoid confusion with growing plants */}
      {/* deco.type === 'tree-pine' && <PineTree scale={deco.scale} flip={deco.flip} /> */}
      {/* deco.type === 'tree-oak' && <OakTree scale={deco.scale} flip={deco.flip} /> */}
      {deco.type === 'bush' && <Bush scale={deco.scale} flip={deco.flip} />}
      {deco.type === 'rock' && <Rock scale={deco.scale} flip={deco.flip} />}
      {deco.type === 'mushroom' && <Mushroom scale={deco.scale} flip={deco.flip} />}
      {deco.type === 'flower-patch' && <FlowerPatch scale={deco.scale} flip={deco.flip} />}
      {deco.type === 'lantern' && <Lantern scale={deco.scale} flip={deco.flip} isNight={isNight} />}
      {deco.type === 'fence-post' && <FencePost scale={deco.scale} flip={deco.flip} />}
      {deco.type === 'fence-corner' && <FenceCorner scale={deco.scale} flip={deco.flip} />}
      {deco.type === 'pond' && <Pond scale={deco.scale} flip={deco.flip} />}
      {deco.type === 'fountain' && <Fountain scale={deco.scale} flip={deco.flip} isNight={isNight} />}
    </g>
  )
}

export function GardenDecorations({
  gridSize,
  tileSize,
  timeOfDay = 'day',
  unlockedTypes = DEFAULT_UNLOCKED,
  occupiedCells,
}: GardenDecorationsProps) {
  const decorations = useMemo(
    () => generateDecorations(gridSize, tileSize, unlockedTypes as DecoType[], occupiedCells),
    [gridSize, tileSize, unlockedTypes, occupiedCells]
  )

  const diamondWidth = gridSize * tileSize
  const diamondHeight = gridSize * (tileSize / 2) + tileSize * 0.3

  return (
    <svg
      width={diamondWidth}
      height={diamondHeight}
      viewBox={`0 0 ${diamondWidth} ${diamondHeight}`}
      className="absolute pointer-events-none"
      style={{ left: 0, top: 0, zIndex: 5 }}
    >
      {decorations.map((deco, i) => (
        <DecorationElement key={i} deco={deco} timeOfDay={timeOfDay} />
      ))}
    </svg>
  )
}

'use client'

/**
 * Premium Decorations (Phase 2)
 *
 * Replacement decoration renderer that:
 * - Uses larger base scale (no more "pixel rác" feel)
 * - Adds contact shadow + soft drop shadow per decoration
 * - Uses cohesive 3D-feel shading (gradients, highlights, AO)
 * - Shares lighting profile with plants (Phase 1)
 *
 * Gated by NEXT_PUBLIC_PREMIUM_GARDEN.
 */

import { useMemo } from 'react'
import type { TimeOfDay } from './themes'
import type { DecorationType } from '@/lib/progression-system'
import type { WeatherType } from '@/types/database'
import { computeLightProfile, SHADOW_DIR } from './lighting'

interface PremiumDecorationsProps {
  gridSize: number
  tileSize: number
  timeOfDay?: TimeOfDay
  weather?: WeatherType | null
  unlockedTypes?: DecorationType[]
  occupiedCells?: Set<string>
}

type DecoType = 'bush' | 'rock' | 'mushroom' | 'flower-patch' | 'fence-post' | 'fence-corner' | 'lantern' | 'pond' | 'fountain'

interface DecoElement {
  type: DecoType
  x: number
  y: number
  scale: number
  flip: boolean
  zIndex: number
  /** Atmospheric depth [0..1] — 0 foreground, 1 background */
  depth: number
}

const DEFAULT_UNLOCKED: DecoType[] = ['bush', 'rock']

// Same projection helpers as legacy decorations
function pixelToGridCell(x: number, y: number, tileSize: number, centerX: number) {
  const a = (x - centerX) / (tileSize / 2)
  const b = y / (tileSize / 4)
  const col = Math.floor((a + b) / 2)
  const row = Math.floor((b - a) / 2)
  return { row, col }
}
function gridCellCenter(row: number, col: number, tileSize: number, centerX: number) {
  return { x: centerX + (col - row) * (tileSize / 2), y: (col + row) * (tileSize / 4) + tileSize / 4 }
}
function offsetFromTileCenter(x: number, y: number, tileSize: number, centerX: number, rand: number, radiusFrac: number) {
  const cell = pixelToGridCell(x, y, tileSize, centerX)
  const center = gridCellCenter(cell.row, cell.col, tileSize, centerX)
  const dx = x - center.x
  const dy = y - center.y
  const distSq = dx * dx + dy * dy
  const threshold = tileSize * 0.25
  if (distSq > threshold * threshold) return { x, y }
  const angle = rand * Math.PI * 2
  const push = tileSize * 0.35 * (0.6 + radiusFrac * 0.4)
  return { x: center.x + Math.cos(angle) * push, y: center.y + Math.sin(angle) * push * 0.5 }
}

function generateDecorations(
  gridSize: number,
  tileSize: number,
  unlockedTypes: DecoType[],
  occupiedCells: Set<string>,
  seed = 777
): DecoElement[] {
  const decos: DecoElement[] = []
  const random = (i: number) => {
    const x = Math.sin(seed + i * 1234) * 10000
    return Math.round((x - Math.floor(x)) * 1000000) / 1000000
  }
  const isUnlocked = (t: DecoType) => unlockedTypes.includes(t)
  const diamondWidth = gridSize * tileSize
  const diamondHeight = gridSize * (tileSize / 2)
  const centerX = diamondWidth / 2

  const tryPlace = (rawX: number, rawY: number, offsetRand: number, radiusFrac: number) => {
    const { x, y } = offsetFromTileCenter(rawX, rawY, tileSize, centerX, offsetRand, radiusFrac)
    const { row, col } = pixelToGridCell(x, y, tileSize, centerX)
    if (row < 0 || col < 0 || row >= gridSize || col >= gridSize) return { x, y }
    if (occupiedCells.has(`${row}-${col}`)) return null
    return { x, y }
  }

  const computeDepth = (y: number) => {
    // y closer to top of diamond = further from camera = deeper
    return Math.max(0, Math.min(1, 1 - y / diamondHeight))
  }

  // Bushes — larger base scale (was 0.5-0.8, now 0.85-1.2)
  if (isUnlocked('bush')) {
    const count = Math.floor(gridSize * 1.0)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + 0.3
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
        scale: Math.round((0.85 + random(i + 101) * 0.35) * 10000) / 10000,
        flip: random(i + 102) > 0.5,
        zIndex: Math.floor(placed.y),
        depth: computeDepth(placed.y),
      })
    }
  }

  // Rocks — was 0.4-0.8, now 0.7-1.1
  if (isUnlocked('rock')) {
    const count = Math.floor(gridSize * 0.7)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + 0.7
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
        scale: Math.round((0.7 + random(i + 201) * 0.4) * 10000) / 10000,
        flip: random(i + 202) > 0.5,
        zIndex: Math.floor(placed.y),
        depth: computeDepth(placed.y),
      })
    }
  }

  // Mushrooms — was 0.3-0.55, now 0.55-0.85
  if (isUnlocked('mushroom')) {
    const count = Math.floor(gridSize * 0.4)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + 1.2
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
        scale: Math.round((0.55 + random(i + 301) * 0.3) * 10000) / 10000,
        flip: random(i + 302) > 0.5,
        zIndex: Math.floor(placed.y),
        depth: computeDepth(placed.y),
      })
    }
  }

  // Flower patches — was 0.35-0.55, now 0.6-0.85
  if (isUnlocked('flower-patch')) {
    const count = Math.floor(gridSize * 0.5)
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + 0.5
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
        scale: Math.round((0.6 + random(i + 401) * 0.25) * 10000) / 10000,
        flip: random(i + 402) > 0.5,
        zIndex: Math.floor(placed.y),
        depth: computeDepth(placed.y),
      })
    }
  }

  return decos.sort((a, b) => a.zIndex - b.zIndex)
}

/**
 * Render a contact shadow ellipse beneath every decoration.
 * Tied to the global lighting profile so weather changes shadow strength.
 */
function ContactShadow({ scale, opacity }: { scale: number; opacity: number }) {
  return (
    <ellipse
      cx={0}
      cy={2}
      rx={14 * scale}
      ry={4 * scale}
      fill="rgb(0,0,0)"
      opacity={opacity * 0.65}
    />
  )
}

// ===== Premium SVG decoration components (with gradient shading) =====

function PremiumBush({ scale, flip }: { scale: number; flip: boolean }) {
  return (
    <g transform={`scale(${flip ? -scale : scale}, ${scale})`}>
      <defs>
        <radialGradient id="bush-grad" cx="0.35" cy="0.3">
          <stop offset="0%" stopColor="#B5CFA5" />
          <stop offset="60%" stopColor="#7FA076" />
          <stop offset="100%" stopColor="#5A7A50" />
        </radialGradient>
      </defs>
      <ellipse cx={-9} cy={-6} rx={12} ry={9} fill="#5A7A50" />
      <ellipse cx={9} cy={-7} rx={11} ry={8} fill="#5A7A50" />
      <ellipse cx={0} cy={-12} rx={14} ry={11} fill="url(#bush-grad)" />
      <ellipse cx={-9} cy={-6} rx={11} ry={8} fill="url(#bush-grad)" />
      <ellipse cx={9} cy={-7} rx={10} ry={7} fill="url(#bush-grad)" />
      {/* highlight */}
      <ellipse cx={-3} cy={-15} rx={5} ry={3} fill="#D6E5C8" opacity={0.55} />
      {/* berries */}
      <circle cx={-4} cy={-9} r={2} fill="#C8748F" opacity={0.85} />
      <circle cx={6} cy={-11} r={1.6} fill="#C8748F" opacity={0.85} />
    </g>
  )
}

function PremiumRock({ scale, flip }: { scale: number; flip: boolean }) {
  return (
    <g transform={`scale(${flip ? -scale : scale}, ${scale})`}>
      <defs>
        <linearGradient id="rock-grad" x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#D4C0A8" />
          <stop offset="55%" stopColor="#A08060" />
          <stop offset="100%" stopColor="#5A4530" />
        </linearGradient>
      </defs>
      <ellipse cx={1} cy={-4} rx={16} ry={11} fill="url(#rock-grad)" />
      <ellipse cx={-5} cy={-8} rx={9} ry={7} fill="url(#rock-grad)" />
      <ellipse cx={7} cy={-3} rx={7} ry={5} fill="#7C5E48" opacity={0.7} />
      {/* top highlight */}
      <ellipse cx={-3} cy={-11} rx={5} ry={2.5} fill="#EAD9BE" opacity={0.6} />
      {/* moss patch */}
      <ellipse cx={-9} cy={-5} rx={4.5} ry={2.2} fill="#7FA076" opacity={0.55} />
      <ellipse cx={3} cy={-1} rx={3} ry={1.5} fill="#8FAE82" opacity={0.45} />
    </g>
  )
}

function PremiumMushroom({ scale, flip }: { scale: number; flip: boolean }) {
  return (
    <g transform={`scale(${flip ? -scale : scale}, ${scale})`}>
      <defs>
        <radialGradient id="cap-grad" cx="0.35" cy="0.2">
          <stop offset="0%" stopColor="#E8A088" />
          <stop offset="60%" stopColor="#C47A5A" />
          <stop offset="100%" stopColor="#8C4A30" />
        </radialGradient>
      </defs>
      {/* stem */}
      <rect x={-3.5} y={-6} width={7} height={12} fill="#F0E6D4" rx={2.5} />
      <rect x={-3.5} y={-6} width={2} height={12} fill="#D4C9B0" opacity={0.6} rx={1} />
      {/* cap */}
      <ellipse cx={0} cy={-9} rx={11} ry={7} fill="url(#cap-grad)" />
      {/* spots */}
      <circle cx={-4} cy={-11} r={2} fill="#FBF5E6" opacity={0.95} />
      <circle cx={4} cy={-8} r={1.6} fill="#FBF5E6" opacity={0.95} />
      <circle cx={0} cy={-12} r={1.3} fill="#FBF5E6" opacity={0.95} />
      {/* cap highlight */}
      <ellipse cx={-3} cy={-13} rx={4} ry={1.8} fill="#FFD9C4" opacity={0.55} />
    </g>
  )
}

function PremiumFlowerPatch({ scale, flip }: { scale: number; flip: boolean }) {
  return (
    <g transform={`scale(${flip ? -scale : scale}, ${scale})`}>
      {/* grass */}
      <path d="M-11,1 Q-9,-9 -7,1" stroke="#7FA076" fill="none" strokeWidth={2.2} strokeLinecap="round" />
      <path d="M-5,1 Q-3,-11 -1,1" stroke="#8FAE82" fill="none" strokeWidth={2.2} strokeLinecap="round" />
      <path d="M0,1 Q2,-10 4,1" stroke="#7FA076" fill="none" strokeWidth={2.2} strokeLinecap="round" />
      <path d="M5,1 Q7,-9 9,1" stroke="#5A7A50" fill="none" strokeWidth={2.2} strokeLinecap="round" />
      {/* flowers with depth */}
      <g>
        <circle cx={-6} cy={-11} r={4.5} fill="#E8C547" />
        <circle cx={-6} cy={-11} r={1.8} fill="#C49530" />
      </g>
      <g>
        <circle cx={3} cy={-13} r={4} fill="#D8A0A8" />
        <circle cx={3} cy={-13} r={1.5} fill="#A8606A" />
      </g>
      <g>
        <circle cx={-2} cy={-9} r={3.5} fill="#C8D8A8" />
        <circle cx={-2} cy={-9} r={1.3} fill="#7A8A50" />
      </g>
      {/* highlights */}
      <circle cx={-7} cy={-12} r={1.5} fill="#FFEC9D" opacity={0.7} />
      <circle cx={2} cy={-14} r={1.2} fill="#F0C8D0" opacity={0.7} />
    </g>
  )
}

function DecorationGroup({
  deco,
  shadowOpacity,
  depth,
  warmth,
}: {
  deco: DecoElement
  shadowOpacity: number
  depth: number
  warmth: number
}) {
  // Atmospheric perspective: distant decorations slightly desaturated/dimmed
  const saturation = 1 - depth * 0.2
  const brightness = 1 - depth * 0.05
  // Warmth tint via simple hue-rotate proxy — keep subtle
  const hue = warmth > 0 ? 0 : -3
  const filter = `saturate(${saturation.toFixed(2)}) brightness(${brightness.toFixed(2)}) hue-rotate(${hue}deg)`

  return (
    <g transform={`translate(${deco.x}, ${deco.y})`} style={{ filter }}>
      <ContactShadow scale={deco.scale} opacity={shadowOpacity} />
      {deco.type === 'bush' && <PremiumBush scale={deco.scale} flip={deco.flip} />}
      {deco.type === 'rock' && <PremiumRock scale={deco.scale} flip={deco.flip} />}
      {deco.type === 'mushroom' && <PremiumMushroom scale={deco.scale} flip={deco.flip} />}
      {deco.type === 'flower-patch' && <PremiumFlowerPatch scale={deco.scale} flip={deco.flip} />}
    </g>
  )
}

export function PremiumDecorations({
  gridSize,
  tileSize,
  timeOfDay = 'day',
  weather,
  unlockedTypes = DEFAULT_UNLOCKED,
  occupiedCells,
}: PremiumDecorationsProps) {
  const decorations = useMemo(
    () => generateDecorations(gridSize, tileSize, unlockedTypes as DecoType[], occupiedCells ?? new Set()),
    [gridSize, tileSize, unlockedTypes, occupiedCells]
  )

  const lightProfile = useMemo(() => computeLightProfile(weather, timeOfDay), [weather, timeOfDay])

  const diamondWidth = gridSize * tileSize
  const diamondHeight = gridSize * (tileSize / 2) + tileSize * 0.3

  // Apply directional drop-shadow at the SVG level (single shared shadow)
  const dropShadow = `drop-shadow(${(SHADOW_DIR.x * 3).toFixed(1)}px ${(SHADOW_DIR.y * 5).toFixed(
    1
  )}px ${lightProfile.shadowBlur.toFixed(1)}px rgba(0,0,0,${(lightProfile.shadowOpacity * 0.7).toFixed(2)}))`

  return (
    <svg
      width={diamondWidth}
      height={diamondHeight}
      viewBox={`0 0 ${diamondWidth} ${diamondHeight}`}
      className="absolute pointer-events-none"
      style={{ left: 0, top: 0, zIndex: 5, filter: dropShadow }}
      aria-hidden="true"
    >
      {decorations.map((deco, i) => (
        <DecorationGroup
          key={i}
          deco={deco}
          shadowOpacity={lightProfile.shadowOpacity}
          depth={deco.depth}
          warmth={lightProfile.warmth}
        />
      ))}
    </svg>
  )
}

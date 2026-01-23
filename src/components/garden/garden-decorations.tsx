'use client'

import { useMemo } from 'react'
import type { TimeOfDay } from './themes'

interface GardenDecorationsProps {
  gridSize: number
  tileSize: number
  timeOfDay?: TimeOfDay
}

// Decorative element types
type DecoType = 'bush' | 'rock' | 'mushroom' | 'flower-patch' | 'fence-post' | 'lantern'

interface DecoElement {
  type: DecoType
  x: number
  y: number
  scale: number
  flip: boolean
  zIndex: number
}

// Generate deterministic random decorations around the garden
function generateDecorations(gridSize: number, tileSize: number, seed: number = 777): DecoElement[] {
  const decos: DecoElement[] = []

  const random = (i: number) => {
    const x = Math.sin(seed + i * 1234) * 10000
    // Round to 6 decimal places to avoid SSR/client hydration mismatch
    return Math.round((x - Math.floor(x)) * 1000000) / 1000000
  }

  const diamondWidth = gridSize * tileSize
  const diamondHeight = gridSize * (tileSize / 2)
  const centerX = diamondWidth / 2

  /* 
  // Add trees around the edges - Disabled as they cause confusion with growing plants
  const treeCount = Math.max(4, Math.floor(gridSize * 1.5))
  for (let i = 0; i < treeCount; i++) {
    const angle = (i / treeCount) * Math.PI * 2
    const distance = diamondWidth * 0.55 + random(i) * diamondWidth * 0.15
    const x = centerX + Math.cos(angle) * distance * 0.5
    const y = diamondHeight * 0.5 + Math.sin(angle) * distance * 0.25

    // Don't place trees too close to bottom (would overlap with UI)
    if (y > diamondHeight * 0.9) continue

    const type: DecoType = random(i * 2) > 0.5 ? 'tree-pine' : 'tree-oak'
    decos.push({
      type,
      x,
      y,
      scale: 0.6 + random(i * 3) * 0.4,
      flip: random(i * 4) > 0.5,
      zIndex: Math.floor(y),
    })
  }
  */

  // Add bushes
  const bushCount = Math.floor(gridSize * 1.2)
  for (let i = 0; i < bushCount; i++) {
    const angle = (i / bushCount) * Math.PI * 2 + 0.3
    const distance = diamondWidth * 0.45 + random(i + 100) * diamondWidth * 0.12
    const x = centerX + Math.cos(angle) * distance * 0.5
    const y = diamondHeight * 0.5 + Math.sin(angle) * distance * 0.25

    if (y > diamondHeight * 0.85) continue

    decos.push({
      type: 'bush',
      x: Math.round(x * 10000) / 10000,
      y: Math.round(y * 10000) / 10000,
      scale: Math.round((0.5 + random(i + 101) * 0.3) * 10000) / 10000,
      flip: random(i + 102) > 0.5,
      zIndex: Math.floor(y),
    })
  }

  // Add rocks
  const rockCount = Math.floor(gridSize * 0.8)
  for (let i = 0; i < rockCount; i++) {
    const angle = (i / rockCount) * Math.PI * 2 + 0.7
    const distance = diamondWidth * 0.42 + random(i + 200) * diamondWidth * 0.1
    const x = centerX + Math.cos(angle) * distance * 0.5
    const y = diamondHeight * 0.5 + Math.sin(angle) * distance * 0.25

    if (y > diamondHeight * 0.8) continue

    decos.push({
      type: 'rock',
      x: Math.round(x * 10000) / 10000,
      y: Math.round(y * 10000) / 10000,
      scale: Math.round((0.4 + random(i + 201) * 0.4) * 10000) / 10000,
      flip: random(i + 202) > 0.5,
      zIndex: Math.floor(y),
    })
  }

  // Add mushrooms
  const mushroomCount = Math.floor(gridSize * 0.5)
  for (let i = 0; i < mushroomCount; i++) {
    const angle = (i / mushroomCount) * Math.PI * 2 + 1.2
    const distance = diamondWidth * 0.4 + random(i + 300) * diamondWidth * 0.08
    const x = centerX + Math.cos(angle) * distance * 0.5
    const y = diamondHeight * 0.5 + Math.sin(angle) * distance * 0.25

    if (y > diamondHeight * 0.75) continue

    decos.push({
      type: 'mushroom',
      x: Math.round(x * 10000) / 10000,
      y: Math.round(y * 10000) / 10000,
      scale: Math.round((0.3 + random(i + 301) * 0.25) * 10000) / 10000,
      flip: random(i + 302) > 0.5,
      zIndex: Math.floor(y),
    })
  }

  // Add flower patches
  const flowerCount = Math.floor(gridSize * 0.6)
  for (let i = 0; i < flowerCount; i++) {
    const angle = (i / flowerCount) * Math.PI * 2 + 0.5
    const distance = diamondWidth * 0.38 + random(i + 400) * diamondWidth * 0.1
    const x = centerX + Math.cos(angle) * distance * 0.5
    const y = diamondHeight * 0.5 + Math.sin(angle) * distance * 0.25

    if (y > diamondHeight * 0.75) continue

    decos.push({
      type: 'flower-patch',
      x: Math.round(x * 10000) / 10000,
      y: Math.round(y * 10000) / 10000,
      scale: Math.round((0.35 + random(i + 401) * 0.2) * 10000) / 10000,
      flip: random(i + 402) > 0.5,
      zIndex: Math.floor(y),
    })
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
      <ellipse cx="-8" cy="-5" rx="10" ry="8" fill="#558b2f" />
      <ellipse cx="8" cy="-6" rx="9" ry="7" fill="#689f38" />
      <ellipse cx="0" cy="-10" rx="12" ry="9" fill="#7cb342" />
      {/* Berries */}
      <circle cx="-4" cy="-8" r="2" fill="#f44336" opacity="0.8" />
      <circle cx="5" cy="-10" r="1.5" fill="#f44336" opacity="0.8" />
    </g>
  )
}

function Rock({ scale, flip }: { scale: number; flip: boolean }) {
  return (
    <g transform={`scale(${flip ? -scale : scale}, ${scale})`}>
      <ellipse cx="0" cy="-5" rx="15" ry="10" fill="#78909c" />
      <ellipse cx="-5" cy="-8" rx="8" ry="6" fill="#90a4ae" />
      <ellipse cx="6" cy="-4" rx="6" ry="4" fill="#607d8b" />
      {/* Moss */}
      <ellipse cx="-8" cy="-6" rx="4" ry="2" fill="#8bc34a" opacity="0.6" />
    </g>
  )
}

function Mushroom({ scale, flip }: { scale: number; flip: boolean }) {
  return (
    <g transform={`scale(${flip ? -scale : scale}, ${scale})`}>
      {/* Stem */}
      <rect x="-3" y="-5" width="6" height="10" fill="#f5f5f5" rx="2" />
      {/* Cap */}
      <ellipse cx="0" cy="-8" rx="10" ry="6" fill="#e53935" />
      {/* Spots */}
      <circle cx="-4" cy="-10" r="2" fill="#fff" opacity="0.9" />
      <circle cx="4" cy="-7" r="1.5" fill="#fff" opacity="0.9" />
      <circle cx="0" cy="-11" r="1.2" fill="#fff" opacity="0.9" />
    </g>
  )
}

function FlowerPatch({ scale, flip }: { scale: number; flip: boolean }) {
  return (
    <g transform={`scale(${flip ? -scale : scale}, ${scale})`}>
      {/* Grass base */}
      <path d="M-10,0 Q-8,-8 -6,0" stroke="#7cb342" fill="none" strokeWidth="2" />
      <path d="M-5,0 Q-3,-10 -1,0" stroke="#8bc34a" fill="none" strokeWidth="2" />
      <path d="M0,0 Q2,-9 4,0" stroke="#7cb342" fill="none" strokeWidth="2" />
      <path d="M5,0 Q7,-8 9,0" stroke="#689f38" fill="none" strokeWidth="2" />
      {/* Flowers */}
      <circle cx="-6" cy="-10" r="4" fill="#fff176" />
      <circle cx="3" cy="-12" r="3.5" fill="#f8bbd9" />
      <circle cx="-2" cy="-8" r="3" fill="#81d4fa" />
      {/* Centers */}
      <circle cx="-6" cy="-10" r="1.5" fill="#ff9800" />
      <circle cx="3" cy="-12" r="1.2" fill="#e91e63" />
      <circle cx="-2" cy="-8" r="1" fill="#2196f3" />
    </g>
  )
}

function Lantern({ scale, flip, isNight }: { scale: number; flip: boolean; isNight: boolean }) {
  return (
    <g transform={`scale(${flip ? -scale : scale}, ${scale})`}>
      {/* Post */}
      <rect x="-2" y="0" width="4" height="25" fill="#5d4037" rx="1" />
      {/* Lantern body */}
      <rect x="-6" y="-15" width="12" height="15" fill="#37474f" rx="2" />
      <rect x="-4" y="-13" width="8" height="11" fill={isNight ? '#ffc107' : '#fff8e1'} opacity={isNight ? 0.9 : 0.5} rx="1" />
      {/* Top cap */}
      <polygon points="0,-18 -8,-15 8,-15" fill="#455a64" />
      {/* Glow effect for night */}
      {isNight && (
        <circle cx="0" cy="-8" r="18" fill="#ffc107" opacity="0.15" className="animate-pulse" />
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
    </g>
  )
}

export function GardenDecorations({ gridSize, tileSize, timeOfDay = 'day' }: GardenDecorationsProps) {
  const decorations = useMemo(
    () => generateDecorations(gridSize, tileSize),
    [gridSize, tileSize]
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

'use client'

import { memo, useMemo, useId } from 'react'

export interface MultiCellArea {
  /** Top-left row of the multi-cell plant */
  row: number
  /** Top-left col of the multi-cell plant */
  col: number
  /** Size of the plant (2 = 2x2, 3 = 3x3, etc.) */
  size: number
}

interface GroundPlaneProps {
  gridSize: number
  tileSize: number
  grassColor?: string
  grassDarkColor?: string
  dirtColor?: string
  dirtDarkColor?: string
  showGridLines?: boolean
  /** Multi-cell plant areas - grid lines inside these areas will be hidden */
  multiCellAreas?: MultiCellArea[]
  /** Currently hovered multi-cell area (for merged hover highlight) */
  hoveredMultiCellArea?: MultiCellArea | null
  /** Target cell for drag-and-drop (shows highlight) */
  dragTargetCell?: { row: number; col: number } | null
  /** Size of the plant being dragged (for multi-cell highlight) */
  dragPlantSize?: number
  /** Whether the drag target is a valid drop location */
  isDragTargetValid?: boolean
}

// Generate random grass detail positions
function generateGrassDetails(gridSize: number, tileSize: number, seed: number = 42) {
  const details: Array<{
    x: number
    y: number
    type: 'grass' | 'flower' | 'clover' | 'mushroom'
    scale: number
    rotation: number
  }> = []

  // Use deterministic pseudo-random for consistent rendering
  const random = (i: number) => {
    const x = Math.sin(seed + i * 9999) * 10000
    return Math.round((x - Math.floor(x)) * 1000000) / 1000000
  }

  const diamondWidth = gridSize * tileSize
  const diamondHeight = gridSize * (tileSize / 2)
  const centerX = diamondWidth / 2

  // Generate scattered grass/flower details
  const detailCount = Math.floor(gridSize * gridSize * 1.5)
  for (let i = 0; i < detailCount; i++) {
    // Random position in diamond
    const r1 = random(i * 2)
    const r2 = random(i * 2 + 1)

    // Map to diamond coordinates
    const x = centerX + (r1 - 0.5) * diamondWidth * 0.85
    const y = diamondHeight * 0.1 + r2 * diamondHeight * 0.8

    // Check if point is inside diamond
    const dx = Math.abs(x - centerX) / (diamondWidth / 2)
    const dy = Math.abs(y - diamondHeight / 2) / (diamondHeight / 2)
    if (dx + dy > 0.9) continue

    // Determine type
    const typeRand = random(i * 3)
    let type: 'grass' | 'flower' | 'clover' | 'mushroom'
    if (typeRand < 0.6) type = 'grass'
    else if (typeRand < 0.8) type = 'flower'
    else if (typeRand < 0.95) type = 'clover'
    else type = 'mushroom'

    details.push({
      x,
      y,
      type,
      scale: 0.5 + random(i * 4) * 0.5,
      rotation: random(i * 5) * 360,
    })
  }

  return details
}

export const GroundPlane = memo(function GroundPlane({
  gridSize,
  tileSize,
  grassColor = '#7cb342',
  grassDarkColor = '#558b2f',
  dirtColor = '#8d6e4c',
  dirtDarkColor = '#5d4037',
  showGridLines = true,
  multiCellAreas = [],
  hoveredMultiCellArea = null,
  dragTargetCell = null,
  dragPlantSize = 1,
  isDragTargetValid = false,
}: GroundPlaneProps) {
  const tileHeight = tileSize * 0.35 // Slightly taller for more depth

  // Each isometric tile:
  // - Width on screen: tileSize (from left point to right point)
  // - Height on screen: tileSize/2 (from top point to bottom point)
  //
  // For a grid of N x N tiles:
  // - Total diamond width = N * tileSize (horizontal span)
  // - Total diamond height = N * tileSize/2 (vertical span of grass surface)

  const diamondWidth = gridSize * tileSize
  const diamondHeight = gridSize * (tileSize / 2)

  // SVG viewBox dimensions (add space for dirt extrusion at bottom + shadow)
  const svgWidth = diamondWidth
  const svgHeight = diamondHeight + tileHeight + 300 // Extra space for shadow to prevent clipping

  // Diamond corner points (grass surface)
  // The diamond is centered horizontally in the SVG
  const topX = svgWidth / 2
  const topY = 0
  const rightX = svgWidth
  const rightY = diamondHeight / 2
  const bottomX = svgWidth / 2
  const bottomY = diamondHeight
  const leftX = 0
  const leftY = diamondHeight / 2

  // Generate grass details (memoized)
  const grassDetails = useMemo(
    () => generateGrassDetails(gridSize, tileSize, 42),
    [gridSize, tileSize]
  )

  // Generate grid lines (memoized - expensive computation)
  const gridLines = useMemo(() => {
    if (!showGridLines) return []

    const isLineInsideMultiCell = (
      lineIndex: number,
      lineType: 'row' | 'col',
      colOrRowIndex: number
    ): boolean => {
      for (const area of multiCellAreas) {
        if (lineType === 'row') {
          if (
            lineIndex > area.row &&
            lineIndex < area.row + area.size &&
            colOrRowIndex >= area.col &&
            colOrRowIndex < area.col + area.size
          ) {
            return true
          }
        } else {
          if (
            lineIndex > area.col &&
            lineIndex < area.col + area.size &&
            colOrRowIndex >= area.row &&
            colOrRowIndex < area.row + area.size
          ) {
            return true
          }
        }
      }
      return false
    }

    const lines: { x1: number; y1: number; x2: number; y2: number }[] = []

    // Lines parallel to top-right edge (rows)
    for (let i = 1; i < gridSize; i++) {
      for (let col = 0; col < gridSize; col++) {
        if (isLineInsideMultiCell(i, 'row', col)) continue

        const segmentStartRatio = i / gridSize
        const colStartRatio = col / gridSize
        const colEndRatio = (col + 1) / gridSize

        const lineStartX = topX + (leftX - topX) * segmentStartRatio
        const lineStartY = topY + (leftY - topY) * segmentStartRatio
        const lineEndX = rightX + (bottomX - rightX) * segmentStartRatio
        const lineEndY = rightY + (bottomY - rightY) * segmentStartRatio

        lines.push({
          x1: lineStartX + (lineEndX - lineStartX) * colStartRatio,
          y1: lineStartY + (lineEndY - lineStartY) * colStartRatio,
          x2: lineStartX + (lineEndX - lineStartX) * colEndRatio,
          y2: lineStartY + (lineEndY - lineStartY) * colEndRatio,
        })
      }
    }

    // Lines parallel to top-left edge (columns)
    for (let i = 1; i < gridSize; i++) {
      for (let row = 0; row < gridSize; row++) {
        if (isLineInsideMultiCell(i, 'col', row)) continue

        const segmentStartRatio = i / gridSize
        const rowStartRatio = row / gridSize
        const rowEndRatio = (row + 1) / gridSize

        const lineStartX = topX + (rightX - topX) * segmentStartRatio
        const lineStartY = topY + (rightY - topY) * segmentStartRatio
        const lineEndX = leftX + (bottomX - leftX) * segmentStartRatio
        const lineEndY = leftY + (bottomY - leftY) * segmentStartRatio

        lines.push({
          x1: lineStartX + (lineEndX - lineStartX) * rowStartRatio,
          y1: lineStartY + (lineEndY - lineStartY) * rowStartRatio,
          x2: lineStartX + (lineEndX - lineStartX) * rowEndRatio,
          y2: lineStartY + (lineEndY - lineStartY) * rowEndRatio,
        })
      }
    }

    return lines
  }, [gridSize, tileSize, showGridLines, multiCellAreas, topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY])

  // Unique ID suffix for this component instance (hydration-safe)
  const uniqueId = useId().replace(/:/g, '')

  return (
    <svg
      width={svgWidth}
      height={svgHeight}
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="absolute pointer-events-none"
      style={{
        left: 0,
        top: 0,
      }}
    >
      <defs>
        {/* Enhanced gradient for grass top surface - more natural look */}
        <linearGradient id={`grassGradient-${uniqueId}`} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#8bc34a" />
          <stop offset="25%" stopColor={grassColor} />
          <stop offset="50%" stopColor="#7cb342" />
          <stop offset="75%" stopColor={grassDarkColor} />
          <stop offset="100%" stopColor="#689f38" />
        </linearGradient>

        {/* Radial highlight for center glow effect */}
        <radialGradient id={`grassHighlight-${uniqueId}`} cx="40%" cy="30%" r="60%">
          <stop offset="0%" stopColor="#9ccc65" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#8bc34a" stopOpacity="0.3" />
          <stop offset="100%" stopColor="transparent" stopOpacity="0" />
        </radialGradient>

        {/* Clip path to constrain texture within diamond shape */}
        <clipPath id={`grassClip-${uniqueId}`}>
          <polygon
            points={`${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}`}
          />
        </clipPath>

        {/* Enhanced noise pattern for grass texture */}
        <filter id={`grassTexture-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="1.2"
            numOctaves="6"
            seed="5"
            result="noise"
          />
          <feDiffuseLighting
            in="noise"
            lightingColor="#9ccc65"
            surfaceScale="2"
            result="diffLight"
          >
            <feDistantLight azimuth="225" elevation="50" />
          </feDiffuseLighting>
          <feBlend in="SourceGraphic" in2="diffLight" mode="soft-light" />
        </filter>

        {/* Dirt texture filter */}
        <filter id={`dirtTexture-${uniqueId}`}>
          <feTurbulence
            type="turbulence"
            baseFrequency="0.05"
            numOctaves="3"
            seed="10"
            result="noise"
          />
          <feDiffuseLighting
            in="noise"
            lightingColor="#8d6e4c"
            surfaceScale="1"
            result="diffLight"
          >
            <feDistantLight azimuth="135" elevation="45" />
          </feDiffuseLighting>
          <feBlend in="SourceGraphic" in2="diffLight" mode="multiply" />
        </filter>

        {/* Subtle drop shadow for depth */}
        <filter id={`groundShadow-${uniqueId}`} x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#1a1a1a" floodOpacity="0.25" />
        </filter>
      </defs>

      {/* Drop shadow under the island */}
      <ellipse
        cx={bottomX}
        cy={bottomY + tileHeight + 20}
        rx={diamondWidth * 0.4}
        ry={diamondHeight * 0.12}
        fill="rgba(0,0,0,0.15)"
        className="blur-xl"
      />

      {/* Main grass surface - single connected plane */}
      <g clipPath={`url(#grassClip-${uniqueId})`}>
        {/* Base grass layer */}
        <polygon
          points={`${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}`}
          fill={`url(#grassGradient-${uniqueId})`}
          filter={`url(#grassTexture-${uniqueId})`}
        />

        {/* Highlight overlay for lush effect */}
        <polygon
          points={`${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}`}
          fill={`url(#grassHighlight-${uniqueId})`}
        />

        {/* Grass detail decorations */}
        {grassDetails.map((detail, i) => (
          <g key={i} transform={`translate(${detail.x}, ${detail.y})`}>
            {detail.type === 'grass' && (
              <g transform={`scale(${detail.scale}) rotate(${detail.rotation})`}>
                <path
                  d="M0,0 Q-2,-8 0,-12 Q2,-8 0,0"
                  fill="#4a7c23"
                  opacity="0.7"
                />
                <path
                  d="M-2,0 Q-4,-6 -2,-10"
                  fill="none"
                  stroke="#558b2f"
                  strokeWidth="1"
                  opacity="0.5"
                />
                <path
                  d="M2,0 Q4,-6 2,-10"
                  fill="none"
                  stroke="#558b2f"
                  strokeWidth="1"
                  opacity="0.5"
                />
              </g>
            )}
            {detail.type === 'flower' && (
              <g transform={`scale(${detail.scale * 0.8})`}>
                {/* Flower petals */}
                <circle cx="0" cy="-6" r="2.5" fill={i % 3 === 0 ? '#fff176' : i % 3 === 1 ? '#f48fb1' : '#81d4fa'} opacity="0.9" />
                <circle cx="2" cy="-4" r="2" fill={i % 3 === 0 ? '#fff59d' : i % 3 === 1 ? '#f8bbd9' : '#b3e5fc'} opacity="0.8" />
                <circle cx="-2" cy="-4" r="2" fill={i % 3 === 0 ? '#fff59d' : i % 3 === 1 ? '#f8bbd9' : '#b3e5fc'} opacity="0.8" />
                {/* Flower center */}
                <circle cx="0" cy="-5" r="1.5" fill="#ffb74d" />
                {/* Stem */}
                <line x1="0" y1="0" x2="0" y2="-3" stroke="#66bb6a" strokeWidth="1" />
              </g>
            )}
            {detail.type === 'clover' && (
              <g transform={`scale(${detail.scale * 0.6})`}>
                <circle cx="-2" cy="-3" r="2" fill="#43a047" opacity="0.7" />
                <circle cx="2" cy="-3" r="2" fill="#43a047" opacity="0.7" />
                <circle cx="0" cy="-5" r="2" fill="#43a047" opacity="0.8" />
              </g>
            )}
            {detail.type === 'mushroom' && (
              <g transform={`scale(${detail.scale * 0.7})`}>
                <ellipse cx="0" cy="-4" rx="4" ry="2.5" fill={i % 2 === 0 ? '#ef5350' : '#ffb74d'} opacity="0.85" />
                <rect x="-1.5" y="-3" width="3" height="4" fill="#f5f5f5" rx="1" />
                {/* Spots */}
                <circle cx="-1.5" cy="-5" r="0.8" fill="#fff" opacity="0.9" />
                <circle cx="1.5" cy="-4" r="0.6" fill="#fff" opacity="0.9" />
              </g>
            )}
          </g>
        ))}
      </g>

      {/* Edge grass line for definition */}
      <polygon
        points={`${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}`}
        fill="none"
        stroke="#558b2f"
        strokeWidth="2"
        opacity="0.4"
      />

      {/* Left dirt face with enhanced texture */}
      <polygon
        points={`
          ${leftX},${leftY}
          ${bottomX},${bottomY}
          ${bottomX},${bottomY + tileHeight}
          ${leftX},${leftY + tileHeight}
        `}
        fill={dirtDarkColor}
      />
      {/* Left face highlight */}
      <polygon
        points={`
          ${leftX},${leftY}
          ${bottomX},${bottomY}
          ${bottomX},${bottomY + tileHeight * 0.3}
          ${leftX},${leftY + tileHeight * 0.3}
        `}
        fill="#6d4c41"
        opacity="0.3"
      />

      {/* Right dirt face with enhanced texture */}
      <polygon
        points={`
          ${bottomX},${bottomY}
          ${rightX},${rightY}
          ${rightX},${rightY + tileHeight}
          ${bottomX},${bottomY + tileHeight}
        `}
        fill={dirtColor}
      />
      {/* Right face highlight */}
      <polygon
        points={`
          ${bottomX},${bottomY}
          ${rightX},${rightY}
          ${rightX},${rightY + tileHeight * 0.3}
          ${bottomX},${bottomY + tileHeight * 0.3}
        `}
        fill="#a1887f"
        opacity="0.3"
      />

      {/* Bottom edge shadow */}
      <line
        x1={leftX}
        y1={leftY + tileHeight}
        x2={bottomX}
        y2={bottomY + tileHeight}
        stroke="rgba(0,0,0,0.4)"
        strokeWidth="2"
      />
      <line
        x1={bottomX}
        y1={bottomY + tileHeight}
        x2={rightX}
        y2={rightY + tileHeight}
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="2"
      />

      {/* Dirt layers/strata lines for realism */}
      <line
        x1={leftX}
        y1={leftY + tileHeight * 0.5}
        x2={bottomX}
        y2={bottomY + tileHeight * 0.5}
        stroke="#5d4037"
        strokeWidth="1"
        opacity="0.4"
        strokeDasharray="8 4"
      />
      <line
        x1={bottomX}
        y1={bottomY + tileHeight * 0.5}
        x2={rightX}
        y2={rightY + tileHeight * 0.5}
        stroke="#6d4c41"
        strokeWidth="1"
        opacity="0.4"
        strokeDasharray="8 4"
      />

      {/* Subtle grid lines */}
      {gridLines.map((line, index) => (
        <line
          key={index}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
      ))}

      {/* Drag target highlight - shows full area for multi-cell plants */}
      {dragTargetCell && (() => {
        const { row, col } = dragTargetCell
        const size = dragPlantSize
        // Calculate the 4 corners of the target area in isometric coordinates
        // For multi-cell plants, highlight the entire NxN area
        const topCornerX = topX + (col - row) * (tileSize / 2)
        const topCornerY = (col + row) * (tileSize / 4)

        const rightCornerX = topX + ((col + size) - row) * (tileSize / 2)
        const rightCornerY = ((col + size) + row) * (tileSize / 4)

        const bottomCornerX = topX + ((col + size) - (row + size)) * (tileSize / 2)
        const bottomCornerY = ((col + size) + (row + size)) * (tileSize / 4)

        const leftCornerX = topX + (col - (row + size)) * (tileSize / 2)
        const leftCornerY = (col + (row + size)) * (tileSize / 4)

        return (
          <polygon
            points={`
              ${topCornerX},${topCornerY}
              ${rightCornerX},${rightCornerY}
              ${bottomCornerX},${bottomCornerY}
              ${leftCornerX},${leftCornerY}
            `}
            fill={isDragTargetValid ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}
            stroke={isDragTargetValid ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'}
            strokeWidth="2"
            strokeDasharray={isDragTargetValid ? 'none' : '4 4'}
            className="transition-all duration-150"
          />
        )
      })()}

      {/* Merged hover highlight for multi-cell areas */}
      {hoveredMultiCellArea && (() => {
        const { row, col, size } = hoveredMultiCellArea
        // Calculate the 4 corners of the merged area in isometric coordinates
        // Top corner: (row, col)
        // Right corner: (row, col + size)
        // Bottom corner: (row + size, col + size)
        // Left corner: (row + size, col)

        const topCornerX = topX + (col - row) * (tileSize / 2)
        const topCornerY = (col + row) * (tileSize / 4)

        const rightCornerX = topX + ((col + size) - row) * (tileSize / 2)
        const rightCornerY = ((col + size) + row) * (tileSize / 4)

        const bottomCornerX = topX + ((col + size) - (row + size)) * (tileSize / 2)
        const bottomCornerY = ((col + size) + (row + size)) * (tileSize / 4)

        const leftCornerX = topX + (col - (row + size)) * (tileSize / 2)
        const leftCornerY = (col + (row + size)) * (tileSize / 4)

        return (
          <polygon
            points={`
              ${topCornerX},${topCornerY}
              ${rightCornerX},${rightCornerY}
              ${bottomCornerX},${bottomCornerY}
              ${leftCornerX},${leftCornerY}
            `}
            fill="rgba(255,255,255,0.15)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
            className="transition-all duration-200"
          />
        )
      })()}

    </svg>
  )
})

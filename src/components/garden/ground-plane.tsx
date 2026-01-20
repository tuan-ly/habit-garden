'use client'

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
  /** Whether the drag target is a valid drop location */
  isDragTargetValid?: boolean
}

export function GroundPlane({
  gridSize,
  tileSize,
  grassColor = '#7cb342',
  grassDarkColor = '#689f38',
  dirtColor = '#8d6e4c',
  dirtDarkColor = '#6b5344',
  showGridLines = true,
  multiCellAreas = [],
  hoveredMultiCellArea = null,
  dragTargetCell = null,
  isDragTargetValid = false,
}: GroundPlaneProps) {
  const tileHeight = tileSize * 0.3

  // Each isometric tile:
  // - Width on screen: tileSize (from left point to right point)
  // - Height on screen: tileSize/2 (from top point to bottom point)
  //
  // For a grid of N x N tiles:
  // - Total diamond width = N * tileSize (horizontal span)
  // - Total diamond height = N * tileSize/2 (vertical span of grass surface)

  const diamondWidth = gridSize * tileSize
  const diamondHeight = gridSize * (tileSize / 2)

  // SVG viewBox dimensions (add space for dirt extrusion at bottom)
  const svgWidth = diamondWidth
  const svgHeight = diamondHeight + tileHeight

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

  // Helper to check if a grid line segment is inside a multi-cell area
  // Row lines (parallel to top-right edge): line at row i separates row i-1 from row i
  // Col lines (parallel to top-left edge): line at col i separates col i-1 from col i
  const isLineInsideMultiCell = (
    lineIndex: number,
    lineType: 'row' | 'col',
    colOrRowIndex: number
  ): boolean => {
    for (const area of multiCellAreas) {
      if (lineType === 'row') {
        // Row line at index i: check if it's inside the multi-cell area vertically
        // and the column segment falls within the area horizontally
        if (
          lineIndex > area.row &&
          lineIndex < area.row + area.size &&
          colOrRowIndex >= area.col &&
          colOrRowIndex < area.col + area.size
        ) {
          return true
        }
      } else {
        // Col line at index i: check if it's inside the multi-cell area horizontally
        // and the row segment falls within the area vertically
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

  // Generate grid lines for tile boundaries (as segments to allow gaps)
  const gridLines: { x1: number; y1: number; x2: number; y2: number }[] = []

  if (showGridLines) {
    // Lines parallel to top-right edge (rows)
    // Each line separates row (i-1) from row (i)
    for (let i = 1; i < gridSize; i++) {
      // Break line into segments per column
      for (let col = 0; col < gridSize; col++) {
        // Skip this segment if it's inside a multi-cell area
        if (isLineInsideMultiCell(i, 'row', col)) {
          continue
        }

        const segmentStartRatio = i / gridSize
        const colStartRatio = col / gridSize
        const colEndRatio = (col + 1) / gridSize

        // Calculate segment start point
        const lineStartX = topX + (leftX - topX) * segmentStartRatio
        const lineStartY = topY + (leftY - topY) * segmentStartRatio
        const lineEndX = rightX + (bottomX - rightX) * segmentStartRatio
        const lineEndY = rightY + (bottomY - rightY) * segmentStartRatio

        // Interpolate along the line for this column segment
        const x1 = lineStartX + (lineEndX - lineStartX) * colStartRatio
        const y1 = lineStartY + (lineEndY - lineStartY) * colStartRatio
        const x2 = lineStartX + (lineEndX - lineStartX) * colEndRatio
        const y2 = lineStartY + (lineEndY - lineStartY) * colEndRatio

        gridLines.push({ x1, y1, x2, y2 })
      }
    }

    // Lines parallel to top-left edge (columns)
    // Each line separates col (i-1) from col (i)
    for (let i = 1; i < gridSize; i++) {
      // Break line into segments per row
      for (let row = 0; row < gridSize; row++) {
        // Skip this segment if it's inside a multi-cell area
        if (isLineInsideMultiCell(i, 'col', row)) {
          continue
        }

        const segmentStartRatio = i / gridSize
        const rowStartRatio = row / gridSize
        const rowEndRatio = (row + 1) / gridSize

        // Calculate segment start point
        const lineStartX = topX + (rightX - topX) * segmentStartRatio
        const lineStartY = topY + (rightY - topY) * segmentStartRatio
        const lineEndX = leftX + (bottomX - leftX) * segmentStartRatio
        const lineEndY = leftY + (bottomY - leftY) * segmentStartRatio

        // Interpolate along the line for this row segment
        const x1 = lineStartX + (lineEndX - lineStartX) * rowStartRatio
        const y1 = lineStartY + (lineEndY - lineStartY) * rowStartRatio
        const x2 = lineStartX + (lineEndX - lineStartX) * rowEndRatio
        const y2 = lineStartY + (lineEndY - lineStartY) * rowEndRatio

        gridLines.push({ x1, y1, x2, y2 })
      }
    }
  }

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
        {/* Gradient for grass top surface */}
        <linearGradient id="grassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={grassColor} />
          <stop offset="50%" stopColor={grassDarkColor} />
          <stop offset="100%" stopColor={grassColor} />
        </linearGradient>

        {/* Clip path to constrain texture within diamond shape */}
        <clipPath id="grassClip">
          <polygon
            points={`${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}`}
          />
        </clipPath>

        {/* Subtle noise pattern for texture */}
        <filter id="grassTexture">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="4"
            result="noise"
          />
          <feDiffuseLighting
            in="noise"
            lightingColor={grassColor}
            surfaceScale="1.5"
            result="diffLight"
          >
            <feDistantLight azimuth="45" elevation="60" />
          </feDiffuseLighting>
          <feBlend in="SourceGraphic" in2="diffLight" mode="multiply" />
        </filter>
      </defs>

      {/* Main grass surface - single connected plane */}
      <g clipPath="url(#grassClip)">
        <polygon
          points={`${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}`}
          fill="url(#grassGradient)"
          filter="url(#grassTexture)"
        />
      </g>

      {/* Grass surface overlay for depth */}
      <polygon
        points={`${topX},${topY} ${rightX},${rightY} ${bottomX},${bottomY} ${leftX},${leftY}`}
        fill={grassColor}
        opacity="0.3"
      />

      {/* Left dirt face */}
      <polygon
        points={`
          ${leftX},${leftY}
          ${bottomX},${bottomY}
          ${bottomX},${bottomY + tileHeight}
          ${leftX},${leftY + tileHeight}
        `}
        fill={dirtDarkColor}
      />

      {/* Right dirt face */}
      <polygon
        points={`
          ${bottomX},${bottomY}
          ${rightX},${rightY}
          ${rightX},${rightY + tileHeight}
          ${bottomX},${bottomY + tileHeight}
        `}
        fill={dirtColor}
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

      {/* Drag target highlight */}
      {dragTargetCell && (() => {
        const { row, col } = dragTargetCell
        // Calculate the 4 corners of the target cell in isometric coordinates
        const topCornerX = topX + (col - row) * (tileSize / 2)
        const topCornerY = (col + row) * (tileSize / 4)

        const rightCornerX = topX + ((col + 1) - row) * (tileSize / 2)
        const rightCornerY = ((col + 1) + row) * (tileSize / 4)

        const bottomCornerX = topX + ((col + 1) - (row + 1)) * (tileSize / 2)
        const bottomCornerY = ((col + 1) + (row + 1)) * (tileSize / 4)

        const leftCornerX = topX + (col - (row + 1)) * (tileSize / 2)
        const leftCornerY = (col + (row + 1)) * (tileSize / 4)

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

      {/* Border highlight removed */}


      {/* Shadow on bottom edges */}
      <line
        x1={leftX} y1={leftY}
        x2={bottomX} y2={bottomY}
        stroke="rgba(0,0,0,0.2)"
        strokeWidth="1"
      />
      <line
        x1={rightX} y1={rightY}
        x2={bottomX} y2={bottomY}
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1"
      />
    </svg>
  )
}

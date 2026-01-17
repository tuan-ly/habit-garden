'use client'

interface GroundPlaneProps {
  gridSize: number
  tileSize: number
  grassColor?: string
  grassDarkColor?: string
  dirtColor?: string
  dirtDarkColor?: string
  showGridLines?: boolean
}

export function GroundPlane({
  gridSize,
  tileSize,
  grassColor = '#7cb342',
  grassDarkColor = '#689f38',
  dirtColor = '#8d6e4c',
  dirtDarkColor = '#6b5344',
  showGridLines = true,
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

  // Generate grid lines for tile boundaries
  const gridLines: { x1: number; y1: number; x2: number; y2: number }[] = []

  if (showGridLines) {
    // Lines parallel to top-right edge (rows)
    for (let i = 1; i < gridSize; i++) {
      const ratio = i / gridSize
      const startX = topX + (leftX - topX) * ratio
      const startY = topY + (leftY - topY) * ratio
      const endX = rightX + (bottomX - rightX) * ratio
      const endY = rightY + (bottomY - rightY) * ratio
      gridLines.push({ x1: startX, y1: startY, x2: endX, y2: endY })
    }

    // Lines parallel to top-left edge (columns)
    for (let i = 1; i < gridSize; i++) {
      const ratio = i / gridSize
      const startX = topX + (rightX - topX) * ratio
      const startY = topY + (rightY - topY) * ratio
      const endX = leftX + (bottomX - leftX) * ratio
      const endY = leftY + (bottomY - leftY) * ratio
      gridLines.push({ x1: startX, y1: startY, x2: endX, y2: endY })
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

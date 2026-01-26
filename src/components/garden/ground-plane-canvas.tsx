'use client'

import { useRef, useEffect, useMemo, memo } from 'react'

export interface MultiCellArea {
    row: number
    col: number
    size: number
}

interface GroundPlaneCanvasProps {
    gridSize: number
    tileSize: number
    grassColor?: string
    grassDarkColor?: string
    dirtColor?: string
    dirtDarkColor?: string
    showGridLines?: boolean
    multiCellAreas?: MultiCellArea[]
    hoveredMultiCellArea?: MultiCellArea | null
    dragTargetCell?: { row: number; col: number } | null
    dragPlantSize?: number
    isDragTargetValid?: boolean
}

// Pre-calculate grass details at module level for zero re-computation
function generateGrassDetails(gridSize: number, tileSize: number, seed: number = 42) {
    const details: Array<{
        x: number
        y: number
        type: 'grass' | 'flower' | 'clover'
        scale: number
        color: string
    }> = []

    const random = (i: number) => {
        const x = Math.sin(seed + i * 9999) * 10000
        return x - Math.floor(x)
    }

    const diamondWidth = gridSize * tileSize
    const diamondHeight = gridSize * (tileSize / 2)
    const centerX = diamondWidth / 2

    // Reduced detail count for performance (50% less than original)
    const detailCount = Math.floor(gridSize * gridSize * 0.75)

    const flowerColors = ['#fff176', '#f48fb1', '#81d4fa', '#ce93d8']

    for (let i = 0; i < detailCount; i++) {
        const r1 = random(i * 2)
        const r2 = random(i * 2 + 1)

        const x = centerX + (r1 - 0.5) * diamondWidth * 0.85
        const y = diamondHeight * 0.1 + r2 * diamondHeight * 0.8

        const dx = Math.abs(x - centerX) / (diamondWidth / 2)
        const dy = Math.abs(y - diamondHeight / 2) / (diamondHeight / 2)
        if (dx + dy > 0.9) continue

        const typeRand = random(i * 3)
        let type: 'grass' | 'flower' | 'clover'
        if (typeRand < 0.7) type = 'grass'
        else if (typeRand < 0.9) type = 'flower'
        else type = 'clover'

        details.push({
            x,
            y,
            type,
            scale: 0.5 + random(i * 4) * 0.5,
            color: type === 'flower' ? flowerColors[i % flowerColors.length] : '#4a7c23',
        })
    }

    return details
}

// Memoized draw functions
function drawGrass(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.fillStyle = '#4a7c23'
    ctx.globalAlpha = 0.7
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.quadraticCurveTo(-2, -8, 0, -12)
    ctx.quadraticCurveTo(2, -8, 0, 0)
    ctx.fill()
    ctx.restore()
}

function drawFlower(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale * 0.8, scale * 0.8)

    // Petals
    ctx.fillStyle = color
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.arc(0, -6, 2.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.globalAlpha = 0.8
    ctx.beginPath()
    ctx.arc(2, -4, 2, 0, Math.PI * 2)
    ctx.arc(-2, -4, 2, 0, Math.PI * 2)
    ctx.fill()

    // Center
    ctx.fillStyle = '#ffb74d'
    ctx.globalAlpha = 1
    ctx.beginPath()
    ctx.arc(0, -5, 1.5, 0, Math.PI * 2)
    ctx.fill()

    // Stem
    ctx.strokeStyle = '#66bb6a'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(0, -3)
    ctx.stroke()

    ctx.restore()
}

function drawClover(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale * 0.6, scale * 0.6)
    ctx.fillStyle = '#43a047'
    ctx.globalAlpha = 0.7

    ctx.beginPath()
    ctx.arc(-2, -3, 2, 0, Math.PI * 2)
    ctx.arc(2, -3, 2, 0, Math.PI * 2)
    ctx.arc(0, -5, 2, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
}

function GroundPlaneCanvasComponent({
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
}: GroundPlaneCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const staticDrawnRef = useRef(false)

    const tileHeight = tileSize * 0.35

    const diamondWidth = gridSize * tileSize
    const diamondHeight = gridSize * (tileSize / 2)
    const svgWidth = diamondWidth
    const svgHeight = diamondHeight + tileHeight + 300 // Extra space for shadow to prevent clipping

    // Diamond corner points
    const topX = svgWidth / 2
    const topY = 0
    const rightX = svgWidth
    const rightY = diamondHeight / 2
    const bottomX = svgWidth / 2
    const bottomY = diamondHeight
    const leftX = 0
    const leftY = diamondHeight / 2

    // Pre-generate grass details (memoized)
    const grassDetails = useMemo(
        () => generateGrassDetails(gridSize, tileSize, 42),
        [gridSize, tileSize]
    )

    // Calculate grid lines once
    const gridLines = useMemo(() => {
        if (!showGridLines) return []

        const lines: { x1: number; y1: number; x2: number; y2: number }[] = []

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
                    ) return true
                } else {
                    if (
                        lineIndex > area.col &&
                        lineIndex < area.col + area.size &&
                        colOrRowIndex >= area.row &&
                        colOrRowIndex < area.row + area.size
                    ) return true
                }
            }
            return false
        }

        // Row lines
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

        // Column lines
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
    }, [gridSize, tileSize, showGridLines, multiCellAreas, topX, topY, leftX, leftY, rightX, rightY, bottomX, bottomY])

    // Draw static elements to offscreen canvas (only once)
    useEffect(() => {
        if (!offscreenCanvasRef.current) {
            offscreenCanvasRef.current = document.createElement('canvas')
        }

        const offscreen = offscreenCanvasRef.current
        offscreen.width = svgWidth
        offscreen.height = svgHeight

        const ctx = offscreen.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, svgWidth, svgHeight)

        // Draw shadow ellipse with blur
        ctx.save()
        ctx.filter = 'blur(20px)'
        ctx.fillStyle = 'rgba(0,0,0,0.15)'
        ctx.beginPath()
        ctx.ellipse(bottomX, bottomY + tileHeight + 20, diamondWidth * 0.4, diamondHeight * 0.12, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Draw grass surface with gradient
        const gradient = ctx.createLinearGradient(svgWidth * 0.2, 0, svgWidth * 0.8, diamondHeight)
        gradient.addColorStop(0, '#8bc34a')
        gradient.addColorStop(0.25, grassColor)
        gradient.addColorStop(0.5, '#7cb342')
        gradient.addColorStop(0.75, grassDarkColor)
        gradient.addColorStop(1, '#689f38')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.moveTo(topX, topY)
        ctx.lineTo(rightX, rightY)
        ctx.lineTo(bottomX, bottomY)
        ctx.lineTo(leftX, leftY)
        ctx.closePath()
        ctx.fill()

        // Grass edge
        ctx.strokeStyle = '#558b2f'
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.4
        ctx.stroke()
        ctx.globalAlpha = 1

        // Draw grass details
        for (const detail of grassDetails) {
            if (detail.type === 'grass') {
                drawGrass(ctx, detail.x, detail.y, detail.scale)
            } else if (detail.type === 'flower') {
                drawFlower(ctx, detail.x, detail.y, detail.scale, detail.color)
            } else if (detail.type === 'clover') {
                drawClover(ctx, detail.x, detail.y, detail.scale)
            }
        }

        // Left dirt face
        ctx.fillStyle = dirtDarkColor
        ctx.beginPath()
        ctx.moveTo(leftX, leftY)
        ctx.lineTo(bottomX, bottomY)
        ctx.lineTo(bottomX, bottomY + tileHeight)
        ctx.lineTo(leftX, leftY + tileHeight)
        ctx.closePath()
        ctx.fill()

        // Left face highlight
        ctx.fillStyle = '#6d4c41'
        ctx.globalAlpha = 0.3
        ctx.beginPath()
        ctx.moveTo(leftX, leftY)
        ctx.lineTo(bottomX, bottomY)
        ctx.lineTo(bottomX, bottomY + tileHeight * 0.3)
        ctx.lineTo(leftX, leftY + tileHeight * 0.3)
        ctx.closePath()
        ctx.fill()
        ctx.globalAlpha = 1

        // Right dirt face
        ctx.fillStyle = dirtColor
        ctx.beginPath()
        ctx.moveTo(bottomX, bottomY)
        ctx.lineTo(rightX, rightY)
        ctx.lineTo(rightX, rightY + tileHeight)
        ctx.lineTo(bottomX, bottomY + tileHeight)
        ctx.closePath()
        ctx.fill()

        // Right face highlight
        ctx.fillStyle = '#a1887f'
        ctx.globalAlpha = 0.3
        ctx.beginPath()
        ctx.moveTo(bottomX, bottomY)
        ctx.lineTo(rightX, rightY)
        ctx.lineTo(rightX, rightY + tileHeight * 0.3)
        ctx.lineTo(bottomX, bottomY + tileHeight * 0.3)
        ctx.closePath()
        ctx.fill()
        ctx.globalAlpha = 1

        // Bottom edges
        ctx.strokeStyle = 'rgba(0,0,0,0.4)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(leftX, leftY + tileHeight)
        ctx.lineTo(bottomX, bottomY + tileHeight)
        ctx.stroke()

        ctx.strokeStyle = 'rgba(0,0,0,0.3)'
        ctx.beginPath()
        ctx.moveTo(bottomX, bottomY + tileHeight)
        ctx.lineTo(rightX, rightY + tileHeight)
        ctx.stroke()

        // Strata lines
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.4
        ctx.setLineDash([8, 4])

        ctx.strokeStyle = '#5d4037'
        ctx.beginPath()
        ctx.moveTo(leftX, leftY + tileHeight * 0.5)
        ctx.lineTo(bottomX, bottomY + tileHeight * 0.5)
        ctx.stroke()

        ctx.strokeStyle = '#6d4c41'
        ctx.beginPath()
        ctx.moveTo(bottomX, bottomY + tileHeight * 0.5)
        ctx.lineTo(rightX, rightY + tileHeight * 0.5)
        ctx.stroke()

        ctx.setLineDash([])
        ctx.globalAlpha = 1

        staticDrawnRef.current = true
    }, [gridSize, tileSize, grassColor, grassDarkColor, dirtColor, dirtDarkColor, grassDetails,
        svgWidth, svgHeight, diamondWidth, diamondHeight, tileHeight,
        topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY])

    // Main render effect - composites static canvas + dynamic overlays
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !offscreenCanvasRef.current) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, svgWidth, svgHeight)

        // Draw cached static content
        ctx.drawImage(offscreenCanvasRef.current, 0, 0)

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.15)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 8])
        for (const line of gridLines) {
            ctx.beginPath()
            ctx.moveTo(line.x1, line.y1)
            ctx.lineTo(line.x2, line.y2)
            ctx.stroke()
        }
        ctx.setLineDash([])

        // Draw drag target highlight
        if (dragTargetCell) {
            const { row, col } = dragTargetCell
            const size = dragPlantSize

            const topCornerX = topX + (col - row) * (tileSize / 2)
            const topCornerY = (col + row) * (tileSize / 4)
            const rightCornerX = topX + ((col + size) - row) * (tileSize / 2)
            const rightCornerY = ((col + size) + row) * (tileSize / 4)
            const bottomCornerX = topX + ((col + size) - (row + size)) * (tileSize / 2)
            const bottomCornerY = ((col + size) + (row + size)) * (tileSize / 4)
            const leftCornerX = topX + (col - (row + size)) * (tileSize / 2)
            const leftCornerY = (col + (row + size)) * (tileSize / 4)

            ctx.fillStyle = isDragTargetValid ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'
            ctx.strokeStyle = isDragTargetValid ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)'
            ctx.lineWidth = 2
            if (!isDragTargetValid) ctx.setLineDash([4, 4])

            ctx.beginPath()
            ctx.moveTo(topCornerX, topCornerY)
            ctx.lineTo(rightCornerX, rightCornerY)
            ctx.lineTo(bottomCornerX, bottomCornerY)
            ctx.lineTo(leftCornerX, leftCornerY)
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
            ctx.setLineDash([])
        }

        // Draw hovered multi-cell area
        if (hoveredMultiCellArea) {
            const { row, col, size } = hoveredMultiCellArea

            const topCornerX = topX + (col - row) * (tileSize / 2)
            const topCornerY = (col + row) * (tileSize / 4)
            const rightCornerX = topX + ((col + size) - row) * (tileSize / 2)
            const rightCornerY = ((col + size) + row) * (tileSize / 4)
            const bottomCornerX = topX + ((col + size) - (row + size)) * (tileSize / 2)
            const bottomCornerY = ((col + size) + (row + size)) * (tileSize / 4)
            const leftCornerX = topX + (col - (row + size)) * (tileSize / 2)
            const leftCornerY = (col + (row + size)) * (tileSize / 4)

            ctx.fillStyle = 'rgba(255,255,255,0.15)'
            ctx.strokeStyle = 'rgba(255,255,255,0.4)'
            ctx.lineWidth = 1.5

            ctx.beginPath()
            ctx.moveTo(topCornerX, topCornerY)
            ctx.lineTo(rightCornerX, rightCornerY)
            ctx.lineTo(bottomCornerX, bottomCornerY)
            ctx.lineTo(leftCornerX, leftCornerY)
            ctx.closePath()
            ctx.fill()
            ctx.stroke()
        }
    }, [gridLines, hoveredMultiCellArea, dragTargetCell, dragPlantSize, isDragTargetValid,
        svgWidth, svgHeight, topX, tileSize])

    return (
        <canvas
            ref={canvasRef}
            width={svgWidth}
            height={svgHeight}
            className="absolute pointer-events-none"
            style={{ left: 0, top: 0 }}
        />
    )
}

// Memoize entire component to prevent unnecessary re-renders
export const GroundPlaneCanvas = memo(GroundPlaneCanvasComponent)

// Re-export types for compatibility
export type { MultiCellArea as MultiCellAreaCanvas }

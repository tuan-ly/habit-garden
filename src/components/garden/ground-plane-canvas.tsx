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

    // Detail count — denser for lusher ground feel
    const detailCount = Math.floor(gridSize * gridSize * 1.8)

    const flowerColors = ['#E8C547', '#D4A0A0', '#B8C8A0', '#C4A8D0']

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
            color: type === 'flower' ? flowerColors[i % flowerColors.length] : '#6B8C5E',
        })
    }

    return details
}

// Memoized draw functions
function drawGrass(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) {
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(scale, scale)
    ctx.fillStyle = '#6B8C5E'
    ctx.globalAlpha = 0.6
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
    ctx.globalAlpha = 0.75
    ctx.beginPath()
    ctx.arc(0, -6, 2.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.globalAlpha = 0.65
    ctx.beginPath()
    ctx.arc(2, -4, 2, 0, Math.PI * 2)
    ctx.arc(-2, -4, 2, 0, Math.PI * 2)
    ctx.fill()

    // Center
    ctx.fillStyle = '#D4A870'
    ctx.globalAlpha = 0.9
    ctx.beginPath()
    ctx.arc(0, -5, 1.5, 0, Math.PI * 2)
    ctx.fill()

    // Stem
    ctx.strokeStyle = '#7FA076'
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
    ctx.fillStyle = '#7FA076'
    ctx.globalAlpha = 0.55

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
    grassColor = '#A8C49A',
    grassDarkColor = '#8FAE82',
    dirtColor = '#A08060',
    dirtDarkColor = '#7C5E48',
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

        // Draw shadow ellipse with blur (warm cream tone, Art Bible §2)
        ctx.save()
        ctx.filter = 'blur(24px)'
        ctx.fillStyle = 'rgba(124, 94, 72, 0.22)'
        ctx.beginPath()
        ctx.ellipse(bottomX, bottomY + tileHeight + 20, diamondWidth * 0.42, diamondHeight * 0.13, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Draw grass surface with warm sage gradient — sun from UPPER-RIGHT
        // Light hits the right/top side, shadow falls toward lower-left
        const gradient = ctx.createLinearGradient(svgWidth * 0.85, 0, svgWidth * 0.15, diamondHeight)
        gradient.addColorStop(0, '#B8D2A8')
        gradient.addColorStop(0.2, grassColor)
        gradient.addColorStop(0.45, '#B0C8A0')
        gradient.addColorStop(0.65, grassDarkColor)
        gradient.addColorStop(1, '#758F68')

        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.moveTo(topX, topY)
        ctx.lineTo(rightX, rightY)
        ctx.lineTo(bottomX, bottomY)
        ctx.lineTo(leftX, leftY)
        ctx.closePath()
        ctx.fill()

        // Grass edge — nearly invisible, just enough to define shape
        ctx.strokeStyle = '#7FA076'
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.12
        ctx.stroke()
        ctx.globalAlpha = 1

        // PREMIUM: Diamond vignette — bright spot offset toward upper-right (sun direction)
        const vignetteGrad = ctx.createRadialGradient(
            svgWidth * 0.58, diamondHeight * 0.38, 0,
            svgWidth / 2, diamondHeight / 2, diamondWidth * 0.52
        )
        vignetteGrad.addColorStop(0, 'rgba(251,245,230,0.18)')
        vignetteGrad.addColorStop(0.35, 'rgba(251,245,230,0.06)')
        vignetteGrad.addColorStop(0.6, 'rgba(124,94,72,0)')
        vignetteGrad.addColorStop(1, 'rgba(90,68,48,0.22)')
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(topX, topY)
        ctx.lineTo(rightX, rightY)
        ctx.lineTo(bottomX, bottomY)
        ctx.lineTo(leftX, leftY)
        ctx.closePath()
        ctx.clip()
        ctx.fillStyle = vignetteGrad
        ctx.fillRect(0, 0, svgWidth, diamondHeight)
        ctx.restore()

        // PREMIUM: Subtle noise texture overlay for organic grass feel
        // Generated once with deterministic seed to avoid SSR/client mismatch
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(topX, topY)
        ctx.lineTo(rightX, rightY)
        ctx.lineTo(bottomX, bottomY)
        ctx.lineTo(leftX, leftY)
        ctx.closePath()
        ctx.clip()
        const noiseSeed = 0xC0FFEE
        let noiseState = noiseSeed
        const noiseRand = () => {
            noiseState = (noiseState * 9301 + 49297) % 233280
            return noiseState / 233280
        }
        const noiseCount = Math.floor(diamondWidth * diamondHeight / 180)
        for (let i = 0; i < noiseCount; i++) {
            const nx = noiseRand() * diamondWidth
            const ny = noiseRand() * diamondHeight
            const shade = noiseRand()
            ctx.fillStyle = shade < 0.5
                ? `rgba(251,245,230,${0.05 + shade * 0.06})`
                : `rgba(90,68,48,${0.03 + (shade - 0.5) * 0.05})`
            ctx.fillRect(nx, ny, 1.2, 1.2)
        }
        ctx.restore()

        // PREMIUM: Grass patch variation — organic lighter/darker zones for depth
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(topX, topY)
        ctx.lineTo(rightX, rightY)
        ctx.lineTo(bottomX, bottomY)
        ctx.lineTo(leftX, leftY)
        ctx.closePath()
        ctx.clip()
        let patchState = 0xBEEF
        const patchRand = () => {
            patchState = (patchState * 9301 + 49297) % 233280
            return patchState / 233280
        }
        const patchCount = Math.floor(gridSize * gridSize * 0.4)
        for (let i = 0; i < patchCount; i++) {
            const px = patchRand() * diamondWidth
            const py = patchRand() * diamondHeight
            const dx = Math.abs(px - svgWidth / 2) / (diamondWidth / 2)
            const dy = Math.abs(py - diamondHeight / 2) / (diamondHeight / 2)
            if (dx + dy > 0.85) continue
            const rx = 15 + patchRand() * 35
            const ry = 8 + patchRand() * 18
            const tone = patchRand()
            ctx.fillStyle = tone < 0.5
                ? `rgba(180,210,165,${0.08 + tone * 0.06})`
                : `rgba(110,140,95,${0.06 + (tone - 0.5) * 0.05})`
            ctx.beginPath()
            ctx.ellipse(px, py, rx, ry, patchRand() * Math.PI, 0, Math.PI * 2)
            ctx.fill()
        }
        ctx.restore()

        // PREMIUM: Beveled edges — sun from upper-right
        ctx.save()
        ctx.lineWidth = 1.5
        // Top-right bevel (top → right edge): cream highlight (sun-facing)
        ctx.strokeStyle = 'rgba(251,245,230,0.15)'
        ctx.beginPath()
        ctx.moveTo(topX, topY + 0.5)
        ctx.lineTo(rightX - 0.5, rightY)
        ctx.stroke()
        // Top-left bevel (top → left edge): subtler highlight
        ctx.strokeStyle = 'rgba(251,245,230,0.06)'
        ctx.beginPath()
        ctx.moveTo(topX, topY + 0.5)
        ctx.lineTo(leftX + 0.5, leftY)
        ctx.stroke()
        // Bottom-left bevel: warm shadow (away from sun)
        ctx.strokeStyle = 'rgba(124,94,72,0.12)'
        ctx.beginPath()
        ctx.moveTo(leftX + 0.5, leftY)
        ctx.lineTo(bottomX, bottomY - 0.5)
        ctx.stroke()
        // Bottom-right bevel: lighter shadow (partially sun-lit)
        ctx.strokeStyle = 'rgba(124,94,72,0.06)'
        ctx.beginPath()
        ctx.moveTo(rightX - 0.5, rightY)
        ctx.lineTo(bottomX, bottomY - 0.5)
        ctx.stroke()
        ctx.restore()

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

        // Left face highlight — shadow side, very subtle
        ctx.fillStyle = '#8B6B52'
        ctx.globalAlpha = 0.1
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

        // Right face highlight — sun-facing, stronger warm cream
        ctx.fillStyle = '#D4C9B0'
        ctx.globalAlpha = 0.35
        ctx.beginPath()
        ctx.moveTo(bottomX, bottomY)
        ctx.lineTo(rightX, rightY)
        ctx.lineTo(rightX, rightY + tileHeight * 0.3)
        ctx.lineTo(bottomX, bottomY + tileHeight * 0.3)
        ctx.closePath()
        ctx.fill()
        ctx.globalAlpha = 1

        // Bottom edges (warm earth, softened)
        ctx.strokeStyle = 'rgba(82, 60, 44, 0.35)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(leftX, leftY + tileHeight)
        ctx.lineTo(bottomX, bottomY + tileHeight)
        ctx.stroke()

        ctx.strokeStyle = 'rgba(82, 60, 44, 0.25)'
        ctx.beginPath()
        ctx.moveTo(bottomX, bottomY + tileHeight)
        ctx.lineTo(rightX, rightY + tileHeight)
        ctx.stroke()

        // Strata lines (warm earth tones)
        ctx.lineWidth = 1
        ctx.globalAlpha = 0.35
        ctx.setLineDash([8, 4])

        ctx.strokeStyle = '#7C5E48'
        ctx.beginPath()
        ctx.moveTo(leftX, leftY + tileHeight * 0.5)
        ctx.lineTo(bottomX, bottomY + tileHeight * 0.5)
        ctx.stroke()

        ctx.strokeStyle = '#8B6B52'
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

        // Draw grid lines (barely visible — immersion-first)
        ctx.strokeStyle = 'rgba(255,255,255,0.035)'
        ctx.lineWidth = 0.5
        ctx.setLineDash([2, 14])
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

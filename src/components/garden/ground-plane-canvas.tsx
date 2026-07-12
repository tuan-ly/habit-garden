'use client'

import { useRef, useEffect, useMemo, useState, memo } from 'react'
import type { WeatherType } from '@/types/database'
import type { TimeOfDay } from './themes'

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
    /** Current weather affects lighting intensity */
    weather?: WeatherType | null
    /** Time of day affects overall brightness */
    timeOfDay?: TimeOfDay
    /** Sanctuary-only cinematic art direction */
    cinematic?: boolean
    /** Active plant area used to anchor the worn-earth focal zone */
    focalArea?: MultiCellArea | null
}

/**
 * Compute lighting mood based on weather + time of day.
 *
 * ─── PARAMETER GUIDE ──────────────────────────────────────────────────────
 *
 * All values are alpha (0..1). Higher = more visible / more contrast.
 *
 * • vignetteHighlight (0..0.3 typical)
 *     The bright cream "spotlight" radiating from the sun's position
 *     (upper-right of the diamond). Higher = stronger sunbeam feel.
 *     Lower in overcast/night because diffuse light has no hot spot.
 *
 * • vignetteShadow (0..0.3 typical)
 *     The dark warm halo at the diamond's outer edges (depth/falloff).
 *     Higher = more dramatic depth, garden feels like it's in a "bowl".
 *     Increase in stormy/night to compress the visual focus inward.
 *
 * • bevelHighlight (0..0.2 typical)
 *     Cream stroke on the top-right grass edge — the rim of the island
 *     catching direct sun. Higher = sharper, more "lit" edge definition.
 *     Drop to near 0 in rainy/stormy because there's no direct rim light.
 *
 * • dirtHighlight (0..0.5 typical)
 *     Alpha for the cream highlight overlay on the right (sun-facing)
 *     dirt face. Higher = more "side-lit" 3D feel on the soil.
 *     Lower in overcast — soil looks uniformly dim.
 *
 * • globalTint (CSS color string or null)
 *     Solid color overlay clipped to the grass diamond, applied after
 *     all grass details. Use cool colors for overcast moods, deep
 *     blue-purple for night. null = no overlay (full sun).
 *     Format: 'rgba(R,G,B,A)' — keep A ≤ 0.30 or details disappear.
 *
 * ─── HOW TO TUNE ──────────────────────────────────────────────────────────
 *
 * 1. Want a new weather mood (e.g. 'foggy')?
 *    Add an `else if (weather === 'foggy')` block. Start by copying
 *    'cloudy' values, then bump globalTint toward white-grey.
 *
 * 2. Garden too dark in rainy mode?
 *    Increase dirtHighlight (sun-facing soil) FIRST — it's the most
 *    visible cue. Then nudge vignetteHighlight up.
 *
 * 3. Night looks flat?
 *    Lower the night-tint alpha (currently 0.32–0.40). Or increase
 *    vignetteHighlight multiplier (currently × 0.4) to keep some
 *    "moonlight" focus.
 *
 * 4. Want stronger contrast on sunny days?
 *    Raise both vignetteHighlight (more sun) AND vignetteShadow
 *    (more edge falloff) — they work as a pair.
 *
 * Always test ALL 5 weather × 2 time-of-day combos after tweaking
 * any default. Use `?weather=stormy` URL param if you wire one up,
 * or set in dev panel.
 * ──────────────────────────────────────────────────────────────────────────
 */
function getLightingProfile(weather: WeatherType | null | undefined, timeOfDay: TimeOfDay | undefined) {
    // Default: sunny day — full contrast, warm
    let vignetteHighlight = 0.18
    let vignetteShadow = 0.22
    let bevelHighlight = 0.15
    let dirtHighlight = 0.35
    let globalTint: string | null = null

    // Weather modulation
    if (weather === 'cloudy') {
        // Diffuse soft light — kill the hot spot, add cool grey wash
        vignetteHighlight = 0.08
        vignetteShadow = 0.12
        bevelHighlight = 0.07
        dirtHighlight = 0.18
        globalTint = 'rgba(180,195,210,0.10)'
    } else if (weather === 'rainy') {
        // Wet overcast — cooler, darker, more compressed
        vignetteHighlight = 0.05
        vignetteShadow = 0.18
        bevelHighlight = 0.04
        dirtHighlight = 0.12
        globalTint = 'rgba(120,140,160,0.18)'
    } else if (weather === 'stormy') {
        // Heavy storm — almost no direct light, deep cool wash
        vignetteHighlight = 0.03
        vignetteShadow = 0.25
        bevelHighlight = 0.02
        dirtHighlight = 0.08
        globalTint = 'rgba(70,85,105,0.28)'
    } else if (weather === 'rainbow') {
        // Sun returning after rain — softer than full sunny, no tint
        vignetteHighlight = 0.14
        bevelHighlight = 0.12
        dirtHighlight = 0.28
    }

    // Night modulation (stacks on top of any weather above)
    if (timeOfDay === 'night') {
        vignetteHighlight *= 0.4   // dim the sun spot but keep some "moonlight"
        bevelHighlight *= 0.3      // edges barely catch light at night
        dirtHighlight *= 0.4       // soil reads as dark mass
        // Deep blue-purple wash. If a weather tint already exists, deepen it.
        globalTint = globalTint ? 'rgba(30,40,65,0.40)' : 'rgba(30,40,65,0.32)'
    }

    return {
        vignetteHighlight,
        vignetteShadow,
        bevelHighlight,
        dirtHighlight,
        globalTint,
    }
}

// Pre-calculate grass details at module level for zero re-computation
function generateGrassDetails(gridSize: number, tileSize: number, seed: number = 42, cinematic = false) {
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
    const detailCount = Math.floor(gridSize * gridSize * (cinematic ? 1.24 : 1.8))

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
        if (typeRand < (cinematic ? 0.9 : 0.7)) type = 'grass'
        else if (typeRand < (cinematic ? 0.975 : 0.9)) type = 'flower'
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
    ctx.fillStyle = '#58764D'
    ctx.globalAlpha = 0.76
    const blades = [
        { x: -2.6, lean: -2.8, height: 8.5 },
        { x: 0, lean: 0.6, height: 12 },
        { x: 2.7, lean: 3, height: 9.5 },
    ]
    for (const blade of blades) {
        ctx.beginPath()
        ctx.moveTo(blade.x - 0.8, 0)
        ctx.quadraticCurveTo(blade.x + blade.lean * 0.55, -blade.height * 0.64, blade.x + blade.lean, -blade.height)
        ctx.quadraticCurveTo(blade.x + blade.lean * 0.4, -blade.height * 0.55, blade.x + 0.8, 0)
        ctx.fill()
    }
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

/**
 * Trace the visible grass silhouette without changing the logical diamond/grid.
 * Rounded tips and tiny deterministic bends keep the island organic while
 * placement, collision and isometric math continue to use the exact tile grid.
 */
function traceOrganicDiamond(
    ctx: CanvasRenderingContext2D,
    topX: number,
    topY: number,
    rightX: number,
    rightY: number,
    bottomX: number,
    bottomY: number,
    leftX: number,
    leftY: number,
    radius: number,
    wobble: number
) {
    const rx = radius
    const ry = radius * 0.48
    const sideRadius = radius * 1.12

    ctx.moveTo(topX - rx, topY + ry)
    ctx.quadraticCurveTo(topX, topY, topX + rx, topY + ry)
    ctx.bezierCurveTo(
        topX + (rightX - topX) * 0.34, topY + (rightY - topY) * 0.34 - wobble,
        topX + (rightX - topX) * 0.68, topY + (rightY - topY) * 0.68 + wobble,
        rightX - sideRadius, rightY - ry
    )
    ctx.quadraticCurveTo(rightX, rightY, rightX - sideRadius, rightY + ry)
    ctx.bezierCurveTo(
        rightX + (bottomX - rightX) * 0.34, rightY + (bottomY - rightY) * 0.34 + wobble,
        rightX + (bottomX - rightX) * 0.68, rightY + (bottomY - rightY) * 0.68 - wobble,
        bottomX + rx, bottomY - ry
    )
    ctx.quadraticCurveTo(bottomX, bottomY, bottomX - rx, bottomY - ry)
    ctx.bezierCurveTo(
        bottomX + (leftX - bottomX) * 0.34, bottomY + (leftY - bottomY) * 0.34 + wobble,
        bottomX + (leftX - bottomX) * 0.68, bottomY + (leftY - bottomY) * 0.68 - wobble,
        leftX + sideRadius, leftY + ry
    )
    ctx.quadraticCurveTo(leftX, leftY, leftX + sideRadius, leftY - ry)
    ctx.bezierCurveTo(
        leftX + (topX - leftX) * 0.34, leftY + (topY - leftY) * 0.34 - wobble,
        leftX + (topX - leftX) * 0.68, leftY + (topY - leftY) * 0.68 + wobble,
        topX - rx, topY + ry
    )
    ctx.closePath()
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
    weather = null,
    timeOfDay = 'day',
    cinematic = false,
    focalArea = null,
}: GroundPlaneCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const staticDrawnRef = useRef(false)
    const grassTextureRef = useRef<HTMLImageElement | null>(null)
    const [grassTextureReady, setGrassTextureReady] = useState(false)

    useEffect(() => {
        if (!cinematic) {
            grassTextureRef.current = null
            return
        }

        let cancelled = false
        const texture = new Image()
        texture.decoding = 'async'
        texture.src = '/garden/textures/sanctuary-grass.webp'
        texture.onload = () => {
            if (cancelled) return
            grassTextureRef.current = texture
            setGrassTextureReady(true)
        }
        return () => {
            cancelled = true
        }
    }, [cinematic])

    const tileHeight = tileSize * (cinematic ? 0.24 : 0.35)

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
    const organicRadius = cinematic ? Math.max(16, tileSize * 0.22) : 0
    const organicWobble = cinematic ? Math.max(3, tileSize * 0.032) : 0

    // Pre-generate grass details (memoized)
    const grassDetails = useMemo(
        () => generateGrassDetails(gridSize, tileSize, 42, cinematic),
        [gridSize, tileSize, cinematic]
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
    }, [gridSize, showGridLines, multiCellAreas, topX, topY, leftX, leftY, rightX, rightY, bottomX, bottomY])

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

        // Adaptive lighting based on weather + time of day
        const light = getLightingProfile(weather, timeOfDay)
        if (cinematic && timeOfDay === 'day') {
            light.vignetteHighlight = Math.max(light.vignetteHighlight, 0.38)
            light.vignetteShadow = Math.max(light.vignetteShadow, 0.37)
            light.bevelHighlight = Math.max(light.bevelHighlight, 0.24)
            light.dirtHighlight = Math.max(light.dirtHighlight, 0.42)
        }

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
        gradient.addColorStop(0, cinematic ? '#C4D184' : '#B8D2A8')
        gradient.addColorStop(0.2, cinematic ? '#A4B879' : grassColor)
        gradient.addColorStop(0.45, cinematic ? '#879C66' : '#B0C8A0')
        gradient.addColorStop(0.7, cinematic ? '#687F57' : grassDarkColor)
        gradient.addColorStop(1, cinematic ? '#42583D' : '#758F68')

        ctx.fillStyle = gradient
        ctx.beginPath()
        traceOrganicDiamond(ctx, topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY, organicRadius, organicWobble)
        ctx.fill()

        // A low-opacity real material texture supplies the painterly fibers
        // that procedural gradients cannot reproduce. Lighting and grid math
        // remain fully dynamic in canvas.
        if (cinematic && grassTextureReady && grassTextureRef.current) {
            ctx.save()
            ctx.beginPath()
            traceOrganicDiamond(ctx, topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY, organicRadius, organicWobble)
            ctx.clip()
            ctx.globalAlpha = 0.42
            ctx.globalCompositeOperation = 'multiply'
            ctx.drawImage(grassTextureRef.current, 0, 0, svgWidth, diamondHeight)
            ctx.restore()
        }

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
        vignetteGrad.addColorStop(0, `rgba(251,245,230,${light.vignetteHighlight})`)
        vignetteGrad.addColorStop(0.35, `rgba(251,245,230,${light.vignetteHighlight * 0.33})`)
        vignetteGrad.addColorStop(0.6, 'rgba(124,94,72,0)')
        vignetteGrad.addColorStop(1, `rgba(90,68,48,${light.vignetteShadow})`)
        ctx.save()
        ctx.beginPath()
        traceOrganicDiamond(ctx, topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY, organicRadius, organicWobble)
        ctx.clip()
        ctx.fillStyle = vignetteGrad
        ctx.fillRect(0, 0, svgWidth, diamondHeight)
        ctx.restore()

        // PREMIUM: Subtle noise texture overlay for organic grass feel
        // Generated once with deterministic seed to avoid SSR/client mismatch
        ctx.save()
        ctx.beginPath()
        traceOrganicDiamond(ctx, topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY, organicRadius, organicWobble)
        ctx.clip()
        const noiseSeed = 0xC0FFEE
        let noiseState = noiseSeed
        const noiseRand = () => {
            noiseState = (noiseState * 9301 + 49297) % 233280
            return noiseState / 233280
        }
        const noiseCount = Math.floor(diamondWidth * diamondHeight / (cinematic ? 105 : 180))
        for (let i = 0; i < noiseCount; i++) {
            const nx = noiseRand() * diamondWidth
            const ny = noiseRand() * diamondHeight
            const shade = noiseRand()
            ctx.fillStyle = shade < 0.5
                ? `rgba(251,245,230,${(cinematic ? 0.065 : 0.05) + shade * 0.07})`
                : `rgba(90,68,48,${(cinematic ? 0.045 : 0.03) + (shade - 0.5) * 0.07})`
            const grainSize = cinematic ? 1.45 : 1.2
            ctx.fillRect(nx, ny, grainSize, grainSize)
        }
        ctx.restore()

        // Soft painterly mottling adds material depth between the tiny grain
        // and the large tonal zones without introducing obvious blob shapes.
        if (cinematic) {
            ctx.save()
            ctx.beginPath()
            traceOrganicDiamond(ctx, topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY, organicRadius, organicWobble)
            ctx.clip()
            ctx.filter = `blur(${Math.max(3, tileSize * 0.035)}px)`
            let mottleState = 0xA17E
            const mottleRand = () => {
                mottleState = (mottleState * 9301 + 49297) % 233280
                return mottleState / 233280
            }
            const mottleCount = Math.floor(gridSize * gridSize * 1.15)
            for (let i = 0; i < mottleCount; i++) {
                const mx = mottleRand() * diamondWidth
                const my = mottleRand() * diamondHeight
                const dx = Math.abs(mx - svgWidth / 2) / (diamondWidth / 2)
                const dy = Math.abs(my - diamondHeight / 2) / (diamondHeight / 2)
                if (dx + dy > 0.88) continue
                const mr = 4 + mottleRand() * 11
                ctx.fillStyle = mottleRand() > 0.48
                    ? 'rgba(232,224,164,0.038)'
                    : 'rgba(50,76,43,0.035)'
                ctx.beginPath()
                ctx.ellipse(mx, my, mr * 1.5, mr * 0.62, mottleRand() * Math.PI, 0, Math.PI * 2)
                ctx.fill()
            }
            ctx.restore()
        }

        // PREMIUM: Grass patch variation — organic lighter/darker zones for depth
        ctx.save()
        ctx.beginPath()
        traceOrganicDiamond(ctx, topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY, organicRadius, organicWobble)
        ctx.clip()
        let patchState = 0xBEEF
        const patchRand = () => {
            patchState = (patchState * 9301 + 49297) % 233280
            return patchState / 233280
        }
        const patchCount = Math.floor(gridSize * gridSize * (cinematic ? 0.16 : 0.4))
        if (cinematic) ctx.filter = `blur(${Math.max(12, tileSize * 0.12)}px)`
        for (let i = 0; i < patchCount; i++) {
            const px = patchRand() * diamondWidth
            const py = patchRand() * diamondHeight
            const dx = Math.abs(px - svgWidth / 2) / (diamondWidth / 2)
            const dy = Math.abs(py - diamondHeight / 2) / (diamondHeight / 2)
            if (dx + dy > 0.85) continue
            const rx = (cinematic ? 34 : 15) + patchRand() * (cinematic ? 58 : 35)
            const ry = (cinematic ? 16 : 8) + patchRand() * (cinematic ? 24 : 18)
            const tone = patchRand()
            ctx.fillStyle = tone < 0.5
                ? `rgba(199,213,145,${(cinematic ? 0.065 : 0.08) + tone * 0.04})`
                : `rgba(78,103,66,${(cinematic ? 0.055 : 0.06) + (tone - 0.5) * 0.04})`
            ctx.beginPath()
            ctx.ellipse(px, py, rx, ry, patchRand() * Math.PI, 0, Math.PI * 2)
            ctx.fill()
        }
        ctx.filter = 'none'
        ctx.restore()

        // Cinematic focal zone: compressed earth grounds the active plant and
        // prevents the hero from feeling pasted onto a uniform lawn.
        if (cinematic && focalArea) {
            const focalX = svgWidth / 2 + (focalArea.col - focalArea.row) * tileSize / 2
            const focalY = (focalArea.col + focalArea.row) * tileSize / 4
                + tileSize / 4
                + (focalArea.size - 1) * tileSize / 4
            const focalRadius = tileSize * (0.42 + (focalArea.size - 1) * 0.22)
            ctx.save()
            ctx.beginPath()
            traceOrganicDiamond(ctx, topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY, organicRadius, organicWobble)
            ctx.clip()
            ctx.translate(focalX, focalY)
            ctx.scale(1, 0.46)
            const earth = ctx.createRadialGradient(0, 0, focalRadius * 0.08, 0, 0, focalRadius)
            earth.addColorStop(0, 'rgba(126,94,53,0.30)')
            earth.addColorStop(0.52, 'rgba(150,116,66,0.18)')
            earth.addColorStop(1, 'rgba(150,116,66,0)')
            ctx.fillStyle = earth
            ctx.beginPath()
            ctx.arc(0, 0, focalRadius, 0, Math.PI * 2)
            ctx.fill()
            ctx.restore()
        }

        // PREMIUM: one continuous organic rim instead of four ruler-straight bevels.
        ctx.save()
        ctx.lineWidth = cinematic ? 2.2 : 1.5
        ctx.strokeStyle = `rgba(251,245,230,${light.bevelHighlight * 0.72})`
        ctx.beginPath()
        traceOrganicDiamond(ctx, topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY, organicRadius, organicWobble)
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

        // Soil faces use vertical tonal falloff so the island reads as earth,
        // not a flat extruded board.
        const leftSoil = ctx.createLinearGradient(0, leftY, 0, leftY + tileHeight)
        leftSoil.addColorStop(0, cinematic ? '#8C6A4E' : dirtDarkColor)
        leftSoil.addColorStop(0.55, cinematic ? '#73533F' : dirtDarkColor)
        leftSoil.addColorStop(1, cinematic ? '#5F4436' : '#6F513F')
        ctx.fillStyle = leftSoil
        ctx.beginPath()
        ctx.moveTo(leftX + organicRadius * 1.12, leftY + organicRadius * 0.48)
        ctx.bezierCurveTo(
            leftX + (bottomX - leftX) * 0.36, leftY + (bottomY - leftY) * 0.36 + organicWobble,
            leftX + (bottomX - leftX) * 0.7, leftY + (bottomY - leftY) * 0.7 - organicWobble,
            bottomX, bottomY
        )
        ctx.lineTo(bottomX, bottomY + tileHeight)
        ctx.lineTo(leftX, leftY + tileHeight)
        ctx.quadraticCurveTo(leftX, leftY, leftX + organicRadius * 1.12, leftY + organicRadius * 0.48)
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

        // Tiny strata flecks break the large flat faces without turning the
        // soil into a noisy texture sheet.
        if (cinematic) {
            let faceState = 0x51DE
            const faceRand = () => {
                faceState = (faceState * 9301 + 49297) % 233280
                return faceState / 233280
            }
            ctx.save()
            ctx.lineCap = 'round'
            for (let i = 0; i < 28; i++) {
                const t = 0.04 + faceRand() * 0.92
                const depth = 0.18 + faceRand() * 0.68
                const onLeft = i % 2 === 0
                const startX = onLeft
                    ? leftX + (bottomX - leftX) * t
                    : bottomX + (rightX - bottomX) * t
                const startY = onLeft
                    ? leftY + (bottomY - leftY) * t + tileHeight * depth
                    : bottomY + (rightY - bottomY) * t + tileHeight * depth
                const length = 2 + faceRand() * 7
                ctx.strokeStyle = faceRand() > 0.5
                    ? 'rgba(246,220,174,0.11)'
                    : 'rgba(67,45,34,0.10)'
                ctx.lineWidth = 0.7 + faceRand() * 0.55
                ctx.beginPath()
                ctx.moveTo(startX, startY)
                ctx.lineTo(startX + (onLeft ? length : -length), startY + length * 0.12)
                ctx.stroke()
            }
            ctx.restore()
        }

        if (cinematic) {
            // A few tufts sit directly on the rear silhouette so the grass
            // plane meets the sky with a living edge instead of a clean cut.
            const rearStops = [0.1, 0.22, 0.39, 0.58, 0.73, 0.89]
            for (let i = 0; i < rearStops.length; i++) {
                const t = rearStops[i]
                const leftRearX = topX + (leftX - topX) * t
                const leftRearY = topY + (leftY - topY) * t
                const rightRearX = topX + (rightX - topX) * t
                const rightRearY = topY + (rightY - topY) * t
                drawGrass(ctx, leftRearX + (i % 2 ? 2 : -1), leftRearY + 1, 0.38 + (i % 3) * 0.08)
                if (i % 2 === 0) {
                    drawGrass(ctx, rightRearX + (i % 3 - 1) * 2, rightRearY + 1, 0.36 + (i % 2) * 0.1)
                }
            }
        }

        const rightSoil = ctx.createLinearGradient(0, rightY, 0, rightY + tileHeight)
        rightSoil.addColorStop(0, cinematic ? '#B89A72' : dirtColor)
        rightSoil.addColorStop(0.5, cinematic ? '#9A795B' : dirtColor)
        rightSoil.addColorStop(1, cinematic ? '#795C47' : dirtColor)
        ctx.fillStyle = rightSoil
        ctx.beginPath()
        ctx.moveTo(bottomX, bottomY)
        ctx.bezierCurveTo(
            bottomX + (rightX - bottomX) * 0.32, bottomY + (rightY - bottomY) * 0.32 + organicWobble,
            bottomX + (rightX - bottomX) * 0.68, bottomY + (rightY - bottomY) * 0.68 - organicWobble,
            rightX - organicRadius * 1.12, rightY + organicRadius * 0.48
        )
        ctx.quadraticCurveTo(rightX, rightY, rightX, rightY + tileHeight)
        ctx.lineTo(rightX, rightY + tileHeight)
        ctx.lineTo(bottomX, bottomY + tileHeight)
        ctx.closePath()
        ctx.fill()

        // Right face highlight — sun-facing, stronger warm cream
        ctx.fillStyle = '#D4C9B0'
        ctx.globalAlpha = light.dirtHighlight
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
        ctx.globalAlpha = cinematic ? 0.16 : 0.35
        ctx.setLineDash(cinematic ? [18, 12] : [8, 4])

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

        // Sparse grass overhang breaks the hard silhouette at the two front
        // edges while keeping the logical tile boundary untouched.
        if (cinematic) {
            ctx.save()
            ctx.lineCap = 'round'
            const fringeStops = [0.055, 0.12, 0.205, 0.31, 0.36, 0.515, 0.63, 0.715, 0.825, 0.93]
            for (let i = 0; i < fringeStops.length; i++) {
                const t = fringeStops[i]
                const leftEdgeX = leftX + (bottomX - leftX) * t
                const leftEdgeY = leftY + (bottomY - leftY) * t
                const rightEdgeX = bottomX + (rightX - bottomX) * t
                const rightEdgeY = bottomY + (rightY - bottomY) * t
                const length = 5.5 + (i % 4) * 1.8
                const bladeCount = i % 3 === 0 ? 3 : 2

                ctx.strokeStyle = i % 2 ? 'rgba(70,102,57,0.86)' : 'rgba(103,132,73,0.78)'
                ctx.lineWidth = i % 3 === 0 ? 1.8 : 1.35
                for (let blade = 0; blade < bladeCount; blade++) {
                    const spread = (blade - (bladeCount - 1) / 2) * 2
                    ctx.beginPath()
                    ctx.moveTo(leftEdgeX + spread, leftEdgeY - 1)
                    ctx.quadraticCurveTo(
                        leftEdgeX + spread * 1.4 - 1,
                        leftEdgeY + length * 0.42,
                        leftEdgeX + spread * 1.7 + (i % 2 ? 1 : -1),
                        leftEdgeY + length * (0.82 + blade * 0.12)
                    )
                    ctx.stroke()
                }

                if (i % 3 !== 1) {
                    ctx.beginPath()
                    ctx.moveTo(rightEdgeX, rightEdgeY - 1)
                    ctx.quadraticCurveTo(rightEdgeX + 2, rightEdgeY + length * 0.4, rightEdgeX + (i % 2 ? -2 : 2), rightEdgeY + length * 0.78)
                    ctx.stroke()
                }
            }
            ctx.restore()
        }

        // Global weather/night tint — overlay on top of grass surface only (not dirt)
        if (light.globalTint) {
            ctx.save()
            ctx.beginPath()
            traceOrganicDiamond(ctx, topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY, organicRadius, organicWobble)
            ctx.clip()
            ctx.fillStyle = light.globalTint
            ctx.fillRect(0, 0, svgWidth, diamondHeight)
            ctx.restore()
        }

        staticDrawnRef.current = true
    }, [gridSize, tileSize, grassColor, grassDarkColor, dirtColor, dirtDarkColor, grassDetails,
        svgWidth, svgHeight, diamondWidth, diamondHeight, tileHeight,
        topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY,
        weather, timeOfDay, cinematic, focalArea, organicRadius, organicWobble, grassTextureReady])

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

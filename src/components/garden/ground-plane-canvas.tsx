'use client'

import { useRef, useEffect, useMemo, useState, memo } from 'react'
import type { WeatherType } from '@/types/database'
import type { TimeOfDay } from './themes'
import {
    createLivingEmbankmentGeometry,
    getGroundPlaneHeight,
    type GroundPoint,
    type LivingEmbankmentFace,
} from './ground-plane-geometry'

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

const groundNoiseTextures = new Map<string, HTMLCanvasElement>()

/**
 * Reuse a small deterministic material tile instead of plotting thousands of
 * individual grains every time the garden changes size. The pattern remains
 * painterly after clipping, while resizing the ground becomes much cheaper.
 */
function getGroundNoiseTexture(cinematic: boolean): HTMLCanvasElement {
    const cacheKey = cinematic ? 'cinematic' : 'default'
    const cached = groundNoiseTextures.get(cacheKey)
    if (cached) return cached

    const texture = document.createElement('canvas')
    texture.width = 256
    texture.height = 128
    const ctx = texture.getContext('2d')
    if (!ctx) return texture

    let noiseState = cinematic ? 0xC0FFEE : 0xBADC0DE
    const noiseRand = () => {
        noiseState = (noiseState * 9301 + 49297) % 233280
        return noiseState / 233280
    }

    const grainCount = cinematic ? 760 : 560
    for (let i = 0; i < grainCount; i++) {
        const shade = noiseRand()
        ctx.fillStyle = shade < 0.5
            ? `rgba(251,245,230,${(cinematic ? 0.055 : 0.04) + shade * 0.055})`
            : `rgba(90,68,48,${(cinematic ? 0.038 : 0.026) + (shade - 0.5) * 0.055})`
        const grainSize = cinematic ? 1.35 : 1.1
        ctx.fillRect(noiseRand() * texture.width, noiseRand() * texture.height, grainSize, grainSize)
    }

    groundNoiseTextures.set(cacheKey, texture)
    return texture
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

function loadDecodedImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.decoding = 'async'
        image.onload = () => {
            void image.decode().catch(() => undefined).finally(() => resolve(image))
        }
        image.onerror = () => reject(new Error(`Failed to load garden material: ${src}`))
        image.src = src
    })
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

function appendQuadraticPolyline(ctx: CanvasRenderingContext2D, points: GroundPoint[]) {
    if (points.length < 2) return
    for (let index = 1; index < points.length - 1; index++) {
        const point = points[index]
        const next = points[index + 1]
        ctx.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2)
    }
    const penultimate = points[points.length - 2]
    const last = points[points.length - 1]
    ctx.quadraticCurveTo(penultimate.x, penultimate.y, last.x, last.y)
}

function appendOrganicBottomPolyline(ctx: CanvasRenderingContext2D, points: GroundPoint[], amplitude: number) {
    const curveProfile = [0.7, -0.18, 0.9, 0.12, 0.78, -0.12, 0.58, 0.22]
    for (let index = 1; index < points.length; index++) {
        const previous = points[index - 1]
        const point = points[index]
        const profile = curveProfile[index - 1] ?? 0
        ctx.quadraticCurveTo(
            (previous.x + point.x) / 2,
            (previous.y + point.y) / 2 + amplitude * profile,
            point.x,
            point.y
        )
    }
}

function traceLivingEmbankmentFace(ctx: CanvasRenderingContext2D, face: LivingEmbankmentFace) {
    ctx.moveTo(face.top[0].x, face.top[0].y)
    const cap = face.top[0]
    const shoulder = face.top[1]
    ctx.quadraticCurveTo(
        cap.x,
        (cap.y + shoulder.y) / 2,
        shoulder.x,
        shoulder.y
    )
    appendQuadraticPolyline(ctx, face.top.slice(1))
    const reversedBottom = [...face.bottom].reverse()
    ctx.lineTo(reversedBottom[0].x, reversedBottom[0].y)
    const bounds = getFaceBounds(face)
    appendOrganicBottomPolyline(ctx, reversedBottom, Math.min(18, bounds.height * 0.14))
    const outerTop = face.top[0]
    const outerBottom = face.bottom[0]
    const outwardSign = Math.sign(outerTop.x - outerBottom.x) || 1
    ctx.quadraticCurveTo(
        outerTop.x + outwardSign * Math.min(14, bounds.height * 0.1),
        (outerTop.y + outerBottom.y) / 2,
        outerTop.x,
        outerTop.y
    )
    ctx.closePath()
}

function getFaceBounds(face: LivingEmbankmentFace) {
    const points = [...face.top, ...face.bottom]
    const xs = points.map((point) => point.x)
    const ys = points.map((point) => point.y)
    const x = Math.min(...xs)
    const y = Math.min(...ys)
    return {
        x,
        y,
        width: Math.max(...xs) - x,
        height: Math.max(...ys) - y,
    }
}

function drawLivingEmbankmentFace(
    ctx: CanvasRenderingContext2D,
    face: LivingEmbankmentFace,
    baseGradient: CanvasGradient,
    texture: HTMLImageElement | null,
    lightOverlay: string
) {
    ctx.save()
    ctx.beginPath()
    traceLivingEmbankmentFace(ctx, face)
    ctx.fillStyle = baseGradient
    ctx.fill()

    if (texture) {
        const bounds = getFaceBounds(face)
        ctx.clip()
        ctx.globalAlpha = 0.88
        // Exactly one image sample per face. Geometry supplies the silhouette;
        // the decoded bitmap supplies strata, roots and embedded stones.
        ctx.drawImage(texture, bounds.x, bounds.y, bounds.width, bounds.height)
        ctx.globalAlpha = 1
        ctx.fillStyle = lightOverlay
        ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height)
    }
    ctx.restore()

    ctx.save()
    ctx.beginPath()
    const reversedBottom = [...face.bottom].reverse()
    ctx.moveTo(reversedBottom[0].x, reversedBottom[0].y)
    const bounds = getFaceBounds(face)
    appendOrganicBottomPolyline(ctx, reversedBottom, Math.min(18, bounds.height * 0.14))
    ctx.strokeStyle = 'rgba(55, 38, 29, 0.28)'
    ctx.lineWidth = 1.3
    ctx.stroke()
    ctx.restore()
}

function drawLivingEdgeSegments(
    ctx: CanvasRenderingContext2D,
    texture: HTMLImageElement,
    points: GroundPoint[],
    tileSize: number,
    sourceOffset: number
) {
    const sourceWidth = texture.naturalWidth / 4
    const edgeHeight = Math.max(24, tileSize * 0.22)

    for (let segment = 0; segment < 4; segment++) {
        const start = points[segment * 2]
        const end = points[(segment + 1) * 2]
        const dx = end.x - start.x
        const dy = end.y - start.y
        const length = Math.hypot(dx, dy)
        const sourceIndex = (segment + sourceOffset) % 4

        ctx.save()
        ctx.translate(start.x, start.y)
        ctx.rotate(Math.atan2(dy, dx))
        ctx.drawImage(
            texture,
            sourceIndex * sourceWidth,
            0,
            sourceWidth,
            texture.naturalHeight,
            0,
            -tileSize * 0.055,
            length + 1,
            edgeHeight
        )
        ctx.restore()
    }
}

function drawLivingFrontSeamBlend(
    ctx: CanvasRenderingContext2D,
    top: GroundPoint,
    bottom: GroundPoint,
    tileSize: number
) {
    const seamGradient = ctx.createLinearGradient(
        top.x - tileSize * 0.045,
        0,
        top.x + tileSize * 0.045,
        0
    )
    seamGradient.addColorStop(0, 'rgba(66, 52, 42, 0.52)')
    seamGradient.addColorStop(0.48, 'rgba(105, 78, 56, 0.34)')
    seamGradient.addColorStop(1, 'rgba(133, 95, 62, 0.42)')

    ctx.save()
    ctx.strokeStyle = seamGradient
    ctx.lineWidth = Math.max(4, tileSize * 0.055)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(top.x, top.y + tileSize * 0.025)
    ctx.quadraticCurveTo(
        top.x - tileSize * 0.012,
        (top.y + bottom.y) / 2,
        bottom.x,
        bottom.y - tileSize * 0.025
    )
    ctx.stroke()
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
    weather = null,
    timeOfDay = 'day',
    cinematic = false,
    focalArea = null,
}: GroundPlaneCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null)
    const grassTextureRef = useRef<HTMLImageElement | null>(null)
    const soilFaceTextureRef = useRef<HTMLImageElement | null>(null)
    const soilEdgeTextureRef = useRef<HTMLImageElement | null>(null)
    const [materialRevision, setMaterialRevision] = useState(0)

    useEffect(() => {
        if (!cinematic) {
            grassTextureRef.current = null
            soilFaceTextureRef.current = null
            soilEdgeTextureRef.current = null
            return
        }

        let cancelled = false
        const sources = [
            '/garden/textures/sanctuary-grass.webp',
            '/garden/textures/sanctuary-soil-face.webp',
            '/garden/textures/sanctuary-soil-edge.webp',
        ]

        void Promise.allSettled(sources.map(loadDecodedImage)).then((results) => {
            if (cancelled) return
            grassTextureRef.current = results[0].status === 'fulfilled' ? results[0].value : null
            soilFaceTextureRef.current = results[1].status === 'fulfilled' ? results[1].value : null
            soilEdgeTextureRef.current = results[2].status === 'fulfilled' ? results[2].value : null
            // One revision after every material has either decoded or failed keeps
            // the expensive static pass to exactly one asset-ready redraw.
            setMaterialRevision((revision) => revision + 1)
        })

        return () => {
            cancelled = true
        }
    }, [cinematic])

    const embankmentGeometry = useMemo(
        () => cinematic ? createLivingEmbankmentGeometry(gridSize, tileSize) : null,
        [cinematic, gridSize, tileSize]
    )
    const tileHeight = cinematic
        ? embankmentGeometry?.frontDepth ?? tileSize * 0.82
        : tileSize * 0.35

    const diamondWidth = gridSize * tileSize
    const diamondHeight = gridSize * (tileSize / 2)
    const svgWidth = diamondWidth
    const svgHeight = cinematic
        ? getGroundPlaneHeight(gridSize, tileSize, true)
        : diamondHeight + tileHeight + 300

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
    const focalRow = focalArea?.row
    const focalCol = focalArea?.col
    const focalSize = focalArea?.size

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
        const shadowDepth = cinematic ? embankmentGeometry?.frontDepth ?? tileHeight : tileHeight
        const shadowRadiusY = cinematic
            ? Math.min(diamondHeight * 0.13, tileSize * 0.26)
            : diamondHeight * 0.13
        ctx.ellipse(
            bottomX,
            bottomY + shadowDepth + (cinematic ? tileSize * 0.08 : 20),
            diamondWidth * 0.42,
            shadowRadiusY,
            0,
            0,
            Math.PI * 2
        )
        ctx.fill()
        ctx.restore()

        // Sanctuary-only Living Embankment. Draw the earth mass before the
        // grass plane so the top reads as turf growing over soil, not a board
        // attached beneath it. Stats Garden keeps its legacy renderer below.
        if (cinematic && embankmentGeometry) {
            const leftSoil = ctx.createLinearGradient(
                0,
                embankmentGeometry.left.top[0].y,
                0,
                embankmentGeometry.frontBottom.y
            )
            leftSoil.addColorStop(0, '#745B43')
            leftSoil.addColorStop(0.52, '#604836')
            leftSoil.addColorStop(1, '#49362D')

            const rightSoil = ctx.createLinearGradient(
                0,
                embankmentGeometry.right.top[0].y,
                0,
                embankmentGeometry.frontBottom.y
            )
            rightSoil.addColorStop(0, '#9A7955')
            rightSoil.addColorStop(0.5, '#7E5E43')
            rightSoil.addColorStop(1, '#5B4133')

            drawLivingEmbankmentFace(
                ctx,
                embankmentGeometry.left,
                leftSoil,
                soilFaceTextureRef.current,
                'rgba(46, 61, 57, 0.18)'
            )
            drawLivingEmbankmentFace(
                ctx,
                embankmentGeometry.right,
                rightSoil,
                soilFaceTextureRef.current,
                `rgba(245, 207, 145, ${0.06 + light.dirtHighlight * 0.18})`
            )
            drawLivingFrontSeamBlend(
                ctx,
                embankmentGeometry.frontTop,
                embankmentGeometry.frontBottom,
                tileSize
            )
        }

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
        if (cinematic && grassTextureRef.current) {
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

        // PREMIUM: Subtle reusable noise texture for organic grass feel.
        ctx.save()
        ctx.beginPath()
        traceOrganicDiamond(ctx, topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY, organicRadius, organicWobble)
        ctx.clip()
        const noisePattern = ctx.createPattern(getGroundNoiseTexture(cinematic), 'repeat')
        if (noisePattern) {
            ctx.fillStyle = noisePattern
            ctx.fillRect(0, 0, diamondWidth, diamondHeight)
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
        if (!cinematic) {
        const leftSoil = ctx.createLinearGradient(0, leftY, 0, leftY + tileHeight)
        leftSoil.addColorStop(0, cinematic ? '#796249' : dirtDarkColor)
        leftSoil.addColorStop(0.55, cinematic ? '#684F3D' : dirtDarkColor)
        leftSoil.addColorStop(1, cinematic ? '#584235' : '#6F513F')
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

        if (!cinematic) {
        const rightSoil = ctx.createLinearGradient(0, rightY, 0, rightY + tileHeight)
        rightSoil.addColorStop(0, cinematic ? '#91785A' : dirtColor)
        rightSoil.addColorStop(0.5, cinematic ? '#7C614A' : dirtColor)
        rightSoil.addColorStop(1, cinematic ? '#654C3B' : dirtColor)
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

        // A restrained warm lift keeps both faces part of the same earth mass.
        ctx.fillStyle = '#B49A73'
        ctx.globalAlpha = light.dirtHighlight * (cinematic ? 0.38 : 1)
        ctx.beginPath()
        ctx.moveTo(bottomX, bottomY)
        ctx.lineTo(rightX, rightY)
        ctx.lineTo(rightX, rightY + tileHeight * 0.3)
        ctx.lineTo(bottomX, bottomY + tileHeight * 0.3)
        ctx.closePath()
        ctx.fill()
        ctx.globalAlpha = 1

        // Bottom edges (warm earth, softened)
        ctx.strokeStyle = 'rgba(82, 60, 44, 0.22)'
        ctx.lineWidth = cinematic ? 1.2 : 2
        ctx.beginPath()
        ctx.moveTo(leftX, leftY + tileHeight)
        ctx.lineTo(bottomX, bottomY + tileHeight)
        ctx.stroke()

        ctx.strokeStyle = 'rgba(82, 60, 44, 0.18)'
        ctx.beginPath()
        ctx.moveTo(bottomX, bottomY + tileHeight)
        ctx.lineTo(rightX, rightY + tileHeight)
        ctx.stroke()

        // Strata lines (warm earth tones)
        ctx.lineWidth = 1
        ctx.globalAlpha = cinematic ? 0.09 : 0.35
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
        }

        if (cinematic) {
            // One shared grass-to-earth seam visually welds the top plane to
            // both soil faces and replaces the previous bright "board" rim.
            ctx.save()
            const seam = ctx.createLinearGradient(0, bottomY - 2, 0, bottomY + 5)
            seam.addColorStop(0, 'rgba(78,103,61,0.62)')
            seam.addColorStop(0.5, 'rgba(104,105,65,0.42)')
            seam.addColorStop(1, 'rgba(113,83,59,0.18)')
            ctx.strokeStyle = seam
            ctx.lineWidth = Math.max(2.4, tileSize * 0.026)
            ctx.lineCap = 'round'
            ctx.beginPath()
            ctx.moveTo(leftX + organicRadius * 0.8, leftY + organicRadius * 0.35)
            ctx.bezierCurveTo(
                leftX + (bottomX - leftX) * 0.36, leftY + (bottomY - leftY) * 0.36 + organicWobble,
                leftX + (bottomX - leftX) * 0.7, leftY + (bottomY - leftY) * 0.7 - organicWobble,
                bottomX, bottomY
            )
            ctx.bezierCurveTo(
                bottomX + (rightX - bottomX) * 0.32, bottomY + (rightY - bottomY) * 0.32 + organicWobble,
                bottomX + (rightX - bottomX) * 0.68, bottomY + (rightY - bottomY) * 0.68 - organicWobble,
                rightX - organicRadius * 0.8, rightY + organicRadius * 0.35
            )
            ctx.stroke()
            ctx.restore()
        }

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

        if (cinematic && embankmentGeometry && soilEdgeTextureRef.current) {
            ctx.save()
            drawLivingEdgeSegments(
                ctx,
                soilEdgeTextureRef.current,
                embankmentGeometry.left.top,
                tileSize,
                0
            )
            drawLivingEdgeSegments(
                ctx,
                soilEdgeTextureRef.current,
                embankmentGeometry.right.top,
                tileSize,
                2
            )
            ctx.restore()
        }

        // Runtime weather/night tint covers the complete material stack. The
        // bitmap assets stay lighting-neutral and are never regenerated.
        if (light.globalTint) {
            ctx.save()
            ctx.beginPath()
            if (cinematic && embankmentGeometry) {
                traceLivingEmbankmentFace(ctx, embankmentGeometry.left)
                traceLivingEmbankmentFace(ctx, embankmentGeometry.right)
            }
            traceOrganicDiamond(ctx, topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY, organicRadius, organicWobble)
            ctx.clip()
            ctx.fillStyle = light.globalTint
            ctx.fillRect(0, 0, svgWidth, svgHeight)
            ctx.restore()
        }

    }, [gridSize, tileSize, grassColor, grassDarkColor, dirtColor, dirtDarkColor, grassDetails,
        svgWidth, svgHeight, diamondWidth, diamondHeight, tileHeight,
        topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY,
        weather, timeOfDay, cinematic, organicRadius, organicWobble,
        embankmentGeometry, materialRevision])

    // Main render effect - composites static canvas + dynamic overlays
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas || !offscreenCanvasRef.current) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.clearRect(0, 0, svgWidth, svgHeight)

        // Draw cached static content
        ctx.drawImage(offscreenCanvasRef.current, 0, 0)

        // Keep the focus marker out of the expensive static-ground pass. Focus
        // changes now composite one small gradient instead of rebuilding every
        // texture, noise grain, grass detail and blurred ground shape.
        if (cinematic && focalRow !== undefined && focalCol !== undefined && focalSize !== undefined) {
            const focalX = svgWidth / 2 + (focalCol - focalRow) * tileSize / 2
            const focalY = (focalCol + focalRow) * tileSize / 4
                + tileSize / 4
                + (focalSize - 1) * tileSize / 4
            const focalRadius = tileSize * (0.42 + (focalSize - 1) * 0.22)
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
        svgWidth, svgHeight, topX, topY, rightX, rightY, bottomX, bottomY, leftX, leftY,
        tileSize, cinematic, focalRow, focalCol, focalSize, organicRadius, organicWobble,
        materialRevision])

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

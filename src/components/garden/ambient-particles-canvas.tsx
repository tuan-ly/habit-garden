'use client'

import { useRef, useEffect, memo } from 'react'
import type { WeatherType } from '@/types/database'
import type { TimeOfDay } from './themes'

// Fix 2: Target 30fps instead of unlimited 60fps
const FRAME_INTERVAL = 1000 / 30

interface AmbientParticlesCanvasProps {
    weather?: WeatherType | null
    timeOfDay?: TimeOfDay
    width?: number
    height?: number
    className?: string
    cinematic?: boolean
}

type ParticleType = 'leaf' | 'pollen' | 'firefly' | 'sparkle' | 'butterfly'

interface Particle {
    type: ParticleType
    x: number
    y: number
    vx: number
    vy: number
    size: number
    opacity: number
    rotation: number
    rotationSpeed: number
    phase: number // for oscillation
    color: string
    lifespan: number
    maxLife: number
    // Butterfly-specific: heading angle for sinusoidal steering
    angle?: number
}

// Seeded random for deterministic generation
function seededRandom(seed: number): () => number {
    let s = seed
    return () => {
        s = (s * 9301 + 49297) % 233280
        return s / 233280
    }
}

function generateParticles(
    weather: WeatherType | null | undefined,
    timeOfDay: TimeOfDay,
    width: number,
    height: number,
    cinematic = false
): Particle[] {
    const particles: Particle[] = []
    const rand = seededRandom(12345)

    const leafColors = ['#8bc34a', '#689f38', '#ff9800', '#795548']
    const butterflyColors = ['#f8bbd0', '#ce93d8', '#81d4fa', '#ffe082']
    const sparkleColors = ['#ff5252', '#ffeb3b', '#4caf50', '#2196f3', '#e040fb']

    // Sunny day particles
    if (!cinematic && timeOfDay === 'day' && (weather === 'sunny' || weather === 'rainbow' || !weather)) {
        // Single butterfly — premium 4-wing model with organic wandering
        particles.push({
            type: 'butterfly',
            x: width * 0.3 + rand() * width * 0.4,
            y: height * 0.3 + rand() * height * 0.3,
            vx: 0,
            vy: 0,
            size: 18,
            opacity: 0.9,
            rotation: 0,
            rotationSpeed: 0,
            phase: rand() * Math.PI * 2,
            color: butterflyColors[Math.floor(rand() * butterflyColors.length)],
            lifespan: 0,
            maxLife: Infinity,
            angle: rand() * Math.PI * 2,
        })

        // Pollen (reduced from 5 to 4 particles)
        for (let i = 0; i < 4; i++) {
            particles.push({
                type: 'pollen',
                x: rand() * width,
                y: rand() * height,
                vx: (rand() - 0.5) * 0.3,
                vy: -0.2 - rand() * 0.2,
                size: 2 + rand() * 2,
                opacity: 0.5 + rand() * 0.3,
                rotation: 0,
                rotationSpeed: 0,
                phase: rand() * Math.PI * 2,
                color: '#ffeb3b',
                lifespan: 0,
                maxLife: Infinity,
            })
        }
    }

    // Sanctuary direction: a few intentional warm points around three focal
    // zones instead of particles scattered uniformly across the whole garden.
    if (cinematic && timeOfDay === 'day' && (weather === 'sunny' || weather === 'rainbow' || !weather)) {
        const zones = [
            { x: 0.5, y: 0.27, spreadX: 0.12, spreadY: 0.13, count: 5 },
            { x: 0.27, y: 0.52, spreadX: 0.09, spreadY: 0.10, count: 3 },
            { x: 0.69, y: 0.62, spreadX: 0.10, spreadY: 0.09, count: 3 },
        ]
        for (const zone of zones) {
            for (let i = 0; i < zone.count; i++) {
                particles.push({
                    type: 'firefly',
                    x: width * (zone.x + (rand() - 0.5) * zone.spreadX),
                    y: height * (zone.y + (rand() - 0.5) * zone.spreadY),
                    vx: (rand() - 0.5) * 0.16,
                    vy: (rand() - 0.5) * 0.12,
                    size: 2.1 + rand() * 1.5,
                    opacity: 0,
                    rotation: 0,
                    rotationSpeed: 0,
                    phase: rand() * Math.PI * 2,
                    color: '#f6df75',
                    lifespan: 0,
                    maxLife: Infinity,
                })
            }
        }
    }

    // Cloudy/rainy: falling leaves
    if (weather === 'cloudy' || weather === 'rainy') {
        for (let i = 0; i < 4; i++) {
            particles.push({
                type: 'leaf',
                x: rand() * width,
                y: -20 - rand() * 50,
                vx: (rand() - 0.5) * 0.5,
                vy: 0.8 + rand() * 0.5,
                size: 10 + rand() * 6,
                opacity: 0.7 + rand() * 0.2,
                rotation: rand() * 360,
                rotationSpeed: (rand() - 0.5) * 3,
                phase: rand() * Math.PI * 2,
                color: leafColors[Math.floor(rand() * leafColors.length)],
                lifespan: 0,
                maxLife: Infinity,
            })
        }
    }

    // Night: fireflies (reduced from 8 to 6)
    if (timeOfDay === 'night') {
        for (let i = 0; i < 6; i++) {
            particles.push({
                type: 'firefly',
                x: rand() * width,
                y: height * 0.2 + rand() * height * 0.6,
                vx: (rand() - 0.5) * 0.3,
                vy: (rand() - 0.5) * 0.3,
                size: 3 + rand() * 2,
                opacity: 0,
                rotation: 0,
                rotationSpeed: 0,
                phase: rand() * Math.PI * 2,
                color: '#ffeb3b',
                lifespan: 0,
                maxLife: Infinity,
            })
        }
    }

    // Rainbow: sparkles
    if (weather === 'rainbow') {
        for (let i = 0; i < 6; i++) {
            particles.push({
                type: 'sparkle',
                x: rand() * width,
                y: rand() * height * 0.7,
                vx: 0,
                vy: 0,
                size: 4 + rand() * 4,
                opacity: 0,
                rotation: rand() * 45,
                rotationSpeed: 2,
                phase: rand() * Math.PI * 2,
                color: sparkleColors[Math.floor(rand() * sparkleColors.length)],
                lifespan: 0,
                maxLife: 3, // twinkle cycle
            })
        }
    }

    return particles
}

// Fix 1: Pre-create cached gradient textures on an offscreen canvas.
// Each cache entry is keyed by particle type + size so we reuse across frames.
function createGradientCache(size: number): { pollen: HTMLCanvasElement; firefly: HTMLCanvasElement } {
    // Pollen gradient
    const pollenSize = size * 2
    const pollenCanvas = document.createElement('canvas')
    pollenCanvas.width = pollenSize * 2 + 2
    pollenCanvas.height = pollenSize * 2 + 2
    const pollenCtx = pollenCanvas.getContext('2d')!
    const pollenGrad = pollenCtx.createRadialGradient(
        pollenCanvas.width / 2, pollenCanvas.height / 2, 0,
        pollenCanvas.width / 2, pollenCanvas.height / 2, pollenSize
    )
    pollenGrad.addColorStop(0, 'rgba(255,235,59,0.8)')
    pollenGrad.addColorStop(1, 'transparent')
    pollenCtx.fillStyle = pollenGrad
    pollenCtx.beginPath()
    pollenCtx.arc(pollenCanvas.width / 2, pollenCanvas.height / 2, pollenSize, 0, Math.PI * 2)
    pollenCtx.fill()

    // Firefly gradient (glow radius = size * 4)
    const glowRadius = size * 4
    const fireflyCanvas = document.createElement('canvas')
    fireflyCanvas.width = glowRadius * 2 + 2
    fireflyCanvas.height = glowRadius * 2 + 2
    const fireflyCtx = fireflyCanvas.getContext('2d')!
    const cx = fireflyCanvas.width / 2
    const cy = fireflyCanvas.height / 2
    const fireflyGrad = fireflyCtx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius)
    fireflyGrad.addColorStop(0, 'rgba(255,235,59,1)')
    fireflyGrad.addColorStop(0.3, 'rgba(255,235,59,0.5)')
    fireflyGrad.addColorStop(1, 'transparent')
    fireflyCtx.fillStyle = fireflyGrad
    fireflyCtx.beginPath()
    fireflyCtx.arc(cx, cy, glowRadius, 0, Math.PI * 2)
    fireflyCtx.fill()
    // White core dot
    fireflyCtx.fillStyle = '#fff'
    fireflyCtx.beginPath()
    fireflyCtx.arc(cx, cy, size * 0.5, 0, Math.PI * 2)
    fireflyCtx.fill()

    return { pollen: pollenCanvas, firefly: fireflyCanvas }
}

// Cache map: key = rounded size string, value = offscreen canvases
const gradientCacheMap = new Map<string, { pollen: HTMLCanvasElement; firefly: HTMLCanvasElement }>()

function getGradientCache(size: number) {
    const key = size.toFixed(1)
    if (!gradientCacheMap.has(key)) {
        gradientCacheMap.set(key, createGradientCache(size))
    }
    return gradientCacheMap.get(key)!
}

function AmbientParticlesCanvasComponent({
    weather,
    timeOfDay = 'day',
    width = 800,
    height = 600,
    className,
    cinematic = false,
}: AmbientParticlesCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const rafRef = useRef<number>(0)
    const lastTimeRef = useRef<number>(0)
    // Fix 2: track last render time for 30fps throttle
    const lastRenderTimeRef = useRef<number>(0)

    // Initialize particles
    useEffect(() => {
        particlesRef.current = generateParticles(weather, timeOfDay, width, height, cinematic)
    }, [weather, timeOfDay, width, height, cinematic])

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Don't render during stormy weather
        if (weather === 'stormy') return

        const animate = (timestamp: number) => {
            // Fix 3: skip if tab not visible
            if (document.hidden) {
                rafRef.current = requestAnimationFrame(animate)
                return
            }

            // Fix 2: throttle to ~30fps
            if (timestamp - lastRenderTimeRef.current < FRAME_INTERVAL) {
                rafRef.current = requestAnimationFrame(animate)
                return
            }
            lastRenderTimeRef.current = timestamp

            if (!lastTimeRef.current) lastTimeRef.current = timestamp
            const delta = (timestamp - lastTimeRef.current) / 16.67 // normalize to ~60fps
            lastTimeRef.current = timestamp

            ctx.clearRect(0, 0, width, height)

            for (const p of particlesRef.current) {
                p.lifespan += delta * 0.016

                if (p.type === 'butterfly') {
                    // Sinusoidal wandering — multiple sine waves steer the heading
                    const t = p.lifespan
                    const ph = p.phase

                    // Steer angle with 3 incommensurate frequencies for non-repeating path
                    const steer =
                        Math.sin(t * 0.7 + ph) * 0.025 +
                        Math.sin(t * 1.3 + ph * 2.1) * 0.018 +
                        Math.sin(t * 0.3 + ph * 0.7) * 0.012
                    p.angle = (p.angle ?? 0) + steer * delta

                    // Vary speed with another sine (occasional slow-downs)
                    const speed = 0.35 + Math.sin(t * 0.5 + ph * 1.5) * 0.15

                    p.vx = Math.cos(p.angle) * speed
                    p.vy = Math.sin(p.angle) * speed

                    // Soft boundary repulsion — nudge angle toward center when near edges
                    const margin = 60
                    const cx = width / 2
                    const cy = height / 2
                    let repelX = 0
                    let repelY = 0
                    if (p.x < margin) repelX = (margin - p.x) / margin
                    else if (p.x > width - margin) repelX = -(p.x - (width - margin)) / margin
                    if (p.y < margin) repelY = (margin - p.y) / margin
                    else if (p.y > height - margin) repelY = -(p.y - (height - margin)) / margin

                    if (repelX !== 0 || repelY !== 0) {
                        const targetAngle = Math.atan2(cy - p.y + repelY * 100, cx - p.x + repelX * 100)
                        let angleDiff = targetAngle - p.angle
                        // Normalize to [-PI, PI]
                        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
                        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
                        p.angle += angleDiff * 0.03 * delta * Math.max(Math.abs(repelX), Math.abs(repelY))
                    }

                    p.x += p.vx * delta
                    p.y += p.vy * delta

                    // Hard clamp as safety net
                    p.x = Math.max(10, Math.min(width - 10, p.x))
                    p.y = Math.max(10, Math.min(height - 10, p.y))
                } else {
                    // Non-butterfly particles: simple linear motion + edge wrap
                    p.x += p.vx * delta
                    p.y += p.vy * delta
                    p.rotation += p.rotationSpeed * delta

                    if (p.x < -50) p.x = width + 50
                    if (p.x > width + 50) p.x = -50
                    if (p.y < -50) p.y = height + 50
                    if (p.y > height + 50) p.y = -50
                }

                // Draw based on type
                ctx.save()
                ctx.translate(p.x, p.y)

                switch (p.type) {
                    case 'pollen': {
                        // Oscillate position
                        const offsetY = Math.sin(p.lifespan * 2 + p.phase) * 3
                        ctx.globalAlpha = p.opacity * (0.5 + 0.5 * Math.sin(p.lifespan * 3 + p.phase))
                        // Fix 1: draw from cached gradient canvas instead of createRadialGradient
                        const pollenCache = getGradientCache(p.size)
                        const pw = pollenCache.pollen.width
                        const ph = pollenCache.pollen.height
                        ctx.drawImage(pollenCache.pollen, -pw / 2, offsetY - ph / 2)
                        break
                    }

                    case 'firefly': {
                        // Pulsing glow
                        const glowIntensity = Math.sin(p.lifespan * 4 + p.phase) * 0.5 + 0.5
                        p.opacity = glowIntensity * 0.9
                        ctx.globalAlpha = p.opacity
                        // Fix 1: draw from cached gradient canvas (includes glow + white core)
                        const fireflyCache = getGradientCache(p.size)
                        const fw = fireflyCache.firefly.width
                        const fh = fireflyCache.firefly.height
                        ctx.drawImage(fireflyCache.firefly, -fw / 2, -fh / 2)
                        break
                    }

                    case 'leaf': {
                        ctx.rotate((p.rotation * Math.PI) / 180)
                        ctx.globalAlpha = p.opacity
                        ctx.fillStyle = p.color

                        // Simple leaf shape
                        ctx.beginPath()
                        ctx.ellipse(0, 0, p.size * 0.4, p.size * 0.6, 0, 0, Math.PI * 2)
                        ctx.fill()

                        // Vein
                        ctx.strokeStyle = 'rgba(0,0,0,0.2)'
                        ctx.lineWidth = 0.5
                        ctx.beginPath()
                        ctx.moveTo(0, -p.size * 0.5)
                        ctx.lineTo(0, p.size * 0.5)
                        ctx.stroke()
                        break
                    }

                    case 'butterfly': {
                        // Premium butterfly: 4 wings (upper + lower), symmetric opposite-phase flap,
                        // gradient coloring, body + antennae, banking tilt with flight direction.
                        const floatY = Math.sin(p.lifespan * 2 + p.phase) * 8
                        // Upper wings flap faster; lowers lag slightly for realistic motion
                        const flapUpper = Math.sin(p.lifespan * 12 + p.phase)       // -1..1
                        const flapLower = Math.sin(p.lifespan * 12 + p.phase - 0.4) // -1..1
                        // Map flap (-1..1) → wing x-scale (0.25..1.0) — wings "close" when flapping
                        const upperScale = 0.25 + (flapUpper * 0.5 + 0.5) * 0.75
                        const lowerScale = 0.25 + (flapLower * 0.5 + 0.5) * 0.75

                        ctx.translate(0, floatY)
                        // Bank toward flight direction (vx is the horizontal velocity)
                        ctx.rotate(Math.atan2(p.vy, p.vx) * 0.15)
                        ctx.globalAlpha = p.opacity

                        const S = p.size // shorthand
                        // Derive lighter highlight color from base color for gradient
                        const baseColor = p.color
                        // Helper: draw a teardrop wing shape centered at origin, pointing outward along +x
                        // Caller applies scale/mirror via ctx transforms.
                        const drawWing = (
                            cx: number,
                            cy: number,
                            widthScale: number,
                            mirrorX: boolean,
                            wingW: number,
                            wingH: number,
                            highlight: string
                        ) => {
                            ctx.save()
                            ctx.translate(cx, cy)
                            ctx.scale(mirrorX ? -widthScale : widthScale, 1)
                            // Gradient: darker at body attachment → lighter at wingtip
                            const grad = ctx.createLinearGradient(0, 0, wingW, 0)
                            grad.addColorStop(0, baseColor)
                            grad.addColorStop(1, highlight)
                            ctx.fillStyle = grad
                            // Teardrop path: starts at body (origin), curves out to tip and back
                            ctx.beginPath()
                            ctx.moveTo(0, 0)
                            ctx.bezierCurveTo(
                                wingW * 0.2, -wingH,
                                wingW * 0.95, -wingH * 0.6,
                                wingW, 0
                            )
                            ctx.bezierCurveTo(
                                wingW * 0.95, wingH * 0.6,
                                wingW * 0.2, wingH,
                                0, 0
                            )
                            ctx.closePath()
                            ctx.fill()
                            // Dark wing outline for definition
                            ctx.strokeStyle = 'rgba(0,0,0,0.25)'
                            ctx.lineWidth = 0.6
                            ctx.stroke()
                            // Wing spot (monarch-style dot near tip)
                            ctx.fillStyle = 'rgba(0,0,0,0.35)'
                            ctx.beginPath()
                            ctx.arc(wingW * 0.65, 0, wingH * 0.18, 0, Math.PI * 2)
                            ctx.fill()
                            ctx.restore()
                        }

                        // Upper wings: bigger, attached slightly above body center
                        const upperW = S * 1.0
                        const upperH = S * 0.7
                        const highlightUpper = '#ffffff'
                        drawWing(0, -S * 0.1, upperScale, false, upperW, upperH, highlightUpper) // right upper
                        drawWing(0, -S * 0.1, upperScale, true, upperW, upperH, highlightUpper)  // left upper

                        // Lower wings: smaller, attached below body center, lag phase
                        const lowerW = S * 0.7
                        const lowerH = S * 0.55
                        drawWing(0, S * 0.15, lowerScale, false, lowerW, lowerH, highlightUpper) // right lower
                        drawWing(0, S * 0.15, lowerScale, true, lowerW, lowerH, highlightUpper)  // left lower

                        // Body (dark, segmented ellipse)
                        ctx.fillStyle = '#2d2d2d'
                        ctx.beginPath()
                        ctx.ellipse(0, 0, S * 0.1, S * 0.42, 0, 0, Math.PI * 2)
                        ctx.fill()
                        // Body highlight for a touch of depth
                        ctx.fillStyle = 'rgba(255,255,255,0.25)'
                        ctx.beginPath()
                        ctx.ellipse(-S * 0.03, -S * 0.05, S * 0.04, S * 0.3, 0, 0, Math.PI * 2)
                        ctx.fill()

                        // Antennae: two thin curves from the head
                        ctx.strokeStyle = '#2d2d2d'
                        ctx.lineWidth = 0.8
                        ctx.lineCap = 'round'
                        ctx.beginPath()
                        ctx.moveTo(-S * 0.02, -S * 0.4)
                        ctx.quadraticCurveTo(-S * 0.15, -S * 0.6, -S * 0.22, -S * 0.7)
                        ctx.moveTo(S * 0.02, -S * 0.4)
                        ctx.quadraticCurveTo(S * 0.15, -S * 0.6, S * 0.22, -S * 0.7)
                        ctx.stroke()
                        // Antennae tips (small dots)
                        ctx.fillStyle = '#2d2d2d'
                        ctx.beginPath()
                        ctx.arc(-S * 0.22, -S * 0.7, S * 0.05, 0, Math.PI * 2)
                        ctx.arc(S * 0.22, -S * 0.7, S * 0.05, 0, Math.PI * 2)
                        ctx.fill()
                        break
                    }

                    case 'sparkle': {
                        const twinkle = Math.abs(Math.sin(p.lifespan * 3 + p.phase))
                        ctx.globalAlpha = twinkle * 0.9
                        ctx.rotate((p.rotation * Math.PI) / 180)
                        ctx.fillStyle = p.color

                        // 4-point star
                        ctx.beginPath()
                        for (let i = 0; i < 4; i++) {
                            const angle = (i * Math.PI) / 2
                            const outerR = p.size
                            const innerR = p.size * 0.3
                            ctx.lineTo(Math.cos(angle) * outerR, Math.sin(angle) * outerR)
                            ctx.lineTo(Math.cos(angle + Math.PI / 4) * innerR, Math.sin(angle + Math.PI / 4) * innerR)
                        }
                        ctx.closePath()
                        ctx.fill()
                        break
                    }
                }

                ctx.restore()
            }

            rafRef.current = requestAnimationFrame(animate)
        }

        rafRef.current = requestAnimationFrame(animate)

        // Fix 3: pause/resume on visibility change
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Reset timing so delta doesn't spike after a long hidden period
                lastTimeRef.current = 0
                lastRenderTimeRef.current = 0
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            cancelAnimationFrame(rafRef.current)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [weather, timeOfDay, width, height, cinematic])

    // Don't render during stormy
    if (weather === 'stormy') return null

    return (
        <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={`absolute inset-0 pointer-events-none z-15 ${className || ''}`}
            style={{ width: '100%', height: '100%' }}
        />
    )
}

export const AmbientParticlesCanvas = memo(AmbientParticlesCanvasComponent)

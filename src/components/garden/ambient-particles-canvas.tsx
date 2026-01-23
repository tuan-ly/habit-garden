'use client'

import { useRef, useEffect, memo } from 'react'
import type { WeatherType } from '@/types/database'
import type { TimeOfDay } from './themes'

interface AmbientParticlesCanvasProps {
    weather?: WeatherType | null
    timeOfDay?: TimeOfDay
    width?: number
    height?: number
    className?: string
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
    height: number
): Particle[] {
    const particles: Particle[] = []
    const rand = seededRandom(12345)

    const leafColors = ['#8bc34a', '#689f38', '#ff9800', '#795548']
    const butterflyColors = ['#f8bbd0', '#ce93d8', '#81d4fa', '#ffe082']
    const sparkleColors = ['#ff5252', '#ffeb3b', '#4caf50', '#2196f3', '#e040fb']

    // Sunny day particles
    if (timeOfDay === 'day' && (weather === 'sunny' || weather === 'rainbow' || !weather)) {
        // Single butterfly
        particles.push({
            type: 'butterfly',
            x: rand() * width,
            y: height * 0.2 + rand() * height * 0.4,
            vx: 0.3 + rand() * 0.4,
            vy: 0,
            size: 14,
            opacity: 0.85,
            rotation: 0,
            rotationSpeed: 0,
            phase: rand() * Math.PI * 2,
            color: butterflyColors[Math.floor(rand() * butterflyColors.length)],
            lifespan: 0,
            maxLife: Infinity,
        })

        // Pollen (5 particles)
        for (let i = 0; i < 5; i++) {
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

    // Night: fireflies
    if (timeOfDay === 'night') {
        for (let i = 0; i < 8; i++) {
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

function AmbientParticlesCanvasComponent({
    weather,
    timeOfDay = 'day',
    width = 800,
    height = 600,
    className,
}: AmbientParticlesCanvasProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const particlesRef = useRef<Particle[]>([])
    const rafRef = useRef<number>(0)
    const lastTimeRef = useRef<number>(0)

    // Initialize particles
    useEffect(() => {
        particlesRef.current = generateParticles(weather, timeOfDay, width, height)
    }, [weather, timeOfDay, width, height])

    // Animation loop
    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Don't render during stormy weather
        if (weather === 'stormy') return

        const animate = (timestamp: number) => {
            if (!lastTimeRef.current) lastTimeRef.current = timestamp
            const delta = (timestamp - lastTimeRef.current) / 16.67 // normalize to ~60fps
            lastTimeRef.current = timestamp

            ctx.clearRect(0, 0, width, height)

            for (const p of particlesRef.current) {
                p.lifespan += delta * 0.016

                // Update position
                p.x += p.vx * delta
                p.y += p.vy * delta
                p.rotation += p.rotationSpeed * delta

                // Wrap around edges
                if (p.x < -50) p.x = width + 50
                if (p.x > width + 50) p.x = -50
                if (p.y < -50) p.y = height + 50
                if (p.y > height + 50) p.y = -50

                // Draw based on type
                ctx.save()
                ctx.translate(p.x, p.y)

                switch (p.type) {
                    case 'pollen': {
                        // Oscillate position
                        const offsetY = Math.sin(p.lifespan * 2 + p.phase) * 3
                        ctx.globalAlpha = p.opacity * (0.5 + 0.5 * Math.sin(p.lifespan * 3 + p.phase))
                        const gradient = ctx.createRadialGradient(0, offsetY, 0, 0, offsetY, p.size * 2)
                        gradient.addColorStop(0, 'rgba(255,235,59,0.8)')
                        gradient.addColorStop(1, 'transparent')
                        ctx.fillStyle = gradient
                        ctx.beginPath()
                        ctx.arc(0, offsetY, p.size * 2, 0, Math.PI * 2)
                        ctx.fill()
                        break
                    }

                    case 'firefly': {
                        // Pulsing glow
                        const glowIntensity = Math.sin(p.lifespan * 4 + p.phase) * 0.5 + 0.5
                        p.opacity = glowIntensity * 0.9
                        ctx.globalAlpha = p.opacity

                        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 4)
                        gradient.addColorStop(0, 'rgba(255,235,59,1)')
                        gradient.addColorStop(0.3, 'rgba(255,235,59,0.5)')
                        gradient.addColorStop(1, 'transparent')
                        ctx.fillStyle = gradient
                        ctx.beginPath()
                        ctx.arc(0, 0, p.size * 4, 0, Math.PI * 2)
                        ctx.fill()

                        // Core
                        ctx.fillStyle = '#fff'
                        ctx.beginPath()
                        ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2)
                        ctx.fill()
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
                        // Floating motion
                        const floatY = Math.sin(p.lifespan * 2 + p.phase) * 8
                        const wingFlap = Math.sin(p.lifespan * 15) * 0.3 + 0.7

                        ctx.translate(0, floatY)
                        ctx.globalAlpha = p.opacity

                        // Wings
                        ctx.fillStyle = p.color
                        ctx.beginPath()
                        ctx.ellipse(-p.size * 0.5, 0, p.size * 0.5 * wingFlap, p.size * 0.4, 0, 0, Math.PI * 2)
                        ctx.ellipse(p.size * 0.5, 0, p.size * 0.5 * wingFlap, p.size * 0.4, 0, 0, Math.PI * 2)
                        ctx.fill()

                        // Body
                        ctx.fillStyle = '#333'
                        ctx.beginPath()
                        ctx.ellipse(0, 0, p.size * 0.1, p.size * 0.3, 0, 0, Math.PI * 2)
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

        return () => {
            cancelAnimationFrame(rafRef.current)
        }
    }, [weather, timeOfDay, width, height])

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

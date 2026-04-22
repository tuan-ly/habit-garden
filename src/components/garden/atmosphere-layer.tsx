'use client'

/**
 * Atmosphere Layer (Phase 3)
 *
 * Adds depth & atmospheric effects on top of the garden:
 * - Soft radial vignette around the garden island (focal framing)
 * - Ambient dust/pollen particles drifting across the scene
 * - Weather-aware particle density and tint
 *
 * Gated by PREMIUM_GARDEN_ENABLED.
 */

import { useEffect, useMemo, useRef } from 'react'
import type { WeatherType } from '@/types/database'
import type { TimeOfDay } from './themes'
import { computeLightProfile } from './lighting'

interface AtmosphereLayerProps {
  width: number
  height: number
  weather?: WeatherType | null
  timeOfDay?: TimeOfDay
}

interface Mote {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  alpha: number
  phase: number
}

const PARTICLE_COUNT = 24

function initMotes(width: number, height: number): Mote[] {
  const motes: Mote[] = []
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    motes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -0.05 - Math.random() * 0.15,
      r: 0.8 + Math.random() * 2.2,
      alpha: 0.25 + Math.random() * 0.4,
      phase: Math.random() * Math.PI * 2,
    })
  }
  return motes
}

export function AtmosphereLayer({ width, height, weather, timeOfDay = 'day' }: AtmosphereLayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const motesRef = useRef<Mote[]>([])
  const rafRef = useRef<number | null>(null)

  const lightProfile = useMemo(
    () => computeLightProfile(weather, timeOfDay),
    [weather, timeOfDay]
  )

  // Motes more visible in sunny days (sunbeams pick them up), fewer at night
  const moteTint = useMemo(() => {
    if (timeOfDay === 'night') return '200, 215, 255'
    switch (weather) {
      case 'sunny':
        return '255, 240, 190'
      case 'rainbow':
        return '255, 230, 210'
      case 'rainy':
      case 'stormy':
        return '210, 220, 230'
      default:
        return '255, 245, 220'
    }
  }, [weather, timeOfDay])

  const moteDensity = useMemo(() => {
    if (timeOfDay === 'night') return 0.4
    if (weather === 'stormy' || weather === 'rainy') return 0.3
    if (weather === 'sunny' || weather === 'rainbow') return 1
    return 0.7
  }, [weather, timeOfDay])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    motesRef.current = initMotes(width, height)

    const tick = () => {
      ctx.clearRect(0, 0, width, height)

      const motes = motesRef.current
      const count = Math.floor(motes.length * moteDensity)
      for (let i = 0; i < count; i++) {
        const m = motes[i]
        m.x += m.vx
        m.y += m.vy
        m.phase += 0.02

        if (m.y < -10) {
          m.y = height + 10
          m.x = Math.random() * width
        }
        if (m.x < -10) m.x = width + 10
        if (m.x > width + 10) m.x = -10

        // Twinkle via phase
        const twinkle = 0.5 + Math.sin(m.phase) * 0.5
        const a = m.alpha * twinkle

        ctx.beginPath()
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${moteTint}, ${a.toFixed(3)})`
        ctx.fill()
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    tick()

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [width, height, moteTint, moteDensity])

  // Vignette intensity scales with shadow depth (stormy/night = stronger)
  const vignetteOpacity = useMemo(() => {
    if (timeOfDay === 'night') return 0.55
    if (weather === 'stormy') return 0.5
    if (weather === 'rainy') return 0.35
    if (weather === 'sunny' || weather === 'rainbow') return 0.2
    return 0.28
  }, [weather, timeOfDay])

  const vignetteColor = timeOfDay === 'night' ? 'rgba(10, 15, 30, %a)' : 'rgba(30, 20, 10, %a)'

  return (
    <>
      {/* Canvas-based dust motes */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0"
        style={{ width, height, zIndex: 6, mixBlendMode: timeOfDay === 'night' ? 'screen' : 'lighten' }}
        aria-hidden="true"
      />

      {/* Radial vignette — creates focal framing around garden */}
      <div
        className="pointer-events-none absolute inset-0 transition-opacity duration-1000"
        style={{
          zIndex: 7,
          background: `radial-gradient(ellipse at center, transparent 45%, ${vignetteColor.replace(
            '%a',
            String(vignetteOpacity)
          )} 110%)`,
        }}
        aria-hidden="true"
      />

      {/* Rim light glow on ground — subtle key-light kiss on top edge */}
      {timeOfDay === 'day' && weather !== 'stormy' && weather !== 'rainy' && (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 transition-opacity duration-1000"
          style={{
            zIndex: 7,
            height: height * 0.35,
            background: `linear-gradient(to bottom, ${lightProfile.rimLight} 0%, transparent 100%)`,
            opacity: 0.5,
          }}
          aria-hidden="true"
        />
      )}
    </>
  )
}

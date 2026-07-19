'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { WeatherType } from '@/types/database'

interface WeatherEffectsProps {
  weather: WeatherType
  className?: string
  /** If true, uses absolute positioning instead of fixed */
  contained?: boolean
  /** Value between 0 and 1 for breathing animation */
  breathingValue?: number
}

interface RainDrop {
  x: number
  y: number
  vy: number
  len: number
}

export function WeatherEffects({ weather, className, contained, breathingValue = 0 }: WeatherEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showLightning, setShowLightning] = useState(false)
  const breathingRef = useRef(breathingValue)
  useEffect(() => {
    breathingRef.current = breathingValue
  }, [breathingValue])

  // Canvas-driven rain (replaces per-drop DOM elements for perf)
  useEffect(() => {
    if (weather !== 'rainy' && weather !== 'stormy') return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    const resize = () => {
      const { width, height } = canvas.getBoundingClientRect()
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    const stormy = weather === 'stormy'
    const count = stormy ? 40 : 20
    const drops: RainDrop[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vy: (stormy ? 9 : 5) + Math.random() * 4,
      len: stormy ? 18 : 12,
    }))

    let rafId = 0
    const tick = () => {
      if (document.hidden) {
        rafId = 0
        return
      }
      const w = canvas.clientWidth
      const h = canvas.clientHeight
      ctx.clearRect(0, 0, w, h)
      const baseAlpha = stormy ? 0.6 : 0.5
      const alpha = breathingRef.current > 0
        ? 0.3 + breathingRef.current * 0.7
        : baseAlpha
      ctx.strokeStyle = stormy ? `rgba(148, 163, 184, ${alpha})` : `rgba(147, 197, 253, ${alpha})`
      ctx.lineWidth = 1
      ctx.beginPath()
      for (const d of drops) {
        ctx.moveTo(d.x, d.y)
        ctx.lineTo(d.x, d.y + d.len)
        d.y += d.vy
        if (d.y > h) {
          d.y = -d.len
          d.x = Math.random() * w
        }
      }
      ctx.stroke()
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)

    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId)
        rafId = 0
      } else if (!rafId) {
        rafId = requestAnimationFrame(tick)
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [weather])

  // Lightning flash schedule
  useEffect(() => {
    if (weather !== 'stormy') {
      return
    }

    let timeoutId: NodeJS.Timeout
    const scheduleNextFlash = () => {
      const nextInterval = 8000 + Math.random() * 17000
      timeoutId = setTimeout(() => {
        triggerFlash()
        scheduleNextFlash()
      }, nextInterval)
    }
    const triggerFlash = () => {
      setShowLightning(true)
      setTimeout(() => setShowLightning(false), 200 + Math.random() * 300)
      if (Math.random() > 0.7) {
        setTimeout(() => {
          setShowLightning(true)
          setTimeout(() => setShowLightning(false), 100)
        }, 400 + Math.random() * 300)
      }
    }
    scheduleNextFlash()
    return () => clearTimeout(timeoutId)
  }, [weather])

  if (weather !== 'rainy' && weather !== 'stormy') return null

  return (
    <div className={cn(
      contained ? 'absolute' : 'fixed',
      'inset-0 pointer-events-none z-20 overflow-hidden',
      '[contain:strict]',
      className
    )}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {weather === 'stormy' && (
        <div
          className={cn(
            'absolute inset-0 bg-white mix-blend-hard-light transition-opacity duration-100',
            showLightning ? 'opacity-30' : 'opacity-0'
          )}
        />
      )}
    </div>
  )
}

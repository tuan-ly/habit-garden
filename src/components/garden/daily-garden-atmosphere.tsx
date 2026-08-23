'use client'

import type { CSSProperties } from 'react'
import type { DailyGardenAtmosphere } from '@/lib/garden-encounters'

interface DailyGardenAtmosphereProps {
  atmosphere: DailyGardenAtmosphere | null
}

const atmosphereStyles: Record<DailyGardenAtmosphere['id'], CSSProperties> = {
  dew: {
    background: [
      'radial-gradient(circle at 24% 24%, rgba(222,247,231,0.3), transparent 30%)',
      'linear-gradient(180deg, rgba(221,242,235,0.08), rgba(120,164,141,0.12))',
    ].join(', '),
  },
  'honey-light': {
    background: [
      'radial-gradient(circle at 72% 15%, rgba(255,228,136,0.34), transparent 36%)',
      'linear-gradient(135deg, rgba(255,244,199,0.08), rgba(232,174,83,0.09))',
    ].join(', '),
  },
  'soft-mist': {
    background: [
      'radial-gradient(ellipse at 50% 52%, rgba(247,250,239,0.18), transparent 48%)',
      'linear-gradient(180deg, rgba(238,244,232,0.18), rgba(203,219,207,0.11))',
    ].join(', '),
  },
  'petal-air': {
    background: [
      'radial-gradient(circle at 18% 32%, rgba(250,219,204,0.2), transparent 28%)',
      'radial-gradient(circle at 82% 18%, rgba(255,239,195,0.2), transparent 32%)',
    ].join(', '),
  },
  'rain-scent': {
    background: [
      'linear-gradient(180deg, rgba(181,213,210,0.13), transparent 38%)',
      'radial-gradient(ellipse at 50% 88%, rgba(70,118,92,0.14), transparent 46%)',
    ].join(', '),
  },
  'quiet-sky': {
    background: [
      'linear-gradient(180deg, rgba(196,219,229,0.13), transparent 48%)',
      'radial-gradient(circle at 50% 8%, rgba(255,249,220,0.18), transparent 34%)',
    ].join(', '),
  },
}

export function DailyGardenAtmosphereLayer({ atmosphere }: DailyGardenAtmosphereProps) {
  if (!atmosphere) return null

  return (
    <div
      className="garden-atmosphere-breathe pointer-events-none absolute inset-0 z-[5]"
      style={atmosphereStyles[atmosphere.id]}
      data-atmosphere={atmosphere.id}
      aria-hidden="true"
    />
  )
}

/**
 * Garden Composition (Phase 6)
 *
 * Helpers for visual hierarchy and focal-point detection.
 * Used by renderers to apply subtle emphasis without changing layout.
 */

import type { PlantWithType } from '@/types/database'

/**
 * Detect the "hero" plant in the garden — the one that should visually
 * anchor the scene. Priority:
 *   1. Newest thriving plant (most recent user win)
 *   2. Newest mature plant (celebrate achievement)
 *   3. Largest grid-size plant (biggest visual weight anyway)
 *   4. Newest plant overall
 *   5. null (empty garden)
 */
export function detectFocalPlant(plants: PlantWithType[]): PlantWithType | null {
  if (plants.length === 0) return null

  const alive = plants.filter((p) => p.status !== 'dead')
  if (alive.length === 0) return null

  const byDateDesc = [...alive].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  const thriving = byDateDesc.find((p) => p.status === 'thriving')
  if (thriving) return thriving

  const mature = byDateDesc.find((p) => p.status === 'mature')
  if (mature) return mature

  const largest = [...alive].sort((a, b) => (b.grid_size || 1) - (a.grid_size || 1))[0]
  if ((largest.grid_size || 1) > 1) return largest

  return byDateDesc[0]
}

/**
 * Return a subtle focal emphasis class (or empty string) for a plant.
 * Uses a gentle ring + slightly-boosted scale — NOT a spotlight.
 */
export function getFocalEmphasisStyle(isFocal: boolean): {
  ringClass: string
  scaleNudge: number
} {
  if (!isFocal) return { ringClass: '', scaleNudge: 1 }
  return {
    ringClass: 'focal-plant-emphasis',
    scaleNudge: 1.03,
  }
}

/**
 * Compute rule-of-thirds anchor points for a grid of given size.
 * Useful for auto-arrange suggestions (not yet wired to UI — Phase 6 exports
 * the math so a future feature can call it).
 */
export interface ThirdsAnchor {
  row: number
  col: number
  /** Weighting for placement preference; higher = better. */
  weight: number
}

export function computeRuleOfThirdsAnchors(gridSize: number): ThirdsAnchor[] {
  const anchors: ThirdsAnchor[] = []
  const thirds = [
    Math.floor(gridSize / 3),
    Math.floor((2 * gridSize) / 3),
  ]
  for (const r of thirds) {
    for (const c of thirds) {
      // Intersection points are strongest focal points
      anchors.push({ row: r, col: c, weight: 1 })
    }
  }
  // Along thirds lines (weaker)
  for (const r of thirds) {
    for (let c = 0; c < gridSize; c++) {
      if (!thirds.includes(c)) anchors.push({ row: r, col: c, weight: 0.5 })
    }
  }
  for (const c of thirds) {
    for (let r = 0; r < gridSize; r++) {
      if (!thirds.includes(r)) anchors.push({ row: r, col: c, weight: 0.5 })
    }
  }
  return anchors
}

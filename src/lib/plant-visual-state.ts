/**
 * Plant Visual State (Phase 5)
 *
 * Centralized computation of visual cues per plant status — so that
 * a thriving plant, a resting plant, and a mature plant each READ
 * differently at a glance, without the user needing a label.
 *
 * Environmental storytelling: visuals should tell the story.
 */

import type { PlantStatus } from '@/types/database'

export interface PlantVisualState {
  /** Optional CSS filter overlay for the plant image. */
  filter: string | null
  /** Optional glow color for aura behind plant (rgba). */
  glowColor: string | null
  /** Opacity multiplier for the whole plant [0..1]. */
  opacity: number
  /** Extra particle density multiplier around plant (used by aura effects). */
  particleDensity: number
  /** Human-readable semantic label for a11y. */
  semantic: string
}

/**
 * Compute visual state from plant status + moisture/growth signals.
 *
 * Principle: each state must produce a VISUAL cue distinct from the others.
 * Not all cues are filters — some are glow, opacity, or particle density.
 */
export function computePlantVisualState(
  status: PlantStatus,
  moisture: number,
  growthPercentage: number
): PlantVisualState {
  switch (status) {
    case 'thriving':
      return {
        filter: 'saturate(1.15) brightness(1.06)',
        glowColor: 'rgba(134, 239, 172, 0.35)',
        opacity: 1,
        particleDensity: 1.4,
        semantic: 'Thriving — visibly vibrant',
      }

    case 'growing':
      // Healthy growing — moisture-aware subtle tweaks
      if (moisture < 30) {
        return {
          filter: 'saturate(0.88) brightness(0.97)',
          glowColor: null,
          opacity: 0.95,
          particleDensity: 0.6,
          semantic: 'Growing but thirsty',
        }
      }
      return {
        filter: null,
        glowColor: null,
        opacity: 1,
        particleDensity: 1,
        semantic: 'Growing',
      }

    case 'resting':
      return {
        filter: 'saturate(0.85) brightness(0.95)',
        glowColor: 'rgba(147, 197, 253, 0.2)',
        opacity: 0.92,
        particleDensity: 0.4,
        semantic: 'Resting',
      }

    case 'waiting':
      return {
        filter: 'saturate(0.82) brightness(0.94)',
        glowColor: null,
        opacity: 0.9,
        particleDensity: 0.3,
        semantic: 'Waiting',
      }

    case 'sleeping':
      return {
        filter: 'saturate(0.7) brightness(0.88) blur(0.2px)',
        glowColor: 'rgba(165, 180, 252, 0.18)',
        opacity: 0.85,
        particleDensity: 0.2,
        semantic: 'Sleeping',
      }

    case 'mature':
      return {
        filter: 'saturate(1.08) brightness(1.03) drop-shadow(0 0 6px rgba(251, 191, 36, 0.4))',
        glowColor: 'rgba(251, 191, 36, 0.4)',
        opacity: 1,
        particleDensity: 1.2,
        semantic: 'Mature — full bloom',
      }

    case 'dead':
      return {
        filter: 'grayscale(0.85) brightness(0.7) contrast(0.85)',
        glowColor: null,
        opacity: 0.75,
        particleDensity: 0,
        semantic: 'Dead',
      }

    case 'dormant':
      // Deprecated — treat as resting visually (see plants-status.md rule)
      return {
        filter: 'saturate(0.8) brightness(0.92)',
        glowColor: 'rgba(147, 197, 253, 0.15)',
        opacity: 0.9,
        particleDensity: 0.3,
        semantic: 'Dormant',
      }

    default:
      // Unknown status — return neutral
      // Suppress unused parameter warning for future growth-based branches
      void growthPercentage
      return {
        filter: null,
        glowColor: null,
        opacity: 1,
        particleDensity: 1,
        semantic: 'Plant',
      }
  }
}

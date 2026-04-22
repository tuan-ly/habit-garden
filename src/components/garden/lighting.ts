/**
 * Premium Garden Lighting & Shadow System (Phase 1)
 *
 * Centralized light direction, shadow geometry, and tint calculations so that
 * every plant, decoration, and tile shares the same visual language.
 *
 * Gated by NEXT_PUBLIC_PREMIUM_GARDEN (feature flag).
 */

import type { WeatherType } from '@/types/database'
import type { TimeOfDay } from './themes'

/** Feature flag gate — consumers should fall back to legacy rendering when false. */
export const PREMIUM_GARDEN_ENABLED =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_PREMIUM_GARDEN === 'true'

/** Angle in radians. 0 = +X, π/2 = +Y (down). Sun in UI is at top-right. */
export const SUN_ANGLE_RAD = Math.PI * 0.75 // ~135° → shadow falls toward bottom-left

/** Normalized shadow direction vector (on the 2D ground plane). */
export const SHADOW_DIR = {
  x: Math.cos(SUN_ANGLE_RAD), // ≈ -0.707
  y: Math.sin(SUN_ANGLE_RAD), // ≈  0.707
}

/** How far a shadow extends, as a fraction of the caster's visual height. */
export const SHADOW_LENGTH_FACTOR = 0.45

/** Base shadow opacity at full sunlight; weather modulates this. */
export const BASE_SHADOW_OPACITY = 0.32

export interface LightProfile {
  /** CSS filter string applied to the canvas layer for mood/tint. */
  canvasFilter: string
  /** Shadow opacity multiplier [0..1]. Overcast = softer/weaker shadows. */
  shadowOpacity: number
  /** Shadow blur radius in px. Diffuse lighting = softer shadows. */
  shadowBlur: number
  /** Rim light RGBA — subtle highlight on caster edge facing sun. */
  rimLight: string
  /** Ambient tint overlay colour for entire garden (transparent-ish). */
  ambientOverlay: string
  /** Warmth factor for rendering (higher = warmer palette). */
  warmth: number
}

/**
 * Compute the light profile for a given weather + time combination.
 * All downstream rendering should call this once and pass it around.
 */
export function computeLightProfile(
  weather: WeatherType | null | undefined,
  timeOfDay: TimeOfDay
): LightProfile {
  // Night baseline — cool, dim, low-contrast
  if (timeOfDay === 'night') {
    return {
      canvasFilter: 'brightness(0.75) saturate(0.85) hue-rotate(-5deg)',
      shadowOpacity: BASE_SHADOW_OPACITY * 0.6,
      shadowBlur: 10,
      rimLight: 'rgba(180, 200, 255, 0.25)',
      ambientOverlay: 'rgba(30, 41, 59, 0.18)',
      warmth: -0.3,
    }
  }

  // Day — per-weather modulation
  switch (weather) {
    case 'sunny':
      return {
        canvasFilter: 'brightness(1.05) saturate(1.12) contrast(1.04)',
        shadowOpacity: BASE_SHADOW_OPACITY * 1.15,
        shadowBlur: 5,
        rimLight: 'rgba(255, 230, 160, 0.4)',
        ambientOverlay: 'rgba(255, 236, 179, 0.08)',
        warmth: 0.4,
      }
    case 'cloudy':
      return {
        canvasFilter: 'brightness(0.95) saturate(0.88)',
        shadowOpacity: BASE_SHADOW_OPACITY * 0.55,
        shadowBlur: 14,
        rimLight: 'rgba(220, 225, 235, 0.18)',
        ambientOverlay: 'rgba(148, 163, 184, 0.1)',
        warmth: -0.15,
      }
    case 'rainy':
      return {
        canvasFilter: 'brightness(0.88) saturate(1.05) contrast(0.96)',
        shadowOpacity: BASE_SHADOW_OPACITY * 0.45,
        shadowBlur: 16,
        rimLight: 'rgba(200, 220, 240, 0.22)',
        ambientOverlay: 'rgba(71, 85, 105, 0.14)',
        warmth: -0.25,
      }
    case 'stormy':
      return {
        canvasFilter: 'brightness(0.78) saturate(0.9) contrast(1.08)',
        shadowOpacity: BASE_SHADOW_OPACITY * 0.35,
        shadowBlur: 20,
        rimLight: 'rgba(180, 200, 230, 0.18)',
        ambientOverlay: 'rgba(30, 41, 59, 0.22)',
        warmth: -0.4,
      }
    case 'rainbow':
      return {
        canvasFilter: 'brightness(1.08) saturate(1.2) contrast(1.02)',
        shadowOpacity: BASE_SHADOW_OPACITY * 0.9,
        shadowBlur: 8,
        rimLight: 'rgba(255, 240, 200, 0.45)',
        ambientOverlay: 'rgba(252, 211, 77, 0.06)',
        warmth: 0.35,
      }
    default:
      return {
        canvasFilter: 'none',
        shadowOpacity: BASE_SHADOW_OPACITY,
        shadowBlur: 8,
        rimLight: 'rgba(255, 235, 180, 0.3)',
        ambientOverlay: 'transparent',
        warmth: 0.1,
      }
  }
}

/**
 * Compute the CSS `box-shadow` / `filter: drop-shadow` string used by plants.
 * Returns a drop-shadow string because plants have transparent PNG edges.
 */
export function getPlantDropShadow(profile: LightProfile, scale = 1): string {
  const dx = SHADOW_DIR.x * 6 * scale
  const dy = SHADOW_DIR.y * 10 * scale
  const blur = profile.shadowBlur * scale
  const opacity = profile.shadowOpacity
  return `drop-shadow(${dx.toFixed(1)}px ${dy.toFixed(
    1
  )}px ${blur.toFixed(1)}px rgba(0, 0, 0, ${opacity.toFixed(2)}))`
}

/**
 * Ground contact shadow — tight, dark ellipse directly under a plant.
 * Returned as an SVG-friendly rgba + geometry hint.
 */
export interface ContactShadow {
  rx: number
  ry: number
  fill: string
  blur: number
}

export function getContactShadow(
  profile: LightProfile,
  plantScale: number
): ContactShadow {
  return {
    rx: 26 * plantScale,
    ry: 8 * plantScale,
    fill: `rgba(0, 0, 0, ${(profile.shadowOpacity * 1.4).toFixed(2)})`,
    blur: 3,
  }
}

/**
 * Distance-based atmospheric perspective.
 * Plants further from camera (smaller y in isometric space) fade slightly.
 * `depth` is normalized [0..1] where 0 = foreground, 1 = background.
 */
export function getAtmosphericFilter(depth: number): string {
  const d = Math.max(0, Math.min(1, depth))
  const saturation = 1 - d * 0.25
  const brightness = 1 - d * 0.04
  return `saturate(${saturation.toFixed(2)}) brightness(${brightness.toFixed(2)})`
}

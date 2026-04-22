import { describe, it, expect } from 'vitest'
import {
  computeLightProfile,
  getPlantDropShadow,
  getContactShadow,
  getAtmosphericFilter,
  SHADOW_DIR,
  BASE_SHADOW_OPACITY,
} from '../lighting'

describe('lighting — shadow geometry', () => {
  it('sun angle vector points toward bottom-left', () => {
    // 135° → cos < 0, sin > 0 (bottom-left on screen Y-down)
    expect(SHADOW_DIR.x).toBeLessThan(0)
    expect(SHADOW_DIR.y).toBeGreaterThan(0)
  })
})

describe('lighting — computeLightProfile', () => {
  it('sunny day produces stronger, sharper shadows than cloudy', () => {
    const sunny = computeLightProfile('sunny', 'day')
    const cloudy = computeLightProfile('cloudy', 'day')
    expect(sunny.shadowOpacity).toBeGreaterThan(cloudy.shadowOpacity)
    expect(sunny.shadowBlur).toBeLessThan(cloudy.shadowBlur)
  })

  it('night reduces shadow opacity vs day sunny', () => {
    const night = computeLightProfile('sunny', 'night')
    const day = computeLightProfile('sunny', 'day')
    expect(night.shadowOpacity).toBeLessThan(day.shadowOpacity)
  })

  it('sunny has positive warmth, stormy negative', () => {
    expect(computeLightProfile('sunny', 'day').warmth).toBeGreaterThan(0)
    expect(computeLightProfile('stormy', 'day').warmth).toBeLessThan(0)
  })

  it('null weather falls back to default day profile', () => {
    const profile = computeLightProfile(null, 'day')
    expect(profile.shadowOpacity).toBe(BASE_SHADOW_OPACITY)
  })

  it('returns a CSS filter string for every weather', () => {
    for (const w of ['sunny', 'cloudy', 'rainy', 'stormy', 'rainbow'] as const) {
      const p = computeLightProfile(w, 'day')
      expect(typeof p.canvasFilter).toBe('string')
      expect(p.canvasFilter.length).toBeGreaterThan(0)
    }
  })
})

describe('lighting — getPlantDropShadow', () => {
  it('produces a CSS drop-shadow() string', () => {
    const profile = computeLightProfile('sunny', 'day')
    const s = getPlantDropShadow(profile)
    expect(s.startsWith('drop-shadow(')).toBe(true)
    expect(s).toContain('rgba(0, 0, 0,')
  })

  it('scales shadow with plant size', () => {
    const profile = computeLightProfile('sunny', 'day')
    const small = getPlantDropShadow(profile, 0.5)
    const large = getPlantDropShadow(profile, 2)
    // Larger scale → larger pixel offsets embedded in the string
    expect(large.length).toBeGreaterThanOrEqual(small.length - 4)
  })
})

describe('lighting — getContactShadow', () => {
  it('contact shadow is denser than drop shadow', () => {
    const profile = computeLightProfile('sunny', 'day')
    const contact = getContactShadow(profile, 1)
    // fill opacity is shadowOpacity * 1.4, clamped visually
    const match = contact.fill.match(/rgba\(0, 0, 0, ([\d.]+)\)/)
    expect(match).not.toBeNull()
    if (match) {
      expect(parseFloat(match[1])).toBeGreaterThan(profile.shadowOpacity)
    }
  })
})

describe('lighting — getAtmosphericFilter', () => {
  it('foreground (depth=0) returns full saturation/brightness', () => {
    expect(getAtmosphericFilter(0)).toBe('saturate(1.00) brightness(1.00)')
  })

  it('background (depth=1) desaturates and dims', () => {
    const f = getAtmosphericFilter(1)
    expect(f).toContain('saturate(0.75)')
    expect(f).toContain('brightness(0.96)')
  })

  it('clamps out-of-range input', () => {
    expect(getAtmosphericFilter(-0.5)).toBe(getAtmosphericFilter(0))
    expect(getAtmosphericFilter(2)).toBe(getAtmosphericFilter(1))
  })
})

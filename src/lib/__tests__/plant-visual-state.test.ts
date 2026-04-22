import { describe, it, expect } from 'vitest'
import { computePlantVisualState } from '../plant-visual-state'

describe('plant-visual-state', () => {
  it('thriving plants get a green glow + boosted saturation', () => {
    const v = computePlantVisualState('thriving', 80, 60)
    expect(v.glowColor).toContain('rgba(134, 239, 172')
    expect(v.filter).toContain('saturate(1.15)')
    expect(v.particleDensity).toBeGreaterThan(1)
  })

  it('mature plants get golden drop-shadow', () => {
    const v = computePlantVisualState('mature', 70, 100)
    expect(v.filter).toContain('drop-shadow')
    expect(v.glowColor).toContain('251, 191, 36')
  })

  it('dead plants are grayscaled and dimmed', () => {
    const v = computePlantVisualState('dead', 0, 50)
    expect(v.filter).toContain('grayscale')
    expect(v.opacity).toBeLessThan(1)
    expect(v.particleDensity).toBe(0)
  })

  it('thirsty growing plants signal via desaturation', () => {
    const v = computePlantVisualState('growing', 20, 40)
    expect(v.filter).toContain('saturate(0.88)')
    expect(v.semantic).toContain('thirsty')
  })

  it('healthy growing plants have neutral visuals', () => {
    const v = computePlantVisualState('growing', 70, 40)
    expect(v.filter).toBeNull()
    expect(v.opacity).toBe(1)
  })

  it('every status produces a semantic label', () => {
    const statuses = ['thriving', 'growing', 'resting', 'waiting', 'sleeping', 'mature', 'dead', 'dormant'] as const
    for (const s of statuses) {
      const v = computePlantVisualState(s, 50, 50)
      expect(v.semantic.length).toBeGreaterThan(0)
    }
  })

  it('resting/waiting/sleeping form a desaturation gradient', () => {
    const r = computePlantVisualState('resting', 50, 50)
    const w = computePlantVisualState('waiting', 50, 50)
    const s = computePlantVisualState('sleeping', 50, 50)
    // sleeping should be most muted
    expect(s.opacity).toBeLessThan(w.opacity)
    expect(w.opacity).toBeLessThan(r.opacity)
  })
})

import { describe, it, expect } from 'vitest'
import { detectFocalPlant, computeRuleOfThirdsAnchors, getFocalEmphasisStyle } from '../garden-composition'
import type { PlantWithType } from '@/types/database'

function p(over: Partial<PlantWithType> & { id: string; created_at: string }): PlantWithType {
  return {
    id: over.id,
    user_id: 'u',
    plant_type_id: 't',
    name: 'P',
    status: over.status ?? 'growing',
    growth_percentage: over.growth_percentage ?? 50,
    current_moisture: over.current_moisture ?? 50,
    grid_row: 0,
    grid_col: 0,
    grid_size: over.grid_size ?? 1,
    weed_count: 0,
    growth_blocked: false,
    last_watered_at: null,
    created_at: over.created_at,
    updated_at: over.created_at,
    plant_type: { id: 't', name: 'cactus', emoji: '🌵', description: '', growth_modifier: 1, base_growth_rate: 1, base_decay_rate: 1, max_growth: 100 },
  } as unknown as PlantWithType
}

describe('garden-composition — detectFocalPlant', () => {
  it('returns null for empty garden', () => {
    expect(detectFocalPlant([])).toBeNull()
  })

  it('returns null when all plants are dead', () => {
    expect(detectFocalPlant([p({ id: '1', created_at: '2026-01-01', status: 'dead' })])).toBeNull()
  })

  it('prefers newest thriving plant', () => {
    const plants = [
      p({ id: 'old-thriving', created_at: '2026-01-01', status: 'thriving' }),
      p({ id: 'new-growing', created_at: '2026-04-01', status: 'growing' }),
      p({ id: 'new-thriving', created_at: '2026-03-01', status: 'thriving' }),
    ]
    expect(detectFocalPlant(plants)?.id).toBe('new-thriving')
  })

  it('falls back to mature when no thriving', () => {
    const plants = [
      p({ id: 'g', created_at: '2026-04-01', status: 'growing' }),
      p({ id: 'm', created_at: '2026-03-01', status: 'mature' }),
    ]
    expect(detectFocalPlant(plants)?.id).toBe('m')
  })

  it('falls back to largest grid plant', () => {
    const plants = [
      p({ id: 'small', created_at: '2026-04-01', status: 'growing', grid_size: 1 }),
      p({ id: 'big', created_at: '2026-01-01', status: 'growing', grid_size: 2 }),
    ]
    expect(detectFocalPlant(plants)?.id).toBe('big')
  })

  it('falls back to newest plant', () => {
    const plants = [
      p({ id: 'old', created_at: '2026-01-01', status: 'growing' }),
      p({ id: 'new', created_at: '2026-04-01', status: 'growing' }),
    ]
    expect(detectFocalPlant(plants)?.id).toBe('new')
  })
})

describe('garden-composition — computeRuleOfThirdsAnchors', () => {
  it('produces 4 strong intersection points for a 6x6 grid', () => {
    const anchors = computeRuleOfThirdsAnchors(6)
    const strong = anchors.filter((a) => a.weight === 1)
    expect(strong).toHaveLength(4)
  })
})

describe('garden-composition — getFocalEmphasisStyle', () => {
  it('returns no-op for non-focal', () => {
    expect(getFocalEmphasisStyle(false)).toEqual({ ringClass: '', scaleNudge: 1 })
  })
  it('returns emphasis for focal', () => {
    const s = getFocalEmphasisStyle(true)
    expect(s.ringClass).toBeTruthy()
    expect(s.scaleNudge).toBeGreaterThan(1)
  })
})

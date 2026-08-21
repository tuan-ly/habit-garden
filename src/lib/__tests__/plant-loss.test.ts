import { describe, expect, it } from 'vitest'
import { isPendingPlantDeath, isVisibleInGarden } from '../plant-status'

describe('Acknowledged Plant Loss', () => {
  it('keeps an unacknowledged dead plant visible in the garden', () => {
    const plant = { status: 'dead', death_acknowledged_at: null } as const

    expect(isPendingPlantDeath(plant)).toBe(true)
    expect(isVisibleInGarden(plant)).toBe(true)
  })

  it('treats a missing acknowledgement field as pending during migration rollout', () => {
    const plant = { status: 'dead' } as const

    expect(isPendingPlantDeath(plant)).toBe(true)
    expect(isVisibleInGarden(plant)).toBe(true)
  })

  it('removes an acknowledged dead plant from the interactive garden', () => {
    const plant = {
      status: 'dead',
      death_acknowledged_at: '2026-08-14T05:00:00.000Z',
    } as const

    expect(isPendingPlantDeath(plant)).toBe(false)
    expect(isVisibleInGarden(plant)).toBe(false)
  })

  it('keeps every non-dead lifecycle status visible', () => {
    expect(isVisibleInGarden({ status: 'sleeping', death_acknowledged_at: null })).toBe(true)
    expect(isVisibleInGarden({ status: 'mature', death_acknowledged_at: null })).toBe(true)
  })
})

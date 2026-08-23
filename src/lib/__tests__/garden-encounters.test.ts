import { describe, expect, it } from 'vitest'
import type { PlantWithType } from '@/types/database'
import {
  buildDailyGardenPlan,
  getGardenEncounterCopy,
  getLocalGardenDate,
} from '@/lib/garden-encounters'

const plantA = {
  id: 'plant-a',
  name: 'Đọc sách',
  plant_type: { id: 'oak' },
} as PlantWithType

const plantB = {
  id: 'plant-b',
  name: 'Đi bộ',
  plant_type: { id: 'fern' },
} as PlantWithType

describe('daily garden encounters', () => {
  it('keeps the same daily plan for the same garden regardless of plant order', () => {
    const first = buildDailyGardenPlan({
      date: '2026-08-23',
      plants: [plantA, plantB],
      weather: 'sunny',
    })
    const second = buildDailyGardenPlan({
      date: '2026-08-23',
      plants: [plantB, plantA],
      weather: 'sunny',
    })

    expect(second).toEqual(first)
  })

  it('uses all six atmospheres and eight encounters across a representative date window', () => {
    const atmospheres = new Set<string>()
    const encounters = new Set<string>()

    for (let day = 1; day <= 180; day += 1) {
      const date = new Date(2026, 0, day)
      const plan = buildDailyGardenPlan({
        date: getLocalGardenDate(date),
        plants: [plantA, plantB],
        weather: 'cloudy',
      })
      atmospheres.add(plan.atmosphere.id)
      encounters.add(plan.encounter.id)
    }

    expect(atmospheres.size).toBe(6)
    expect(encounters.size).toBe(8)
  })

  it('rewards intentional rest with gentle copy instead of failure language', () => {
    const plan = buildDailyGardenPlan({
      date: '2026-08-23',
      plants: [plantA],
      weather: 'rainy',
    })
    const copy = getGardenEncounterCopy(plan.encounter, plantA.name, 'rest')

    expect(copy.body).toContain('một ngày yên')
    expect(copy.body).not.toMatch(/thất bại|mất chuỗi|bỏ lỡ/i)
  })

  it('distinguishes a tiny action without turning it into a lesser reward', () => {
    const plan = buildDailyGardenPlan({
      date: '2026-08-24',
      plants: [plantA],
      weather: 'sunny',
    })
    const copy = getGardenEncounterCopy(plan.encounter, plantA.name, 'tiny')

    expect(copy.body).toContain('Hai phút nhỏ')
    expect(copy.title).toBe(plan.encounter.title)
  })
})

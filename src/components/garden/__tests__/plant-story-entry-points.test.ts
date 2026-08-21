import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const plantDetail = readFileSync(
  resolve('src/components/garden/sanctuary-plant-detail-sheet.tsx'),
  'utf8'
)
const overview = readFileSync(
  resolve('src/app/(dashboard)/overview/overview-client.tsx'),
  'utf8'
)

describe('plant story entry points', () => {
  it('opens the selected plant story from Plant Detail', () => {
    expect(plantDetail).toContain('href={`/overview/${plant.id}`}')
    expect(plantDetail).toContain('Xem câu chuyện của cây')
    expect(plantDetail).not.toContain('Xem toàn bộ hành trình')
  })

  it('opens a lifetime plant story from each global Journey row', () => {
    expect(overview).toContain('href={`/overview/${plant.plant_id}`}')
    expect(overview).not.toContain('StatsDetailSheet')
    expect(overview).not.toContain('openPlant(plant)')
    expect(overview).not.toContain('selectedPlant')
  })
})

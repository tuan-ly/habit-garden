import { describe, expect, it } from 'vitest'
import type { PlantWithType } from '@/types/database'
import { selectSanctuaryActivePlant } from '../sanctuary-plant-selection'

function plant(id: string, moisture: number): PlantWithType {
  return {
    id,
    current_moisture: moisture,
  } as PlantWithType
}

describe('selectSanctuaryActivePlant', () => {
  it('selects the driest plant that still needs care', () => {
    const plants = [plant('done', 5), plant('next', 20), plant('later', 60)]

    expect(selectSanctuaryActivePlant(plants, (item) => item.id === 'done')?.id).toBe('next')
  })

  it('returns null after every plant has been cared for', () => {
    const plants = [plant('one', 10), plant('two', 30)]

    expect(selectSanctuaryActivePlant(plants, () => true)).toBeNull()
  })
})

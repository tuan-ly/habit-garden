import type { PlantWithType } from '@/types/database'

export function selectSanctuaryActivePlant(
  plants: PlantWithType[],
  isCompleted: (plant: PlantWithType) => boolean
): PlantWithType | null {
  let nextPlant: PlantWithType | null = null

  for (const plant of plants) {
    if (isCompleted(plant)) continue
    if (!nextPlant || plant.current_moisture < nextPlant.current_moisture) {
      nextPlant = plant
    }
  }

  return nextPlant
}

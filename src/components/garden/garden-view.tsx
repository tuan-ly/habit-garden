'use client'

import { useState } from 'react'
import { PlantCard } from '@/components/plants/plant-card'
import { PlantDetailSheet } from '@/components/plants/plant-detail-sheet'
import { AddPlantDialog } from '@/components/plants/add-plant-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Flower2 } from 'lucide-react'
import type { PlantWithType, PlantType } from '@/types/database'

interface GardenViewProps {
  plants: PlantWithType[]
  plantTypes: PlantType[]
}

export function GardenView({ plants, plantTypes }: GardenViewProps) {
  const [selectedPlant, setSelectedPlant] = useState<PlantWithType | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handlePlantClick = (plant: PlantWithType) => {
    setSelectedPlant(plant)
    setSheetOpen(true)
  }

  const growingPlants = plants.filter((p) => p.status === 'growing')
  const maturePlants = plants.filter((p) => p.status === 'mature')
  const deadPlants = plants.filter((p) => p.status === 'dead')

  if (plants.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end">
          <AddPlantDialog plantTypes={plantTypes} />
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Flower2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your garden is empty</h3>
            <p className="text-muted-foreground text-center max-w-sm mb-4">
              Start your journey by planting your first habit. Each plant represents a habit you want to build.
            </p>
            <AddPlantDialog plantTypes={plantTypes} />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{growingPlants.length} growing</span>
          <span>{maturePlants.length} mature</span>
          {deadPlants.length > 0 && (
            <span className="text-red-500">{deadPlants.length} dead</span>
          )}
        </div>
        <AddPlantDialog plantTypes={plantTypes} />
      </div>

      {/* Growing Plants */}
      {growingPlants.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">🌱</span>
            Growing ({growingPlants.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {growingPlants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onClick={() => handlePlantClick(plant)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Mature Plants */}
      {maturePlants.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="text-xl">🌳</span>
            Mature ({maturePlants.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {maturePlants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onClick={() => handlePlantClick(plant)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Dead Plants (Cemetery) */}
      {deadPlants.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
            <span className="text-xl">🪦</span>
            Cemetery ({deadPlants.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {deadPlants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                onClick={() => handlePlantClick(plant)}
              />
            ))}
          </div>
        </section>
      )}

      <PlantDetailSheet
        plant={selectedPlant}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}

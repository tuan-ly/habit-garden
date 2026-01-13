import { getPlants, getPlantTypes } from '@/lib/actions/plants'
import { GardenView } from '@/components/garden/garden-view'

export default async function GardenPage() {
  const [plants, plantTypes] = await Promise.all([
    getPlants(),
    getPlantTypes(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Garden</h1>
        <p className="text-muted-foreground">
          Your habits are growing here. Water them daily to help them flourish.
        </p>
      </div>

      <GardenView plants={plants} plantTypes={plantTypes} />
    </div>
  )
}

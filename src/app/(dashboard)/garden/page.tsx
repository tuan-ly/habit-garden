import { getGardenPlacedDecorations, getPlants } from '@/lib/actions/plants'
import { GardenView } from '@/components/garden/garden-view'
import { getTodayWeather } from '@/lib/weather-system'
import { PlantsProvider } from '@/lib/context/plants-context'
import { GardenSnapshotHydrator } from '@/components/garden/garden-snapshot-hydrator'

export default async function GardenPage() {
  // Only fetch plants here - plantTypes and profile come from DashboardDataContext
  const [plants, placedDecorations] = await Promise.all([
    getPlants(),
    getGardenPlacedDecorations(),
  ])
  const weather = getTodayWeather()

  return (
    <PlantsProvider initialPlants={plants}>
      <GardenSnapshotHydrator placedDecorations={placedDecorations} />
      <div className="h-full">
        <GardenView weather={weather.type} />
      </div>
    </PlantsProvider>
  )
}

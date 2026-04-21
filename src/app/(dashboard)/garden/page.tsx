import { getPlants } from '@/lib/actions/plants'
import { GardenView } from '@/components/garden/garden-view'
import { getTodayWeather } from '@/lib/weather-system'
import { PlantsProvider } from '@/lib/context/plants-context'

export default async function GardenPage() {
  // Only fetch plants here - plantTypes and profile come from DashboardDataContext
  const plants = await getPlants()
  const weather = getTodayWeather()

  return (
    <PlantsProvider initialPlants={plants}>
      <div className="h-full">
        <GardenView weather={weather.type} />
      </div>
    </PlantsProvider>
  )
}

import { getGardenPlacedDecorations, getPlants } from '@/lib/actions/plants'
import { GardenView } from '@/components/garden/garden-view'
import { getTodayWeather } from '@/lib/weather-system'
import { PlantsProvider } from '@/lib/context/plants-context'
import { GardenSnapshotHydrator } from '@/components/garden/garden-snapshot-hydrator'
import { getReadingJourneySnapshot } from '@/lib/actions/habit-sessions'
import { habitToVirtualPlant } from '@/lib/habit-plant-mapping'

export default async function GardenPage() {
  const [plants, placedDecorations, readingJourney] = await Promise.all([
    getPlants(),
    getGardenPlacedDecorations(),
    getReadingJourneySnapshot(),
  ])
  const weather = getTodayWeather()
  const readingSnapshot = readingJourney.success ? readingJourney.data : null
  const virtualPlants = readingSnapshot
    ? [habitToVirtualPlant(readingSnapshot.habit, readingSnapshot.growth)]
    : []

  return (
    <PlantsProvider initialPlants={plants} virtualPlants={virtualPlants}>
      <GardenSnapshotHydrator placedDecorations={placedDecorations} />
      <div className="h-full">
        <GardenView
          weather={weather.type}
          activeSession={readingSnapshot?.active_session ?? null}
        />
      </div>
    </PlantsProvider>
  )
}

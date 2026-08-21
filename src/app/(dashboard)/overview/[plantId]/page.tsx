import { notFound } from 'next/navigation'
import { PlantStoryView } from '@/components/journey/plant-story-view'
import { getPlantStory } from '@/lib/actions/plant-story'

interface PlantStoryPageProps {
  params: Promise<{ plantId: string }>
}

export default async function PlantStoryPage({ params }: PlantStoryPageProps) {
  const { plantId } = await params
  const story = await getPlantStory(plantId)

  if (!story) notFound()

  return <PlantStoryView story={story} />
}

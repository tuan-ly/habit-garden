import type { Meta, StoryObj } from '@storybook/react'
import { GardenEncounterReveal } from '../garden-encounter-reveal'
import type { DailyGardenEncounterMemory } from '../use-daily-garden-encounter'

const memory: DailyGardenEncounterMemory = {
  encounter: {
    id: 'small-rainbow',
    title: 'Một dải cầu vồng nằm lại trên lá',
    detail: 'Ánh sáng chỉ xuất hiện trong chốc lát, nhưng khu vườn đã kịp ghi nhớ.',
    icon: 'sun',
    rarity: 'uncommon',
  },
  copy: {
    title: 'Một dải cầu vồng nằm lại trên lá',
    body: 'Cây đọc sách có một ngày yên, và khu vườn vẫn tiếp tục sống. Ánh sáng chỉ xuất hiện trong chốc lát, nhưng khu vườn đã kịp ghi nhớ.',
    memoryLabel: 'Khoảnh khắc hôm nay · Một dải cầu vồng nằm lại trên lá',
  },
  plantId: 'plant-reading',
  plantName: 'Cây đọc sách',
  actionKind: 'rest',
  revealedAt: '2026-08-23T12:00:00.000Z',
}

const meta = {
  title: 'Garden/Garden Encounter Reveal',
  component: GardenEncounterReveal,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div
        className="relative min-h-screen overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: 'url(/garden/backgrounds/sanctuary-golden-hour.webp)' }}
      >
        <div className="absolute inset-0 bg-[#dbe8dc]/10" />
        <Story />
      </div>
    ),
  ],
  args: {
    memory,
    reducedMotion: false,
    onComplete: () => undefined,
  },
} satisfies Meta<typeof GardenEncounterReveal>

export default meta
type Story = StoryObj<typeof meta>

export const Animated: Story = {}

export const ReducedMotion: Story = {
  args: {
    reducedMotion: true,
  },
}

import type { Meta, StoryObj } from '@storybook/react'
import type { WeatherType } from '@/types/database'
import type { TimeOfDay } from '../themes'
import { GroundPlaneCanvas } from '../ground-plane-canvas'
import { getGroundPlaneHeight } from '../ground-plane-geometry'

interface LivingEmbankmentFixtureProps {
  gridSize: number
  weather: WeatherType | null
  timeOfDay: TimeOfDay
  zoom: number
  panX: number
  panY: number
  showFocus: boolean
}

const TILE_SIZE = 140

function LivingEmbankmentFixture({
  gridSize,
  weather,
  timeOfDay,
  zoom,
  panX,
  panY,
  showFocus,
}: LivingEmbankmentFixtureProps) {
  const width = gridSize * TILE_SIZE
  const height = getGroundPlaneHeight(gridSize, TILE_SIZE, true)

  return (
    <main
      className="relative h-screen w-screen overflow-hidden bg-[#9aab87]"
      style={{
        backgroundImage: [
          'linear-gradient(rgba(87,105,72,0.08), rgba(55,68,48,0.28))',
          'url(/garden/backgrounds/sanctuary-golden-hour.webp)',
        ].join(', '),
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div
        className="absolute left-1/2 top-1/2 origin-center"
        style={{
          width,
          height,
          transform: `translate(calc(-50% + ${panX}px), calc(-50% + ${panY}px)) scale(${zoom})`,
        }}
      >
        <GroundPlaneCanvas
          gridSize={gridSize}
          tileSize={TILE_SIZE}
          cinematic
          weather={weather}
          timeOfDay={timeOfDay}
          showGridLines={false}
          focalArea={showFocus
            ? {
                row: Math.max(0, Math.floor(gridSize / 2) - 1),
                col: Math.max(0, Math.floor(gridSize / 2) - 1),
                size: 2,
              }
            : null}
        />
      </div>
    </main>
  )
}

const meta = {
  title: 'Garden/Living Embankment',
  component: LivingEmbankmentFixture,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      viewports: {
        desktopTarget: {
          name: 'Desktop 1405×424',
          styles: { width: '1405px', height: '424px' },
        },
        mobileTarget: {
          name: 'Mobile 390×844',
          styles: { width: '390px', height: '844px' },
        },
      },
    },
  },
  argTypes: {
    gridSize: { control: { type: 'select' }, options: [3, 5, 7, 11] },
    weather: { control: { type: 'select' }, options: [null, 'cloudy', 'rainy', 'stormy', 'rainbow'] },
    timeOfDay: { control: { type: 'radio' }, options: ['day', 'night'] },
    zoom: { control: { type: 'range', min: 0.35, max: 1.5, step: 0.05 } },
    panX: { control: { type: 'range', min: -400, max: 400, step: 10 } },
    panY: { control: { type: 'range', min: -300, max: 300, step: 10 } },
    showFocus: { control: 'boolean' },
  },
  args: {
    gridSize: 7,
    weather: null,
    timeOfDay: 'day',
    zoom: 1.35,
    panX: 0,
    panY: -100,
    showFocus: false,
  },
} satisfies Meta<typeof LivingEmbankmentFixture>

export default meta
type Story = StoryObj<typeof meta>

export const DesktopSunny: Story = {
  parameters: { viewport: { defaultViewport: 'desktopTarget' } },
}

export const MobileSunny: Story = {
  args: { gridSize: 3, zoom: 0.82, panY: 0 },
  parameters: { viewport: { defaultViewport: 'mobileTarget' } },
}

export const Cloudy: Story = {
  args: { weather: 'cloudy' },
  parameters: { viewport: { defaultViewport: 'desktopTarget' } },
}

export const Night: Story = {
  args: { timeOfDay: 'night' },
  parameters: { viewport: { defaultViewport: 'desktopTarget' } },
}

export const FocusAndPan: Story = {
  args: { gridSize: 5, zoom: 1.1, panX: 80, panY: -25, showFocus: true },
  parameters: { viewport: { defaultViewport: 'desktopTarget' } },
}

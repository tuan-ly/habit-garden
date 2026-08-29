import type { PlantWithType, WeatherType } from '@/types/database'

export type GardenActionKind = 'care' | 'tiny' | 'rest'

export type DailyGardenAtmosphereId =
  | 'dew'
  | 'honey-light'
  | 'soft-mist'
  | 'petal-air'
  | 'rain-scent'
  | 'quiet-sky'

export type GardenEncounterId =
  | 'silver-wing'
  | 'patient-snail'
  | 'sunlit-feather'
  | 'quiet-mushrooms'
  | 'wandering-fireflies'
  | 'hidden-bloom'
  | 'listening-leaves'
  | 'small-rainbow'

export interface DailyGardenAtmosphere {
  id: DailyGardenAtmosphereId
  label: string
  description: string
  icon: 'droplets' | 'sun' | 'cloud' | 'flower' | 'wind' | 'sparkles'
}

export interface GardenEncounter {
  id: GardenEncounterId
  title: string
  detail: string
  icon: 'sparkles' | 'snail' | 'feather' | 'flower' | 'moon' | 'leaf' | 'wind' | 'sun'
  rarity: 'common' | 'uncommon' | 'rare'
}

export interface DailyGardenPlan {
  date: string
  atmosphere: DailyGardenAtmosphere
  encounter: GardenEncounter
}

export interface GardenEncounterCopy {
  title: string
  body: string
  memoryLabel: string
}

const DAILY_ATMOSPHERES: readonly DailyGardenAtmosphere[] = [
  {
    id: 'dew',
    label: 'Sương còn đọng trên lá',
    description: 'Khu vườn bắt đầu ngày mới thật chậm.',
    icon: 'droplets',
  },
  {
    id: 'honey-light',
    label: 'Nắng mật ong xuyên qua tán',
    description: 'Một lớp sáng ấm đang ôm lấy khu vườn.',
    icon: 'sun',
  },
  {
    id: 'soft-mist',
    label: 'Một làn sương mỏng ghé qua',
    description: 'Mọi thứ hôm nay trông dịu và gần hơn.',
    icon: 'cloud',
  },
  {
    id: 'petal-air',
    label: 'Không khí mang theo mùi hoa',
    description: 'Khu vườn đang giữ một điều nhỏ chưa kể.',
    icon: 'flower',
  },
  {
    id: 'rain-scent',
    label: 'Đất vẫn còn thơm sau mưa',
    description: 'Một ngày yên cũng nuôi khu vườn lớn lên.',
    icon: 'wind',
  },
  {
    id: 'quiet-sky',
    label: 'Bầu trời hôm nay rất dịu',
    description: 'Không có gì cần vội trong khoảnh vườn này.',
    icon: 'sparkles',
  },
] as const

const GARDEN_ENCOUNTERS: readonly GardenEncounter[] = [
  {
    id: 'silver-wing',
    title: 'Một cánh bướm bạc vừa ghé lại',
    detail: 'Nó dừng bên tán lá như thể đã biết đường tới đây từ lâu.',
    icon: 'sparkles',
    rarity: 'uncommon',
  },
  {
    id: 'patient-snail',
    title: 'Một vị khách chậm rãi xuất hiện',
    detail: 'Chú ốc sên chọn con đường nhỏ cạnh gốc cây và không hề vội.',
    icon: 'snail',
    rarity: 'common',
  },
  {
    id: 'sunlit-feather',
    title: 'Khu vườn giữ lại một chiếc lông vũ',
    detail: 'Nó nằm trong vệt nắng, nhẹ đến mức chỉ người ghé thăm mới nhận ra.',
    icon: 'feather',
    rarity: 'uncommon',
  },
  {
    id: 'quiet-mushrooms',
    title: 'Một cụm nấm nhỏ mọc lên',
    detail: 'Đất đã âm thầm làm phần việc của mình trong những ngày thật yên.',
    icon: 'flower',
    rarity: 'common',
  },
  {
    id: 'wandering-fireflies',
    title: 'Đom đóm tìm thấy khu vườn',
    detail: 'Những đốm sáng nhỏ tụ lại rồi trôi quanh tán cây như một lời chào.',
    icon: 'moon',
    rarity: 'rare',
  },
  {
    id: 'hidden-bloom',
    title: 'Một nụ hoa kín đáo vừa hé',
    detail: 'Không phải thay đổi nào cũng cần lớn để trở thành điều đáng nhớ.',
    icon: 'leaf',
    rarity: 'rare',
  },
  {
    id: 'listening-leaves',
    title: 'Tán lá vừa rung lên như đang lắng nghe',
    detail: 'Một cơn gió nhỏ đi qua và để lại khu vườn sáng hơn một chút.',
    icon: 'wind',
    rarity: 'common',
  },
  {
    id: 'small-rainbow',
    title: 'Một dải cầu vồng nằm lại trên lá',
    detail: 'Ánh sáng chỉ xuất hiện trong chốc lát, nhưng khu vườn đã kịp ghi nhớ.',
    icon: 'sun',
    rarity: 'uncommon',
  },
] as const

function stableHash(value: string): number {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function selectStableItem<T>(items: readonly T[], seed: string): T {
  return items[stableHash(seed) % items.length]
}

export function getLocalGardenDate(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getGardenEncounterSignature(plants: PlantWithType[]): string {
  return plants
    .map((plant) => `${plant.id}:${plant.plant_type?.id ?? 'unknown'}`)
    .sort((left, right) => left.localeCompare(right))
    .join('|') || 'empty-garden'
}

export function buildDailyGardenPlan(input: {
  date: string
  plants: PlantWithType[]
  weather?: WeatherType | null
}): DailyGardenPlan {
  const signature = getGardenEncounterSignature(input.plants)
  const weather = input.weather ?? 'sunny'
  const baseSeed = `${input.date}|${signature}|${weather}`

  return {
    date: input.date,
    atmosphere: selectStableItem(DAILY_ATMOSPHERES, `${baseSeed}|atmosphere`),
    encounter: selectStableItem(GARDEN_ENCOUNTERS, `${baseSeed}|encounter`),
  }
}

export function getDailyGardenAtmosphere(id: DailyGardenAtmosphereId): DailyGardenAtmosphere | null {
  return DAILY_ATMOSPHERES.find((atmosphere) => atmosphere.id === id) ?? null
}

export function getGardenEncounter(id: GardenEncounterId): GardenEncounter | null {
  return GARDEN_ENCOUNTERS.find((encounter) => encounter.id === id) ?? null
}

export function getGardenEncounterCopy(
  encounter: GardenEncounter,
  plantName: string,
  actionKind: GardenActionKind
): GardenEncounterCopy {
  const actionCopy = actionKind === 'rest'
    ? `${plantName} có một ngày yên, và khu vườn vẫn tiếp tục sống.`
    : actionKind === 'tiny'
      ? `Hai phút nhỏ bên ${plantName} đã đủ để khu vườn chuyển động.`
      : `${plantName} vừa nhận ra bạn đã quay lại.`

  return {
    title: encounter.title,
    body: `${actionCopy} ${encounter.detail}`,
    memoryLabel: `Khoảnh khắc hôm nay · ${encounter.title}`,
  }
}

import type { ActivityType, PlantStatus, VisualStage } from '@/types/database'

export type PlantStoryActivityType = ActivityType | 'rest_day'

export interface PlantStoryPlant {
  id: string
  name: string
  habitDescription: string | null
  whyIStarted: string | null
  startedAt: string
  status: PlantStatus
  growthPercentage: number
  visualStage: VisualStage
  gridSize: number
  plantType: {
    id: string
    name: string
    nameVi: string
    icon: string
  }
}

export interface PlantStoryPlantOption {
  id: string
  name: string
  icon: string
  status: PlantStatus
}

export interface PlantStoryEntry {
  id: string
  plantId: string
  date: string
  occurredAt: string
  activityType: PlantStoryActivityType
  value: number | null
  note: string | null
  xpEarned: number
  isPersonalRecord: boolean
  title: string
  subtitle: string
}

export interface PlantStoryChapter {
  key: string
  title: string
  subtitle: string
  entryCount: number
  activeDayCount: number
  isCurrent: boolean
  entries: PlantStoryEntry[]
}

export interface PlantStorySnapshot {
  plant: PlantStoryPlant
  plantOptions: PlantStoryPlantOption[]
  totalEntryCount: number
  totalActiveDays: number
  currentMonth: PlantStoryChapter
  chapters: PlantStoryChapter[]
  recentEntries: PlantStoryEntry[]
}

export interface PlantStorySourceEntry {
  id: string
  plant_id: string
  activity_type: PlantStoryActivityType
  logged_at: string
  logged_date: string
  value: number | null
  notes: string | null
  xp_earned: number
  is_personal_record: boolean
}

interface BuildPlantStoryInput {
  plant: PlantStoryPlant
  plantOptions: PlantStoryPlantOption[]
  entries: PlantStorySourceEntry[]
  currentDate?: string
}

function getMonthKey(date: string): string {
  return date.slice(0, 7)
}

function getMonthOrdinal(key: string): number {
  const [year, month] = key.split('-').map(Number)
  return year * 12 + month
}

function formatVietnameseNumber(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 2,
  }).format(value)
}

function formatVietnameseDate(date: string): string {
  const [, month, day] = date.split('-').map(Number)
  return `Ngày ${day} tháng ${month}`
}

export function formatPlantStoryMonth(key: string): string {
  const [year, month] = key.split('-').map(Number)
  return `Tháng ${month} năm ${year}`
}

function getEntryTitle(entry: PlantStorySourceEntry): string {
  switch (entry.activity_type) {
    case 'watering':
      return 'Một lần chăm cây'
    case 'completed':
      return 'Đã hoàn thành'
    case 'progress':
      return entry.value === null
        ? 'Đã ghi nhận tiến trình'
        : `Ghi nhận ${formatVietnameseNumber(entry.value)}`
    case 'reflection':
      return 'Một điều muốn nhớ'
    case 'rest_day':
      return 'Một ngày nghỉ có chủ ý'
  }
}

function toPlantStoryEntry(entry: PlantStorySourceEntry): PlantStoryEntry {
  return {
    id: entry.id,
    plantId: entry.plant_id,
    date: entry.logged_date,
    occurredAt: entry.logged_at,
    activityType: entry.activity_type,
    value: entry.value,
    note: entry.notes?.trim() || null,
    xpEarned: entry.xp_earned,
    isPersonalRecord: entry.is_personal_record,
    title: getEntryTitle(entry),
    subtitle: formatVietnameseDate(entry.logged_date),
  }
}

function getChapterSubtitle(
  entries: PlantStoryEntry[],
  isCurrent: boolean,
  isFirstChapter: boolean,
  followsLongPause: boolean
): string {
  const entryCount = entries.length
  if (entryCount === 0) return 'Tháng này đang chờ khoảnh khắc đầu tiên'

  const countLabel = `${entryCount} khoảnh khắc`
  const activeDays = new Set(entries.map(entry => entry.date)).size
  const notes = entries.filter(entry => entry.note !== null).length

  if (isFirstChapter) return `${countLabel} · Những ngày đầu gieo hạt`
  if (followsLongPause) return `${countLabel} · Tìm lại nhịp sau một quãng nghỉ`
  if (activeDays >= 12) return `${countLabel} · Một tháng đều đặn bên cây`
  if (notes >= 3) return `${countLabel} · Nhiều điều đáng nhớ được ghi lại`
  if (isCurrent) return `${countLabel} trong tháng này`
  return `${countLabel} đã cùng cây`
}

function createEmptyCurrentChapter(currentMonthKey: string): PlantStoryChapter {
  return {
    key: currentMonthKey,
    title: formatPlantStoryMonth(currentMonthKey),
    subtitle: getChapterSubtitle([], true, false, false),
    entryCount: 0,
    activeDayCount: 0,
    isCurrent: true,
    entries: [],
  }
}

/**
 * Builds the UI read model without requiring authored notes. Month titles and
 * subtitles are deterministic so a date always maps to the same chapter.
 */
export function buildPlantStorySnapshot({
  plant,
  plantOptions,
  entries,
  currentDate = new Date().toISOString().slice(0, 10),
}: BuildPlantStoryInput): PlantStorySnapshot {
  const currentMonthKey = getMonthKey(currentDate)
  const sortedEntries = entries
    .map(toPlantStoryEntry)
    .sort((left, right) => {
      const timestampDifference = right.occurredAt.localeCompare(left.occurredAt)
      return timestampDifference || right.id.localeCompare(left.id)
    })

  const entriesByMonth = new Map<string, PlantStoryEntry[]>()
  for (const entry of sortedEntries) {
    const monthKey = getMonthKey(entry.date)
    const monthEntries = entriesByMonth.get(monthKey) ?? []
    monthEntries.push(entry)
    entriesByMonth.set(monthKey, monthEntries)
  }

  const chronologicalKeys = [...entriesByMonth.keys()].sort()
  const firstChapterKey = chronologicalKeys[0]
  const previousKeyByChapter = new Map<string, string | undefined>()
  chronologicalKeys.forEach((key, index) => {
    previousKeyByChapter.set(key, chronologicalKeys[index - 1])
  })

  const chapters = chronologicalKeys
    .map(key => {
      const chapterEntries = entriesByMonth.get(key) ?? []
      const previousKey = previousKeyByChapter.get(key)
      const followsLongPause = previousKey
        ? getMonthOrdinal(key) - getMonthOrdinal(previousKey) >= 2
        : false
      const isCurrent = key === currentMonthKey

      return {
        key,
        title: formatPlantStoryMonth(key),
        subtitle: getChapterSubtitle(
          chapterEntries,
          isCurrent,
          key === firstChapterKey,
          followsLongPause
        ),
        entryCount: chapterEntries.length,
        activeDayCount: new Set(chapterEntries.map(entry => entry.date)).size,
        isCurrent,
        entries: chapterEntries,
      } satisfies PlantStoryChapter
    })
    .sort((left, right) => right.key.localeCompare(left.key))

  const currentMonth = chapters.find(chapter => chapter.isCurrent)
    ?? createEmptyCurrentChapter(currentMonthKey)

  return {
    plant,
    plantOptions,
    totalEntryCount: sortedEntries.length,
    totalActiveDays: new Set(sortedEntries.map(entry => entry.date)).size,
    currentMonth,
    chapters,
    recentEntries: currentMonth.entries.slice(0, 2),
  }
}

import { describe, expect, it } from 'vitest'
import {
  buildPlantStorySnapshot,
  type PlantStoryPlant,
  type PlantStorySourceEntry,
} from '@/lib/plant-story'

const plant: PlantStoryPlant = {
  id: 'plant-1',
  name: 'Đọc mỗi ngày',
  habitDescription: 'Đọc sách trước khi ngủ',
  whyIStarted: null,
  startedAt: '2026-05-01T00:00:00.000Z',
  status: 'growing',
  growthPercentage: 42,
  visualStage: 'growing',
  gridSize: 1,
  plantType: {
    id: 'bamboo',
    name: 'Bamboo',
    nameVi: 'Tre',
    icon: '🎋',
  },
}

function entry(
  id: string,
  date: string,
  occurredAt: string,
  overrides: Partial<PlantStorySourceEntry> = {}
): PlantStorySourceEntry {
  return {
    id,
    plant_id: plant.id,
    activity_type: 'progress',
    logged_at: occurredAt,
    logged_date: date,
    value: 10,
    notes: null,
    xp_earned: 0,
    is_personal_record: false,
    ...overrides,
  }
}

describe('buildPlantStorySnapshot', () => {
  it('groups the complete stream into deterministic monthly chapters newest first', () => {
    const snapshot = buildPlantStorySnapshot({
      plant,
      plantOptions: [{ id: plant.id, name: plant.name, icon: '🎋', status: 'growing' }],
      currentDate: '2026-08-21',
      entries: [
        entry('aug-old', '2026-08-02', '2026-08-02T08:00:00.000Z'),
        entry('may', '2026-05-10', '2026-05-10T08:00:00.000Z'),
        entry('aug-tie-a', '2026-08-20', '2026-08-20T08:00:00.000Z'),
        entry('aug-tie-b', '2026-08-20', '2026-08-20T08:00:00.000Z'),
      ],
    })

    expect(snapshot.chapters.map(chapter => chapter.key)).toEqual(['2026-08', '2026-05'])
    expect(snapshot.currentMonth).toMatchObject({
      key: '2026-08',
      title: 'Tháng 8 năm 2026',
      entryCount: 3,
      activeDayCount: 2,
      isCurrent: true,
    })
    expect(snapshot.currentMonth.entries.map(item => item.id)).toEqual([
      'aug-tie-b',
      'aug-tie-a',
      'aug-old',
    ])
    expect(snapshot.recentEntries.map(item => item.id)).toEqual(['aug-tie-b', 'aug-tie-a'])
    expect(snapshot.totalEntryCount).toBe(4)
    expect(snapshot.totalActiveDays).toBe(3)
  })

  it('keeps notes optional and supplies useful Vietnamese copy from activity data alone', () => {
    const snapshot = buildPlantStorySnapshot({
      plant,
      plantOptions: [],
      currentDate: '2026-08-21',
      entries: [
        entry('first', '2026-05-10', '2026-05-10T08:00:00.000Z', {
          activity_type: 'watering',
          value: null,
        }),
        entry('return', '2026-08-20', '2026-08-20T08:00:00.000Z', {
          notes: '  ',
        }),
      ],
    })

    expect(snapshot.chapters[1].subtitle).toBe('1 khoảnh khắc · Những ngày đầu gieo hạt')
    expect(snapshot.currentMonth.subtitle).toBe('1 khoảnh khắc · Tìm lại nhịp sau một quãng nghỉ')
    expect(snapshot.currentMonth.entries[0]).toMatchObject({
      note: null,
      title: 'Ghi nhận 10',
      subtitle: 'Ngày 20 tháng 8',
    })
  })

  it('keeps intentional rest days in the story stream', () => {
    const snapshot = buildPlantStorySnapshot({
      plant,
      plantOptions: [],
      currentDate: '2026-08-21',
      entries: [
        entry('rest', '2026-08-19', '2026-08-19T08:00:00.000Z', {
          activity_type: 'rest_day',
          value: null,
        }),
      ],
    })

    expect(snapshot.currentMonth.entries[0]).toMatchObject({
      activityType: 'rest_day',
      title: 'Một ngày nghỉ có chủ ý',
      note: null,
    })
  })

  it('returns an empty current month without inventing an event or discarding older chapters', () => {
    const snapshot = buildPlantStorySnapshot({
      plant,
      plantOptions: [],
      currentDate: '2026-08-21',
      entries: [entry('july', '2026-07-31', '2026-07-31T08:00:00.000Z')],
    })

    expect(snapshot.currentMonth).toEqual({
      key: '2026-08',
      title: 'Tháng 8 năm 2026',
      subtitle: 'Tháng này đang chờ khoảnh khắc đầu tiên',
      entryCount: 0,
      activeDayCount: 0,
      isCurrent: true,
      entries: [],
    })
    expect(snapshot.recentEntries).toEqual([])
    expect(snapshot.chapters.map(chapter => chapter.key)).toEqual(['2026-07'])
  })
})

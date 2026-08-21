import type { Meta, StoryObj } from '@storybook/react'
import { PlantStoryView } from '../plant-story-view'
import type { PlantStoryChapter, PlantStoryEntry, PlantStorySnapshot } from '@/lib/plant-story'

function entry(
  id: string,
  date: string,
  activityType: PlantStoryEntry['activityType'],
  title: string,
  note: string | null = null,
  isPersonalRecord = false
): PlantStoryEntry {
  return {
    id,
    plantId: 'plant-running',
    date,
    occurredAt: `${date}T06:30:00.000Z`,
    activityType,
    value: activityType === 'progress' ? 5 : null,
    note,
    xpEarned: 0,
    isPersonalRecord,
    title,
    subtitle: `Ngày ${Number(date.slice(8, 10))} tháng ${Number(date.slice(5, 7))}`,
  }
}

function chapter(
  key: string,
  subtitle: string,
  entries: PlantStoryEntry[],
  isCurrent = false
): PlantStoryChapter {
  const [year, month] = key.split('-').map(Number)
  return {
    key,
    title: `Tháng ${month} năm ${year}`,
    subtitle,
    entryCount: entries.length,
    activeDayCount: new Set(entries.map((item) => item.date)).size,
    isCurrent,
    entries,
  }
}

const augustEntries = [
  entry('aug-21', '2026-08-21', 'completed', 'Đã hoàn thành', 'Buổi chạy sáng mát mẻ, cơ thể nhẹ nhàng hơn sau nhiều ngày bận rộn.'),
  entry('aug-18', '2026-08-18', 'reflection', 'Một điều muốn nhớ', 'Chậm lại một chút, lắng nghe nhịp thở và tận hưởng quãng đường quen.'),
  entry('aug-15', '2026-08-15', 'progress', 'Ghi nhận 5', 'Thêm năm phút chạy nhẹ trước khi bắt đầu ngày mới.'),
  entry('aug-12', '2026-08-12', 'completed', 'Đã hoàn thành'),
  entry('aug-09', '2026-08-09', 'watering', 'Một lần chăm cây'),
  entry('aug-07', '2026-08-07', 'progress', 'Ghi nhận 5'),
  entry('aug-04', '2026-08-04', 'completed', 'Đã hoàn thành', null, true),
  entry('aug-01', '2026-08-01', 'watering', 'Một lần chăm cây'),
]

const julyEntries = [
  entry('jul-28', '2026-07-28', 'completed', 'Đã hoàn thành', 'Mưa nhỏ nhưng vẫn ra ngoài được mười phút.'),
  entry('jul-24', '2026-07-24', 'watering', 'Một lần chăm cây'),
  entry('jul-20', '2026-07-20', 'progress', 'Ghi nhận 5'),
  entry('jul-17', '2026-07-17', 'reflection', 'Một điều muốn nhớ', 'Không cần nhanh, chỉ cần tiếp tục.'),
  entry('jul-14', '2026-07-14', 'completed', 'Đã hoàn thành'),
  entry('jul-11', '2026-07-11', 'watering', 'Một lần chăm cây'),
  entry('jul-09', '2026-07-09', 'progress', 'Ghi nhận 5'),
  entry('jul-07', '2026-07-07', 'completed', 'Đã hoàn thành'),
  entry('jul-05', '2026-07-05', 'watering', 'Một lần chăm cây'),
  entry('jul-03', '2026-07-03', 'completed', 'Đã hoàn thành'),
  entry('jul-02', '2026-07-02', 'progress', 'Ghi nhận 5'),
  entry('jul-01', '2026-07-01', 'watering', 'Một lần chăm cây'),
]

const juneEntries = [
  entry('jun-28', '2026-06-28', 'completed', 'Đã hoàn thành'),
  entry('jun-25', '2026-06-25', 'watering', 'Một lần chăm cây'),
  entry('jun-22', '2026-06-22', 'progress', 'Ghi nhận 5'),
  entry('jun-18', '2026-06-18', 'completed', 'Đã hoàn thành'),
  entry('jun-15', '2026-06-15', 'reflection', 'Một điều muốn nhớ', 'Nhịp nhỏ này bắt đầu trở nên tự nhiên hơn.'),
  entry('jun-12', '2026-06-12', 'watering', 'Một lần chăm cây'),
  entry('jun-09', '2026-06-09', 'completed', 'Đã hoàn thành'),
  entry('jun-07', '2026-06-07', 'progress', 'Ghi nhận 5'),
  entry('jun-04', '2026-06-04', 'completed', 'Đã hoàn thành'),
  entry('jun-01', '2026-06-01', 'watering', 'Một lần chăm cây'),
]

const mayEntries = [
  entry('may-30', '2026-05-30', 'reflection', 'Một điều muốn nhớ', 'Mình muốn chạy để có thêm năng lượng cho những ngày dài.'),
  entry('may-27', '2026-05-27', 'watering', 'Một lần chăm cây'),
  entry('may-24', '2026-05-24', 'completed', 'Đã hoàn thành'),
  entry('may-21', '2026-05-21', 'progress', 'Ghi nhận 5'),
  entry('may-18', '2026-05-18', 'completed', 'Đã hoàn thành'),
  entry('may-16', '2026-05-16', 'watering', 'Một lần chăm cây'),
  entry('may-14', '2026-05-14', 'completed', 'Đã hoàn thành'),
  entry('may-12', '2026-05-12', 'watering', 'Một lần chăm cây'),
]

const currentMonth = chapter(
  '2026-08',
  '8 khoảnh khắc · Tìm lại nhịp sau một quãng nghỉ',
  augustEntries,
  true
)
const july = chapter('2026-07', '12 khoảnh khắc · Bền bỉ qua những ngày mưa', julyEntries)
const june = chapter('2026-06', '10 khoảnh khắc · Giữ nhịp xanh', juneEntries)
const may = chapter('2026-05', '8 khoảnh khắc · Những ngày đầu gieo hạt', mayEntries)

const story: PlantStorySnapshot = {
  plant: {
    id: 'plant-running',
    name: 'Chạy bộ',
    habitDescription: 'Chạy nhẹ để bắt đầu ngày mới',
    whyIStarted: 'Muốn cơ thể khỏe và đầu óc nhẹ hơn.',
    startedAt: '2026-05-12T08:00:00.000Z',
    status: 'growing',
    growthPercentage: 68,
    visualStage: 'growing',
    gridSize: 2,
    plantType: {
      id: 'cactus',
      name: 'Cactus',
      nameVi: 'Xương rồng',
      icon: 'cactus',
    },
  },
  plantOptions: [
    { id: 'plant-running', name: 'Chạy bộ', icon: 'cactus', status: 'growing' },
    { id: 'plant-reading', name: 'Đọc sách', icon: 'bonsai', status: 'growing' },
    { id: 'plant-writing', name: 'Viết mỗi sáng', icon: 'bamboo', status: 'growing' },
  ],
  totalEntryCount: 38,
  totalActiveDays: 34,
  currentMonth,
  chapters: [currentMonth, july, june, may],
  recentEntries: augustEntries.slice(0, 2),
}

const meta = {
  title: 'Journey/Plant Story',
  component: PlantStoryView,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      viewports: {
        mobile390: {
          name: 'Mobile 390×844',
          styles: { width: '390px', height: '844px' },
        },
        desktop1280: {
          name: 'Desktop 1280×900',
          styles: { width: '1280px', height: '900px' },
        },
      },
    },
    nextjs: {
      appDirectory: true,
    },
  },
  args: { story },
  decorators: [
    (Story) => (
      <div className="h-screen w-screen">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlantStoryView>

export default meta
type Story = StoryObj<typeof meta>

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile390' } },
}

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop1280' } },
}

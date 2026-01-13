// Achievement System for Habit Garden

import type { Achievement, UserAchievement, PlantWithType, Profile } from '@/types/database'

// Achievement requirement types
export type AchievementRequirementType =
  | 'total_waterings'
  | 'total_plants'
  | 'mature_plants'
  | 'streak_days'
  | 'level_reached'
  | 'total_xp'
  | 'plants_in_category'
  | 'first_plant'
  | 'first_mature'
  | 'morning_waterings'
  | 'hard_day_waterings'
  | 'special_plants'
  | 'perfect_week'
  | 'comeback'

// Achievement definitions
export interface AchievementDefinition {
  id: string
  name: string
  nameVi: string
  description: string
  descriptionVi: string
  icon: string
  requirementType: AchievementRequirementType
  requirementValue: number
  requirementData?: Record<string, unknown>
  xpReward: number
  tier: 1 | 2 | 3 | 4
  isHidden: boolean
}

// All achievements in the game
export const ACHIEVEMENTS: AchievementDefinition[] = [
  // === First Steps ===
  {
    id: 'first_plant',
    name: 'First Seed',
    nameVi: 'Hạt giống đầu tiên',
    description: 'Plant your first habit',
    descriptionVi: 'Trồng thói quen đầu tiên',
    icon: '🌱',
    requirementType: 'first_plant',
    requirementValue: 1,
    xpReward: 25,
    tier: 1,
    isHidden: false,
  },
  {
    id: 'first_watering',
    name: 'First Drop',
    nameVi: 'Giọt nước đầu tiên',
    description: 'Water a plant for the first time',
    descriptionVi: 'Tưới cây lần đầu tiên',
    icon: '💧',
    requirementType: 'total_waterings',
    requirementValue: 1,
    xpReward: 25,
    tier: 1,
    isHidden: false,
  },
  {
    id: 'first_mature',
    name: 'First Bloom',
    nameVi: 'Bông hoa đầu tiên',
    description: 'Grow your first plant to maturity',
    descriptionVi: 'Nuôi cây đầu tiên đến trưởng thành',
    icon: '🌸',
    requirementType: 'first_mature',
    requirementValue: 1,
    xpReward: 100,
    tier: 2,
    isHidden: false,
  },

  // === Watering Milestones ===
  {
    id: 'watering_10',
    name: 'Getting Started',
    nameVi: 'Khởi đầu',
    description: 'Complete 10 waterings',
    descriptionVi: 'Hoàn thành 10 lần tưới',
    icon: '🚿',
    requirementType: 'total_waterings',
    requirementValue: 10,
    xpReward: 25,
    tier: 1,
    isHidden: false,
  },
  {
    id: 'watering_50',
    name: 'Dedicated Gardner',
    nameVi: 'Người làm vườn tận tâm',
    description: 'Complete 50 waterings',
    descriptionVi: 'Hoàn thành 50 lần tưới',
    icon: '🌊',
    requirementType: 'total_waterings',
    requirementValue: 50,
    xpReward: 50,
    tier: 2,
    isHidden: false,
  },
  {
    id: 'watering_100',
    name: 'Century Gardener',
    nameVi: 'Người làm vườn thế kỷ',
    description: 'Complete 100 waterings',
    descriptionVi: 'Hoàn thành 100 lần tưới',
    icon: '💯',
    requirementType: 'total_waterings',
    requirementValue: 100,
    xpReward: 100,
    tier: 3,
    isHidden: false,
  },
  {
    id: 'watering_365',
    name: 'Year-Round Gardner',
    nameVi: 'Người làm vườn quanh năm',
    description: 'Complete 365 waterings',
    descriptionVi: 'Hoàn thành 365 lần tưới',
    icon: '📅',
    requirementType: 'total_waterings',
    requirementValue: 365,
    xpReward: 200,
    tier: 4,
    isHidden: false,
  },

  // === Streak Achievements ===
  {
    id: 'streak_3',
    name: 'Three-Day Wonder',
    nameVi: 'Kỳ diệu 3 ngày',
    description: 'Maintain a 3-day streak',
    descriptionVi: 'Duy trì chuỗi 3 ngày',
    icon: '🔥',
    requirementType: 'streak_days',
    requirementValue: 3,
    xpReward: 25,
    tier: 1,
    isHidden: false,
  },
  {
    id: 'streak_7',
    name: 'Week Warrior',
    nameVi: 'Chiến binh tuần',
    description: 'Maintain a 7-day streak',
    descriptionVi: 'Duy trì chuỗi 7 ngày',
    icon: '🗓️',
    requirementType: 'streak_days',
    requirementValue: 7,
    xpReward: 50,
    tier: 2,
    isHidden: false,
  },
  {
    id: 'streak_14',
    name: 'Fortnight Fighter',
    nameVi: 'Chiến binh 2 tuần',
    description: 'Maintain a 14-day streak',
    descriptionVi: 'Duy trì chuỗi 14 ngày',
    icon: '⚡',
    requirementType: 'streak_days',
    requirementValue: 14,
    xpReward: 75,
    tier: 2,
    isHidden: false,
  },
  {
    id: 'streak_30',
    name: 'Monthly Master',
    nameVi: 'Bậc thầy tháng',
    description: 'Maintain a 30-day streak',
    descriptionVi: 'Duy trì chuỗi 30 ngày',
    icon: '🏆',
    requirementType: 'streak_days',
    requirementValue: 30,
    xpReward: 100,
    tier: 3,
    isHidden: false,
  },
  {
    id: 'streak_100',
    name: 'Century Streak',
    nameVi: 'Chuỗi 100',
    description: 'Maintain a 100-day streak',
    descriptionVi: 'Duy trì chuỗi 100 ngày',
    icon: '👑',
    requirementType: 'streak_days',
    requirementValue: 100,
    xpReward: 200,
    tier: 4,
    isHidden: false,
  },

  // === Plant Collection ===
  {
    id: 'plants_5',
    name: 'Small Garden',
    nameVi: 'Vườn nhỏ',
    description: 'Have 5 plants in your garden',
    descriptionVi: 'Có 5 cây trong vườn',
    icon: '🪴',
    requirementType: 'total_plants',
    requirementValue: 5,
    xpReward: 50,
    tier: 2,
    isHidden: false,
  },
  {
    id: 'plants_10',
    name: 'Growing Garden',
    nameVi: 'Vườn đang lớn',
    description: 'Have 10 plants in your garden',
    descriptionVi: 'Có 10 cây trong vườn',
    icon: '🌿',
    requirementType: 'total_plants',
    requirementValue: 10,
    xpReward: 100,
    tier: 3,
    isHidden: false,
  },
  {
    id: 'mature_5',
    name: 'Fruitful Garden',
    nameVi: 'Vườn sum suê',
    description: 'Have 5 mature plants',
    descriptionVi: 'Có 5 cây trưởng thành',
    icon: '🌳',
    requirementType: 'mature_plants',
    requirementValue: 5,
    xpReward: 100,
    tier: 3,
    isHidden: false,
  },
  {
    id: 'mature_10',
    name: 'Flourishing Forest',
    nameVi: 'Khu rừng hưng thịnh',
    description: 'Have 10 mature plants',
    descriptionVi: 'Có 10 cây trưởng thành',
    icon: '🌲',
    requirementType: 'mature_plants',
    requirementValue: 10,
    xpReward: 200,
    tier: 4,
    isHidden: false,
  },

  // === Level Achievements ===
  {
    id: 'level_5',
    name: 'Rising Gardner',
    nameVi: 'Người làm vườn đang lên',
    description: 'Reach level 5',
    descriptionVi: 'Đạt cấp độ 5',
    icon: '⭐',
    requirementType: 'level_reached',
    requirementValue: 5,
    xpReward: 50,
    tier: 2,
    isHidden: false,
  },
  {
    id: 'level_10',
    name: 'Expert Gardner',
    nameVi: 'Người làm vườn chuyên gia',
    description: 'Reach level 10',
    descriptionVi: 'Đạt cấp độ 10',
    icon: '🌟',
    requirementType: 'level_reached',
    requirementValue: 10,
    xpReward: 100,
    tier: 3,
    isHidden: false,
  },
  {
    id: 'level_15',
    name: 'Master Gardner',
    nameVi: 'Bậc thầy làm vườn',
    description: 'Reach level 15',
    descriptionVi: 'Đạt cấp độ 15',
    icon: '💎',
    requirementType: 'level_reached',
    requirementValue: 15,
    xpReward: 200,
    tier: 4,
    isHidden: false,
  },

  // === Special Achievements ===
  {
    id: 'early_bird',
    name: 'Early Bird',
    nameVi: 'Chim sớm',
    description: 'Water 10 plants before 9 AM',
    descriptionVi: 'Tưới 10 cây trước 9 giờ sáng',
    icon: '🌅',
    requirementType: 'morning_waterings',
    requirementValue: 10,
    xpReward: 50,
    tier: 2,
    isHidden: false,
  },
  {
    id: 'hard_worker',
    name: 'Hard Worker',
    nameVi: 'Người làm việc chăm chỉ',
    description: 'Complete 10 hard day waterings',
    descriptionVi: 'Hoàn thành 10 lần tưới ngày khó',
    icon: '💪',
    requirementType: 'hard_day_waterings',
    requirementValue: 10,
    xpReward: 75,
    tier: 2,
    isHidden: false,
  },
  {
    id: 'perfect_week',
    name: 'Perfect Week',
    nameVi: 'Tuần hoàn hảo',
    description: 'Water all plants every day for a week',
    descriptionVi: 'Tưới tất cả cây mỗi ngày trong một tuần',
    icon: '✨',
    requirementType: 'perfect_week',
    requirementValue: 1,
    xpReward: 100,
    tier: 3,
    isHidden: false,
  },
  {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    nameVi: 'Trở lại mạnh mẽ',
    description: 'Return after a week away and water a plant',
    descriptionVi: 'Quay lại sau một tuần và tưới cây',
    icon: '🔄',
    requirementType: 'comeback',
    requirementValue: 1,
    xpReward: 50,
    tier: 2,
    isHidden: true,
  },

  // === Special Plant Achievements ===
  {
    id: 'special_collector',
    name: 'Special Collector',
    nameVi: 'Nhà sưu tập đặc biệt',
    description: 'Grow 3 special plants',
    descriptionVi: 'Trồng 3 cây đặc biệt',
    icon: '🏅',
    requirementType: 'special_plants',
    requirementValue: 3,
    xpReward: 100,
    tier: 3,
    isHidden: false,
  },
]

// Get achievement by ID
export function getAchievement(id: string): AchievementDefinition | undefined {
  return ACHIEVEMENTS.find((a) => a.id === id)
}

// Get all visible achievements
export function getVisibleAchievements(): AchievementDefinition[] {
  return ACHIEVEMENTS.filter((a) => !a.isHidden)
}

// Get achievements by tier
export function getAchievementsByTier(tier: 1 | 2 | 3 | 4): AchievementDefinition[] {
  return ACHIEVEMENTS.filter((a) => a.tier === tier)
}

// Achievement progress tracking
export interface AchievementProgress {
  achievement: AchievementDefinition
  currentValue: number
  isComplete: boolean
  progress: number // 0-100
}

// Check progress for a single achievement
export function checkAchievementProgress(
  achievement: AchievementDefinition,
  stats: {
    totalWaterings: number
    totalPlants: number
    maturePlants: number
    bestStreak: number
    currentStreak: number
    level: number
    totalXp: number
    morningWaterings: number
    hardDayWaterings: number
    specialPlants: number
    perfectWeeks: number
    hasFirstPlant: boolean
    hasFirstMature: boolean
    isComeback: boolean
  }
): AchievementProgress {
  let currentValue = 0

  switch (achievement.requirementType) {
    case 'total_waterings':
      currentValue = stats.totalWaterings
      break
    case 'total_plants':
      currentValue = stats.totalPlants
      break
    case 'mature_plants':
      currentValue = stats.maturePlants
      break
    case 'streak_days':
      currentValue = Math.max(stats.bestStreak, stats.currentStreak)
      break
    case 'level_reached':
      currentValue = stats.level
      break
    case 'total_xp':
      currentValue = stats.totalXp
      break
    case 'first_plant':
      currentValue = stats.hasFirstPlant ? 1 : 0
      break
    case 'first_mature':
      currentValue = stats.hasFirstMature ? 1 : 0
      break
    case 'morning_waterings':
      currentValue = stats.morningWaterings
      break
    case 'hard_day_waterings':
      currentValue = stats.hardDayWaterings
      break
    case 'special_plants':
      currentValue = stats.specialPlants
      break
    case 'perfect_week':
      currentValue = stats.perfectWeeks
      break
    case 'comeback':
      currentValue = stats.isComeback ? 1 : 0
      break
    default:
      currentValue = 0
  }

  const isComplete = currentValue >= achievement.requirementValue
  const progress = Math.min(100, Math.round((currentValue / achievement.requirementValue) * 100))

  return {
    achievement,
    currentValue,
    isComplete,
    progress,
  }
}

// Check all achievements and return newly unlocked ones
export function checkAllAchievements(
  stats: Parameters<typeof checkAchievementProgress>[1],
  unlockedIds: string[]
): {
  progress: AchievementProgress[]
  newlyUnlocked: AchievementDefinition[]
} {
  const progress: AchievementProgress[] = []
  const newlyUnlocked: AchievementDefinition[] = []

  for (const achievement of ACHIEVEMENTS) {
    const achievementProgress = checkAchievementProgress(achievement, stats)
    progress.push(achievementProgress)

    // Check if newly unlocked
    if (achievementProgress.isComplete && !unlockedIds.includes(achievement.id)) {
      newlyUnlocked.push(achievement)
    }
  }

  return { progress, newlyUnlocked }
}

// Get total XP from achievements
export function getTotalAchievementXp(unlockedIds: string[]): number {
  return ACHIEVEMENTS.filter((a) => unlockedIds.includes(a.id)).reduce(
    (total, a) => total + a.xpReward,
    0
  )
}

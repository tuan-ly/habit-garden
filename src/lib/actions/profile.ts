'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { ACHIEVEMENTS, type AchievementProgress } from '@/lib/achievements'
import { getLevelFromXp } from '@/lib/xp-system'

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data as Profile
}

export async function getUserStats() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get plants count by status
  const { data: plants } = await supabase
    .from('plants')
    .select('status, current_streak, longest_streak')
    .eq('user_id', user.id)

  // Get total waterings
  const { count: totalWaterings } = await supabase
    .from('watering_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get achievements count
  const { count: achievementsCount } = await supabase
    .from('user_achievements')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get best streak across all plants
  const bestStreak = Math.max(...(plants?.map(p => p.longest_streak) || [0]), 0)
  const currentStreak = Math.max(...(plants?.map(p => p.current_streak) || [0]), 0)

  const growing = plants?.filter(p => p.status === 'growing').length ?? 0
  const mature = plants?.filter(p => p.status === 'mature').length ?? 0
  const dead = plants?.filter(p => p.status === 'dead').length ?? 0

  return {
    totalPlants: plants?.length ?? 0,
    growing,
    mature,
    dead,
    totalWaterings: totalWaterings ?? 0,
    achievementsCount: achievementsCount ?? 0,
    bestStreak,
    currentStreak,
  }
}

export async function getAchievementsData(): Promise<{
  progress: AchievementProgress[]
  unlockedIds: string[]
} | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Get user's unlocked achievements
  const { data: userAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', user.id)

  const unlockedIds = userAchievements?.map(a => a.achievement_id) || []

  // Get stats for progress calculation
  const { data: plants } = await supabase
    .from('plants')
    .select('status, current_streak, longest_streak, total_waterings')
    .eq('user_id', user.id)

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp')
    .eq('id', user.id)
    .single()

  const { count: totalWaterings } = await supabase
    .from('watering_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: morningWaterings } = await supabase
    .from('watering_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('morning_bonus', true)

  // Calculate stats
  const totalPlants = plants?.length || 0
  const maturePlants = plants?.filter(p => p.status === 'mature').length || 0
  const bestStreak = Math.max(...(plants?.map(p => p.longest_streak) || [0]), 0)
  const currentStreak = Math.max(...(plants?.map(p => p.current_streak) || [0]), 0)
  const level = getLevelFromXp(profile?.xp || 0)

  // Build stats object for achievement checking
  const stats = {
    totalWaterings: totalWaterings || 0,
    totalPlants,
    maturePlants,
    bestStreak,
    currentStreak,
    level,
    totalXp: profile?.xp || 0,
    morningWaterings: morningWaterings || 0,
    hardDayWaterings: 0,
    specialPlants: 0,
    perfectWeeks: 0,
    hasFirstPlant: totalPlants > 0,
    hasFirstMature: maturePlants > 0,
    isComeback: false,
  }

  // Calculate progress for all achievements
  const progress: AchievementProgress[] = ACHIEVEMENTS.map(achievement => {
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
      default:
        currentValue = 0
    }

    const isComplete = unlockedIds.includes(achievement.id)
    const progressPercent = Math.min(100, Math.round((currentValue / achievement.requirementValue) * 100))

    return {
      achievement,
      currentValue,
      isComplete,
      progress: isComplete ? 100 : progressPercent,
    }
  })

  return { progress, unlockedIds }
}

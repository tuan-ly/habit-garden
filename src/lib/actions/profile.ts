'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'
import { ACHIEVEMENTS, type AchievementProgress } from '@/lib/achievements'
import { getLevelFromXp } from '@/lib/xp-system'

// Update user's timezone
export async function updateTimezone(timezone: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Validate timezone is a valid IANA timezone
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone })
  } catch {
    return { success: false, error: 'Invalid timezone' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      timezone,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating timezone:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Sync user XP from watering_logs to profiles table
export async function syncUserXp(): Promise<{ success: boolean; xp?: number; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Calculate total XP from watering_logs
  const { data: waterings, error: wateringsError } = await supabase
    .from('watering_logs')
    .select('xp_earned')
    .eq('user_id', user.id)

  if (wateringsError) {
    console.error('Error fetching waterings:', wateringsError)
    return { success: false, error: wateringsError.message }
  }

  const totalXp = waterings?.reduce((sum, w) => sum + (w.xp_earned ?? 0), 0) ?? 0

  // Update profiles table
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      xp: totalXp,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('Error updating profile XP:', updateError)
    return { success: false, error: updateError.message }
  }

  return { success: true, xp: totalXp }
}

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

  // Auto-sync XP if profile.xp is 0 but user has waterings
  if (data && data.xp === 0) {
    const { data: waterings } = await supabase
      .from('watering_logs')
      .select('xp_earned')
      .eq('user_id', user.id)

    const totalXp = waterings?.reduce((sum, w) => sum + (w.xp_earned ?? 0), 0) ?? 0

    if (totalXp > 0) {
      // Update profile with correct XP
      await supabase
        .from('profiles')
        .update({
          xp: totalXp,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      data.xp = totalXp
    }
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

// Update user's display name
export async function updateDisplayName(displayName: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const trimmed = displayName.trim()
  if (!trimmed) return { success: false, error: 'Display name cannot be empty' }
  if (trimmed.length > 50) return { success: false, error: 'Display name is too long' }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: trimmed,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating display name:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Claim an achievement reward (unlock + award XP)
export async function claimAchievement(achievementId: string): Promise<{
  success: boolean
  xpAwarded?: number
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Validate achievement exists
  const achievement = ACHIEVEMENTS.find(a => a.id === achievementId)
  if (!achievement) return { success: false, error: 'Achievement not found' }

  // Check if already claimed
  const { data: existing } = await supabase
    .from('user_achievements')
    .select('id')
    .eq('user_id', user.id)
    .eq('achievement_id', achievementId)
    .single()

  if (existing) return { success: false, error: 'Achievement already claimed' }

  // Insert into user_achievements
  const { error: insertError } = await supabase
    .from('user_achievements')
    .insert({
      user_id: user.id,
      achievement_id: achievementId,
      unlocked_at: new Date().toISOString(),
    })

  if (insertError) {
    console.error('Error claiming achievement:', insertError)
    return { success: false, error: insertError.message }
  }

  // Award XP to profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp')
    .eq('id', user.id)
    .single()

  const currentXp = profile?.xp || 0
  const newXp = currentXp + achievement.xpReward

  const { error: xpError } = await supabase
    .from('profiles')
    .update({
      xp: newXp,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (xpError) {
    console.error('Error awarding XP:', xpError)
  }

  return { success: true, xpAwarded: achievement.xpReward }
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

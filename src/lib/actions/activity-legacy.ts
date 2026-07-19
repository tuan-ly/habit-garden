import { getAuthUser } from '@/lib/auth-cached'
import { calculateWateringReward, COINS_PLANT_MATURED } from '@/lib/coin-rewards'
import { EASY_MODE_BONUS_DAYS, EASY_MODE_BONUS_PERCENT, isMorningTime, WELCOME_BACK_BONUS, XP_VALUES } from '@/lib/xp-constants'
import { calculateNoteBonus, checkLevelUp, getLevelFromXp } from '@/lib/xp-system'
import { createClient } from '@/lib/supabase/server'
import { calculateWeatherXp, getTodayWeather } from '@/lib/weather-system'
import { awardCoins } from './coins'
import { harvestMaterial } from './inventory'
import { checkAndUnlockAchievements } from './plants'
import type { LogActivityDto, LogActivityResult } from './activity'

type LegacyGoal = {
  id: string
  season_status: string
  goal_mode: string
  current_value: number
  days_active: number
  started_at: string | null
  target_value: number
  weekly_targets: number[] | null
}

/**
 * Temporary compatibility implementation for deployments where the atomic RPC
 * migration has not reached the database yet. Remove after all environments have
 * record_activity_atomic available.
 */

export async function logActivityLegacy(dto: LogActivityDto): Promise<LogActivityResult> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const today = new Date().toISOString().split('T')[0]

  // Get current profile XP for level up detection
  const { data: profileData } = await supabase
    .from('profiles')
    .select('xp')
    .eq('id', user.id)
    .single()
  const oldXp = profileData?.xp || 0

  // Get plant with goal and type info
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select(`
      id, user_id, plant_type_id, name, habit_description, started_at,
      current_moisture, growth_percentage, total_waterings,
      current_streak, longest_streak, last_watered_at, status, matured_at,
      goal_mode, easy_mode, created_at, updated_at,
      plant_type:plant_types(
        id, name, icon, maturity_days, moisture_decay_rate, moisture_boost,
        frequency_type, frequency_target, difficulty, tier
      ),
      goals(id, season_status, goal_mode, current_value, days_active, started_at, target_value, weekly_targets)
    `)
    .eq('id', dto.plant_id)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) {
    return { success: false, error: 'Plant not found' }
  }

  // Check if already watered/logged today (any activity type)
  const { data: existingActivity } = await supabase
    .from('activity_logs')
    .select('id, activity_type')
    .eq('plant_id', dto.plant_id)
    .eq('logged_date', today)
    .limit(1)
    .single()

  const isFirstActivityToday = !existingActivity
  const isMorning = isMorningTime()

  // Get active goal if exists
  const goals = plant.goals as LegacyGoal[]
  const activeGoal = goals?.find(g => g.season_status === 'active') || goals?.[0]

  // =====================================================
  // XP Calculation
  // =====================================================

  let totalXp = 0
  let isPersonalRecord = false
  let newGoalValue: number | undefined

  // For 'completed' and 'progress': award watering XP if first activity today
  if (dto.activity_type === 'completed' || dto.activity_type === 'progress') {
    if (isFirstActivityToday) {
      // Base watering XP
      totalXp += XP_VALUES.WATERING_BASE
      if (isMorning) {
        totalXp += XP_VALUES.MORNING_BONUS
      }
    }

    // Personal record bonus (for progress with goal)
    if (dto.activity_type === 'progress' && activeGoal && dto.value !== undefined) {
      if (activeGoal.goal_mode === 'build_capacity') {
        if (dto.value > Number(activeGoal.current_value)) {
          isPersonalRecord = true
          totalXp += XP_VALUES.PERSONAL_RECORD_BONUS
        }
      }
    }
  } else if (dto.activity_type === 'watering') {
    // "Just checking in" / "Not today" — no base XP, only note bonus below
  }

  // Note bonus (applies to all activity types)
  if (dto.notes && dto.notes.trim().length > 0) {
    const noteBonus = calculateNoteBonus({
      noteLength: dto.notes.trim().length,
      journalStreak: 0, // Can enhance later
    })
    totalXp += noteBonus.total
  }

  // Apply weather modifier
  const weather = getTodayWeather()
  totalXp = calculateWeatherXp(totalXp, weather.type)

  // Welcome back bonus (one-time on return after 3+ days absence)
  // Validated server-side: check last activity date in DB, ignore client flag
  if (dto.is_welcome_back) {
    const { data: lastActivity } = await supabase
      .from('activity_logs')
      .select('logged_date')
      .eq('user_id', user.id)
      .lt('logged_date', today)
      .order('logged_date', { ascending: false })
      .limit(1)
      .single()

    if (lastActivity) {
      const prev = new Date(lastActivity.logged_date)
      const now = new Date(today)
      const daysSince = Math.floor((now.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24))
      if (daysSince >= 3) {
        totalXp += WELCOME_BACK_BONUS
      }
    }
  }

  // Easy Mode bonus: +20% XP for first 30 days
  if (plant.easy_mode && totalXp > 0) {
    const plantStart = plant.started_at || plant.created_at
    const plantAgeInDays = Math.floor(
      (Date.now() - new Date(plantStart).getTime()) / (1000 * 60 * 60 * 24)
    )
    if (plantAgeInDays <= EASY_MODE_BONUS_DAYS) {
      const bonus = Math.round(totalXp * EASY_MODE_BONUS_PERCENT)
      totalXp += bonus
    }
  }

  // =====================================================
  // Update Goal Value (for 'progress' type only)
  // =====================================================

  if (dto.activity_type === 'progress' && activeGoal && dto.value !== undefined) {
    if (activeGoal.goal_mode === 'total_progress') {
      newGoalValue = Number(activeGoal.current_value) + dto.value
    } else {
      // Build capacity - take max
      newGoalValue = Math.max(Number(activeGoal.current_value), dto.value)
    }

    // Calculate week number for goal log
    const startDate = new Date(activeGoal.started_at || today)
    const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const weekNumber = Math.floor(daysSinceStart / 7) + 1
    const weeklyTargets = (activeGoal.weekly_targets as number[]) || []
    const weeklyTarget = weeklyTargets[Math.min(weekNumber - 1, weeklyTargets.length - 1)] || activeGoal.target_value
    const exceededTarget = dto.value >= weeklyTarget

    // Update goal
    const { error: goalUpdateError } = await supabase
      .from('goals')
      .update({
        current_value: newGoalValue,
        days_active: activeGoal.days_active + (isFirstActivityToday ? 1 : 0),
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeGoal.id)
    if (goalUpdateError) {
      console.error('Error updating goal:', goalUpdateError)
      return { success: false, error: goalUpdateError.message }
    }

    // Also insert into goal_logs so periodProgress is tracked correctly
    const { error: goalLogError } = await supabase
      .from('goal_logs')
      .insert({
        goal_id: activeGoal.id,
        plant_id: dto.plant_id,
        user_id: user.id,
        value: dto.value,
        logged_date: today,
        notes: dto.notes || null,
        week_number: weekNumber,
        weekly_target: weeklyTarget,
        is_personal_record: isPersonalRecord,
        exceeded_target: exceededTarget,
      })
    if (goalLogError) {
      console.error('Error inserting goal log:', goalLogError)
      return { success: false, error: goalLogError.message }
    }
  }

  // =====================================================
  // Create Activity Log
  // =====================================================

  const { error: logError } = await supabase
    .from('activity_logs')
    .insert({
      plant_id: dto.plant_id,
      season_id: activeGoal?.id || null,
      user_id: user.id,
      activity_type: dto.activity_type,
      logged_date: today,
      value: dto.value || null,
      notes: dto.notes || null,
      xp_earned: totalXp,
      is_first_of_day: isFirstActivityToday,
      is_personal_record: isPersonalRecord,
      morning_bonus: isMorning && isFirstActivityToday,
    })

  if (logError) {
    console.error('Error creating activity log:', logError)
    return { success: false, error: logError.message }
  }

  // =====================================================
  // Update Plant Status
  // =====================================================

  // Supabase returns plant_type as array for joined relations, extract first element
  const plantType = Array.isArray(plant.plant_type) ? plant.plant_type[0] : plant.plant_type
  let plantUpdate: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  let hasMatured = false
  let newStreak = 0

  if (dto.activity_type === 'completed' || dto.activity_type === 'progress') {
    // Full update: moisture, growth, streak (like watering + more)
    const newMoisture = Math.min(100, plant.current_moisture + plantType.moisture_boost)
    const baseGrowth = 100 / plantType.maturity_days
    const weatherGrowth = baseGrowth * weather.growthModifier
    const newGrowth = Math.min(100, plant.growth_percentage + weatherGrowth)

    // Calculate streak
    const lastWateredDate = plant.last_watered_at
      ? new Date(plant.last_watered_at).toISOString().split('T')[0]
      : null
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    newStreak = 1
    if (lastWateredDate === yesterday) {
      newStreak = plant.current_streak + 1
    } else if (lastWateredDate === today) {
      newStreak = plant.current_streak
    }

    hasMatured = newGrowth >= 100 && plant.status !== 'mature' && plant.status !== 'dead'

    plantUpdate = {
      ...plantUpdate,
      current_moisture: newMoisture,
      growth_percentage: newGrowth,
      total_waterings: plant.total_waterings + (isFirstActivityToday ? 1 : 0),
      current_streak: newStreak,
      longest_streak: Math.max(plant.longest_streak, newStreak),
      last_watered_at: new Date().toISOString(),
      status: hasMatured ? 'mature' : 'thriving',
      matured_at: hasMatured ? new Date().toISOString() : plant.matured_at,
    }
  } else if (dto.activity_type === 'watering') {
    // Light update: just moisture (gentle boost)
    const newMoisture = Math.min(100, plant.current_moisture + (plantType.moisture_boost * 0.5))

    plantUpdate = {
      ...plantUpdate,
      current_moisture: newMoisture,
      last_watered_at: new Date().toISOString(),
    }
  }

  const { error: plantUpdateError } = await supabase
    .from('plants')
    .update(plantUpdate)
    .eq('id', dto.plant_id)
  if (plantUpdateError) {
    console.error('Error updating plant:', plantUpdateError)
    return { success: false, error: plantUpdateError.message }
  }

  // =====================================================
  // Coin Rewards
  // =====================================================

  let coinsEarned = 0
  let harvestedMaterial: { name: string; icon: string } | undefined

  if (dto.activity_type === 'completed' || dto.activity_type === 'progress') {
    // Award coins only for actual completion/progress — NOT for 'watering' ("Not today" / rest)
    // newStreak is calculated above only for completed/progress types
    const coinReward = calculateWateringReward(isFirstActivityToday, newStreak)
    if (coinReward.total > 0) {
      coinsEarned += coinReward.total
      await awardCoins(coinReward.total, 'activity', dto.plant_id)
    }

    // Award coins + harvest material when plant matures
    if (hasMatured) {
      coinsEarned += COINS_PLANT_MATURED
      await awardCoins(COINS_PLANT_MATURED, 'plant_matured', dto.plant_id)

      // Harvest material from the matured plant
      const harvestResult = await harvestMaterial(dto.plant_id)
      if ('material' in harvestResult) {
        harvestedMaterial = {
          name: harvestResult.material.name,
          icon: harvestResult.material.icon,
        }
      }
    }
  }

  // =====================================================
  // Update User XP
  // =====================================================

  if (totalXp > 0) {
    await updateUserXp(user.id, totalXp)
  }

  // Check for level up
  const levelUpResult = totalXp > 0 ? checkLevelUp(oldXp, oldXp + totalXp) : null

  // Check and unlock achievements
  const newAchievementIds = await checkAndUnlockAchievements(user.id)
  // Generate appropriate message
  let message = ''
  if (dto.activity_type === 'watering') {
    message = 'Plant watered with care 💧'
  } else if (isPersonalRecord) {
    message = 'New personal record! 🏆'
  } else {
    message = 'Great job! 🎉'
  }

  return {
    success: true,
    xpEarned: totalXp,
    isPersonalRecord,
    newGoalValue,
    message,
    leveledUp: levelUpResult?.leveledUp,
    newLevel: levelUpResult?.newLevel,
    oldLevel: levelUpResult?.leveledUp ? getLevelFromXp(oldXp) : undefined,
    newAchievementIds: newAchievementIds.length > 0 ? newAchievementIds : undefined,
    coinsEarned: coinsEarned > 0 ? coinsEarned : undefined,
    harvestedMaterial,
  }
}

async function updateUserXp(userId: string, xp: number): Promise<void> {
  const supabase = await createClient()

  // Atomic increment via SECURITY DEFINER function — eliminates TOCTOU race
  const { error } = await supabase.rpc('increment_user_xp', {
    p_user_id: userId,
    p_delta: xp,
  })

  if (error) {
    console.error('Error incrementing user XP:', error)
  }
}


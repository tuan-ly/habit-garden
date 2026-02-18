'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CreatePlantDto, PlantWithType, PlantType, Difficulty, WeatherType, PlantGoalInfo, TodayGoalLog, GoalMode, PlantTier, Profile } from '@/types/database'
import { getTodayWeather, calculateWeatherXp } from '@/lib/weather-system'
import { calculateWateringXp, calculateNoteBonus } from '@/lib/xp-system'
import { getTodayMood } from '@/lib/actions/mood'
import { calculateXpWithMood, getMoodBonusXp, getMoodConfig } from '@/lib/mood-system'
import {
  calculateRequiredGridSize,
  findNextAvailablePosition,
  hasCollision,
  findDisplacementMoves,
} from '@/lib/utils/grid-positioning'
import {
  checkSlotAvailability,
  canPlantTier,
  getMaxPlants,
  calculateProgressionFields,
} from '@/lib/progression-system'

export async function getPlants(): Promise<PlantWithType[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const today = new Date().toISOString().split('T')[0]

  // Fetch plants with plant_type
  const { data: plantsData, error } = await supabase
    .from('plants')
    .select(`
      *,
      plant_type:plant_types(*)
    `)
    .eq('user_id', user.id)
    .order('position', { ascending: true })

  if (error) {
    console.error('Error fetching plants:', error)
    return []
  }

  if (!plantsData || plantsData.length === 0) {
    return []
  }

  // Get plant IDs that have goals
  const plantIds = plantsData.map(p => p.id)
  const plantsWithGoalMode = plantsData.filter(p => p.goal_mode)
  const plantIdsWithGoal = plantsWithGoalMode.map(p => p.id)

  // Fetch goals for plants that have goal_mode
  let goalsMap = new Map<string, PlantGoalInfo>()
  if (plantIdsWithGoal.length > 0) {
    const { data: goals } = await supabase
      .from('goals')
      .select('id, plant_id, goal_mode, tracking_metric, unit, target_value, current_value, weekly_targets, started_at')
      .in('plant_id', plantIdsWithGoal)

    if (goals) {
      for (const goal of goals) {
        // Calculate week number and current week target
        const startDate = new Date(goal.started_at)
        const daysSinceStart = Math.floor((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        const weekNumber = Math.floor(daysSinceStart / 7) + 1
        const weeklyTargets = (goal.weekly_targets as number[]) || []
        const currentWeekTarget = weeklyTargets[Math.min(weekNumber - 1, weeklyTargets.length - 1)] || goal.target_value

        goalsMap.set(goal.plant_id, {
          id: goal.id,
          goal_mode: goal.goal_mode,
          tracking_metric: goal.tracking_metric,
          unit: goal.unit,
          target_value: goal.target_value,
          current_value: goal.current_value,
          weekly_targets: weeklyTargets,
          current_week_target: currentWeekTarget,
          week_number: weekNumber,
        })
      }
    }
  }

  // Fetch today's goal logs for all plants
  let todayLogsMap = new Map<string, TodayGoalLog[]>()
  if (plantIdsWithGoal.length > 0) {
    const { data: todayLogs } = await supabase
      .from('goal_logs')
      .select('id, plant_id, value, notes, logged_at')
      .in('plant_id', plantIdsWithGoal)
      .eq('logged_date', today)
      .order('logged_at', { ascending: false })

    if (todayLogs) {
      for (const log of todayLogs) {
        const plantLogs = todayLogsMap.get(log.plant_id) || []
        plantLogs.push({
          id: log.id,
          value: log.value,
          notes: log.notes,
          logged_at: log.logged_at,
        })
        todayLogsMap.set(log.plant_id, plantLogs)
      }
    }
  }

  // Merge data into PlantWithType
  const plants: PlantWithType[] = plantsData.map(plant => {
    const goal = goalsMap.get(plant.id) || null
    const todayLogs = todayLogsMap.get(plant.id) || []
    const todayLogCount = todayLogs.length
    const todayValue = todayLogs.reduce((sum, log) => sum + log.value, 0)

    return {
      ...plant,
      goal,
      today_logs: todayLogs,
      today_log_count: todayLogCount,
      today_value: todayValue > 0 ? todayValue : undefined,
    } as PlantWithType
  })

  return plants
}

export async function getPlantTypes(): Promise<PlantType[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('plant_types')
    .select('*')
    .order('maturity_days', { ascending: true })

  if (error) {
    console.error('Error fetching plant types:', error)
    return []
  }

  return data as PlantType[]
}

export async function createPlant(dto: CreatePlantDto): Promise<{ success: boolean; plant?: PlantWithType; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get user profile for tier/slot validation
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  // Get the plant type to check tier
  const { data: plantType } = await supabase
    .from('plant_types')
    .select('*')
    .eq('id', dto.plant_type_id)
    .single()

  if (!plantType) {
    return { success: false, error: 'Plant type not found' }
  }

  // Get all existing living plants to calculate grid position
  const { data: existingPlants } = await supabase
    .from('plants')
    .select(`
      id,
      position,
      grid_size,
      grid_row,
      grid_col,
      status,
      plant_type:plant_types(*)
    `)
    .eq('user_id', user.id)
    .neq('status', 'dead')

  const livingPlants = existingPlants || []

  // Validate slot availability
  if (profile) {
    const slotCheck = checkSlotAvailability(profile as Profile, livingPlants.length)
    if (!slotCheck.hasSlot) {
      return { success: false, error: slotCheck.message || 'No plant slots available. Level up to unlock more!' }
    }

    // Validate tier unlock (if tier field exists)
    const tier = (plantType.tier || 1) as PlantTier
    if (tier > 1) {
      const tierCheck = canPlantTier(profile as Profile, tier)
      if (!tierCheck.allowed) {
        return { success: false, error: tierCheck.reason || `Tier ${tier} plants are locked. ${tierCheck.missingRequirements?.[0] || ''}` }
      }
    }
  }

  // Calculate next position (legacy)
  const { data: lastPlant } = await supabase
    .from('plants')
    .select('position')
    .eq('user_id', user.id)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = (lastPlant?.[0]?.position ?? 0) + 1

  // Calculate grid position for new plant
  const gridSize = calculateRequiredGridSize(livingPlants)
  const newPlantSize = 1 // All new plants start as 1x1

  let finalRow = 0
  let finalCol = 0

  // Check if position was provided in dto
  if (dto.grid_row !== undefined && dto.grid_col !== undefined) {
    // User provided a specific position - validate it's available
    const targetRow = dto.grid_row
    const targetCol = dto.grid_col

    // Check if position is valid (within reasonable bounds and not occupied)
    const maxGrid = Math.max(gridSize, targetRow + 1, targetCol + 1)

    // Check collision with existing plants
    let isOccupied = false
    for (const plant of livingPlants) {
      const pRow = plant.grid_row ?? 0
      const pCol = plant.grid_col ?? 0
      const pSize = plant.grid_size ?? 1

      // Check if target cell overlaps with this plant's occupied area
      if (
        targetRow >= pRow && targetRow < pRow + pSize &&
        targetCol >= pCol && targetCol < pCol + pSize
      ) {
        isOccupied = true
        break
      }
    }

    if (!isOccupied && targetRow >= 0 && targetCol >= 0) {
      // Position is valid and available
      finalRow = targetRow
      finalCol = targetCol
    } else {
      // Position is occupied or invalid, fall back to auto-assign
      const gridPosition = findNextAvailablePosition(livingPlants, maxGrid, newPlantSize)
      if (gridPosition) {
        finalRow = gridPosition.row
        finalCol = gridPosition.col
      } else {
        // Expand grid and try again
        const expandedPosition = findNextAvailablePosition(livingPlants, maxGrid + 1, newPlantSize)
        if (expandedPosition) {
          finalRow = expandedPosition.row
          finalCol = expandedPosition.col
        }
      }
    }
  } else {
    // No position provided - auto-assign
    const gridPosition = findNextAvailablePosition(livingPlants, gridSize, newPlantSize)

    if (!gridPosition) {
      // Grid is full, expand it
      const expandedSize = gridSize + 1
      const expandedPosition = findNextAvailablePosition(livingPlants, expandedSize, newPlantSize)

      if (!expandedPosition) {
        // Should never happen, but handle gracefully
        console.error('Failed to find position even after expanding grid')
        finalRow = gridSize
        finalCol = gridSize
      } else {
        finalRow = expandedPosition.row
        finalCol = expandedPosition.col
      }
    } else {
      finalRow = gridPosition.row
      finalCol = gridPosition.col
    }
  }

  const { data: newPlant, error } = await supabase
    .from('plants')
    .insert({
      user_id: user.id,
      plant_type_id: dto.plant_type_id,
      name: dto.name,
      habit_description: dto.habit_description || null,
      reminder_time: dto.reminder_time || null,
      reminder_enabled: dto.reminder_enabled ?? true,
      position: nextPosition, // Keep for backward compatibility
      grid_size: newPlantSize,
      grid_row: finalRow,
      grid_col: finalCol,
      current_moisture: 100,
      growth_percentage: 0,
      status: 'growing',
    })
    .select(`
      *,
      plant_type:plant_types(*)
    `)
    .single()

  if (error || !newPlant) {
    console.error('Error creating plant:', error)
    return { success: false, error: error?.message || 'Failed to create plant' }
  }

  revalidatePath('/garden')
  return { success: true, plant: newPlant as PlantWithType }
}

export async function deletePlant(plantId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('plants')
    .delete()
    .eq('id', plantId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error deleting plant:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/garden')
  return { success: true }
}

export async function waterPlant(
  plantId: string,
  options?: { notes?: string; difficulty?: Difficulty }
): Promise<{
  success: boolean
  xpEarned?: number
  xpBreakdown?: Record<string, number>
  weatherType?: string
  moodWeather?: string
  moodBonusXp?: number
  noteBonusXp?: number
  journalStreak?: number
  newAchievements?: string[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get the plant and its type
  const { data: plant, error: plantError } = await supabase
    .from('plants')
    .select(`
      *,
      plant_type:plant_types(*)
    `)
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (plantError || !plant) {
    return { success: false, error: 'Plant not found' }
  }

  // Check if already watered today
  const today = new Date().toISOString().split('T')[0]
  const { data: existingWatering } = await supabase
    .from('watering_logs')
    .select('id')
    .eq('plant_id', plantId)
    .eq('watered_date', today)
    .single()

  if (existingWatering) {
    return { success: false, error: 'Already watered today' }
  }

  const plantType = plant.plant_type as PlantType

  // Get today's weather
  const weather = getTodayWeather()

  // Get today's mood for XP bonus
  const todayMood = await getTodayMood()
  const moodConfig = getMoodConfig(todayMood)

  // Calculate streak
  const lastWateredDate = plant.last_watered_at
    ? new Date(plant.last_watered_at).toISOString().split('T')[0]
    : null
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let newStreak = 1
  if (lastWateredDate === yesterday) {
    newStreak = plant.current_streak + 1
  }

  // Calculate XP using the xp-system
  const currentHour = new Date().getHours()
  const isMorning = currentHour >= 5 && currentHour < 9

  const { total: baseTotal, breakdown } = calculateWateringXp({
    streak: newStreak,
    isMorning,
    difficulty: options?.difficulty,
    isRainyDay: weather.type === 'rainy',
    isRainbowDay: weather.type === 'rainbow',
  })

  // Apply weather XP modifier
  const weatherXp = calculateWeatherXp(baseTotal, weather.type)

  // Apply mood XP bonus (tough days earn more XP!)
  const baseXpWithMood = calculateXpWithMood(weatherXp, todayMood)
  const moodBonusXp = getMoodBonusXp(weatherXp, todayMood)

  // Get current journal streak for note bonus calculation
  const { data: journalProfile } = await supabase
    .from('profiles')
    .select('journal_streak, longest_journal_streak, last_journal_date, total_journal_entries')
    .eq('id', user.id)
    .single()

  const lastJournalDate = journalProfile?.last_journal_date
  const currentJournalStreak = journalProfile?.journal_streak || 0

  // Calculate note bonus if notes provided
  let noteBonusXp = 0
  let newJournalStreak = currentJournalStreak
  const hasNote = options?.notes && options.notes.trim().length > 0

  if (hasNote) {
    // Calculate new journal streak
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
    if (lastJournalDate === yesterday) {
      newJournalStreak = currentJournalStreak + 1
    } else if (lastJournalDate !== today) {
      newJournalStreak = 1 // Reset streak if not consecutive
    }
    // If already wrote today, keep current streak

    const noteResult = calculateNoteBonus({
      noteLength: options!.notes!.trim().length,
      journalStreak: newJournalStreak,
    })
    noteBonusXp = noteResult.total
  }

  const totalXp = baseXpWithMood + noteBonusXp

  // Calculate new moisture and growth with weather modifiers
  const newMoisture = Math.min(100, plant.current_moisture + plantType.moisture_boost)
  const baseGrowth = 100 / plantType.maturity_days
  const weatherGrowth = baseGrowth * weather.growthModifier
  const newGrowth = Math.min(100, plant.growth_percentage + weatherGrowth)
  const totalWaterings = plant.total_waterings + 1

  // Determine if plant has matured
  const hasMatured = newGrowth >= 100 && plant.status === 'growing'

  // Calculate potential grid size expansion
  // Logic: Mature -> 2x2, 1 Year -> 3x3, 2 Years -> 4x4
  let targetGridSize = 1
  if (totalWaterings >= 730) targetGridSize = 4 // 2 years (~730 days)
  else if (totalWaterings >= 365) targetGridSize = 3 // 1 year
  else if (newGrowth >= 100) targetGridSize = 2 // Mature

  // Only attempt to grow, never shrink
  targetGridSize = Math.max(targetGridSize, plant.grid_size)

  let finalGridSize = plant.grid_size

  // If growth is needed, check for space
  if (targetGridSize > plant.grid_size) {
    // Fetch all plants to check for collision
    const { data: livingPlants } = await supabase
      .from('plants')
      .select('id, grid_row, grid_col, grid_size')
      .eq('user_id', user.id)
      .neq('status', 'dead')

    if (livingPlants) {
      const testPlant = {
        grid_row: plant.grid_row,
        grid_col: plant.grid_col,
        grid_size: targetGridSize,
      }

      // Check violation excluding itself
      const collision = hasCollision(testPlant, livingPlants, plant.id)
      
      if (!collision) {
        finalGridSize = targetGridSize
      } 
      // NEW: If collision exists, we don't grow yet, but we mark it as blocked ONLY if it SHOULD grow
      // This will trigger the UI to show the "Needs Space" indicator
      else {
         // It keeps current size, but we'll flag it in the update
      }
    }
  }

  // Create watering log
  const { error: logError } = await supabase
    .from('watering_logs')
    .insert({
      plant_id: plantId,
      user_id: user.id,
      watered_date: today,
      difficulty: options?.difficulty || null,
      notes: options?.notes || null,
      xp_earned: totalXp,
      morning_bonus: isMorning,
      streak_bonus: breakdown.streakBonus || 0,
      note_bonus: noteBonusXp,
    })

  if (logError) {
    console.error('Error creating watering log:', logError)
    return { success: false, error: logError.message }
  }

  // Update plant
  const { error: updateError } = await supabase
    .from('plants')
    .update({
      current_moisture: newMoisture,
      growth_percentage: newGrowth,
      total_waterings: totalWaterings,
      current_streak: newStreak,
      longest_streak: Math.max(plant.longest_streak, newStreak),
      last_watered_at: new Date().toISOString(),
      status: hasMatured ? 'mature' : plant.status,
      matured_at: hasMatured ? new Date().toISOString() : plant.matured_at,
      grid_size: finalGridSize,
      // Flag as blocked if we wanted to grow but couldn't
      growth_blocked: targetGridSize > finalGridSize, 
      updated_at: new Date().toISOString(),
    })
    .eq('id', plantId)

  if (updateError) {
    console.error('Error updating plant:', updateError)
    return { success: false, error: updateError.message }
  }

  // Update user XP and journal streak in profiles table
  const { data: profileForXp } = await supabase
    .from('profiles')
    .select('xp, total_journal_entries')
    .eq('id', user.id)
    .single()

  if (profileForXp) {
    const profileUpdate: Record<string, unknown> = {
      xp: profileForXp.xp + totalXp,
      updated_at: new Date().toISOString(),
    }

    // Update journal tracking if note was provided
    if (hasNote) {
      profileUpdate.journal_streak = newJournalStreak
      profileUpdate.longest_journal_streak = Math.max(
        newJournalStreak,
        journalProfile?.longest_journal_streak || 0
      )
      profileUpdate.last_journal_date = today
      profileUpdate.total_journal_entries = (profileForXp.total_journal_entries || 0) + 1
    }

    const { error: xpError } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', user.id)

    if (xpError) {
      console.error('Error updating user XP:', xpError)
    }
  }

  // Check for new achievements
  const newAchievements = await checkAndUnlockAchievements(user.id)

  revalidatePath('/garden')
  return {
    success: true,
    xpEarned: totalXp,
    xpBreakdown: breakdown,
    weatherType: weather.type,
    moodWeather: moodConfig.weather,
    moodBonusXp: moodBonusXp > 0 ? moodBonusXp : undefined,
    noteBonusXp: noteBonusXp > 0 ? noteBonusXp : undefined,
    journalStreak: hasNote ? newJournalStreak : undefined,
    newAchievements,
  }
}

/**
 * Attempt to resolve a growth conflict by moving neighbors
 */
export async function resolveGrowthConflict(plantId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // 1. Get the plant
  const { data: plant } = await supabase
    .from('plants')
    .select('*, plant_type:plant_types(*)')
    .eq('id', plantId)
    .single()

  if (!plant) return { success: false, error: 'Plant not found' }

  // 2. Determine target size (re-calculate to be safe)
  // Logic duplication from waterPlant - ideally refactor grid logic to shared helper
  let targetGridSize = 1
  if (plant.total_waterings >= 730) targetGridSize = 4
  else if (plant.total_waterings >= 365) targetGridSize = 3
  else if (plant.growth_percentage >= 100) targetGridSize = 2
  
  targetGridSize = Math.max(targetGridSize, plant.grid_size)

  if (targetGridSize <= plant.grid_size) {
    return { success: false, error: 'Plant does not need to grow' }
  }

  // 3. Get all plants
  const { data: livingPlants } = await supabase
    .from('plants')
    .select('id, grid_row, grid_col, grid_size')
    .eq('user_id', user.id)
    .neq('status', 'dead')

  if (!livingPlants) return { success: false, error: 'Could not fetch garden data' }

  // 4. Calculate moves
  const targetArea = {
    grid_row: plant.grid_row,
    grid_col: plant.grid_col,
    grid_size: targetGridSize
  }

  const moves = findDisplacementMoves(targetArea, livingPlants, plant.id)

  if (!moves) {
    return { success: false, error: 'Could not find space for neighbors. Garden might be too full.' }
  }

  // 5. Execute moves
  // We'll do this serially for now. In a real tx we'd use rpc or batched updates.
  /* 
    TODO: If we have many moves, this might be slow or partial-fail. 
    However, for < 50 plants, it's fast enough. 
  */
  for (const [id, pos] of moves.entries()) {
    await supabase.from('plants').update({
      grid_row: pos.row,
      grid_col: pos.col
    }).eq('id', id)
  }

  // 6. Grow the main plant and clear blocked flag
  const { error: updateError } = await supabase.from('plants').update({
    grid_size: targetGridSize,
    growth_blocked: false
  }).eq('id', plantId)

  if (updateError) {
    return { success: false, error: 'Failed to update plant size' }
  }

  revalidatePath('/garden')
  return { success: true }
}

// Check and unlock achievements after an action
export async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const newlyUnlocked: string[] = []

  // Get user stats for achievement checking
  const { data: plants } = await supabase
    .from('plants')
    .select('status, current_streak, longest_streak, total_waterings')
    .eq('user_id', userId)

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, level, journal_streak, longest_journal_streak, total_journal_entries')
    .eq('id', userId)
    .single()

  const { count: totalWaterings } = await supabase
    .from('watering_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  const { count: morningWaterings } = await supabase
    .from('watering_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('morning_bonus', true)

  const { data: existingAchievements } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId)

  const unlockedIds = existingAchievements?.map(a => a.achievement_id) || []

  // Calculate stats
  const totalPlants = plants?.length || 0
  const maturePlants = plants?.filter(p => p.status === 'mature').length || 0
  const bestStreak = Math.max(...(plants?.map(p => p.longest_streak) || [0]))
  const currentStreak = Math.max(...(plants?.map(p => p.current_streak) || [0]))

  // Define achievement checks
  const achievementChecks = [
    { id: 'first_plant', condition: totalPlants >= 1 },
    { id: 'first_watering', condition: (totalWaterings || 0) >= 1 },
    { id: 'first_mature', condition: maturePlants >= 1 },
    { id: 'watering_10', condition: (totalWaterings || 0) >= 10 },
    { id: 'watering_50', condition: (totalWaterings || 0) >= 50 },
    { id: 'watering_100', condition: (totalWaterings || 0) >= 100 },
    { id: 'watering_365', condition: (totalWaterings || 0) >= 365 },
    { id: 'streak_3', condition: bestStreak >= 3 },
    { id: 'streak_7', condition: bestStreak >= 7 },
    { id: 'streak_14', condition: bestStreak >= 14 },
    { id: 'streak_30', condition: bestStreak >= 30 },
    { id: 'streak_100', condition: bestStreak >= 100 },
    { id: 'plants_5', condition: totalPlants >= 5 },
    { id: 'plants_10', condition: totalPlants >= 10 },
    { id: 'mature_5', condition: maturePlants >= 5 },
    { id: 'mature_10', condition: maturePlants >= 10 },
    { id: 'level_5', condition: (profile?.level || 1) >= 5 },
    { id: 'level_10', condition: (profile?.level || 1) >= 10 },
    { id: 'level_15', condition: (profile?.level || 1) >= 15 },
    { id: 'early_bird', condition: (morningWaterings || 0) >= 10 },
    // Journal achievements
    { id: 'first_journal', condition: (profile?.total_journal_entries || 0) >= 1 },
    { id: 'journal_10', condition: (profile?.total_journal_entries || 0) >= 10 },
    { id: 'journal_50', condition: (profile?.total_journal_entries || 0) >= 50 },
    { id: 'journal_100', condition: (profile?.total_journal_entries || 0) >= 100 },
    { id: 'journal_streak_3', condition: (profile?.longest_journal_streak || 0) >= 3 },
    { id: 'journal_streak_7', condition: (profile?.longest_journal_streak || 0) >= 7 },
    { id: 'journal_streak_14', condition: (profile?.longest_journal_streak || 0) >= 14 },
    { id: 'journal_streak_30', condition: (profile?.longest_journal_streak || 0) >= 30 },
  ]

  // Check and unlock new achievements
  for (const check of achievementChecks) {
    if (check.condition && !unlockedIds.includes(check.id)) {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: userId,
          achievement_id: check.id,
          unlocked_at: new Date().toISOString(),
        })

      if (!error) {
        newlyUnlocked.push(check.id)
      }
    }
  }

  return newlyUnlocked
}

// Types for garden statistics
export interface WateringLogWithPlant {
  id: string
  plant_id: string
  watered_at: string
  watered_date: string
  xp_earned: number
  notes?: string | null
  plant: {
    id: string
    name: string
    plant_type: {
      id: string
      name: string
      icon: string
    }
  } | null
}

export interface GoalLogEntry {
  id: string
  value: number
  notes: string | null
  logged_at: string
  logged_date: string
}

export interface PlantPeriodStats {
  plant_id: string
  plant_name: string
  plant_icon: string
  plant_type_name: string
  // Position in garden
  grid_row: number
  grid_col: number
  grid_size: number
  growth_percentage: number
  status: string
  // Watering stats
  watering_count: number
  waterings: Array<{
    id: string
    watered_at: string
    xp_earned: number
    notes: string | null
  }>
  total_xp: number
  // Goal stats (if plant has goal mode)
  has_goal: boolean
  goal_mode?: GoalMode | null
  goal_unit?: string
  goal_logs?: GoalLogEntry[]
  goal_stats?: {
    total: number
    min: number
    max: number
    avg: number
    count: number
  }
}

export interface GardenStatsData {
  period: 'day' | 'week' | 'month' | 'year'
  startDate: string
  endDate: string
  waterings: WateringLogWithPlant[]
  totalWaterings: number
  totalXp: number
  uniquePlants: number
  dailyBreakdown: { date: string; count: number }[]
  weather: WeatherType | null
}

export interface AggregatedGardenStats {
  period: 'day' | 'week' | 'month' | 'year'
  startDate: string
  endDate: string
  plants: PlantPeriodStats[]
  totalWaterings: number
  totalXp: number
  uniquePlants: number
  weather: WeatherType | null
}

// Get activity logs for a specific time period
export async function getGardenStats(
  period: 'day' | 'week' | 'month' | 'year',
  targetDate?: string // YYYY-MM-DD format, defaults to today
): Promise<GardenStatsData | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Parse date from YYYY-MM-DD string without timezone issues
  let baseYear: number, baseMonth: number, baseDay: number
  if (targetDate) {
    const [y, m, d] = targetDate.split('-').map(Number)
    baseYear = y
    baseMonth = m - 1 // JS months are 0-indexed
    baseDay = d
  } else {
    const now = new Date()
    baseYear = now.getFullYear()
    baseMonth = now.getMonth()
    baseDay = now.getDate()
  }

  // Helper to format date as YYYY-MM-DD
  const formatDate = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  let startStr: string
  let endStr: string

  switch (period) {
    case 'day':
      startStr = formatDate(baseYear, baseMonth, baseDay)
      endStr = startStr
      break
    case 'week': {
      // Start from Monday of the week
      const baseDate = new Date(baseYear, baseMonth, baseDay)
      const dayOfWeek = baseDate.getDay()
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const startDate = new Date(baseYear, baseMonth, baseDay + diffToMonday)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6)
      startStr = formatDate(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      endStr = formatDate(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
      break
    }
    case 'month': {
      const lastDay = new Date(baseYear, baseMonth + 1, 0).getDate()
      startStr = formatDate(baseYear, baseMonth, 1)
      endStr = formatDate(baseYear, baseMonth, lastDay)
      break
    }
    case 'year':
      startStr = formatDate(baseYear, 0, 1)
      endStr = formatDate(baseYear, 11, 31)
      break
  }

  // Fetch activity logs with plant info
  // activity_type: 'watering' | 'completed' | 'progress' | 'rest_day' | 'reflection'
  const { data: activities, error } = await supabase
    .from('activity_logs')
    .select(`
      id,
      plant_id,
      activity_type,
      logged_at,
      logged_date,
      xp_earned,
      notes,
      plant:plants(
        id,
        name,
        plant_type:plant_types(id, name, icon)
      )
    `)
    .eq('user_id', user.id)
    .gte('logged_date', startStr)
    .lte('logged_date', endStr)
    .in('activity_type', ['watering', 'completed', 'progress']) // Only count main activities
    .order('logged_at', { ascending: true })

  if (error) {
    console.error('Error fetching garden stats:', error)
    return null
  }

  // Calculate daily breakdown
  const dailyMap = new Map<string, number>()

  // Initialize all dates in range using string parsing to avoid timezone issues
  const [startY, startM, startD] = startStr.split('-').map(Number)
  const [endY, endM, endD] = endStr.split('-').map(Number)
  const current = new Date(startY, startM - 1, startD)
  const endDate = new Date(endY, endM - 1, endD)
  while (current <= endDate) {
    dailyMap.set(formatDate(current.getFullYear(), current.getMonth(), current.getDate()), 0)
    current.setDate(current.getDate() + 1)
  }

  // Transform activity logs to WateringLogWithPlant format for compatibility
  const typedWaterings: WateringLogWithPlant[] = (activities || [])
    .map(a => {
      // Handle nested plant relation
      const plantData = Array.isArray(a.plant) ? a.plant[0] : a.plant

      // Handle nested plant_type relation
      let plantType = { id: '', name: 'Unknown', icon: '🌱' }
      if (plantData?.plant_type) {
        const typeData = Array.isArray(plantData.plant_type)
          ? plantData.plant_type[0]
          : plantData.plant_type
        if (typeData) {
          plantType = {
            id: typeData.id || '',
            name: typeData.name || 'Unknown',
            icon: typeData.icon || '🌱'
          }
        }
      }

      return {
        id: a.id,
        plant_id: a.plant_id,
        watered_at: a.logged_at,
        watered_date: a.logged_date,
        xp_earned: a.xp_earned || 0,
        notes: a.notes,
        plant: plantData
          ? {
              id: plantData.id,
              name: plantData.name,
              plant_type: plantType
            }
          : null
      }
    })

  typedWaterings.forEach(w => {
    const date = w.watered_date
    dailyMap.set(date, (dailyMap.get(date) || 0) + 1)
  })

  const dailyBreakdown = Array.from(dailyMap.entries()).map(([date, count]) => ({
    date,
    count,
  }))

  // Calculate unique plants
  const uniquePlantIds = new Set(typedWaterings.map(w => w.plant_id))

  // Fetch mood logs for weather calculation
  const { data: moodLogs } = await supabase
    .from('mood_logs')
    .select('mood_level')
    .eq('user_id', user.id)
    .gte('date', startStr)
    .lte('date', endStr)

  const periodWeather = calculateDominantWeather(moodLogs || [])

  return {
    period,
    startDate: startStr,
    endDate: endStr,
    waterings: typedWaterings,
    totalWaterings: typedWaterings.length,
    totalXp: typedWaterings.reduce((sum, w) => sum + w.xp_earned, 0),
    uniquePlants: uniquePlantIds.size,
    dailyBreakdown,
    weather: periodWeather,
  }
}

// Helper to calculate dominant weather from mood logs
function calculateDominantWeather(logs: any[]): WeatherType | null {
  if (!logs || logs.length === 0) return null

  // Count mood levels
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let maxCount = 0
  let dominantLevel = 4 // Default to neutral/good

  for (const log of logs) {
    const level = log.mood_level
    counts[level] = (counts[level] || 0) + 1
    
    // Update dominant (prefer lower moods if tie for "tough" days logic? or just first found? 
    // Let's stick to simple max. If tie, maybe prioritizing recent or average?
    // Let's just pick the level with max count.
    if (counts[level] > maxCount) {
      maxCount = counts[level]
      dominantLevel = level
    }
  }

  // Map mood level to weather type for GardenSky
  // 5: Sunny, 4: Partly Cloudy, 3: Cloudy, 2: Rainy, 1: Stormy
  const config = getMoodConfig(dominantLevel as any)
  if (!config) return 'sunny'

  const weatherMap: Record<string, WeatherType> = {
    'Sunny': 'sunny',
    'Partly Cloudy': 'cloudy',
    'Cloudy': 'cloudy',
    'Rainy': 'rainy',
    'Stormy': 'stormy'
  }

  return weatherMap[config.weather] || 'sunny'
}

/**
 * Get aggregated garden stats by plant for a specific time period
 * Uses activity_logs table (unified activity tracking)
 */
export async function getAggregatedGardenStats(
  period: 'day' | 'week' | 'month' | 'year',
  targetDate?: string // YYYY-MM-DD format, defaults to today
): Promise<AggregatedGardenStats | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Parse date from YYYY-MM-DD string without timezone issues
  let baseYear: number, baseMonth: number, baseDay: number
  if (targetDate) {
    const [y, m, d] = targetDate.split('-').map(Number)
    baseYear = y
    baseMonth = m - 1
    baseDay = d
  } else {
    const now = new Date()
    baseYear = now.getFullYear()
    baseMonth = now.getMonth()
    baseDay = now.getDate()
  }

  const formatDate = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  let startStr: string
  let endStr: string

  switch (period) {
    case 'day':
      startStr = formatDate(baseYear, baseMonth, baseDay)
      endStr = startStr
      break
    case 'week': {
      const baseDate = new Date(baseYear, baseMonth, baseDay)
      const dayOfWeek = baseDate.getDay()
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const startDate = new Date(baseYear, baseMonth, baseDay + diffToMonday)
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + 6)
      startStr = formatDate(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
      endStr = formatDate(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
      break
    }
    case 'month': {
      const lastDay = new Date(baseYear, baseMonth + 1, 0).getDate()
      startStr = formatDate(baseYear, baseMonth, 1)
      endStr = formatDate(baseYear, baseMonth, lastDay)
      break
    }
    case 'year':
      startStr = formatDate(baseYear, 0, 1)
      endStr = formatDate(baseYear, 11, 31)
      break
  }

  // Fetch activity logs with plant info
  // activity_type: 'watering' | 'completed' | 'progress' | 'rest_day' | 'reflection'
  const { data: activities, error: activityError } = await supabase
    .from('activity_logs')
    .select(`
      id,
      plant_id,
      activity_type,
      logged_at,
      logged_date,
      value,
      notes,
      xp_earned,
      is_first_of_day,
      is_personal_record,
      plant:plants(
        id,
        name,
        goal_mode,
        grid_row,
        grid_col,
        grid_size,
        growth_percentage,
        status,
        plant_type:plant_types(id, name, icon)
      )
    `)
    .eq('user_id', user.id)
    .gte('logged_date', startStr)
    .lte('logged_date', endStr)
    .order('logged_at', { ascending: true })

  if (activityError) {
    console.error('Error fetching activity logs:', activityError)
    return null
  }

  // Fetch goals for unit info
  const { data: goals } = await supabase
    .from('goals')
    .select('id, plant_id, unit')
    .eq('season_status', 'active')

  const goalUnitMap = new Map<string, string>()
  for (const goal of goals || []) {
    goalUnitMap.set(goal.plant_id, goal.unit)
  }

  // Group data by plant
  const plantStatsMap = new Map<string, PlantPeriodStats>()

  // Process activity logs
  for (const a of activities || []) {
    const plantData = Array.isArray(a.plant) ? a.plant[0] : a.plant
    if (!plantData) continue

    const plantTypeData = Array.isArray(plantData.plant_type)
      ? plantData.plant_type[0]
      : plantData.plant_type

    const plantId = plantData.id

    if (!plantStatsMap.has(plantId)) {
      plantStatsMap.set(plantId, {
        plant_id: plantId,
        plant_name: plantData.name,
        plant_icon: plantTypeData?.icon || '🌱',
        plant_type_name: plantTypeData?.name || 'Unknown',
        grid_row: plantData.grid_row || 0,
        grid_col: plantData.grid_col || 0,
        grid_size: plantData.grid_size || 1,
        growth_percentage: plantData.growth_percentage || 0,
        status: plantData.status || 'growing',
        watering_count: 0,
        waterings: [],
        total_xp: 0,
        has_goal: !!plantData.goal_mode,
        goal_mode: plantData.goal_mode,
        goal_unit: goalUnitMap.get(plantId),
        goal_logs: [],
      })
    }

    const stats = plantStatsMap.get(plantId)!
    stats.total_xp += a.xp_earned || 0

    // Count waterings (watering, completed, progress types all count as "activity")
    if (a.activity_type === 'watering' || a.activity_type === 'completed' || a.activity_type === 'progress') {
      stats.watering_count++
      stats.waterings.push({
        id: a.id,
        watered_at: a.logged_at,
        xp_earned: a.xp_earned || 0,
        notes: a.notes,
      })
    }

    // Track goal logs for progress type
    if (a.activity_type === 'progress' && a.value !== null) {
      stats.has_goal = true
      if (!stats.goal_logs) stats.goal_logs = []
      stats.goal_logs.push({
        id: a.id,
        value: a.value,
        notes: a.notes,
        logged_at: a.logged_at,
        logged_date: a.logged_date,
      })
    }
  }

  // Calculate goal stats for plants with goals
  for (const stats of plantStatsMap.values()) {
    if (stats.goal_logs && stats.goal_logs.length > 0) {
      const values = stats.goal_logs.map(l => l.value)
      stats.goal_stats = {
        total: values.reduce((a, b) => a + b, 0),
        min: Math.min(...values),
        max: Math.max(...values),
        avg: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
        count: values.length,
      }
    }
  }

  // Fetch mood logs for weather
  const { data: moodLogs } = await supabase
    .from('mood_logs')
    .select('mood_level')
    .eq('user_id', user.id)
    .gte('date', startStr)
    .lte('date', endStr)

  const periodWeather = calculateDominantWeather(moodLogs || [])

  const plants = Array.from(plantStatsMap.values())
  const totalWaterings = plants.reduce((sum, p) => sum + p.watering_count, 0)
  const totalXp = plants.reduce((sum, p) => sum + p.total_xp, 0)

  return {
    period,
    startDate: startStr,
    endDate: endStr,
    plants,
    totalWaterings,
    totalXp,
    uniquePlants: plants.length,
    weather: periodWeather,
  }
}

/**
 * Update plant grid position (for drag-and-drop)
 */
export async function updatePlantPosition(
  plantId: string,
  gridRow: number,
  gridCol: number
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('plants')
    .update({
      grid_row: gridRow,
      grid_col: gridCol,
      updated_at: new Date().toISOString(),
    })
    .eq('id', plantId)
    .eq('user_id', user.id)

  if (error) {
    console.error('Error updating plant position:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/garden')
  return { success: true }
}

/**
 * Expand plant size and resolve conflicts
 * When a plant grows from 1x1 to 2x2 (or larger), check for collisions
 * and relocate conflicting plants to available positions
 */
export async function expandPlantSize(
  plantId: string,
  newSize: number
): Promise<{ success: boolean; relocatedPlants?: string[]; error?: string }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get all living plants
  const { data: allPlants, error: fetchError } = await supabase
    .from('plants')
    .select('id, grid_size, grid_row, grid_col')
    .eq('user_id', user.id)
    .neq('status', 'dead')

  if (fetchError || !allPlants) {
    return { success: false, error: 'Failed to fetch plants' }
  }

  // Find the target plant
  const targetPlant = allPlants.find(p => p.id === plantId)
  if (!targetPlant) {
    return { success: false, error: 'Plant not found' }
  }

  // Calculate cells that would be occupied after expansion
  const newOccupiedCells: { row: number; col: number }[] = []
  for (let r = 0; r < newSize; r++) {
    for (let c = 0; c < newSize; c++) {
      newOccupiedCells.push({
        row: (targetPlant.grid_row || 0) + r,
        col: (targetPlant.grid_col || 0) + c,
      })
    }
  }

  // Find plants that would collide (excluding the target plant)
  const conflictingPlants: typeof allPlants = []
  for (const plant of allPlants) {
    if (plant.id === plantId) continue // Skip self

    const plantSize = plant.grid_size || 1
    const plantCells: { row: number; col: number }[] = []
    for (let r = 0; r < plantSize; r++) {
      for (let c = 0; c < plantSize; c++) {
        plantCells.push({
          row: (plant.grid_row || 0) + r,
          col: (plant.grid_col || 0) + c,
        })
      }
    }

    // Check for collision
    const hasCollision = newOccupiedCells.some(nc =>
      plantCells.some(pc => pc.row === nc.row && pc.col === nc.col)
    )

    if (hasCollision) {
      conflictingPlants.push(plant)
    }
  }

  // Relocate conflicting plants
  const relocatedPlantIds: string[] = []
  const plantsAfterExpansion = allPlants.map(p =>
    p.id === plantId ? { ...p, grid_size: newSize } : p
  )

  for (const conflictPlant of conflictingPlants) {
    // Calculate grid size needed
    const currentGridSize = Math.max(
      ...plantsAfterExpansion.map(p =>
        Math.max(
          (p.grid_row || 0) + (p.grid_size || 1),
          (p.grid_col || 0) + (p.grid_size || 1)
        )
      ),
      3 // Minimum grid size
    )

    // Find new position for the conflicting plant
    const conflictPlantSize = conflictPlant.grid_size || 1
    let newPosition: { row: number; col: number } | null = null

    // Try to find position in current grid, then expand if needed
    for (let gridExpand = 0; gridExpand <= 5; gridExpand++) {
      const tryGridSize = currentGridSize + gridExpand

      for (let row = 0; row <= tryGridSize - conflictPlantSize; row++) {
        for (let col = 0; col <= tryGridSize - conflictPlantSize; col++) {
          // Check if this position would collide
          let positionClear = true

          for (const plant of plantsAfterExpansion) {
            if (plant.id === conflictPlant.id) continue

            const pSize = plant.grid_size || 1
            const pRow = plant.grid_row || 0
            const pCol = plant.grid_col || 0

            // Check overlap
            for (let r = 0; r < conflictPlantSize && positionClear; r++) {
              for (let c = 0; c < conflictPlantSize && positionClear; c++) {
                const testRow = row + r
                const testCol = col + c

                for (let pr = 0; pr < pSize; pr++) {
                  for (let pc = 0; pc < pSize; pc++) {
                    if (testRow === pRow + pr && testCol === pCol + pc) {
                      positionClear = false
                      break
                    }
                  }
                  if (!positionClear) break
                }
              }
            }
          }

          if (positionClear) {
            newPosition = { row, col }
            break
          }
        }
        if (newPosition) break
      }
      if (newPosition) break
    }

    if (newPosition) {
      // Update plant position in our tracking array
      const idx = plantsAfterExpansion.findIndex(p => p.id === conflictPlant.id)
      if (idx !== -1) {
        plantsAfterExpansion[idx] = {
          ...plantsAfterExpansion[idx],
          grid_row: newPosition.row,
          grid_col: newPosition.col,
        }
      }

      // Update in database
      const { error: relocateError } = await supabase
        .from('plants')
        .update({
          grid_row: newPosition.row,
          grid_col: newPosition.col,
          updated_at: new Date().toISOString(),
        })
        .eq('id', conflictPlant.id)
        .eq('user_id', user.id)

      if (!relocateError) {
        relocatedPlantIds.push(conflictPlant.id)
      }
    }
  }

  // Update the target plant's size
  const { error: updateError } = await supabase
    .from('plants')
    .update({
      grid_size: newSize,
      updated_at: new Date().toISOString(),
    })
    .eq('id', plantId)
    .eq('user_id', user.id)

  if (updateError) {
    console.error('Error expanding plant size:', updateError)
    return { success: false, error: updateError.message }
  }

  revalidatePath('/garden')
  return { success: true, relocatedPlants: relocatedPlantIds }
}

export async function getPlant(plantId: string): Promise<PlantWithType | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('plants')
    .select(`
      *,
      plant_type:plant_types(*)
    `)
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching plant:', error)
    return null
  }

  return data as PlantWithType
}

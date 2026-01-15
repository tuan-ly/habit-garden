'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CreatePlantDto, PlantWithType, PlantType, Difficulty } from '@/types/database'
import { getTodayWeather, calculateWeatherXp } from '@/lib/weather-system'
import { calculateWateringXp } from '@/lib/xp-system'

export async function getPlants(): Promise<PlantWithType[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
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

  return data as PlantWithType[]
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

  // Get the next position
  const { data: existingPlants } = await supabase
    .from('plants')
    .select('position')
    .eq('user_id', user.id)
    .order('position', { ascending: false })
    .limit(1)

  const nextPosition = (existingPlants?.[0]?.position ?? 0) + 1

  const { data: newPlant, error } = await supabase
    .from('plants')
    .insert({
      user_id: user.id,
      plant_type_id: dto.plant_type_id,
      name: dto.name,
      habit_description: dto.habit_description || null,
      reminder_time: dto.reminder_time || null,
      reminder_enabled: dto.reminder_enabled ?? true,
      position: nextPosition,
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
  const totalXp = calculateWeatherXp(baseTotal, weather.type)

  // Calculate new moisture and growth with weather modifiers
  const newMoisture = Math.min(100, plant.current_moisture + plantType.moisture_boost)
  const baseGrowth = 100 / plantType.maturity_days
  const weatherGrowth = baseGrowth * weather.growthModifier
  const newGrowth = Math.min(100, plant.growth_percentage + weatherGrowth)
  const totalWaterings = plant.total_waterings + 1

  // Determine if plant has matured
  const hasMatured = newGrowth >= 100 && plant.status === 'growing'

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
      updated_at: new Date().toISOString(),
    })
    .eq('id', plantId)

  if (updateError) {
    console.error('Error updating plant:', updateError)
    return { success: false, error: updateError.message }
  }

  // Update user XP
  await supabase.rpc('increment_user_xp', { user_id: user.id, xp_amount: totalXp })

  // Check for new achievements
  const newAchievements = await checkAndUnlockAchievements(user.id)

  revalidatePath('/garden')
  return {
    success: true,
    xpEarned: totalXp,
    xpBreakdown: breakdown,
    weatherType: weather.type,
    newAchievements,
  }
}

// Check and unlock achievements after an action
async function checkAndUnlockAchievements(userId: string): Promise<string[]> {
  const supabase = await createClient()
  const newlyUnlocked: string[] = []

  // Get user stats for achievement checking
  const { data: plants } = await supabase
    .from('plants')
    .select('status, current_streak, longest_streak, total_waterings')
    .eq('user_id', userId)

  const { data: profile } = await supabase
    .from('profiles')
    .select('xp, level')
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
  plant: {
    id: string
    name: string
    plant_type: {
      id: string
      name: string
      icon: string
    }
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
}

// Get watering logs for a specific time period
export async function getGardenStats(
  period: 'day' | 'week' | 'month' | 'year',
  targetDate?: string // YYYY-MM-DD format, defaults to today
): Promise<GardenStatsData | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Parse date from YYYY-MM-DD string without timezone issues
  // new Date('2026-01-15') parses as UTC midnight, which can shift dates
  // Instead, parse components directly
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

  // Fetch watering logs with plant info
  const { data: waterings, error } = await supabase
    .from('watering_logs')
    .select(`
      id,
      plant_id,
      watered_at,
      watered_date,
      xp_earned,
      plant:plants(
        id,
        name,
        plant_type:plant_types(id, name, icon)
      )
    `)
    .eq('user_id', user.id)
    .gte('watered_date', startStr)
    .lte('watered_date', endStr)
    .order('watered_at', { ascending: true })

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

  // Transform Supabase nested select arrays to objects
  const typedWaterings: WateringLogWithPlant[] = (waterings || [])
    .filter(w => w.plant && w.plant.length > 0)
    .map(w => ({
      id: w.id,
      plant_id: w.plant_id,
      watered_at: w.watered_at,
      watered_date: w.watered_date,
      xp_earned: w.xp_earned,
      plant: {
        id: w.plant[0].id,
        name: w.plant[0].name,
        plant_type: w.plant[0].plant_type?.[0] || { id: '', name: '', icon: '' }
      }
    }))
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

  return {
    period,
    startDate: startStr,
    endDate: endStr,
    waterings: typedWaterings,
    totalWaterings: typedWaterings.length,
    totalXp: typedWaterings.reduce((sum, w) => sum + w.xp_earned, 0),
    uniquePlants: uniquePlantIds.size,
    dailyBreakdown,
  }
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

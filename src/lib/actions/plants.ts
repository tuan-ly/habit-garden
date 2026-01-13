'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { CreatePlantDto, PlantWithType, PlantType } from '@/types/database'

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

export async function createPlant(dto: CreatePlantDto): Promise<{ success: boolean; error?: string }> {
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

  const nextPosition = existingPlants?.[0]?.position ?? 0 + 1

  const { error } = await supabase
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

  if (error) {
    console.error('Error creating plant:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/garden')
  return { success: true }
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

export async function waterPlant(plantId: string, notes?: string): Promise<{
  success: boolean
  xpEarned?: number
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

  // Calculate XP and bonuses
  const baseXp = 10
  const currentHour = new Date().getHours()
  const isMorning = currentHour >= 5 && currentHour < 9
  const morningBonus = isMorning ? 5 : 0

  // Calculate streak
  const lastWateredDate = plant.last_watered_at
    ? new Date(plant.last_watered_at).toISOString().split('T')[0]
    : null
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  let newStreak = 1
  if (lastWateredDate === yesterday) {
    newStreak = plant.current_streak + 1
  }

  const streakBonus = Math.min(Math.floor(newStreak / 7) * 5, 25)
  const totalXp = baseXp + morningBonus + streakBonus

  // Calculate new moisture and growth
  const newMoisture = Math.min(100, plant.current_moisture + plantType.moisture_boost)
  const growthPerWatering = 100 / plantType.maturity_days
  const newGrowth = Math.min(100, plant.growth_percentage + growthPerWatering)
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
      notes: notes || null,
      xp_earned: totalXp,
      morning_bonus: isMorning,
      streak_bonus: streakBonus,
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

  revalidatePath('/garden')
  return { success: true, xpEarned: totalXp }
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

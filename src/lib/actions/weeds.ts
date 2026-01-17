'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface PlantWeeds {
  plant_id: string
  weed_count: number
  last_weed_added: string | null
  weeds_cleared_total: number
}

const XP_PER_WEED = 5
const MAX_WEEDS = 7

// Get weeds for a plant
export async function getPlantWeeds(plantId: string): Promise<PlantWeeds | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Verify plant belongs to user
  const { data: plant } = await supabase
    .from('plants')
    .select('id, user_id, weed_count, last_weed_added, weeds_cleared_total')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (!plant) return null

  return {
    plant_id: plant.id,
    weed_count: plant.weed_count || 0,
    last_weed_added: plant.last_weed_added,
    weeds_cleared_total: plant.weeds_cleared_total || 0,
  }
}

// Get all plants with weeds for the user
export async function getUserPlantsWithWeeds(): Promise<PlantWeeds[]> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: plants } = await supabase
    .from('plants')
    .select('id, weed_count, last_weed_added, weeds_cleared_total')
    .eq('user_id', user.id)
    .gt('weed_count', 0)

  if (!plants) return []

  return plants.map(plant => ({
    plant_id: plant.id,
    weed_count: plant.weed_count || 0,
    last_weed_added: plant.last_weed_added,
    weeds_cleared_total: plant.weeds_cleared_total || 0,
  }))
}

// Clear a single weed (tap to clear)
export async function clearWeed(plantId: string): Promise<{
  success: boolean
  xpEarned?: number
  weedsRemaining?: number
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get current plant state
  const { data: plant } = await supabase
    .from('plants')
    .select('id, user_id, weed_count, weeds_cleared_total')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (!plant) {
    return { success: false, error: 'Plant not found' }
  }

  if (plant.weed_count <= 0) {
    return { success: false, error: 'No weeds to clear' }
  }

  const newWeedCount = plant.weed_count - 1
  const newWeedsCleared = (plant.weeds_cleared_total || 0) + 1

  // Update plant
  const { error: updateError } = await supabase
    .from('plants')
    .update({
      weed_count: newWeedCount,
      weeds_cleared_total: newWeedsCleared,
      updated_at: new Date().toISOString(),
    })
    .eq('id', plantId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Award XP
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp')
    .eq('id', user.id)
    .single()

  if (profile) {
    await supabase
      .from('profiles')
      .update({
        xp: profile.xp + XP_PER_WEED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
  }

  revalidatePath('/garden')
  return {
    success: true,
    xpEarned: XP_PER_WEED,
    weedsRemaining: newWeedCount,
  }
}

// Clear all weeds at once
export async function clearAllWeeds(plantId: string): Promise<{
  success: boolean
  xpEarned?: number
  weedsCleared?: number
  error?: string
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get current plant state
  const { data: plant } = await supabase
    .from('plants')
    .select('id, user_id, weed_count, weeds_cleared_total')
    .eq('id', plantId)
    .eq('user_id', user.id)
    .single()

  if (!plant) {
    return { success: false, error: 'Plant not found' }
  }

  if (plant.weed_count <= 0) {
    return { success: false, error: 'No weeds to clear' }
  }

  const weedsCleared = plant.weed_count
  const xpEarned = weedsCleared * XP_PER_WEED
  const newWeedsCleared = (plant.weeds_cleared_total || 0) + weedsCleared

  // Update plant
  const { error: updateError } = await supabase
    .from('plants')
    .update({
      weed_count: 0,
      weeds_cleared_total: newWeedsCleared,
      updated_at: new Date().toISOString(),
    })
    .eq('id', plantId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  // Award XP
  const { data: profile } = await supabase
    .from('profiles')
    .select('xp')
    .eq('id', user.id)
    .single()

  if (profile) {
    await supabase
      .from('profiles')
      .update({
        xp: profile.xp + xpEarned,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
  }

  revalidatePath('/garden')
  return {
    success: true,
    xpEarned,
    weedsCleared,
  }
}

// Add weeds to plants that haven't been watered (called by cron job)
export async function growWeeds(): Promise<{
  success: boolean
  plantsAffected?: number
  error?: string
}> {
  const supabase = await createClient()

  // Get all plants that haven't been watered today
  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  // Find plants where last_watered_at is before today
  const { data: plants } = await supabase
    .from('plants')
    .select('id, weed_count, last_watered_at')
    .lt('last_watered_at', today)
    .lt('weed_count', MAX_WEEDS)
    .in('status', ['growing', 'mature'])

  if (!plants || plants.length === 0) {
    return { success: true, plantsAffected: 0 }
  }

  // Update each plant
  let plantsAffected = 0
  for (const plant of plants) {
    const lastWatered = plant.last_watered_at
      ? new Date(plant.last_watered_at).toISOString().split('T')[0]
      : null

    // Only add weed if not watered yesterday (give grace period)
    if (lastWatered !== yesterday) {
      const newWeedCount = Math.min(MAX_WEEDS, (plant.weed_count || 0) + 1)

      await supabase
        .from('plants')
        .update({
          weed_count: newWeedCount,
          last_weed_added: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', plant.id)

      plantsAffected++
    }
  }

  return { success: true, plantsAffected }
}

// Get total weeds across all plants
export async function getTotalWeeds(): Promise<number> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data } = await supabase
    .from('plants')
    .select('weed_count')
    .eq('user_id', user.id)

  if (!data) return 0

  return data.reduce((sum, plant) => sum + (plant.weed_count || 0), 0)
}

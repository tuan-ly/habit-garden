'use server'

import { getAuthUser } from '@/lib/auth-cached'
import { DEFAULT_MOOD, type MoodLevel } from '@/lib/mood-system'
import { createClient } from '@/lib/supabase/server'
import type { PlantType, Profile } from '@/types/database'
import { getProfile } from '@/lib/actions/profile'
import { getTodayMood } from '@/lib/actions/mood'
import { getPlantTypes } from '@/lib/actions/plants'

let warnedAboutBootstrapFallback = false

export interface DashboardBootstrap {
  profile: Profile | null
  mood: MoodLevel
  plantTypes: PlantType[]
}

/** Loads all dashboard-shell data in one database request after authentication. */
export async function getDashboardBootstrap(): Promise<DashboardBootstrap> {
  const user = await getAuthUser()
  if (!user) {
    return { profile: null, mood: DEFAULT_MOOD, plantTypes: [] }
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_dashboard_bootstrap')

  if (error) {
    if (!warnedAboutBootstrapFallback) {
      warnedAboutBootstrapFallback = true
      console.warn('get_dashboard_bootstrap unavailable; using compatibility queries:', error.code)
    }
    const [profile, mood, plantTypes] = await Promise.all([
      getProfile(),
      getTodayMood(),
      getPlantTypes(),
    ])
    return { profile, mood, plantTypes }
  }

  const result = data as unknown as {
    profile?: Profile | null
    mood?: number | null
    plant_types?: PlantType[] | null
  }

  return {
    profile: result.profile ?? null,
    mood: (result.mood as MoodLevel | null) ?? DEFAULT_MOOD,
    plantTypes: result.plant_types ?? [],
  }
}

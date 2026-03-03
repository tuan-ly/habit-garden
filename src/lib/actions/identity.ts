'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
  Identity,
  IdentityWithGoals,
  CreateIdentityDto,
  UpdateIdentityDto,
  Goal,
} from '@/types/database'
import { getUserTier } from './subscription'
import { getAuthUser } from '@/lib/auth-cached'

// =====================================================
// Identity CRUD Operations
// =====================================================

/**
 * Get all identities for the current user
 */
export async function getIdentities(): Promise<IdentityWithGoals[]> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('identities')
    .select(`
      *,
      goals(*)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching identities:', error)
    return []
  }

  return data as IdentityWithGoals[]
}

/**
 * Get a single identity with its linked goals
 */
export async function getIdentity(identityId: string): Promise<IdentityWithGoals | null> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('identities')
    .select(`
      *,
      goals(
        *,
        plant:plants(
          id,
          name,
          plant_type:plant_types(icon, name)
        )
      )
    `)
    .eq('id', identityId)
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('Error fetching identity:', error)
    return null
  }

  return data as IdentityWithGoals
}

/**
 * Create a new identity (PREMIUM only)
 */
export async function createIdentity(dto: CreateIdentityDto): Promise<{
  success: boolean
  identity?: Identity
  error?: string
}> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check tier (PREMIUM only)
  const tier = await getUserTier()
  if (tier !== 'premium') {
    return { success: false, error: 'Identity feature requires PREMIUM subscription' }
  }

  // Check for duplicate name
  const { data: existing } = await supabase
    .from('identities')
    .select('id')
    .eq('user_id', user.id)
    .eq('name', dto.name.trim())
    .single()

  if (existing) {
    return { success: false, error: 'An identity with this name already exists' }
  }

  const { data, error } = await supabase
    .from('identities')
    .insert({
      user_id: user.id,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      icon: dto.icon || '🎯',
      color: dto.color || 'purple',
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating identity:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/identity')
  return { success: true, identity: data as Identity }
}

/**
 * Update an identity
 */
export async function updateIdentity(
  identityId: string,
  dto: UpdateIdentityDto
): Promise<{
  success: boolean
  identity?: Identity
  error?: string
}> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('identities')
    .select('id')
    .eq('id', identityId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { success: false, error: 'Identity not found' }
  }

  // Build update object
  const updates: Partial<Identity> = {
    updated_at: new Date().toISOString(),
  }

  if (dto.name !== undefined) {
    // Check for duplicate name (excluding current identity)
    const { data: duplicate } = await supabase
      .from('identities')
      .select('id')
      .eq('user_id', user.id)
      .eq('name', dto.name.trim())
      .neq('id', identityId)
      .single()

    if (duplicate) {
      return { success: false, error: 'An identity with this name already exists' }
    }

    updates.name = dto.name.trim()
  }

  if (dto.description !== undefined) updates.description = dto.description?.trim() || null
  if (dto.icon !== undefined) updates.icon = dto.icon
  if (dto.color !== undefined) updates.color = dto.color
  if (dto.status !== undefined) updates.status = dto.status

  const { data, error } = await supabase
    .from('identities')
    .update(updates)
    .eq('id', identityId)
    .select()
    .single()

  if (error) {
    console.error('Error updating identity:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/identity')
  return { success: true, identity: data as Identity }
}

/**
 * Delete an identity (unlinks all goals, doesn't delete them)
 */
export async function deleteIdentity(identityId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify ownership
  const { data: existing, error: fetchError } = await supabase
    .from('identities')
    .select('id')
    .eq('id', identityId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !existing) {
    return { success: false, error: 'Identity not found' }
  }

  // Delete will cascade to unlink goals (identity_id set to null via ON DELETE SET NULL)
  const { error } = await supabase.from('identities').delete().eq('id', identityId)

  if (error) {
    console.error('Error deleting identity:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/identity')
  return { success: true }
}

// =====================================================
// Goal Linking Operations
// =====================================================

/**
 * Link a goal to an identity
 */
export async function linkGoalToIdentity(
  goalId: string,
  identityId: string
): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify identity ownership
  const { data: identity, error: identityError } = await supabase
    .from('identities')
    .select('id')
    .eq('id', identityId)
    .eq('user_id', user.id)
    .single()

  if (identityError || !identity) {
    return { success: false, error: 'Identity not found' }
  }

  // Verify goal ownership (via plant)
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('id, plant:plants!inner(user_id)')
    .eq('id', goalId)
    .single()

  const plantData = goal?.plant as unknown as { user_id: string } | null
  if (goalError || !goal || !plantData || plantData.user_id !== user.id) {
    return { success: false, error: 'Goal not found' }
  }

  // Link the goal
  const { error } = await supabase
    .from('goals')
    .update({
      identity_id: identityId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)

  if (error) {
    console.error('Error linking goal to identity:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/identity')
  revalidatePath('/garden')
  return { success: true }
}

/**
 * Unlink a goal from its identity
 */
export async function unlinkGoalFromIdentity(goalId: string): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify goal ownership (via plant)
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select('id, identity_id, plant:plants!inner(user_id)')
    .eq('id', goalId)
    .single()

  const plantData2 = goal?.plant as unknown as { user_id: string } | null
  if (goalError || !goal || !plantData2 || plantData2.user_id !== user.id) {
    return { success: false, error: 'Goal not found' }
  }

  if (!goal.identity_id) {
    return { success: true } // Already unlinked
  }

  // Unlink the goal
  const { error } = await supabase
    .from('goals')
    .update({
      identity_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)

  if (error) {
    console.error('Error unlinking goal from identity:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/identity')
  revalidatePath('/garden')
  return { success: true }
}

/**
 * Get all goals not linked to any identity (for linking UI)
 */
export async function getUnlinkedGoals(): Promise<Goal[]> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('goals')
    .select(`
      *,
      plant:plants!inner(
        id,
        user_id,
        name,
        plant_type:plant_types(icon, name)
      )
    `)
    .is('identity_id', null)
    .eq('season_status', 'active')

  if (error) {
    console.error('Error fetching unlinked goals:', error)
    return []
  }

  // Filter by user ownership (via plant)
  return (data || []).filter(
    (goal) => (goal.plant as { user_id: string }).user_id === user.id
  ) as Goal[]
}

// =====================================================
// Identity Progress & Stats
// =====================================================

/**
 * Get identity statistics
 */
export async function getIdentityStats(identityId: string): Promise<{
  totalGoals: number
  activeGoals: number
  completedGoals: number
  averageProgress: number
  totalValue: number
} | null> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) return null

  // Verify ownership
  const { data: identity, error: fetchError } = await supabase
    .from('identities')
    .select('id')
    .eq('id', identityId)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !identity) {
    return null
  }

  // Get goals linked to this identity
  const { data: goals, error } = await supabase
    .from('goals')
    .select('current_value, target_value, season_status')
    .eq('identity_id', identityId)

  if (error) {
    console.error('Error fetching identity stats:', error)
    return null
  }

  const totalGoals = goals?.length || 0
  const activeGoals = goals?.filter((g) => g.season_status === 'active').length || 0
  const completedGoals = goals?.filter((g) => g.season_status === 'completed').length || 0

  // Calculate average progress
  const activeGoalsData = goals?.filter((g) => g.season_status === 'active') || []
  const averageProgress =
    activeGoalsData.length > 0
      ? activeGoalsData.reduce((sum, g) => {
          const progress = g.target_value > 0 ? (g.current_value / g.target_value) * 100 : 0
          return sum + Math.min(progress, 100)
        }, 0) / activeGoalsData.length
      : 0

  // Total accumulated value
  const totalValue = goals?.reduce((sum, g) => sum + (g.current_value || 0), 0) || 0

  return {
    totalGoals,
    activeGoals,
    completedGoals,
    averageProgress: Math.round(averageProgress * 10) / 10,
    totalValue,
  }
}
/**
 * Check if user can create identities
 */
export async function canCreateIdentity(): Promise<boolean> {
  const tier = await getUserTier()
  return tier === 'premium'
}

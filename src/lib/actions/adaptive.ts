'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Goal, GoalLog, GoalAdjustment, AdjustmentType } from '@/types/database'
import { getAuthUser } from '@/lib/auth-cached'
import {
  analyzePerformance,
  detectTrigger,
  generateSuggestion,
  recalculateWeeklyTargets,
  type PerformanceAnalysis,
  type TriggerResult,
  type AdaptiveSuggestion,
} from '@/lib/adaptive-goals'
import { generateProgressionPlan, type ProgressionType } from '@/lib/progression'

export interface AdaptiveAnalysisResult {
  goal: Goal
  analysis: PerformanceAnalysis
  trigger: TriggerResult
  suggestion: AdaptiveSuggestion | null
  pendingAdjustment: GoalAdjustment | null
}

/**
 * Get adaptive analysis for a goal
 */
export async function getAdaptiveAnalysis(goalId: string): Promise<AdaptiveAnalysisResult | null> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) return null

  // Get goal with plant
  const { data: goal, error: goalError } = await supabase
    .from('goals')
    .select(`
      *,
      plant:plants!inner(user_id)
    `)
    .eq('id', goalId)
    .single()

  if (goalError || !goal || (goal.plant as any).user_id !== user.id) {
    return null
  }

  // Get all logs for analysis
  const { data: logs } = await supabase
    .from('goal_logs')
    .select('*')
    .eq('goal_id', goalId)
    .order('logged_at', { ascending: true })

  const goalLogs = (logs || []) as GoalLog[]

  // Check for pending adjustment
  const { data: pendingAdjustment } = await supabase
    .from('goal_adjustments')
    .select('*')
    .eq('goal_id', goalId)
    .is('responded_at', null)
    .order('suggested_at', { ascending: false })
    .limit(1)
    .single()

  // Analyze performance
  const analysis = analyzePerformance(goal as Goal, goalLogs)

  // Detect trigger
  const trigger = detectTrigger(analysis)

  // Generate suggestion if trigger detected
  const suggestion = generateSuggestion(goal as Goal, trigger, analysis)

  return {
    goal: goal as Goal,
    analysis,
    trigger,
    suggestion,
    pendingAdjustment: pendingAdjustment as GoalAdjustment | null,
  }
}

/**
 * Create a new adjustment suggestion (for 'suggest' mode)
 */
export async function createAdjustmentSuggestion(
  goalId: string,
  suggestion: AdaptiveSuggestion
): Promise<{ success: boolean; adjustment?: GoalAdjustment; error?: string }> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify goal belongs to user
  const { data: goal } = await supabase
    .from('goals')
    .select(`
      *,
      plant:plants!inner(user_id)
    `)
    .eq('id', goalId)
    .single()

  if (!goal || (goal.plant as any).user_id !== user.id) {
    return { success: false, error: 'Goal not found' }
  }

  // Check if there's already a pending adjustment
  const { data: existing } = await supabase
    .from('goal_adjustments')
    .select('id')
    .eq('goal_id', goalId)
    .is('responded_at', null)
    .single()

  if (existing) {
    return { success: false, error: 'Already has pending adjustment' }
  }

  const recommendedOption = suggestion.options.find(o => o.isRecommended) || suggestion.options[0]

  const { data: adjustment, error } = await supabase
    .from('goal_adjustments')
    .insert({
      goal_id: goalId,
      adjustment_type: suggestion.type,
      old_value: {
        target_value: goal.target_value,
        duration_weeks: goal.duration_weeks,
        weekly_targets: goal.weekly_targets,
      },
      new_value: recommendedOption.changes.reduce((acc, change) => {
        acc[change.field] = change.newValue
        return acc
      }, {} as Record<string, unknown>),
      trigger_reason: suggestion.description,
      performance_data: suggestion.performanceData,
      auto_applied: false,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating adjustment:', error)
    return { success: false, error: error.message }
  }

  return { success: true, adjustment: adjustment as GoalAdjustment }
}

/**
 * Apply an adjustment (accept suggestion)
 */
export async function applyAdjustment(
  adjustmentId: string,
  optionId: string,
  changes: { field: string; newValue: unknown }[]
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get adjustment with goal
  const { data: adjustment } = await supabase
    .from('goal_adjustments')
    .select(`
      *,
      goal:goals!inner(
        *,
        plant:plants!inner(user_id)
      )
    `)
    .eq('id', adjustmentId)
    .single()

  if (!adjustment || (adjustment.goal as any).plant.user_id !== user.id) {
    return { success: false, error: 'Adjustment not found' }
  }

  const goal = adjustment.goal as Goal

  // Prepare update data
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    last_adjusted_at: new Date().toISOString(),
    adjustment_count: (goal.adjustment_count || 0) + 1,
  }

  let newWeeklyTargets = goal.weekly_targets

  // Apply changes
  for (const change of changes) {
    if (change.field === 'target_value') {
      updateData.target_value = change.newValue
      // Recalculate weekly targets
      newWeeklyTargets = generateProgressionPlan({
        startValue: goal.start_value || 0,
        endValue: change.newValue as number,
        totalWeeks: goal.duration_weeks,
        type: goal.progression_type as ProgressionType,
        stepSize: goal.step_size,
      })
    } else if (change.field === 'duration_weeks') {
      updateData.duration_weeks = change.newValue
      // Recalculate target date and weekly targets
      const targetDate = new Date(goal.started_at)
      targetDate.setDate(targetDate.getDate() + (change.newValue as number) * 7)
      updateData.target_date = targetDate.toISOString()
      newWeeklyTargets = generateProgressionPlan({
        startValue: goal.start_value || 0,
        endValue: Number(goal.target_value),
        totalWeeks: change.newValue as number,
        type: goal.progression_type as ProgressionType,
        stepSize: goal.step_size,
      })
    } else if (change.field === 'recovery_week') {
      // Mark next week as recovery
      const startDate = new Date(goal.started_at)
      const currentWeek = Math.floor(
        (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
      )
      const targets = [...((goal.weekly_targets as number[]) || [])]
      if (targets[currentWeek] !== undefined) {
        targets[currentWeek] = Math.round(targets[currentWeek] * 0.5)
      }
      newWeeklyTargets = targets
    }
  }

  if (newWeeklyTargets !== goal.weekly_targets) {
    updateData.weekly_targets = newWeeklyTargets
  }

  // Update goal
  const { error: goalError } = await supabase
    .from('goals')
    .update(updateData)
    .eq('id', goal.id)

  if (goalError) {
    console.error('Error updating goal:', goalError)
    return { success: false, error: goalError.message }
  }

  // Mark adjustment as responded
  const { error: adjustmentError } = await supabase
    .from('goal_adjustments')
    .update({
      responded_at: new Date().toISOString(),
      response: optionId === 'keep' ? 'rejected' : 'accepted',
      new_value: changes.reduce((acc, c) => ({ ...acc, [c.field]: c.newValue }), {}),
    })
    .eq('id', adjustmentId)

  if (adjustmentError) {
    console.error('Error updating adjustment:', adjustmentError)
    return { success: false, error: adjustmentError.message }
  }

  revalidatePath('/garden')
  return { success: true }
}

/**
 * Reject an adjustment suggestion
 */
export async function rejectAdjustment(adjustmentId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify adjustment belongs to user
  const { data: adjustment } = await supabase
    .from('goal_adjustments')
    .select(`
      *,
      goal:goals!inner(
        plant:plants!inner(user_id)
      )
    `)
    .eq('id', adjustmentId)
    .single()

  if (!adjustment || (adjustment.goal as any).plant.user_id !== user.id) {
    return { success: false, error: 'Adjustment not found' }
  }

  const { error } = await supabase
    .from('goal_adjustments')
    .update({
      responded_at: new Date().toISOString(),
      response: 'rejected',
    })
    .eq('id', adjustmentId)

  if (error) {
    console.error('Error rejecting adjustment:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/garden')
  return { success: true }
}

/**
 * Get adjustment history for a goal
 */
export async function getAdjustmentHistory(goalId: string): Promise<GoalAdjustment[]> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) return []

  const { data: adjustments } = await supabase
    .from('goal_adjustments')
    .select('*')
    .eq('goal_id', goalId)
    .order('suggested_at', { ascending: false })

  return (adjustments || []) as GoalAdjustment[]
}

/**
 * Auto-apply adjustment (for 'auto' mode)
 */
export async function autoApplyAdjustment(goalId: string): Promise<{ success: boolean; applied: boolean; error?: string }> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) {
    return { success: false, applied: false, error: 'Not authenticated' }
  }

  // Get goal with ownership check
  const { data: goal } = await supabase
    .from('goals')
    .select('id, adaptive_mode, target_value, duration_weeks, weekly_targets, plant:plants!inner(user_id)')
    .eq('id', goalId)
    .eq('plant.user_id', user.id)
    .single()

  if (!goal || goal.adaptive_mode !== 'auto') {
    return { success: true, applied: false }
  }

  // Get analysis
  const analysis = await getAdaptiveAnalysis(goalId)
  if (!analysis || !analysis.suggestion) {
    return { success: true, applied: false }
  }

  // Find recommended option
  const recommendedOption = analysis.suggestion.options.find(o => o.isRecommended)
  if (!recommendedOption || recommendedOption.changes.length === 0) {
    return { success: true, applied: false }
  }

  // Create and auto-apply adjustment
  const { data: adjustment, error: createError } = await supabase
    .from('goal_adjustments')
    .insert({
      goal_id: goalId,
      adjustment_type: analysis.suggestion.type,
      old_value: {
        target_value: goal.target_value,
        duration_weeks: goal.duration_weeks,
        weekly_targets: goal.weekly_targets,
      },
      new_value: recommendedOption.changes.reduce((acc, change) => {
        acc[change.field] = change.newValue
        return acc
      }, {} as Record<string, unknown>),
      trigger_reason: analysis.suggestion.description,
      performance_data: analysis.analysis,
      auto_applied: true,
      responded_at: new Date().toISOString(),
      response: 'auto',
    })
    .select()
    .single()

  if (createError) {
    return { success: false, applied: false, error: createError.message }
  }

  // Apply changes to goal
  const result = await applyAdjustment(adjustment.id, recommendedOption.id, recommendedOption.changes)

  return { success: result.success, applied: result.success, error: result.error }
}

/**
 * Activate recovery week for a goal
 */
export async function activateRecoveryWeek(goalId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get goal
  const { data: goal } = await supabase
    .from('goals')
    .select(`
      *,
      plant:plants!inner(user_id)
    `)
    .eq('id', goalId)
    .single()

  if (!goal || (goal.plant as any).user_id !== user.id) {
    return { success: false, error: 'Goal not found' }
  }

  // Calculate current week
  const startDate = new Date(goal.started_at)
  const currentWeek = Math.floor(
    (Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)
  )

  // Reduce current week target by 50%
  const targets = [...((goal.weekly_targets as number[]) || [])]
  if (targets[currentWeek] !== undefined) {
    const oldTarget = targets[currentWeek]
    targets[currentWeek] = Math.round(oldTarget * 0.5)

    // Create adjustment record
    await supabase
      .from('goal_adjustments')
      .insert({
        goal_id: goalId,
        adjustment_type: 'recovery_week',
        old_value: { weekly_target: oldTarget, week: currentWeek },
        new_value: { weekly_target: targets[currentWeek], week: currentWeek },
        trigger_reason: 'User requested recovery week',
        auto_applied: false,
        responded_at: new Date().toISOString(),
        response: 'accepted',
      })

    // Update goal
    const { error } = await supabase
      .from('goals')
      .update({
        weekly_targets: targets,
        last_adjusted_at: new Date().toISOString(),
        adjustment_count: (goal.adjustment_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)

    if (error) {
      return { success: false, error: error.message }
    }
  }

  revalidatePath('/garden')
  return { success: true }
}

/**
 * Update adaptive mode for a goal
 */
export async function updateAdaptiveMode(
  goalId: string,
  mode: 'suggest' | 'auto' | 'off'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const user = await getAuthUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Verify goal belongs to user
  const { data: goal } = await supabase
    .from('goals')
    .select(`
      id,
      plant:plants!inner(user_id)
    `)
    .eq('id', goalId)
    .single()

  if (!goal || (goal.plant as any).user_id !== user.id) {
    return { success: false, error: 'Goal not found' }
  }

  const { error } = await supabase
    .from('goals')
    .update({
      adaptive_mode: mode,
      updated_at: new Date().toISOString(),
    })
    .eq('id', goalId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/garden')
  return { success: true }
}

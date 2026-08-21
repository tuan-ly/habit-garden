'use server'

import { revalidatePath } from 'next/cache'
import { getCapabilityManifest, listCapabilityManifests } from '@/capabilities/core/catalog'
import { getPlantHref } from '@/capabilities/core/routes'
import type { CapabilityKey } from '@/capabilities/core/types'
import { getAuthUser } from '@/lib/auth-cached'
import { createClient } from '@/lib/supabase/server'
import type {
  ActiveCapabilitySession,
  Habit,
  HabitSession,
  PlantCapabilitySummary,
} from '@/types/habits'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SESSION_COLUMNS = [
  'id',
  'habit_id',
  'user_id',
  'source_plant_id',
  'status',
  'target_value',
  'duration_seconds',
  'accumulated_seconds',
  'last_resumed_at',
  'ambient_enabled',
  'result_value',
  'reflection',
  'reward_points',
  'started_at',
  'paused_at',
  'finished_at',
  'completed_at',
  'created_at',
  'updated_at',
].join(',')

export type CapabilityActionErrorCode =
  | 'NOT_AUTHENTICATED'
  | 'NOT_FOUND'
  | 'INVALID_INPUT'
  | 'INVALID_STATE'
  | 'PERSISTENCE_ERROR'

export type CapabilityActionResult<T> =
  | { success: true; data: T }
  | { success: false; code: CapabilityActionErrorCode; error: string }

export interface CapabilityAttachment {
  capabilityKey: CapabilityKey
  habit: Habit
  outcome: 'attached' | 'already_attached'
}

export type CapabilityManagementState = 'active' | 'paused' | 'removed'

export interface CapabilityManagementResult {
  habit: Habit
  state: CapabilityManagementState
}

export interface AttachCapabilityInput {
  plantId: string
  capabilityKey: CapabilityKey
  confirmedIntent?: boolean
}

export async function getPlantCapabilitySummary(
  plantId: string
): Promise<CapabilityActionResult<PlantCapabilitySummary | null>> {
  const user = await getAuthUser()
  if (!user) return fail('NOT_AUTHENTICATED', 'Bạn cần đăng nhập để tải hành trình của cây.')
  if (!UUID_PATTERN.test(plantId)) return fail('INVALID_INPUT', 'Cây được chọn không hợp lệ.')

  const supabase = await createClient()
  const assignment = await supabase
    .from('plant_capability_assignments')
    .select('habit_id')
    .eq('plant_id', plantId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (assignment.error) {
    console.error('Unable to load plant capability assignment:', assignment.error)
    return fail('PERSISTENCE_ERROR', 'Không thể tải hành trình của cây lúc này.')
  }
  if (!assignment.data) return { success: true, data: null }

  const habit = await supabase
    .from('habits')
    .select('id, type, is_active')
    .eq('id', assignment.data.habit_id)
    .eq('user_id', user.id)
    .is('archived_at', null)
    .maybeSingle()

  if (habit.error) {
    console.error('Unable to load plant capability instance:', habit.error)
    return fail('PERSISTENCE_ERROR', 'Không thể tải hành trình của cây lúc này.')
  }
  if (!habit.data) return { success: true, data: null }

  return {
    success: true,
    data: {
      id: habit.data.id,
      plant_id: plantId,
      type: habit.data.type,
      is_active: habit.data.is_active,
    },
  }
}

export async function getActiveCapabilitySession(): Promise<
  CapabilityActionResult<ActiveCapabilitySession | null>
> {
  const user = await getAuthUser()
  if (!user) return fail('NOT_AUTHENTICATED', 'Bạn cần đăng nhập để tải phiên đang mở.')

  const supportedTypes = listCapabilityManifests().map(manifest => manifest.key)
  if (supportedTypes.length === 0) return { success: true, data: null }

  const supabase = await createClient()
  const habitResult = await supabase
    .from('habits')
    .select('id, type')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .is('archived_at', null)
    .in('type', supportedTypes)

  if (habitResult.error) {
    console.error('Unable to load capability instances:', habitResult.error)
    return fail('PERSISTENCE_ERROR', 'Không thể tải phiên đang mở lúc này.')
  }

  const capabilityByHabit = new Map(
    (habitResult.data ?? []).map(habit => [habit.id, habit.type])
  )
  const habitIds = [...capabilityByHabit.keys()]
  if (habitIds.length === 0) return { success: true, data: null }

  const sessionResult = await supabase
    .from('habit_sessions')
    .select(SESSION_COLUMNS)
    .in('habit_id', habitIds)
    .eq('user_id', user.id)
    .eq('status', 'running')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (sessionResult.error) {
    console.error('Unable to load the active capability session:', sessionResult.error)
    return fail('PERSISTENCE_ERROR', 'Không thể tải phiên đang mở lúc này.')
  }
  if (!sessionResult.data) return { success: true, data: null }

  const session = sessionResult.data as unknown as HabitSession
  const assignmentResult = await supabase
    .from('plant_capability_assignments')
    .select('plant_id')
    .eq('habit_id', session.habit_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (assignmentResult.error || !assignmentResult.data) {
    console.error('Unable to resolve the active session plant:', assignmentResult.error)
    return fail('PERSISTENCE_ERROR', 'Không thể xác định cây của phiên đang mở.')
  }

  const capabilityType = capabilityByHabit.get(session.habit_id)
  if (!capabilityType) {
    return fail('PERSISTENCE_ERROR', 'Không thể xác định hành trình của phiên đang mở.')
  }

  return {
    success: true,
    data: {
      ...session,
      plant_id: assignmentResult.data.plant_id,
      capability_type: capabilityType,
    },
  }
}

function fail<T>(
  code: CapabilityActionErrorCode,
  error: string
): CapabilityActionResult<T> {
  return { success: false, code, error }
}

export async function attachCapabilityToPlant(
  input: AttachCapabilityInput
): Promise<CapabilityActionResult<CapabilityAttachment>> {
  const user = await getAuthUser()
  if (!user) return fail('NOT_AUTHENTICATED', 'Bạn cần đăng nhập để chọn hành trình cho cây.')
  if (!UUID_PATTERN.test(input.plantId)) return fail('INVALID_INPUT', 'Cây được chọn không hợp lệ.')

  const manifest = getCapabilityManifest(input.capabilityKey)
  if (!manifest) return fail('INVALID_INPUT', 'Hành trình này chưa được hỗ trợ.')
  if (manifest.eligibility.mode === 'explicit_match' && !input.confirmedIntent) {
    return fail('INVALID_INPUT', manifest.eligibility.confirmationDescription)
  }

  const supabase = await createClient()
  const result = await supabase.rpc('create_plant_capability_instance', {
    p_plant_id: input.plantId,
    p_type: manifest.key,
    p_name: manifest.defaults.name,
    p_description: manifest.defaults.description,
    p_unit: manifest.defaults.unit,
    p_custom_unit: manifest.defaults.customUnit,
    p_session_duration_minutes: manifest.defaults.sessionDurationMinutes,
    p_definition_version: manifest.version,
    p_config: manifest.defaults.config,
  })

  if (result.error || !result.data) {
    console.error('Unable to create plant capability instance:', result.error)

    if (result.error?.code === '23505') {
      return fail('INVALID_STATE', 'Cây này đã có một hành trình khác.')
    }
    if (result.error?.code === '55000') {
      return fail('INVALID_STATE', 'Hãy chọn một cây đang sống để bắt đầu hành trình.')
    }
    if (result.error?.code === '42501') {
      return fail('NOT_FOUND', 'Không tìm thấy cây trong khu vườn của bạn.')
    }
    return fail('PERSISTENCE_ERROR', 'Chưa thể bắt đầu hành trình cho cây lúc này.')
  }

  const payload = result.data as unknown as {
    habit: Habit
    outcome: CapabilityAttachment['outcome']
  }

  revalidatePath('/garden')
  revalidatePath(getPlantHref(input.plantId))

  return {
    success: true,
    data: {
      capabilityKey: manifest.key,
      habit: payload.habit,
      outcome: payload.outcome,
    },
  }
}

async function manageCapabilityInstance(
  plantId: string,
  action: 'pause' | 'resume' | 'remove'
): Promise<CapabilityActionResult<CapabilityManagementResult>> {
  const user = await getAuthUser()
  if (!user) return fail('NOT_AUTHENTICATED', 'Bạn cần đăng nhập để quản lý hành trình.')
  if (!UUID_PATTERN.test(plantId)) return fail('INVALID_INPUT', 'Cây được chọn không hợp lệ.')

  const supabase = await createClient()
  const result = await supabase.rpc('manage_plant_capability_instance', {
    p_plant_id: plantId,
    p_action: action,
  })

  if (result.error || !result.data) {
    console.error('Unable to manage plant capability instance:', result.error)

    if (result.error?.code === '55000') {
      return fail(
        'INVALID_STATE',
        'Hãy khép lại phiên đang mở trước khi thay đổi Hành trình của cây.'
      )
    }
    if (result.error?.code === '42501') {
      return fail('NOT_FOUND', 'Không tìm thấy Hành trình của cây này.')
    }
    if (result.error?.code === '22023') {
      return fail('INVALID_INPUT', 'Thao tác quản lý Hành trình không hợp lệ.')
    }
    return fail('PERSISTENCE_ERROR', 'Chưa thể thay đổi Hành trình của cây lúc này.')
  }

  const payload = result.data as unknown as CapabilityManagementResult
  revalidatePath('/garden')
  revalidatePath(getPlantHref(plantId))

  return { success: true, data: payload }
}

export async function pauseCapabilityOnPlant(
  plantId: string
): Promise<CapabilityActionResult<CapabilityManagementResult>> {
  return manageCapabilityInstance(plantId, 'pause')
}

export async function resumeCapabilityOnPlant(
  plantId: string
): Promise<CapabilityActionResult<CapabilityManagementResult>> {
  return manageCapabilityInstance(plantId, 'resume')
}

export async function removeCapabilityFromPlant(
  plantId: string
): Promise<CapabilityActionResult<CapabilityManagementResult>> {
  return manageCapabilityInstance(plantId, 'remove')
}

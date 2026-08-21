import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve('supabase/migrations/20260728121000_reading_habit_vertical_slice.sql'),
  'utf8'
)
const grantsMigration = readFileSync(
  resolve('supabase/migrations/20260728123500_grant_guided_habit_table_access.sql'),
  'utf8'
)
const sharedCapabilityMigration = readFileSync(
  resolve('supabase/migrations/20260814145405_shared_capability_assignments.sql'),
  'utf8'
)
const isolatedCapabilityMigration = readFileSync(
  resolve('supabase/migrations/20260814234237_isolate_capability_instances_per_plant.sql'),
  'utf8'
)
const capabilityPlatformMigration = readFileSync(
  resolve('supabase/migrations/20260819134213_capability_plugin_platform.sql'),
  'utf8'
)
const actions = readFileSync(
  resolve('src/lib/actions/habit-sessions.ts'),
  'utf8'
)
const capabilityActions = readFileSync(
  resolve('src/lib/actions/capabilities.ts'),
  'utf8'
)
const plantActions = readFileSync(
  resolve('src/lib/actions/plants.ts'),
  'utf8'
)

describe('habit session persistence contract', () => {
  it('creates every reusable model with row-level security', () => {
    for (const table of [
      'habits',
      'goal_plans',
      'habit_sessions',
      'daily_progress',
      'growth_states',
    ]) {
      expect(migration).toContain(`CREATE TABLE public.${table}`)
      expect(migration).toContain(`ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`)
    }
  })

  it('keeps completion atomic, invoker-safe, and ownership scoped', () => {
    const functionStart = migration.indexOf('FUNCTION public.complete_habit_session_atomic')
    expect(functionStart).toBeGreaterThan(-1)
    const functionSql = migration.slice(functionStart)

    expect(functionSql).toContain('SECURITY INVOKER')
    expect(functionSql).toContain("SET search_path = ''")
    expect(functionSql).toContain('user_id = v_user_id')
    expect(functionSql).toContain('FOR UPDATE')
    expect(functionSql).toContain('ON CONFLICT (habit_id, progress_date) DO UPDATE')
    expect(functionSql).toContain('GRANT EXECUTE ON FUNCTION')
  })

  it('prevents duplicate open sessions and uses explicit action selects', () => {
    expect(migration).toContain('habit_sessions_one_open_per_habit')
    expect(migration).toContain("WHERE status IN ('running', 'paused', 'awaiting_completion')")
    expect(actions).not.toMatch(/\.select\(\s*['"`]\*['"`]\s*\)/)
    expect(capabilityActions).not.toMatch(/\.select\(\s*['"`]\*['"`]\s*\)/)
  })

  it('explicitly exposes RLS-protected tables to authenticated users', () => {
    for (const table of [
      'habits',
      'goal_plans',
      'habit_sessions',
      'daily_progress',
      'growth_states',
    ]) {
      expect(grantsMigration).toContain(
        `GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.${table} TO authenticated`
      )
    }
  })

  it('introduces owned plant capability assignments without moving legacy history', () => {
    expect(sharedCapabilityMigration).toContain(
      'CREATE TABLE public.plant_capability_assignments'
    )
    expect(sharedCapabilityMigration).toContain('plant_id UUID PRIMARY KEY')
    expect(sharedCapabilityMigration).toContain('habit_id UUID NOT NULL')
    expect(sharedCapabilityMigration).not.toContain('UNIQUE (habit_id)')
    expect(sharedCapabilityMigration).toContain('habits_id_user_unique UNIQUE (id, user_id)')
    expect(sharedCapabilityMigration).toContain('FOREIGN KEY (plant_id, user_id)')
    expect(sharedCapabilityMigration).toContain('FOREIGN KEY (habit_id, user_id)')
    expect(sharedCapabilityMigration).toContain('REFERENCES public.plants (id, user_id)')
    expect(sharedCapabilityMigration).toContain('REFERENCES public.habits (id, user_id)')
    expect(sharedCapabilityMigration).toContain(
      'ALTER TABLE public.plant_capability_assignments ENABLE ROW LEVEL SECURITY'
    )
    expect(sharedCapabilityMigration).toContain(
      'GRANT SELECT, INSERT, UPDATE, DELETE\n  ON TABLE public.plant_capability_assignments'
    )
    expect(sharedCapabilityMigration).toContain(
      'INSERT INTO public.plant_capability_assignments'
    )
    expect(sharedCapabilityMigration).toContain('FROM public.habits')
    expect(sharedCapabilityMigration).toContain(
      'Failed to preserve every legacy habit-to-plant assignment'
    )
    expect(sharedCapabilityMigration).toContain('DROP CONSTRAINT habits_plant_owner_fkey')
    expect(sharedCapabilityMigration).toContain('ALTER COLUMN plant_id DROP NOT NULL')
    expect(sharedCapabilityMigration).toContain('ON DELETE SET NULL (plant_id)')
    expect(sharedCapabilityMigration).not.toContain('DROP CONSTRAINT habits_plant_unique')
    expect(sharedCapabilityMigration).not.toContain('DROP INDEX public.habits_user_plant_idx')
    expect(sharedCapabilityMigration).not.toContain('DROP COLUMN plant_id')
    expect(sharedCapabilityMigration).not.toMatch(
      /ADD CONSTRAINT habits_plant_owner_fkey[\s\S]*?ON DELETE CASCADE/
    )

    const restoredHabitPolicies = sharedCapabilityMigration.slice(
      sharedCapabilityMigration.indexOf('-- Habit ownership is capability-independent')
    )
    expect(restoredHabitPolicies).toContain(
      'WITH CHECK ((SELECT auth.uid()) = user_id)'
    )
    expect(restoredHabitPolicies).not.toContain('FROM public.plants')
  })

  it('isolates one capability instance, target, and log stream per plant', () => {
    expect(isolatedCapabilityMigration).toContain(
      'DROP CONSTRAINT habits_user_type_unique'
    )
    expect(isolatedCapabilityMigration).toContain(
      'plant_capability_assignments_habit_unique UNIQUE (habit_id)'
    )
    expect(isolatedCapabilityMigration).toContain('capability_instance_splits')
    expect(isolatedCapabilityMigration).toContain(
      'sessions.source_plant_id = splits.plant_id'
    )
    expect(isolatedCapabilityMigration).toContain(
      'INSERT INTO public.daily_progress'
    )
    expect(isolatedCapabilityMigration).toContain(
      'Failed to isolate every capability instance by plant'
    )
  })

  it('mirrors legacy anchor changes additively during the rollout', () => {
    expect(sharedCapabilityMigration).toContain(
      'FUNCTION public.sync_legacy_habit_plant_assignment()'
    )
    expect(sharedCapabilityMigration).toContain(
      'AFTER INSERT OR UPDATE OF plant_id ON public.habits'
    )
    expect(sharedCapabilityMigration).toContain('ON CONFLICT (plant_id) DO NOTHING')
    expect(sharedCapabilityMigration).toContain(
      'Plant % already has a different capability'
    )
    expect(sharedCapabilityMigration).not.toContain(
      'DELETE FROM public.plant_capability_assignments'
    )
  })

  it('preserves each existing session route origin without coupling its history to a plant', () => {
    expect(sharedCapabilityMigration).toContain('ADD COLUMN source_plant_id UUID')
    expect(sharedCapabilityMigration).toContain('SET source_plant_id = habits.plant_id')
    expect(sharedCapabilityMigration).toContain(
      'FOREIGN KEY (source_plant_id, user_id)'
    )
    expect(sharedCapabilityMigration).toContain('ON DELETE SET NULL (source_plant_id)')
    expect(sharedCapabilityMigration).toContain('habit_sessions_source_plant_owner_idx')
    expect(sharedCapabilityMigration).not.toContain(
      'ALTER TABLE public.daily_progress\n  ADD COLUMN source_plant_id'
    )
  })

  it('applies completion side effects once to the session source plant', () => {
    const activityStart = actions.indexOf('const plantActivity = await logActivity')
    const activityEnd = actions.indexOf('if (!plantActivity.success)', activityStart)
    const activityCall = actions.slice(activityStart, activityEnd)

    expect(activityStart).toBeGreaterThan(-1)
    expect(activityEnd).toBeGreaterThan(activityStart)
    expect(actions).toContain('payload.session.source_plant_id')
    expect(activityCall).toContain('mutationId: payload.session.id')
    expect(activityCall).toContain('plant_id: sourcePlant.data')
    expect(activityCall).toContain("activity_type: 'completed'")
    expect(activityCall).not.toContain('value:')
  })

  it('loads the Reading plant by its attachment within the current user scope', () => {
    const snapshotStart = actions.indexOf('export async function getReadingJourneySnapshot')
    const snapshotEnd = actions.indexOf('export async function startReadingSession', snapshotStart)
    expect(snapshotStart).toBeGreaterThan(-1)
    expect(snapshotEnd).toBeGreaterThan(snapshotStart)
    const snapshotAction = actions.slice(snapshotStart, snapshotEnd)

    expect(snapshotAction).toContain(".from('plants')")
    expect(snapshotAction).toContain(".select('*, plant_type:plant_types(*)')")
    expect(snapshotAction).toContain(".eq('id', plantId)")
    expect(snapshotAction).toContain(".eq('user_id', user.id)")
    expect(snapshotAction).toContain('plant: asPlant(plantResult.data)')
  })

  it('resolves Reading from the requested owned plant instead of a global route', () => {
    const loadStart = actions.indexOf('async function loadAssignedReadingHabit')
    const loadEnd = actions.indexOf('async function resolveAssignedPlantId', loadStart)
    const loadAction = actions.slice(loadStart, loadEnd)
    const ensureStart = actions.indexOf('async function ensureReadingJourney')
    const ensureEnd = actions.indexOf('async function loadReadingJourneyByHabit', ensureStart)
    const ensureAction = actions.slice(ensureStart, ensureEnd)
    const snapshotStart = actions.indexOf('export async function getReadingJourneySnapshot')
    const snapshotEnd = actions.indexOf('export async function startReadingSession', snapshotStart)
    const snapshotAction = actions.slice(snapshotStart, snapshotEnd)

    expect(loadStart).toBeGreaterThan(-1)
    expect(loadEnd).toBeGreaterThan(loadStart)
    expect(loadAction).toContain(".from('plant_capability_assignments')")
    expect(loadAction).toContain(".select('habit_id')")
    expect(loadAction).toContain(".eq('plant_id', plantId)")
    expect(loadAction).toContain(".eq('user_id', userId)")
    expect(loadAction).toContain(".eq('type', READING_HABIT_TEMPLATE.type)")
    expect(loadAction).toContain(".eq('is_active', true)")
    expect(ensureAction).toContain('loadAssignedReadingHabit(supabase, userId, plantId)')
    expect(ensureAction.match(/onConflict: 'habit_id,user_id'/g)).toHaveLength(2)
    expect(snapshotAction).toContain('ensureReadingJourney(user.id, plantId)')
  })

  it('keeps the Reading attachment as a compatibility wrapper over the generic lifecycle', () => {
    expect(actions).toContain('attachReadingCapabilityToPlant')
    expect(actions).toContain('attachCapabilityToPlant({')
    expect(actions).toContain("capabilityKey: 'reading'")
    expect(actions).toContain('confirmedIntent: true')
    expect(actions).not.toContain(".update({ plant_id: plantId })")
    expect(actions).not.toContain("'moved'")
    expect(actions).not.toContain('createPlant({')
    expect(actions).not.toContain('deletePlant(')
  })

  it('creates a capability instance and assignment through one invoker-safe RPC', () => {
    const functionStart = capabilityPlatformMigration.indexOf(
      'FUNCTION public.create_plant_capability_instance'
    )
    const functionSql = capabilityPlatformMigration.slice(functionStart)
    const lockPosition = functionSql.indexOf('pg_advisory_xact_lock')
    const habitInsertPosition = functionSql.indexOf('INSERT INTO public.habits')
    const assignmentInsertPosition = functionSql.indexOf(
      'INSERT INTO public.plant_capability_assignments'
    )

    expect(capabilityPlatformMigration).toContain('ADD COLUMN config JSONB')
    expect(capabilityPlatformMigration).toContain('ADD COLUMN definition_version INTEGER')
    expect(capabilityPlatformMigration).toContain('ADD COLUMN archived_at TIMESTAMPTZ')
    expect(capabilityPlatformMigration).toContain('GRANT SELECT (id, user_id, status)')
    expect(capabilityPlatformMigration).toContain('ON TABLE public.plants')
    expect(functionStart).toBeGreaterThan(-1)
    expect(functionSql).toContain('SECURITY INVOKER')
    expect(functionSql).toContain("SET search_path = ''")
    expect(functionSql).toContain('v_user_id UUID := (SELECT auth.uid())')
    expect(functionSql).toContain('plants.user_id = v_user_id')
    expect(functionSql).toContain('pg_catalog.hashtextextended(p_plant_id::text, 0)')
    expect(lockPosition).toBeGreaterThan(-1)
    expect(habitInsertPosition).toBeGreaterThan(lockPosition)
    expect(assignmentInsertPosition).toBeGreaterThan(habitInsertPosition)
    expect(functionSql).toContain("'outcome', 'already_attached'")
    expect(functionSql).toContain("'outcome', 'attached'")
    expect(functionSql).toContain('REVOKE ALL ON FUNCTION')
    expect(functionSql).toContain('FROM PUBLIC')
    expect(functionSql).toContain('FROM anon')
    expect(functionSql).toContain('TO authenticated')

    expect(capabilityActions).toContain(".rpc('create_plant_capability_instance'")
    expect(capabilityActions).toContain('p_type: manifest.key')
    expect(capabilityActions).toContain('p_definition_version: manifest.version')
    expect(capabilityActions).toContain('p_config: manifest.defaults.config')
    expect(capabilityActions).not.toContain("capabilityKey === 'reading'")
  })

  it('resolves the newest active session across registered capability types', () => {
    const activeStart = capabilityActions.indexOf(
      'export async function getActiveCapabilitySession'
    )
    const attachStart = capabilityActions.indexOf(
      'export async function attachCapabilityToPlant',
      activeStart
    )
    const activeAction = capabilityActions.slice(activeStart, attachStart)

    expect(activeStart).toBeGreaterThan(-1)
    expect(activeAction).toContain('listCapabilityManifests()')
    expect(activeAction).toContain(".in('type', supportedTypes)")
    expect(activeAction).toContain(".eq('status', 'running')")
    expect(activeAction).toContain(".from('plant_capability_assignments')")
    expect(activeAction).toContain('capability_type: capabilityType')
    expect(activeAction.toLowerCase()).not.toContain('reading')
  })

  it('pauses or removes a capability without deleting its session history', () => {
    const functionStart = capabilityPlatformMigration.indexOf(
      'FUNCTION public.manage_plant_capability_instance'
    )
    const functionSql = capabilityPlatformMigration.slice(functionStart)

    expect(functionStart).toBeGreaterThan(-1)
    expect(functionSql).toContain('SECURITY INVOKER')
    expect(functionSql).toContain("SET search_path = ''")
    expect(functionSql).toContain("p_action NOT IN ('pause', 'resume', 'remove')")
    expect(functionSql).toContain('FOR UPDATE OF assignments, habits')
    expect(functionSql).toContain(
      "sessions.status IN ('running', 'paused', 'awaiting_completion')"
    )
    expect(functionSql).toContain('SET is_active = FALSE')
    expect(functionSql).toContain('SET is_active = TRUE')
    expect(functionSql).toContain('archived_at = COALESCE(habits.archived_at, now())')
    expect(functionSql).toContain('DELETE FROM public.plant_capability_assignments')
    expect(functionSql).not.toContain('DELETE FROM public.habit_sessions')
    expect(functionSql).not.toContain('DELETE FROM public.daily_progress')
    expect(functionSql).not.toContain('DELETE FROM public.growth_states')
    expect(functionSql).toContain(
      'GRANT EXECUTE ON FUNCTION public.manage_plant_capability_instance(UUID, TEXT) TO authenticated'
    )

    expect(capabilityActions).toContain(".rpc('manage_plant_capability_instance'")
    expect(capabilityActions).toContain("action: 'pause' | 'resume' | 'remove'")
    expect(capabilityActions).toContain("return manageCapabilityInstance(plantId, 'pause')")
    expect(capabilityActions).toContain("return manageCapabilityInstance(plantId, 'resume')")
    expect(capabilityActions).toContain("return manageCapabilityInstance(plantId, 'remove')")
  })

  it('projects each assigned capability instance onto its own garden plant', () => {
    expect(plantActions).toContain(".from('plant_capability_assignments')")
    expect(plantActions).toContain(".select('plant_id, habit_id')")
    expect(plantActions).toContain(".in('plant_id', plantIds)")
    expect(plantActions).toContain(".in('id', habitIds)")
    expect(plantActions).toContain('id: habit.id')
    expect(plantActions).toContain('plant_id: assignment.plant_id')
    expect(plantActions).not.toContain(".select('id, plant_id, type, is_active')")
  })
})

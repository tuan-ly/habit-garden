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
const plantCapabilityMigration = readFileSync(
  resolve('supabase/migrations/20260729155039_attach_habits_to_plants.sql'),
  'utf8'
)
const actions = readFileSync(
  resolve('src/lib/actions/habit-sessions.ts'),
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

  it('attaches each guided habit to an owned persisted plant', () => {
    expect(plantCapabilityMigration).toContain('ADD COLUMN plant_id UUID')
    expect(plantCapabilityMigration).toContain('habits_plant_unique UNIQUE (plant_id)')
    expect(plantCapabilityMigration).toContain('FOREIGN KEY (plant_id, user_id)')
    expect(plantCapabilityMigration).toContain('REFERENCES public.plants (id, user_id)')
    expect(plantCapabilityMigration).toContain('plants.user_id = (SELECT auth.uid())')
  })

  it('synchronizes completion to the linked plant idempotently', () => {
    expect(actions).toContain('mutationId: payload.session.id')
    expect(actions).toContain('plant_id: ensured.data.habit.plant_id')
  })

  it('attaches Reading explicitly instead of provisioning a hidden plant', () => {
    expect(actions).toContain('attachReadingCapabilityToPlant')
    expect(actions).toContain(".update({ plant_id: plantId })")
    expect(actions).toContain("outcome: existing ? 'moved' : 'attached'")
    expect(actions).not.toContain('createPlant({')
    expect(actions).not.toContain('deletePlant(')
    expect(actions).toContain('Hãy chọn một cây trong khu vườn')
  })
})

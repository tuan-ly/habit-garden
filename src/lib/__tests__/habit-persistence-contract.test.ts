import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve('supabase/migrations/20260728121000_reading_habit_vertical_slice.sql'),
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
})


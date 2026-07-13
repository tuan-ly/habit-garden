import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve('supabase/migrations/20260713061331_dashboard_performance_read_models_and_activity_rpc.sql'),
  'utf8'
)

describe('dashboard performance migration contract', () => {
  it('keeps read models and activity mutation invoker-safe', () => {
    for (const functionName of [
      'get_dashboard_bootstrap',
      'get_garden_snapshot',
      'record_activity_atomic',
    ]) {
      const start = migration.indexOf(`FUNCTION public.${functionName}`)
      expect(start).toBeGreaterThan(-1)
      expect(migration.slice(start, start + 900)).toContain('SECURITY INVOKER')
      expect(migration.slice(start, start + 900)).toContain("SET search_path = ''")
    }
  })

  it('guards ownership and concurrent idempotent retries', () => {
    expect(migration).toContain('p.user_id = v_user_id')
    expect(migration.match(/FROM public\.mutation_receipts mr/g)).toHaveLength(2)
    expect(migration).toContain("jsonb_build_object('code', 'ALREADY_APPLIED')")
    expect(migration).toContain('FOR UPDATE')
  })

  it('contains the hot-path composite indexes', () => {
    expect(migration).toContain('ON public.goal_logs(goal_id, logged_at DESC)')
    expect(migration).toContain('ON public.mood_logs(user_id, date)')
    expect(migration).toContain('ON public.activity_logs(user_id, plant_id, logged_date)')
  })
})

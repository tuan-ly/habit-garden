import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve('supabase/migrations/20260823143710_daily_habit_notifications.sql'),
  'utf8'
)
const actions = readFileSync(
  resolve('src/lib/actions/notifications.ts'),
  'utf8'
)
const webPushMigration = readFileSync(
  resolve('supabase/migrations/20260829221041_web_push_delivery.sql'),
  'utf8'
)
const webPushFunction = readFileSync(
  resolve('supabase/functions/push-notifications/index.ts'),
  'utf8'
)
const pushWorker = readFileSync(resolve('worker/index.js'), 'utf8')

describe('daily habit notification persistence contract', () => {
  it('deduplicates one scheduled reminder per user, habit, and local date', () => {
    expect(migration).toContain('ADD COLUMN IF NOT EXISTS dedupe_key TEXT')
    expect(migration).toContain('notifications_user_dedupe_key_unique')
    expect(migration).toContain("'habit-reminder:' || item.plant_id::TEXT || ':' || item.local_date::TEXT")
    expect(migration).toContain(
      'ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL'
    )
  })

  it('dispatches by the owner timezone and respects both global and per-habit switches', () => {
    expect(migration).toContain("'Asia/Ho_Chi_Minh'")
    expect(migration).toContain('TIMEZONE(COALESCE(NULLIF(pr.timezone')
    expect(migration).toContain('schedule.scheduled_local_at::DATE AS local_date')
    expect(migration).toContain("schedule.scheduled_local_at + INTERVAL '10 minutes'")
    expect(migration).toContain('pr.daily_reminder_enabled = TRUE')
    expect(migration).toContain('p.reminder_enabled = TRUE')
    expect(migration).toContain('p.reminder_time IS NOT NULL')
  })

  it('uses goal and capability progress without nagging completed habits', () => {
    expect(migration).toContain('FROM public.goal_logs log')
    expect(migration).toContain('FROM public.daily_progress daily')
    expect(migration).toContain('FROM public.activity_logs activity')
    expect(migration).toContain('target.local_date::TIMESTAMP AT TIME ZONE target.user_timezone')
    expect(migration).toContain('item.completed_value < item.period_target')
    expect(migration).toContain('item.has_activity_today = FALSE')
    expect(migration).toContain("THEN 'goal_warning'")
  })

  it('keeps the dispatcher private, invoker-safe, and cron scheduled', () => {
    const functionStart = migration.indexOf(
      'FUNCTION private.dispatch_due_habit_reminders'
    )
    expect(functionStart).toBeGreaterThan(-1)
    const functionSql = migration.slice(functionStart)
    expect(functionSql).toContain('SECURITY INVOKER')
    expect(functionSql).toContain("SET search_path = ''")
    expect(functionSql).toContain("'habit-reminder-dispatcher'")
    expect(functionSql).toContain("'*/5 * * * *'")
    expect(functionSql).toContain(
      'REVOKE ALL ON FUNCTION private.dispatch_due_habit_reminders'
    )
  })

  it('limits inbox writes and scopes reminder mutations to the authenticated owner', () => {
    expect(migration).toContain('GRANT SELECT ON TABLE public.notifications TO authenticated')
    expect(migration).toContain('GRANT UPDATE (read) ON TABLE public.notifications TO authenticated')
    expect(migration).toContain('WITH CHECK ((SELECT auth.uid()) = user_id)')
    expect(actions).toContain(".eq('user_id', user.id)")
    expect(actions).toContain(".select('id')")
    expect(actions).not.toMatch(/\.select\(\s*['\"`]\*['\"`]\s*\)/)
  })

  it('stores browser subscriptions behind owner RLS without exposing delivery rows', () => {
    expect(webPushMigration).toContain('CREATE TABLE public.push_subscriptions')
    expect(webPushMigration).toContain('ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY')
    expect(webPushMigration).toContain('WITH CHECK ((SELECT auth.uid()) = user_id)')
    expect(webPushMigration).toContain(
      'REVOKE ALL ON TABLE public.notification_push_deliveries FROM PUBLIC, anon, authenticated'
    )
    expect(actions).toContain(".from('push_subscriptions')")
    expect(actions).toContain(".eq('user_id', user.id)")
  })

  it('queues one delivery per device and invokes the Edge dispatcher through Vault', () => {
    expect(webPushMigration).toContain('CREATE EXTENSION IF NOT EXISTS pg_net')
    expect(webPushMigration).toContain('notifications_enqueue_web_push')
    expect(webPushMigration).toContain('ON CONFLICT (notification_id, subscription_id) DO NOTHING')
    expect(webPushMigration).toContain('habit_garden_project_url')
    expect(webPushMigration).toContain('habit_garden_secret_key')
    expect(webPushMigration).toContain("'habit-web-push-dispatcher'")
    expect(webPushMigration).toContain("'* * * * *'")
  })

  it('uses secret-only Edge auth with retries and expired-subscription cleanup', () => {
    expect(webPushFunction).toContain('withSupabase({ auth: ["secret"] }')
    expect(webPushFunction).toContain('VAPID_PRIVATE_KEY')
    expect(webPushFunction).toContain('notification_push_deliveries')
    expect(webPushFunction).toContain('details.statusCode === 404 || details.statusCode === 410')
    expect(webPushFunction).toContain('status: permanentlyFailed ? "failed" : "retry"')
  })

  it('shows incoming pushes from the generated PWA worker and handles safe app navigation', () => {
    expect(pushWorker).toContain("addEventListener('push'")
    expect(pushWorker).toContain('self.registration.showNotification')
    expect(pushWorker).toContain("addEventListener('notificationclick'")
    expect(pushWorker).toContain('targetUrl.origin !== self.location.origin')
  })
})

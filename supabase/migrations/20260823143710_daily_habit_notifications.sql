-- Persist one inbox reminder per habit and local date, then dispatch due rows
-- from pg_cron. Native clients mirror these schedules with local notifications.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS dedupe_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS notifications_user_dedupe_key_unique
  ON public.notifications(user_id, dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_user_plant_logged_at
  ON public.activity_logs(user_id, plant_id, logged_at DESC);

COMMENT ON COLUMN public.notifications.dedupe_key IS
  'Optional idempotency key for scheduled/system notifications.';

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications"
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own notifications"
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

REVOKE ALL ON TABLE public.notifications FROM anon, authenticated;
GRANT SELECT ON TABLE public.notifications TO authenticated;
GRANT UPDATE (read) ON TABLE public.notifications TO authenticated;

-- This legacy helper is only for trusted database functions and cron jobs.
REVOKE ALL ON FUNCTION public.create_notification(
  UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_unread_notification_count(UUID)
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mark_notifications_read(UUID[])
  FROM PUBLIC, anon, authenticated;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.dispatch_due_habit_reminders(
  p_now TIMESTAMPTZ DEFAULT NOW()
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_inserted INTEGER;
BEGIN
  WITH reminder_clock AS (
    SELECT
      p.id AS plant_id,
      p.user_id,
      p.name AS plant_name,
      COALESCE(NULLIF(BTRIM(p.why_i_started), ''), NULLIF(BTRIM(p.habit_description), '')) AS motivation,
      p.reminder_time,
      COALESCE(NULLIF(pr.timezone, ''), 'Asia/Ho_Chi_Minh') AS user_timezone,
      TIMEZONE(COALESCE(NULLIF(pr.timezone, ''), 'Asia/Ho_Chi_Minh'), p_now) AS local_now,
      g.id AS goal_id,
      g.goal_mode,
      g.frequency,
      g.target_value,
      g.weekly_targets,
      g.started_at AS goal_started_at,
      g.unit AS goal_unit,
      assignment.habit_id,
      habit.unit AS habit_unit,
      habit.custom_unit,
      growth.current_target AS habit_target
    FROM public.plants p
    JOIN public.profiles pr ON pr.id = p.user_id
    LEFT JOIN LATERAL (
      SELECT
        goal.id,
        goal.goal_mode,
        goal.frequency,
        goal.target_value,
        goal.weekly_targets,
        goal.started_at,
        goal.unit
      FROM public.goals goal
      WHERE goal.plant_id = p.id
        AND goal.season_status = 'active'
      ORDER BY goal.created_at DESC
      LIMIT 1
    ) g ON TRUE
    LEFT JOIN public.plant_capability_assignments assignment
      ON assignment.plant_id = p.id
      AND assignment.user_id = p.user_id
    LEFT JOIN public.habits habit
      ON habit.id = assignment.habit_id
      AND habit.user_id = p.user_id
      AND habit.is_active = TRUE
      AND habit.archived_at IS NULL
    LEFT JOIN public.growth_states growth
      ON growth.habit_id = habit.id
      AND growth.user_id = p.user_id
    WHERE pr.daily_reminder_enabled = TRUE
      AND p.reminder_enabled = TRUE
      AND p.reminder_time IS NOT NULL
      AND p.status <> 'dead'
  ),
  due AS (
    SELECT
      clock.*,
      schedule.scheduled_local_at::DATE AS local_date,
      GREATEST(
        1,
        FLOOR(
          (
            schedule.scheduled_local_at::DATE
            - COALESCE(
              TIMEZONE(clock.user_timezone, clock.goal_started_at)::DATE,
                schedule.scheduled_local_at::DATE
              )
          ) / 7.0
        )::INTEGER + 1
      ) AS goal_week_number,
      GREATEST(
        1,
        (
          EXTRACT(YEAR FROM AGE(
            DATE_TRUNC('month', schedule.scheduled_local_at::DATE),
            DATE_TRUNC('month', COALESCE(
              TIMEZONE(clock.user_timezone, clock.goal_started_at)::DATE,
              schedule.scheduled_local_at::DATE
            ))
          )) * 12
          + EXTRACT(MONTH FROM AGE(
            DATE_TRUNC('month', schedule.scheduled_local_at::DATE),
            DATE_TRUNC('month', COALESCE(
              TIMEZONE(clock.user_timezone, clock.goal_started_at)::DATE,
              schedule.scheduled_local_at::DATE
            ))
          ))
        )::INTEGER + 1
      ) AS goal_month_number
    FROM reminder_clock clock
    CROSS JOIN LATERAL (
      SELECT
        clock.local_now::DATE + clock.reminder_time
        - CASE
            WHEN clock.local_now::TIME < clock.reminder_time THEN INTERVAL '1 day'
            ELSE INTERVAL '0 days'
          END AS scheduled_local_at
    ) schedule
    WHERE clock.local_now >= schedule.scheduled_local_at
      AND clock.local_now < schedule.scheduled_local_at + INTERVAL '10 minutes'
  ),
  goal_target AS (
    SELECT
      due.*,
      CASE
        WHEN due.goal_id IS NULL THEN due.habit_target
        WHEN due.frequency = 'daily' AND due.goal_mode = 'total_progress' THEN
          ROUND((
            CASE
              WHEN JSONB_TYPEOF(COALESCE(due.weekly_targets::JSONB, '[]'::JSONB)) = 'array'
                AND JSONB_ARRAY_LENGTH(COALESCE(due.weekly_targets::JSONB, '[]'::JSONB)) > 0
              THEN (
                due.weekly_targets::JSONB ->> LEAST(
                  due.goal_week_number - 1,
                  JSONB_ARRAY_LENGTH(due.weekly_targets::JSONB) - 1
                )
              )::NUMERIC
              ELSE due.target_value
            END
          ) / 7.0, 1)
        WHEN due.frequency IN ('daily', 'weekly') THEN
          CASE
            WHEN JSONB_TYPEOF(COALESCE(due.weekly_targets::JSONB, '[]'::JSONB)) = 'array'
              AND JSONB_ARRAY_LENGTH(COALESCE(due.weekly_targets::JSONB, '[]'::JSONB)) > 0
            THEN (
              due.weekly_targets::JSONB ->> LEAST(
                due.goal_week_number - 1,
                JSONB_ARRAY_LENGTH(due.weekly_targets::JSONB) - 1
              )
            )::NUMERIC
            ELSE due.target_value
          END
        WHEN due.frequency = 'monthly' AND due.goal_mode = 'total_progress' THEN
          (
            SELECT SUM(
              CASE
                WHEN JSONB_ARRAY_LENGTH(COALESCE(due.weekly_targets::JSONB, '[]'::JSONB)) > 0
                THEN (
                  due.weekly_targets::JSONB ->> LEAST(
                    ((due.goal_month_number - 1) * 4) + week_offset,
                    JSONB_ARRAY_LENGTH(due.weekly_targets::JSONB) - 1
                  )
                )::NUMERIC
                ELSE due.target_value
              END
            )
            FROM GENERATE_SERIES(0, 3) AS offsets(week_offset)
          )
        WHEN due.frequency = 'monthly' THEN
          CASE
            WHEN JSONB_ARRAY_LENGTH(COALESCE(due.weekly_targets::JSONB, '[]'::JSONB)) > 0
            THEN (
              due.weekly_targets::JSONB ->> LEAST(
                (due.goal_month_number * 4) - 1,
                JSONB_ARRAY_LENGTH(due.weekly_targets::JSONB) - 1
              )
            )::NUMERIC
            ELSE due.target_value
          END
        ELSE due.target_value
      END AS period_target,
      CASE
        WHEN due.goal_id IS NULL THEN due.local_date
        WHEN due.frequency = 'daily' THEN due.local_date
        WHEN due.frequency = 'monthly' THEN DATE_TRUNC('month', due.local_date::TIMESTAMP)::DATE
        ELSE COALESCE(
          TIMEZONE(due.user_timezone, due.goal_started_at)::DATE,
          due.local_date
        ) + ((due.goal_week_number - 1) * 7)
      END AS period_start,
      CASE
        WHEN due.goal_id IS NULL THEN due.local_date
        WHEN due.frequency = 'daily' THEN due.local_date
        WHEN due.frequency = 'monthly' THEN
          (DATE_TRUNC('month', due.local_date::TIMESTAMP) + INTERVAL '1 month - 1 day')::DATE
        ELSE COALESCE(
          TIMEZONE(due.user_timezone, due.goal_started_at)::DATE,
          due.local_date
        ) + ((due.goal_week_number - 1) * 7) + 6
      END AS period_end
    FROM due
  ),
  progress AS (
    SELECT
      target.*,
      COALESCE(legacy_progress.completed_value, capability_progress.completed_value, 0) AS completed_value,
      EXISTS (
        SELECT 1
        FROM public.activity_logs activity
        WHERE activity.user_id = target.user_id
          AND activity.plant_id = target.plant_id
          AND activity.logged_at >= (
            target.local_date::TIMESTAMP AT TIME ZONE target.user_timezone
          )
          AND activity.logged_at < (
            (target.local_date + 1)::TIMESTAMP AT TIME ZONE target.user_timezone
          )
      ) AS has_activity_today
    FROM goal_target target
    LEFT JOIN LATERAL (
      SELECT CASE
        WHEN target.goal_mode = 'total_progress' THEN COALESCE(SUM(log.value), 0)
        ELSE COALESCE(MAX(log.value), 0)
      END AS completed_value
      FROM public.goal_logs log
      WHERE target.goal_id IS NOT NULL
        AND log.goal_id = target.goal_id
        AND TIMEZONE(target.user_timezone, log.logged_at)::DATE
          BETWEEN target.period_start AND target.period_end
    ) legacy_progress ON target.goal_id IS NOT NULL
    LEFT JOIN LATERAL (
      SELECT daily.completed_value
      FROM public.daily_progress daily
      WHERE target.habit_id IS NOT NULL
        AND daily.habit_id = target.habit_id
        AND daily.user_id = target.user_id
        AND daily.progress_date = target.local_date
      LIMIT 1
    ) capability_progress ON target.habit_id IS NOT NULL
  ),
  inserted AS (
    INSERT INTO public.notifications (
      user_id,
      type,
      title,
      title_vi,
      message,
      message_vi,
      data,
      dedupe_key
    )
    SELECT
      item.user_id,
      CASE
        WHEN item.period_target IS NOT NULL AND item.completed_value > 0 THEN 'goal_warning'
        ELSE 'habit_reminder'
      END,
      CASE
        WHEN item.period_target IS NOT NULL AND item.completed_value > 0
          THEN 'One more step for ' || item.plant_name
        ELSE 'Time to care for ' || item.plant_name
      END,
      CASE
        WHEN item.period_target IS NOT NULL AND item.completed_value > 0
          THEN 'Còn một bước với ' || item.plant_name
        ELSE 'Đến giờ chăm ' || item.plant_name
      END,
      CASE
        WHEN item.period_target IS NOT NULL AND item.completed_value > 0 THEN
          'You have completed ' || ROUND(item.completed_value, 1)::TEXT || '/' ||
          ROUND(item.period_target, 1)::TEXT || ' ' ||
          COALESCE(item.goal_unit, item.custom_unit, item.habit_unit, '') ||
          '. A small step still counts.'
        WHEN item.period_target IS NOT NULL THEN
          'Your goal ' ||
          CASE item.frequency
            WHEN 'monthly' THEN 'this month'
            WHEN 'weekly' THEN 'this week'
            ELSE 'today'
          END || ' is ' || ROUND(item.period_target, 1)::TEXT || ' ' ||
          COALESCE(item.goal_unit, item.custom_unit, item.habit_unit, '') ||
          '. A small step still counts.'
        ELSE COALESCE(item.motivation, 'A small step is enough to keep your rhythm alive.')
      END,
      CASE
        WHEN item.period_target IS NOT NULL AND item.completed_value > 0 THEN
          'Bạn đã hoàn thành ' || ROUND(item.completed_value, 1)::TEXT || '/' ||
          ROUND(item.period_target, 1)::TEXT || ' ' ||
          CASE COALESCE(item.goal_unit, item.habit_unit)
            WHEN 'pages' THEN 'trang'
            WHEN 'minutes' THEN 'phút'
            WHEN 'repetitions' THEN 'lần'
            WHEN 'sessions' THEN 'phiên'
            WHEN 'other' THEN COALESCE(item.custom_unit, '')
            ELSE COALESCE(item.goal_unit, item.custom_unit, item.habit_unit, '')
          END || '. Một bước nhỏ vẫn được tính.'
        WHEN item.period_target IS NOT NULL THEN
          'Mục tiêu ' ||
          CASE item.frequency
            WHEN 'monthly' THEN 'tháng này'
            WHEN 'weekly' THEN 'tuần này'
            ELSE 'hôm nay'
          END || ': ' || ROUND(item.period_target, 1)::TEXT || ' ' ||
          CASE COALESCE(item.goal_unit, item.habit_unit)
            WHEN 'pages' THEN 'trang'
            WHEN 'minutes' THEN 'phút'
            WHEN 'repetitions' THEN 'lần'
            WHEN 'sessions' THEN 'phiên'
            WHEN 'other' THEN COALESCE(item.custom_unit, '')
            ELSE COALESCE(item.goal_unit, item.custom_unit, item.habit_unit, '')
          END || '. Một bước nhỏ vẫn làm khu vườn đổi khác.'
        ELSE COALESCE(item.motivation, 'Một bước nhỏ là đủ để giữ nhịp hôm nay.')
      END,
      JSONB_BUILD_OBJECT(
        'plant_id', item.plant_id,
        'goal_id', item.goal_id,
        'habit_id', item.habit_id,
        'local_date', item.local_date,
        'target', item.period_target,
        'progress', item.completed_value,
        'href', '/plant/' || item.plant_id
      ),
      'habit-reminder:' || item.plant_id::TEXT || ':' || item.local_date::TEXT
    FROM progress item
    WHERE (
        item.period_target IS NOT NULL
        AND item.completed_value < item.period_target
      ) OR (
        item.period_target IS NULL
        AND item.has_activity_today = FALSE
      )
    ON CONFLICT (user_id, dedupe_key) WHERE dedupe_key IS NOT NULL
    DO NOTHING
    RETURNING 1
  )
  SELECT COUNT(*)::INTEGER INTO v_inserted FROM inserted;

  RETURN v_inserted;
END;
$$;

COMMENT ON FUNCTION private.dispatch_due_habit_reminders(TIMESTAMPTZ) IS
  'Creates timezone-aware, goal-aware, idempotent daily reminders for due plants.';

REVOKE ALL ON FUNCTION private.dispatch_due_habit_reminders(TIMESTAMPTZ)
  FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  v_job_id BIGINT;
BEGIN
  FOR v_job_id IN
    SELECT jobid FROM cron.job WHERE jobname = 'habit-reminder-dispatcher'
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'habit-reminder-dispatcher',
  '*/5 * * * *',
  $cron$SELECT private.dispatch_due_habit_reminders()$cron$
);

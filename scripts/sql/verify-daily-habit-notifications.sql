BEGIN;

INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  created_at,
  updated_at
) VALUES (
  '91000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'daily-reminder@example.test',
  NOW(),
  NOW()
);

INSERT INTO public.profiles (
  id,
  timezone,
  daily_reminder_enabled
) VALUES (
  '91000000-0000-4000-8000-000000000001',
  'Asia/Ho_Chi_Minh',
  TRUE
)
ON CONFLICT (id) DO UPDATE
SET timezone = EXCLUDED.timezone,
    daily_reminder_enabled = EXCLUDED.daily_reminder_enabled;

INSERT INTO public.plants (
  id,
  user_id,
  plant_type_id,
  name,
  reminder_enabled,
  reminder_time
) VALUES
  (
    '92000000-0000-4000-8000-000000000001',
    '91000000-0000-4000-8000-000000000001',
    'grass',
    'Đọc 30 phút',
    TRUE,
    '08:00'
  ),
  (
    '92000000-0000-4000-8000-000000000002',
    '91000000-0000-4000-8000-000000000001',
    'grass',
    'Thiền buổi sáng',
    TRUE,
    '08:00'
  ),
  (
    '92000000-0000-4000-8000-000000000003',
    '91000000-0000-4000-8000-000000000001',
    'grass',
    'Viết nhật ký tối',
    TRUE,
    '23:55'
  );

INSERT INTO public.goals (
  id,
  plant_id,
  goal_mode,
  tracking_metric,
  unit,
  target_value,
  duration_weeks,
  weekly_targets,
  frequency,
  season_status
) VALUES (
  '93000000-0000-4000-8000-000000000001',
  '92000000-0000-4000-8000-000000000001',
  'total_progress',
  'reading_time',
  'phút',
  210,
  4,
  '[210]'::JSONB,
  'daily',
  'active'
);

-- A completed simple habit must not receive a reminder.
INSERT INTO public.activity_logs (
  plant_id,
  user_id,
  activity_type,
  logged_date,
  logged_at
) VALUES (
  '92000000-0000-4000-8000-000000000002',
  '91000000-0000-4000-8000-000000000001',
  'completed',
  DATE '2026-08-24',
  TIMESTAMPTZ '2026-08-24 00:30:00+00'
);

DO $$
DECLARE
  v_first_dispatch INTEGER;
  v_second_dispatch INTEGER;
  v_late_dispatch INTEGER;
  v_notification_count INTEGER;
  v_late_notification_count INTEGER;
  v_target NUMERIC;
BEGIN
  v_first_dispatch := private.dispatch_due_habit_reminders(
    TIMESTAMPTZ '2026-08-24 01:00:00+00'
  );
  v_second_dispatch := private.dispatch_due_habit_reminders(
    TIMESTAMPTZ '2026-08-24 01:05:00+00'
  );
  v_late_dispatch := private.dispatch_due_habit_reminders(
    TIMESTAMPTZ '2026-08-24 17:01:00+00'
  );

  SELECT COUNT(*), MAX((data->>'target')::NUMERIC)
  INTO v_notification_count, v_target
  FROM public.notifications
  WHERE user_id = '91000000-0000-4000-8000-000000000001'
    AND dedupe_key = 'habit-reminder:92000000-0000-4000-8000-000000000001:2026-08-24';

  SELECT COUNT(*)
  INTO v_late_notification_count
  FROM public.notifications
  WHERE user_id = '91000000-0000-4000-8000-000000000001'
    AND dedupe_key = 'habit-reminder:92000000-0000-4000-8000-000000000003:2026-08-24';

  IF v_first_dispatch <> 1 THEN
    RAISE EXCEPTION 'Expected one due reminder, got %', v_first_dispatch;
  END IF;
  IF v_second_dispatch <> 0 THEN
    RAISE EXCEPTION 'Expected idempotent retry to insert zero reminders, got %', v_second_dispatch;
  END IF;
  IF v_late_dispatch <> 1 THEN
    RAISE EXCEPTION 'Expected one late-night reminder across midnight, got %', v_late_dispatch;
  END IF;
  IF v_notification_count <> 1 THEN
    RAISE EXCEPTION 'Expected one deduplicated inbox row, got %', v_notification_count;
  END IF;
  IF v_target <> 30 THEN
    RAISE EXCEPTION 'Expected daily target 30, got %', v_target;
  END IF;
  IF v_late_notification_count <> 1 THEN
    RAISE EXCEPTION 'Expected one prior-date late reminder, got %', v_late_notification_count;
  END IF;
END;
$$;

SELECT
  type,
  title_vi,
  message_vi,
  data->>'target' AS target,
  dedupe_key
FROM public.notifications
WHERE user_id = '91000000-0000-4000-8000-000000000001';

ROLLBACK;

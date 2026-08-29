BEGIN;

INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  created_at,
  updated_at
) VALUES (
  '94000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'web-push@example.test',
  NOW(),
  NOW()
);

INSERT INTO public.profiles (id)
VALUES ('94000000-0000-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.push_subscriptions (
  id,
  user_id,
  endpoint,
  p256dh,
  auth_key,
  user_agent
) VALUES (
  '95000000-0000-4000-8000-000000000001',
  '94000000-0000-4000-8000-000000000001',
  'https://push.example.test/subscriptions/habit-garden-device',
  'BExampleP256dhKeyForHabitGardenWebPush1234567890',
  'ExampleAuthKey1234567890',
  'Habit Garden SQL probe'
);

INSERT INTO public.notifications (
  id,
  user_id,
  type,
  title,
  title_vi,
  message,
  message_vi,
  data,
  dedupe_key
) VALUES (
  '96000000-0000-4000-8000-000000000001',
  '94000000-0000-4000-8000-000000000001',
  'habit_reminder',
  'Time to care for Reading',
  'Đến giờ chăm Đọc sách',
  'Read one page to keep the rhythm alive.',
  'Đọc một trang để giữ nhịp hôm nay.',
  '{"href":"/garden"}'::JSONB,
  'web-push-probe'
);

DO $$
DECLARE
  v_delivery_count INTEGER;
  v_delivery_status TEXT;
  v_request_id BIGINT;
BEGIN
  IF TO_REGPROCEDURE('net.http_post(text,jsonb,jsonb,jsonb,integer)') IS NULL THEN
    RAISE EXCEPTION 'Expected pg_net http_post to be installed';
  END IF;

  SELECT COUNT(*), MAX(status)
  INTO v_delivery_count, v_delivery_status
  FROM public.notification_push_deliveries
  WHERE notification_id = '96000000-0000-4000-8000-000000000001'
    AND subscription_id = '95000000-0000-4000-8000-000000000001';

  IF v_delivery_count <> 1 OR v_delivery_status <> 'pending' THEN
    RAISE EXCEPTION 'Expected one pending Web Push delivery, got count %, status %',
      v_delivery_count,
      v_delivery_status;
  END IF;

  v_request_id := private.invoke_web_push_dispatcher();
  IF v_request_id IS NOT NULL THEN
    RAISE EXCEPTION 'Dispatcher should stay idle when Vault secrets are absent';
  END IF;
END;
$$;

DELETE FROM public.push_subscriptions
WHERE id = '95000000-0000-4000-8000-000000000001';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.notification_push_deliveries
    WHERE notification_id = '96000000-0000-4000-8000-000000000001'
      AND subscription_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Delivery audit row should survive an expired subscription';
  END IF;
END;
$$;

ROLLBACK;

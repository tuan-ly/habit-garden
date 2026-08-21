BEGIN;

INSERT INTO auth.users (
  id,
  aud,
  role,
  email,
  created_at,
  updated_at
) VALUES (
  '10000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'single-running-session@example.test',
  now(),
  now()
);

INSERT INTO public.profiles (id)
VALUES ('10000000-0000-4000-8000-000000000001')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.habits (
  id,
  user_id,
  type,
  name,
  unit,
  session_duration_minutes
) VALUES
  (
    '20000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000001',
    'reading',
    'First Reading Instance',
    'pages',
    30
  ),
  (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'reading',
    'Second Reading Instance',
    'pages',
    30
  );

INSERT INTO public.habit_sessions (
  habit_id,
  user_id,
  status,
  target_value,
  duration_seconds,
  last_resumed_at
) VALUES (
  '20000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000001',
  'running',
  5,
  1800,
  now()
);

DO $$
BEGIN
  INSERT INTO public.habit_sessions (
    habit_id,
    user_id,
    status,
    target_value,
    duration_seconds,
    last_resumed_at
  ) VALUES (
    '20000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000001',
    'running',
    5,
    1800,
    now()
  );

  RAISE EXCEPTION 'Expected the second running session to violate the user-scoped invariant';
EXCEPTION
  WHEN unique_violation THEN NULL;
END;
$$;

ROLLBACK;

SELECT indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname = 'habit_sessions_one_running_per_user';

SELECT user_id, count(*) AS running_count
FROM public.habit_sessions
WHERE status = 'running'
GROUP BY user_id
HAVING count(*) > 1;

DO $$
DECLARE
  v_habit_id uuid;
BEGIN
  IF (
    SELECT count(*)
    FROM public.plant_capability_assignments
    WHERE plant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ) <> 1 THEN
    RAISE EXCEPTION 'Concurrent attach did not leave exactly one assignment';
  END IF;

  SELECT habit_id
  INTO v_habit_id
  FROM public.plant_capability_assignments
  WHERE plant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  IF (
    SELECT count(*)
    FROM public.habits
    WHERE user_id = '11111111-1111-4111-8111-111111111111'
      AND type = 'reading'
  ) <> 1 THEN
    RAISE EXCEPTION 'Concurrent attach created duplicate capability instances';
  END IF;

  INSERT INTO public.habit_sessions (
    id,
    habit_id,
    user_id,
    source_plant_id,
    status,
    target_value,
    duration_seconds,
    accumulated_seconds,
    result_value,
    reward_points,
    finished_at,
    completed_at
  )
  VALUES (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
    v_habit_id,
    '11111111-1111-4111-8111-111111111111',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'completed',
    5,
    1800,
    1800,
    7,
    7,
    now(),
    now()
  );
END;
$$;

BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '22222222-2222-4222-8222-222222222222',
  true
);
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}',
  true
);

DO $$
BEGIN
  BEGIN
    PERFORM public.manage_plant_capability_instance(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'pause'
    );
    RAISE EXCEPTION 'Cross-user lifecycle call unexpectedly succeeded';
  EXCEPTION
    WHEN insufficient_privilege THEN NULL;
  END;
END;
$$;
COMMIT;

BEGIN;
SET LOCAL ROLE authenticated;
SELECT set_config(
  'request.jwt.claim.sub',
  '11111111-1111-4111-8111-111111111111',
  true
);
SELECT set_config(
  'request.jwt.claims',
  '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}',
  true
);

DO $$
DECLARE
  v_habit_id uuid;
  v_result jsonb;
BEGIN
  SELECT habit_id
  INTO v_habit_id
  FROM public.plant_capability_assignments
  WHERE plant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

  v_result := public.manage_plant_capability_instance(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'pause'
  );
  IF v_result ->> 'state' <> 'paused' THEN
    RAISE EXCEPTION 'Pause did not return the paused state';
  END IF;

  v_result := public.manage_plant_capability_instance(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'resume'
  );
  IF v_result ->> 'state' <> 'active' THEN
    RAISE EXCEPTION 'Resume did not return the active state';
  END IF;

  v_result := public.manage_plant_capability_instance(
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'remove'
  );
  IF v_result ->> 'state' <> 'removed' THEN
    RAISE EXCEPTION 'Remove did not return the removed state';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.plant_capability_assignments
    WHERE plant_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
  ) THEN
    RAISE EXCEPTION 'Remove did not free the plant capability slot';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.habits
    WHERE id = v_habit_id
      AND is_active = false
      AND archived_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'Remove did not archive the capability instance';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.habit_sessions
    WHERE id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
      AND habit_id = v_habit_id
  ) THEN
    RAISE EXCEPTION 'Remove deleted the preserved session log';
  END IF;
END;
$$;
COMMIT;

DELETE FROM public.profiles
WHERE id IN (
  '11111111-1111-4111-8111-111111111111'::uuid,
  '22222222-2222-4222-8222-222222222222'::uuid
);

DELETE FROM auth.users
WHERE id IN (
  '11111111-1111-4111-8111-111111111111'::uuid,
  '22222222-2222-4222-8222-222222222222'::uuid
);

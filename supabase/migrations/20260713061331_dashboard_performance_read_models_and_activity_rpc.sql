-- Dashboard performance foundation.
-- Additive only: previous application builds remain compatible.

-- ---------------------------------------------------------------------------
-- Idempotency receipts for non-idempotent mutations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.mutation_receipts (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mutation_id uuid NOT NULL,
  action text NOT NULL,
  result jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, mutation_id)
);
ALTER TABLE public.mutation_receipts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own mutation receipts" ON public.mutation_receipts;
CREATE POLICY "Users can view own mutation receipts"
  ON public.mutation_receipts FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
DROP POLICY IF EXISTS "Users can insert own mutation receipts" ON public.mutation_receipts;
CREATE POLICY "Users can insert own mutation receipts"
  ON public.mutation_receipts FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE INDEX IF NOT EXISTS idx_mutation_receipts_created_at
  ON public.mutation_receipts(created_at);
-- Hot-path composite indexes. Equality columns precede range/order columns.
CREATE INDEX IF NOT EXISTS idx_goal_logs_goal_logged_at
  ON public.goal_logs(goal_id, logged_at DESC);
CREATE INDEX IF NOT EXISTS idx_mood_logs_user_date
  ON public.mood_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_activity_user_plant_date
  ON public.activity_logs(user_id, plant_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_activity_user_first_morning
  ON public.activity_logs(user_id, is_first_of_day, morning_bonus);
-- ---------------------------------------------------------------------------
-- Read models: one PostgREST request per initial surface
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_dashboard_bootstrap()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT jsonb_build_object(
    'profile', (
      SELECT to_jsonb(p)
      FROM public.profiles p
      WHERE p.id = (SELECT auth.uid())
    ),
    'mood', COALESCE(
      (
        SELECT ml.mood_level
        FROM public.mood_logs ml
        WHERE ml.user_id = (SELECT auth.uid())
          AND ml.date = ((now() AT TIME ZONE COALESCE(
            (SELECT p.timezone FROM public.profiles p WHERE p.id = (SELECT auth.uid())),
            'Asia/Ho_Chi_Minh'
        ))::date)
        LIMIT 1
      ),
      -- energy_logs was an early compatibility table and is absent from some
      -- production schemas even when its historical migration is recorded.
      3
    ),
    'plant_types', COALESCE((
      SELECT jsonb_agg(to_jsonb(pt) ORDER BY pt.tier, pt.name)
      FROM public.plant_types pt
    ), '[]'::jsonb)
  );
$$;
REVOKE ALL ON FUNCTION public.get_dashboard_bootstrap() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_bootstrap() TO authenticated;
CREATE OR REPLACE FUNCTION public.get_garden_snapshot()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  WITH owned_plants AS (
    SELECT p.*
    FROM public.plants p
    WHERE p.user_id = (SELECT auth.uid())
  ), active_goals AS (
    SELECT g.*
    FROM public.goals g
    JOIN owned_plants p ON p.id = g.plant_id
    WHERE g.season_status = 'active'
  )
  SELECT jsonb_build_object(
    'plants', COALESCE((
      SELECT jsonb_agg(
        to_jsonb(p) || jsonb_build_object('plant_type', to_jsonb(pt))
        ORDER BY p.position
      )
      FROM owned_plants p
      JOIN public.plant_types pt ON pt.id = p.plant_type_id
    ), '[]'::jsonb),
    'goals', COALESCE((
      SELECT jsonb_agg(to_jsonb(g)) FROM active_goals g
    ), '[]'::jsonb),
    'goal_logs', COALESCE((
      SELECT jsonb_agg(to_jsonb(gl) ORDER BY gl.logged_at DESC)
      FROM public.goal_logs gl
      JOIN active_goals g ON g.id = gl.goal_id
      WHERE gl.logged_at >= now() - interval '35 days'
    ), '[]'::jsonb),
    'placed_decorations', COALESCE((
      SELECT jsonb_agg(
        to_jsonb(pd) || jsonb_build_object('decoration_type', to_jsonb(dt))
        ORDER BY pd.placed_at
      )
      FROM public.placed_decorations pd
      JOIN public.decoration_types dt ON dt.id = pd.decoration_type_id
      WHERE pd.user_id = (SELECT auth.uid())
    ), '[]'::jsonb)
  );
$$;
REVOKE ALL ON FUNCTION public.get_garden_snapshot() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_garden_snapshot() TO authenticated;
-- ---------------------------------------------------------------------------
-- Pure helpers used by the atomic mutation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.habit_level_from_xp(p_xp integer)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_level integer := 1;
  v_required integer := 0;
BEGIN
  WHILE v_required <= GREATEST(p_xp, 0) LOOP
    v_required := v_required + floor(100 * power(1.5, v_level - 1))::integer;
    IF v_required <= GREATEST(p_xp, 0) THEN
      v_level := v_level + 1;
    END IF;
  END LOOP;
  RETURN v_level;
END;
$$;
CREATE OR REPLACE FUNCTION public.habit_weather_for_date(p_date date)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_text text := to_char(p_date, 'YYYY-MM-DD');
  v_seed bigint := 0;
  v_unsigned bigint;
  v_random double precision;
  i integer;
BEGIN
  FOR i IN 1..length(v_text) LOOP
    v_unsigned := ((v_seed * 31 + ascii(substr(v_text, i, 1))) & 4294967295);
    v_seed := CASE WHEN v_unsigned > 2147483647
      THEN v_unsigned - 4294967296 ELSE v_unsigned END;
  END LOOP;
  v_random := abs(sin(v_seed::double precision));

  RETURN CASE
    WHEN v_random <= 0.35 THEN '{"type":"sunny","growth":1.0,"xp":1.0}'::jsonb
    WHEN v_random <= 0.65 THEN '{"type":"cloudy","growth":1.0,"xp":1.0}'::jsonb
    WHEN v_random <= 0.85 THEN '{"type":"rainy","growth":1.2,"xp":1.1}'::jsonb
    WHEN v_random <= 0.95 THEN '{"type":"stormy","growth":0.8,"xp":1.2}'::jsonb
    ELSE '{"type":"rainbow","growth":1.5,"xp":1.5}'::jsonb
  END;
END;
$$;
REVOKE ALL ON FUNCTION public.habit_level_from_xp(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.habit_level_from_xp(integer) TO authenticated;
REVOKE ALL ON FUNCTION public.habit_weather_for_date(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.habit_weather_for_date(date) TO authenticated;
-- ---------------------------------------------------------------------------
-- Atomic activity mutation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_activity_atomic(
  p_mutation_id uuid,
  p_plant_id uuid,
  p_activity_type text,
  p_value numeric DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_is_welcome_back boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_cached jsonb;
  v_profile public.profiles%ROWTYPE;
  v_plant public.plants%ROWTYPE;
  v_plant_type public.plant_types%ROWTYPE;
  v_goal public.goals%ROWTYPE;
  v_local_now timestamp;
  v_today date;
  v_yesterday date;
  v_is_first boolean;
  v_is_morning boolean;
  v_is_pr boolean := false;
  v_has_matured boolean := false;
  v_new_streak integer := 0;
  v_new_goal_value numeric;
  v_week_number integer;
  v_weekly_target numeric;
  v_exceeded_target boolean := false;
  v_note_xp integer := 0;
  v_total_xp integer := 0;
  v_old_xp integer;
  v_new_xp integer;
  v_old_level integer;
  v_new_level integer;
  v_coins integer := 0;
  v_weather jsonb;
  v_growth_modifier numeric;
  v_xp_modifier numeric;
  v_new_growth numeric;
  v_new_moisture numeric;
  v_material public.materials%ROWTYPE;
  v_new_achievement_ids text[] := ARRAY[]::text[];
  v_result jsonb;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'UNAUTHENTICATED', 'error', 'Not authenticated');
  END IF;
  IF p_mutation_id IS NULL OR p_plant_id IS NULL
     OR p_activity_type NOT IN ('watering', 'completed', 'progress')
     OR (p_activity_type = 'progress' AND p_value IS NULL) THEN
    RETURN jsonb_build_object('success', false, 'code', 'VALIDATION_ERROR', 'error', 'Invalid activity');
  END IF;

  SELECT mr.result INTO v_cached
  FROM public.mutation_receipts mr
  WHERE mr.user_id = v_user_id AND mr.mutation_id = p_mutation_id;
  IF v_cached IS NOT NULL THEN
    RETURN v_cached || jsonb_build_object('code', 'ALREADY_APPLIED');
  END IF;

  SELECT p.* INTO v_profile
  FROM public.profiles p
  WHERE p.id = v_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'error', 'Profile not found');
  END IF;

  SELECT p.* INTO v_plant
  FROM public.plants p
  WHERE p.id = p_plant_id AND p.user_id = v_user_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'error', 'Plant not found');
  END IF;

  -- A concurrent retry may have waited on the profile/plant lock. Recheck the
  -- receipt after locking so it returns the first transaction's result instead
  -- of applying rewards twice or failing on the receipt primary key.
  SELECT mr.result INTO v_cached
  FROM public.mutation_receipts mr
  WHERE mr.user_id = v_user_id AND mr.mutation_id = p_mutation_id;
  IF v_cached IS NOT NULL THEN
    RETURN v_cached || jsonb_build_object('code', 'ALREADY_APPLIED');
  END IF;

  SELECT pt.* INTO v_plant_type
  FROM public.plant_types pt WHERE pt.id = v_plant.plant_type_id;

  SELECT g.* INTO v_goal
  FROM public.goals g
  WHERE g.plant_id = p_plant_id AND g.season_status = 'active'
  ORDER BY g.started_at DESC
  LIMIT 1
  FOR UPDATE;

  v_local_now := now() AT TIME ZONE COALESCE(v_profile.timezone, 'Asia/Ho_Chi_Minh');
  v_today := v_local_now::date;
  v_yesterday := v_today - 1;
  v_is_morning := extract(hour FROM v_local_now) >= 5 AND extract(hour FROM v_local_now) < 9;
  v_weather := public.habit_weather_for_date(v_today);
  v_growth_modifier := (v_weather->>'growth')::numeric;
  v_xp_modifier := (v_weather->>'xp')::numeric;

  SELECT NOT EXISTS (
    SELECT 1 FROM public.activity_logs al
    WHERE al.user_id = v_user_id AND al.plant_id = p_plant_id AND al.logged_date = v_today
  ) INTO v_is_first;

  IF p_notes IS NOT NULL AND length(trim(p_notes)) > 0 THEN
    v_note_xp := 3
      + CASE WHEN length(trim(p_notes)) > 50 THEN 2 ELSE 0 END
      + CASE WHEN length(trim(p_notes)) > 100 THEN 2 ELSE 0 END;
  END IF;

  IF p_activity_type IN ('completed', 'progress') THEN
    IF v_is_first THEN
      v_total_xp := 10 + CASE WHEN v_is_morning THEN 3 ELSE 0 END;
    END IF;
    IF p_activity_type = 'progress' AND v_goal.id IS NOT NULL
       AND v_goal.goal_mode = 'build_capacity' AND p_value > COALESCE(v_goal.current_value, 0) THEN
      v_is_pr := true;
      v_total_xp := v_total_xp + 25;
    END IF;
  END IF;

  v_total_xp := round((v_total_xp + v_note_xp) * v_xp_modifier)::integer;

  IF p_is_welcome_back AND EXISTS (
    SELECT 1 FROM public.activity_logs al
    WHERE al.user_id = v_user_id AND al.logged_date < v_today
    GROUP BY al.user_id
    HAVING v_today - max(al.logged_date) >= 3
  ) THEN
    v_total_xp := v_total_xp + 25;
  END IF;

  IF COALESCE(v_plant.easy_mode, false)
     AND v_total_xp > 0
     AND v_today - COALESCE(v_plant.started_at::date, v_plant.created_at::date) <= 30 THEN
    v_total_xp := round(v_total_xp * 1.2)::integer;
  END IF;

  IF p_activity_type = 'progress' AND v_goal.id IS NOT NULL THEN
    v_new_goal_value := CASE WHEN v_goal.goal_mode = 'total_progress'
      THEN COALESCE(v_goal.current_value, 0) + p_value
      ELSE GREATEST(COALESCE(v_goal.current_value, 0), p_value) END;
    v_week_number := floor((v_today - COALESCE(v_goal.started_at::date, v_today)) / 7.0)::integer + 1;
    v_weekly_target := CASE
      WHEN jsonb_array_length(COALESCE(v_goal.weekly_targets::jsonb, '[]'::jsonb)) > 0 THEN
        COALESCE(
          (
            v_goal.weekly_targets::jsonb ->> LEAST(
              GREATEST(v_week_number - 1, 0),
              jsonb_array_length(v_goal.weekly_targets::jsonb) - 1
            )
          )::numeric,
          v_goal.target_value
        )
      ELSE v_goal.target_value
    END;
    v_exceeded_target := p_value >= v_weekly_target;

    UPDATE public.goals SET
      current_value = v_new_goal_value,
      days_active = COALESCE(days_active, 0) + CASE WHEN v_is_first THEN 1 ELSE 0 END,
      updated_at = now()
    WHERE id = v_goal.id
    RETURNING * INTO v_goal;

    INSERT INTO public.goal_logs(
      goal_id, plant_id, user_id, value, logged_date, notes,
      week_number, weekly_target, is_personal_record, exceeded_target
    ) VALUES (
      v_goal.id, p_plant_id, v_user_id, p_value, v_today, NULLIF(trim(p_notes), ''),
      v_week_number, v_weekly_target, v_is_pr, v_exceeded_target
    );
  END IF;

  INSERT INTO public.activity_logs(
    plant_id, season_id, user_id, activity_type, logged_date, value, notes,
    xp_earned, is_first_of_day, is_personal_record, morning_bonus
  ) VALUES (
    p_plant_id, v_goal.id, v_user_id, p_activity_type, v_today, p_value,
    NULLIF(trim(p_notes), ''), v_total_xp, v_is_first, v_is_pr, v_is_morning AND v_is_first
  );

  IF p_activity_type IN ('completed', 'progress') THEN
    v_new_streak := CASE
      WHEN v_plant.last_watered_at::date = v_yesterday THEN COALESCE(v_plant.current_streak, 0) + 1
      WHEN v_plant.last_watered_at::date = v_today THEN COALESCE(v_plant.current_streak, 0)
      ELSE 1
    END;
    v_new_moisture := LEAST(100, COALESCE(v_plant.current_moisture, 0) + v_plant_type.moisture_boost);
    v_new_growth := LEAST(100, COALESCE(v_plant.growth_percentage, 0)
      + (100.0 / v_plant_type.maturity_days) * v_growth_modifier);
    v_has_matured := v_new_growth >= 100 AND v_plant.status NOT IN ('mature', 'dead');

    UPDATE public.plants SET
      current_moisture = v_new_moisture,
      growth_percentage = v_new_growth,
      total_waterings = COALESCE(total_waterings, 0) + CASE WHEN v_is_first THEN 1 ELSE 0 END,
      current_streak = v_new_streak,
      longest_streak = GREATEST(COALESCE(longest_streak, 0), v_new_streak),
      last_watered_at = now(),
      status = CASE WHEN v_has_matured THEN 'mature' ELSE 'thriving' END,
      matured_at = CASE WHEN v_has_matured THEN now() ELSE matured_at END,
      updated_at = now()
    WHERE id = p_plant_id
    RETURNING * INTO v_plant;

    v_coins := CASE WHEN v_is_first THEN 5 ELSE 2 END
      + CASE v_new_streak WHEN 3 THEN 10 WHEN 7 THEN 25 WHEN 14 THEN 50
          WHEN 30 THEN 100 WHEN 60 THEN 200 WHEN 100 THEN 500 ELSE 0 END;

    IF v_has_matured THEN
      v_coins := v_coins + 50;
      SELECT m.* INTO v_material
      FROM public.materials m
      WHERE m.plant_type_id = v_plant.plant_type_id OR m.slug = 'garden-essence'
      ORDER BY (m.plant_type_id = v_plant.plant_type_id) DESC
      LIMIT 1;
      IF v_material.id IS NOT NULL THEN
        PERFORM public.atomic_inventory_increment(
          v_user_id, 'material', v_material.id, NULL, 1, 'harvest'
        );
      END IF;
    END IF;

    IF v_coins > 0 THEN
      PERFORM public.award_coins(v_user_id, v_coins, 'activity', p_mutation_id::text);
    END IF;
  ELSE
    UPDATE public.plants SET
      current_moisture = LEAST(100, COALESCE(current_moisture, 0) + v_plant_type.moisture_boost * 0.5),
      last_watered_at = now(),
      updated_at = now()
    WHERE id = p_plant_id
    RETURNING * INTO v_plant;
  END IF;

  v_old_xp := COALESCE(v_profile.xp, 0);
  v_old_level := COALESCE(v_profile.level, public.habit_level_from_xp(v_old_xp));
  v_new_xp := v_old_xp + v_total_xp;
  v_new_level := public.habit_level_from_xp(v_new_xp);
  IF v_total_xp > 0 THEN
    UPDATE public.profiles SET xp = v_new_xp, level = v_new_level, updated_at = now()
    WHERE id = v_user_id
    RETURNING * INTO v_profile;
  ELSE
    SELECT p.* INTO v_profile FROM public.profiles p WHERE p.id = v_user_id;
  END IF;

  WITH stats AS (
    SELECT
      count(*)::integer AS total_plants,
      count(*) FILTER (WHERE p.status = 'mature')::integer AS mature_plants,
      COALESCE(max(p.longest_streak), 0)::integer AS best_streak
    FROM public.plants p WHERE p.user_id = v_user_id
  ), activity_stats AS (
    SELECT
      count(*) FILTER (WHERE al.is_first_of_day)::integer AS total_waterings,
      count(*) FILTER (WHERE al.morning_bonus)::integer AS morning_waterings
    FROM public.activity_logs al WHERE al.user_id = v_user_id
  ), candidates(id, met) AS (
    SELECT * FROM (VALUES
      ('first_plant', (SELECT total_plants >= 1 FROM stats)),
      ('first_watering', (SELECT total_waterings >= 1 FROM activity_stats)),
      ('first_mature', (SELECT mature_plants >= 1 FROM stats)),
      ('watering_10', (SELECT total_waterings >= 10 FROM activity_stats)),
      ('watering_50', (SELECT total_waterings >= 50 FROM activity_stats)),
      ('watering_100', (SELECT total_waterings >= 100 FROM activity_stats)),
      ('watering_365', (SELECT total_waterings >= 365 FROM activity_stats)),
      ('streak_3', (SELECT best_streak >= 3 FROM stats)),
      ('streak_7', (SELECT best_streak >= 7 FROM stats)),
      ('streak_14', (SELECT best_streak >= 14 FROM stats)),
      ('streak_30', (SELECT best_streak >= 30 FROM stats)),
      ('streak_100', (SELECT best_streak >= 100 FROM stats)),
      ('plants_5', (SELECT total_plants >= 5 FROM stats)),
      ('plants_10', (SELECT total_plants >= 10 FROM stats)),
      ('mature_5', (SELECT mature_plants >= 5 FROM stats)),
      ('mature_10', (SELECT mature_plants >= 10 FROM stats)),
      ('level_5', v_new_level >= 5), ('level_10', v_new_level >= 10),
      ('level_15', v_new_level >= 15),
      ('early_bird', (SELECT morning_waterings >= 10 FROM activity_stats)),
      ('first_journal', COALESCE(v_profile.total_journal_entries, 0) >= 1),
      ('journal_10', COALESCE(v_profile.total_journal_entries, 0) >= 10),
      ('journal_50', COALESCE(v_profile.total_journal_entries, 0) >= 50),
      ('journal_100', COALESCE(v_profile.total_journal_entries, 0) >= 100),
      ('journal_streak_3', COALESCE(v_profile.longest_journal_streak, 0) >= 3),
      ('journal_streak_7', COALESCE(v_profile.longest_journal_streak, 0) >= 7),
      ('journal_streak_14', COALESCE(v_profile.longest_journal_streak, 0) >= 14),
      ('journal_streak_30', COALESCE(v_profile.longest_journal_streak, 0) >= 30)
    ) AS x(id, met)
  ), inserted AS (
    INSERT INTO public.user_achievements(user_id, achievement_id, unlocked_at)
    SELECT v_user_id, a.id, now()
    FROM candidates c JOIN public.achievements a ON a.id = c.id
    WHERE c.met
    ON CONFLICT DO NOTHING
    RETURNING achievement_id
  )
  SELECT COALESCE(array_agg(achievement_id), ARRAY[]::text[])
  INTO v_new_achievement_ids FROM inserted;

  v_result := jsonb_build_object(
    'success', true,
    'mutationId', p_mutation_id,
    'xpEarned', v_total_xp,
    'isPersonalRecord', v_is_pr,
    'newGoalValue', v_new_goal_value,
    'leveledUp', v_new_level > v_old_level,
    'oldLevel', v_old_level,
    'newLevel', v_new_level,
    'coinsEarned', v_coins,
    'newAchievementIds', to_jsonb(v_new_achievement_ids),
    'plant', to_jsonb(v_plant) || jsonb_build_object('plant_type', to_jsonb(v_plant_type)),
    'goal', CASE WHEN v_goal.id IS NULL THEN NULL ELSE to_jsonb(v_goal) END,
    'harvestedMaterial', CASE WHEN v_material.id IS NULL THEN NULL ELSE jsonb_build_object(
      'name', v_material.name, 'icon', v_material.icon
    ) END,
    'weatherType', v_weather->>'type'
  );

  INSERT INTO public.mutation_receipts(user_id, mutation_id, action, result)
  VALUES (v_user_id, p_mutation_id, 'record_activity', v_result);

  RETURN v_result;
END;
$$;
REVOKE ALL ON FUNCTION public.record_activity_atomic(uuid, uuid, text, numeric, text, boolean)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_activity_atomic(uuid, uuid, text, numeric, text, boolean)
  TO authenticated;

-- Generic guided habit sessions and deterministic growth plans.
-- The first product slice uses these tables for reading, but units and habit types are reusable.

CREATE TABLE public.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (char_length(type) BETWEEN 1 AND 64),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
  description TEXT CHECK (description IS NULL OR char_length(description) <= 500),
  unit TEXT NOT NULL CHECK (unit IN ('pages', 'minutes', 'repetitions', 'sessions', 'other')),
  custom_unit TEXT CHECK (
    (unit = 'other' AND custom_unit IS NOT NULL AND char_length(custom_unit) BETWEEN 1 AND 40)
    OR (unit <> 'other' AND custom_unit IS NULL)
  ),
  session_duration_minutes INTEGER NOT NULL CHECK (session_duration_minutes BETWEEN 1 AND 720),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT habits_user_type_unique UNIQUE (user_id, type)
);

CREATE TABLE public.goal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL UNIQUE REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_target NUMERIC NOT NULL CHECK (start_target > 0),
  end_target NUMERIC NOT NULL CHECK (end_target >= start_target),
  timeframe_weeks INTEGER NOT NULL CHECK (timeframe_weeks BETWEEN 1 AND 520),
  increment_value NUMERIC NOT NULL CHECK (increment_value > 0),
  review_period_days INTEGER NOT NULL CHECK (review_period_days BETWEEN 1 AND 90),
  performance_threshold NUMERIC NOT NULL CHECK (
    performance_threshold > 0 AND performance_threshold <= 1
  ),
  started_on DATE NOT NULL DEFAULT current_date,
  target_end_on DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT goal_plans_habit_owner_unique UNIQUE (habit_id, user_id)
);

CREATE TABLE public.habit_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (
    status IN ('running', 'paused', 'awaiting_completion', 'completed', 'cancelled')
  ),
  target_value NUMERIC NOT NULL CHECK (target_value > 0),
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds BETWEEN 60 AND 43200),
  accumulated_seconds INTEGER NOT NULL DEFAULT 0 CHECK (accumulated_seconds >= 0),
  last_resumed_at TIMESTAMPTZ,
  ambient_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  result_value NUMERIC CHECK (result_value IS NULL OR result_value > 0),
  reflection TEXT CHECK (reflection IS NULL OR char_length(reflection) <= 2000),
  reward_points INTEGER NOT NULL DEFAULT 0 CHECK (reward_points >= 0),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paused_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX habit_sessions_one_open_per_habit
  ON public.habit_sessions (habit_id)
  WHERE status IN ('running', 'paused', 'awaiting_completion');

CREATE INDEX habit_sessions_user_started_idx
  ON public.habit_sessions (user_id, started_at DESC);

CREATE TABLE public.daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL DEFAULT current_date,
  target_value NUMERIC NOT NULL CHECK (target_value > 0),
  completed_value NUMERIC NOT NULL DEFAULT 0 CHECK (completed_value >= 0),
  session_count INTEGER NOT NULL DEFAULT 0 CHECK (session_count >= 0),
  met_target BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT daily_progress_habit_date_unique UNIQUE (habit_id, progress_date)
);

CREATE INDEX daily_progress_user_date_idx
  ON public.daily_progress (user_id, progress_date DESC);

CREATE TABLE public.growth_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL UNIQUE REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  current_target NUMERIC NOT NULL CHECK (current_target > 0),
  previous_target NUMERIC CHECK (previous_target IS NULL OR previous_target > 0),
  next_target NUMERIC CHECK (next_target IS NULL OR next_target > 0),
  review_period_started_on DATE NOT NULL DEFAULT current_date,
  next_review_on DATE NOT NULL,
  last_reviewed_on DATE,
  consistency_score NUMERIC NOT NULL DEFAULT 0 CHECK (
    consistency_score >= 0 AND consistency_score <= 1
  ),
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  best_streak INTEGER NOT NULL DEFAULT 0 CHECK (best_streak >= 0),
  last_completed_on DATE,
  total_growth_points INTEGER NOT NULL DEFAULT 0 CHECK (total_growth_points >= 0),
  plant_stage TEXT NOT NULL DEFAULT 'seed' CHECK (
    plant_stage IN ('seed', 'sprout', 'growing', 'blooming', 'mature')
  ),
  history JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(history) = 'array'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT growth_states_habit_owner_unique UNIQUE (habit_id, user_id)
);

CREATE INDEX growth_states_user_idx ON public.growth_states (user_id);

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habits"
  ON public.habits FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can create own habits"
  ON public.habits FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can update own habits"
  ON public.habits FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own habits"
  ON public.habits FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view own goal plans"
  ON public.goal_plans FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can create own goal plans"
  ON public.goal_plans FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = goal_plans.habit_id
        AND habits.user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY "Users can update own goal plans"
  ON public.goal_plans FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own goal plans"
  ON public.goal_plans FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view own habit sessions"
  ON public.habit_sessions FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can create own habit sessions"
  ON public.habit_sessions FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = habit_sessions.habit_id
        AND habits.user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY "Users can update own habit sessions"
  ON public.habit_sessions FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own habit sessions"
  ON public.habit_sessions FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view own daily progress"
  ON public.daily_progress FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can create own daily progress"
  ON public.daily_progress FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = daily_progress.habit_id
        AND habits.user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY "Users can update own daily progress"
  ON public.daily_progress FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own daily progress"
  ON public.daily_progress FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can view own growth states"
  ON public.growth_states FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can create own growth states"
  ON public.growth_states FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.habits
      WHERE habits.id = growth_states.habit_id
        AND habits.user_id = (SELECT auth.uid())
    )
  );
CREATE POLICY "Users can update own growth states"
  ON public.growth_states FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "Users can delete own growth states"
  ON public.growth_states FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE OR REPLACE FUNCTION public.complete_habit_session_atomic(
  p_session_id UUID,
  p_completed_value NUMERIC,
  p_reflection TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_session public.habit_sessions%ROWTYPE;
  v_plan public.goal_plans%ROWTYPE;
  v_growth public.growth_states%ROWTYPE;
  v_daily public.daily_progress%ROWTYPE;
  v_reward INTEGER;
  v_successful_days INTEGER := 0;
  v_consistency NUMERIC := 0;
  v_new_target NUMERIC;
  v_next_target NUMERIC;
  v_action TEXT := 'held';
  v_reason TEXT := 'threshold_not_met';
  v_new_streak INTEGER;
  v_new_best_streak INTEGER;
  v_new_growth_points INTEGER;
  v_plant_stage TEXT;
  v_history_entry JSONB;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  IF p_completed_value IS NULL OR p_completed_value < 1 OR p_completed_value > 5000
     OR p_completed_value <> trunc(p_completed_value) THEN
    RAISE EXCEPTION 'Completed value must be a whole number between 1 and 5000'
      USING ERRCODE = '22023';
  END IF;

  IF p_reflection IS NOT NULL AND char_length(p_reflection) > 2000 THEN
    RAISE EXCEPTION 'Reflection must be 2000 characters or fewer'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_session
  FROM public.habit_sessions
  WHERE id = p_session_id
    AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Habit session not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_session.status = 'completed' THEN
    SELECT * INTO v_daily
    FROM public.daily_progress
    WHERE habit_id = v_session.habit_id
      AND progress_date = (v_session.completed_at AT TIME ZONE 'UTC')::date;

    SELECT * INTO v_growth
    FROM public.growth_states
    WHERE habit_id = v_session.habit_id;

    RETURN jsonb_build_object(
      'session', to_jsonb(v_session),
      'daily_progress', to_jsonb(v_daily),
      'growth_state', to_jsonb(v_growth)
    );
  END IF;

  IF v_session.status <> 'awaiting_completion' THEN
    RAISE EXCEPTION 'Finish the session before recording the result'
      USING ERRCODE = '55000';
  END IF;

  SELECT *
  INTO v_plan
  FROM public.goal_plans
  WHERE habit_id = v_session.habit_id
    AND user_id = v_user_id;

  SELECT *
  INTO v_growth
  FROM public.growth_states
  WHERE habit_id = v_session.habit_id
    AND user_id = v_user_id
  FOR UPDATE;

  IF v_plan.id IS NULL OR v_growth.id IS NULL THEN
    RAISE EXCEPTION 'Habit growth plan is incomplete' USING ERRCODE = '55000';
  END IF;

  v_reward := 5 + CASE WHEN p_completed_value >= v_session.target_value THEN 3 ELSE 0 END;

  UPDATE public.habit_sessions
  SET
    status = 'completed',
    result_value = p_completed_value,
    reflection = NULLIF(btrim(p_reflection), ''),
    reward_points = v_reward,
    completed_at = now(),
    updated_at = now()
  WHERE id = v_session.id
  RETURNING * INTO v_session;

  INSERT INTO public.daily_progress (
    habit_id,
    user_id,
    progress_date,
    target_value,
    completed_value,
    session_count,
    met_target,
    completed_at
  )
  VALUES (
    v_session.habit_id,
    v_user_id,
    current_date,
    v_session.target_value,
    p_completed_value,
    1,
    p_completed_value >= v_session.target_value,
    now()
  )
  ON CONFLICT (habit_id, progress_date) DO UPDATE
  SET
    target_value = EXCLUDED.target_value,
    completed_value = public.daily_progress.completed_value + EXCLUDED.completed_value,
    session_count = public.daily_progress.session_count + 1,
    met_target = (
      public.daily_progress.completed_value + EXCLUDED.completed_value
    ) >= EXCLUDED.target_value,
    completed_at = now(),
    updated_at = now()
  RETURNING * INTO v_daily;

  IF v_growth.last_completed_on = current_date THEN
    v_new_streak := v_growth.current_streak;
  ELSIF v_growth.last_completed_on = current_date - 1 THEN
    v_new_streak := v_growth.current_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;
  v_new_best_streak := greatest(v_growth.best_streak, v_new_streak);

  v_new_target := v_growth.current_target;
  v_next_target := v_growth.next_target;

  IF current_date >= v_growth.next_review_on THEN
    SELECT count(DISTINCT progress_date)::INTEGER
    INTO v_successful_days
    FROM public.daily_progress
    WHERE habit_id = v_session.habit_id
      AND user_id = v_user_id
      AND progress_date >= v_growth.review_period_started_on
      AND progress_date < v_growth.next_review_on
      AND completed_value >= target_value;

    v_consistency := least(
      1,
      v_successful_days::NUMERIC / v_plan.review_period_days::NUMERIC
    );

    IF v_growth.current_target >= v_plan.end_target THEN
      v_action := 'completed';
      v_reason := 'end_target_reached';
    ELSIF v_consistency >= v_plan.performance_threshold THEN
      v_new_target := least(
        v_plan.end_target,
        v_growth.current_target + v_plan.increment_value
      );
      IF v_new_target >= v_plan.end_target THEN
        v_action := 'completed';
        v_reason := 'end_target_reached';
      ELSE
        v_action := 'advanced';
        v_reason := 'threshold_met';
      END IF;
    END IF;

    v_next_target := CASE
      WHEN v_new_target >= v_plan.end_target THEN NULL
      ELSE least(v_plan.end_target, v_new_target + v_plan.increment_value)
    END;

    v_history_entry := jsonb_build_object(
      'reviewed_on', current_date,
      'period_started_on', v_growth.review_period_started_on,
      'period_ended_on', v_growth.next_review_on - 1,
      'previous_target', v_growth.current_target,
      'new_target', v_new_target,
      'consistency', round(v_consistency, 4),
      'successful_days', v_successful_days,
      'review_period_days', v_plan.review_period_days,
      'action', v_action,
      'reason', v_reason
    );
  END IF;

  v_new_growth_points := v_growth.total_growth_points + v_reward;
  v_plant_stage := CASE
    WHEN v_new_growth_points >= 160 THEN 'mature'
    WHEN v_new_growth_points >= 80 THEN 'blooming'
    WHEN v_new_growth_points >= 30 THEN 'growing'
    WHEN v_new_growth_points >= 10 THEN 'sprout'
    ELSE 'seed'
  END;

  UPDATE public.growth_states
  SET
    previous_target = CASE
      WHEN current_date >= next_review_on THEN current_target
      ELSE previous_target
    END,
    current_target = v_new_target,
    next_target = v_next_target,
    review_period_started_on = CASE
      WHEN current_date >= next_review_on THEN current_date
      ELSE review_period_started_on
    END,
    next_review_on = CASE
      WHEN current_date >= next_review_on THEN current_date + v_plan.review_period_days
      ELSE next_review_on
    END,
    last_reviewed_on = CASE
      WHEN current_date >= next_review_on THEN current_date
      ELSE last_reviewed_on
    END,
    consistency_score = CASE
      WHEN current_date >= next_review_on THEN round(v_consistency, 4)
      ELSE consistency_score
    END,
    current_streak = v_new_streak,
    best_streak = v_new_best_streak,
    last_completed_on = current_date,
    total_growth_points = v_new_growth_points,
    plant_stage = v_plant_stage,
    history = CASE
      WHEN v_history_entry IS NOT NULL THEN history || jsonb_build_array(v_history_entry)
      ELSE history
    END,
    updated_at = now()
  WHERE id = v_growth.id
  RETURNING * INTO v_growth;

  RETURN jsonb_build_object(
    'session', to_jsonb(v_session),
    'daily_progress', to_jsonb(v_daily),
    'growth_state', to_jsonb(v_growth)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.complete_habit_session_atomic(UUID, NUMERIC, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_habit_session_atomic(UUID, NUMERIC, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.complete_habit_session_atomic(UUID, NUMERIC, TEXT) TO authenticated;


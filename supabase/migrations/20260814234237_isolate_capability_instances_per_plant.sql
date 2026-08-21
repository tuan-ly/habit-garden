-- A capability type (for example Reading) is reusable, but each assigned plant
-- owns an isolated habit instance. The instance remains the aggregate root for
-- its goal plan, growth state, sessions and daily progress.

DROP TRIGGER IF EXISTS sync_legacy_habit_plant_assignment ON public.habits;
DROP FUNCTION IF EXISTS public.sync_legacy_habit_plant_assignment();

-- Multiple plants may select the same capability type, so type is no longer a
-- user-level singleton.
ALTER TABLE public.habits
  DROP CONSTRAINT habits_user_type_unique;

-- Split any already-shared habit before enforcing one assignment per instance.
-- The first assignment keeps the original instance and history whose source is
-- null; every additional plant gets a cloned instance and its sourced sessions.
CREATE TEMP TABLE capability_instance_splits ON COMMIT DROP AS
SELECT
  ranked.plant_id,
  ranked.habit_id AS old_habit_id,
  ranked.user_id,
  gen_random_uuid() AS new_habit_id
FROM (
  SELECT
    assignments.*,
    row_number() OVER (
      PARTITION BY assignments.habit_id
      ORDER BY assignments.assigned_at, assignments.plant_id
    ) AS assignment_ordinal
  FROM public.plant_capability_assignments AS assignments
) AS ranked
WHERE ranked.assignment_ordinal > 1;

-- An older build may have moved the nullable legacy anchor to a later
-- assignment. Put each shared habit back on its first assignment before
-- inserting clones, otherwise habits_plant_unique can reject the clone.
UPDATE public.habits AS habits
SET
  plant_id = canonical.plant_id,
  updated_at = now()
FROM (
  SELECT plant_id, habit_id, user_id
  FROM (
    SELECT
      assignments.*,
      row_number() OVER (
        PARTITION BY assignments.habit_id
        ORDER BY assignments.assigned_at, assignments.plant_id
      ) AS assignment_ordinal
    FROM public.plant_capability_assignments AS assignments
  ) AS ranked
  WHERE ranked.assignment_ordinal = 1
) AS canonical
WHERE habits.id = canonical.habit_id
  AND habits.user_id = canonical.user_id
  AND EXISTS (
    SELECT 1
    FROM capability_instance_splits AS splits
    WHERE splits.old_habit_id = habits.id
      AND splits.user_id = habits.user_id
  );

INSERT INTO public.habits (
  id,
  user_id,
  plant_id,
  type,
  name,
  description,
  unit,
  custom_unit,
  session_duration_minutes,
  is_active,
  created_at,
  updated_at
)
SELECT
  splits.new_habit_id,
  habits.user_id,
  splits.plant_id,
  habits.type,
  habits.name,
  habits.description,
  habits.unit,
  habits.custom_unit,
  habits.session_duration_minutes,
  habits.is_active,
  habits.created_at,
  now()
FROM capability_instance_splits AS splits
JOIN public.habits AS habits
  ON habits.id = splits.old_habit_id
  AND habits.user_id = splits.user_id;

INSERT INTO public.goal_plans (
  habit_id,
  user_id,
  start_target,
  end_target,
  timeframe_weeks,
  increment_value,
  review_period_days,
  performance_threshold,
  started_on,
  target_end_on,
  created_at,
  updated_at
)
SELECT
  splits.new_habit_id,
  plans.user_id,
  plans.start_target,
  plans.end_target,
  plans.timeframe_weeks,
  plans.increment_value,
  plans.review_period_days,
  plans.performance_threshold,
  plans.started_on,
  plans.target_end_on,
  plans.created_at,
  now()
FROM capability_instance_splits AS splits
JOIN public.goal_plans AS plans
  ON plans.habit_id = splits.old_habit_id
  AND plans.user_id = splits.user_id;

INSERT INTO public.growth_states (
  habit_id,
  user_id,
  current_target,
  previous_target,
  next_target,
  review_period_started_on,
  next_review_on,
  last_reviewed_on,
  consistency_score,
  current_streak,
  best_streak,
  last_completed_on,
  total_growth_points,
  plant_stage,
  history,
  created_at,
  updated_at
)
SELECT
  splits.new_habit_id,
  growth.user_id,
  growth.current_target,
  growth.previous_target,
  growth.next_target,
  growth.review_period_started_on,
  growth.next_review_on,
  growth.last_reviewed_on,
  growth.consistency_score,
  growth.current_streak,
  growth.best_streak,
  growth.last_completed_on,
  growth.total_growth_points,
  growth.plant_stage,
  growth.history,
  growth.created_at,
  now()
FROM capability_instance_splits AS splits
JOIN public.growth_states AS growth
  ON growth.habit_id = splits.old_habit_id
  AND growth.user_id = splits.user_id;

UPDATE public.habit_sessions AS sessions
SET
  habit_id = splits.new_habit_id,
  updated_at = now()
FROM capability_instance_splits AS splits
WHERE sessions.habit_id = splits.old_habit_id
  AND sessions.user_id = splits.user_id
  AND sessions.source_plant_id = splits.plant_id;

UPDATE public.plant_capability_assignments AS assignments
SET habit_id = splits.new_habit_id
FROM capability_instance_splits AS splits
WHERE assignments.plant_id = splits.plant_id
  AND assignments.habit_id = splits.old_habit_id
  AND assignments.user_id = splits.user_id;

-- Daily progress is derived from completed sessions. Rebuild only aggregates
-- affected by a split so each new instance receives its own capability log.
DELETE FROM public.daily_progress AS progress
WHERE progress.habit_id IN (
  SELECT old_habit_id FROM capability_instance_splits
  UNION
  SELECT new_habit_id FROM capability_instance_splits
);

INSERT INTO public.daily_progress (
  habit_id,
  user_id,
  progress_date,
  target_value,
  completed_value,
  session_count,
  met_target,
  completed_at,
  created_at,
  updated_at
)
SELECT
  sessions.habit_id,
  sessions.user_id,
  (sessions.completed_at AT TIME ZONE 'UTC')::date,
  (array_agg(sessions.target_value ORDER BY sessions.completed_at DESC))[1],
  sum(sessions.result_value),
  count(*)::integer,
  sum(sessions.result_value) >=
    (array_agg(sessions.target_value ORDER BY sessions.completed_at DESC))[1],
  max(sessions.completed_at),
  min(sessions.created_at),
  now()
FROM public.habit_sessions AS sessions
WHERE sessions.status = 'completed'
  AND sessions.completed_at IS NOT NULL
  AND sessions.result_value IS NOT NULL
  AND sessions.habit_id IN (
    SELECT old_habit_id FROM capability_instance_splits
    UNION
    SELECT new_habit_id FROM capability_instance_splits
  )
GROUP BY
  sessions.habit_id,
  sessions.user_id,
  (sessions.completed_at AT TIME ZONE 'UTC')::date;

DROP INDEX public.plant_capability_assignments_habit_owner_idx;

ALTER TABLE public.plant_capability_assignments
  ADD CONSTRAINT plant_capability_assignments_habit_unique UNIQUE (habit_id);

-- Compatibility inserts from an older build still create the assignment for a
-- newly inserted habit. Moving an existing instance to a second plant is now
-- rejected because it would merge two plants' targets and logs.
CREATE OR REPLACE FUNCTION public.sync_legacy_habit_plant_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  IF NEW.plant_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.plant_capability_assignments (
    plant_id,
    habit_id,
    user_id
  )
  VALUES (
    NEW.plant_id,
    NEW.id,
    NEW.user_id
  )
  ON CONFLICT DO NOTHING;

  IF NOT EXISTS (
    SELECT 1
    FROM public.plant_capability_assignments AS assignments
    WHERE assignments.plant_id = NEW.plant_id
      AND assignments.habit_id = NEW.id
      AND assignments.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Plant % or capability instance % is already assigned',
      NEW.plant_id,
      NEW.id
      USING ERRCODE = '23505';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_legacy_habit_plant_assignment
  AFTER INSERT OR UPDATE OF plant_id ON public.habits
  FOR EACH ROW
  WHEN (NEW.plant_id IS NOT NULL)
  EXECUTE FUNCTION public.sync_legacy_habit_plant_assignment();

REVOKE ALL ON FUNCTION public.sync_legacy_habit_plant_assignment() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sync_legacy_habit_plant_assignment() FROM anon;
REVOKE ALL ON FUNCTION public.sync_legacy_habit_plant_assignment() FROM authenticated;

DO $$
BEGIN
  IF EXISTS (
    SELECT habit_id
    FROM public.plant_capability_assignments
    GROUP BY habit_id
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Failed to isolate every capability instance by plant';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.habit_sessions AS sessions
    JOIN public.plant_capability_assignments AS assignments
      ON assignments.habit_id = sessions.habit_id
      AND assignments.user_id = sessions.user_id
    WHERE sessions.source_plant_id IS NOT NULL
      AND sessions.source_plant_id <> assignments.plant_id
  ) THEN
    RAISE EXCEPTION 'A capability session is attached to a different plant instance';
  END IF;
END;
$$;

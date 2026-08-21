-- Add the internal capability plugin seam without renaming the legacy guided
-- habit tables. Definitions stay in code; this table stores per-plant instance
-- configuration and its definition version.

ALTER TABLE public.habits
  ADD COLUMN config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN definition_version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN archived_at TIMESTAMPTZ,
  ADD CONSTRAINT habits_config_object_check
    CHECK (jsonb_typeof(config) = 'object'),
  ADD CONSTRAINT habits_definition_version_positive
    CHECK (definition_version > 0);

CREATE INDEX plant_capability_assignments_user_plant_idx
  ON public.plant_capability_assignments (user_id, plant_id);

CREATE INDEX habits_user_type_active_idx
  ON public.habits (user_id, type, created_at DESC)
  WHERE is_active = TRUE AND archived_at IS NULL;

-- Invoker RPCs need only these columns to validate plant ownership and state.
-- RLS remains the row boundary; no plant write privilege is added.
GRANT SELECT (id, user_id, status)
  ON TABLE public.plants
  TO authenticated;

-- Serialize on a plant-scoped advisory lock, then create the capability
-- instance and assignment in one transaction. The nullable legacy anchor is updated only
-- after the canonical assignment exists, so application code no longer
-- depends on the compatibility trigger.
CREATE OR REPLACE FUNCTION public.create_plant_capability_instance(
  p_plant_id UUID,
  p_type TEXT,
  p_name TEXT,
  p_description TEXT,
  p_unit TEXT,
  p_custom_unit TEXT DEFAULT NULL,
  p_session_duration_minutes INTEGER DEFAULT 30,
  p_definition_version INTEGER DEFAULT 1,
  p_config JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_plant_status TEXT;
  v_existing public.habits%ROWTYPE;
  v_created public.habits%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_plant_id::text, 0)
  );

  SELECT plants.status
  INTO v_plant_status
  FROM public.plants AS plants
  WHERE plants.id = p_plant_id
    AND plants.user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plant not found' USING ERRCODE = '42501';
  END IF;

  IF v_plant_status = 'dead' THEN
    RAISE EXCEPTION 'Plant cannot receive a capability' USING ERRCODE = '55000';
  END IF;

  SELECT habits.*
  INTO v_existing
  FROM public.plant_capability_assignments AS assignments
  JOIN public.habits AS habits
    ON habits.id = assignments.habit_id
    AND habits.user_id = assignments.user_id
  WHERE assignments.plant_id = p_plant_id
    AND assignments.user_id = v_user_id;

  IF FOUND THEN
    IF v_existing.type <> p_type THEN
      RAISE EXCEPTION 'Plant already has a different capability'
        USING ERRCODE = '23505';
    END IF;

    RETURN jsonb_build_object(
      'habit', to_jsonb(v_existing),
      'outcome', 'already_attached'
    );
  END IF;

  INSERT INTO public.habits (
    user_id,
    plant_id,
    type,
    name,
    description,
    unit,
    custom_unit,
    session_duration_minutes,
    config,
    definition_version
  )
  VALUES (
    v_user_id,
    NULL,
    p_type,
    p_name,
    p_description,
    p_unit,
    p_custom_unit,
    p_session_duration_minutes,
    COALESCE(p_config, '{}'::jsonb),
    p_definition_version
  )
  RETURNING * INTO v_created;

  INSERT INTO public.plant_capability_assignments (
    plant_id,
    habit_id,
    user_id
  )
  VALUES (
    p_plant_id,
    v_created.id,
    v_user_id
  );

  UPDATE public.habits
  SET plant_id = p_plant_id,
      updated_at = now()
  WHERE id = v_created.id
    AND user_id = v_user_id
  RETURNING * INTO v_created;

  RETURN jsonb_build_object(
    'habit', to_jsonb(v_created),
    'outcome', 'attached'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.create_plant_capability_instance(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  INTEGER,
  JSONB
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_plant_capability_instance(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  INTEGER,
  JSONB
) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_plant_capability_instance(
  UUID,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  TEXT,
  INTEGER,
  INTEGER,
  JSONB
) TO authenticated;

-- Pause and remove preserve the capability instance and all habit-owned logs.
-- Remove only frees the plant slot and clears the deprecated plant anchor.
CREATE OR REPLACE FUNCTION public.manage_plant_capability_instance(
  p_plant_id UUID,
  p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_habit public.habits%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
  END IF;

  IF p_action NOT IN ('pause', 'resume', 'remove') THEN
    RAISE EXCEPTION 'Unsupported capability action' USING ERRCODE = '22023';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_plant_id::text, 0)
  );

  PERFORM 1
  FROM public.plants AS plants
  WHERE plants.id = p_plant_id
    AND plants.user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plant not found' USING ERRCODE = '42501';
  END IF;

  SELECT habits.*
  INTO v_habit
  FROM public.plant_capability_assignments AS assignments
  JOIN public.habits AS habits
    ON habits.id = assignments.habit_id
    AND habits.user_id = assignments.user_id
  WHERE assignments.plant_id = p_plant_id
    AND assignments.user_id = v_user_id
  FOR UPDATE OF assignments, habits;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Capability instance not found' USING ERRCODE = '42501';
  END IF;

  IF p_action IN ('pause', 'remove') AND EXISTS (
    SELECT 1
    FROM public.habit_sessions AS sessions
    WHERE sessions.habit_id = v_habit.id
      AND sessions.user_id = v_user_id
      AND sessions.status IN ('running', 'paused', 'awaiting_completion')
  ) THEN
    RAISE EXCEPTION 'Finish the open session before managing this capability'
      USING ERRCODE = '55000';
  END IF;

  IF p_action = 'pause' THEN
    IF v_habit.archived_at IS NOT NULL THEN
      RAISE EXCEPTION 'Archived capability cannot be paused' USING ERRCODE = '55000';
    END IF;

    UPDATE public.habits AS habits
    SET is_active = FALSE,
        updated_at = now()
    WHERE habits.id = v_habit.id
      AND habits.user_id = v_user_id
    RETURNING habits.* INTO v_habit;
  ELSIF p_action = 'resume' THEN
    IF v_habit.archived_at IS NOT NULL THEN
      RAISE EXCEPTION 'Archived capability cannot be resumed' USING ERRCODE = '55000';
    END IF;

    UPDATE public.habits AS habits
    SET is_active = TRUE,
        updated_at = now()
    WHERE habits.id = v_habit.id
      AND habits.user_id = v_user_id
    RETURNING habits.* INTO v_habit;
  ELSE
    UPDATE public.habits AS habits
    SET is_active = FALSE,
        archived_at = COALESCE(habits.archived_at, now()),
        plant_id = NULL,
        updated_at = now()
    WHERE habits.id = v_habit.id
      AND habits.user_id = v_user_id
    RETURNING habits.* INTO v_habit;

    DELETE FROM public.plant_capability_assignments AS assignments
    WHERE assignments.plant_id = p_plant_id
      AND assignments.habit_id = v_habit.id
      AND assignments.user_id = v_user_id;
  END IF;

  RETURN jsonb_build_object(
    'habit', to_jsonb(v_habit),
    'state', CASE p_action
      WHEN 'resume' THEN 'active'
      WHEN 'pause' THEN 'paused'
      ELSE 'removed'
    END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.manage_plant_capability_instance(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.manage_plant_capability_instance(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.manage_plant_capability_instance(UUID, TEXT) TO authenticated;

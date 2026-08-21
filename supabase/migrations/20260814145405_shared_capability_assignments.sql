-- Normalize guided capability attachments so one reusable habit can serve many plants.
-- Each plant has at most one capability, while the capability owns shared session progress.

ALTER TABLE public.habits
  ADD CONSTRAINT habits_id_user_unique UNIQUE (id, user_id);

CREATE TABLE public.plant_capability_assignments (
  plant_id UUID PRIMARY KEY,
  habit_id UUID NOT NULL,
  user_id UUID NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT plant_capability_assignments_plant_owner_fkey
    FOREIGN KEY (plant_id, user_id)
    REFERENCES public.plants (id, user_id)
    ON DELETE CASCADE,
  CONSTRAINT plant_capability_assignments_habit_owner_fkey
    FOREIGN KEY (habit_id, user_id)
    REFERENCES public.habits (id, user_id)
    ON DELETE CASCADE
);

-- The primary key covers plant lookups and plant deletes. This index covers
-- capability fan-out reads and the habit-side foreign-key cascade.
CREATE INDEX plant_capability_assignments_habit_owner_idx
  ON public.plant_capability_assignments (habit_id, user_id);

ALTER TABLE public.plant_capability_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own plant capability assignments"
  ON public.plant_capability_assignments FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own plant capability assignments"
  ON public.plant_capability_assignments FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own plant capability assignments"
  ON public.plant_capability_assignments FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own plant capability assignments"
  ON public.plant_capability_assignments FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON TABLE public.plant_capability_assignments FROM PUBLIC;
REVOKE ALL ON TABLE public.plant_capability_assignments FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE
  ON TABLE public.plant_capability_assignments
  TO authenticated;

-- Preserve the route-origin plant on existing sessions before decoupling the
-- nullable habits.plant_id legacy anchor from canonical assignments.
ALTER TABLE public.habit_sessions
  ADD COLUMN source_plant_id UUID;

UPDATE public.habit_sessions AS sessions
SET source_plant_id = habits.plant_id
FROM public.habits AS habits
WHERE habits.id = sessions.habit_id
  AND habits.user_id = sessions.user_id;

ALTER TABLE public.habit_sessions
  ADD CONSTRAINT habit_sessions_source_plant_owner_fkey
    FOREIGN KEY (source_plant_id, user_id)
    REFERENCES public.plants (id, user_id)
    ON DELETE SET NULL (source_plant_id);

CREATE INDEX habit_sessions_source_plant_owner_idx
  ON public.habit_sessions (source_plant_id, user_id)
  WHERE source_plant_id IS NOT NULL;

-- Every legacy habit-to-plant link becomes an assignment. The former
-- habits_plant_unique constraint guarantees that no plant is lost to conflict.
INSERT INTO public.plant_capability_assignments (
  plant_id,
  habit_id,
  user_id,
  assigned_at
)
SELECT
  plant_id,
  id,
  user_id,
  now()
FROM public.habits;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.habits AS habits
    LEFT JOIN public.plant_capability_assignments AS assignments
      ON assignments.plant_id = habits.plant_id
      AND assignments.habit_id = habits.id
      AND assignments.user_id = habits.user_id
    WHERE assignments.plant_id IS NULL
  ) THEN
    RAISE EXCEPTION 'Failed to preserve every legacy habit-to-plant assignment';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.habit_sessions AS sessions
    JOIN public.habits AS habits
      ON habits.id = sessions.habit_id
      AND habits.user_id = sessions.user_id
    WHERE sessions.source_plant_id IS DISTINCT FROM habits.plant_id
  ) THEN
    RAISE EXCEPTION 'Failed to preserve every existing session source plant';
  END IF;
END;
$$;

-- Keep habits.plant_id as a nullable rollout anchor for older application
-- builds, but deleting that plant must never delete the shared capability or
-- its history.
DROP POLICY "Users can create own habits" ON public.habits;
DROP POLICY "Users can update own habits" ON public.habits;

ALTER TABLE public.habits
  DROP CONSTRAINT habits_plant_owner_fkey,
  ALTER COLUMN plant_id DROP NOT NULL,
  ADD CONSTRAINT habits_plant_owner_fkey
    FOREIGN KEY (plant_id, user_id)
    REFERENCES public.plants (id, user_id)
    ON DELETE SET NULL (plant_id);

-- Habit ownership is capability-independent. The nullable legacy anchor still
-- has a composite owner foreign key, while assignments have their own RLS.
CREATE POLICY "Users can create own habits"
  ON public.habits FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own habits"
  ON public.habits FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Older builds express a "move" by updating habits.plant_id. During the
-- expand/contract rollout, mirror the new anchor into the assignment table but
-- never remove the previous assignment, so that operation degrades to sharing.
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
  ON CONFLICT (plant_id) DO NOTHING;

  IF NOT EXISTS (
    SELECT 1
    FROM public.plant_capability_assignments AS assignments
    WHERE assignments.plant_id = NEW.plant_id
      AND assignments.habit_id = NEW.id
      AND assignments.user_id = NEW.user_id
  ) THEN
    RAISE EXCEPTION 'Plant % already has a different capability', NEW.plant_id
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

-- A user can move a habit reminder after an earlier reminder was already
-- dispatched on the same local date. Version the idempotency key by the
-- configured time so the new schedule can still create one durable inbox row.

CREATE OR REPLACE FUNCTION private.version_habit_reminder_dedupe_key()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_plant_id UUID;
  v_local_date DATE;
  v_reminder_time TIME;
BEGIN
  IF NEW.type NOT IN ('habit_reminder', 'goal_warning')
    OR NEW.dedupe_key IS NULL
    OR NEW.data IS NULL
    OR NOT (NEW.data ? 'plant_id')
    OR NOT (NEW.data ? 'local_date')
  THEN
    RETURN NEW;
  END IF;

  v_plant_id := (NEW.data->>'plant_id')::UUID;
  v_local_date := (NEW.data->>'local_date')::DATE;

  SELECT plant.reminder_time
  INTO v_reminder_time
  FROM public.plants plant
  WHERE plant.id = v_plant_id
    AND plant.user_id = NEW.user_id;

  IF v_reminder_time IS NOT NULL THEN
    NEW.dedupe_key :=
      'habit-reminder:' || v_plant_id::TEXT || ':' || v_local_date::TEXT || ':' ||
      TO_CHAR(v_reminder_time, 'HH24:MI:SS');
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION private.version_habit_reminder_dedupe_key() IS
  'Versions scheduled habit reminder idempotency by local date and configured time.';

REVOKE ALL ON FUNCTION private.version_habit_reminder_dedupe_key()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS notifications_version_habit_reminder_dedupe
  ON public.notifications;
CREATE TRIGGER notifications_version_habit_reminder_dedupe
  BEFORE INSERT ON public.notifications
  FOR EACH ROW
  WHEN (
    NEW.dedupe_key IS NOT NULL
    AND NEW.type IN ('habit_reminder', 'goal_warning')
  )
  EXECUTE FUNCTION private.version_habit_reminder_dedupe_key();

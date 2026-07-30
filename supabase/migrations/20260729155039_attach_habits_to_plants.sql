-- Attach guided habit capabilities to persisted garden plants.
-- Plants remain the visual/spatial aggregate root; habits own session behavior.

ALTER TABLE public.habits
  ADD COLUMN plant_id UUID;

DO $$
DECLARE
  habit_row RECORD;
  new_plant_id UUID;
  next_position INTEGER;
  next_grid_row INTEGER;
BEGIN
  FOR habit_row IN
    SELECT id, user_id, name, description
    FROM public.habits
    WHERE plant_id IS NULL
    ORDER BY created_at, id
  LOOP
    SELECT COALESCE(MAX(position), 0) + 1
    INTO next_position
    FROM public.plants
    WHERE user_id = habit_row.user_id;

    SELECT GREATEST(
      COALESCE((
        SELECT MAX(COALESCE(grid_row, 0) + COALESCE(grid_size, 1))
        FROM public.plants
        WHERE user_id = habit_row.user_id
          AND status <> 'dead'
      ), 0),
      COALESCE((
        SELECT MAX(COALESCE(grid_row, 0) + COALESCE(grid_size, 1))
        FROM public.placed_decorations
        WHERE user_id = habit_row.user_id
      ), 0)
    )
    INTO next_grid_row;

    INSERT INTO public.plants (
      user_id,
      plant_type_id,
      name,
      habit_description,
      position,
      grid_size,
      grid_row,
      grid_col,
      current_moisture,
      growth_percentage,
      status,
      reminder_enabled
    )
    VALUES (
      habit_row.user_id,
      'grass',
      habit_row.name,
      habit_row.description,
      next_position,
      1,
      next_grid_row,
      0,
      100,
      0,
      'growing',
      FALSE
    )
    RETURNING id INTO new_plant_id;

    UPDATE public.habits
    SET plant_id = new_plant_id
    WHERE id = habit_row.id;
  END LOOP;
END;
$$;

ALTER TABLE public.plants
  ADD CONSTRAINT plants_id_user_unique UNIQUE (id, user_id);

ALTER TABLE public.habits
  ALTER COLUMN plant_id SET NOT NULL,
  ADD CONSTRAINT habits_plant_unique UNIQUE (plant_id),
  ADD CONSTRAINT habits_plant_owner_fkey
    FOREIGN KEY (plant_id, user_id)
    REFERENCES public.plants (id, user_id)
    ON DELETE CASCADE;

CREATE INDEX habits_user_plant_idx
  ON public.habits (user_id, plant_id);

DROP POLICY "Users can create own habits" ON public.habits;
DROP POLICY "Users can update own habits" ON public.habits;

CREATE POLICY "Users can create own habits"
  ON public.habits FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM public.plants
      WHERE plants.id = habits.plant_id
        AND plants.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can update own habits"
  ON public.habits FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1
      FROM public.plants
      WHERE plants.id = habits.plant_id
        AND plants.user_id = (SELECT auth.uid())
    )
  );

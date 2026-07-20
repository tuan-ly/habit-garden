-- Decorations use the same square footprint model as plants: 1x1, 2x2, 3x3, ...
ALTER TABLE public.decoration_types
  DROP CONSTRAINT IF EXISTS decoration_types_grid_size_check;
ALTER TABLE public.decoration_types
  ADD CONSTRAINT decoration_types_grid_size_check CHECK (grid_size >= 1);
ALTER TABLE public.placed_decorations
  DROP CONSTRAINT IF EXISTS placed_decorations_grid_size_check;
ALTER TABLE public.placed_decorations
  ADD CONSTRAINT placed_decorations_grid_size_check CHECK (grid_size >= 1);
-- Reuse the sanctuary artwork as real catalog entities instead of fixed ambient scenes.
UPDATE public.decoration_types
SET image_url = '/garden/decorations/sanctuary-rock-lantern.png',
    grid_size = 2
WHERE slug = 'stone-lantern';
UPDATE public.decoration_types
SET image_url = '/garden/decorations/sanctuary-pond.png',
    grid_size = 3
WHERE slug = 'koi-pond';
-- Keep previously placed instances aligned with their canonical catalog type.
-- Process larger objects first. If an expanded footprint collides with a plant
-- or another decoration, move it deterministically to the nearest free anchor.
DO $$
DECLARE
  item record;
  candidate_row integer;
  candidate_col integer;
  radius integer;
  row_offset integer;
  col_offset integer;
  found_position boolean;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('reconcile-decoration-footprints'));

  FOR item IN
    SELECT pd.id, pd.user_id, pd.grid_row, pd.grid_col, dt.grid_size AS desired_size
    FROM public.placed_decorations pd
    JOIN public.decoration_types dt ON dt.id = pd.decoration_type_id
    ORDER BY dt.grid_size DESC, pd.placed_at ASC, pd.id ASC
  LOOP
    found_position := false;

    FOR radius IN 0..64 LOOP
      FOR row_offset IN -radius..radius LOOP
        FOR col_offset IN -radius..radius LOOP
          CONTINUE WHEN radius > 0
            AND abs(row_offset) <> radius
            AND abs(col_offset) <> radius;

          candidate_row := item.grid_row + row_offset;
          candidate_col := item.grid_col + col_offset;
          CONTINUE WHEN candidate_row < 0 OR candidate_col < 0;

          IF NOT EXISTS (
            SELECT 1
            FROM public.plants p
            WHERE p.user_id = item.user_id
              AND p.status <> 'dead'
              AND int4range(candidate_row, candidate_row + item.desired_size) &&
                  int4range(p.grid_row, p.grid_row + coalesce(p.grid_size, 1))
              AND int4range(candidate_col, candidate_col + item.desired_size) &&
                  int4range(p.grid_col, p.grid_col + coalesce(p.grid_size, 1))
          ) AND NOT EXISTS (
            SELECT 1
            FROM public.placed_decorations other
            WHERE other.user_id = item.user_id
              AND other.id <> item.id
              AND int4range(candidate_row, candidate_row + item.desired_size) &&
                  int4range(other.grid_row, other.grid_row + other.grid_size)
              AND int4range(candidate_col, candidate_col + item.desired_size) &&
                  int4range(other.grid_col, other.grid_col + other.grid_size)
          ) THEN
            UPDATE public.placed_decorations
            SET grid_row = candidate_row,
                grid_col = candidate_col,
                grid_size = item.desired_size
            WHERE id = item.id;
            found_position := true;
            EXIT;
          END IF;
        END LOOP;
        EXIT WHEN found_position;
      END LOOP;
      EXIT WHEN found_position;
    END LOOP;

    IF NOT found_position THEN
      RAISE EXCEPTION 'Could not reconcile decoration % within search radius', item.id;
    END IF;
  END LOOP;
END
$$;
-- Prevent catalog drift from returning: every new placement copies the current
-- canonical footprint, while the reconciliation above upgrades legacy rows.
CREATE OR REPLACE FUNCTION public.sync_placed_decoration_grid_size()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  SELECT dt.grid_size
  INTO NEW.grid_size
  FROM public.decoration_types dt
  WHERE dt.id = NEW.decoration_type_id;

  IF NEW.grid_size IS NULL THEN
    RAISE EXCEPTION 'Decoration type % does not exist', NEW.decoration_type_id;
  END IF;

  RETURN NEW;
END
$$;
DROP TRIGGER IF EXISTS sync_placed_decoration_grid_size
  ON public.placed_decorations;
CREATE TRIGGER sync_placed_decoration_grid_size
BEFORE INSERT OR UPDATE OF decoration_type_id
ON public.placed_decorations
FOR EACH ROW
EXECUTE FUNCTION public.sync_placed_decoration_grid_size();

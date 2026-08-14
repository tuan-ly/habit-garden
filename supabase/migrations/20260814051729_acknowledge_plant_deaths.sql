-- A dead plant remains in the active garden until its owner has seen the loss.
ALTER TABLE public.plants
  ADD COLUMN IF NOT EXISTS death_acknowledged_at TIMESTAMPTZ;

-- Existing deaths predate the acknowledgement workflow and must not surface as
-- a surprise backlog of dialogs on the next garden visit.
UPDATE public.plants
SET death_acknowledged_at = COALESCE(died_at, now())
WHERE status = 'dead'
  AND death_acknowledged_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_plants_pending_death_acknowledgement
  ON public.plants (user_id, died_at)
  WHERE status = 'dead' AND death_acknowledged_at IS NULL;

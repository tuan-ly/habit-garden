-- Reconcile the replayed migration chain with the schema currently running on
-- the linked project. Data from watering_logs was migrated to activity_logs by
-- 20260131121936_gentle_growth_phase1_part4_data_migration.sql.
DROP TABLE IF EXISTS public.watering_logs CASCADE;
DROP TABLE IF EXISTS public.daily_weather CASCADE;
DROP TABLE IF EXISTS public.energy_logs CASCADE;

-- These columns were deployed directly to the linked project and therefore
-- were present in the schema without a corresponding remote ledger statement.
ALTER TABLE public.plants
  ADD COLUMN IF NOT EXISTS easy_mode BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tiny_seed TEXT;

COMMENT ON COLUMN public.plants.easy_mode IS
  'Whether user enabled 2-minute rule for this habit';
COMMENT ON COLUMN public.plants.tiny_seed IS
  'The 2-minute version of the habit';

CREATE INDEX IF NOT EXISTS idx_plants_easy_mode
  ON public.plants (user_id, easy_mode)
  WHERE easy_mode = true;

-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Grant usage to postgres user
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule daily moisture decay at midnight UTC (7 AM Vietnam time)
-- This runs the update_daily_moisture() function every day
SELECT cron.schedule(
  'daily-moisture-decay',
  '0 0 * * *',  -- Every day at midnight UTC
  $$SELECT update_daily_moisture()$$
);

-- Also create a function to manually trigger moisture decay (for testing)
CREATE OR REPLACE FUNCTION trigger_moisture_decay()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_plants INTEGER;
  dead_plants INTEGER;
BEGIN
  -- Get count of plants that will be affected
  SELECT COUNT(*) INTO affected_plants
  FROM plants p
  WHERE p.status = 'growing'
    AND (p.last_watered_at IS NULL OR p.last_watered_at::date < CURRENT_DATE);
  
  -- Run the moisture decay
  PERFORM update_daily_moisture();
  
  -- Get count of plants that died
  SELECT COUNT(*) INTO dead_plants
  FROM plants
  WHERE status = 'dead' 
    AND died_at >= NOW() - INTERVAL '1 minute';
  
  RETURN jsonb_build_object(
    'success', true,
    'plants_affected', affected_plants,
    'plants_died', dead_plants,
    'executed_at', NOW()
  );
END;
$$;;

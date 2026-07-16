-- Fix get_plant_health function search path
CREATE OR REPLACE FUNCTION get_plant_health(p_moisture INTEGER)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  IF p_moisture <= 0 THEN
    RETURN 'dead';
  ELSIF p_moisture <= 20 THEN
    RETURN 'critical';
  ELSIF p_moisture <= 40 THEN
    RETURN 'wilting';
  ELSIF p_moisture <= 60 THEN
    RETURN 'thirsty';
  ELSIF p_moisture <= 80 THEN
    RETURN 'healthy';
  ELSE
    RETURN 'thriving';
  END IF;
END;
$$;

-- Remove overly permissive insert policy
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Notifications are inserted only by SECURITY DEFINER functions, so no public insert policy needed
-- The create_notification function handles all inserts with SECURITY DEFINER;

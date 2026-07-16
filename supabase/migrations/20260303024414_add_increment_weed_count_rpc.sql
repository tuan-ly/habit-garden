CREATE OR REPLACE FUNCTION increment_weed_count(plant_ids uuid[], max_weeds int DEFAULT 3)
RETURNS int AS $$
DECLARE
  affected_count int;
BEGIN
  UPDATE plants
  SET 
    weed_count = LEAST(max_weeds, COALESCE(weed_count, 0) + 1),
    last_weed_added = now(),
    updated_at = now()
  WHERE id = ANY(plant_ids);
  
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;

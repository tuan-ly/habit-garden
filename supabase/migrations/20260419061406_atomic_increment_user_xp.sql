CREATE OR REPLACE FUNCTION public.increment_user_xp(p_user_id uuid, p_delta integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_xp integer;
BEGIN
  IF p_delta IS NULL OR p_delta = 0 THEN
    SELECT xp INTO new_xp FROM public.profiles WHERE id = p_user_id;
    RETURN COALESCE(new_xp, 0);
  END IF;

  UPDATE public.profiles
  SET xp = COALESCE(xp, 0) + p_delta,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING xp INTO new_xp;

  RETURN COALESCE(new_xp, 0);
END;
$$;

REVOKE ALL ON FUNCTION public.increment_user_xp(uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_user_xp(uuid, integer) TO authenticated, service_role;;

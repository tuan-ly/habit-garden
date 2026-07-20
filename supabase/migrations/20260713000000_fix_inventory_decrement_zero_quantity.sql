-- quantity has CHECK (quantity > 0), so UPDATE 1 -> 0 fails before the old
-- function can delete the row. Lock first, then DELETE directly at zero.
CREATE OR REPLACE FUNCTION public.atomic_inventory_decrement(
  p_inventory_id uuid,
  p_user_id uuid,
  p_amount integer DEFAULT 1
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_current_qty integer;
  v_new_qty integer;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'invalid decrement amount';
  END IF;

  SELECT quantity
  INTO v_current_qty
  FROM public.user_inventory
  WHERE id = p_inventory_id
    AND user_id = p_user_id
  FOR UPDATE;

  IF v_current_qty IS NULL OR v_current_qty < p_amount THEN
    RAISE EXCEPTION 'insufficient inventory quantity';
  END IF;

  v_new_qty := v_current_qty - p_amount;

  IF v_new_qty = 0 THEN
    DELETE FROM public.user_inventory
    WHERE id = p_inventory_id
      AND user_id = p_user_id;
  ELSE
    UPDATE public.user_inventory
    SET quantity = v_new_qty,
        updated_at = now()
    WHERE id = p_inventory_id
      AND user_id = p_user_id;
  END IF;

  RETURN v_new_qty;
END;
$$;
REVOKE ALL ON FUNCTION public.atomic_inventory_decrement(uuid, uuid, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.atomic_inventory_decrement(uuid, uuid, integer)
  TO authenticated, service_role;

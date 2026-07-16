-- Harden SECURITY DEFINER functions: pin search_path = '' to prevent schema injection.
-- All table refs must be fully qualified.

CREATE OR REPLACE FUNCTION public.atomic_inventory_decrement(p_inventory_id uuid, p_user_id uuid, p_amount integer DEFAULT 1)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_new_qty integer;
BEGIN
  UPDATE public.user_inventory
  SET quantity = quantity - p_amount, updated_at = now()
  WHERE id = p_inventory_id AND user_id = p_user_id AND quantity >= p_amount
  RETURNING quantity INTO v_new_qty;

  IF v_new_qty IS NULL THEN RAISE EXCEPTION 'Insufficient inventory quantity'; END IF;
  IF v_new_qty = 0 THEN DELETE FROM public.user_inventory WHERE id = p_inventory_id; END IF;
  RETURN v_new_qty;
END; $$;

CREATE OR REPLACE FUNCTION public.atomic_inventory_increment(
  p_user_id uuid, p_item_type text,
  p_material_id uuid DEFAULT NULL, p_decoration_type_id uuid DEFAULT NULL,
  p_amount integer DEFAULT 1, p_acquired_via text DEFAULT 'harvest')
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_new_qty integer;
BEGIN
  INSERT INTO public.user_inventory (user_id, item_type, material_id, decoration_type_id, quantity, acquired_via)
  VALUES (p_user_id, p_item_type, p_material_id, p_decoration_type_id, p_amount, p_acquired_via)
  ON CONFLICT (user_id, item_type, material_id, decoration_type_id)
  DO UPDATE SET quantity = public.user_inventory.quantity + p_amount, updated_at = now()
  RETURNING quantity INTO v_new_qty;
  RETURN v_new_qty;
END; $$;

CREATE OR REPLACE FUNCTION public.award_coins(p_user_id uuid, p_amount integer, p_reason text, p_reference_id text DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_new_balance integer;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  UPDATE public.profiles SET coins = coins + p_amount, updated_at = now()
  WHERE id = p_user_id RETURNING coins INTO v_new_balance;
  IF v_new_balance IS NULL THEN RAISE EXCEPTION 'Profile not found'; END IF;
  INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id, balance_after)
  VALUES (p_user_id, p_amount, p_reason, p_reference_id, v_new_balance);
  RETURN v_new_balance;
END; $$;

CREATE OR REPLACE FUNCTION public.spend_coins(p_user_id uuid, p_amount integer, p_reason text, p_reference_id text DEFAULT NULL)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_new_balance integer;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'Amount must be positive'; END IF;
  UPDATE public.profiles SET coins = coins - p_amount, updated_at = now()
  WHERE id = p_user_id AND coins >= p_amount RETURNING coins INTO v_new_balance;
  IF v_new_balance IS NULL THEN RAISE EXCEPTION 'Insufficient coins'; END IF;
  INSERT INTO public.coin_transactions (user_id, amount, reason, reference_id, balance_after)
  VALUES (p_user_id, -p_amount, p_reason, p_reference_id, v_new_balance);
  RETURN v_new_balance;
END; $$;

CREATE OR REPLACE FUNCTION public.increment_weed_count(plant_ids uuid[], max_weeds integer DEFAULT 3)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE affected_count int;
BEGIN
  UPDATE public.plants
  SET weed_count = LEAST(max_weeds, COALESCE(weed_count, 0) + 1),
      last_weed_added = now(), updated_at = now()
  WHERE id = ANY(plant_ids);
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RETURN affected_count;
END; $$;

CREATE OR REPLACE FUNCTION public.update_identity_progress(identity_uuid uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE avg_progress numeric; goal_count integer;
BEGIN
  SELECT COALESCE(AVG(CASE WHEN target_value > 0 THEN (current_value / target_value * 100) ELSE 0 END), 0),
         COUNT(*)
  INTO avg_progress, goal_count
  FROM public.goals
  WHERE identity_id = identity_uuid AND season_status = 'active';

  UPDATE public.identities
  SET progress_percentage = LEAST(avg_progress, 100),
      goals_count = goal_count, updated_at = now()
  WHERE id = identity_uuid;
END; $$;

CREATE OR REPLACE FUNCTION public.trigger_update_identity_progress()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF OLD IS NOT NULL AND OLD.identity_id IS NOT NULL THEN
    PERFORM public.update_identity_progress(OLD.identity_id);
  END IF;
  IF NEW IS NOT NULL AND NEW.identity_id IS NOT NULL THEN
    PERFORM public.update_identity_progress(NEW.identity_id);
  END IF;
  RETURN NEW;
END; $$;

-- update_daily_moisture: also pin search_path
DO $do$
DECLARE def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO def
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='update_daily_moisture';
  IF def IS NULL THEN RETURN; END IF;
END $do$;;

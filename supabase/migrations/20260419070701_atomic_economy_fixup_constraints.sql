
-- Allow 'pickup' as acquired_via
ALTER TABLE public.user_inventory DROP CONSTRAINT IF EXISTS user_inventory_acquired_via_check;
ALTER TABLE public.user_inventory ADD CONSTRAINT user_inventory_acquired_via_check
  CHECK (acquired_via = ANY (ARRAY['harvest','craft','purchase','reward','gift','pickup']));

-- Recreate craft_decoration with correct ON CONFLICT
CREATE OR REPLACE FUNCTION public.craft_decoration(
  p_user_id uuid,
  p_recipe_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_recipe record;
  v_decoration_name text;
  v_ingredient record;
  v_inv record;
BEGIN
  IF v_auth_uid IS NULL OR v_auth_uid <> p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT r.id, r.decoration_type_id, r.unlock_level, r.is_active, dt.name
    INTO v_recipe
  FROM public.recipes r
  JOIN public.decoration_types dt ON dt.id = r.decoration_type_id
  WHERE r.id = p_recipe_id
  FOR SHARE;

  IF NOT FOUND THEN RAISE EXCEPTION 'recipe_not_found'; END IF;
  IF NOT v_recipe.is_active THEN RAISE EXCEPTION 'recipe_inactive'; END IF;

  v_decoration_name := v_recipe.name;

  FOR v_ingredient IN
    SELECT material_id, quantity FROM public.recipe_ingredients WHERE recipe_id = p_recipe_id
  LOOP
    SELECT id, quantity INTO v_inv
    FROM public.user_inventory
    WHERE user_id = p_user_id AND item_type = 'material' AND material_id = v_ingredient.material_id
    FOR UPDATE;

    IF NOT FOUND OR v_inv.quantity < v_ingredient.quantity THEN
      RAISE EXCEPTION 'insufficient_materials';
    END IF;

    IF v_inv.quantity = v_ingredient.quantity THEN
      DELETE FROM public.user_inventory WHERE id = v_inv.id;
    ELSE
      UPDATE public.user_inventory SET quantity = quantity - v_ingredient.quantity, updated_at = now() WHERE id = v_inv.id;
    END IF;
  END LOOP;

  INSERT INTO public.user_inventory
    (user_id, item_type, decoration_type_id, quantity, acquired_via, created_at, updated_at)
  VALUES
    (p_user_id, 'decoration', v_recipe.decoration_type_id, 1, 'craft', now(), now())
  ON CONFLICT (user_id, item_type, material_id, decoration_type_id)
  DO UPDATE SET quantity = public.user_inventory.quantity + 1, updated_at = now();

  RETURN jsonb_build_object('success', true, 'decoration_name', v_decoration_name);
END;
$$;

CREATE OR REPLACE FUNCTION public.purchase_decoration(
  p_user_id uuid,
  p_decoration_type_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_deco record;
  v_profile record;
  v_tier_levels jsonb := '{"free":0,"pro":1,"premium":2}';
  v_user_tier int;
  v_req_tier int;
  v_balance int;
BEGIN
  IF v_auth_uid IS NULL OR v_auth_uid <> p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT id, name, coin_price, unlock_level, subscription_tier INTO v_deco
    FROM public.decoration_types WHERE id = p_decoration_type_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'decoration_not_found'; END IF;
  IF v_deco.coin_price IS NULL THEN RAISE EXCEPTION 'not_for_sale'; END IF;

  SELECT level, subscription_tier, coins INTO v_profile
    FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'profile_not_found'; END IF;
  IF v_profile.level < v_deco.unlock_level THEN RAISE EXCEPTION 'level_too_low'; END IF;

  v_user_tier := COALESCE((v_tier_levels->>(COALESCE(v_profile.subscription_tier,'free')))::int, 0);
  v_req_tier  := COALESCE((v_tier_levels->>(v_deco.subscription_tier))::int, 0);
  IF v_user_tier < v_req_tier THEN RAISE EXCEPTION 'tier_required:%', v_deco.subscription_tier; END IF;

  v_balance := v_profile.coins;
  IF v_balance < v_deco.coin_price THEN RAISE EXCEPTION 'insufficient_coins'; END IF;

  UPDATE public.profiles SET coins = coins - v_deco.coin_price, updated_at = now() WHERE id = p_user_id;

  INSERT INTO public.coin_transactions (user_id, amount, transaction_type, source_id, balance_after)
    VALUES (p_user_id, -v_deco.coin_price, 'purchase_decoration', p_decoration_type_id, v_balance - v_deco.coin_price);

  INSERT INTO public.user_inventory
    (user_id, item_type, decoration_type_id, quantity, acquired_via, created_at, updated_at)
  VALUES
    (p_user_id, 'decoration', v_deco.id, 1, 'purchase', now(), now())
  ON CONFLICT (user_id, item_type, material_id, decoration_type_id)
  DO UPDATE SET quantity = public.user_inventory.quantity + 1, updated_at = now();

  RETURN jsonb_build_object('success', true, 'item_name', v_deco.name);
END;
$$;

CREATE OR REPLACE FUNCTION public.pickup_decoration(
  p_user_id uuid,
  p_placed_decoration_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_auth_uid uuid := auth.uid();
  v_deco record;
BEGIN
  IF v_auth_uid IS NULL OR v_auth_uid <> p_user_id THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT id, user_id, decoration_type_id INTO v_deco
    FROM public.placed_decorations
    WHERE id = p_placed_decoration_id
    FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'decoration_not_found'; END IF;
  IF v_deco.user_id <> p_user_id THEN RAISE EXCEPTION 'not_owner'; END IF;

  DELETE FROM public.placed_decorations WHERE id = p_placed_decoration_id;

  INSERT INTO public.user_inventory
    (user_id, item_type, decoration_type_id, quantity, acquired_via, created_at, updated_at)
  VALUES
    (p_user_id, 'decoration', v_deco.decoration_type_id, 1, 'pickup', now(), now())
  ON CONFLICT (user_id, item_type, material_id, decoration_type_id)
  DO UPDATE SET quantity = public.user_inventory.quantity + 1, updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;
;

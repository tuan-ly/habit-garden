-- ============================================
-- Atomic Economy Functions
-- Eliminates race conditions in coin/inventory operations
-- ============================================

-- 1. award_coins: Atomic coin addition + transaction log
CREATE OR REPLACE FUNCTION public.award_coins(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_reference_id text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Atomic increment
  UPDATE profiles
  SET coins = coins + p_amount, updated_at = now()
  WHERE id = p_user_id
  RETURNING coins INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'Profile not found';
  END IF;

  -- Log transaction in same transaction
  INSERT INTO coin_transactions (user_id, amount, reason, reference_id, balance_after)
  VALUES (p_user_id, p_amount, p_reason, p_reference_id, v_new_balance);

  RETURN v_new_balance;
END;
$$;

-- 2. spend_coins: Atomic coin deduction with balance check + transaction log
CREATE OR REPLACE FUNCTION public.spend_coins(
  p_user_id uuid,
  p_amount integer,
  p_reason text,
  p_reference_id text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance integer;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- Atomic decrement with balance check
  UPDATE profiles
  SET coins = coins - p_amount, updated_at = now()
  WHERE id = p_user_id AND coins >= p_amount
  RETURNING coins INTO v_new_balance;

  IF v_new_balance IS NULL THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;

  -- Log transaction in same transaction
  INSERT INTO coin_transactions (user_id, amount, reason, reference_id, balance_after)
  VALUES (p_user_id, -p_amount, p_reason, p_reference_id, v_new_balance);

  RETURN v_new_balance;
END;
$$;

-- 3. atomic_inventory_decrement: Decrement inventory quantity, delete if 0
CREATE OR REPLACE FUNCTION public.atomic_inventory_decrement(
  p_inventory_id uuid,
  p_user_id uuid,
  p_amount integer DEFAULT 1
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_qty integer;
BEGIN
  -- Atomic decrement with check
  UPDATE user_inventory
  SET quantity = quantity - p_amount, updated_at = now()
  WHERE id = p_inventory_id AND user_id = p_user_id AND quantity >= p_amount
  RETURNING quantity INTO v_new_qty;

  IF v_new_qty IS NULL THEN
    RAISE EXCEPTION 'Insufficient inventory quantity';
  END IF;

  -- Clean up zero-quantity rows
  IF v_new_qty = 0 THEN
    DELETE FROM user_inventory WHERE id = p_inventory_id;
  END IF;

  RETURN v_new_qty;
END;
$$;

-- 4. atomic_inventory_increment: Upsert inventory item
CREATE OR REPLACE FUNCTION public.atomic_inventory_increment(
  p_user_id uuid,
  p_item_type text,
  p_material_id uuid DEFAULT NULL,
  p_decoration_type_id uuid DEFAULT NULL,
  p_amount integer DEFAULT 1,
  p_acquired_via text DEFAULT 'harvest'
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_qty integer;
BEGIN
  INSERT INTO user_inventory (user_id, item_type, material_id, decoration_type_id, quantity, acquired_via)
  VALUES (p_user_id, p_item_type, p_material_id, p_decoration_type_id, p_amount, p_acquired_via)
  ON CONFLICT (user_id, item_type, material_id, decoration_type_id)
  DO UPDATE SET quantity = user_inventory.quantity + p_amount, updated_at = now()
  RETURNING quantity INTO v_new_qty;

  RETURN v_new_qty;
END;
$$;

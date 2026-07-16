-- Crafting & Decoration System
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text NOT NULL,
  image_url text,
  rarity text NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  plant_type_id text REFERENCES plant_types(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Materials are public" ON materials FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS decoration_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text NOT NULL,
  image_url text,
  grid_size integer NOT NULL DEFAULT 1 CHECK (grid_size IN (1, 2)),
  category text NOT NULL DEFAULT 'furniture'
    CHECK (category IN ('furniture', 'nature', 'lighting', 'path', 'water', 'seasonal', 'special')),
  rarity text NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  unlock_level integer NOT NULL DEFAULT 1,
  coin_price integer,
  subscription_tier text NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'pro', 'premium')),
  is_craftable boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE decoration_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Decoration types are public" ON decoration_types FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS recipes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decoration_type_id uuid NOT NULL REFERENCES decoration_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  unlock_level integer NOT NULL DEFAULT 1,
  craft_time_minutes integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipes are public" ON recipes FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES materials(id),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0)
);
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipe ingredients are public" ON recipe_ingredients FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);

CREATE TABLE IF NOT EXISTS user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL CHECK (item_type IN ('material', 'decoration')),
  material_id uuid REFERENCES materials(id),
  decoration_type_id uuid REFERENCES decoration_types(id),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  acquired_via text NOT NULL DEFAULT 'craft'
    CHECK (acquired_via IN ('harvest', 'craft', 'purchase', 'reward', 'gift')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT inventory_item_check CHECK (
    (item_type = 'material' AND material_id IS NOT NULL AND decoration_type_id IS NULL)
    OR (item_type = 'decoration' AND decoration_type_id IS NOT NULL AND material_id IS NULL)
  ),
  UNIQUE (user_id, item_type, material_id, decoration_type_id)
);
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own inventory" ON user_inventory FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own inventory" ON user_inventory FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own inventory" ON user_inventory FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own inventory" ON user_inventory FOR DELETE USING ((select auth.uid()) = user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_user ON user_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_user_inventory_item ON user_inventory(user_id, item_type);

CREATE TABLE IF NOT EXISTS placed_decorations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decoration_type_id uuid NOT NULL REFERENCES decoration_types(id),
  grid_row integer NOT NULL,
  grid_col integer NOT NULL,
  grid_size integer NOT NULL DEFAULT 1,
  rotation integer NOT NULL DEFAULT 0 CHECK (rotation IN (0, 90, 180, 270)),
  placed_at timestamptz DEFAULT now()
);
ALTER TABLE placed_decorations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own decorations" ON placed_decorations FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own decorations" ON placed_decorations FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update own decorations" ON placed_decorations FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete own decorations" ON placed_decorations FOR DELETE USING ((select auth.uid()) = user_id);
CREATE INDEX IF NOT EXISTS idx_placed_decorations_user ON placed_decorations(user_id);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  reference_id text,
  balance_after integer NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON coin_transactions FOR SELECT USING ((select auth.uid()) = user_id);
-- NOTE: no client INSERT policy. Coin writes must go through SECURITY DEFINER functions.
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user ON coin_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_materials_plant_type ON materials(plant_type_id);;

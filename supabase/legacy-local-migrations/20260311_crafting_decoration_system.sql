-- ============================================
-- Crafting & Decoration System
-- Materials, Recipes, Inventory, Placed Decorations, Coins
-- ============================================

-- 1. Add coins to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 0;

-- ============================================
-- 2. Materials (produced by mature plants)
-- ============================================
CREATE TABLE IF NOT EXISTS materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text NOT NULL,
  image_url text,
  rarity text NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  plant_type_id uuid REFERENCES plant_types(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Materials are public" ON materials FOR SELECT USING (true);

-- ============================================
-- 3. Decoration Types (definitions for all placeable decorations)
-- ============================================
CREATE TABLE IF NOT EXISTS decoration_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  icon text NOT NULL,
  image_url text,
  grid_size integer NOT NULL DEFAULT 1
    CHECK (grid_size IN (1, 2)),
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

-- ============================================
-- 4. Recipes (how to craft decorations)
-- ============================================
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

-- ============================================
-- 5. Recipe Ingredients
-- ============================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES materials(id),
  quantity integer NOT NULL DEFAULT 1
    CHECK (quantity > 0)
);

ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Recipe ingredients are public" ON recipe_ingredients FOR SELECT USING (true);

CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);

-- ============================================
-- 6. User Inventory (materials + stored decorations)
-- ============================================
CREATE TABLE IF NOT EXISTS user_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type text NOT NULL
    CHECK (item_type IN ('material', 'decoration')),
  material_id uuid REFERENCES materials(id),
  decoration_type_id uuid REFERENCES decoration_types(id),
  quantity integer NOT NULL DEFAULT 1
    CHECK (quantity > 0),
  acquired_via text NOT NULL DEFAULT 'craft'
    CHECK (acquired_via IN ('harvest', 'craft', 'purchase', 'reward', 'gift')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT inventory_item_check CHECK (
    (item_type = 'material' AND material_id IS NOT NULL AND decoration_type_id IS NULL)
    OR
    (item_type = 'decoration' AND decoration_type_id IS NOT NULL AND material_id IS NULL)
  ),
  UNIQUE (user_id, item_type, material_id, decoration_type_id)
);

ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own inventory"
  ON user_inventory FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own inventory"
  ON user_inventory FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inventory"
  ON user_inventory FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own inventory"
  ON user_inventory FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_user_inventory_user ON user_inventory(user_id);
CREATE INDEX idx_user_inventory_item ON user_inventory(user_id, item_type);

-- ============================================
-- 7. Placed Decorations (on the garden grid)
-- ============================================
CREATE TABLE IF NOT EXISTS placed_decorations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decoration_type_id uuid NOT NULL REFERENCES decoration_types(id),
  grid_row integer NOT NULL,
  grid_col integer NOT NULL,
  grid_size integer NOT NULL DEFAULT 1,
  rotation integer NOT NULL DEFAULT 0
    CHECK (rotation IN (0, 90, 180, 270)),
  placed_at timestamptz DEFAULT now()
);

ALTER TABLE placed_decorations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own decorations"
  ON placed_decorations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own decorations"
  ON placed_decorations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own decorations"
  ON placed_decorations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own decorations"
  ON placed_decorations FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_placed_decorations_user ON placed_decorations(user_id);

-- ============================================
-- 8. Coin Transactions (audit trail)
-- ============================================
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
CREATE POLICY "Users can view own transactions"
  ON coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions"
  ON coin_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_coin_transactions_user ON coin_transactions(user_id, created_at DESC);
CREATE INDEX idx_materials_plant_type ON materials(plant_type_id);

-- ============================================
-- 9. Seed: Materials (one per plant type)
-- ============================================
-- We reference plant_types by name since IDs are dynamic
-- Insert materials without plant_type_id first, then update

INSERT INTO materials (slug, name, description, icon, rarity) VALUES
  ('garden-essence', 'Garden Essence', 'The basic essence of all growing things', '✨', 'common'),
  ('sunflower-petal', 'Sunflower Petal', 'A bright golden petal, warm to the touch', '🌻', 'common'),
  ('cherry-petal', 'Cherry Petal', 'A delicate pink petal that falls like snow', '🌸', 'uncommon'),
  ('cactus-spine', 'Cactus Spine', 'A sturdy spine, surprisingly versatile', '🌵', 'common'),
  ('rose-crystal', 'Rose Crystal', 'A crystallized rose essence, rare and beautiful', '🌹', 'rare'),
  ('bamboo-stick', 'Bamboo Stick', 'A strong, flexible bamboo segment', '🎋', 'common'),
  ('ancient-wood', 'Ancient Wood', 'Wood infused with years of patient care', '🪵', 'uncommon'),
  ('lotus-dewdrop', 'Lotus Dewdrop', 'A shimmering drop of pure lotus dew', '💧', 'rare'),
  ('gold-leaf', 'Gold Leaf', 'A leaf of pure gold, the rarest material', '🪙', 'epic')
ON CONFLICT (slug) DO NOTHING;

-- Link materials to plant types
UPDATE materials SET plant_type_id = pt.id
FROM plant_types pt
WHERE (materials.slug = 'garden-essence' AND pt.name = 'Generic')
   OR (materials.slug = 'sunflower-petal' AND pt.name = 'Sunflower')
   OR (materials.slug = 'cherry-petal' AND pt.name = 'Cherry Blossom')
   OR (materials.slug = 'cactus-spine' AND pt.name = 'Cactus')
   OR (materials.slug = 'rose-crystal' AND pt.name = 'Rose')
   OR (materials.slug = 'bamboo-stick' AND pt.name = 'Bamboo')
   OR (materials.slug = 'ancient-wood' AND pt.name = 'Bonsai')
   OR (materials.slug = 'lotus-dewdrop' AND pt.name = 'Lotus')
   OR (materials.slug = 'gold-leaf' AND pt.name = 'Money Tree');

-- ============================================
-- 10. Seed: Decoration Types
-- ============================================

-- Furniture (Level 1+)
INSERT INTO decoration_types (slug, name, description, icon, grid_size, category, rarity, unlock_level, coin_price, subscription_tier) VALUES
  ('wooden-sign',    'Wooden Sign',    'A charming handwritten sign for your garden', '🪧', 1, 'furniture', 'common',   1, 30, 'free'),
  ('stepping-stone', 'Stepping Stone', 'A smooth stone to walk upon',                '🪨', 1, 'path',      'common',   1, 20, 'free'),
  ('flower-pot',     'Flower Pot',     'A decorative pot with blooming flowers',      '🪴', 1, 'nature',    'common',   1, 25, 'free'),
  ('garden-bench',   'Garden Bench',   'A cozy bench to rest and reflect',           '🪑', 2, 'furniture', 'uncommon', 3, 80, 'free')
ON CONFLICT (slug) DO NOTHING;

-- Nature (Level 3+)
INSERT INTO decoration_types (slug, name, description, icon, grid_size, category, rarity, unlock_level, coin_price, subscription_tier) VALUES
  ('mushroom-cluster', 'Mushroom Cluster', 'A cluster of cute mushrooms',            '🍄', 1, 'nature', 'common',   3, 30,   'free'),
  ('berry-bush',       'Berry Bush',       'A bush full of ripe berries',             '🫐', 1, 'nature', 'uncommon', 3, NULL, 'free'),
  ('rock-garden',      'Rock Garden',      'Carefully arranged stones and sand',      '🪨', 2, 'nature', 'uncommon', 5, 100,  'pro'),
  ('bamboo-screen',    'Bamboo Screen',    'A privacy screen made of bamboo',         '🎋', 2, 'nature', 'uncommon', 5, NULL, 'pro')
ON CONFLICT (slug) DO NOTHING;

-- Lighting (Level 5+)
INSERT INTO decoration_types (slug, name, description, icon, grid_size, category, rarity, unlock_level, coin_price, subscription_tier) VALUES
  ('stone-lantern',  'Stone Lantern',  'A traditional garden lantern',              '🏮', 1, 'lighting', 'uncommon', 5, 60,   'free'),
  ('paper-lantern',  'Paper Lantern',  'A gentle glowing paper lantern',            '🏮', 1, 'lighting', 'common',   5, 40,   'free'),
  ('firefly-jar',    'Firefly Jar',    'A jar catching magical fireflies',          '✨', 1, 'lighting', 'rare',     7, NULL, 'pro')
ON CONFLICT (slug) DO NOTHING;

-- Water (Level 8+)
INSERT INTO decoration_types (slug, name, description, icon, grid_size, category, rarity, unlock_level, coin_price, subscription_tier) VALUES
  ('koi-pond',        'Koi Pond',        'A serene pond with colorful koi fish',    '🐟', 2, 'water', 'rare',     8, NULL, 'pro'),
  ('bamboo-fountain', 'Bamboo Fountain', 'Water flows gently through bamboo',       '🎋', 1, 'water', 'uncommon', 8, 120,  'pro'),
  ('birdbath',        'Birdbath',        'A stone bath attracting songbirds',        '🐦', 1, 'water', 'uncommon', 8, 80,   'pro')
ON CONFLICT (slug) DO NOTHING;

-- Special (Level 10+, craft-only)
INSERT INTO decoration_types (slug, name, description, icon, grid_size, category, rarity, unlock_level, coin_price, subscription_tier, is_craftable) VALUES
  ('golden-pagoda',   'Golden Pagoda',   'A magnificent golden pagoda',              '🏯', 2, 'special', 'epic',      10, NULL, 'premium', true),
  ('crystal-garden',  'Crystal Garden',  'Crystals growing in a magical formation',  '💎', 2, 'special', 'epic',      10, NULL, 'premium', true),
  ('spirit-tree',     'Spirit Tree',     'An ancient tree radiating wisdom',          '🌳', 2, 'special', 'legendary', 12, NULL, 'premium', true),
  ('zen-sand-garden', 'Zen Sand Garden', 'A peaceful zen garden with raked sand',    '⛩️',  2, 'special', 'rare',      10, NULL, 'pro',     true),
  ('wishing-well',    'Wishing Well',    'Toss a coin and make a wish',              '🪙', 1, 'special', 'rare',       8, NULL, 'pro',     true),
  ('garden-gnome',    'Garden Gnome',    'A friendly guardian for your garden',       '🧙', 1, 'special', 'uncommon',   5, 50,  'free',    true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 11. Seed: Recipes + Ingredients
-- ============================================

-- Helper: create recipes using decoration_type slug, then add ingredients using material slugs

-- Wooden Sign (2x Bamboo Stick)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Wooden Sign', 1
  FROM decoration_types dt WHERE dt.slug = 'wooden-sign'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 2
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'wooden-sign'
  JOIN materials m ON m.slug = 'bamboo-stick'
  ON CONFLICT DO NOTHING;

-- Stepping Stone (2x Garden Essence)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Stepping Stone', 1
  FROM decoration_types dt WHERE dt.slug = 'stepping-stone'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 2
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'stepping-stone'
  JOIN materials m ON m.slug = 'garden-essence'
  ON CONFLICT DO NOTHING;

-- Flower Pot (1x Cherry Petal + 1x Garden Essence)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Flower Pot', 1
  FROM decoration_types dt WHERE dt.slug = 'flower-pot'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 1
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'flower-pot'
  JOIN materials m ON m.slug = 'cherry-petal'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 1
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'flower-pot'
  JOIN materials m ON m.slug = 'garden-essence'
  ON CONFLICT DO NOTHING;

-- Garden Bench (3x Ancient Wood + 2x Bamboo Stick)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Garden Bench', 3
  FROM decoration_types dt WHERE dt.slug = 'garden-bench'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 3
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'garden-bench'
  JOIN materials m ON m.slug = 'ancient-wood'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 2
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'garden-bench'
  JOIN materials m ON m.slug = 'bamboo-stick'
  ON CONFLICT DO NOTHING;

-- Mushroom Cluster (3x Garden Essence)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Mushroom Cluster', 3
  FROM decoration_types dt WHERE dt.slug = 'mushroom-cluster'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 3
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'mushroom-cluster'
  JOIN materials m ON m.slug = 'garden-essence'
  ON CONFLICT DO NOTHING;

-- Berry Bush (2x Cherry Petal + 1x Garden Essence)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Berry Bush', 3
  FROM decoration_types dt WHERE dt.slug = 'berry-bush'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 2
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'berry-bush'
  JOIN materials m ON m.slug = 'cherry-petal'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 1
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'berry-bush'
  JOIN materials m ON m.slug = 'garden-essence'
  ON CONFLICT DO NOTHING;

-- Rock Garden (3x Cactus Spine + 2x Garden Essence)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Rock Garden', 5
  FROM decoration_types dt WHERE dt.slug = 'rock-garden'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 3
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'rock-garden'
  JOIN materials m ON m.slug = 'cactus-spine'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 2
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'rock-garden'
  JOIN materials m ON m.slug = 'garden-essence'
  ON CONFLICT DO NOTHING;

-- Bamboo Screen (5x Bamboo Stick)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Bamboo Screen', 5
  FROM decoration_types dt WHERE dt.slug = 'bamboo-screen'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 5
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'bamboo-screen'
  JOIN materials m ON m.slug = 'bamboo-stick'
  ON CONFLICT DO NOTHING;

-- Stone Lantern (2x Ancient Wood + 1x Garden Essence)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Stone Lantern', 5
  FROM decoration_types dt WHERE dt.slug = 'stone-lantern'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 2
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'stone-lantern'
  JOIN materials m ON m.slug = 'ancient-wood'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 1
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'stone-lantern'
  JOIN materials m ON m.slug = 'garden-essence'
  ON CONFLICT DO NOTHING;

-- Paper Lantern (1x Bamboo Stick + 1x Cherry Petal)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Paper Lantern', 5
  FROM decoration_types dt WHERE dt.slug = 'paper-lantern'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 1
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'paper-lantern'
  JOIN materials m ON m.slug = 'bamboo-stick'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 1
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'paper-lantern'
  JOIN materials m ON m.slug = 'cherry-petal'
  ON CONFLICT DO NOTHING;

-- Firefly Jar (2x Lotus Dewdrop + 1x Garden Essence)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Firefly Jar', 7
  FROM decoration_types dt WHERE dt.slug = 'firefly-jar'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 2
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'firefly-jar'
  JOIN materials m ON m.slug = 'lotus-dewdrop'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 1
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'firefly-jar'
  JOIN materials m ON m.slug = 'garden-essence'
  ON CONFLICT DO NOTHING;

-- Koi Pond (3x Lotus Dewdrop + 2x Ancient Wood)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Koi Pond', 8
  FROM decoration_types dt WHERE dt.slug = 'koi-pond'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 3
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'koi-pond'
  JOIN materials m ON m.slug = 'lotus-dewdrop'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 2
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'koi-pond'
  JOIN materials m ON m.slug = 'ancient-wood'
  ON CONFLICT DO NOTHING;

-- Bamboo Fountain (3x Bamboo Stick + 1x Lotus Dewdrop)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Bamboo Fountain', 8
  FROM decoration_types dt WHERE dt.slug = 'bamboo-fountain'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 3
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'bamboo-fountain'
  JOIN materials m ON m.slug = 'bamboo-stick'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 1
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'bamboo-fountain'
  JOIN materials m ON m.slug = 'lotus-dewdrop'
  ON CONFLICT DO NOTHING;

-- Birdbath (2x Rose Crystal + 1x Garden Essence)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Birdbath', 8
  FROM decoration_types dt WHERE dt.slug = 'birdbath'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 2
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'birdbath'
  JOIN materials m ON m.slug = 'rose-crystal'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 1
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'birdbath'
  JOIN materials m ON m.slug = 'garden-essence'
  ON CONFLICT DO NOTHING;

-- Golden Pagoda (3x Gold Leaf + 2x Ancient Wood + 2x Rose Crystal)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Golden Pagoda', 10
  FROM decoration_types dt WHERE dt.slug = 'golden-pagoda'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 3
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'golden-pagoda'
  JOIN materials m ON m.slug = 'gold-leaf'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 2
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'golden-pagoda'
  JOIN materials m ON m.slug = 'ancient-wood'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 2
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'golden-pagoda'
  JOIN materials m ON m.slug = 'rose-crystal'
  ON CONFLICT DO NOTHING;

-- Crystal Garden (3x Rose Crystal + 3x Lotus Dewdrop)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Crystal Garden', 10
  FROM decoration_types dt WHERE dt.slug = 'crystal-garden'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 3
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'crystal-garden'
  JOIN materials m ON m.slug = 'rose-crystal'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 3
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'crystal-garden'
  JOIN materials m ON m.slug = 'lotus-dewdrop'
  ON CONFLICT DO NOTHING;

-- Spirit Tree (2x Gold Leaf + 3x Ancient Wood + 1x Lotus Dewdrop + 1x Rose Crystal)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Spirit Tree', 12
  FROM decoration_types dt WHERE dt.slug = 'spirit-tree'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 2
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'spirit-tree'
  JOIN materials m ON m.slug = 'gold-leaf'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 3
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'spirit-tree'
  JOIN materials m ON m.slug = 'ancient-wood'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 1
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'spirit-tree'
  JOIN materials m ON m.slug = 'lotus-dewdrop'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 1
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'spirit-tree'
  JOIN materials m ON m.slug = 'rose-crystal'
  ON CONFLICT DO NOTHING;

-- Zen Sand Garden (4x Cactus Spine + 2x Bamboo Stick + 1x Lotus Dewdrop)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Zen Sand Garden', 10
  FROM decoration_types dt WHERE dt.slug = 'zen-sand-garden'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 4
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'zen-sand-garden'
  JOIN materials m ON m.slug = 'cactus-spine'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 2
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'zen-sand-garden'
  JOIN materials m ON m.slug = 'bamboo-stick'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 1
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'zen-sand-garden'
  JOIN materials m ON m.slug = 'lotus-dewdrop'
  ON CONFLICT DO NOTHING;

-- Wishing Well (2x Rose Crystal + 2x Ancient Wood + 1x Gold Leaf)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Wishing Well', 8
  FROM decoration_types dt WHERE dt.slug = 'wishing-well'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 2
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'wishing-well'
  JOIN materials m ON m.slug = 'rose-crystal'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 2
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'wishing-well'
  JOIN materials m ON m.slug = 'ancient-wood'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 1
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'wishing-well'
  JOIN materials m ON m.slug = 'gold-leaf'
  ON CONFLICT DO NOTHING;

-- Garden Gnome (2x Garden Essence + 1x Cactus Spine + 1x Cherry Petal)
INSERT INTO recipes (id, decoration_type_id, name, unlock_level)
  SELECT gen_random_uuid(), dt.id, 'Craft Garden Gnome', 5
  FROM decoration_types dt WHERE dt.slug = 'garden-gnome'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 2
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'garden-gnome'
  JOIN materials m ON m.slug = 'garden-essence'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 1
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'garden-gnome'
  JOIN materials m ON m.slug = 'cactus-spine'
  ON CONFLICT DO NOTHING;

INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
  SELECT r.id, m.id, 1
  FROM recipes r
  JOIN decoration_types dt ON dt.id = r.decoration_type_id AND dt.slug = 'garden-gnome'
  JOIN materials m ON m.slug = 'cherry-petal'
  ON CONFLICT DO NOTHING;

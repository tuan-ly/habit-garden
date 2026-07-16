-- Create plant_types table
CREATE TABLE plant_types (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_vi TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT,
  description_vi TEXT,
  
  -- Growth settings
  maturity_days INTEGER NOT NULL,
  frequency_type TEXT NOT NULL DEFAULT 'daily',
  frequency_target INTEGER DEFAULT 7,
  
  -- Moisture settings
  moisture_decay_rate INTEGER DEFAULT 15,
  moisture_boost INTEGER DEFAULT 20,
  
  -- Special effects (JSON)
  special_effect JSONB,
  
  -- Categorization
  category TEXT,
  difficulty TEXT DEFAULT 'medium',
  is_premium BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plant types
INSERT INTO plant_types (id, name, name_vi, icon, maturity_days, frequency_type, moisture_decay_rate, special_effect, category, difficulty) VALUES
('grass', 'Grass', 'Cỏ', '🌱', 21, 'daily', 20, NULL, 'basic', 'easy'),
('flower', 'Flower', 'Hoa', '🌸', 45, 'daily', 15, NULL, 'basic', 'easy'),
('vegetable', 'Vegetable', 'Rau', '🥬', 60, 'daily', 15, NULL, 'basic', 'medium'),
('bush', 'Bush', 'Bụi cây', '🌿', 90, 'flexible', 12, NULL, 'basic', 'medium'),
('fruit_tree', 'Fruit Tree', 'Cây ăn quả', '🍎', 180, 'flexible', 10, NULL, 'basic', 'hard'),
('tree', 'Tree', 'Cây thân gỗ', '🌳', 365, 'flexible', 8, NULL, 'basic', 'hard'),

-- Special plants
('bamboo', 'Bamboo', 'Tre', '🎋', 180, 'daily', 12, 
  '{"type": "delayed_growth", "hidden_until": 80, "burst_at": 80}', 
  'special', 'hard'),
('sunflower', 'Sunflower', 'Hướng dương', '🌻', 60, 'daily', 15,
  '{"type": "buff_others", "buff_percentage": 5}',
  'special', 'medium'),
('cherry_blossom', 'Cherry Blossom', 'Anh đào', '🌸', 30, 'daily', 18,
  '{"type": "cycle", "cycle_days": 30, "bloom_days": 7}',
  'special', 'medium'),
('cactus', 'Cactus', 'Xương rồng', '🌵', 90, 'flexible', 5,
  '{"type": "drought_resistant", "decay_multiplier": 0.33}',
  'special', 'easy'),
('lotus', 'Lotus', 'Sen', '🌺', 90, 'daily', 15,
  '{"type": "difficulty_bonus", "hard_day_bonus": 10}',
  'special', 'medium'),
('banyan', 'Banyan', 'Cây đa', '🌳', 365, 'flexible', 8,
  '{"type": "spawn_children", "child_at": 100}',
  'special', 'hard'),
('mushroom', 'Mushroom', 'Nấm', '🍄', 45, 'daily', 15,
  '{"type": "hidden_progress"}',
  'special', 'medium'),
('pine', 'Pine', 'Thông', '🎄', 365, 'flexible', 8,
  '{"type": "immortal_after_mature"}',
  'special', 'hard');;

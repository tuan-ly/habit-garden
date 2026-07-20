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

UPDATE materials SET plant_type_id = pt.id
FROM plant_types pt
WHERE (materials.slug = 'sunflower-petal' AND pt.name = 'Sunflower')
   OR (materials.slug = 'cherry-petal' AND pt.name = 'Cherry Blossom')
   OR (materials.slug = 'cactus-spine' AND pt.name = 'Cactus')
   OR (materials.slug = 'bamboo-stick' AND pt.name = 'Bamboo')
   OR (materials.slug = 'lotus-dewdrop' AND pt.name = 'Lotus');

INSERT INTO decoration_types (slug, name, description, icon, grid_size, category, rarity, unlock_level, coin_price, subscription_tier) VALUES
  ('wooden-sign','Wooden Sign','A charming handwritten sign for your garden','🪧',1,'furniture','common',1,30,'free'),
  ('stepping-stone','Stepping Stone','A smooth stone to walk upon','🪨',1,'path','common',1,20,'free'),
  ('flower-pot','Flower Pot','A decorative pot with blooming flowers','🪴',1,'nature','common',1,25,'free'),
  ('garden-bench','Garden Bench','A cozy bench to rest and reflect','🪑',2,'furniture','uncommon',3,80,'free'),
  ('mushroom-cluster','Mushroom Cluster','A cluster of cute mushrooms','🍄',1,'nature','common',3,30,'free'),
  ('berry-bush','Berry Bush','A bush full of ripe berries','🫐',1,'nature','uncommon',3,NULL,'free'),
  ('rock-garden','Rock Garden','Carefully arranged stones and sand','🪨',2,'nature','uncommon',5,100,'pro'),
  ('bamboo-screen','Bamboo Screen','A privacy screen made of bamboo','🎋',2,'nature','uncommon',5,NULL,'pro'),
  ('stone-lantern','Stone Lantern','A traditional garden lantern','🏮',1,'lighting','uncommon',5,60,'free'),
  ('paper-lantern','Paper Lantern','A gentle glowing paper lantern','🏮',1,'lighting','common',5,40,'free'),
  ('firefly-jar','Firefly Jar','A jar catching magical fireflies','✨',1,'lighting','rare',7,NULL,'pro'),
  ('koi-pond','Koi Pond','A serene pond with colorful koi fish','🐟',2,'water','rare',8,NULL,'pro'),
  ('bamboo-fountain','Bamboo Fountain','Water flows gently through bamboo','🎋',1,'water','uncommon',8,120,'pro'),
  ('birdbath','Birdbath','A stone bath attracting songbirds','🐦',1,'water','uncommon',8,80,'pro')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO decoration_types (slug, name, description, icon, grid_size, category, rarity, unlock_level, coin_price, subscription_tier, is_craftable) VALUES
  ('golden-pagoda','Golden Pagoda','A magnificent golden pagoda','🏯',2,'special','epic',10,NULL,'premium',true),
  ('crystal-garden','Crystal Garden','Crystals growing in a magical formation','💎',2,'special','epic',10,NULL,'premium',true),
  ('spirit-tree','Spirit Tree','An ancient tree radiating wisdom','🌳',2,'special','legendary',12,NULL,'premium',true),
  ('zen-sand-garden','Zen Sand Garden','A peaceful zen garden with raked sand','⛩️',2,'special','rare',10,NULL,'pro',true),
  ('wishing-well','Wishing Well','Toss a coin and make a wish','🪙',1,'special','rare',8,NULL,'pro',true),
  ('garden-gnome','Garden Gnome','A friendly guardian for your garden','🧙',1,'special','uncommon',5,50,'free',true)
ON CONFLICT (slug) DO NOTHING;;

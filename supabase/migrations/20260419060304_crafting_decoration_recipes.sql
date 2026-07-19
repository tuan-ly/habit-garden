-- Insert recipes
INSERT INTO recipes (decoration_type_id, name, unlock_level)
SELECT dt.id, 'Craft '||dt.name, dt.unlock_level FROM decoration_types dt
WHERE NOT EXISTS (SELECT 1 FROM recipes r WHERE r.decoration_type_id = dt.id);

-- Ingredients by (decoration slug, material slug, qty)
WITH recipe_plan(deco, mat, qty) AS (VALUES
  ('wooden-sign','bamboo-stick',2),
  ('stepping-stone','garden-essence',2),
  ('flower-pot','cherry-petal',1),('flower-pot','garden-essence',1),
  ('garden-bench','ancient-wood',3),('garden-bench','bamboo-stick',2),
  ('mushroom-cluster','garden-essence',3),
  ('berry-bush','cherry-petal',2),('berry-bush','garden-essence',1),
  ('rock-garden','cactus-spine',3),('rock-garden','garden-essence',2),
  ('bamboo-screen','bamboo-stick',5),
  ('stone-lantern','ancient-wood',2),('stone-lantern','garden-essence',1),
  ('paper-lantern','bamboo-stick',1),('paper-lantern','cherry-petal',1),
  ('firefly-jar','lotus-dewdrop',2),('firefly-jar','garden-essence',1),
  ('koi-pond','lotus-dewdrop',3),('koi-pond','ancient-wood',2),
  ('bamboo-fountain','bamboo-stick',3),('bamboo-fountain','lotus-dewdrop',1),
  ('birdbath','rose-crystal',2),('birdbath','garden-essence',1),
  ('golden-pagoda','gold-leaf',3),('golden-pagoda','ancient-wood',2),('golden-pagoda','rose-crystal',2),
  ('crystal-garden','rose-crystal',3),('crystal-garden','lotus-dewdrop',3),
  ('spirit-tree','gold-leaf',2),('spirit-tree','ancient-wood',3),('spirit-tree','lotus-dewdrop',1),('spirit-tree','rose-crystal',1),
  ('zen-sand-garden','cactus-spine',4),('zen-sand-garden','bamboo-stick',2),('zen-sand-garden','lotus-dewdrop',1),
  ('wishing-well','rose-crystal',2),('wishing-well','ancient-wood',2),('wishing-well','gold-leaf',1),
  ('garden-gnome','garden-essence',2),('garden-gnome','cactus-spine',1),('garden-gnome','cherry-petal',1)
)
INSERT INTO recipe_ingredients (recipe_id, material_id, quantity)
SELECT r.id, m.id, rp.qty
FROM recipe_plan rp
JOIN decoration_types dt ON dt.slug = rp.deco
JOIN recipes r ON r.decoration_type_id = dt.id
JOIN materials m ON m.slug = rp.mat
WHERE NOT EXISTS (
  SELECT 1 FROM recipe_ingredients ri WHERE ri.recipe_id = r.id AND ri.material_id = m.id
);;

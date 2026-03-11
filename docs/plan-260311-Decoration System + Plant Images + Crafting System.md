# Decoration System + Plant Images + Crafting System

## Context

Habit Garden hiện tại dùng **emoji** cho plant visuals va **SVG auto-generated** cho decorations (ko interactive). User muon:
1. **Plant images dep hon** - AI-generated PNG cho moi plant type x growth stage
2. **Interactive decorations** - dat decoration len grid tiles, co 1x1 va 2x2 items
3. **Crafting system kieu Minecraft** - cay mature tao material, combine materials tao decoration
4. **Coin economy** - kiem coins qua watering/streak, mua decoration tu shop
5. **Edit Mode overlay** - che do rieng de trang tri, tach biet khoi interact/move
6. **Storage/Inventory** - chua materials + decorations chua dat len grid

---

## Phase 1: Plant Images (standalone, song song Phase 2)

### Goal: Thay emoji bang PNG dep cho moi plant type x growth stage

**Files Modified:**
- `src/components/plants/plant-image.tsx` - Dung `<Image>` thay vi emoji `<span>`, fallback emoji khi chua co anh
- `src/components/plants/plant-visual.tsx` - Update scaling cho PNG images
- `src/components/garden/isometric-plant.tsx` - Dam bao image sizing dung

**Assets Needed:**
```
public/plants/[type]/[stage].png   (256x256, transparent PNG)
8 types x 6 stages (seed/sprout/growing/blooming/mature/dead) = 48 files
Co san: 6 files (generic/* + sunflower/seed.png)
Can them: 42 files
```

**Image Specs:**
- 256x256 px, PNG with transparency
- Isometric-friendly style, soft watercolor/illustration
- Consistent palette per plant type across stages
- Optimized <50KB per file (TinyPNG/squoosh)

**Implementation:**
```typescript
// plant-image.tsx: Image with emoji fallback
<Image
  src={getPlantImagePath(plant.plant_type.name, stage, isDead)}
  width={sizePixels} height={sizePixels}
  loading="lazy"
  onError={() => /* show emoji fallback */}
/>
```

**Preloading:** On garden mount, preload images for all visible plants to avoid flash.

---

## Phase 2: Database Schema + Coins (song song Phase 1)

### Goal: Tao tat ca tables moi, seed data, them coins vao profiles

**Migration:** `supabase/migrations/20260311_crafting_decoration_system.sql`

**New Tables:**

| Table | Purpose |
|-------|---------|
| `materials` | 9 material types (1 per plant type) |
| `decoration_types` | ~25 decoration definitions (1x1 & 2x2) |
| `recipes` | Crafting recipes |
| `recipe_ingredients` | Materials needed per recipe |
| `user_inventory` | Player's materials + stored decorations |
| `placed_decorations` | Decorations placed on garden grid |
| `coin_transactions` | Coin earn/spend audit trail |

**Profile Extension:** `ALTER TABLE profiles ADD COLUMN coins integer DEFAULT 0`

**RLS:** Tat ca tables moi co RLS policies. Public read cho materials/decoration_types/recipes. User-scoped cho inventory/placed/transactions.

**Key Schema:**
```sql
-- placed_decorations (the "plants" equivalent for decorations)
placed_decorations (
  id uuid PK,
  user_id uuid FK,
  decoration_type_id uuid FK,
  grid_row int, grid_col int, grid_size int,
  rotation int CHECK (0,90,180,270)
)

-- user_inventory (materials + stored decorations)
user_inventory (
  id uuid PK,
  user_id uuid FK,
  item_type 'material' | 'decoration',
  material_id uuid | NULL,
  decoration_type_id uuid | NULL,
  quantity int,
  acquired_via 'harvest' | 'craft' | 'purchase' | 'reward'
)
```

**Seed Data:**
- 9 materials (1 per plant type): Garden Essence, Sunflower Petal, Cherry Petal, Cactus Spine, Rose Crystal, Bamboo Stick, Ancient Wood, Lotus Dewdrop, Gold Leaf
- ~25 decoration types across categories: furniture, nature, lighting, water, path, special
- ~20 recipes with ingredients

**Coin Economy:**

| Action | Coins |
|--------|-------|
| First daily watering | 5 |
| Each extra plant/day | 2 |
| 3-day streak | 10 |
| 7-day streak | 25 |
| 30-day streak | 100 |
| Plant matured | 50 |
| Achievement | 10-100 |

**Files Created:**
- `supabase/migrations/20260311_crafting_decoration_system.sql`
- `src/lib/coin-rewards.ts` - Coin reward constants & calculation
- `src/types/database.ts` - Add all new type interfaces

---

## Phase 3: Server Actions + Inventory Context (depends Phase 2)

### Goal: Backend logic cho inventory, crafting, decorations, coins

**New Server Action Files:**

| File | Key Functions |
|------|--------------|
| `src/lib/actions/inventory.ts` | `getUserInventory()`, `harvestMaterial(plantId)` |
| `src/lib/actions/crafting.ts` | `getRecipes()`, `craftDecoration(recipeId)` |
| `src/lib/actions/decorations.ts` | `getPlacedDecorations()`, `placeDecoration()`, `moveDecoration()`, `pickUpDecoration()` |
| `src/lib/actions/coins.ts` | `awardCoins()`, `spendCoins()`, `getCoinBalance()` |

**Crafting Pure Logic:** `src/lib/crafting-system.ts`
- `canCraft(recipe, inventory)` - check if enough materials
- `getMaterialCosts(recipe)` - list what's needed
- `getAvailableRecipes(level, tier)` - filter by unlock

**Harvest Flow (modify existing):**
- `src/lib/actions/plants.ts` - Khi `growth_percentage >= 100` va status chuyen `mature`, goi `harvestMaterial(plantId)` tu ra 1 material tuong ung plant type
- `src/lib/actions/activity.ts` - Them `awardCoins()` khi water/log

**New Context:** `src/lib/context/inventory-context.tsx`
```typescript
interface InventoryContextType {
  materials: InventoryItemWithDetails[]
  decorations: InventoryItemWithDetails[]
  placedDecorations: PlacedDecorationWithType[]
  coins: number
  craftDecoration(recipeId: string): Promise<Result>
  purchaseDecoration(decoTypeId: string): Promise<Result>
  placeDecoration(itemId: string, row: number, col: number): Promise<Result>
  pickUpDecoration(placedId: string): Promise<Result>
  moveDecoration(placedId: string, row: number, col: number): Promise<Result>
}
```

**Provider Order (dashboard layout):**
```
DashboardProviders
  ├── DevDebugProvider
  ├── SubscriptionProvider
  ├── MoodProvider
  ├── GardenSettingsProvider
  │     └── PlantsProvider
  └── InventoryProvider  ← NEW
```

**Tests:** `src/lib/__tests__/crafting-system.test.ts`

---

## Phase 4: Decorations on Garden Grid (depends Phase 3)

### Goal: Render decorations tren isometric tiles, cung voi plants

**Grid System Extension:** `src/lib/utils/grid-positioning.ts`
- Add `buildOccupiedCellsMapCombined(plants, decorations)` - tra ve combined occupied set
- Decorations duoc convert thanh `PlantForGrid` format de reuse `hasCollision()`, `canPlacePlantAt()`
- Plants va decorations ko overlap nhau

**New Component:** `src/components/garden/decoration-image.tsx`
```typescript
<DecorationImage
  decorationType={deco.decoration_type}
  size="lg"
  rotation={deco.rotation}
  isGhost={false}  // true = preview mode
/>
```

**Modified Components:**
- `isometric-garden.tsx` - Nhan `placedDecorations` tu InventoryContext, merge vao grid data
- `garden-tile-grid.tsx` - Render decoration anchors ben canh plant anchors
- `isometric-tile.tsx` - Hien thi DecorationImage khi tile la decoration anchor

**Grid Data Flow:**
```
plants + placedDecorations
  → buildOccupiedCellsMapCombined()
  → tileData includes { plant?, decoration?, isAnchor }
  → GardenTileGrid renders both
```

---

## Phase 5: Edit Mode Overlay (depends Phase 4)

### Goal: Full-screen edit mode de dat/di chuyen decorations

**New Directory:** `src/components/garden/edit-mode/`

| Component | Purpose |
|-----------|---------|
| `edit-mode-overlay.tsx` | Full-screen overlay container |
| `edit-mode-toolbar.tsx` | Top bar: [Undo] [Grid Toggle] [Done] |
| `edit-mode-grid.tsx` | Grid voi highlight (green=available, red=occupied) |
| `placement-ghost.tsx` | Semi-transparent preview truoc khi dat |
| `use-edit-mode.ts` | State management + undo stack (max 20) |

**New Directory:** `src/components/inventory/`

| Component | Purpose |
|-----------|---------|
| `inventory-panel.tsx` | Bottom drawer trong edit mode |
| `inventory-grid.tsx` | Grid display cac items |
| `inventory-item-card.tsx` | Single item voi count badge |

**Edit Mode Flow:**
1. Tap "Decorate" button (new trong ModeToolbar) → mode = `'decorate'`
2. Overlay hien thi: grid highlight + inventory panel (bottom drawer)
3. Tap item trong inventory → selected (highlighted)
4. Tap grid cell → ghost preview; tap lai confirm placement
5. Tap placed decoration → options: "Pick Up" / "Move"
6. "Done" → exit edit mode, save changes
7. "Undo" → revert last action

**ModeToolbar Extension:** `src/components/garden/mode-toolbar.tsx`
```
[🌱 Interact]  [✏️ Edit]  [🎨 Decorate]   ← add 'decorate' mode
```

**Performance:**
- Ghost movement: CSS transform (GPU-accelerated), ref-based DOM update, no re-render
- Grid overlay: Single SVG, ko per-tile divs
- Inventory: Virtualized list neu > 50 items

---

## Phase 6: Crafting UI + Shop (depends Phase 3, parallel voi Phase 4-5)

### Goal: UI cho crafting workshop, shop, harvest reward

**New Directory:** `src/components/crafting/`

| Component | Purpose |
|-----------|---------|
| `crafting-workshop.tsx` | Main crafting sheet/page |
| `recipe-card.tsx` | Single recipe card |
| `recipe-grid.tsx` | All available recipes |
| `recipe-detail-sheet.tsx` | Recipe detail + craft button |
| `material-list.tsx` | Materials user owns |
| `crafting-animation.tsx` | Craft success animation |

**New Directory:** `src/components/shop/`

| Component | Purpose |
|-----------|---------|
| `shop-sheet.tsx` | Coin shop overlay |
| `shop-item-card.tsx` | Purchasable decoration |
| `coin-display.tsx` | Coin balance in GameHud |

**Harvest Dialog:** `src/components/plants/harvest-dialog.tsx`
- Hien thi khi plant mature: "Your Sunflower produced 1 Sunflower Petal!"
- Animation: material icon fly vao inventory

**Navigation:** Them vao `game-nav.tsx`:
- "Workshop" link (crafting)
- "Shop" link
- Coin balance trong `game-hud.tsx`

---

## Phase 7: Polish & Gating (depends all)

### Goal: Subscription gating, level gates, achievements

**Subscription Limits:** `src/lib/subscription-limits.ts`

| Tier | Max Placed Decorations | Recipe Access | Shop Access |
|------|----------------------|--------------|------------|
| Free | 5 | Level ≤5, Common only | Basic |
| Pro | 20 | Level ≤10, up to Rare | Full |
| Premium | Unlimited | All levels, all rarities | Full + exclusive |

**Level Unlocks:** `src/lib/progression-system.ts`
- New decoration-related unlocks at various levels
- Recipes gated by `recipes.unlock_level`

**Achievements:** Them vao achievements system
- "First Craft" - Craft decoration dau tien
- "Interior Designer" - Dat 10 decorations
- "Master Crafter" - Craft 1 item moi rarity

---

## Example Recipes

### Furniture (Level 1+)
| Decoration | Size | Recipe | Coins |
|-----------|------|--------|-------|
| Wooden Sign | 1x1 | 2x Bamboo Stick | 30 |
| Stepping Stone | 1x1 | 2x Garden Essence | 20 |
| Garden Bench | 2x2 | 3x Ancient Wood + 2x Bamboo Stick | 80 |

### Nature (Level 3+)
| Decoration | Size | Recipe | Coins |
|-----------|------|--------|-------|
| Flower Pot | 1x1 | 1x Cherry Petal + 1x Garden Essence | 25 |
| Berry Bush | 1x1 | 2x Cherry Petal + 1x Garden Essence | - |
| Rock Garden | 2x2 | 3x Cactus Spine + 2x Garden Essence | 100 |
| Bamboo Screen | 2x2 | 5x Bamboo Stick | - |

### Lighting (Level 5+)
| Decoration | Size | Recipe | Coins |
|-----------|------|--------|-------|
| Stone Lantern | 1x1 | 2x Ancient Wood + 1x Garden Essence | 60 |
| Paper Lantern | 1x1 | 1x Bamboo Stick + 1x Cherry Petal | 40 |
| Firefly Jar | 1x1 | 2x Lotus Dewdrop + 1x Garden Essence | - |

### Water (Level 8+)
| Decoration | Size | Recipe | Coins |
|-----------|------|--------|-------|
| Koi Pond | 2x2 | 3x Lotus Dewdrop + 2x Ancient Wood | - |
| Bamboo Fountain | 1x1 | 3x Bamboo Stick + 1x Lotus Dewdrop | 120 |
| Birdbath | 1x1 | 2x Rose Crystal + 1x Garden Essence | 80 |

### Special (Level 10+, Craft-only)
| Decoration | Size | Recipe | Coins |
|-----------|------|--------|-------|
| Golden Pagoda | 2x2 | 3x Gold Leaf + 2x Ancient Wood + 2x Rose Crystal | - |
| Crystal Garden | 2x2 | 3x Rose Crystal + 3x Lotus Dewdrop | - |
| Spirit Tree | 2x2 | 2x Gold Leaf + 3x Ancient Wood + 1x Lotus Dewdrop + 1x Rose Crystal | - |
| Zen Sand Garden | 2x2 | 4x Cactus Spine + 2x Bamboo Stick + 1x Lotus Dewdrop | - |

---

## Material-Plant Mapping

| Plant Type | Material | Rarity |
|-----------|----------|--------|
| Generic | Garden Essence | Common |
| Sunflower | Sunflower Petal | Common |
| Cherry Blossom | Cherry Petal | Uncommon |
| Cactus | Cactus Spine | Common |
| Rose | Rose Crystal | Rare |
| Bamboo | Bamboo Stick | Common |
| Bonsai | Ancient Wood | Uncommon |
| Lotus | Lotus Dewdrop | Rare |
| Money Tree | Gold Leaf | Epic |

---

## Verification Plan

1. **Phase 1:** Load garden voi plants → thay PNG images thay vi emoji. Check all 5 stages + dead. Check fallback khi anh chua co.
2. **Phase 2:** Query Supabase → verify tables created, seed data present, coins column on profiles.
3. **Phase 3:** Water plant → verify coins awarded. Mature plant → verify material added to inventory. Craft → verify materials consumed + decoration created.
4. **Phase 4:** Place decoration → appears on grid tile. Move plant → ko overlap decoration. Move decoration → ko overlap plant.
5. **Phase 5:** Enter edit mode → grid highlighted. Select item → ghost preview. Place → item on grid. Pick up → returns to inventory. Undo → reverts last action.
6. **Phase 6:** Open workshop → see recipes. Craft → animation + new item. Shop → buy with coins.
7. **Run `npm test`** after each phase.

---

## Timeline

| Phase | Duration | Can Parallel |
|-------|----------|-------------|
| 1: Plant Images | 1-2 days | Yes (with Phase 2) |
| 2: Database + Coins | 1 day | Yes (with Phase 1) |
| 3: Inventory + Actions | 1-2 days | After Phase 2 |
| 4: Grid Decorations | 2-3 days | After Phase 3 |
| 5: Edit Mode | 2-3 days | After Phase 4 |
| 6: Crafting UI + Shop | 1-2 days | After Phase 3, parallel Phase 4-5 |
| 7: Polish | 1 day | After all |
| **Total** | **8-14 days** | |

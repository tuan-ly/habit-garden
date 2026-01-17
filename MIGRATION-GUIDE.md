# Multi-Cell Plants Migration Guide

> **Created**: 2026-01-17
> **Status**: Ready to migrate
> **Breaking Changes**: No (backward compatible)

---

## Overview

Hệ thống multi-cell plants đã được triển khai. Cây giờ có thể chiếm nhiều ô vuông trong garden (1x1, 2x2, 3x3, etc.) tùy theo thời gian trồng.

**Hiện tại**: Tất cả code đã sẵn sàng, chỉ cần chạy migration database.

---

## What's Implemented

### ✅ Code Changes (Already Done)

1. **TypeScript Types** (`src/types/database.ts`)
   - Added `grid_size`, `grid_row`, `grid_col` to Plant interface

2. **Grid Utilities** (`src/lib/utils/grid-positioning.ts`)
   - `calculateRequiredGridSize()` - Calculate grid size for multi-cell plants
   - `getOccupiedCells()` - Get all cells occupied by a plant
   - `hasCollision()` - Collision detection
   - `findNextAvailablePosition()` - Auto-positioning
   - `buildOccupiedCellsMap()` - Map of which plant occupies each cell
   - `getPlantSizeScale()` - Visual scaling based on grid size

3. **Component Updates**
   - `IsometricGarden` - Uses new grid algorithm
   - `IsometricPlant` - Scales based on `grid_size`
   - `createPlant` action - Assigns grid positions automatically

4. **Migration Scripts**
   - SQL: `supabase/migrations/20260117_add_grid_positioning.sql`
   - API: `/api/admin/migrate-grid` - Migrate existing plants
   - Utility: `src/lib/utils/migrate-plant-positions.ts`

---

## Database Migration Steps

### Step 1: Run SQL Migration

Apply the SQL migration to add new columns:

```bash
# If using Supabase CLI
supabase db push

# Or run SQL manually in Supabase Dashboard
```

SQL file location: `supabase/migrations/20260117_add_grid_positioning.sql`

This adds:
- `grid_size INTEGER NOT NULL DEFAULT 1`
- `grid_row INTEGER NOT NULL DEFAULT 0`
- `grid_col INTEGER NOT NULL DEFAULT 0`
- Index on `(user_id, grid_row, grid_col)`

### Step 2: Migrate Existing Data

**Option A: Via API Endpoint (Recommended)**

Preview migration (dry run):
```bash
curl -X POST http://localhost:3000/api/admin/migrate-grid \
  -H "Content-Type: application/json" \
  -d '{"dryRun": true}'
```

Apply migration:
```bash
curl -X POST http://localhost:3000/api/admin/migrate-grid \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'
```

**Option B: Run Script Manually**

Use the utility function in `src/lib/utils/migrate-plant-positions.ts`:

```typescript
import { migrateAllPlants } from '@/lib/utils/migrate-plant-positions'

// Run migration
await migrateAllPlants()
```

### Step 3: Verify

Check that all plants have grid positions:

```sql
SELECT
  id,
  name,
  position,
  grid_size,
  grid_row,
  grid_col
FROM plants
WHERE grid_size IS NULL
   OR grid_row IS NULL
   OR grid_col IS NULL;

-- Should return 0 rows
```

---

## How It Works

### Default Behavior

- **All new plants**: Start as 1x1 (single cell)
- **Grid auto-expands**: Garden grows to fit all plants
- **Auto-positioning**: System finds next available position
- **No collisions**: Plants cannot overlap

### Grid Position Example

```
Plant with grid_size=2 at (row=1, col=2) occupies:
┌─────┬─────┬─────┬─────┐
│ 0,0 │ 0,1 │ 0,2 │ 0,3 │
├─────┼─────┼─────┼─────┤
│ 1,0 │ 1,1 │ [P] │ [P] │  <- Plant occupies (1,2) and (1,3)
├─────┼─────┼─────┼─────┤
│ 2,0 │ 2,1 │ [P] │ [P] │  <- Also (2,2) and (2,3)
├─────┼─────┼─────┼─────┤
│ 3,0 │ 3,1 │ 3,2 │ 3,3 │
└─────┴─────┴─────┴─────┘
```

### Visual Scaling

Plants scale based on `grid_size`:
- 1x1 → 1.0x scale (normal)
- 2x2 → 1.8x scale (80% larger)
- 3x3 → 2.5x scale (150% larger)
- 4x4 → 3.2x scale (220% larger)

Combined with growth scale (0.6x → 1.0x), so a mature 2x2 plant is 1.8x bigger than a mature 1x1 plant.

---

## Future: Expansion Milestones

**Not implemented yet** - infrastructure is ready, just need to configure per plant type.

Example configuration:
```typescript
// In PlantType.special_effect
{
  expansion_milestones: [
    { trigger_type: 'days', trigger_value: 30, new_size: 2 },
    { trigger_type: 'days', trigger_value: 90, new_size: 3 },
    { trigger_type: 'waterings', trigger_value: 100, new_size: 4 },
  ]
}
```

When ready to implement:
1. Add `expansion_milestones` field to `plant_types` table
2. Create background job to check milestones
3. Update plant `grid_size` when milestone reached
4. Handle collision (expand grid or relocate plant)

---

## Testing Checklist

After migration:

- [ ] Existing plants still render correctly
- [ ] Can create new plants (auto-positioned)
- [ ] Garden grid expands when adding plants
- [ ] Hover states work on all cells
- [ ] Plant detail sheet opens on click
- [ ] No console errors
- [ ] Manually update a plant's `grid_size` to 2 and verify it renders larger

### Manual Test: Multi-Cell Plant

```sql
-- Test: Make one plant 2x2
UPDATE plants
SET grid_size = 2
WHERE id = '<some-plant-id>'
LIMIT 1;

-- Verify it renders larger in the garden
-- Check that other plants don't overlap
```

---

## Rollback Plan

If anything breaks:

1. **Revert code changes**:
   ```bash
   git revert HEAD
   ```

2. **Remove columns** (optional):
   ```sql
   ALTER TABLE plants
   DROP COLUMN grid_size,
   DROP COLUMN grid_row,
   DROP COLUMN grid_col;
   ```

3. **Old code still works** because:
   - `position` field is still there
   - New fields have defaults (1, 0, 0)
   - Backward compatible

---

## Files Changed

### New Files
- `.claude/MULTI-CELL-PLANTS-DESIGN.md` - Full design document
- `src/lib/utils/grid-positioning.ts` - Grid utilities
- `src/lib/utils/migrate-plant-positions.ts` - Migration helpers
- `supabase/migrations/20260117_add_grid_positioning.sql` - DB migration
- `src/app/api/admin/migrate-grid/route.ts` - Migration API endpoint

### Modified Files
- `src/types/database.ts` - Added grid fields to Plant interface
- `src/components/garden/isometric-garden.tsx` - Use new grid algorithm
- `src/components/garden/isometric-plant.tsx` - Scale based on grid_size
- `src/lib/actions/plants.ts` - Auto-assign grid positions on create

---

## Questions?

- **Q: Cây hiện tại có bị ảnh hưởng không?**
  A: Không. Tất cả cây hiện tại sẽ là 1x1 sau khi migrate.

- **Q: Khi nào cây sẽ lớn ra 2x2, 3x3?**
  A: Hiện tại chưa có. Cần configure expansion milestones sau (per plant type).

- **Q: Grid có tự động expand không?**
  A: Có. Garden tự động mở rộng để fit tất cả cây.

- **Q: Cây có thể overlap không?**
  A: Không. Hệ thống có collision detection.

---

## Next Steps

1. ✅ Code changes (DONE)
2. ⏳ Run database migration (PENDING)
3. ⏳ Test in dev environment (PENDING)
4. ⏳ Deploy to production (PENDING)
5. 🔜 Configure expansion milestones per plant type (FUTURE)
6. 🔜 Add admin UI to manually adjust plant sizes (FUTURE)

---

**Ready to migrate!** Chạy SQL migration rồi run API endpoint là xong.

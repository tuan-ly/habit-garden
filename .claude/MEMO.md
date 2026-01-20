# Habit Garden - Project Memo

> **Last Updated**: 2026-01-20
> **Current Phase**: Phase 4 - Polish & Launch (IN PROGRESS)

> **Last Session**: Bottom Navigation & List View Scrolling Fix


---

## Current State Summary

The project has completed Phase 1 (MVP Core), Phase 2 (Gamification), Phase 3 (Goal Tracking), Phase 3b (Adaptive Goals), and partially Phase 4 (Polish):
- Full authentication system
- Plant creation and management
- Watering system with XP rewards + weather modifiers
- Comprehensive gamification features fully integrated
- Daily moisture decay cron job
- Plant death logic
- Full goal tracking system with Build Capacity and Total Progress modes
- Adaptive Goals system with performance analysis, suggestions, and recovery week
- Plant Visual System - Images instead of emojis
- Enhanced Plant UI with gradients, glow effects, and modern styling
- Improved garden hover UX - Info bar below garden instead of floating tooltip
- PWA support - installable on mobile/desktop
- Onboarding flow for new users
- Error boundaries and friendly error pages
- Loading states with skeleton loaders
- Game-style UI - Removed sidebar, added bottom navigation
- Floating HUD for XP/level/weather display
- Game-style animations and visual polish
- Redesigned Stats and Profile pages with game aesthetics
- Optimistic Updates - UI updates instantly when watering, syncs with server in background
- XP Update Fixed - Removed RPC dependency, direct profile table update + auto-sync
- **NEW: Overview Plant Icons Fixed** - Stats garden now displays correct plant icons
- **NEW: Mood/Weather System** - Track daily mood with weather metaphors (☀️→⛈️), XP bonus on tough days, NO goal target adjustment
- **NEW: Goal Progress Charts** - Goal Master style charts and timeline
- **NEW: Goal Wizard Redesign** - Garden-themed wizard with manual target editing
- **NEW: Weeds System** - Weeds grow when not checking in, tap to clear for XP
- **NEW: Goal Modification** - Modify goals mid-way with before/after comparison
- **NEW: Adaptive Layout & Navigation** - Fixed navigation sizing and global scrolling strategy to prevent content overlap.
- **NEW: Bottom HUD Info Bar** - Plant details moved to fixed bottom position above navigation.
- **NEW: Multi-Cell Plants** - Plants can occupy multiple grid cells (1x1, 2x2, 3x3) with merged visual tiles and centered plants
- **NEW: UX Watering Redesign** - One-tap watering, long-press for info, overlay badges on plants
- **NEW: Goal Data Integration** - Goal info and today's logs merged into PlantWithType for display
- **NEW: Garden Zoom System** - Zoom in/out controls with pinch-to-zoom on mobile
- **NEW: Floating Bottom Navigation** - Nav bar now floats over content with transparency, list view scrolling fixed

---

## Recent Changes (Latest First)

### 2026-01-20: Bottom Navigation & List View Scrolling Fix
**Goal**: Cải thiện UX - menu nổi trên khu vườn thay vì tách biệt, list view scroll được đầy đủ

**Problems Solved**:
1. Bottom nav tách rời khỏi garden content với padding lớn, không tạo hiệu ứng "nổi"
2. List view bị cắt ngang nội dung và không scroll được do `overflow-hidden`

**Solution**:

1. **Bottom Nav Floating Effect** ([game-nav.tsx](src/components/game-ui/game-nav.tsx)):
   - Giảm padding: `pb-4/pb-6` → `pb-2/pb-3`
   - Tăng transparency: `from-slate-900/95 via-slate-900/90 to-slate-800/85`
   - Giảm border: `border-2` → `border`
   - Nav bây giờ "nổi" trên content với backdrop blur

2. **Fix List View Scrolling** ([garden-view.tsx](src/components/garden/garden-view.tsx)):
   - Bỏ `overflow-hidden` trên container chính
   - List view: `h-full overflow-y-auto pb-36` để scroll đúng cách

3. **Fix Dashboard Layout** ([layout.tsx](src/app/(dashboard)/layout.tsx)):
   - Bỏ `overflow-y-auto pb-32` trên `<main>`
   - Mỗi page tự quản lý scroll và padding

4. **Fix Other Pages** (profile, stats, settings):
   - Thêm `h-full overflow-y-auto pb-36` để scroll được với đủ padding cho nav

**Updated Files**:
| File | Change |
|------|--------|
| `src/components/game-ui/game-nav.tsx` | Floating nav với transparency |
| `src/components/garden/garden-view.tsx` | Bỏ overflow-hidden, fix list view scroll |
| `src/app/(dashboard)/layout.tsx` | Children tự quản lý scroll |
| `src/app/(dashboard)/profile/page.tsx` | h-full overflow-y-auto pb-36 |
| `src/app/(dashboard)/stats/page.tsx` | h-full overflow-y-auto pb-36 |
| `src/app/(dashboard)/settings/page.tsx` | h-full overflow-y-auto pb-36 |

---

### 2026-01-20: Garden Zoom System Enhancement - Full-Screen Zoom
**Goal**: Cải thiện zoom để khi zoom in, khu vườn mở rộng toàn màn hình và cho phép scroll/pan

**Problem Solved**:
- Trước đây khi zoom in, container có `overflow-hidden` nên phần vượt ra bị cắt
- User không thể xem toàn bộ khu vườn khi zoom lớn

**Solution**:
- Container mở rộng kích thước theo zoom level (`width * zoom`, `height * zoom`)
- Cho phép scroll/pan khi zoom > 100%
- Auto-center scroll khi zoom thay đổi
- Thêm padding khi zoomed để user có thể scroll thoải mái

**Technical Changes**:
- Wrapper div có `overflow-auto` thay vì `overflow-hidden`
- Inner container có dynamic size dựa trên zoom level
- Sử dụng `transform: scale()` trên content layer
- `touchAction` thay đổi động: `none` khi ≤100%, `pan-x pan-y` khi >100%
- Auto-scroll to center khi zoom thay đổi

---

### 2026-01-20: Garden Zoom System (Initial)
**Goal**: Cho phép user zoom in/out khu vườn để xem chi tiết hoặc tổng quan

**Features**:
- **Zoom Controls**: Nút +/- ở bên phải màn hình với indicator phần trăm
- **Zoom Range**: 50% đến 200% (step 25%)
- **Reset Button**: Nút reset về 100%
- **Pinch-to-Zoom**: Hỗ trợ pinch gesture trên mobile/tablet
- **Persistence**: Zoom level được lưu vào localStorage

**New Files**:
| File | Purpose |
|------|---------|
| `src/components/garden/zoom-controls.tsx` | UI controls cho zoom (+/-/reset) |
| `src/lib/hooks/use-garden-zoom.ts` | Custom hook quản lý zoom state và pinch gesture |
| `src/lib/hooks/index.ts` | Export barrel cho hooks |

**Updated Files**:
| File | Change |
|------|--------|
| `src/components/garden/isometric-garden.tsx` | Integrated zoom controls và transform |

**How It Works**:
1. User click +/- buttons → zoom level thay đổi 25%
2. Zoom được apply bằng CSS `transform: scale(zoom)`
3. Trên mobile: pinch 2 ngón để zoom in/out
4. Zoom level tự động lưu vào localStorage
5. Khi reload page → restore zoom level đã lưu

**Technical Notes**:
- Sử dụng `transform: scale()` thay vì resize để giữ layout stable
- `touch-none` class ngăn scroll conflict với pinch gesture
- `transition-transform` cho smooth zoom animation

---

### 2026-01-20: User Timezone Support for Moisture Decay
**Problem**: Cron job sử dụng fixed Vietnam timezone, nhưng user có thể ở nhiều múi giờ khác nhau.

**Solution**: Implement per-user timezone support:

1. **Database**: Column `timezone` đã có trong `profiles` table (default: `Asia/Ho_Chi_Minh`)

2. **Function `update_daily_moisture()`**: Updated để đọc timezone từng user:
```sql
-- Đọc timezone của mỗi user từ profiles
COALESCE(pr.timezone, 'Asia/Ho_Chi_Minh') as user_timezone

-- So sánh date theo timezone của user
user_local_date := (NOW() AT TIME ZONE user_tz)::date;
IF (p.last_watered_at AT TIME ZONE user_tz)::date >= user_local_date THEN
  -- Skip decay (user watered today in their timezone)
END IF;
```

3. **Frontend Auto-Sync**: Component `TimezoneSync` tự detect timezone từ browser và sync về server khi user login.

4. **Manual Selection**: Component `TimezoneSelector` trong Profile page để user chọn timezone thủ công.

**New Files**:
| File | Purpose |
|------|---------|
| `src/components/timezone-sync.tsx` | Auto-detect và sync timezone từ browser |
| `src/components/profile/timezone-selector.tsx` | UI cho user chọn timezone |
| `src/components/profile/index.ts` | Export barrel |

**Updated Files**:
| File | Change |
|------|--------|
| `src/lib/actions/profile.ts` | Added `updateTimezone()` server action |
| `src/app/(dashboard)/layout.tsx` | Integrated `TimezoneSync` component |
| `src/app/(dashboard)/profile/page.tsx` | Added `TimezoneSelector` |

**Migration Applied**: `update_moisture_decay_user_timezone`

**How It Works**:
1. User login → `TimezoneSync` detects browser timezone (e.g., `America/New_York`)
2. If different from stored timezone → auto-update profile
3. Cron job runs at 17:00 UTC → evaluates each plant against owner's timezone
4. User in NYC (UTC-5) has until midnight NYC time to water plants
5. User in Vietnam (UTC+7) has until midnight VN time to water plants

**Current Cron Status**:
| Job ID | Schedule | Last Run | Status |
|--------|----------|----------|--------|
| 2 | `0 17 * * *` | 2026-01-19 17:00 UTC | ✅ Active |

---

### 2026-01-19: Critical Bug Fix - Timezone Issue in Moisture Decay Cron
**Problem**: Cây chết hàng loạt lúc 0h mỗi ngày dù đã được tưới đầy đủ.

**Root Cause Analysis**:
1. **Phát hiện**: Database có pg_cron job `update_daily_moisture()` chạy lúc `0 0 * * *` (00:00 UTC = 07:00 VN)
2. **Logic trong function**:
   ```sql
   WHERE p.last_watered_at::date < CURRENT_DATE
   ```
3. **Vấn đề timezone**:
   - User tưới lúc 22:16 VN ngày 18/01 = 15:16 UTC ngày 18/01
   - `last_watered_at::date` = `2026-01-18` (UTC)
   - Cron chạy lúc 00:00 UTC ngày 19/01: `CURRENT_DATE` = `2026-01-19`
   - `2026-01-18 < 2026-01-19` = TRUE → **Decay được apply dù user đã tưới!**

**Solution**: Đổi cron schedule sang 17:00 UTC = 00:00 VN
- Đảm bảo khi cron chạy, ngày UTC và ngày VN khớp nhau
- User có cả ngày (theo giờ VN) để tưới cây trước khi decay

**Changes Made**:

| Location | Change |
|----------|--------|
| `cron.job` (Supabase) | Changed schedule from `0 0 * * *` to `0 17 * * *` |
| `vercel.json` | **Disabled** - removed cron config (using pg_cron only) |
| `src/app/api/cron/moisture-decay/route.ts` | Improved idempotency check logic (kept as backup API) |

**Decision**: Chỉ dùng **Supabase pg_cron** vì:
- Reliable hơn (chạy trong DB, không phụ thuộc network)
- Nhanh hơn (không HTTP roundtrip)
- Đã có logic hoàn chỉnh (notifications, death handling)
- API route vẫn giữ để test/debug thủ công

**Database Commands Executed**:
```sql
SELECT cron.unschedule(1);
SELECT cron.schedule('daily-moisture-decay', '0 17 * * *', 'SELECT update_daily_moisture()');
```

**Important Notes**:
- Có 2 hệ thống cron song song: Vercel cron API và Supabase pg_cron
- pg_cron là hệ thống chính đang giết cây (gọi `update_daily_moisture()`)
- Vercel cron (`/api/cron/moisture-decay`) có logic riêng nhưng cũng cần fix timezone

**Timeline để hiểu bug**:
| Time (UTC) | Time (VN) | Event |
|------------|-----------|-------|
| 15:16 18/01 | 22:16 18/01 | User waters plant |
| 00:00 19/01 | 07:00 19/01 | Old cron runs, sees `last_watered_at::date (18) < CURRENT_DATE (19)` → DECAY |
| 17:00 19/01 | 00:00 20/01 | New cron time, now UTC date matches VN date |

---

### 2026-01-19: Fix Plant Alignment in Garden View
**Goal**: Plant visual phải nằm ngay chính giữa tile, sát đáy container (không có khoảng trống với cạnh dưới)

**Status**: ✅ Complete

**Problem**: Cây trong garden view có khoảng trống giữa đáy cây và đáy container do:
1. `PlantVisual` và `PlantImage` có fixed height (`h-16`, `h-28`...) khiến emoji bị căn giữa theo chiều dọc
2. Emoji có line-height tạo thêm padding

**Solution**:
- Thêm prop `alignBottom` để bỏ fixed height khi cần cây nằm sát đáy
- Thêm `leading-none` cho emoji để loại bỏ line-height padding
- Khi `alignBottom=true`, container chỉ có width, không có height cố định

**Updated Files:**
| File | Change |
|------|--------|
| `src/components/plants/plant-visual.tsx` | UPDATED - `getSizeClasses()` bỏ height khi `alignBottom=true`, truyền `alignBottom` xuống PlantImage |
| `src/components/plants/plant-image.tsx` | UPDATED - Thêm `classNameAlignBottom` config, thêm `leading-none` cho emoji |
| `src/components/garden/isometric-tile.tsx` | UPDATED - Xóa debug border đỏ |

---

### 2026-01-19: Multi-Cell Plants Visual Enhancement (Merged Hover + Centered Plant + Shadow)
**Goal**: Hover vào multi-cell plant hiện highlight merged, cây đặt ở giữa các merged tiles và có bóng râm scale theo size

**Status**: ✅ Complete

**Changes Made:**
1. **Merged Hover Highlight**: Khi hover vào bất kỳ tile nào của multi-cell plant, toàn bộ merged area được highlight cùng lúc (polygon lớn thay vì tile riêng lẻ)
2. **Plant Centering**: Cây multi-cell được di chuyển từ anchor về đáy của merged area (offset Y = `(gridSize - 1) * tileHitHeight`)
3. **Scaled Shadow**: Shadow của cây scale theo `grid_size` và nằm ở giữa merged area (offset Y = `(gridSize - 1) * tileHitHeight / 2`)
4. **Smart Hover Detection**: Hover vào tile bất kỳ của multi-cell → set hover về anchor cell → trigger merged highlight
5. **No Individual Hover**: Các tile thuộc multi-cell không hiện hover highlight riêng (handled by GroundPlane)

**Updated Files:**
| File | Change |
|------|--------|
| `src/components/garden/ground-plane.tsx` | UPDATED - Added `hoveredMultiCellArea` prop, render merged polygon highlight |
| `src/components/garden/isometric-tile.tsx` | UPDATED - Added `isPartOfMultiCell`, `plantGridSize` props, plant offset to bottom of merged area, shadow centered |
| `src/components/garden/isometric-garden.tsx` | UPDATED - Smart hover detection for multi-cell, pass `hoveredMultiCellArea` to GroundPlane |
| `src/components/garden/isometric-plant.tsx` | UPDATED - Removed multi-cell offset (now handled by IsometricTile) |

**How Plant Centering Works:**
```typescript
// In IsometricTile - plant container position
// Plant is offset to bottom of merged area
top: tileHitHeight / 2 + (plantGridSize - 1) * tileHitHeight

// Shadow is offset to center of merged area
top: tileHitHeight / 2 + (plantGridSize - 1) * tileHitHeight / 2
```

**How Merged Hover Works:**
```typescript
// When hovering a multi-cell tile, redirect hover to anchor
const handleTileHover = (row, col) => {
  const plant = occupiedCells.get(`${row}-${col}`)
  if (plant && plant.grid_size > 1) {
    setHoveredTile(`${plant.grid_row}-${plant.grid_col}`) // anchor
  } else {
    setHoveredTile(`${row}-${col}`)
  }
}
// GroundPlane renders merged polygon for hoveredMultiCellArea
```

**How Scaled Shadow Works:**
```typescript
// Shadow scales based on plant grid size (1x1→0.4, 2x2→0.7, 3x3→1.0)
width: tileSize * (0.4 + (plantGridSize - 1) * 0.3)
height: tileSize * (0.15 + (plantGridSize - 1) * 0.1)
```

---

### 2026-01-19: Multi-Cell Plants Visual Implementation (Previous)
**Goal**: Cây multi-cell hiển thị ở center của vùng chiếm và các ô bị chiếm hợp thành 1 ô lớn (không có grid lines bên trong)

**Status**: ✅ Complete

**Changes Made:**
1. **Grid Lines Merging**: Grid lines bên trong vùng multi-cell bị ẩn, tạo hiệu ứng "merged tiles"
2. **Plant Centering**: Cây multi-cell được di chuyển về center của vùng nó chiếm trong isometric view
3. **Occupied Cell Handling**: Các ô thuộc multi-cell (không phải anchor) không hiện hover/plus icon
4. **Click Handling**: Click vào bất kỳ ô nào của multi-cell sẽ tương tác với cây chủ

**Updated Files:**
| File | Change |
|------|--------|
| `src/components/garden/ground-plane.tsx` | UPDATED - Added `multiCellAreas` prop, grid lines split into segments with gap logic |
| `src/components/garden/isometric-plant.tsx` | UPDATED - Added `tileSize` prop, calculate Y offset to center in multi-cell area |
| `src/components/garden/isometric-tile.tsx` | UPDATED - Added `isOccupiedByMultiCell` prop, hide hover/plus for occupied cells |
| `src/components/garden/isometric-garden.tsx` | UPDATED - Pass multiCellAreas to GroundPlane, tileSize to IsometricPlant |

**How Multi-Cell Centering Works:**
```typescript
// For NxN cells, offset by (N-1)/2 in isometric Y direction
const cellOffset = (gridSize - 1) / 2
const offsetY = cellOffset * (tileSize / 2)
// Transform: translate(0, calc(12% + ${offsetY}px))
```

**Test Data:**
- Plant "2" at position (2,2) set to `grid_size = 2` (2x2)
- Chiếm 4 ô: (2,2), (2,3), (3,2), (3,3)
- Grid lines giữa các ô này bị ẩn
- Cây hiển thị ở center của vùng 2x2

---

### 2026-01-18: Goal Data Integration (Phase 2 Complete)
**Goal**: Merge goal info and today's logs vào PlantWithType để hiển thị số lần log trên badge

**Status**: ✅ Complete

**Problem Solved:**
- Badge không hiển thị số lần log vì data không được truyền xuống
- Watering và goal log là 2 hệ thống riêng, cần hợp nhất

**Solution**: Option B - Merge goal info vào plant
- `PlantWithType` giờ có thêm `goal`, `today_logs`, `today_log_count`, `today_value`
- `getPlants()` fetch goal và today's logs cùng lúc
- `PlantsContext` có thêm `logGoal()` function với optimistic updates
- Goal plants cho phép log nhiều lần/ngày (multi-log support)

**Updated Types:**
```typescript
interface PlantWithType extends Plant {
  plant_type: PlantType
  goal?: PlantGoalInfo | null       // Goal info for goal plants
  today_logs?: TodayGoalLog[]       // Today's goal logs
  today_log_count?: number          // Computed: number of logs today
  today_value?: number              // Computed: sum of values today
}
```

**Updated Files:**
| File | Change |
|------|--------|
| `src/types/database.ts` | NEW - Added `PlantGoalInfo`, `TodayGoalLog` interfaces, extended `PlantWithType` |
| `src/lib/actions/plants.ts` | UPDATED - `getPlants()` now fetches goal and today's logs |
| `src/lib/actions/goals.ts` | UPDATED - `logGoalValue()` allows multi-log per day, only first log waters plant |
| `src/lib/context/plants-context.tsx` | UPDATED - Added `logGoal()` function with optimistic updates |
| `src/components/garden/isometric-garden.tsx` | UPDATED - Uses `logGoal` from context, passes data to components |

**How It Works:**
1. `getPlants()` fetches plants + goals + today's goal_logs in parallel queries
2. Data merged into `PlantWithType` with computed fields
3. Components receive full data through context
4. `logGoal()` creates optimistic update immediately, syncs with server
5. Badge shows `today_log_count`, modal shows `today_logs`

**XP Logic for Multi-Log:**
- First log of the day: Full watering XP + bonuses (streak, morning, weather)
- Subsequent logs: Base 10 XP + bonuses (PR: +25, Exceed target: +10)

**Phase 3 TODO** (Overview Stats Redesign):
- [ ] Distinguish "Plants Tended" vs "Total Actions"
- [ ] Add Best Streak metric

---

### 2026-01-18: UX Watering Redesign (Phase 1)
**Goal**: Simplify watering UX - tap to water, long-press/right-click for info

**Status**: ✅ Phase 1 Complete (Core Interaction)

**Key Changes:**
- **Tap-to-Water**: Single tap on plant waters it instantly (simple habits) or opens Quick Log Modal (goal plants)
- **Long-Press/Right-Click Info**: Hold 500ms or right-click to show Floating Plant Card with stats and actions
- **Plant Overlay Badge**: Shows ✓ for watered simple plants, 💧×N for goal plants with today's log count
- **Enhanced Toast Feedback**: Game-style toast with XP earned, streak info, and undo option

**New Files:**
| File | Purpose |
|------|---------|
| `src/components/garden/plant-overlay-badge.tsx` | Badge showing today's activity on plants |
| `src/components/garden/floating-plant-card.tsx` | Long-press info card with stats and actions |
| `src/components/plants/quick-log-modal.tsx` | Fast value input for goal plants |
| `src/components/plants/water-toast.tsx` | Custom toast functions with game-style feedback |

**Updated Files:**
| File | Change |
|------|--------|
| `src/components/garden/isometric-garden.tsx` | NEW - Tap-to-water, long-press, right-click handling |
| `src/components/garden/isometric-plant.tsx` | NEW - Overlay badge integration |
| `src/components/garden/isometric-tile.tsx` | NEW - Touch/context menu event handlers |
| `src/lib/utils/grid-positioning.ts` | FIX - Added `PlantForGrid` interface for type safety |
| `src/lib/actions/plants.ts` | FIX - Removed incorrect type assertion |

**Interaction Model:**
| Platform | Gesture | Action |
|----------|---------|--------|
| Desktop | Left click | Water (simple) or Open Quick Log (goal) |
| Desktop | Right click | Show Floating Info Card |
| Mobile | Single tap | Water (simple) or Open Quick Log (goal) |
| Mobile | Long press (500ms) | Show Floating Info Card |

---

### 2026-01-17: Multi-Cell Plants Infrastructure
**Goal**: Cây có thể chiếm nhiều ô vuông khi trồng càng lâu (1x1, 2x2, 3x3, etc.)

**Status**: ✅ Code ready, ⏳ Database migration pending

**Infrastructure Implemented:**
- **Grid Positioning System**: Complete collision detection, auto-positioning, grid expansion
- **Visual Scaling**: Plants scale based on `grid_size` (1x1→1.0x, 2x2→1.8x, 3x3→2.5x)
- **Database Schema**: Added `grid_size`, `grid_row`, `grid_col` fields
- **Migration Tools**: SQL migration + API endpoint + utility scripts

**New Files:**
| File | Purpose |
|------|---------|
| `.claude/MULTI-CELL-PLANTS-DESIGN.md` | Complete design document |
| `src/lib/utils/grid-positioning.ts` | Grid utilities (collision, positioning, scaling) |
| `src/lib/utils/migrate-plant-positions.ts` | Migration helper functions |
| `supabase/migrations/20260117_add_grid_positioning.sql` | Database schema changes |
| `src/app/api/admin/migrate-grid/route.ts` | Migration API endpoint |
| `MIGRATION-GUIDE.md` | Step-by-step migration instructions |

**Updated Files:**
| File | Change |
|------|--------|
| `src/types/database.ts` | Added grid fields to Plant interface |
| `src/components/garden/isometric-garden.tsx` | Use new grid algorithm with multi-cell support |
| `src/components/garden/isometric-plant.tsx` | Scale based on grid_size + growth_percentage |
| `src/lib/actions/plants.ts` | Auto-assign grid positions when creating plants |

**How It Works:**
- All new plants start as **1x1** (single cell)
- Grid **auto-expands** to fit all plants
- **Collision detection** prevents overlaps
- **Visual scaling** makes larger plants look bigger
- **Backward compatible** - old `position` field still exists

**Next Steps (User will do later):**
1. Run database migration (SQL + API endpoint)
2. Test in dev environment
3. Configure expansion milestones per plant type (future feature)

**Design Decisions:**
- Grid size based on plant age, not real-time metrics (rewards long-term consistency)
- Expansion milestones will be configured per plant type (e.g., Sunflower: 30d→2x2, 90d→3x3)
- Infrastructure first, milestone logic later (user wants to configure per plant type)

---

## Recent Changes (Latest First)

### 2026-01-18: Critical Bug Fix - Moisture Decay Cron Idempotency
**Problem**: Cron job `/api/cron/moisture-decay` không có idempotency check, dẫn đến việc nếu cron chạy nhiều lần trong một ngày (do retries hoặc lỗi cấu hình), moisture sẽ bị giảm nhiều lần và cây sẽ chết không đúng.

**Root Cause**:
- Cron job không kiểm tra xem nó đã xử lý plant hôm nay chưa
- Mỗi lần chạy sẽ decay moisture, dù đã decay rồi trong cùng ngày
- Ví dụ: Nếu cron chạy 2 lần, moisture giảm từ 100% → 88% → 76% trong cùng 1 ngày

**Solution**: Thêm idempotency check vào cron job
- Kiểm tra `updated_at` của plant trước khi decay
- Nếu `updated_at === today` (UTC) → Skip (đã được update rồi)
- Điều này bảo vệ cả 2 trường hợp:
  1. Cron đã chạy hôm nay rồi → Skip để tránh double decay
  2. User đã water hôm nay rồi → Skip vì user đã hoàn thành habit

**Benefits**:
- ✅ Cron có thể retry an toàn mà không làm cây chết
- ✅ Early bird users (water trước khi cron chạy) không bị "phạt"
- ✅ Better observability với `skipped` counter và detailed logs

**Files Changed**:
| File | Change |
|------|--------|
| `src/app/api/cron/moisture-decay/route.ts` | FIXED - Added idempotency check, skip counter, improved logging |
| `scripts/test-moisture-decay.md` | NEW - Test scenarios and verification guide |

**Testing**: See `scripts/test-moisture-decay.md` for detailed test scenarios.

---

### 2026-01-17: Stats Garden Sky Theme Fix
**Goal**: Ensure the stats preview garden always looks bright and clear by forcing the daytime theme.

**Changes:**
- **GardenSky Component**: 
  - Added support for `timeOfDay` prop (`day` | `night`).
  - Improved hydration robustness using `useEffect` for client-side time calculation.
  - Added auto-update interval (1 min) for dynamic time-of-day transitions.
- **StatsGarden Component**: Added `timeOfDay` prop pass-through.
- **Overview Page**: Forced `timeOfDay="day"` for the `StatsGarden` visualization to ensure statistics are always displayed against a bright, readable background.

| File | Change |
|------|--------|
| `src/components/garden/garden-sky.tsx` | UPDATED - Added `timeOfDay` prop, useEffect for hydration, auto-sync |
| `src/components/garden/stats-garden.tsx` | UPDATED - Added `timeOfDay` prop pass-through |
| `src/app/(dashboard)/overview/page.tsx` | UPDATED - Forced `timeOfDay="day"` for `StatsGarden` |

---

### 2026-01-17: Overview Page Immersive Redesign
**Goal**: Transform the Overview page into a premium, immersive visualization with full-screen effects.

**Visual Updates:**
- **Full-Screen Sky & Weather**: 
  - Extended the sky background to cover the entire viewport (`skyContained={false}`).
  - Integrated full-screen weather animations (rain, lightning) into the `StatsGarden` visualization.
- **Glassmorphism UI Overlays**:
  - Replaced solid headers with a floating **Main Controls Capsule** (Period Selector + Date Nav) featuring `backdrop-blur-xl` and subtle glow effects.
  - Redesigned statistical summaries into **Floating Cards** with color-coded glassmorphism accents and smooth zoom-in entry animations.
- **Layout Depth**: 
  - Adjusted z-index layering to ensure controls remain accessible above weather effects (`z-50`).
  - Centered the garden island vertically within the full-height viewport for better balance.

**Key Changes:**
| File | Change |
|------|--------|
| `src/app/(dashboard)/overview/page.tsx` | UPDATED - Full-screen layout, transparent controls capsule, floating stat cards |
| `src/components/garden/stats-garden.tsx` | UPDATED - Added `skyContained` and `className` props, integrated `WeatherEffects` |
| `src/components/garden/garden-sky.tsx` | UPDATED - Support for `fixed` positioning when not contained |

---

### 2026-01-17: UI/UX Refinement & Layout Optimization
**Goal**: Solve content overlap issues, improve navigation usability, and reorganize the Overview page.

**Visual Updates:**
- **Navigation Redesign**: 
  - Increased icon and label sizes for `GameNav` to improve mobile usability.
  - Enhanced active state with scaling (`scale-110`) and glow effects.
- **Global Layout Fix**: 
  - Switched main layout to use `h-dvh` (Dynamic Viewport Height) for better mobile browser support.
  - Implemented `overflow-y-auto` on the main content area with `pb-32` padding to ensure no content is hidden behind the fixed bottom menu.
- **Plant Info Bar Repositioning**: 
  - Moved the floating tooltip from the top to a **fixed bottom position** (`bottom-20` / `bottom-28`).
  - This creates a cleaner "HUD" effect and prevents the info bar from obscuring garden plants.
- **Overview Page Reorganization**:
  - Moved **Stats Summary** (Water/Plants/XP) to the top of the page for immediate visibility.
  - Updated **Stats Garden** to reflect the dominant weather of the selected period.
  - Fixed z-index layering (`z-40`) for sticky headers to ensure they float above scrolling content.

| File | Change |
|------|--------|
| `src/app/(dashboard)/layout.tsx` | UPDATED - Global scrolling strategy and padding |
| `src/components/game-ui/game-nav.tsx` | UPDATED - Sizing and active state animations |
| `src/components/garden/plant-tooltip.tsx` | UPDATED - Fixed bottom positioning for Info Bar |
| `src/app/(dashboard)/overview/page.tsx` | UPDATED - Reordered stats summary, fixed sticky header |
| `src/components/garden/stats-garden.tsx` | UPDATED - Dynamic sizing and weather integration |

---

### 2026-01-17: Visual Polish - Tile & Plant Alignment
**Goal**: Fix visual inconsistencies in the garden view.

**Visual Updates:**
- **Tile Border Fix**: Removed the white border highlight on the top-left and top-right edges of the `isometric-tile` (in `ground-plane.tsx`) which looked "unbeautiful".
- **Plant Positioning**:
  - Main Garden: Lowered plant position (`translate(0, 12%)`) in `isometric-plant.tsx` to align the plant base with the tile shadow/center.
  - Stats Garden: Applied similar fix (`-translate-y-[35%]`, `origin-bottom`) to `stats-garden.tsx` to match the main garden aesthetic.

**Key Changes:**
| File | Change |
|------|--------|
| `src/components/garden/ground-plane.tsx` | FIXED - Removed white top border stroke |
| `src/components/garden/isometric-plant.tsx` | FIXED - Adjusted vertical alignment (translate Y 12%) |
| `src/components/garden/stats-garden.tsx` | FIXED - Aligned MiniPlant with tile center |

---

### 2026-01-17: Visual Polish & Weather Effects
**Goal**: Fix UI overlaps and enhance immersive weather effects.

**Visual Updates:**
- **Sky Elements Positioning**: Moved Sun/Moon from `top-4 right-8` to `top-24 right-8` to avoid overlapping with the Mood Selector button.
- **Enhanced Overlay**: Created `WeatherEffects` component (z-index 20) to ensure rain renders *over* garden tiles (previously occluded).
- **Atmosphere Tuning**:
  - `rainy`: Darker grey overlay (`rgba(55, 65, 81, 0.35)`) for gloomier feel.
  - `stormy`: Very dark overlay (`rgba(15, 23, 42, 0.6)`), 3x raindrop count, faster rain.

**New Features:**
- **Lightning Effect**: Random full-screen flash animation (white mix-blend-hard-light) for Stormy weather. Intervals: 8-25s.
- **Windy Plants**: Plants now shake independently during storms.
  - Randomized delay (0 to -2s) and duration (0.4-0.8s) per plant.
  - Intermittent logic: Each plant has an internal timer to shake for 1-2s every 5-15s (organic wind gust effect).

| File | Change |
|------|--------|
| `src/components/garden/garden-sky.tsx` | UPDATED - Adjusted positioning, updated weather colors |
| `src/components/garden/weather-effects.tsx` | NEW - Dedicated overlay for rain and lightning |
| `src/components/garden/garden-view.tsx` | UPDATED - Integrated WeatherEffects |
| `src/components/plants/plant-visual.tsx` | UPDATED - Added `isStormShaking` logic for independent wind effects |
| `src/app/globals.css` | UPDATED - Added `lightning-flash` keyframes |

---

### 2026-01-17: Energy → Mood/Weather System Redesign
**Problem**: Energy system adjusted goal targets based on energy level, but goals are weekly - daily energy shouldn't affect them. Also, users want to track mood honestly without gaming the system.

**Solution**: Redesigned as **Mood/Weather System** - track mood using weather metaphors, earn bonus XP for showing up on tough days.

| Level | Weather | XP Multiplier | Description |
|-------|---------|---------------|-------------|
| 5 | ☀️ Sunny | 1.0x | Feeling great |
| 4 | 🌤️ Partly Cloudy | 1.05x | Normal day |
| 3 | ☁️ Cloudy | 1.15x | Low motivation |
| 2 | 🌧️ Rainy | 1.3x | Struggling |
| 1 | ⛈️ Stormy | 1.5x | Tough day |

**Key Differences from Energy System:**
- **NO goal target adjustment** - goals stay consistent
- **XP bonus for tough days** - rewards showing up when it's hard
- **5 levels instead of 4** - more nuanced mood tracking
- **Weather metaphors** - more intuitive than energy bars

**Key Changes:**
| File | Change |
|------|--------|
| `src/lib/mood-system.ts` | NEW - Mood types, XP multipliers, weather configs |
| `src/lib/actions/mood.ts` | NEW - Server actions (get/set mood, stats, patterns) |
| `src/lib/context/mood-context.tsx` | NEW - MoodProvider with XP calculation helpers |
| `src/components/mood/mood-selector.tsx` | NEW - Bottom sheet with weather-themed UI |
| `src/components/mood/index.ts` | NEW - Export barrel |
| `src/components/game-ui/game-hud.tsx` | UPDATED - Uses MoodSelector instead of EnergySelector |
| `src/app/(dashboard)/providers.tsx` | UPDATED - Uses MoodProvider instead of EnergyProvider |
| `src/app/(dashboard)/layout.tsx` | UPDATED - Fetches initialMood |
| `src/lib/actions/plants.ts` | UPDATED - waterPlant() now applies mood XP bonus |
| Supabase | NEW table `mood_logs` (mood_level 1-5) |

**Files to be cleaned up (Energy system):**
- `src/lib/energy-system.ts` - Can be deleted
- `src/lib/actions/energy.ts` - Can be deleted
- `src/lib/context/energy-context.tsx` - Can be deleted
- `src/components/energy/*` - Can be deleted

**Benefits:**
- Encourages honest mood tracking (no gaming - tough days = more XP)
- Goals stay consistent (weekly targets not affected by daily mood)
- Rewards resilience (showing up on stormy days matters)
- Future: Can track recovery patterns (which activities help mood)

---

### 2026-01-16: Goal UI/UX Redesign (Major Update)
**Inspired by**: Goal Master app + Garden metaphors
**Theme**: "Gần gũi nhưng mạnh mẽ" (Approachable yet Powerful)

**Phase 1: Goal Progress Chart** ✅
| File | Change |
|------|--------|
| `src/components/goals/goal-progress-chart.tsx` | NEW - Visual bar chart with plant growth icons on Y-axis |
| `src/components/goals/goal-timeline.tsx` | NEW - Week-by-week timeline in Goal Master format |
| `src/components/goals/goal-week-card.tsx` | NEW - Single week card with daily breakdown |
| `src/components/goals/goal-stats.tsx` | UPDATED - Tabs layout, integrated new chart components |

**Phase 2: Energy System** ✅ (Originally Mood, redesigned 2026-01-17)
See "2026-01-17: Mood → Energy System Redesign" above for details.

**Phase 3: Goal Wizard Redesign** ✅
| File | Change |
|------|--------|
| `src/components/goals/goal-setup-wizard.tsx` | REWRITTEN - Garden theme, visual curve selector, Goal Master preview format |
| `src/types/database.ts` | UPDATED - Added weekly_targets to CreateGoalDto |
| `src/lib/actions/goals.ts` | UPDATED - Support custom weekly_targets |

**Wizard Features:**
- Garden-themed steps (Seed → Target → Growth → Preview)
- Seed Types: Capacity Seed (📈) vs Accumulator Seed (🎯)
- Growth Curves: Steady, S-Curve, Step, Quick Start, Slow Burn
- Duration slider with plant growth markers (🌱🌿🌸🌳)
- Manual target editing in preview
- Goal Master format weekly targets list

**Phase 4: Weeds System** ✅
| File | Change |
|------|--------|
| `src/lib/actions/weeds.ts` | NEW - Weed actions (get/clear/clearAll/grow) |
| `src/lib/context/weeds-context.tsx` | NEW - WeedsProvider with optimistic updates |
| `src/components/weeds/weed-item.tsx` | NEW - Single weed with animations |
| `src/components/weeds/plant-weeds.tsx` | NEW - Weeds container + Clear All button |
| `src/types/database.ts` | UPDATED - Added weed fields to Plant interface |
| `src/app/globals.css` | UPDATED - Added weed-sway, weed-clear, mood-glow animations |

**Weeds Rules:**
- 1 weed/day when not checking in (max 7)
- Tap to clear each weed (+5 XP)
- "Clear All" button when 3+ weeds
- Weeds positioned around plant in circle

**Phase 5: Goal Modification** ✅
| File | Change |
|------|--------|
| `src/components/goals/goal-modify-modal.tsx` | NEW - Modal for adjusting goals |
| `src/components/goals/goal-comparison.tsx` | NEW - Before/after comparison view |
| `src/lib/actions/goals.ts` | UPDATED - Added modifyGoal() action |
| `src/components/goals/index.ts` | UPDATED - Exported new components |

**Modification Options:**
- Increase Target: "I can do more!"
- Decrease Target: "I need to be more realistic"
- Extend Timeline: "I need more time"
- Recalculate from Now: "Start fresh from current level"

---

### 2026-01-15: Fix Overview Plant Icons Not Showing
**Problem solved:** In Overview page, all plants displayed default 🌱 emoji instead of their actual icons (pumpkin, flower, tree, etc.), while Garden view showed them correctly.

**Root cause:** In `getGardenStats()`, when transforming Supabase nested data, `plant_type` was incorrectly accessed as an array with `?.[0]`. Supabase returns nested foreign key relations as objects, not arrays.

**Solution:**
| File | Change |
|------|--------|
| `src/lib/actions/plants.ts` | FIXED - Changed `w.plant[0].plant_type?.[0]` to `w.plant[0].plant_type` in `getGardenStats()` |

**Before:** `plant_type: w.plant[0].plant_type?.[0] || { id: '', name: 'Unknown', icon: '🌱' }`
**After:** `plant_type: w.plant[0].plant_type || { id: '', name: 'Unknown', icon: '🌱' }`

---

### 2026-01-15: Remove RPC Dependency + XP Auto-Sync
**Problem solved:** XP wasn't updating after watering because `supabase.rpc('increment_user_xp')` function didn't exist in the database.

**Solution:** Replaced RPC calls with direct profile table updates and added XP auto-sync.

| File | Change |
|------|--------|
| `src/lib/actions/plants.ts` | FIXED - Replaced `supabase.rpc('increment_user_xp')` with direct `profiles` table update (fetch current XP → add → update) |
| `src/lib/actions/goals.ts` | FIXED - Same pattern: replaced RPC with direct profile table update for goal logging XP |
| `src/lib/actions/profile.ts` | NEW - Added `syncUserXp()` function to recalculate XP from watering_logs |
| `src/lib/actions/profile.ts` | IMPROVED - `getProfile()` now auto-syncs XP if profile.xp is 0 but user has waterings |

**How XP updates work now:**
1. **Watering/Goal Log**: Fetch profile → Calculate new XP → Update profile table
2. **Auto-sync**: If `getProfile()` detects XP=0 but waterings exist, it recalculates and updates
3. **Manual sync**: `syncUserXp()` can be called to force recalculation from watering_logs

---

### 2026-01-15: Fix Optimistic Updates Not Persisting
**Problem solved:** UI wasn't updating after watering or adding new plants - required page refresh.

**Root causes:**
1. `useOptimistic` only works during transition - after server response, state reverted to old `serverPlants`
2. `createPlant` action didn't return the created plant data
3. `AddPlantDialog` didn't update context after creating plant

**Solution:**
| File | Change |
|------|--------|
| `src/lib/context/plants-context.tsx` | FIXED - Update `serverPlants` after successful watering to persist changes |
| `src/lib/context/plants-context.tsx` | ADDED - `addPlant()` and `removePlant()` functions for immediate state updates |
| `src/lib/actions/plants.ts` | FIXED - `createPlant` now returns `PlantWithType` with plant_type data |
| `src/components/plants/add-plant-dialog.tsx` | FIXED - Uses `usePlants().addPlant()` for instant UI update |

**How it works now:**
1. **Watering**: Optimistic update → Server call → Update `serverPlants` on success → State persists
2. **Add Plant**: Server creates plant → Returns plant data → `addPlant()` adds to state → UI updates instantly

---

### 2026-01-15: Optimistic Updates for Watering Performance (Initial - Had Bug)
**Problem solved:** App was very slow when watering plants - had to wait for server round-trip before UI updated.

**Solution:** Implemented optimistic updates using React's `useOptimistic` hook.

| File | Change |
|------|--------|
| `src/lib/context/plants-context.tsx` | NEW - Global plants state management with optimistic updates |
| `src/lib/context/index.ts` | NEW - Export barrel file |
| `src/app/(dashboard)/garden/page.tsx` | UPDATED - Wrapped with PlantsProvider |
| `src/components/garden/garden-view.tsx` | UPDATED - Uses `usePlants()` hook instead of props |
| `src/components/garden/isometric-garden.tsx` | UPDATED - Uses `usePlants()` hook instead of props |
| `src/components/plants/plant-card.tsx` | UPDATED - Uses context for watering with optimistic updates |
| `src/components/plants/plant-detail-sheet.tsx` | UPDATED - Uses context for watering with optimistic updates |

**How it works:**
1. User clicks "Water Plant"
2. UI updates **immediately** (moisture, growth, streak, last_watered_at)
3. Server action runs in background
4. Toast notification shows XP earned when server confirms
5. If server fails, error toast is shown (and next page load will correct state)

**UX Improvements:**
- Watering feels instant (no lag)
- Plant card updates immediately without waiting
- Single toast notification with XP earned
- Network errors handled gracefully

### 2026-01-15: Game-Style UI Redesign
**Changes made in this session:**

| File | Change |
|------|--------|
| `next.config.ts` | UPDATED - Added `turbopack: {}` to fix Turbopack/webpack conflict in dev mode |
| `src/components/game-ui/game-nav.tsx` | NEW - Bottom navigation bar like mobile games with gradient icons, active states, sparkle effects |
| `src/components/game-ui/game-hud.tsx` | NEW - Floating HUD showing XP/level badge, progress bar, weather display |
| `src/components/game-ui/index.ts` | NEW - Export barrel file |
| `src/app/(dashboard)/layout.tsx` | UPDATED - Removed sidebar, added game nav, gradient background |
| `src/components/garden/garden-view.tsx` | UPDATED - Added GameHud, game-style view toggle, redesigned list view |
| `src/app/(dashboard)/stats/page.tsx` | UPDATED - Game-style design with gradient cards, colorful icons |
| `src/app/(dashboard)/profile/page.tsx` | UPDATED - Game-style design with avatar ring, animated water reserves |
| `src/app/globals.css` | UPDATED - Added game UI animations: nav-bounce, slide-up, hud-pop, glow-pulse, shine-effect, card-lift, ripple, gradient-border, glass morphism |

**UI Changes:**
- Removed traditional sidebar navigation
- Added game-style bottom navigation (like mobile games)
- Added floating HUD with level badge, XP bar, weather display
- Garden view toggle is now floating buttons (Garden/List)
- Stats page redesigned with colorful gradient cards
- Profile page with animated level ring, floating water reserves
- Glass morphism effect on cards
- Gradient backgrounds throughout dashboard

### 2026-01-15: Phase 4 - Polish & Launch (Previous)
**Changes made in previous session:**

| File | Change |
|------|--------|
| `public/manifest.json` | NEW - PWA manifest with app info and icons |
| `public/icons/` | NEW - PWA icons (72x72 to 512x512) and apple-touch-icon |
| `public/favicon.png` | NEW - App favicon |
| `next.config.ts` | UPDATED - Added next-pwa configuration |
| `src/app/layout.tsx` | UPDATED - Added PWA metadata, viewport, icons |
| `src/components/onboarding/onboarding-modal.tsx` | NEW - 5-step onboarding tour for new users |
| `src/app/(dashboard)/layout.tsx` | UPDATED - Integrated OnboardingModal |
| `src/app/error.tsx` | NEW - Global error page |
| `src/app/not-found.tsx` | NEW - 404 page |
| `src/app/(dashboard)/error.tsx` | NEW - Dashboard error boundary |
| `src/app/(dashboard)/loading.tsx` | NEW - Dashboard loading state |
| `src/app/(dashboard)/garden/loading.tsx` | NEW - Garden page skeleton |
| `src/app/(dashboard)/profile/loading.tsx` | NEW - Profile page skeleton |
| `src/app/(dashboard)/stats/loading.tsx` | NEW - Stats page skeleton |
| `scripts/generate-icons.mjs` | NEW - Script to generate PWA icons from SVG |
| `next-pwa.d.ts` | NEW - TypeScript declarations for next-pwa |
| `.gitignore` | UPDATED - Added PWA generated files |
| `package.json` | UPDATED - Added --webpack flag to build, generate-icons script |

**Phase 4 Progress:**
- [x] PWA setup (manifest, service worker, icons)
- [x] Onboarding flow (5-step modal tour)
- [x] Error handling (error boundaries, 404 page)
- [x] Loading states (skeleton loaders)
- [x] Game-style UI redesign
- [ ] Responsive design check
- [ ] Performance optimization

### 2026-01-14: Plant Visual System Upgrade
**Changes made in this session:**

| File | Change |
|------|--------|
| `src/components/plants/plant-image.tsx` | NEW - Component hiển thị cây bằng hình ảnh theo giai đoạn |
| `src/components/plants/plant-visual.tsx` | UPDATED - Thay emoji bằng PlantImage, thêm size 2xl |
| `src/components/garden/isometric-garden.tsx` | UPDATED - Fix hydration error (window.innerWidth), responsive tile size |
| `src/components/garden/isometric-plant.tsx` | UPDATED - Tăng kích thước cây (xl → 2xl) |
| `src/app/globals.css` | UPDATED - Thêm animate-growth-burst class |
| `public/plants/generic/` | NEW - 5 hình cho các giai đoạn cây (seed, sprout, growing, blooming, mature) |
| `public/plants/sunflower/seed.png` | NEW - Hình hạt hướng dương |
| `.agent/session-notes/plant-visual-upgrade.md` | NEW - Session notes cho công việc tiếp theo |
| `CLAUDE.md` | UPDATED - Thêm mục Plant Visual System |

**TODO tiếp theo:**
1. Tạo SVG đơn giản không nền đất cho các giai đoạn cây
2. Điều chỉnh vị trí cây trên tile isometric
3. Thêm hình cho các loại cây đặc biệt (sunflower, cherry blossom, cactus, rose, lotus, bamboo, bonsai, money tree)

### 2026-01-14: Garden Tooltip UX Fix
**Problem:** Tooltip was floating over the garden and blocking view of plants.
**Solution:** Replaced floating tooltip with bottom info bar.

| File | Change |
|------|--------|
| `src/components/garden/plant-tooltip.tsx` | REWRITTEN - New `PlantInfoBar` component displays at bottom of garden instead of floating. Shows plant details, moisture/growth bars, streak, warnings. Also kept minimal `PlantTooltip` for future use |
| `src/components/garden/isometric-garden.tsx` | UPDATED - Use `PlantInfoBar` instead of floating tooltip. Bar shows hint when no plant hovered |

### 2026-01-14: Plant UI Enhancement
**Changes made in this session:**

| File | Change |
|------|--------|
| `src/components/plants/plant-visual.tsx` | UPDATED - Added glow effects for thriving/mature plants, larger sizes, "MATURE" badge, improved wilting indicator with "Thirsty" label, thriving detection |
| `src/components/plants/plant-card.tsx` | UPDATED - Modern gradient backgrounds per plant type, decorative corners, glass-morphism progress containers, improved buttons with gradients |
| `src/components/plants/moisture-bar.tsx` | UPDATED - Gradient fills, emoji indicators (💧/⚠️/🏜️), improved visual styling with shadow |
| `src/components/plants/growth-progress.tsx` | UPDATED - Gradient progress bars, milestone markers, emojis, dynamic status icons (Sparkles/Leaf/Sprout), better status text |
| `src/app/globals.css` | UPDATED - New animations: pulse-slow, shimmer, glow-ring, float, success-ripple. Classes: plant-thriving, plant-mature-glow, gradient-text |

### 2026-01-14: UI/UX Improvements (Continued)

| File | Change |
|------|--------|
| `src/components/plants/plant-detail-sheet.tsx` | UPDATED - Major UI redesign: gradient header, card-style progress bars, colorful stat cards, better button styling |

### 2026-01-14: UI/UX Improvements

| File | Change |
|------|--------|
| `src/components/garden/isometric-plant.tsx` | UPDATED - Larger plant sizes, hover effect, drop shadow for better visuals |
| `src/components/garden/isometric-tile.tsx` | UPDATED - Better plant positioning with shadow, improved empty tile hover |
| `src/components/app-sidebar.tsx` | UPDATED - Completely redesigned with active states, descriptions, daily tip section, better user dropdown |

### 2026-01-14: Phase 3b Adaptive Goals Implementation
**Changes made in previous session:**

| File | Change |
|------|--------|
| `src/lib/adaptive-goals.ts` | NEW - Performance analysis, trigger detection, suggestion generation utilities |
| `src/lib/actions/adaptive.ts` | NEW - Server actions for adaptive analysis, apply/reject adjustments, recovery week |
| `src/components/goals/adaptive-suggestion-modal.tsx` | NEW - Modal for displaying and responding to suggestions |
| `src/components/goals/adaptive-settings.tsx` | NEW - Settings UI for adaptive mode (Fixed/Suggest/Auto) |
| `src/components/goals/performance-overview.tsx` | NEW - Performance overview with score, trend, variance |
| `src/components/goals/adjustment-history.tsx` | NEW - History of all adjustments made |
| `src/components/goals/index.ts` | Updated - Added adaptive component exports |
| `src/components/plants/plant-detail-sheet.tsx` | Updated - Integrated adaptive system with tabs (Progress/Performance/Settings) |
| `src/components/ui/tabs.tsx` | NEW - Tabs component |
| `src/components/ui/progress.tsx` | NEW - Progress bar component |
| `src/components/ui/scroll-area.tsx` | NEW - Scroll area component |
| `src/components/ui/alert-dialog.tsx` | NEW - Alert dialog component |
| `src/components/ui/badge.tsx` | NEW - Badge component |
| `src/components/ui/select.tsx` | NEW - Select component |

### 2026-01-14: Phase 3 Goal Tracking Implementation (Previous Session)

*(Previous changes remain documented below)*

---

## What's Working

### Authentication ✅
- Login, Register, Logout
- Protected routes
- User profile

### Garden System ✅
- Create plants with different types
- View garden grid with weather display
- Plant detail sheet
- Delete plants

### Watering System ✅
- Water plants (daily)
- Moisture tracking
- Growth percentage with weather modifiers
- Streak tracking
- XP rewards with weather bonuses

### Animations ✅
- Growth states: seed -> sprout -> growing -> blooming -> mature
- Wilting animation (low moisture)
- Death animation
- Watering effects
- Special plant effects

### Gamification ✅ (Fully Integrated)
- XP system with 15 levels (displayed in garden header + profile)
- Weather system affecting XP and growth (displayed in garden)
- 20+ achievements with progress tracking (shown on profile page)
- Achievement auto-checking after watering
- Water reserves (streak protection)
- Stats dashboard
- Cemetery view

### Automated Systems ✅
- Daily moisture decay via cron job (`/api/cron/moisture-decay`)
- Plant death when moisture reaches 0%
- Streak reset when plants not watered

### Goal Tracking ✅ (Phase 3)
- **Build Capacity mode**: Track improvement over time (e.g., run 2km -> 10km)
- **Total Progress mode**: Accumulate towards target (e.g., save $10,000)
- **Goal Setup Wizard**: 4-step wizard to create goals
- **Goal Logging**: Log daily values with +/- buttons, quick presets
- **Personal Records**: Track and celebrate PRs with trophy icon
- **Weekly Targets**: Auto-generated based on progression curve
- **Progress Tracking**: Visual progress bars and rings
- **Goal Statistics**: Full stats view with weekly chart, trend analysis
- **Plant Card Integration**: Shows goal progress on cards
- **Bonus XP**: Extra XP for PRs (+25) and exceeding targets (+10)

### Adaptive Goals ✅ (NEW - Phase 3b)
- **Performance Analysis**: Weekly score calculation, trend analysis, variance tracking
- **Trigger Detection**: Automatic detection of when adjustments are needed
  - Trigger INCREASE: >110% for 3 weeks, or >130% for 2 weeks
  - Trigger DECREASE: <80% for 3 weeks, or downward trend
  - Trigger RECOVERY: Critical performance or missed weeks
  - Warning: Valley of Death (weeks 2-4), high variance
- **Suggestion Modal**: Beautiful modal with options to:
  - Increase target / Shorten timeline
  - Decrease target / Extend timeline
  - Take recovery week
  - Keep current plan
- **Adaptive Modes**:
  - **Fixed**: No automatic adjustments
  - **Suggest**: Get suggestions, user decides
  - **Auto**: Automatic adjustments with protection limits
- **Recovery Week**: Reduce target by 50% for a week, keeps streak
- **Performance Overview**: Visual score, trend arrows, weekly breakdown
- **Adjustment History**: Track all adjustments made over time
- **Integrated UI**: Tab-based view in Goal Stats (Progress/Performance/Settings)

---

## What's NOT Working / TODO

### Phase 1 Remaining
- [ ] Basic notifications setup (optional, can be added later)

### Phase 4 - Polish & Launch
- [ ] Responsive design check
- [ ] PWA setup
- [ ] Onboarding flow
- [ ] Error handling improvements
- [ ] Performance optimization

### Nice to Have
- [ ] Water reserves integration with streak protection UI
- [ ] Achievement unlock notifications (popup when earning)
- [ ] Level up modal display on XP gain

---

## Known Issues

1. **Cron requires CRON_SECRET**: Set `CRON_SECRET` env var for production
2. **Service role key needed**: Set `SUPABASE_SERVICE_ROLE_KEY` for cron job
3. **No push notifications**: Would need PWA setup

## Fixed Issues

1. ✅ **Moisture decay cron idempotency** (2026-01-18): Fixed duplicate decay when cron runs multiple times per day

## Testing Moisture Decay Locally

**Vấn đề**: Cron job không chạy tự động trên local development. Chỉ chạy trên Vercel hoặc khi gọi API thủ công.

**Giải pháp**: Dùng test endpoint (chỉ hoạt động ở development):

```bash
# Preview (dry run) - xem sẽ xảy ra gì
curl http://localhost:3000/api/test/moisture-decay

# Apply decay - thực sự giảm moisture
curl -X POST http://localhost:3000/api/test/moisture-decay
```

**Lưu ý**: Test endpoint dùng auth của user đang login, không cần Service Role Key.

---

## File Locations Quick Reference

### New Files This Session (Phase 3b - Adaptive)
```
src/lib/adaptive-goals.ts                           # Performance analysis utilities
src/lib/actions/adaptive.ts                         # Adaptive server actions
src/components/goals/adaptive-suggestion-modal.tsx  # Suggestion modal
src/components/goals/adaptive-settings.tsx          # Settings UI
src/components/goals/performance-overview.tsx       # Performance display
src/components/goals/adjustment-history.tsx         # History component
```

### New UI Components
```
src/components/ui/tabs.tsx         # Tabs
src/components/ui/progress.tsx     # Progress bar
src/components/ui/scroll-area.tsx  # Scroll area
src/components/ui/alert-dialog.tsx # Alert dialog
src/components/ui/badge.tsx        # Badge
src/components/ui/select.tsx       # Select dropdown
```

### Updated Files This Session
```
src/components/goals/index.ts               # Added adaptive exports
src/components/plants/plant-detail-sheet.tsx # Integrated adaptive UI
```

### Database Tables
```
goals                  # Goal configuration
goal_logs              # Daily value logs
goal_adjustments       # Adaptive adjustments history
```

---

## Environment Variables Needed

```env
# Existing
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# For cron job
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=your-secret-token
```

---

## How Adaptive Goals Work

### Performance Scoring
- Score = (Actual / Target) × 100%
- Categories: Exceptional (130%+), Exceeding (110%+), On Track (90%+), Below, Struggling, Critical

### Trigger Detection
1. **Increase Triggers**:
   - 3+ weeks exceeding 110% → suggest increase
   - 2+ weeks at 130%+ → suggest bigger increase
2. **Decrease Triggers**:
   - 3+ weeks below 80% → suggest decrease
   - Downward trend with low scores → suggest decrease
3. **Recovery Triggers**:
   - Critical performance → suggest recovery week
   - 2+ missed weeks → suggest recovery

### Suggestion Flow
1. System analyzes performance weekly
2. If trigger detected → creates pending adjustment
3. User sees suggestion modal when viewing stats
4. User can Accept, Modify, or Dismiss
5. If Auto mode → system applies recommended option

### Recovery Week
- Target reduced by 50% for current week
- Keeps streak intact
- Doesn't count towards trend analysis
- Can be triggered manually via Settings

---

## Next Steps

1. **Test adaptive goals**
   - Create a plant with goal
   - Log some values (exceed/miss targets)
   - Check performance analysis
   - See if suggestions appear

2. **Phase 4: Polish & Launch**
   - Responsive design
   - PWA setup
   - Onboarding flow

3. **Polish**
   - Achievement unlock notifications
   - Level up celebration modal

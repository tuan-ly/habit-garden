# Habit Garden — Architecture Map

> **Dành cho AI**: Đọc file này trước khi làm bất cứ thay đổi nào liên quan đến plants, status, moisture, hoặc gamification.
> **Last Updated**: 2026-03-03

---

## Feature Registry

Danh sách tất cả features và trạng thái hiện tại:

| Feature | Status | Notes |
|---------|--------|-------|
| Plant CRUD | ✅ Active | `src/lib/actions/plants.ts` |
| Moisture Decay (Cron) | ✅ Active | Chạy 17:00 UTC hàng ngày qua Supabase cron |
| Gentle Growth statuses | ✅ Active | `thriving/resting/waiting/sleeping` — set bởi `activity.ts` |
| Watering system | ✅ Active | Simple water = `waterPlant()`, log activity = `logActivity()` |
| Goals (Build Capacity / Total Progress) | ✅ Active | PRO feature |
| Adaptive Goals | ✅ Active | `adaptive.ts` |
| Identity System | ✅ Active | PREMIUM feature |
| Subscription (Paddle) | ✅ Active | 3 tiers: free/pro/premium |
| Weed System | ❌ REMOVED | UI removed. `weeds.ts` action kept for DB compat only — KHÔNG thêm UI mới |
| Dormancy system | ⚠️ Deprecated | `status='dormant'` — treat as `resting` in UI |
| QuickLogModal | ❌ ARCHIVED | File vẫn tồn tại nhưng không được dùng: `quick-log-modal (archieved)` |

---

## Plant Status System — CRITICAL

**Đây là nguồn gốc của nhiều bug. Đọc kỹ trước khi chỉnh bất cứ thứ gì liên quan đến `status`.**

### Các giá trị status (DB field: `plants.status`)

```
LIVING STATUSES (subject to moisture decay):
  growing   — mặc định khi tạo plant
  thriving  — set bởi logActivity() khi user log progress
  resting   — (computed, có thể set bởi future code)
  waiting   — (computed, có thể set bởi future code)
  sleeping  — (computed, có thể set bởi future code)

TERMINAL STATUSES:
  mature    — 100% growth đạt được
  dead      — moisture = 0, set bởi cron
  dormant   — DEPRECATED, treat as resting
```

### Luồng status thay đổi

```
createPlant() → status = 'growing'
    ↓
logActivity() → status = 'thriving'  (active engagement)
    ↓
waterPlant()  → status giữ nguyên (chỉ update moisture/growth)
    ↓
khi growth >= 100% → status = 'mature'
    ↓
nếu moisture = 0 (cron) → status = 'dead'
```

### Quy tắc filter

```typescript
// ✅ Đúng — tất cả cây sống (cho garden, focus view)
plants.filter(p => p.status !== 'dead' && p.status !== 'dormant')

// ✅ Đúng — tất cả cây đang grow (cho list view "Growing" section)
plants.filter(p => p.status !== 'mature' && p.status !== 'dead' && p.status !== 'dormant')

// ✅ Đúng — cây có thể lên mature
newGrowth >= 100 && plant.status !== 'mature' && plant.status !== 'dead'

// ❌ SAI — bỏ sót thriving/resting/waiting/sleeping
plants.filter(p => p.status === 'growing')                   // list view bug
newGrowth >= 100 && plant.status === 'growing'               // hasMatured bug
.eq('status', 'growing')                                     // moisture decay bug
```

---

## Data Flow — Watering & Activity

```
User taps "Water":
  waterPlant(plantId)
    → watering_logs INSERT
    → plants UPDATE: moisture++, growth++, status giữ nguyên
    → profile UPDATE: xp++

User logs progress (goal plant):
  logActivity({ activity_type: 'completed'|'progress' })
    → activity_logs INSERT
    → plants UPDATE: moisture++, growth++, status = 'thriving'
    → profile UPDATE: xp++

Daily Cron (17:00 UTC = 00:00 VN):
  update_daily_moisture() [Supabase function]
  + /api/cron/moisture-decay [Next.js route — backup/override]
    → Plants IN ('growing','thriving','resting','waiting','sleeping')
    → Nếu chưa watered today → moisture -= decay_rate
    → Nếu moisture <= 0 → status = 'dead'
```

---

## View System

```
Garden Page (/garden):
  PlantsProvider (initialPlants từ server)
    ↓
  GardenView
    ├── viewMode = 'garden' → IsometricGarden
    │     • livingPlants = plants.filter(p => p.status !== 'dead')
    ├── viewMode = 'focus'  → FocusGardenView
    │     • Hiện tất cả non-dead, phân loại urgent/completed
    └── viewMode = 'list'   → PlantCard grid
          • growingPlants = non-dead, non-mature
          • maturePlants  = status === 'mature'
          • deadPlants    = status === 'dead' | 'dormant'
```

---

## Context Providers (Dashboard Layout)

```
DashboardLayout (SSR)
  └── DashboardProviders
        ├── DevDebugProvider    — dev mode overrides
        ├── SubscriptionProvider — tier: free/pro/premium
        ├── MoodProvider        — mood → weather display
        └── GardenSettingsProvider — zoom, animation prefs
              └── [page children]
                    └── PlantsProvider (per-page, SSR initial data)
```

**Không còn WeedsProvider** — đã remove 2026-03-03.

---

## Database Quick Reference

```sql
-- Plants table key fields
plants.status         -- Xem "Plant Status System" ở trên
plants.current_moisture  -- 0-100, decays daily
plants.growth_percentage -- 0-100, tăng khi water/log
plants.weed_count     -- DEPRECATED, không dùng trong UI

-- Cron jobs
update_daily_moisture()  -- Supabase cron, 17:00 UTC daily
```

---

## Conventions

### Code comments để đánh dấu

```typescript
// @removed: Weed system removed 2026-03. weeds.ts kept for DB compat only.
// @deprecated: Use calculatePlantStatus() instead
// @archived: Component không được dùng, xem phiên bản mới
```

### Khi thêm feature mới

1. Cập nhật **Feature Registry** ở trên
2. Nếu thay đổi status logic → cập nhật **Plant Status System**
3. Nếu thay đổi data flow → cập nhật diagram
4. Nếu remove feature → đánh dấu ❌ REMOVED, KHÔNG xóa section

---

## Known Technical Debt

| Item | Risk | Notes |
|------|------|-------|
| `weeds.ts` action file | Low | Có DB columns `weed_count`, code không dùng nhưng vẫn tồn tại |
| `quick-log-modal (archieved)` | Low | File được import với tên "(archieved)" trong isometric-garden.tsx |
| `plant-status.ts` computed statuses | Medium | `calculatePlantStatus()` tính status client-side nhưng KHÔNG write về DB — chỉ dùng cho display |
| Status mismatch legacy data | Medium | Plants cũ trong DB có thể có `status='growing'` dù đã được thriving sau khi fix |

# Reading Habit → Plant System Integration Plan

**Created:** 2024-07-29  
**Goal:** Unify reading habit system with existing plant system so every habit = one plant in the garden  
**Approach:** Option A - Unified Model (recommended)

---

## Context

Reading feature có vertical slice hoàn chỉnh (`habits`, `habit_sessions`, `daily_progress`, `growth_states`) nhưng đang **tách rời** khỏi hệ thống plant chính (`plants`, `activity_logs`, `watering_logs`).

### Current Gaps

1. ❌ Session tách rời khỏi log cây — `habit_sessions` không liên kết với `plants`
2. ❌ Cây đọc sách không nằm trong `/garden` — chỉ visible ở `/reading`
3. ❌ Lịch sử progression không có UI — `growth_states.history` có data nhưng không hiển thị
4. ❌ Session không tùy chỉnh được — cố định 30 phút
5. ❌ Active session không hiển thị trên garden — user mở `/garden` không biết có session đang chạy

---

## Architecture Decision

### Mapping Strategy: Virtual Plant Pattern

**Không duplicate data** giữa `habits` và `plants`. Thay vào đó:

- Mỗi `Habit` → tạo 1 **virtual plant** (không lưu vào DB `plants` table)
- Plant ID format: `habit:{habit_id}` (VD: `habit:uuid-123`)
- Garden render logic: merge `plants` + virtual plants from `habits`
- Plant card UI: detect virtual plant type → render habit-specific UI

**Trade-off:**
- ✅ Không cần migrate data
- ✅ Dễ rollback nếu cần
- ❌ Phải maintain mapping layer

---

## Phase 1: Data Layer Integration

### 1.1 Create Habit-Plant Mapping Utilities

**File:** `src/lib/habit-plant-mapping.ts`

```typescript
export interface VirtualPlant extends Pick<Plant, 'id' | 'name' | 'status' | 'created_at'> {
  type: 'habit'
  habit_id: string
  habit_type: string
  plant_stage: HabitPlantStage
  growth_percentage: number
  current_moisture: number // derived from consistency_score
}

export function habitToVirtualPlant(habit: Habit, growth: GrowthState): VirtualPlant
export function mergeRealAndVirtualPlants(realPlants: Plant[], habits: Habit[], growthStates: GrowthState[]): (Plant | VirtualPlant)[]
export function isVirtualPlant(plant: Plant | VirtualPlant): plant is VirtualPlant
```

**Acceptance:**
- `habitToVirtualPlant()` maps all habit fields to plant-compatible shape
- `mergeRealAndVirtualPlants()` returns unified array sorted by created_at
- Type guard `isVirtualPlant()` returns true for habit plants

### 1.2 Link Habit Sessions → Activity Logs

**File:** `src/lib/actions/habit-sessions.ts` (modify)

Add post-completion hook:
```typescript
async function completeHabitSession(sessionId: string, resultValue: number) {
  // Existing: atomic RPC call
  const result = await supabase.rpc('complete_habit_session_atomic', ...)
  
  // NEW: log to activity_logs for garden display
  if (result.data) {
    await logActivity({
      plant_id: `habit:${habitId}`, // virtual plant ID
      activity_type: 'habit_session_completed',
      value: resultValue,
      metadata: { session_id: sessionId, habit_type: habit.type }
    })
  }
}
```

**Acceptance:**
- Every completed session creates an `activity_logs` entry
- `plant_id` uses `habit:{id}` format
- `activity_type` = `'habit_session_completed'`

---

## Phase 2: Garden UI Integration

### 2.1 Modify PlantsProvider to Include Virtual Plants

**File:** `src/lib/context/plants-context.tsx`

```typescript
// Current: only loads real plants
const { data: plants } = await supabase.from('plants').select('*')

// NEW: also load habits + growth states
const { data: habits } = await supabase.from('habits').select('*, growth_states(*)')
const virtualPlants = habits?.map(h => habitToVirtualPlant(h, h.growth_states[0]))
const allPlants = mergeRealAndVirtualPlants(plants, virtualPlants)
```

**Acceptance:**
- `plants` context array includes both real + virtual plants
- Type: `(Plant | VirtualPlant)[]`
- Garden components see unified list

### 2.2 Garden Tile Rendering for Habit Plants

**File:** `src/components/garden/IsometricGarden.tsx`

```typescript
function renderPlantTile(plant: Plant | VirtualPlant) {
  if (isVirtualPlant(plant)) {
    return <HabitPlantTile 
      plant={plant}
      stage={plant.plant_stage}
      isActive={hasActiveSession(plant.habit_id)}
    />
  }
  return <PlantTile plant={plant} />
}
```

**New component:** `src/components/garden/HabitPlantTile.tsx`
- Visual: book icon hoặc custom habit type icon
- Badge: "Active" nếu có session đang chạy
- Click: mở habit detail sheet thay vì plant detail

**Acceptance:**
- Habit plants hiển thị trên garden với visual riêng
- Active session có indicator rõ ràng (pulse animation, badge)
- Click vào habit plant → navigate `/reading` hoặc mở habit sheet

### 2.3 Active Session Indicator

**File:** `src/components/game-ui/ActiveSessionBanner.tsx` (new)

Global banner hiển thị khi có session đang chạy:
```typescript
<AnimatePresence>
  {activeSession && (
    <motion.div className="fixed top-16 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full shadow-lg">
        <span>📖 Reading: {formatTime(elapsed)}</span>
        <Button onClick={() => router.push('/reading/session')}>Resume</Button>
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

**Acceptance:**
- Banner hiển thị trên mọi page khi có session running
- Click "Resume" → navigate `/reading/session`
- Auto-update timer mỗi giây

---

## Phase 3: Progression History UI

### 3.1 Growth History Component

**File:** `src/components/reading/GrowthHistoryChart.tsx` (new)

```typescript
interface Props {
  history: GrowthHistoryEntry[]
}

export function GrowthHistoryChart({ history }: Props) {
  // Timeline chart showing target progression over time
  // X-axis: reviewed_on dates
  // Y-axis: current_target value
  // Colors: green (advanced), yellow (held), blue (completed)
}
```

**Acceptance:**
- Chart hiển thị progression qua các review cycles
- Hover → tooltip với consistency score, successful_days
- Visual distinction cho 3 actions: advanced / held / completed

### 3.2 Add History to Growth Plan Page

**File:** `src/app/(dashboard)/reading/growth-plan/page.tsx`

```typescript
// Add after current milestone display
<section>
  <h2>Progression History</h2>
  <GrowthHistoryChart history={growth.history} />
</section>
```

**Acceptance:**
- History chart visible trong `/reading/growth-plan`
- Empty state: "No progression reviews yet"

---

## Phase 4: Session Customization

### 4.1 Add Session Config to Habit Model

**Migration:** `20260729_add_habit_session_config.sql`

```sql
ALTER TABLE habits
ADD COLUMN session_config JSONB DEFAULT '{"duration_minutes": 30, "allow_custom": false}'::jsonb;

-- Update existing reading habit
UPDATE habits 
SET session_config = '{"duration_minutes": 30, "allow_custom": true}'::jsonb
WHERE type = 'reading';
```

**Acceptance:**
- `habits.session_config` column exists
- Reading habit has `allow_custom: true`

### 4.2 Session Duration Picker UI

**File:** `src/components/reading/SessionDurationPicker.tsx` (new)

```typescript
const PRESETS = [15, 30, 45, 60] // minutes

<Tabs>
  <TabsList>
    {PRESETS.map(m => <TabsTrigger value={m}>{m}m</TabsTrigger>)}
    <TabsTrigger value="custom">Custom</TabsTrigger>
  </TabsList>
  {allowCustom && (
    <TabsContent value="custom">
      <Input type="number" min={5} max={180} />
    </TabsContent>
  )}
</Tabs>
```

**Acceptance:**
- User chọn duration trước khi start session
- Custom input chỉ hiển thị nếu `allow_custom = true`
- Duration persists to `habit_sessions.duration_seconds`

---

## Phase 5: Cross-System Sync

### 5.1 Unified Activity Feed

**File:** `src/components/overview/ActivityFeed.tsx` (modify)

Merge activities từ:
- `watering_logs` (plant watering)
- `activity_logs` (harvest, craft, etc.)
- `habit_sessions` (habit completions)

```typescript
const activities = [
  ...wateringLogs.map(toActivity),
  ...activityLogs.map(toActivity),
  ...habitSessions.filter(s => s.status === 'completed').map(toActivity)
].sort((a, b) => b.timestamp - a.timestamp)
```

**Acceptance:**
- `/overview` activity feed hiển thị cả plant + habit activities
- Unified sort by timestamp
- Icon + text khác nhau cho từng type

### 5.2 Coins Reward Integration

**Current:** `habit_sessions.reward_points` đã có
**Gap:** Points này chưa sync với `profiles.coins`

**File:** `src/lib/actions/habit-sessions.ts`

```typescript
// After atomic completion
if (result.data) {
  await awardCoins(userId, session.reward_points, {
    source: 'habit_session',
    session_id: sessionId
  })
}
```

**Acceptance:**
- Completed session → coins tăng trong `profiles.coins`
- Toast notification: "🪙 +{points} coins earned!"

---

## Verification Checklist

### Data Layer
- [ ] Virtual plant mapping utility works
- [ ] Habit sessions create activity logs
- [ ] No duplicate data in `plants` table

### Garden UI
- [x] Habit plants hiển thị trong garden grid
- [x] Active session có visual indicator trên tile
- [x] Click habit plant → correct navigation

### Session UX
- [ ] Active session banner visible trên mọi page
- [ ] Duration picker works với presets + custom
- [ ] Session completion → coins reward

### Progression
- [ ] Growth history chart renders correctly
- [ ] Timeline shows advanced/held/completed states
- [ ] Empty state handled gracefully

### Integration
- [ ] Activity feed merge plant + habit activities
- [ ] Coins sync giữa sessions và profile
- [ ] No breaking changes to existing plant features

---

## Rollback Plan

Nếu cần rollback:

1. Remove virtual plant mapping from `PlantsProvider`
2. Hide habit plants in garden (keep `/reading` route)
3. Revert activity log integration (sessions vẫn chạy độc lập)
4. Remove `session_config` column (optional, non-breaking)

**Data safety:** Không có destructive migrations, tất cả additive only.

---

## Dependencies

- Reading vertical slice hoàn chỉnh (✅ done, trên branch `feature/reading-habit-vertical-slice`)
- Supabase schema tables: `habits`, `habit_sessions`, `daily_progress`, `growth_states` (✅ exists)
- Garden rendering system (✅ exists)

---

## Estimated Effort

| Phase | Tasks | Effort |
|-------|-------|--------|
| 1. Data Layer | 2 files | 2-3h |
| 2. Garden UI | 3 files | 4-5h |
| 3. History UI | 2 files | 2-3h |
| 4. Customization | 2 files + migration | 3-4h |
| 5. Cross-System | 2 files | 2h |
| Testing & Polish | All phases | 3-4h |
| **Total** | ~15 files | **16-21h** |

**Recommendation:** Làm từng phase, verify từng phase trước khi sang phase tiếp.

---

**Next steps:**
1. Review plan này với user
2. Nếu approve → start Phase 1 (Data Layer)
3. Commit plan vào repo: `.planning/reading-plant-integration-plan.md`
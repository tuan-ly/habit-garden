# UX Redesign: Plant Watering & Info System

> **Created**: 2026-01-18
> **Status**: Phase 1 Complete (Core Interactions)

---

## Problem Statement

Current UX issues:
1. **Too many steps to water**: Click plant → Open sheet → Click "Water Plant" button
2. **No multi-action support**: Can only log 1 time per day, but habits like "drink water", "read", "exercise" need multiple logs
3. **Hover-only info**: Touch devices can't access plant info easily
4. **Overview stats unclear**: "Waterings" doesn't distinguish between plants tended vs total actions

---

## Design Goals

1. **One-tap watering** - Primary action should be the simplest gesture
2. **Multi-log support** - Allow logging habits multiple times per day with notes
3. **Visual feedback in garden** - Show today's activity count directly on plants
4. **Separated interactions** - Tap to water, long-press to view info

---

## Interaction Model

### Desktop (Mouse)

| Action | Gesture | Result |
|--------|---------|--------|
| Water/Log | Left click | Log action (simple) or open quick log modal (goal) |
| View Info | Right click | Open floating info card (context menu style) |
| Full Details | Right click → "Details" | Open side sheet |

### Mobile (Touch)

| Action | Gesture | Result |
|--------|---------|--------|
| Water/Log | Single tap | Log action (simple) or open quick log modal (goal) |
| View Info | Long press (500ms) | Open floating info card |
| Full Details | Long press → "Details" | Open side sheet |

### Implementation Notes

```typescript
// Desktop: Right-click handler
onContextMenu={(e) => {
  e.preventDefault()
  showFloatingInfo(plant, { x: e.clientX, y: e.clientY })
}}

// Mobile: Long press handler (use @use-gesture/react or custom)
useLongPress(() => {
  showFloatingInfo(plant, touchPosition)
}, { threshold: 500 })

// Both: Left click / tap
onClick={() => {
  if (plant.goal_mode) {
    openQuickLogModal(plant)
  } else {
    waterPlant(plant.id)
  }
}}
```

---

## Plant Types & Watering Behavior

### Type A: Simple Habit (No Goal)

**Use case**: Daily habits that just need check-in (meditate, journal, stretch)

**Behavior**:
- **Single tap** = Toggle watered today (like checkbox)
- **Visual**: Shows ✓ if watered, ○ if not
- **Limit**: 1 time per day (already watered = show "Done" state)

**UI on plant**:
```
┌─────────────┐
│    🌻       │
│             │
│     ✓      │  ← Green checkmark if watered today
└─────────────┘
```

### Type B: Goal Tracking (Has Goal)

**Use case**: Habits with measurable progress (read 30 pages, run 5km, drink 8 glasses)

**Behavior**:
- **Single tap** = Open Quick Log Modal (enter value + optional note)
- **Visual**: Shows action count dots or mini bar
- **Limit**: Unlimited (each log recorded separately)

**UI on plant**:
```
┌─────────────┐
│    🌻       │
│             │
│  💧💧💧    │  ← 3 logs today (dots or water drops)
│   45km      │  ← Today's total value (if applicable)
└─────────────┘
```

---

## Component Designs

### 1. Plant Overlay Badge

Shows today's activity directly on plant in garden view.

**For Simple Habits:**
```
         🌻
        /
       ✓     (watered)
      or
       ○     (not watered)
```

**For Goal Plants:**
```
         🌻
        /
    💧×3     (3 logs today)
      or
   📖 45p    (icon + today's value)
```

**Implementation:**
- Small badge positioned at bottom-right of plant
- Semi-transparent background for readability
- Animate on new log (pop-in effect)

### 2. Quick Log Modal (Goal Plants)

Appears on tap for plants with goals. Minimal, fast input.

```
┌──────────────────────────────────────┐
│                                 ✕    │
│  📖 Read Books                       │
│  ────────────────────────────────── │
│                                      │
│  How much?                           │
│  ┌────────────────────────────────┐ │
│  │  [-]     30      [+]           │ │  ← Value input with +/- buttons
│  └────────────────────────────────┘ │
│           pages                      │
│                                      │
│  Quick picks:                        │
│  [10] [20] [30] [50]                │
│                                      │
│  Note (optional):                    │
│  ┌────────────────────────────────┐ │
│  │ Chapter 5 - The Discovery...  │ │
│  └────────────────────────────────┘ │
│                                      │
│  ┌────────────────────────────────┐ │
│  │         💧 Log (+15 XP)        │ │
│  └────────────────────────────────┘ │
│                                      │
│  Today: 💧💧💧 (45 pages total)     │
└──────────────────────────────────────┘
```

**Features:**
- Auto-focus on value input
- Quick pick buttons for common values
- Optional note textarea
- Shows today's running total at bottom
- XP preview in button

### 3. Simple Water Toast (Non-Goal Plants)

For simple habits, tap triggers immediate watering with toast feedback.

```
┌────────────────────────────────────┐
│  💧 Watered "Morning Stretch"      │
│  +10 XP                      [Undo]│
└────────────────────────────────────┘
```

**Features:**
- Appears at bottom for 3 seconds
- Undo button to revert
- Shows XP earned
- Plant animates water effect

### 4. Floating Info Card (Long Press)

Compact info view that appears near the plant.

```
┌─────────────────────────────────────┐
│  🌻 Morning Run                     │
│  ───────────────────────────────── │
│                                     │
│  💧 85%    🌱 68%    🔥 5 days     │
│  moisture  growth    streak         │
│                                     │
│  ───────────────────────────────── │
│  Today's Activity                   │
│  💧 3 logs • 7.5km total           │
│  ───────────────────────────────── │
│  Recent:                            │
│  ✓ 8:15am - 2.5km "Morning jog"    │
│  ✓ 12:30pm - 3km "Lunch run"       │
│  ✓ 6:45pm - 2km "Evening walk"     │
│                                     │
│  ───────────────────────────────── │
│  [💧 Log]    [📊 Full Details]     │
└─────────────────────────────────────┘
```

**Features:**
- Positioned near tapped plant (avoid edge overflow)
- Dismiss by tapping outside
- "Log" button opens Quick Log Modal
- "Full Details" opens existing PlantDetailSheet

### 5. Recent Activity Bar (Optional Enhancement)

Horizontal scrollable bar showing recent logs across all plants.

```
┌──────────────────────────────────────────────────────────┐
│ Recent: 🌻 8:15 • 📖 9:30 • 💪 12:00 • 🌻 18:45 • ...   │
└──────────────────────────────────────────────────────────┘
```

Position: Fixed at bottom, above navigation.

---

## Overview Stats Redesign

### Current Design
```
[Waterings: 25] [Plants: 5] [XP: 1200]
```

### New Design

```
┌─────────────────────────────────────────────────────────┐
│                     This Week                            │
├──────────────────────┬──────────────────────────────────┤
│                      │                                   │
│   🌿 5               │   💧 25                          │
│   Plants Tended      │   Total Actions                  │
│   (unique plants     │   (all logs across              │
│    you cared for)    │    all plants)                  │
│                      │                                   │
├──────────────────────┼──────────────────────────────────┤
│                      │                                   │
│   ⭐ 1,200           │   📈 12                          │
│   XP Earned          │   Best Streak                    │
│                      │                                   │
└──────────────────────┴──────────────────────────────────┘
```

**Metrics Explained:**
- **Plants Tended**: Number of unique plants watered at least once in period
- **Total Actions**: Sum of all watering logs (can be >1 per plant per day)
- **XP Earned**: Total XP from all actions
- **Best Streak**: Highest consecutive day streak in period

---

## Database Changes Required

### 1. Allow Multiple Watering Logs Per Day

Current constraint needs to be removed or modified:
```sql
-- Remove unique constraint on (plant_id, watered_date)
-- Allow multiple logs per plant per day

-- Add index for efficient querying
CREATE INDEX idx_watering_logs_plant_date
ON watering_logs(plant_id, watered_date);
```

### 2. New Fields (Optional)

```sql
-- No new tables needed, use existing watering_logs
-- Already has: notes, xp_earned, watered_at, watered_date

-- For goal plants, value is logged via goal_logs table (already exists)
```

### 3. Query Changes

```sql
-- Get today's log count for a plant
SELECT COUNT(*) as today_count, SUM(xp_earned) as today_xp
FROM watering_logs
WHERE plant_id = ? AND watered_date = CURRENT_DATE;

-- Get recent logs for a plant
SELECT * FROM watering_logs
WHERE plant_id = ?
ORDER BY watered_at DESC
LIMIT 10;
```

---

## Implementation Phases

### Phase 1: Core Interaction Change ✅ COMPLETE
- [x] Implement tap-to-water for simple plants
- [x] Implement long-press for info card
- [x] Add plant overlay badge showing today's status

### Phase 2: Multi-Log Support
- [ ] Remove single-watering-per-day constraint
- [ ] Create Quick Log Modal for goal plants
- [ ] Update garden view to show log counts

### Phase 3: Floating Info Card
- [ ] Create FloatingPlantCard component
- [ ] Position logic (avoid edges, follow finger)
- [ ] Animation (scale in/out)

### Phase 4: Overview Redesign
- [ ] Update stats calculation (plants tended vs total actions)
- [ ] Redesign stat cards with new metrics
- [ ] Add Best Streak metric

---

## Component File Structure

```
src/components/
├── garden/
│   ├── isometric-garden.tsx      # Update interaction handling
│   ├── isometric-plant.tsx       # Update with overlay badge
│   ├── plant-overlay-badge.tsx   # NEW - Shows today's activity
│   ├── floating-plant-card.tsx   # NEW - Long-press info card
│   └── plant-tooltip.tsx         # DEPRECATED - Replace with floating card
├── plants/
│   ├── quick-log-modal.tsx       # NEW - Fast logging for goal plants
│   ├── water-toast.tsx           # NEW - Simple watering feedback
│   └── plant-detail-sheet.tsx    # Keep for full details
└── overview/
    └── stats-summary.tsx         # NEW - Redesigned stats display
```

---

## Animation Specs

### 1. Tap to Water (Simple Plants)
```
1. Plant scales down 5% (50ms)
2. Water drop appears above plant, falls down (200ms)
3. Plant scales back + slight bounce (150ms)
4. Badge updates with checkmark (fade in 200ms)
5. Toast appears at bottom (slide up 200ms)
```

### 2. Right Click / Long Press Info
```
Desktop (Right Click):
1. Context menu prevented
2. Floating card appears at cursor position (scale in 0.8→1.0, 150ms)
3. Background dims slightly (opacity 0.2)

Mobile (Long Press):
1. After 300ms hold: slight scale up (5%) + subtle glow (visual feedback)
2. After 500ms: haptic vibration (if supported)
3. On release: floating card scales in from touch position (200ms, ease-out)
4. Background dims slightly (opacity 0.3)
```

### 3. Log Count Update
```
1. New dot/number scales in with spring effect
2. Brief glow pulse on badge
3. Confetti particles if milestone (5, 10, etc.)
```

---

## Accessibility Considerations

- **Long press alternative**: Also support double-tap for info on touch
- **Screen reader**: Badge announces "3 logs today"
- **Reduced motion**: Disable animations, instant state changes
- **Keyboard**: Tab to plant → Enter to water → Shift+Enter for info

---

## Open Questions

1. **Undo duration**: How long should the undo option be available? (Suggested: 5 seconds)
2. **Note character limit**: Max length for log notes? (Suggested: 500 chars)
3. **Badge overflow**: If >9 logs, show "9+" or scroll? (Suggested: show "9+")

---

## Related Files to Modify

| File | Change |
|------|--------|
| `src/components/garden/isometric-garden.tsx` | Add long-press handling, update click behavior |
| `src/components/garden/isometric-plant.tsx` | Add overlay badge slot |
| `src/lib/actions/plants.ts` | Remove single-watering constraint, add multi-log queries |
| `src/app/(dashboard)/overview/page.tsx` | Update stats display |
| `src/lib/context/plants-context.tsx` | Add methods for multi-watering |

---

## Success Metrics

After implementation, measure:
1. **Time to log**: Should decrease from ~3 taps to 1 tap
2. **Daily log count**: Should increase as logging becomes easier
3. **Note usage**: Track if users add notes (indicates engagement)
4. **Bounce rate on garden**: Should decrease (less friction)

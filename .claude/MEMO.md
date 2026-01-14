# Habit Garden - Project Memo

> **Last Updated**: 2026-01-14
> **Current Phase**: Phase 3 - Goal Tracking (COMPLETE)
> **Last Session**: Goal Tracking Implementation

---

## Current State Summary

The project has completed Phase 1 (MVP Core), Phase 2 (Gamification), and Phase 3 (Goal Tracking):
- Full authentication system
- Plant creation and management
- Watering system with XP rewards + weather modifiers
- Comprehensive gamification features fully integrated
- Daily moisture decay cron job
- Plant death logic
- **NEW: Full goal tracking system with Build Capacity and Total Progress modes**

---

## Recent Changes (Latest First)

### 2026-01-14: Phase 3 Goal Tracking Implementation
**Changes made in this session:**

| File | Change |
|------|--------|
| `src/lib/actions/goals.ts` | NEW - Server actions for createGoal, logGoalValue, getGoalStats, getGoalForPlant |
| `src/components/goals/goal-setup-wizard.tsx` | NEW - 4-step wizard for setting up goals |
| `src/components/goals/goal-log-modal.tsx` | NEW - Modal for logging goal progress values |
| `src/components/goals/goal-progress.tsx` | NEW - Progress display, ring, and badge components |
| `src/components/goals/goal-stats.tsx` | NEW - Full statistics view with charts |
| `src/components/goals/index.ts` | NEW - Export index for goal components |
| `src/components/plants/plant-detail-sheet.tsx` | Updated - Integrated goal display, setup wizard, and log modal |
| `src/components/plants/plant-card.tsx` | Updated - Shows goal progress ring and badge for goal plants |

### 2024-01-14: Gamification Integration (Previous Session)
**Commit**: `99dc48a`

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

### Goal Tracking ✅ (NEW - Phase 3)
- **Build Capacity mode**: Track improvement over time (e.g., run 2km -> 10km)
- **Total Progress mode**: Accumulate towards target (e.g., save $10,000)
- **Goal Setup Wizard**: 4-step wizard to create goals
  - Step 1: Choose mode (Build Capacity / Total Progress)
  - Step 2: Set target value, unit, duration
  - Step 3: Choose progression curve (linear, exponential, logarithmic, s-curve, step)
  - Step 4: Preview weekly targets
- **Goal Logging**: Log daily values with +/- buttons, quick presets
- **Personal Records**: Track and celebrate PRs with trophy icon
- **Weekly Targets**: Auto-generated based on progression curve
- **Progress Tracking**: Visual progress bars and rings
- **Goal Statistics**: Full stats view with weekly chart, trend analysis
- **Plant Card Integration**: Shows goal progress on cards
- **Bonus XP**: Extra XP for PRs (+25) and exceeding targets (+10)

---

## What's NOT Working / TODO

### Phase 1 Remaining
- [ ] Basic notifications setup (optional, can be added later)

### Phase 4 - Adaptive Goals (Not Started)
- [ ] Adaptive trigger detection
- [ ] Performance scoring
- [ ] Trend analysis
- [ ] Suggestion generation
- [ ] Recovery week feature

### Nice to Have
- [ ] Water reserves integration with streak protection UI
- [ ] Achievement unlock notifications (popup when earning)
- [ ] Level up modal display on XP gain

---

## Known Issues

1. **Cron requires CRON_SECRET**: Set `CRON_SECRET` env var for production
2. **Service role key needed**: Set `SUPABASE_SERVICE_ROLE_KEY` for cron job
3. **No push notifications**: Would need PWA setup

---

## File Locations Quick Reference

### New Files This Session (Phase 3)
```
src/lib/actions/goals.ts                    # Goal server actions
src/components/goals/goal-setup-wizard.tsx  # 4-step goal wizard
src/components/goals/goal-log-modal.tsx     # Value logging modal
src/components/goals/goal-progress.tsx      # Progress components
src/components/goals/goal-stats.tsx         # Statistics view
src/components/goals/index.ts               # Exports
```

### Updated Files This Session
```
src/components/plants/plant-detail-sheet.tsx # Goal integration
src/components/plants/plant-card.tsx         # Goal progress display
```

### Key Goal-Related Files
```
src/lib/progression.ts                       # Progression curves
src/types/database.ts                        # Goal TypeScript types
```

### Database Tables (Already Created)
```
goals                  # Goal configuration
goal_logs              # Daily value logs
goal_adjustments       # Adaptive adjustments (for future)
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

## How Goal Tracking Works

### Creating a Goal
1. Open plant detail sheet
2. Click "Add Goal Tracking" button
3. Follow 4-step wizard:
   - Choose Build Capacity or Total Progress
   - Set unit, target value, duration
   - Select progression curve
   - Preview and confirm

### Logging Progress
1. Click "Log Progress" on a goal plant
2. Enter today's value
3. See if it's a PR or exceeds target
4. Get bonus XP for achievements

### Viewing Statistics
1. Open plant detail sheet for goal plant
2. Click "Stats" button
3. See weekly chart, PRs, completion prediction

---

## Next Steps

1. **Test goal tracking**
   - Create a plant with goal
   - Log some values
   - Check statistics display

2. **Phase 4: Adaptive Goals (Optional)**
   - Add trigger detection
   - Implement suggestions
   - Recovery week feature

3. **Polish**
   - Achievement unlock notifications
   - Level up celebration modal

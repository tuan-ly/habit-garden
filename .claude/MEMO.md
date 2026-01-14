# Habit Garden - Project Memo

> **Last Updated**: 2024-01-14
> **Current Phase**: Phase 3 - Goal Tracking (pending)
> **Last Commit**: `f85f3e7` - feat: implement Phase 1 & 2

---

## Current State Summary

The project has completed Phase 1 (MVP Core) and Phase 2 (Gamification). The app has:
- Full authentication system
- Plant creation and management
- Watering system with XP rewards
- Comprehensive gamification features

---

## Recent Changes (Latest First)

### 2024-01-14: Phase 1 & 2 Complete
**Commit**: `f85f3e7`

#### Phase 1 - Plant Animations
| File | Change |
|------|--------|
| `src/app/globals.css` | Added 500+ lines of CSS animations (seed-pulse, sprout-emerge, plant-sway, plant-bloom, mature-breathe, plant-wilt, plant-death, water effects, weather effects, achievement animations) |
| `src/components/plants/plant-visual.tsx` | NEW - Animated plant component with growth stage detection |
| `src/components/plants/plant-card.tsx` | Updated to use PlantVisual, added XP popup, weather support |
| `src/components/plants/plant-detail-sheet.tsx` | Updated to use PlantVisual with animations |

#### Phase 2 - Gamification System
| File | Change |
|------|--------|
| `src/components/plants/special-effects.tsx` | NEW - Special plant effects (Bamboo, Sunflower, Cherry Blossom, Cactus, Lotus, Rose, Bonsai, Money Tree) |
| `src/lib/xp-system.ts` | NEW - XP calculation, level progression (15 levels), titles |
| `src/components/gamification/xp-progress.tsx` | NEW - XP bar, level up modal, XP gain popup |
| `src/lib/achievements.ts` | NEW - 20+ achievements, 4 tiers, checking logic |
| `src/components/gamification/achievement-popup.tsx` | NEW - Achievement unlock notifications |
| `src/components/gamification/achievements-grid.tsx` | NEW - Achievement display grid with progress |
| `src/lib/weather-system.ts` | NEW - Daily weather (Sunny, Cloudy, Rainy, Stormy, Rainbow) |
| `src/components/gamification/weather-display.tsx` | NEW - Weather badge, forecast, effects panel |
| `src/lib/water-reserves.ts` | NEW - Streak protection system |
| `src/components/gamification/water-reserves.tsx` | NEW - Water reserves UI components |
| `src/components/gamification/stats-dashboard.tsx` | NEW - Full stats dashboard |
| `src/components/garden/cemetery-view.tsx` | NEW - Dead plants history view |
| `src/components/gamification/index.ts` | NEW - Export file for gamification components |
| `package.json` | Added lottie-react dependency |

---

## What's Working

### Authentication ✅
- Login, Register, Logout
- Protected routes
- User profile

### Garden System ✅
- Create plants with different types
- View garden grid
- Plant detail sheet
- Delete plants

### Watering System ✅
- Water plants (daily)
- Moisture tracking
- Growth percentage
- Streak tracking
- XP rewards

### Animations ✅
- Growth states: seed → sprout → growing → blooming → mature
- Wilting animation (low moisture)
- Death animation
- Watering effects
- Special plant effects

### Gamification ✅
- XP system with 15 levels
- 20+ achievements
- Daily weather system
- Water reserves (streak protection)
- Stats dashboard
- Cemetery view

---

## What's NOT Working / TODO

### Phase 1 Incomplete
- [ ] Daily moisture decay (cron job needed)
- [ ] Plant death logic (auto-kill at 0% moisture)
- [ ] Basic notifications setup

### Phase 3 - Goal Tracking (Not Started)
- [ ] Goals database schema
- [ ] Goal setup wizard UI
- [ ] Build Capacity mode
- [ ] Total Progress mode
- [ ] Weekly targets
- [ ] Progress charts

### Integration Needed
- [ ] Connect gamification components to pages
- [ ] Wire up achievement checking on actions
- [ ] Apply weather modifiers to watering
- [ ] Use water reserves in streak logic

---

## Known Issues

1. **Weather not applied**: Weather modifiers exist but not connected to watering action
2. **Achievements not checked**: Achievement logic exists but not triggered on actions
3. **Water reserves not used**: Reserve system exists but not integrated with streak protection
4. **No cron job**: Moisture decay needs scheduled job

---

## File Locations Quick Reference

### New Files This Session
```
src/components/plants/plant-visual.tsx      # Animated plant display
src/components/plants/special-effects.tsx   # Special plant effects
src/lib/xp-system.ts                        # XP & levels
src/lib/achievements.ts                     # Achievement definitions
src/lib/weather-system.ts                   # Weather system
src/lib/water-reserves.ts                   # Streak protection
src/components/gamification/                # All gamification UI
src/components/garden/cemetery-view.tsx     # Dead plants view
```

### Key Existing Files
```
src/lib/actions/plants.ts                   # Plant server actions
src/lib/actions/profile.ts                  # Profile server actions
src/components/plants/plant-card.tsx        # Plant card (updated)
src/components/garden/garden-view.tsx       # Main garden view
src/types/database.ts                       # Type definitions
```

---

## Next Steps

1. **Integrate gamification to UI**
   - Add XpProgress to header/sidebar
   - Add WeatherBadge to garden view
   - Show achievements on profile page

2. **Wire up achievement checking**
   - Call `checkAllAchievements()` after watering
   - Show AchievementPopup when unlocked

3. **Apply weather to watering**
   - Use `calculateWeatherXp()` in waterPlant action
   - Show weather effects on garden

4. **Start Phase 3: Goal Tracking**
   - Create goals table schema
   - Build goal wizard UI

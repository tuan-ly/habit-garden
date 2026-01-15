# Habit Garden - Project Memo

> **Last Updated**: 2026-01-15
> **Current Phase**: Phase 4 - Polish & Launch (IN PROGRESS)
> **Last Session**: Game-Style UI Redesign

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
- **NEW: Game-style UI - Removed sidebar, added bottom navigation**
- **NEW: Floating HUD for XP/level/weather display**
- **NEW: Game-style animations and visual polish**
- **NEW: Redesigned Stats and Profile pages with game aesthetics**

---

## Recent Changes (Latest First)

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

# Habit Garden - Project Memo

> **Last Updated**: 2026-02-22
> **Phase**: Habien v3 - Identity-First Redesign
> **Stack**: Next.js 16, Supabase, Tailwind CSS 4, shadcn/ui

---

## 🎯 Current Sprint

**Focus**: Habien v3 - Phase 0: Identity Liberation

**Branch**: `feature/habien-3.0` (from `feature/habien-2.0-phase-1`)
**Supabase**: `habien-v3` (id: nokkicjusrucrpnnbzlg, region: ap-southeast-1)
**Design Doc**: [plans/habien-v3/VISION.md](../plans/habien-v3/VISION.md)

**v3 Phases**:
- [ ] **Phase 0: Identity Liberation** ← CURRENT
- [ ] Phase 1: 2-Minute Rule + Anchors
- [ ] Phase 2: XP De-emphasis + Reflection Engine
- [ ] Phase 3: Garden Meaning (dormancy, established, identity zones)
- [ ] Phase 4: Monetization Restructure
- [ ] Phase 5: Garden Neighbors

**v3 Monetization** (Identity = FREE):
| Tier | Price | Key Features |
|------|-------|--------------|
| FREE "The Seed" | $0 | 3 identities, 3 habits, full 4-laws engine, simple garden |
| PRO "The Garden" | $4.99/mo | Unlimited, tiers 1-4, 5x5 garden, analytics, insights |
| PREMIUM "The Sage" | $9.99/mo | Buddies, AI coaching, tier 5, 7x7+, pattern recognition |

**Next Actions**:
1. Identity-first onboarding redesign (FREE, Day 1)
2. Upgrade flow UX polish (upgrade modal improvements)
3. Trial management (7-day free trial)
4. Analytics for conversion tracking
5. Responsive design audit

**Related Docs**:
- [Monetization Design](../plans/goal-feature-uiux-design/MONETIZATION_DESIGN.md)
- [Habien 2.0 Design](../plans/goal-feature-uiux-design/HABIEN_2.0_DESIGN.md)

---

## Quick Status

| Area | Status |
|------|--------|
| Auth | Done |
| Garden/Plants | Done |
| Watering System | Done |
| Gamification | Done (XP, achievements, weather, streaks, journal rewards) |
| Goal Tracking | Done (Build Capacity + Total Progress modes) |
| Identity System | Done (PREMIUM feature, goal grouping) |
| Adaptive Goals | Done |
| PWA/UI Polish | Done |
| Gentle Growth | Phase 1 Done |
| Plant Detail Sheet | Done (tabs + reflective UX) |
| Testing Infrastructure | Done (Vitest + Dev Debug Panel + Storybook) |

---

## Latest Session

### 2026-02-19: Bug Fix - Moisture Decay System
- **Issue**: Cây không tự động decay mỗi ngày
- **Root Cause**: Cron job `update_daily_moisture()` chạy nhưng fail vì query bảng `daily_weather` không tồn tại
- **Investigation**: Dùng Supabase MCP kiểm tra job run history - tất cả 10 lần chạy gần nhất đều status "failed"
- **Solution**: Rewrite function `update_daily_moisture()` để bỏ qua weather modifier dependency
- **Result**: ✅ Function hoạt động, moisture decay đúng (tested: 92→84→76)
- **Next run**: Cron sẽ tự động chạy vào 17:00 UTC (00:00 VN) hàng ngày

**Files Modified**:
- [20260219_fix_moisture_decay.sql](../supabase/migrations/20260219_fix_moisture_decay.sql) - Migration với function fix

---

### 2026-02-18: Phase 7 - Polish (LevelUpModal + AchievementPopup wired)
- Exported `checkAndUnlockAchievements` from [plants.ts](src/lib/actions/plants.ts)
- Extended [activity.ts](src/lib/actions/activity.ts): `logActivity()` now returns `leveledUp`, `newLevel`, `oldLevel`, `newAchievementIds`
- Wired [IsometricGarden](src/components/garden/isometric-garden.tsx) to display:
  - [LevelUpModal](src/components/game-ui/level-up-modal.tsx) with confetti on level up
  - [AchievementQueue](src/components/gamification/achievement-popup.tsx) for newly unlocked achievements
- 202 tests all pass

**Next Actions**:
1. Upgrade flow UX polish (upgrade modal design)
2. Trial management (7-day free trial)
3. Responsive design audit
4. Analytics for conversion tracking

---

### 2026-02-12: Phase 6 - Identity System (PREMIUM)
- Created `identities` table with RLS policies and progress tracking
- Added `identity_id` foreign key to goals table
- Created auto-update trigger for identity progress calculation
- Built server actions: CRUD, goal linking/unlinking, stats
- Created UI components:
  - [IdentityCard](src/components/identity/identity-card.tsx) - Display card with progress bar
  - [IdentityDashboard](src/components/identity/identity-dashboard.tsx) - List view with feature gate
  - [IdentityCreationDialog](src/components/identity/identity-creation-dialog.tsx) - 3-step wizard
  - [IdentityDetailSheet](src/components/identity/identity-detail-sheet.tsx) - Full detail view with tabs
- Added `/identity` page route (PREMIUM gated)
- Added Identity nav item with PREMIUM badge to game navigation
- 8 preset identity suggestions (Reader, Athlete, Developer, etc.)

**New Files**:
- [20260212_identity_system.sql](supabase/migrations/20260212_identity_system.sql)
- [identity.ts](src/lib/actions/identity.ts) - Server actions
- [src/components/identity/](src/components/identity/) - UI components
- [identity/page.tsx](src/app/(dashboard)/identity/page.tsx) - Page route

**Modified Files**:
- [database.ts](src/types/database.ts) - Identity types
- [game-nav.tsx](src/components/game-ui/game-nav.tsx) - Nav item with premium badge

### 2026-02-12: Phase 5 - Paddle Payment Integration
- Integrated Paddle Billing for subscription payments
- Created Paddle client with checkout overlay support
- Added webhook handler at `/api/webhooks/paddle` with signature verification
- Created server actions for subscription management (cancel, resume, portal)
- Updated pricing section with 3-tier system (FREE/PRO/PREMIUM)
- Connected upgrade modal to Paddle checkout flow
- Added subscription management section to Settings page
- Database migration for webhook audit log

**New Files**:
- [paddle.ts](src/lib/paddle.ts) - Paddle client utilities (refactored)
- [paddle-utils.ts](src/lib/paddle-utils.ts) - Server-side helpers
- [paddle.ts](src/lib/actions/paddle.ts) - Server actions
- [route.ts](src/app/api/webhooks/paddle/route.ts) - Webhook handler
- [subscription-section.tsx](src/components/settings/subscription-section.tsx) - Settings UI

**Modified Files**:
- [product-config.ts](src/components/landing/product-config.ts) - 3-tier system
- [pricing-section.tsx](src/components/landing/pricing-section.tsx) - Updated UI
- [upgrade-modal-container.tsx](src/components/game-ui/upgrade-modal-container.tsx) - Paddle checkout
- [settings/page.tsx](src/app/(dashboard)/settings/page.tsx) - Added subscription section

**Environment Variables Needed**:
```
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_xxx
PADDLE_API_KEY=pdl_xxx
PADDLE_WEBHOOK_SECRET=pdl_ntfsec_xxx
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox
NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID=pri_xxx
NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID=pri_xxx
NEXT_PUBLIC_PADDLE_PREMIUM_MONTHLY_PRICE_ID=pri_xxx
NEXT_PUBLIC_PADDLE_PREMIUM_YEARLY_PRICE_ID=pri_xxx
```

### 2026-02-11: Storybook Setup
- Installed Storybook 8.6.15 with React Vite framework (Next.js 16 compatible)
- Created 3 story files with multiple visual states:
  - [TierBadge.stories.tsx](src/components/ui/__stories__/TierBadge.stories.tsx) - All tiers, sizes, locked states
  - [SlotIndicator.stories.tsx](src/components/garden/__stories__/SlotIndicator.stories.tsx) - Fill states, variants
  - [PlantVisual.stories.tsx](src/components/plants/__stories__/PlantVisual.stories.tsx) - Growth stages, moisture, weather
- New npm scripts: `npm run storybook`, `npm run build-storybook`

**New Files**: [.storybook/main.ts](.storybook/main.ts), [.storybook/preview.ts](.storybook/preview.ts), 3 story files

### 2026-02-11: Phase 4 - Feature Gating
- Created [SubscriptionContext](src/lib/context/subscription-context.tsx) for managing tier state across app
- Added SubscriptionProvider to dashboard layout with dev override support
- Gated Goals feature in PlantDetailSheet behind PRO tier
- Updated AddPlantDialog with subscription-based plant tier/slot limits
- Added level cap enforcement in xp-system with subscription tier support
- Added upgrade prompts at Level 6 (Goals) and Level 13 (Identity)
- Updated GameHud to show MAX level state when at subscription cap
- Added 13 new tests for level cap functionality (202 tests total, 100% pass)

**New Files**:
- [subscription-context.tsx](src/lib/context/subscription-context.tsx)
- [upgrade-modal-container.tsx](src/components/game-ui/upgrade-modal-container.tsx)

**Modified Files**:
- [plant-detail-sheet.tsx](src/components/plants/plant-detail-sheet.tsx) - PRO gate for goals
- [add-plant-dialog.tsx](src/components/plants/add-plant-dialog.tsx) - Subscription tier limits
- [game-hud.tsx](src/components/game-ui/game-hud.tsx) - Level cap display
- [level-up-modal.tsx](src/components/game-ui/level-up-modal.tsx) - Upgrade prompts at L6/L13
- [xp-system.ts](src/lib/xp-system.ts) - Level cap support

### 2026-02-11: Phase 3 - Subscription Infrastructure
- Created subscription database schema (4 tables: subscription_tiers, subscriptions, subscription_events, upgrade_prompts)
- Added subscription_tier and subscription_status to profiles with auto-sync trigger
- Created [subscription-limits.ts](src/lib/subscription-limits.ts) utility with tier limits, feature checks, upgrade prompts
- Created [upgrade-modal.tsx](src/components/game-ui/upgrade-modal.tsx) with FeatureLock component
- Added [subscription.ts](src/lib/actions/subscription.ts) server actions (get tier, check limits, track prompts)
- Added 36 unit tests for subscription limits (100% pass)

**New Files**:
- [20260211_subscription_infrastructure.sql](supabase/migrations/20260211_subscription_infrastructure.sql)
- [subscription-limits.ts](src/lib/subscription-limits.ts)
- [upgrade-modal.tsx](src/components/game-ui/upgrade-modal.tsx)
- [subscription.ts](src/lib/actions/subscription.ts)
- [subscription-limits.test.ts](src/lib/__tests__/subscription-limits.test.ts)

### 2026-02-11: Testing Infrastructure
- Added **Dev Debug Panel** for quick feature testing (toggle with `Ctrl+Shift+D`)
  - Override level, tier, subscription in dev mode
  - Quick actions: Level Up, Max Level, Set PRO/PREMIUM
  - Persists to localStorage
- Added **Vitest Unit Tests** (153 tests, 100% pass)
  - [progression-system.test.ts](src/lib/__tests__/progression-system.test.ts) - 82 tests
  - [xp-system.test.ts](src/lib/__tests__/xp-system.test.ts) - 71 tests
- New npm scripts: `npm test`, `npm run test:ui`, `npm run test:coverage`

**New Files**: [dev-debug-context.tsx](src/components/dev/dev-debug-context.tsx), [dev-debug-panel.tsx](src/components/dev/dev-debug-panel.tsx), [vitest.config.ts](vitest.config.ts)

**Next Steps for Testing**:
- [x] Add Storybook for visual components
- [ ] Add more story files (PlantCard, LevelUpModal, etc.)
- [ ] Add E2E tests with Playwright (optional)
- See [TESTING_STRATEGY.md](plans/20260211-1530-testing-strategy/TESTING_STRATEGY.md)

### 2026-02-06: Monetization Design
- Designed FREE/PRO/PREMIUM tier system
- Created [MONETIZATION_DESIGN.md](../plans/goal-feature-uiux-design/MONETIZATION_DESIGN.md)
- Updated implementation roadmap (7 phases)
- Key: Goals gated to PRO, Identity gated to PREMIUM

### 2026-02-06: Habien 2.0 Phase 2 - Garden Expansion System
- Implemented level-based garden sizing (3x3 -> 5x5 -> 7x7 -> dynamic)
- Added decoration unlock system (bushes/rocks at L1, mushrooms/flowers L5, lanterns L8, fences L10, ponds/fountains L12)
- Created new SVG decorations: FencePost, FenceCorner, Pond, Fountain
- Built LevelUpModal with confetti effect and unlock display

**New Files**: [level-up-modal.tsx](src/components/game-ui/level-up-modal.tsx), [unlock-toast.tsx](src/components/game-ui/unlock-toast.tsx), [expansion-animation.tsx](src/components/garden/expansion-animation.tsx)

### 2026-02-06: Habien 2.0 Phase 1 Implementation
- Implemented tier system (1-5 tiers based on plant difficulty)
- Added slot limits by level (1 slot at level 1, up to unlimited at level 15)
- Created TierBadge and SlotIndicator UI components
- Added tier filtering and slot validation to AddPlantDialog
- Applied migration to Supabase

**New Files**: [progression-system.ts](src/lib/progression-system.ts), [tier-badge.tsx](src/components/ui/tier-badge.tsx), [slot-indicator.tsx](src/components/ui/slot-indicator.tsx)

### 2026-02-02: UX Mode Consolidation
- Consolidated 3 garden modes into 1 toggle (Interact/Move)
- Merged FloatingPlantCard UX into GentleWateringModal

---

## Known Issues / TODO

- [ ] Responsive design check
- [x] Achievement unlock popup notification (wired 2026-02-18)
- [x] Level up celebration modal (Phase 2)
- [ ] Performance optimization for large gardens
- [x] Wire LevelUpModal to XP system (wired 2026-02-18)

**Watering Logic Refinement** (from 2026-01-31):
1. If already watered today -> hide "Just checking in"
2. `waterPlantSimple` should NOT give base XP, only note XP
3. Base XP only on first water/log of the day

---

## Working Features

**Core**: Auth, Plants CRUD, Grid garden with zoom/pan, Plant movement

**Watering**: One-tap watering + celebration, Moisture tracking, Streaks

**Gamification**: XP (15 levels), Weather XP bonus, 20+ achievements, Water reserves

**Goals**: Build Capacity mode, Total Progress mode, Weekly targets, Adaptive suggestions, Personal records

**UI/UX**: PWA, Game-style nav + HUD, Mood/weather system, Onboarding, Skeletons

---

## Key Directories

```
src/components/
  garden/    - Isometric garden, tiles, zoom, decorations
  plants/    - Plant visual, cards, dialogs, watering modal
  goals/     - Goal tracking UI
  game-ui/   - HUD, nav, mood selector
  dev/       - Dev Debug Panel (dev-only)

src/lib/
  actions/   - Server actions (plants, goals, profile, activity, journal)
  context/   - React contexts
  hooks/     - Custom hooks
  __tests__/ - Unit tests (Vitest)
```

---

## Database Quick Reference

**Tables**: `plants`, `plant_types`, `goals`, `goal_logs`, `profiles`, `watering_logs`, `mood_logs`, `achievements`, `activity_logs`, `rest_days`, `reflections`

**Cron**: `update_daily_moisture()` at 17:00 UTC (00:00 VN)

---

## Environment

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

---

## References

- [DEVLOG.md](DEVLOG.md) - Full session history & implementation details
- [DECISIONS.md](DECISIONS.md) - Architecture decisions
- [ROADMAP.md](ROADMAP.md) - Future plans
- [CHANGELOG.md](CHANGELOG.md) - Release notes

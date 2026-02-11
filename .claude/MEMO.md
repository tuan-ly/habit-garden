# Habit Garden - Project Memo

> **Last Updated**: 2026-02-11
> **Phase**: 4 - Polish & Launch
> **Stack**: Next.js 16, Supabase, Tailwind CSS 4, shadcn/ui

---

## 🎯 Current Sprint

**Focus**: Habien 2.0 - Phase 3: Subscription Infrastructure

**Progress**:
- ✅ Phase 1: Tier system, slot limits
- ✅ Phase 2: Garden expansion system
- [ ] **Phase 3: Subscription Infrastructure** ← NEXT
- [ ] Phase 4: Feature Gating
- [ ] Phase 5: Goals System (PRO+)
- [ ] Phase 6: Identity System (PREMIUM)
- [ ] Phase 7: Polish & Launch

**Monetization Tiers**:
| Tier | Price | Key Features |
|------|-------|--------------|
| FREE | $0 | 3 plants, Tier 1-2, 3x3 garden, Level cap 10 |
| PRO | $4.99/mo | 8 plants, Tier 1-4, 5x5 garden, Goals, Level cap 15 |
| PREMIUM | $9.99/mo | Unlimited, Tier 1-5, 7x7+ garden, Identity, Level 20+ |

**Next Actions**:
1. Create subscription database schema (subscription_tiers, subscriptions)
2. Integrate payment provider (Polar.sh recommended)
3. Add subscription_tier to profiles
4. Create TierLimits utility (replace pure level-based limits)
5. Build upgrade modal component

**Related Docs**:
- [Monetization Design](../plans/goal-feature-uiux-design/MONETIZATION_DESIGN.md) ← NEW
- [Habien 2.0 Design](../plans/goal-feature-uiux-design/HABIEN_2.0_DESIGN.md)
- [Brainstorm Reports](../plans/goal-feature-uiux-design/reports/)

---

## Quick Status

| Area | Status |
|------|--------|
| Auth | Done |
| Garden/Plants | Done |
| Watering System | Done |
| Gamification | Done (XP, achievements, weather, streaks, journal rewards) |
| Goal Tracking | Done (Build Capacity + Total Progress modes) |
| Adaptive Goals | Done |
| PWA/UI Polish | Done |
| Gentle Growth | Phase 1 Done |
| Plant Detail Sheet | Done (tabs + reflective UX) |
| Testing Infrastructure | Done (Vitest + Dev Debug Panel) |

---

## Latest Session

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
- [ ] Add Storybook for visual components
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
- [ ] Achievement unlock popup notification
- [x] Level up celebration modal (Phase 2)
- [ ] Performance optimization for large gardens
- [ ] Wire LevelUpModal to XP system (trigger on level change)

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

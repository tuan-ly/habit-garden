# Requirements: Habit Garden

**Defined:** 2026-04-28
**Core Value:** The app must be fun enough that users open it on their worst day.

## v1 Requirements (Milestone 2: Dual Growth & Polish)

### Dual Growth Model

- [ ] **DUAL-01**: User sees two garden areas — a 3×3 seasonal garden (short-cycle plants) and a single ancient tree (long-cycle)
- [ ] **DUAL-02**: Short-cycle plants mature within weeks based on review cycles, then are harvested and a new seed planted
- [ ] **DUAL-03**: Ancient tree grows visually over months/years with 8+ growth stages (seed → legendary)
- [ ] **DUAL-04**: Ancient tree's growth reflects cumulative consistency across all habits, not just one
- [ ] **DUAL-05**: Mature short-cycle plants contribute resources/XP/visual flourishes to the ancient tree area

### Plant Personality System

- [ ] **PLANT-01**: Each of the 9 plant types has a unique growth pattern (linear, delayed, burst, etc.)
- [ ] **PLANT-02**: Each plant type has unique resilience characteristics (drought resistance, recovery speed)
- [ ] **PLANT-03**: Each plant type has signature visual moments during growth
- [ ] **PLANT-04**: Plant selection quiz (3 questions) helps users pick a matching plant type

### Visual Assets

- [ ] **VISUAL-01**: All 42 plant PNG images generated (9 types × ~5 stages, minus existing 6)
- [ ] **VISUAL-02**: Ancient tree growth stage images (8 stages, from sapling to legendary)
- [ ] **VISUAL-03**: Decoration and material images (~30 PNGs)

### Polish & Bug Fixes

- [ ] **POLISH-01**: SSR data fetching for InventoryProvider (remove initialCoins=0 flash)
- [ ] **POLISH-02**: Apply pending crafting system migration to Supabase
- [ ] **POLISH-03**: Fix Paddle resolveUserId calling wrong API method
- [ ] **POLISH-04**: Fix XP morning bonus inconsistency (constants 3 vs system 5)
- [ ] **POLISH-05**: Populate goals.best_streak field

## v2 Requirements (Future)

### Extended Growth Mechanics

- **EXT-01**: Dormancy replaces death (plants sleep, visual wilting, can always revive)
- **EXT-02**: Tiny Seed system (2-minute rule as game mechanic with progression)
- **EXT-03**: Anchors (habit stacking, unlocks at L3)
- **EXT-04**: Reflection as XP source (weekly prompts, unlocks at L4)

### Social & Community

- **SOC-01**: Garden Neighbors (1-3 buddies, mutual visibility, Premium)
- **SOC-02**: Mirror Moments (identity discovery achievements)

### Content & Cosmetics

- **COS-01**: Rebirth system (change plant type keeping progress)
- **COS-02**: Cosmetic skins for plants (29+ skins from v2→v3 mapping)
- **COS-03**: Garden themes (architecture exists, only Classic Garden active)

### Infrastructure

- **INFRA-01**: Push notifications
- **INFRA-02**: Analytics/error tracking
- **INFRA-03**: CI/CD pipeline (GitHub Actions)
- **INFRA-04**: Image CDN/optimization

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time chat / messaging | Not core to habit building, high complexity |
| Native mobile app | PWA + Capacitor sufficient |
| AI habit suggestions | No implementation priority, feature flag only |
| Ad-supported free tier | Conflicts with "never look cheap" principle |
| Weekly email reports | No email infrastructure |
| Multi-device session limits | No session tracking, low priority |
| Leaderboards / competitive features | Conflicts with "no guilt mechanics" principle |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DUAL-01 | Phase 1 | Pending |
| DUAL-02 | Phase 1 | Pending |
| DUAL-03 | Phase 1 | Pending |
| DUAL-04 | Phase 1 | Pending |
| DUAL-05 | Phase 2 | Pending |
| PLANT-01 | Phase 1 | Pending |
| PLANT-02 | Phase 1 | Pending |
| PLANT-03 | Phase 2 | Pending |
| PLANT-04 | Phase 2 | Pending |
| VISUAL-01 | Phase 3 | Pending |
| VISUAL-02 | Phase 3 | Pending |
| VISUAL-03 | Phase 3 | Pending |
| POLISH-01 | Phase 4 | Pending |
| POLISH-02 | Phase 4 | Pending |
| POLISH-03 | Phase 4 | Pending |
| POLISH-04 | Phase 4 | Pending |
| POLISH-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-28*
*Last updated: 2026-04-28 after initial definition*

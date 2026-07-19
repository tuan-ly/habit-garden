# Roadmap: Habit Garden — Milestone 2 (Dual Growth & Polish)

**Created:** 2026-04-28
**Milestone:** 2 — Dual Growth Model + Visual Assets + Polish
**Phases:** 4
**Granularity:** Coarse

---

## Phase Overview

| # | Phase | Goal | Requirements | Success Criteria |
|---|-------|------|--------------|------------------|
| 1 | Dual Growth Core | Two-garden architecture with short-cycle and long-cycle growth models | DUAL-01, DUAL-02, DUAL-03, DUAL-04, PLANT-01, PLANT-02 | 3 |
| 2 | Plant Personality & Harvest Loop | Complete the harvest→tree cycle and add plant character | DUAL-05, PLANT-03, PLANT-04 | 3 |
| 3 | Visual Assets | Generate all missing plant, tree, decoration images | VISUAL-01, VISUAL-02, VISUAL-03 | 3 |
| 4 | Polish & Ship | Fix known bugs, apply pending migration, SSR fixes | POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05 | 4 |

---

## Phase 1: Dual Growth Core

**Goal:** Implement the two-garden architecture — a 3×3 seasonal garden with short-cycle plants that mature within weeks, and a single ancient tree that grows over months/years. Each plant type has a unique growth pattern and resilience profile.

**Requirements:** DUAL-01, DUAL-02, DUAL-03, DUAL-04, PLANT-01, PLANT-02

**UI hint:** yes

**Success Criteria:**
1. User can see both garden areas (seasonal grid + ancient tree) in the garden view
2. Short-cycle plants complete their growth cycle based on configured review periods and can be harvested
3. Ancient tree visually progresses through growth stages reflecting cumulative user consistency
4. Each plant type grows at a distinct rate with unique resilience to missed days

**Depends on:** Nothing (standalone)

---

## Phase 2: Plant Personality & Harvest Loop

**Goal:** Complete the feedback loop where harvested short-cycle plants contribute to the ancient tree. Add signature visual moments for each plant type and the selection quiz.

**Requirements:** DUAL-05, PLANT-03, PLANT-04

**UI hint:** yes

**Success Criteria:**
1. Harvesting a mature short-cycle plant visibly enriches the ancient tree area (resources, XP, visual flourishes)
2. Each plant type has at least one signature visual moment during its growth
3. New users can take a 3-question quiz to get a recommended first plant type

**Depends on:** Phase 1

---

## Phase 3: Visual Assets

**Goal:** Generate all missing PNG images for plants (42 total), ancient tree stages (8), and decorations/materials (~30). Replace emoji fallback with actual images.

**Requirements:** VISUAL-01, VISUAL-02, VISUAL-03

**UI hint:** no

**Success Criteria:**
1. All 9 plant types have complete image sets across all growth stages
2. Ancient tree has images for all 8 growth stages (seed → legendary)
3. All decoration and material types have corresponding images

**Depends on:** Phase 1 (need to know ancient tree stage definitions)

---

## Phase 4: Polish & Ship

**Goal:** Fix known bugs, apply pending database migration, and resolve SSR data fetching issues. Prepare for production deployment.

**Requirements:** POLISH-01, POLISH-02, POLISH-03, POLISH-04, POLISH-05

**UI hint:** no

**Success Criteria:**
1. InventoryProvider loads with SSR data (no flash of initialCoins=0)
2. Crafting system migration applied to production Supabase
3. All known bugs fixed (Paddle API, XP inconsistency, best_streak)
4. Application builds and deploys without errors

**Depends on:** Nothing (can run parallel with Phase 2 or 3)

---

## Requirement Coverage

All 17 v1 requirements mapped to phases. No gaps.

| Category | Count | Phases |
|----------|-------|--------|
| Dual Growth Model | 5 | Phase 1, 2 |
| Plant Personality | 4 | Phase 1, 2 |
| Visual Assets | 3 | Phase 3 |
| Polish & Fixes | 5 | Phase 4 |

---
*Roadmap created: 2026-04-28*
*Last updated: 2026-04-28 after initial creation*

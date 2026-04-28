# Habit Garden

## What This Is

A garden game where every plant represents a real habit. Users plant, water, and grow virtual plants by consistently practicing their habits. The game is designed to be fun enough to open on a bad day — gentle accountability through play, not punishment. Long-term vision: trees that grow more beautiful over years, creating emotional attachment to sustained habits.

## Core Value

The app must be fun enough that users open it on their worst day. Psychology serves fun, not the other way around.

## Requirements

### Validated

- ✓ Auth (email/password, OAuth) — v1.0
- ✓ Plant CRUD with 9 types, 5 tiers — v1.0
- ✓ Isometric garden (zoom/pan, virtualization, tile grid) — v1.0
- ✓ Watering & activity logging (optimistic UI) — v1.0
- ✓ Growth & status system (gentle — plants sleep, never die) — v1.0
- ✓ XP/Level system (15 levels, titles, badges) — v1.0
- ✓ Achievement system (23 achievements, 4 tiers) — v1.0
- ✓ Streak tracking & celebration — v1.0
- ✓ Mood & weather system (XP modifiers) — v1.0
- ✓ Goal system (Build Capacity + Total Progress, adaptive) — v1.0
- ✓ Identity system (Premium, wizard, goal grouping) — v1.0
- ✓ Crafting & economy (materials, recipes, coins, shop) — v1.0
- ✓ Decoration placement (place/pickup/move/rotate, undo) — v1.0
- ✓ Subscription (Paddle, Free/Pro/Premium) — v1.0
- ✓ PWA support — v1.0
- ✓ Easy Mode (2-minute rule, +20% XP) — v1.0
- ✓ Dev Debug Panel (Ctrl+Shift+D) — v1.0

### Active

- [ ] Dual Growth Model — short-cycle 3×3 garden (seasonal harvest) + long-cycle ancient tree (years of growth)
- [ ] Extended growth stages (Established → Ancient → Legendary, spanning years)
- [ ] Plant personality system (9 types with unique growth patterns, resilience, visual stories)
- [ ] Plant image assets (42 PNGs needed, only 6 exist)
- [ ] Decoration/material image assets (~30+ PNGs needed)
- [ ] SSR data fetching for InventoryProvider
- [ ] Run pending migration on Supabase (crafting system)
- [ ] Known bug fixes (see specs/rules.md)

### Out of Scope

- Community/social features — complexity too high for solopreneur
- Real-time chat — not core to habit building
- Mobile native app — PWA + Capacitor sufficient for now
- AI suggestions — feature flag exists but no implementation priority
- Ads — not aligned with brand values ("never look cheap")
- Weekly email reports — no email infrastructure

## Context

- **User profile:** Solopreneur building solo. Can code but not professional developer. Needs AI as Product Thinking Partner.
- **Current state:** v1.0 feature-complete on master. Decoration/crafting system built but migration not applied. Most plant images missing (emoji fallback).
- **Design philosophy:** "Unfinished is OK, ugly is not." Every visible element must feel intentional and polished.
- **Brand:** Habien (habien.com). Vietnamese market primary (VND pricing). English UI.
- **Previous workflow:** SDD (Spec-Driven Development) → migrating to GSD for better phase management.
- **Key design docs:** `specs/product.md` (full product spec), `specs/rules.md` (business rules), `PLANT-GUIDE.md` + `VISION.md` (v3 design, not yet implemented).

## Constraints

- **Stack:** Next.js 16, Supabase, Tailwind CSS 4, shadcn/ui — locked
- **Solo dev:** All work done by one person + AI. No team review.
- **Performance:** Prefer Canvas for complex visuals. Minimize DOM animations.
- **Business rules:** Plants never die. No guilt mechanics. Free tier genuinely useful.
- **Quality bar:** Missing features OK, ugly UI never OK.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| GSD over SDD | GSD handles phased execution better for complex features | — Pending |
| Dual Growth Model | Short-cycle for quick wins + long-cycle for emotional attachment | — Pending |
| Plants never die (sleep instead) | Core brand principle — no punishment mechanics | ✓ Good |
| Paddle for payments | Best for indie devs, handles tax/compliance | ✓ Good |
| No separate API layer | Server Actions sufficient for solo dev, less boilerplate | ✓ Good |
| Emoji fallback for missing images | Ship quality > block on assets | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-28 after initialization*

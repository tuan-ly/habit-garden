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
- ✓ Reading Habit Vertical Slice — persistent guided session, completion and deterministic 5→30 pages/day Growth Plan — 2026-07-28

### Active

- [ ] Capability Plugin Platform release — all platform and user-scoped running-session migrations applied; authenticated release smoke remains pending
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
- **Current state:** R5 has a linked Capability Plugin Platform. Reading is the first plugin; Garden and generic journey routes no longer branch on Reading, Capability Library owns optional setup, Plant Detail owns pause/resume/remove, and focus mode keeps one contextual primary action. Per-plant progress remains isolated while a deployed user-scoped invariant permits only one running timer; authenticated release smoke remains pending.
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
| Generic guided-session aggregate | A reusable Habit/Plan/Session/Progress/Growth model enables persistent sessions and deterministic progression without coupling the domain to Reading UI | ✓ Good |
| Guided habits as plant capabilities | Preserve one plant identity/placement model while Reading, Exercise and later guided workflows add optional behavior | Superseded in cardinality by ADR 003 |
| Per-plant capability instances | Each plant gets one capability slot; many plants may select the same type without switching, while every plant keeps an independent target and log | Implementation verification in progress |
| Capability Plugin Platform | Separate manifest, server, UI and optional screen registries; expose setup as “Hành trình của cây” instead of mixing it into daily care | ✓ Locally implemented and audited; release pending |
| User-scoped single running session | Keep each plant's progress independent while preventing concurrent focus timers across tabs, devices and capability instances | ✓ Implemented, deployed and schema-verified; authenticated smoke pending |

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
*Last updated: 2026-08-21 after deploying and verifying the user-scoped running-session migration*

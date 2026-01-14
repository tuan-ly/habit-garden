# Claude Code Protocol for Habit Garden

## Overview

This document defines the protocol for working on this project. It helps Claude Code quickly understand the project state without scanning the entire codebase.

---

## Quick Start Rules

### 1. Always Read First
Before starting any task, read these files in order:
1. `.claude/MEMO.md` - Current project state and recent changes
2. `.claude/DECISIONS.md` - Architecture decisions and why they were made
3. `doc/11 - IMPLEMENTATION-PHASES.md` - What's done and what's pending

### 2. Always Update After Changes
After completing any significant work:
1. Update `.claude/MEMO.md` with what was changed
2. Add any architectural decisions to `.claude/DECISIONS.md`
3. Mark completed tasks in `doc/11 - IMPLEMENTATION-PHASES.md`
4. Add entry to `.claude/DEVLOG.md` (development journal)
5. Update `.claude/CHANGELOG.md` if it's a user-facing feature
6. Update `.claude/ROADMAP.md` if roadmap status changed

---

## Documentation Files

| File | Purpose | Update When |
|------|---------|-------------|
| `MEMO.md` | Current state, what's working | Every session |
| `DECISIONS.md` | Architecture choices | Making tech decisions |
| `DEVLOG.md` | Development journal | End of each session |
| `CHANGELOG.md` | User-facing changes | New features/fixes |
| `ROADMAP.md` | Product roadmap | Phase completion |
| `STORY.md` | Product story/marketing | Major milestones |
| `PROTOCOL.md` | This file - rules | Rarely |

### 3. Commit Message Format
```
<type>: <short description>

<detailed description of what was done>
- Bullet points for multiple changes
- Include file paths for new files

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

Types: `feat`, `fix`, `refactor`, `docs`, `style`, `test`, `chore`

---

## Project Structure Summary

```
habit-garden/
├── .claude/                    # Claude Code context files
│   ├── PROTOCOL.md            # This file - rules and protocol
│   ├── MEMO.md                # Current state and recent changes
│   ├── DECISIONS.md           # Architecture decisions log
│   └── settings.local.json    # Claude Code settings
├── doc/                        # Project documentation
│   └── 11 - IMPLEMENTATION-PHASES.md  # Task tracking
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/
│   │   ├── ui/                # shadcn/ui base components
│   │   ├── plants/            # Plant-related components
│   │   ├── garden/            # Garden view components
│   │   └── gamification/      # XP, achievements, weather, etc.
│   ├── lib/
│   │   ├── actions/           # Server actions (Supabase)
│   │   ├── supabase/          # Supabase client setup
│   │   └── *.ts               # Utility modules (xp, weather, etc.)
│   └── types/                 # TypeScript type definitions
└── supabase/                  # Supabase migrations (if any)
```

---

## Key Files Reference

### Core Logic
| File | Purpose |
|------|---------|
| `src/lib/xp-system.ts` | XP calculation, levels, titles |
| `src/lib/achievements.ts` | Achievement definitions and checking |
| `src/lib/weather-system.ts` | Daily weather generation |
| `src/lib/water-reserves.ts` | Streak protection system |

### Components
| File | Purpose |
|------|---------|
| `src/components/plants/plant-visual.tsx` | Animated plant display |
| `src/components/plants/plant-card.tsx` | Plant card in grid |
| `src/components/gamification/` | All gamification UI |
| `src/components/garden/garden-view.tsx` | Main garden layout |

### Server Actions
| File | Purpose |
|------|---------|
| `src/lib/actions/plants.ts` | Plant CRUD, watering |
| `src/lib/actions/profile.ts` | User profile, stats |

### Types
| File | Purpose |
|------|---------|
| `src/types/database.ts` | Main app types |
| `src/types/supabase.ts` | Generated Supabase types |

---

## Implementation Status

### Completed Phases
- [x] Phase 1: MVP Core (Auth, Garden, Watering)
- [x] Phase 2: Gamification (XP, Achievements, Weather, Water Reserves)

### Current Phase
- [ ] Phase 3: Goal Tracking (Goals, Adaptive system)

### Pending
- [ ] Phase 4: Polish & Launch
- [ ] Phase 5: Community (Future)

---

## Common Tasks

### Adding a New Component
1. Create in appropriate folder (`plants/`, `garden/`, `gamification/`)
2. Export from index file if exists
3. Update MEMO.md

### Adding a New Server Action
1. Add to `src/lib/actions/`
2. Follow existing pattern (auth check, error handling)
3. Update types if needed

### Database Changes
1. Update `src/types/database.ts` with new types
2. Regenerate `src/types/supabase.ts` if schema changed
3. Document in DECISIONS.md why the change was made

---

## Tech Stack Quick Reference

- **Framework**: Next.js 16 (App Router)
- **UI**: shadcn/ui + Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Animations**: CSS animations + lottie-react
- **State**: Server components + Server actions

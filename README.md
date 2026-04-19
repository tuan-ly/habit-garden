# 🌱 Habit Garden

Habit Garden turns habit-building into a garden game. Each habit is a plant — water it daily (check in), watch it grow over months and years. Consistency creates an ancient tree that no shortcut can replicate; neglect sends plants dormant (not dead) with a warm welcome back waiting.

**Current phase**: Phase 4 — Polish & Launch | **Stack**: Next.js 16, Supabase, Tailwind CSS v4, Capacitor

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, etc.

# Start dev server
npm run dev
# → http://localhost:3000
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.1.1 (App Router, webpack mode) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + shadcn/ui + Radix UI |
| Database | Supabase (PostgreSQL) — Project: `jkhkfsfjnilbfqfatonb` |
| Auth | Supabase Auth (Email + Google OAuth) |
| Payments | Paddle Billing v2 (JS 1.6, Node SDK 3.6) |
| Animations | Framer Motion 12 (modals/transitions only) |
| Forms | react-hook-form + zod 4 |
| Mobile | Capacitor 8 (iOS + Android) |
| PWA | next-pwa 5.6 |
| Unit Tests | Vitest 3.2 |
| E2E Tests | Playwright 1.58 |
| Storybook | 8.6 |

---

## Project Structure

```
src/
├── app/              # Next.js App Router
│   ├── (auth)/       # Login, signup
│   ├── (dashboard)/  # Main app (garden, stats, profile, settings)
│   └── api/          # Webhooks (Paddle), cron (moisture decay)
├── components/
│   ├── garden/       # Isometric garden (Canvas rendering)
│   ├── plants/       # Plant cards, watering modal, detail sheet
│   ├── goals/        # Goal tracking UI (PRO)
│   ├── game-ui/      # HUD, navigation, level-up modal
│   ├── gamification/ # XP, achievements, stats
│   ├── identity/     # Identity system (PREMIUM)
│   ├── crafting/     # Crafting workshop
│   └── dev/          # Dev debug panel (Ctrl+Shift+D)
├── lib/
│   ├── actions/      # ALL mutations — Server Actions only
│   ├── context/      # React contexts (Plants, Mood, Subscription…)
│   ├── hooks/        # Custom hooks
│   └── __tests__/    # Vitest unit tests
└── types/
    └── database.ts   # Supabase table types
```

---

## Documentation

| Topic | File |
|-------|------|
| Product vision, tiers, metrics | [`docs/project-overview-pdr.md`](docs/project-overview-pdr.md) |
| Codebase map (dirs, key files) | [`docs/codebase-summary.md`](docs/codebase-summary.md) |
| Coding conventions & rules | [`docs/code-standards.md`](docs/code-standards.md) |
| System architecture & data flow | [`docs/system-architecture.md`](docs/system-architecture.md) |
| Roadmap (done + upcoming) | [`docs/project-roadmap.md`](docs/project-roadmap.md) |
| Deployment (Vercel, Supabase, Paddle, mobile) | [`docs/deployment-guide.md`](docs/deployment-guide.md) |
| Visual & UX guidelines | [`docs/design-guidelines.md`](docs/design-guidelines.md) |
| AI context (current sprint) | [`.claude/MEMO.md`](.claude/MEMO.md) |
| Architecture decisions | [`.claude/DECISIONS.md`](.claude/DECISIONS.md) |

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Dev server (localhost:3000) |
| `npm run build` | Production build |
| `npm run build:mobile` | Build + Capacitor sync (mobile) |
| `npm test` | Vitest watch |
| `npm run test:run` | Vitest single pass (CI) |
| `npm run test:coverage` | Vitest with coverage |
| `npm run e2e` | Playwright e2e tests |
| `npm run storybook` | Storybook (localhost:6006) |
| `npm run lint` | ESLint |
| `npm run generate-icons` | Regenerate PWA icons |

---

## Key Conventions

- **All mutations via Server Actions** (`src/lib/actions/`) — never call Supabase from components
- **Always use `getAuthUser()`** from `lib/auth-cached.ts` — never `auth.getUser()` directly
- **Canvas-first rendering** for the garden — no DOM animations on tiles/plants
- **RLS on every table** — always verify ownership before writes
- See [`docs/code-standards.md`](docs/code-standards.md) for the full ruleset

---

## Subscription Tiers

| | FREE | PRO ($4.99/mo) | PREMIUM ($9.99/mo) |
|--|:--:|:--:|:--:|
| Plants | 3 | 8 | Unlimited |
| Goals | — | ✅ | ✅ |
| Identity | — | Zones | Full dashboard |
| Garden Neighbors | — | — | ✅ |
| Annual | — | $47.99/yr | $95.99/yr |

---

## License

Private / All rights reserved — Habit Garden (Habien v3)

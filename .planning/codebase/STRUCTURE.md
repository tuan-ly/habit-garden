# Structure — Habit Garden

**Mapped:** 2026-04-28

## Directory Layout

```
src/
├── app/
│   ├── (dashboard)/          # Protected routes (layout with providers)
│   │   ├── garden/           # Main garden view
│   │   ├── overview/         # Stats dashboard
│   │   ├── store/            # Crafting + shop
│   │   ├── profile/          # User profile
│   │   ├── settings/         # Account settings
│   │   ├── identity/         # Identity system (Premium)
│   │   ├── stats/            # Weekly stats
│   │   ├── layout.tsx        # Dashboard layout (provider tree)
│   │   └── providers.tsx     # Provider composition
│   ├── (auth)/               # Public auth routes
│   │   ├── login/
│   │   └── signup/
│   ├── api/
│   │   ├── cron/             # Cron endpoints
│   │   └── webhooks/         # Paddle webhooks
│   └── page.tsx              # Landing page
├── components/
│   ├── garden/               # Isometric garden, tiles, zoom, decorations
│   ├── plants/               # Plant visual, cards, dialogs, watering modal
│   ├── goals/                # Goal tracking UI
│   ├── game-ui/              # HUD, nav, mood selector, level-up modal
│   ├── gamification/         # XP, achievements UI
│   ├── identity/             # Identity system UI (Premium)
│   ├── inventory/            # Inventory panel
│   ├── crafting/             # Crafting workshop
│   ├── shop/                 # Coin shop
│   ├── landing/              # Landing page sections
│   ├── settings/             # Settings sections
│   ├── mood/                 # Mood selector
│   ├── onboarding/           # Onboarding flow
│   ├── profile/              # Profile page components
│   ├── dev/                  # Dev debug panel (Ctrl+Shift+D)
│   └── ui/                   # shadcn/ui components
├── lib/
│   ├── actions/              # Server actions (16 files)
│   ├── context/              # React contexts (plants, subscription, mood, etc.)
│   ├── hooks/                # Custom hooks
│   ├── __tests__/            # Unit tests (Vitest)
│   ├── auth-cached.ts        # Cached auth helper
│   ├── plant-status.ts       # Client-side status computation
│   ├── progression-system.ts # XP, levels, tiers
│   ├── subscription-limits.ts # Tier limits + gates
│   ├── supabase/             # Supabase client setup
│   └── xp-system.ts          # XP calculation
├── types/
│   └── database.ts           # TypeScript types for all tables
└── styles/
    └── globals.css           # Tailwind imports + custom styles

public/
├── plants/                   # Plant PNG images (by type/stage)
└── icons/                    # PWA icons

supabase/
└── migrations/               # SQL migration files

.storybook/                   # Storybook config
specs/                        # Product specs (product.md, rules.md)
```

## Key Files

| File | Lines (approx) | Purpose |
|------|----------------|---------|
| `src/lib/actions/activity.ts` | ~500 | Core activity logging + XP + coins + harvest |
| `src/lib/actions/plants.ts` | ~600 | Plant CRUD + watering + growth |
| `src/lib/actions/goals.ts` | ~700 | Goal system with adaptive |
| `src/lib/progression-system.ts` | ~400 | Tier/level/unlock definitions |
| `src/lib/subscription-limits.ts` | ~300 | All tier limit configs |
| `src/components/garden/isometric-garden.tsx` | ~500 | Main garden canvas |
| `src/components/plants/gentle-watering-modal.tsx` | ~400 | Core interaction modal |
| `src/types/database.ts` | ~500 | All TypeScript types |

## Naming Conventions

- **Components:** PascalCase files (`gentle-watering-modal.tsx` → `GentleWateringModal`)
- **Actions:** camelCase functions in kebab-case files
- **Types:** PascalCase interfaces in `database.ts`
- **Migrations:** `YYYYMMDD_description.sql`
- **Tests:** `*.test.ts` in `src/lib/__tests__/`
- **Stories:** `*.stories.tsx` in `__stories__/` subdirs

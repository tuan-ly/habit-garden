# Project Map

## Product

Habit Garden turns habit building into a garden game. A habit is represented by a plant; check-ins water the plant, goal logs grow it, and long-term consistency unlocks stronger visual states and progression.

The app language is English. The repo also contains planning docs and Vietnamese creator notes, but production UI should stay English unless a feature explicitly localizes copy.

## Stack

- Framework: Next.js 16 App Router with React 19 and TypeScript.
- Styling: Tailwind CSS v4, shadcn/Radix primitives, custom game UI components.
- Data/auth: Supabase Postgres, Supabase Auth, RLS, server-side clients via `@supabase/ssr`.
- Monetization: Paddle Billing with webhook handling.
- Mobile: Capacitor for iOS and Android.
- Verification: Vitest, Playwright, Storybook, ESLint, Next build.

## Directory Map

- `src/app/` - App Router routes, route groups, layouts, API routes, auth callback.
- `src/app/(dashboard)/` - authenticated app shell and dashboard pages.
- `src/components/garden/` - isometric garden, canvas layers, interactions, edit mode, weather, zoom.
- `src/components/plants/` - plant cards, detail sheet, watering, add plant, visuals.
- `src/components/goals/` - goal setup, logging, charts, adaptive suggestions, progress UI.
- `src/components/game-ui/` - HUD, nav, level-up, upgrade modal, welcome-back flow.
- `src/components/ui/` - reusable Radix/shadcn-style primitives.
- `src/lib/actions/` - server actions and all database writes.
- `src/lib/context/` - client context providers hydrated from server data.
- `src/lib/hooks/` - reusable UI hooks for garden and viewport behavior.
- `src/lib/utils/` - grid positioning, level/progression helpers, general utilities.
- `src/types/` - handwritten Supabase/domain types.
- `supabase/migrations/` - schema and database function migrations.
- `docs/` - product, architecture, UX, design, deployment, and this OpenWiki.
- `plans/` - feature plans, audits, research, and phase notes.

## Core Conventions

- All mutations go through server actions in `src/lib/actions/`.
- Components never call Supabase directly for writes.
- Use `getAuthUser()` from `src/lib/auth-cached.ts` in server-side auth checks.
- Prefer explicit Supabase column lists over `select('*')`.
- The garden is canvas-first; avoid DOM-heavy animation for tiles, plants, particles, and weather.
- Keep plant status semantics gentle: `dead` and `dormant` are legacy compatibility states; new UI should think in `sleeping` and `resting`.

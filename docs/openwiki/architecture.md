# Architecture

## Shape

Habit Garden is a Next.js App Router app deployed as a web app/PWA and wrapped by Capacitor for mobile. Supabase owns auth, Postgres data, RLS, and scheduled database behavior. Paddle owns subscription events, which are consumed by a Next.js API route.

## App Router

- Public routes live under root pages such as `/`, `/pricing`, `/privacy`, `/terms`, and `/refund`.
- Auth routes live in `src/app/(auth)/`.
- Authenticated product routes live in `src/app/(dashboard)/`.
- API routes live in `src/app/api/`, including Paddle webhooks and admin/cron utilities.

Server components fetch initial dashboard data. Client providers hydrate from that data so pages avoid immediate duplicate fetches after load.

## Provider Tree

The authenticated dashboard wraps children with `DashboardProviders` in `src/app/(dashboard)/providers.tsx`.

Current order:

1. `DevDebugProvider`
2. `DashboardDataProvider`
3. `SubscriptionProvider`
4. `MoodProvider`
5. `GardenSettingsProvider`
6. `InventoryProvider`

`PlantsProvider` is page-local for the garden page, not part of the global dashboard provider tree. The garden page fetches plants on the server, then hydrates plant state through `src/lib/context/plants-context.tsx`.

## Supabase Boundary

Server-side Supabase clients are created in `src/lib/supabase/server.ts`. Server actions authenticate through `getAuthUser()` in `src/lib/auth-cached.ts`.

Client code can consume hydrated context and call server actions, but direct Supabase writes from components are outside the architecture contract.

## Mobile And PWA

Capacitor config is in `capacitor.config.ts`; platform projects live under `ios/` and `android/`. PWA config and icons live under `next.config.ts`, `public/manifest.json`, and `public/icons/`.

## Scheduled Work

Daily moisture decay primarily belongs in Supabase migrations/functions. The Next.js cron/admin API is a backup or utility path; do not put ordinary user-facing mutation logic there.

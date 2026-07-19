# Integrations — Habit Garden

**Mapped:** 2026-04-28

## Supabase (Primary Backend)

- **Auth:** Email/password signup, OAuth callback, session management via `@supabase/ssr`
- **Database:** PostgreSQL with 20+ tables, RLS policies on all tables
- **Cron:** `update_daily_moisture()` runs at 17:00 UTC daily
- **Atomic RPCs:** `award_coins`, `spend_coins`, `craft_decoration`, `purchase_decoration`, `pickup_decoration`, `increment_user_xp`, `increment_weed_count`, `atomic_inventory_increment/decrement`
- **Auth wrapper:** `getAuthUser()` from `src/lib/auth-cached.ts` uses `React.cache()` to deduplicate per-request

## Paddle (Payments)

- **Webhook endpoint:** `/api/webhooks/paddle` with signature verification
- **Events handled:** subscription created/activated/updated/canceled/paused/resumed, transaction completed/failed
- **Client SDK:** Checkout overlay integration
- **Tiers:** Free, Pro ($4.99/mo), Premium ($9.99/mo)

## Cron / Scheduled Jobs

- **Moisture decay:** `/api/cron/moisture-decay` — Next.js route backup for Supabase cron
- **Auth:** Vercel cron secret via `CRON_SECRET` env var

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN
PADDLE_API_KEY
PADDLE_WEBHOOK_SECRET
NEXT_PUBLIC_PADDLE_ENVIRONMENT
NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID
NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID
NEXT_PUBLIC_PADDLE_PREMIUM_MONTHLY_PRICE_ID
NEXT_PUBLIC_PADDLE_PREMIUM_YEARLY_PRICE_ID
```

## No External Integrations Yet

- No analytics SDK
- No error tracking (Sentry etc.)
- No push notification service
- No CDN for images (using `public/` directory)
- No AI/ML integrations

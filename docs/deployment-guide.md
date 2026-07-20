# Habit Garden — Deployment Guide

> **Purpose**: Everything needed to deploy Habit Garden to production — Vercel, Supabase, Paddle, env vars, and mobile builds.
> **Last updated**: 2026-07-20

---

## 1. Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (ID: `jkhkfsfjnilbfqfatonb`)
- A [Vercel](https://vercel.com) account + project
- A [Paddle](https://paddle.com) account (Billing v2)
- (Mobile) macOS + Xcode 15+ for iOS; Android Studio for Android
- (Mobile) CocoaPods: `sudo gem install cocoapods`

---

## 2. Environment Variables

Create `.env.local` for local development. In Vercel, set these under **Project Settings → Environment Variables**.

```env
# ── Supabase ──────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://jkhkfsfjnilbfqfatonb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from Supabase dashboard>
SUPABASE_SERVICE_ROLE_KEY=<service role key — server-side only>

# ── Cron Security ─────────────────────────────────────
# Secret that Vercel Cron passes as Authorization: Bearer <secret>
CRON_SECRET=<random secure string>

# ── Paddle Billing ────────────────────────────────────
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_xxx        # client-side
PADDLE_API_KEY=pdl_xxx                          # server-side only
PADDLE_WEBHOOK_SECRET=pdl_ntfsec_xxx            # webhook signature
NEXT_PUBLIC_PADDLE_ENVIRONMENT=sandbox          # 'sandbox' or 'production'

# Paddle Price IDs (from Paddle dashboard)
NEXT_PUBLIC_PADDLE_PRO_MONTHLY_PRICE_ID=pri_xxx
NEXT_PUBLIC_PADDLE_PRO_YEARLY_PRICE_ID=pri_xxx
NEXT_PUBLIC_PADDLE_PREMIUM_MONTHLY_PRICE_ID=pri_xxx
NEXT_PUBLIC_PADDLE_PREMIUM_YEARLY_PRICE_ID=pri_xxx
```

> **Security**: `SUPABASE_SERVICE_ROLE_KEY` and `PADDLE_API_KEY` must never be exposed client-side. Only `NEXT_PUBLIC_*` variables are safe to use in browser code.

---

## 3. Supabase Setup

### 3.1 Database Migrations

The migration files in `supabase/migrations/` and the linked project's migration
ledger are the canonical database history. Before deploying, verify that both
sides are aligned and replay the chain locally:

```bash
npx supabase migration list --linked
npx supabase db reset --local --no-seed
npx supabase db push --linked --dry-run
npx supabase db push --linked
```

Create every new schema change through the CLI so it receives a unique
14-digit timestamp:

```bash
npx supabase migration new descriptive_change_name
```

Migration order matters — files are named
`YYYYMMDDHHMMSS_description.sql`. Do not rename or combine applied migrations.

> **Guardrail**: Do not change the production schema through the Dashboard SQL
> Editor. `migration repair` only changes ledger metadata and is allowed only
> after verifying that the corresponding SQL state already exists. Never run
> `supabase db reset --linked` against production.

### 3.2 Cron Job

The moisture decay function is scheduled via Supabase `pg_cron`. Verify it exists:

```sql
SELECT * FROM cron.job WHERE jobname = 'update-moisture';
```

If missing, re-create:

```sql
SELECT cron.schedule(
  'update-moisture',
  '0 17 * * *',   -- 17:00 UTC = 00:00 Vietnam time
  'SELECT update_daily_moisture()'
);
```

### 3.3 RLS Policies

After any new table migration, check RLS is enabled:

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' ORDER BY tablename;
```

All `rowsecurity` values should be `true`.

---

## 4. Vercel Deployment

### 4.1 Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

Or connect the GitHub repo in the Vercel dashboard for automatic deployments on push to `main`.

### 4.2 Build Command

```
next build --webpack
```

> **Note**: `--webpack` is required (Turbopack is not used). Set this in Vercel Project Settings → Build & Output Settings if auto-detected incorrectly.

### 4.3 Vercel Cron (Backup)

Add to `vercel.json` (or Vercel dashboard under Cron Jobs):

```json
{
  "crons": [
    {
      "path": "/api/cron/moisture-decay",
      "schedule": "0 17 * * *"
    }
  ]
}
```

The route validates `Authorization: Bearer {CRON_SECRET}` and returns 401 without it.

---

## 5. Paddle Webhook Setup

1. In Paddle dashboard → **Notifications → New Endpoint**
2. URL: `https://your-domain.com/api/webhooks/paddle`
3. Events to subscribe:
   - `subscription.created`
   - `subscription.updated`
   - `subscription.canceled`
   - `transaction.completed`
4. Copy the **Webhook Secret** → set as `PADDLE_WEBHOOK_SECRET` env var

The webhook handler at `src/app/api/webhooks/paddle/route.ts` verifies the signature before processing any event.

---

## 6. Mobile Build (Capacitor)

Capacitor 8 packages the Next.js static export as a native iOS/Android app.

### 6.1 First-Time Setup

```bash
# Install dependencies
npm install

# iOS only — install CocoaPods dependencies
cd ios/App && pod install && cd ../..
```

### 6.2 Build Web Assets

```bash
# Build static export + sync to native projects
npm run build:mobile
# Equivalent to: next build --webpack && npx cap sync
```

> **Required**: `next.config.ts` must have `output: 'export'` enabled for mobile builds. White screen = this is missing.

### 6.3 Run on Device

**iOS (macOS only)**:
```bash
npx cap open ios
# Opens Xcode → select device/simulator → Build & Run (⌘R)
```

**Android**:
```bash
npx cap open android
# Opens Android Studio → select device → Run (▶)
```

### 6.4 Production Builds

**Android APK/AAB**:
```bash
npm run build:mobile
npx cap sync android
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/
# AAB: cd android && ./gradlew bundleRelease
```

**iOS IPA**:
1. `npx cap open ios`
2. Xcode → Product → Archive
3. Distribute App → App Store Connect (or Ad Hoc)

### 6.5 Live Reload for Development

Edit `capacitor.config.ts`:
```typescript
server: {
  url: 'http://192.168.x.x:3000',  // your dev machine IP
  cleartext: true
}
```

Then:
```bash
npm run dev                    # start Next.js dev server
npx cap run android            # or ios
```

> Remember to revert `capacitor.config.ts` before building for production.

### 6.6 Troubleshooting

| Symptom | Fix |
|---------|-----|
| White screen on mobile | Ensure `output: 'export'` in `next.config.ts` |
| API errors on device | Update Supabase URL to production (not localhost) |
| Build fails | Run `npx cap sync` after any web asset change |
| iOS CocoaPods issues | `cd ios/App && pod install --repo-update` |

---

## 7. Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
# → http://localhost:3000

# Run unit tests (Vitest)
npm test

# Run tests (single pass, CI mode)
npm run test:run

# Run e2e tests (Playwright)
npm run e2e

# Open Storybook
npm run storybook
# → http://localhost:6006

# Analyze bundle
ANALYZE=true npm run build
```

---

## 8. Scripts Reference

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server (webpack mode) |
| `npm run build` | Production build |
| `npm run build:mobile` | Build + Capacitor sync for mobile |
| `npm run start` | Serve production build locally |
| `npm run lint` | ESLint |
| `npm test` | Vitest watch mode |
| `npm run test:run` | Vitest single pass (CI) |
| `npm run test:coverage` | Vitest with coverage report |
| `npm run e2e` | Playwright e2e tests |
| `npm run storybook` | Storybook dev server |
| `npm run generate-icons` | Regenerate PWA icons |

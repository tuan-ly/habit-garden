# Stack — Habit Garden

**Mapped:** 2026-04-28

## Runtime & Language

- **Runtime:** Node.js (via Next.js)
- **Language:** TypeScript 5
- **React:** 19.2.3 (with React Compiler via `babel-plugin-react-compiler`)

## Framework

- **Next.js 16.1.1** — App Router, Server Components, Server Actions
- **Build:** webpack mode (`next dev --webpack`, `next build --webpack`)

## UI & Styling

- **Tailwind CSS 4** (with `@tailwindcss/postcss`)
- **shadcn/ui** — Radix UI primitives (dialog, dropdown, tabs, tooltip, slider, etc.)
- **Framer Motion 12** — animations
- **Lucide React** — icons
- **next-themes** — dark mode
- **sonner** — toast notifications
- **class-variance-authority + clsx + tailwind-merge** — className utilities

## Backend & Data

- **Supabase** — Postgres database + Auth + RLS + Edge Functions
  - `@supabase/supabase-js` 2.90.1
  - `@supabase/ssr` 0.8.0
  - Project ID: `jkhkfsfjnilbfqfatonb`

## Payments

- **Paddle** — subscription billing
  - `@paddle/paddle-js` 1.6.1 (client)
  - `@paddle/paddle-node-sdk` 3.6.0 (server)

## Forms & Validation

- **react-hook-form** 7 + `@hookform/resolvers`
- **zod** 4 — schema validation

## Mobile

- **Capacitor 8** — Android + iOS hybrid app
  - Haptics, Splash Screen, Status Bar plugins
- **next-pwa** — PWA support

## Testing

- **Vitest** 3.2 — unit tests (with `@vitest/ui`, `@vitest/coverage-v8`)
- **Testing Library** — React + jest-dom
- **jsdom** — DOM environment
- **Playwright** 1.58 — E2E tests
- **Storybook** 8.6 — component stories (React Vite framework)

## Dev Tools

- **ESLint 9** + `eslint-config-next`
- **Sharp** — image processing
- **@next/bundle-analyzer** — bundle analysis

## Configuration Files

- `next.config.ts` — Next.js config
- `vitest.config.ts` — test config
- `tailwind.config.ts` — Tailwind (v4)
- `.storybook/` — Storybook config
- `capacitor.config.ts` — mobile config

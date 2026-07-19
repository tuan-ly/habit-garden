# Testing — Habit Garden

**Mapped:** 2026-04-28

## Framework

- **Vitest 3.2** — unit testing
- **Testing Library** — React component tests
- **jsdom** — DOM environment
- **Playwright** — E2E tests (configured, scripts available)
- **Storybook 8.6** — visual component testing

## Test Files

Located in `src/lib/__tests__/`:

| File | Tests | Domain |
|------|-------|--------|
| `progression-system.test.ts` | ~82 | Tiers, levels, unlocks, XP |
| `xp-system.test.ts` | ~71 | XP calculations, bonuses |
| `subscription-limits.test.ts` | ~36 | Tier limits, feature gates |
| `watering-logic.test.ts` | ~13 | Watering calculations |

**Total:** ~202 tests, all passing as of 2026-03-12

## Coverage

- **Strong:** Progression system, XP system, subscription limits
- **Missing:** Server actions (no mocked Supabase tests), components (no render tests), E2E flows
- No CI-enforced coverage threshold

## Scripts

```bash
npm test           # Vitest watch mode
npm run test:run   # Single run
npm run test:ui    # Vitest UI
npm run test:coverage  # Coverage report
npm run e2e        # Playwright tests
npm run storybook  # Component stories
```

## Storybook Stories

3 story files:
- `src/components/ui/__stories__/TierBadge.stories.tsx`
- `src/components/garden/__stories__/SlotIndicator.stories.tsx`
- `src/components/plants/__stories__/PlantVisual.stories.tsx`

## Mocking

- No Supabase mock setup
- Tests focus on pure business logic (no I/O)
- Component tests would need Supabase mock + context wrappers

## CI/CD

- No GitHub Actions workflow configured
- Tests run locally only
- Vercel deployment (implied by Next.js + `.npmrc` with `legacy-peer-deps`)

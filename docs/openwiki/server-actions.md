# Server Actions

## Boundary

Server actions are the mutation boundary for Habit Garden. They live in `src/lib/actions/` and should be the only place where user-facing data writes happen.

This is the **Server Actions Boundary** pattern: client components express user intent, server actions authenticate, authorize, mutate, and return a small result.

## Required Pattern

Every write action should:

1. create a Supabase server client
2. call `getAuthUser()`
3. return unauthorized/not-authenticated when missing
4. verify ownership for user-owned records
5. query explicit columns
6. check and return errors
7. perform side effects such as XP, coins, achievements, or revalidation deliberately

## Important Files

- `plants.ts` - plant reads, creation, watering, movement, lifecycle writes.
- `goals.ts` - goal creation, goal logs, period stats.
- `mood.ts` - mood logs and derived mood state.
- `inventory.ts`, `crafting.ts`, `decorations.ts` - economy/customization.
- `subscription.ts`, `paddle.ts` - subscription state and billing integration.
- `profile.ts`, `identity.ts`, `journal.ts`, `activity.ts` - user and habit-supporting domains.
- `weeds.ts` - compatibility-only; avoid adding new feature logic.

## Auth Helper

Use:

```ts
import { getAuthUser } from '@/lib/auth-cached'
const user = await getAuthUser()
```

Do not call `supabase.auth.getUser()` directly in ordinary action code. The helper uses React cache to deduplicate auth reads inside a request.

## Component Rule

Components may call server actions, but they must not perform Supabase writes directly. If a component needs optimistic behavior, put that behavior in the relevant context provider and let the provider call the server action.

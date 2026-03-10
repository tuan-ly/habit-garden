# Server Actions Rules

Path: `src/lib/actions/`

## Auth

- Always use `getAuthUser()` from `@/lib/auth-cached` — NEVER call `auth.getUser()` directly.
- Always check ownership before any write: verify `user.id === record.user_id`.
- Never hardcode user IDs.

## Supabase Queries

- Never use `select('*')` — always specify columns explicitly.
- Check for errors on every query (`if (error) { ... }`).

## Ownership Check Pattern

```typescript
const user = await getAuthUser()
if (!user) return { error: 'Unauthorized' }

const { data: record } = await supabase
  .from('table')
  .select('id, user_id')
  .eq('id', recordId)
  .single()

if (!record || record.user_id !== user.id) return { error: 'Not found' }
```

## Action Files

| File | Purpose |
|------|---------|
| `plants.ts` | Plant CRUD, watering, growth |
| `goals.ts` | Goal creation and tracking |
| `activity.ts` | Unified activity logging (all plant actions) |
| `adaptive.ts` | Adaptive goal adjustments |
| `identity.ts` | Identity system (PREMIUM) |
| `journal.ts` | Journal/reflection entries |
| `mood.ts` | Daily mood logging |
| `paddle.ts` | Paddle subscription webhooks |
| `subscription.ts` | Subscription tier management |
| `profile.ts` | User profile updates |
| `weeds.ts` | **DB compat only — DO NOT add UI or new logic** |

## weeds.ts

`weeds.ts` is kept solely for database compatibility. The weed system UI was removed in 2026-03.
Do not add any new functionality, UI, or references to weed features.

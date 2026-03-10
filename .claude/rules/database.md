# Database / Supabase Rules

Path: `src/types/`, `supabase/`

## Project

- **Project ID**: `jkhkfsfjnilbfqfatonb`
- **Subscription tiers**: `free`, `pro`, `premium`

## Main Tables

| Table | Notes |
|-------|-------|
| `plants` | Core plant data: status, moisture, growth |
| `plant_types` | Plant type definitions |
| `goals` | PRO feature — build capacity / total progress |
| `goal_logs` | Goal log entries |
| `profiles` | User profile, XP, level |
| `watering_logs` | Log of watering events |
| `mood_logs` | Daily mood entries |
| `achievements` | Achievement definitions and unlocks |
| `activity_logs` | Unified log for all plant activity |
| `reflections` | Journal/reflection entries |
| `identities` | PREMIUM identity system |
| `subscriptions` | Paddle subscription state |

## Key plants Columns

```sql
plants.status            -- see plants-status.md
plants.current_moisture  -- 0-100, decays daily via cron
plants.growth_percentage -- 0-100, increases on water/log
plants.weed_count        -- DEPRECATED, do not use in UI
```

## Rules

- Always enable **RLS policies** on any new table.
- Never hardcode user IDs — always retrieve from auth (`getAuthUser()`).
- Never use `select('*')` — specify columns explicitly.
- Test RLS policies before shipping a migration.

## Migrations

- Location: `supabase/migrations/`
- Filename format: `YYYYMMDD_description.sql`
- Example: `20260310_add_reflection_mood_column.sql`
- Use `apply_migration` tool for DDL; use `execute_sql` for data-only queries.

## Cron Jobs

| Job | Schedule | Purpose |
|-----|----------|---------|
| `update_daily_moisture()` | 17:00 UTC daily | Moisture decay for all living plants |
| `/api/cron/moisture-decay` | Same time | Next.js backup/override route |

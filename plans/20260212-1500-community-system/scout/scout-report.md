# Scout Report: Community System Integration

## User Profiles & Authentication

| File | Purpose |
|------|---------|
| `src/lib/actions/profile.ts` | User profile CRUD, XP sync, stats |
| `src/lib/actions/subscription.ts` | Tier checks, feature gates, plan limits |
| `src/lib/actions/identity.ts` | Identity grouping (PREMIUM) |
| `src/types/database.ts` | All database types including Profile |
| `src/lib/context/subscription-context.tsx` | Subscription tier React context |

**Profile Table Fields**: `id, username, display_name, avatar_url, xp, level, subscription_tier, subscription_status`

## XP & Gamification System

| File | Purpose |
|------|---------|
| `src/lib/xp-system.ts` | Level calc (100→150→225 XP scaling), titles, rewards |
| `src/lib/progression-system.ts` | Tier unlocks, slot limits, user phases, garden size |
| `src/lib/achievements.ts` | 40+ achievements, 4 tiers, progress tracking |
| `src/lib/xp-constants.ts` | XP reward values |

**XP Rewards**: Water 10 XP, streaks 5-50 XP, achievements 25-200 XP
**Level Cap**: Subscription-based (FREE: 10, PRO: 15, PREMIUM: 20+)

## Server Actions Pattern

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function actionName(): Promise<T> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fallback

  const { data, error } = await supabase
    .from('table').select('*').eq('user_id', user.id)

  revalidatePath('/path')
  return data
}
```

## Database Schema (Recent Migrations)

| Migration | Content |
|-----------|---------|
| `20260212_identity_system.sql` | Identity table, goal linking |
| `20260211_subscription_infrastructure.sql` | Tiers, events, prompts tables |
| `20260206_habien_2_0_phase_1.sql` | Tier system, progression |

## Key Types

- **SubscriptionTier**: `free | pro | premium`
- **UserPhase**: `seedling | gardener | sage`
- **ActivityType**: `watering | completed | progress | rest_day | reflection`

## Integration Points for Community

1. **Leaderboards**: Use `profiles.xp`, `profiles.level` for rankings
2. **Friends**: New table referencing `profiles.id`
3. **Activity Feed**: Join with `activity_logs`, `plants`, `achievements`
4. **Feature Gates**: Extend `subscription-limits.ts` for social features
5. **RLS**: Follow existing pattern with `auth.uid() = user_id`

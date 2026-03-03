# Next.js 16 + Supabase Performance Optimization Research
**Date:** 2026-03-03 | **Focus:** Auth dedup, server data fetching, caching, indexing

---

## 1. AUTH SESSION DEDUPLICATION

### Problem
Multiple `getUser()` calls per request duplicate Supabase auth lookups, multiplying latency.

### Solution Pattern: React.cache()
```typescript
// lib/auth.ts
import { cache } from 'react';
import { createClient } from '@supabase/ssr';

export const getUser = cache(async () => {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});
```
**Why:** React.cache() deduplicates async calls within single request. Same user object returned to all consumers (getUser called once per request, not per component).

### Middleware-level Session (Optional)
For auth state in middleware before component tree:
```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getSetCookie() } }
  );

  const { data: { session } } = await supabase.auth.getSession();
  response.headers.set('x-user-id', session?.user.id || '');
  return response;
}
```
**Trade-off:** Middleware runs on every request. Use only if auth state needed upstream of cache boundaries.

---

## 2. SERVER COMPONENT DATA FETCHING

### Anti-pattern: Waterfall (Sequential)
```typescript
// ❌ Slow - waits for users, then posts, then comments
const user = await supabase.from('users').select().eq('id', id).single();
const posts = await supabase.from('posts').select().eq('user_id', user.id);
const comments = await posts[0] && supabase.from('comments').select().eq('post_id', posts[0].id);
```

### Pattern: Promise.all (Parallel)
```typescript
// ✅ Fast - all queries run concurrently
const [user, posts] = await Promise.all([
  supabase.from('users').select().eq('id', id).single(),
  supabase.from('posts').select().eq('user_id', id).limit(10),
]);
```

### Pattern: Selective Sequential (When Required)
Use only when dependent data truly required:
```typescript
const user = await supabase.from('users').select('id, email').eq('id', id).single();

// Fetch related only if needed by page
if (shouldShowPosts) {
  const posts = await supabase.from('posts').select().eq('user_id', user.id);
}
```

---

## 3. SUPABASE QUERY OPTIMIZATION

### N+1 Prevention: Select Columns
```typescript
// ❌ Fetches all 20 columns per row
const posts = await supabase.from('posts').select();

// ✅ Fetch only needed
const posts = await supabase.from('posts').select('id, title, created_at').limit(50);
```

### Batch Queries
```typescript
// ✅ Single round-trip for multiple queries
const [users, posts, comments] = await Promise.all([
  supabase.from('users').select('id, name').limit(100),
  supabase.from('posts').select('id, user_id').limit(100),
  supabase.from('comments').select('id, post_id').limit(100),
]);
```

### Joins > Multiple Queries
```typescript
// ✅ One query with join, prevents N+1
const posts = await supabase
  .from('posts')
  .select('id, title, users(name, avatar_url)')
  .limit(20);
```

### Limit Results
```typescript
// ✅ Always paginate
const posts = await supabase
  .from('posts')
  .select()
  .order('created_at', { ascending: false })
  .range(0, 24); // 25 items
```

---

## 4. NEXT.JS CACHING STRATEGIES

### Segment-level Caching (Preferred)
```typescript
// app/dashboard/page.tsx
export const revalidate = 3600; // ISR: 1 hour

export default async function Dashboard() {
  const plants = await fetch('...', {
    next: { revalidate: 3600 }
  });
}
```

### React.cache() for Component-level Dedup
```typescript
// lib/data.ts
export const getPlants = cache(async (userId: string) => {
  return supabase
    .from('plants')
    .select()
    .eq('user_id', userId);
});
```
**Used in:** Multiple components, data fetched once per request.

### unstable_cache for Cross-request Cache
```typescript
// ⚠️ Experimental in Next.js 16
import { unstable_cache } from 'next/cache';

export const getCachedPlants = unstable_cache(
  async (userId) => {
    return supabase
      .from('plants')
      .select()
      .eq('user_id', userId);
  },
  ['plants'], // cache key tags
  { revalidate: 300 } // 5 min
);
```
**Status:** Use `revalidate` + `revalidatePath()` instead (more stable).

### Revalidation Triggers
```typescript
// lib/actions/plant.ts (Server Action)
'use server';
import { revalidatePath } from 'next/cache';

export async function waterPlant(plantId: string) {
  await supabase.from('plants').update({ last_watered: new Date() }).eq('id', plantId);
  revalidatePath('/dashboard'); // Invalidate cached data
}
```

---

## 5. DATABASE INDEXING FOR SUPABASE + RLS

### Critical Missing Indexes
| Scenario | Index | SQL |
|----------|-------|-----|
| Filter by user_id | `plants (user_id)` | `CREATE INDEX idx_plants_user_id ON plants(user_id);` |
| Sort by date | `plants (user_id, created_at DESC)` | Composite for common queries |
| RLS auth checks | `profiles (auth.uid())` | N/A - Supabase auto-indexes |

### RLS Performance Impact
**Without indexes:** RLS policies on unindexed columns cause **sequential scans** (O(n)).
**With indexes:** RLS now uses index seeks (O(log n)).

```sql
-- ✅ Enable RLS with indexed filters
ALTER TABLE plants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_plants" ON plants
  FOR SELECT USING (auth.uid() = user_id);

-- Index on user_id so policy doesn't scan all rows
CREATE INDEX idx_plants_user_id ON plants(user_id);
```

### Composite Indexes for Common Patterns
```sql
-- ✅ Handles filtering + sorting in one pass
CREATE INDEX idx_plants_user_created
ON plants(user_id, created_at DESC)
WHERE deleted_at IS NULL; -- Partial index
```

### Query Analysis
```sql
-- Check if index used
EXPLAIN ANALYZE
SELECT * FROM plants WHERE user_id = 'uuid' ORDER BY created_at DESC;

-- Look for "Index Scan" not "Seq Scan"
```

---

## ACTIONABLE CHECKLIST

- [ ] Wrap `getUser()` and `getSession()` in `React.cache()`
- [ ] Audit all data fetches: move to `Promise.all()` where possible
- [ ] Review critical queries: add explicit `.select('col1, col2, ...')`
- [ ] Implement `.limit()` on list endpoints (no unbounded queries)
- [ ] Add `revalidate` to page exports for ISR
- [ ] Use `revalidatePath()` in server actions after mutations
- [ ] Check Supabase table indexes: ensure `(user_id)` indexed
- [ ] Profile RLS policies with EXPLAIN ANALYZE
- [ ] Test N+1 with DevTools Network tab: expect 1-2 requests, not N

---

## UNRESOLVED QUESTIONS

1. **unstable_cache trade-offs:** Stability vs benefit—Vercel recommends avoiding until stable in Next.js 17?
2. **Batch query limits:** Does Supabase have limits on concurrent requests per connection?
3. **RLS + Composite indexes:** Any gotchas with partial indexes + RLS predicates?

# Phase 03: Leaderboards - Ranking System

## Context

- [plan.md](plan.md) - Overview
- [phase-01-foundation.md](phase-01-foundation.md) - Database foundation
- [researcher-01-social-features.md](research/researcher-01-social-features.md) - Anti-gaming patterns

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-12 |
| Priority | P1 - High |
| Status | Pending |
| Estimate | 2-3 days |
| Dependencies | Phase 01, 02 complete |

Implement weekly/monthly leaderboards with friend filtering and anti-gaming measures.

---

## Requirements

### Core Features

1. **Weekly Leaderboard** - Resets every Monday
2. **Monthly Leaderboard** - Resets on 1st of month
3. **Global Rankings** - All users (opt-in)
4. **Friends Rankings** - Only friends
5. **Anti-Gaming** - Detect suspicious activity

### Scoring System

Primary: XP earned in period
Tiebreakers:
1. Streak days maintained
2. Habits completed
3. Earlier join date (favor veterans)

### Tier Access

| Tier | Access |
|------|--------|
| FREE | Read-only, no filters |
| PRO | Full access, friend filter |
| PREMIUM | Full + custom filters |

---

## Architecture

### Database Schema

```sql
-- Leaderboard snapshots (updated hourly/daily via cron)
CREATE TABLE leaderboard_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'monthly')),
  period_key TEXT NOT NULL, -- 'weekly_2026_w07', 'monthly_2026_02'
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rank INTEGER,
  xp_earned INTEGER DEFAULT 0,
  habits_completed INTEGER DEFAULT 0,
  streak_days INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period_type, period_key, user_id)
);

-- Anti-gaming flags
CREATE TABLE leaderboard_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('burst_xp', 'impossible_streak', 'suspicious_pattern', 'manual_review')),
  xp_delta INTEGER,
  details JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'cleared', 'confirmed')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User leaderboard preferences
ALTER TABLE privacy_settings ADD COLUMN IF NOT EXISTS
  leaderboard_opt_in BOOLEAN DEFAULT true;

-- Indexes
CREATE INDEX idx_leaderboard_period ON leaderboard_snapshots(period_type, period_key);
CREATE INDEX idx_leaderboard_rank ON leaderboard_snapshots(period_key, rank);
CREATE INDEX idx_leaderboard_user ON leaderboard_snapshots(user_id);
CREATE INDEX idx_flags_user ON leaderboard_flags(user_id, status);
```

### RLS Policies

```sql
-- Leaderboard snapshots: Users can see if opted in
CREATE POLICY "See leaderboard if opted in"
  ON leaderboard_snapshots FOR SELECT
  USING (
    -- Own data
    user_id = auth.uid()
    OR
    -- Other users who opted in
    EXISTS (
      SELECT 1 FROM privacy_settings ps
      WHERE ps.user_id = leaderboard_snapshots.user_id
      AND ps.show_on_leaderboard = true
    )
  );

-- Flags: Only own flags visible (admins via service role)
CREATE POLICY "Users see own flags"
  ON leaderboard_flags FOR SELECT
  USING (user_id = auth.uid());
```

### Helper Functions

```sql
-- Get current week key
CREATE OR REPLACE FUNCTION get_current_week_key()
RETURNS TEXT AS $$
BEGIN
  RETURN 'weekly_' || to_char(NOW(), 'IYYY') || '_w' || to_char(NOW(), 'IW');
END;
$$ LANGUAGE plpgsql STABLE;

-- Get current month key
CREATE OR REPLACE FUNCTION get_current_month_key()
RETURNS TEXT AS $$
BEGIN
  RETURN 'monthly_' || to_char(NOW(), 'YYYY_MM');
END;
$$ LANGUAGE plpgsql STABLE;

-- Calculate XP earned in period
CREATE OR REPLACE FUNCTION calculate_period_xp(
  uid UUID,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ
) RETURNS INTEGER AS $$
DECLARE
  total_xp INTEGER;
BEGIN
  SELECT COALESCE(SUM(xp_earned), 0) INTO total_xp
  FROM activity_logs
  WHERE user_id = uid
    AND logged_at >= period_start
    AND logged_at < period_end;

  RETURN total_xp;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update leaderboard rankings for a period
CREATE OR REPLACE FUNCTION update_leaderboard_ranks(
  p_period_type TEXT,
  p_period_key TEXT
) RETURNS VOID AS $$
BEGIN
  WITH ranked AS (
    SELECT
      id,
      ROW_NUMBER() OVER (
        ORDER BY xp_earned DESC, streak_days DESC, habits_completed DESC
      ) as new_rank
    FROM leaderboard_snapshots
    WHERE period_type = p_period_type
      AND period_key = p_period_key
      AND NOT is_flagged
  )
  UPDATE leaderboard_snapshots ls
  SET rank = r.new_rank, updated_at = NOW()
  FROM ranked r
  WHERE ls.id = r.id;
END;
$$ LANGUAGE plpgsql;
```

### Anti-Gaming Detection

```sql
-- Detect burst XP (>5x average rate in 1 hour)
CREATE OR REPLACE FUNCTION detect_burst_xp()
RETURNS TRIGGER AS $$
DECLARE
  avg_hourly_xp NUMERIC;
  recent_xp INTEGER;
BEGIN
  -- Calculate user's average hourly XP over past 7 days
  SELECT COALESCE(AVG(hourly_xp), 10) INTO avg_hourly_xp
  FROM (
    SELECT date_trunc('hour', logged_at) as hour, SUM(xp_earned) as hourly_xp
    FROM activity_logs
    WHERE user_id = NEW.user_id
      AND logged_at > NOW() - INTERVAL '7 days'
    GROUP BY date_trunc('hour', logged_at)
  ) hourly;

  -- Calculate XP in past hour
  SELECT COALESCE(SUM(xp_earned), 0) INTO recent_xp
  FROM activity_logs
  WHERE user_id = NEW.user_id
    AND logged_at > NOW() - INTERVAL '1 hour';

  -- Flag if >5x average
  IF recent_xp > avg_hourly_xp * 5 AND recent_xp > 100 THEN
    INSERT INTO leaderboard_flags (user_id, period_key, flag_type, xp_delta, details)
    VALUES (
      NEW.user_id,
      get_current_week_key(),
      'burst_xp',
      recent_xp,
      jsonb_build_object('avg_hourly', avg_hourly_xp, 'recent_xp', recent_xp)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on activity_logs
CREATE TRIGGER check_burst_xp
  AFTER INSERT ON activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION detect_burst_xp();
```

---

## Related Code Files

| File | Purpose |
|------|---------|
| `src/lib/actions/leaderboard.ts` | Server actions (new) |
| `src/components/community/leaderboard-table.tsx` | Leaderboard UI |
| `src/app/(dashboard)/community/leaderboard/page.tsx` | Leaderboard page |
| `supabase/migrations/YYYYMMDD_leaderboard_system.sql` | Migration |

---

## Implementation Steps

### Step 1: Create Migration

File: `supabase/migrations/20260214_leaderboard_system.sql`

Include all schema, functions, triggers, RLS from above.

### Step 2: Create Server Actions

File: `src/lib/actions/leaderboard.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

export interface LeaderboardEntry {
  rank: number
  user: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'level'>
  xp_earned: number
  habits_completed: number
  streak_days: number
  is_current_user: boolean
  is_friend: boolean
}

export type PeriodType = 'weekly' | 'monthly'
export type FilterType = 'global' | 'friends'

export async function getLeaderboard(
  periodType: PeriodType = 'weekly',
  filter: FilterType = 'global',
  limit: number = 50
): Promise<{
  entries: LeaderboardEntry[]
  currentUserRank: number | null
  periodKey: string
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { entries: [], currentUserRank: null, periodKey: '' }

  // Get current period key
  const { data: periodKey } = await supabase.rpc(
    periodType === 'weekly' ? 'get_current_week_key' : 'get_current_month_key'
  )

  // Build query
  let query = supabase
    .from('leaderboard_snapshots')
    .select(`
      rank, xp_earned, habits_completed, streak_days, user_id,
      profiles:user_id (id, username, display_name, avatar_url, level)
    `)
    .eq('period_type', periodType)
    .eq('period_key', periodKey)
    .eq('is_flagged', false)
    .order('rank', { ascending: true })
    .limit(limit)

  // Filter by friends if requested
  let friendIds: string[] = []
  if (filter === 'friends') {
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id, friend_id')
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)

    friendIds = friendships?.flatMap(f =>
      f.user_id === user.id ? [f.friend_id] : [f.user_id]
    ) || []

    // Include self
    friendIds.push(user.id)

    query = query.in('user_id', friendIds)
  }

  const { data, error } = await query

  if (error || !data) {
    console.error('Leaderboard error:', error)
    return { entries: [], currentUserRank: null, periodKey: periodKey || '' }
  }

  // Get current user's rank
  const { data: userRank } = await supabase
    .from('leaderboard_snapshots')
    .select('rank')
    .eq('period_type', periodType)
    .eq('period_key', periodKey)
    .eq('user_id', user.id)
    .single()

  // Map entries
  const entries: LeaderboardEntry[] = data.map((entry: any) => ({
    rank: entry.rank,
    user: entry.profiles,
    xp_earned: entry.xp_earned,
    habits_completed: entry.habits_completed,
    streak_days: entry.streak_days,
    is_current_user: entry.user_id === user.id,
    is_friend: friendIds.includes(entry.user_id)
  }))

  return {
    entries,
    currentUserRank: userRank?.rank || null,
    periodKey: periodKey || ''
  }
}

export async function getLeaderboardHistory(
  periodType: PeriodType = 'weekly',
  periodKeys: string[]
): Promise<{ periodKey: string; rank: number; xp_earned: number }[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('leaderboard_snapshots')
    .select('period_key, rank, xp_earned')
    .eq('user_id', user.id)
    .eq('period_type', periodType)
    .in('period_key', periodKeys)
    .order('period_key', { ascending: false })

  return data || []
}

export async function getUserLeaderboardPosition(): Promise<{
  weekly: { rank: number; total: number } | null
  monthly: { rank: number; total: number } | null
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { weekly: null, monthly: null }

  const { data: weekKey } = await supabase.rpc('get_current_week_key')
  const { data: monthKey } = await supabase.rpc('get_current_month_key')

  // Get weekly position
  const { data: weeklyData } = await supabase
    .from('leaderboard_snapshots')
    .select('rank')
    .eq('period_type', 'weekly')
    .eq('period_key', weekKey)
    .eq('user_id', user.id)
    .single()

  const { count: weeklyTotal } = await supabase
    .from('leaderboard_snapshots')
    .select('*', { count: 'exact', head: true })
    .eq('period_type', 'weekly')
    .eq('period_key', weekKey)

  // Get monthly position
  const { data: monthlyData } = await supabase
    .from('leaderboard_snapshots')
    .select('rank')
    .eq('period_type', 'monthly')
    .eq('period_key', monthKey)
    .eq('user_id', user.id)
    .single()

  const { count: monthlyTotal } = await supabase
    .from('leaderboard_snapshots')
    .select('*', { count: 'exact', head: true })
    .eq('period_type', 'monthly')
    .eq('period_key', monthKey)

  return {
    weekly: weeklyData ? { rank: weeklyData.rank, total: weeklyTotal || 0 } : null,
    monthly: monthlyData ? { rank: monthlyData.rank, total: monthlyTotal || 0 } : null
  }
}
```

### Step 3: Create Leaderboard Types

File: `src/types/database.ts` (add)

```typescript
// Leaderboard types
export type PeriodType = 'weekly' | 'monthly'

export interface LeaderboardSnapshot {
  id: string
  period_type: PeriodType
  period_key: string
  user_id: string
  rank: number
  xp_earned: number
  habits_completed: number
  streak_days: number
  is_flagged: boolean
  created_at: string
  updated_at: string
}

export type LeaderboardFlagType = 'burst_xp' | 'impossible_streak' | 'suspicious_pattern' | 'manual_review'
export type FlagStatus = 'pending' | 'reviewed' | 'cleared' | 'confirmed'

export interface LeaderboardFlag {
  id: string
  user_id: string
  period_key: string
  flag_type: LeaderboardFlagType
  xp_delta: number | null
  details: Record<string, unknown> | null
  status: FlagStatus
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
}
```

### Step 4: Create Leaderboard UI

File: `src/components/community/leaderboard-table.tsx`

```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Trophy, Medal, Award, Users, Globe } from 'lucide-react'
import type { LeaderboardEntry, PeriodType, FilterType } from '@/lib/actions/leaderboard'
import { cn } from '@/lib/utils'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserRank: number | null
  periodKey: string
  periodType: PeriodType
  filter: FilterType
  onPeriodChange: (period: PeriodType) => void
  onFilterChange: (filter: FilterType) => void
  canFilterFriends: boolean
}

export function LeaderboardTable({
  entries,
  currentUserRank,
  periodKey,
  periodType,
  filter,
  onPeriodChange,
  onFilterChange,
  canFilterFriends
}: LeaderboardTableProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />
    return <span className="text-sm font-medium text-muted-foreground">{rank}</span>
  }

  const periodLabel = periodType === 'weekly'
    ? `Week ${periodKey.split('_w')[1]}`
    : periodKey.replace('monthly_', '').replace('_', '/')

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <Tabs value={periodType} onValueChange={(v) => onPeriodChange(v as PeriodType)}>
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <Button
            variant={filter === 'global' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('global')}
          >
            <Globe className="h-4 w-4 mr-1" />
            Global
          </Button>
          <Button
            variant={filter === 'friends' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onFilterChange('friends')}
            disabled={!canFilterFriends}
          >
            <Users className="h-4 w-4 mr-1" />
            Friends
          </Button>
        </div>
      </div>

      {/* Period info */}
      <div className="text-sm text-muted-foreground">
        {periodLabel}
        {currentUserRank && (
          <span className="ml-2">
            • Your rank: <strong>#{currentUserRank}</strong>
          </span>
        )}
      </div>

      {/* Leaderboard */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium">Rank</th>
              <th className="px-4 py-3 text-left text-sm font-medium">User</th>
              <th className="px-4 py-3 text-right text-sm font-medium">XP</th>
              <th className="px-4 py-3 text-right text-sm font-medium hidden sm:table-cell">Habits</th>
              <th className="px-4 py-3 text-right text-sm font-medium hidden sm:table-cell">Streak</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No rankings yet for this period
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const initials = (entry.user.display_name || entry.user.username || 'U')
                  .slice(0, 2).toUpperCase()

                return (
                  <tr
                    key={entry.user.id}
                    className={cn(
                      'border-t',
                      entry.is_current_user && 'bg-primary/5'
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center w-8 h-8">
                        {getRankIcon(entry.rank)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/profile/${entry.user.id}`}
                        className="flex items-center gap-3 hover:underline"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.user.avatar_url || undefined} />
                          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">
                            {entry.user.display_name || entry.user.username}
                            {entry.is_current_user && (
                              <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                            )}
                            {entry.is_friend && !entry.is_current_user && (
                              <Badge variant="secondary" className="ml-2 text-xs">Friend</Badge>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">Level {entry.user.level}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {entry.xp_earned.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                      {entry.habits_completed}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                      {entry.streak_days}d
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

### Step 5: Create Leaderboard Page

File: `src/app/(dashboard)/community/leaderboard/page.tsx`

```typescript
'use client'

import { useState, useEffect, useTransition } from 'react'
import { getLeaderboard, type PeriodType, type FilterType, type LeaderboardEntry } from '@/lib/actions/leaderboard'
import { LeaderboardTable } from '@/components/community/leaderboard-table'
import { useSubscription } from '@/lib/context/subscription-context'
import { hasFeature } from '@/lib/subscription-limits'
import { Skeleton } from '@/components/ui/skeleton'

export default function LeaderboardPage() {
  const [periodType, setPeriodType] = useState<PeriodType>('weekly')
  const [filter, setFilter] = useState<FilterType>('global')
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null)
  const [periodKey, setPeriodKey] = useState('')
  const [isPending, startTransition] = useTransition()

  const { tier } = useSubscription()
  const canFilterFriends = tier !== 'free'

  useEffect(() => {
    startTransition(async () => {
      const data = await getLeaderboard(periodType, filter)
      setEntries(data.entries)
      setCurrentUserRank(data.currentUserRank)
      setPeriodKey(data.periodKey)
    })
  }, [periodType, filter])

  const handlePeriodChange = (period: PeriodType) => {
    setPeriodType(period)
  }

  const handleFilterChange = (newFilter: FilterType) => {
    if (newFilter === 'friends' && !canFilterFriends) return
    setFilter(newFilter)
  }

  if (isPending && entries.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Leaderboard</h1>
        <p className="text-muted-foreground">See how you rank among other gardeners</p>
      </div>

      <LeaderboardTable
        entries={entries}
        currentUserRank={currentUserRank}
        periodKey={periodKey}
        periodType={periodType}
        filter={filter}
        onPeriodChange={handlePeriodChange}
        onFilterChange={handleFilterChange}
        canFilterFriends={canFilterFriends}
      />
    </div>
  )
}
```

### Step 6: Create Leaderboard Update Cron

File: `src/app/api/cron/leaderboard/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get current period keys
    const { data: weekKey } = await supabase.rpc('get_current_week_key')
    const { data: monthKey } = await supabase.rpc('get_current_month_key')

    // Get period boundaries
    const now = new Date()
    const weekStart = getWeekStart(now)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get all users who opted into leaderboard
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('subscription_status', 'active')

    if (!users) {
      return NextResponse.json({ error: 'No users found' }, { status: 500 })
    }

    // Update snapshots for each user
    for (const user of users) {
      // Check if user opted in
      const { data: privacy } = await supabase
        .from('privacy_settings')
        .select('show_on_leaderboard')
        .eq('user_id', user.id)
        .single()

      if (!privacy?.show_on_leaderboard) continue

      // Calculate weekly XP
      const { data: weeklyXp } = await supabase.rpc('calculate_period_xp', {
        uid: user.id,
        period_start: weekStart.toISOString(),
        period_end: now.toISOString()
      })

      // Calculate monthly XP
      const { data: monthlyXp } = await supabase.rpc('calculate_period_xp', {
        uid: user.id,
        period_start: monthStart.toISOString(),
        period_end: now.toISOString()
      })

      // Get habits completed and streak
      const { data: plants } = await supabase
        .from('plants')
        .select('current_streak')
        .eq('user_id', user.id)

      const maxStreak = Math.max(...(plants?.map(p => p.current_streak) || [0]), 0)

      const { count: habitsCompleted } = await supabase
        .from('activity_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('logged_at', weekStart.toISOString())

      // Upsert weekly snapshot
      await supabase
        .from('leaderboard_snapshots')
        .upsert({
          period_type: 'weekly',
          period_key: weekKey,
          user_id: user.id,
          xp_earned: weeklyXp || 0,
          habits_completed: habitsCompleted || 0,
          streak_days: maxStreak,
          updated_at: now.toISOString()
        }, {
          onConflict: 'period_type,period_key,user_id'
        })

      // Upsert monthly snapshot
      await supabase
        .from('leaderboard_snapshots')
        .upsert({
          period_type: 'monthly',
          period_key: monthKey,
          user_id: user.id,
          xp_earned: monthlyXp || 0,
          habits_completed: habitsCompleted || 0,
          streak_days: maxStreak,
          updated_at: now.toISOString()
        }, {
          onConflict: 'period_type,period_key,user_id'
        })
    }

    // Update rankings
    await supabase.rpc('update_leaderboard_ranks', {
      p_period_type: 'weekly',
      p_period_key: weekKey
    })
    await supabase.rpc('update_leaderboard_ranks', {
      p_period_type: 'monthly',
      p_period_key: monthKey
    })

    return NextResponse.json({
      success: true,
      weekKey,
      monthKey,
      usersProcessed: users.length
    })
  } catch (error) {
    console.error('Leaderboard cron error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}
```

### Step 7: Add Leaderboard Widget to Community Page

Update `src/app/(dashboard)/community/page.tsx`:

```typescript
// Add import
import { getUserLeaderboardPosition } from '@/lib/actions/leaderboard'
import { LeaderboardWidget } from '@/components/community/leaderboard-widget'

// In component, add:
const leaderboardPos = await getUserLeaderboardPosition()

// In JSX, add section:
<LeaderboardWidget position={leaderboardPos} />
```

---

## Todo Checklist

- [ ] Create leaderboard migration
- [ ] Apply migration to Supabase
- [ ] Add leaderboard types
- [ ] Create getLeaderboard action
- [ ] Create getUserLeaderboardPosition action
- [ ] Create LeaderboardTable component
- [ ] Create leaderboard page
- [ ] Create cron endpoint
- [ ] Add cron job (hourly) in Supabase/Vercel
- [ ] Create LeaderboardWidget for community page
- [ ] Test anti-gaming detection
- [ ] Test RLS (opt-in users only visible)
- [ ] Test friend filter

---

## Success Criteria

- [ ] Weekly/monthly leaderboards display correctly
- [ ] Rankings update via cron job
- [ ] Friend filter works for PRO+ users
- [ ] Users can opt out via privacy settings
- [ ] Burst XP detection creates flags
- [ ] Flagged users excluded from rankings

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cron job fails | Stale rankings | Alert on failure, manual trigger |
| False positives in anti-gaming | User frustration | Start with high threshold, review flags |
| Expensive queries | DB performance | Snapshot table, indexes, limit results |
| Gaming via multiple accounts | Unfair rankings | Email verification, IP tracking (future) |

---

## Security Considerations

1. **Opt-In Only**: Users not in privacy_settings or opted out excluded from results
2. **No Data Leak**: RLS prevents seeing opted-out users
3. **Anti-Gaming**: Automated detection + manual review
4. **Cron Auth**: Protected by CRON_SECRET
5. **Rate Limit**: Consider adding for leaderboard API (Phase 5)

# Phase 04: Challenges - Group Challenges System

## Context

- [plan.md](plan.md) - Overview
- [phase-01-foundation.md](phase-01-foundation.md) - Database foundation
- [researcher-01-social-features.md](research/researcher-01-social-features.md) - Challenge patterns

## Overview

| Field | Value |
|-------|-------|
| Date | 2026-02-12 |
| Priority | P1 - High |
| Status | Pending |
| Estimate | 4-5 days |
| Dependencies | Phase 01, 02, 03 complete |

Implement group challenges with invites, progress tracking, and completion rewards.

---

## Requirements

### Challenge Types

1. **Streak Challenge** - Maintain X-day streak as a group
2. **XP Race** - Earn most XP in time period
3. **Completion Challenge** - Complete X habits together
4. **Consistency Challenge** - X% completion rate over period

### Core Features

1. Create challenge (PREMIUM only)
2. Invite friends to challenge
3. Accept/decline challenge invite
4. Track live progress
5. Complete/fail challenge
6. Reward distribution

### Tier Access

| Tier | Access |
|------|--------|
| FREE | View challenges only |
| PRO | Join up to 3 active |
| PREMIUM | Join unlimited, create challenges |

### Challenge Rules

- Min 2, max 15 participants
- Duration: 1-8 weeks
- Start date: immediate or scheduled
- Visibility: private (invite only) or friends-of-friends

---

## Architecture

### Database Schema

```sql
-- Challenges table
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('streak', 'xp_race', 'completion', 'consistency')),
  target_value INTEGER NOT NULL, -- Streak days, XP amount, completions, percentage
  duration_weeks INTEGER NOT NULL DEFAULT 1 CHECK (duration_weeks BETWEEN 1 AND 8),
  min_participants INTEGER DEFAULT 2,
  max_participants INTEGER DEFAULT 15,
  visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'friends_of_friends', 'public')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'failed', 'cancelled')),
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Challenge members
CREATE TABLE challenge_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('creator', 'member')),
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'left', 'completed', 'failed')),
  progress_value INTEGER DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, user_id)
);

-- Challenge progress logs (for detailed tracking)
CREATE TABLE challenge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  activity_log_id UUID REFERENCES activity_logs(id) ON DELETE SET NULL,
  progress_delta INTEGER NOT NULL,
  progress_total INTEGER NOT NULL,
  logged_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenge rewards
CREATE TABLE challenge_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL CHECK (reward_type IN ('xp', 'badge', 'achievement')),
  reward_value INTEGER, -- XP amount
  reward_data JSONB, -- Badge/achievement details
  position TEXT CHECK (position IN ('all', 'winner', 'top_3')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_challenges_status ON challenges(status);
CREATE INDEX idx_challenges_creator ON challenges(created_by);
CREATE INDEX idx_challenge_members_user ON challenge_members(user_id, status);
CREATE INDEX idx_challenge_members_challenge ON challenge_members(challenge_id);
CREATE INDEX idx_challenge_progress ON challenge_progress(challenge_id, user_id);
```

### RLS Policies

```sql
-- Challenges: Creator can see all; others based on membership/visibility
CREATE POLICY "See challenges you're part of"
  ON challenges FOR SELECT
  USING (
    created_by = auth.uid()
    OR visibility = 'public'
    OR EXISTS (
      SELECT 1 FROM challenge_members
      WHERE challenge_id = challenges.id
      AND user_id = auth.uid()
    )
    OR (visibility = 'friends_of_friends' AND EXISTS (
      SELECT 1 FROM friendships
      WHERE (user_id = auth.uid() OR friend_id = auth.uid())
      AND (user_id = challenges.created_by OR friend_id = challenges.created_by)
    ))
  );

CREATE POLICY "Creator can update challenge"
  ON challenges FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Creator can delete challenge"
  ON challenges FOR DELETE
  USING (created_by = auth.uid() AND status = 'pending');

-- Challenge members: See if in challenge
CREATE POLICY "See challenge members"
  ON challenge_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM challenge_members cm
      WHERE cm.challenge_id = challenge_members.challenge_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'accepted'
    )
  );

CREATE POLICY "Manage own membership"
  ON challenge_members FOR UPDATE
  USING (user_id = auth.uid());

-- Challenge progress: Same as members
CREATE POLICY "See challenge progress"
  ON challenge_progress FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM challenge_members cm
      WHERE cm.challenge_id = challenge_progress.challenge_id
      AND cm.user_id = auth.uid()
      AND cm.status = 'accepted'
    )
  );
```

### Helper Functions

```sql
-- Update challenge progress when activity logged
CREATE OR REPLACE FUNCTION update_challenge_progress()
RETURNS TRIGGER AS $$
DECLARE
  challenge RECORD;
  member RECORD;
  new_progress INTEGER;
BEGIN
  -- Find active challenges for this user
  FOR challenge IN
    SELECT c.*, cm.progress_value, cm.id as member_id
    FROM challenges c
    JOIN challenge_members cm ON cm.challenge_id = c.id
    WHERE cm.user_id = NEW.user_id
      AND cm.status = 'accepted'
      AND c.status = 'active'
  LOOP
    -- Calculate progress based on challenge type
    CASE challenge.challenge_type
      WHEN 'xp_race' THEN
        new_progress := challenge.progress_value + NEW.xp_earned;
      WHEN 'completion' THEN
        new_progress := challenge.progress_value + 1;
      WHEN 'streak' THEN
        -- Get max current streak from plants
        SELECT COALESCE(MAX(current_streak), 0) INTO new_progress
        FROM plants WHERE user_id = NEW.user_id;
      WHEN 'consistency' THEN
        -- Calculate completion percentage
        SELECT ROUND(COUNT(*) * 100.0 / GREATEST(
          EXTRACT(DAY FROM NOW() - challenge.start_date), 1
        )) INTO new_progress
        FROM activity_logs
        WHERE user_id = NEW.user_id
          AND logged_at >= challenge.start_date;
    END CASE;

    -- Update member progress
    UPDATE challenge_members
    SET progress_value = new_progress,
        last_activity_at = NOW()
    WHERE id = challenge.member_id;

    -- Log progress
    INSERT INTO challenge_progress (challenge_id, user_id, activity_log_id, progress_delta, progress_total)
    VALUES (challenge.id, NEW.user_id, NEW.id, NEW.xp_earned, new_progress);

    -- Check if challenge completed
    IF new_progress >= challenge.target_value THEN
      UPDATE challenge_members
      SET status = 'completed', completed_at = NOW()
      WHERE id = challenge.member_id;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_challenge_progress
  AFTER INSERT ON activity_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_progress();

-- Check and complete challenges
CREATE OR REPLACE FUNCTION check_challenge_completion()
RETURNS VOID AS $$
DECLARE
  challenge RECORD;
  all_completed BOOLEAN;
BEGIN
  FOR challenge IN
    SELECT * FROM challenges WHERE status = 'active' AND end_date < NOW()
  LOOP
    -- Check if all members completed
    SELECT bool_and(status IN ('completed', 'failed', 'left')) INTO all_completed
    FROM challenge_members
    WHERE challenge_id = challenge.id;

    IF all_completed THEN
      UPDATE challenges
      SET status = 'completed', completed_at = NOW()
      WHERE id = challenge.id;
    ELSE
      -- Mark remaining as failed
      UPDATE challenge_members
      SET status = 'failed'
      WHERE challenge_id = challenge.id AND status = 'accepted';

      UPDATE challenges
      SET status = 'failed', completed_at = NOW()
      WHERE id = challenge.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## Related Code Files

| File | Purpose |
|------|---------|
| `src/lib/actions/challenges.ts` | Server actions (new) |
| `src/components/community/challenge-card.tsx` | Challenge preview |
| `src/components/community/challenge-detail-sheet.tsx` | Full detail view |
| `src/components/community/create-challenge-dialog.tsx` | Creation wizard |
| `src/app/(dashboard)/community/challenges/page.tsx` | Challenges list |
| `src/app/(dashboard)/community/challenges/[id]/page.tsx` | Challenge detail |

---

## Implementation Steps

### Step 1: Create Migration

File: `supabase/migrations/20260215_challenge_system.sql`

Include all schema, functions, triggers, RLS from above.

### Step 2: Add TypeScript Types

File: `src/types/database.ts` (add)

```typescript
// Challenge types
export type ChallengeType = 'streak' | 'xp_race' | 'completion' | 'consistency'
export type ChallengeVisibility = 'private' | 'friends_of_friends' | 'public'
export type ChallengeStatus = 'pending' | 'active' | 'completed' | 'failed' | 'cancelled'
export type ChallengeMemberStatus = 'invited' | 'accepted' | 'declined' | 'left' | 'completed' | 'failed'
export type ChallengeMemberRole = 'creator' | 'member'

export interface Challenge {
  id: string
  created_by: string
  title: string
  description: string | null
  challenge_type: ChallengeType
  target_value: number
  duration_weeks: number
  min_participants: number
  max_participants: number
  visibility: ChallengeVisibility
  status: ChallengeStatus
  start_date: string | null
  end_date: string | null
  created_at: string
  started_at: string | null
  completed_at: string | null
}

export interface ChallengeMember {
  id: string
  challenge_id: string
  user_id: string
  role: ChallengeMemberRole
  status: ChallengeMemberStatus
  progress_value: number
  last_activity_at: string | null
  joined_at: string | null
  completed_at: string | null
  reward_claimed: boolean
  created_at: string
}

export interface ChallengeMemberWithProfile extends ChallengeMember {
  profile: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'level'>
}

export interface ChallengeWithMembers extends Challenge {
  members: ChallengeMemberWithProfile[]
  creator: Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>
}

export interface ChallengeProgress {
  id: string
  challenge_id: string
  user_id: string
  activity_log_id: string | null
  progress_delta: number
  progress_total: number
  logged_at: string
}

// DTOs
export interface CreateChallengeDto {
  title: string
  description?: string
  challenge_type: ChallengeType
  target_value: number
  duration_weeks: number
  visibility?: ChallengeVisibility
  start_date?: string
  invite_user_ids?: string[]
}
```

### Step 3: Create Server Actions

File: `src/lib/actions/challenges.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getTierLimits } from '@/lib/subscription-limits'
import type {
  Challenge,
  ChallengeWithMembers,
  ChallengeMemberWithProfile,
  CreateChallengeDto,
  ChallengeStatus
} from '@/types/database'

// Get user's challenges
export async function getMyChallenges(): Promise<{
  active: ChallengeWithMembers[]
  pending: ChallengeWithMembers[]
  completed: ChallengeWithMembers[]
}> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { active: [], pending: [], completed: [] }

  const { data } = await supabase
    .from('challenge_members')
    .select(`
      challenge:challenges(
        *,
        creator:profiles!challenges_created_by_fkey(id, username, display_name, avatar_url),
        members:challenge_members(
          *,
          profile:profiles(id, username, display_name, avatar_url, level)
        )
      )
    `)
    .eq('user_id', user.id)
    .in('status', ['invited', 'accepted', 'completed'])

  if (!data) return { active: [], pending: [], completed: [] }

  const challenges = data.map((d: any) => d.challenge as ChallengeWithMembers)

  return {
    active: challenges.filter(c => c.status === 'active'),
    pending: challenges.filter(c => c.status === 'pending'),
    completed: challenges.filter(c => c.status === 'completed' || c.status === 'failed')
  }
}

// Get challenge details
export async function getChallenge(challengeId: string): Promise<ChallengeWithMembers | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('challenges')
    .select(`
      *,
      creator:profiles!challenges_created_by_fkey(id, username, display_name, avatar_url),
      members:challenge_members(
        *,
        profile:profiles(id, username, display_name, avatar_url, level)
      )
    `)
    .eq('id', challengeId)
    .single()

  if (error || !data) return null

  return data as ChallengeWithMembers
}

// Create challenge (PREMIUM only)
export async function createChallenge(
  dto: CreateChallengeDto
): Promise<{ success: boolean; challengeId?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Check tier
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  if (profile?.subscription_tier !== 'premium') {
    return { success: false, error: 'PREMIUM subscription required to create challenges' }
  }

  // Calculate end date
  const startDate = dto.start_date ? new Date(dto.start_date) : new Date()
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + dto.duration_weeks * 7)

  // Create challenge
  const { data: challenge, error: createError } = await supabase
    .from('challenges')
    .insert({
      created_by: user.id,
      title: dto.title,
      description: dto.description,
      challenge_type: dto.challenge_type,
      target_value: dto.target_value,
      duration_weeks: dto.duration_weeks,
      visibility: dto.visibility || 'private',
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: 'pending'
    })
    .select()
    .single()

  if (createError || !challenge) {
    return { success: false, error: createError?.message || 'Failed to create challenge' }
  }

  // Add creator as member
  await supabase
    .from('challenge_members')
    .insert({
      challenge_id: challenge.id,
      user_id: user.id,
      role: 'creator',
      status: 'accepted',
      joined_at: new Date().toISOString()
    })

  // Invite users
  if (dto.invite_user_ids && dto.invite_user_ids.length > 0) {
    const invites = dto.invite_user_ids.map(uid => ({
      challenge_id: challenge.id,
      user_id: uid,
      role: 'member',
      status: 'invited'
    }))

    await supabase.from('challenge_members').insert(invites)
  }

  revalidatePath('/community/challenges')
  return { success: true, challengeId: challenge.id }
}

// Join challenge (respond to invite)
export async function respondToChallenge(
  challengeId: string,
  accept: boolean
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Check tier limits
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier')
    .eq('id', user.id)
    .single()

  const limits = getTierLimits(profile?.subscription_tier || 'free')

  if (accept && limits.maxActiveChallenges !== -1) {
    // Count active challenges
    const { count } = await supabase
      .from('challenge_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'accepted')

    if ((count || 0) >= limits.maxActiveChallenges) {
      return { success: false, error: `You can only join ${limits.maxActiveChallenges} active challenges. Upgrade for more!` }
    }
  }

  // Update membership
  const { error } = await supabase
    .from('challenge_members')
    .update({
      status: accept ? 'accepted' : 'declined',
      joined_at: accept ? new Date().toISOString() : null
    })
    .eq('challenge_id', challengeId)
    .eq('user_id', user.id)
    .eq('status', 'invited')

  if (error) {
    return { success: false, error: error.message }
  }

  // Check if challenge should start
  if (accept) {
    await checkAndStartChallenge(challengeId)
  }

  revalidatePath('/community/challenges')
  return { success: true }
}

// Leave challenge
export async function leaveChallenge(
  challengeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Get challenge
  const { data: challenge } = await supabase
    .from('challenges')
    .select('created_by, status')
    .eq('id', challengeId)
    .single()

  if (!challenge) {
    return { success: false, error: 'Challenge not found' }
  }

  // Creator cannot leave
  if (challenge.created_by === user.id) {
    return { success: false, error: 'Creator cannot leave. Cancel the challenge instead.' }
  }

  // Update status
  const { error } = await supabase
    .from('challenge_members')
    .update({ status: 'left' })
    .eq('challenge_id', challengeId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/community/challenges')
  return { success: true }
}

// Cancel challenge (creator only, pending only)
export async function cancelChallenge(
  challengeId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('challenges')
    .update({ status: 'cancelled' })
    .eq('id', challengeId)
    .eq('created_by', user.id)
    .eq('status', 'pending')

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/community/challenges')
  return { success: true }
}

// Invite friend to challenge
export async function inviteToChallenge(
  challengeId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Verify creator
  const { data: challenge } = await supabase
    .from('challenges')
    .select('created_by, max_participants, status')
    .eq('id', challengeId)
    .single()

  if (!challenge || challenge.created_by !== user.id) {
    return { success: false, error: 'Only creator can invite' }
  }

  if (challenge.status !== 'pending') {
    return { success: false, error: 'Can only invite to pending challenges' }
  }

  // Check member count
  const { count } = await supabase
    .from('challenge_members')
    .select('*', { count: 'exact', head: true })
    .eq('challenge_id', challengeId)
    .in('status', ['invited', 'accepted'])

  if ((count || 0) >= challenge.max_participants) {
    return { success: false, error: 'Challenge is full' }
  }

  // Verify friendship
  const { data: areFriends } = await supabase.rpc('are_friends', {
    user1: user.id,
    user2: userId
  })

  if (!areFriends) {
    return { success: false, error: 'Can only invite friends' }
  }

  // Create invite
  const { error } = await supabase
    .from('challenge_members')
    .insert({
      challenge_id: challengeId,
      user_id: userId,
      role: 'member',
      status: 'invited'
    })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'User already invited' }
    }
    return { success: false, error: error.message }
  }

  return { success: true }
}

// Start challenge if min participants met
async function checkAndStartChallenge(challengeId: string): Promise<void> {
  const supabase = await createClient()

  const { data: challenge } = await supabase
    .from('challenges')
    .select('min_participants, status, start_date')
    .eq('id', challengeId)
    .single()

  if (!challenge || challenge.status !== 'pending') return

  const { count } = await supabase
    .from('challenge_members')
    .select('*', { count: 'exact', head: true })
    .eq('challenge_id', challengeId)
    .eq('status', 'accepted')

  if ((count || 0) >= challenge.min_participants) {
    // Check if start date has passed
    const startDate = new Date(challenge.start_date || Date.now())
    if (startDate <= new Date()) {
      await supabase
        .from('challenges')
        .update({ status: 'active', started_at: new Date().toISOString() })
        .eq('id', challengeId)
    }
  }
}

// Get challenge progress history
export async function getChallengeProgress(
  challengeId: string
): Promise<{ userId: string; progress: { date: string; value: number }[] }[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('challenge_progress')
    .select('user_id, progress_total, logged_at')
    .eq('challenge_id', challengeId)
    .order('logged_at', { ascending: true })

  if (!data) return []

  // Group by user
  const grouped: Record<string, { date: string; value: number }[]> = {}
  data.forEach(p => {
    if (!grouped[p.user_id]) grouped[p.user_id] = []
    grouped[p.user_id].push({
      date: p.logged_at.split('T')[0],
      value: p.progress_total
    })
  })

  return Object.entries(grouped).map(([userId, progress]) => ({
    userId,
    progress
  }))
}
```

### Step 4: Create Challenge Card Component

File: `src/components/community/challenge-card.tsx`

```typescript
'use client'

import Link from 'next/link'
import { ChallengeWithMembers } from '@/types/database'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Trophy, Flame, Target, Percent, Clock, Users } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ChallengeCardProps {
  challenge: ChallengeWithMembers
  currentUserId: string
}

export function ChallengeCard({ challenge, currentUserId }: ChallengeCardProps) {
  const currentMember = challenge.members.find(m => m.user_id === currentUserId)
  const acceptedMembers = challenge.members.filter(m => m.status === 'accepted' || m.status === 'completed')

  const typeIcon = {
    streak: <Flame className="h-4 w-4" />,
    xp_race: <Trophy className="h-4 w-4" />,
    completion: <Target className="h-4 w-4" />,
    consistency: <Percent className="h-4 w-4" />
  }[challenge.challenge_type]

  const typeLabel = {
    streak: 'Streak',
    xp_race: 'XP Race',
    completion: 'Completion',
    consistency: 'Consistency'
  }[challenge.challenge_type]

  const statusColor = {
    pending: 'secondary',
    active: 'default',
    completed: 'success',
    failed: 'destructive',
    cancelled: 'outline'
  }[challenge.status] as any

  const progressPercent = currentMember
    ? Math.min(100, (currentMember.progress_value / challenge.target_value) * 100)
    : 0

  const timeLeft = challenge.end_date
    ? formatDistanceToNow(new Date(challenge.end_date), { addSuffix: true })
    : null

  return (
    <Link
      href={`/community/challenges/${challenge.id}`}
      className="block p-4 rounded-lg border bg-card hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold">{challenge.title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
            {typeIcon}
            <span>{typeLabel}</span>
            <span>•</span>
            <span>{challenge.target_value} target</span>
          </div>
        </div>
        <Badge variant={statusColor}>{challenge.status}</Badge>
      </div>

      {currentMember && challenge.status === 'active' && (
        <div className="mb-3">
          <div className="flex justify-between text-sm mb-1">
            <span>Your progress</span>
            <span>{currentMember.progress_value} / {challenge.target_value}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="flex -space-x-2">
            {acceptedMembers.slice(0, 4).map(m => {
              const initials = (m.profile.display_name || m.profile.username || 'U')
                .slice(0, 2).toUpperCase()
              return (
                <Avatar key={m.id} className="h-6 w-6 border-2 border-background">
                  <AvatarImage src={m.profile.avatar_url || undefined} />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
              )
            })}
            {acceptedMembers.length > 4 && (
              <span className="text-xs text-muted-foreground ml-2">
                +{acceptedMembers.length - 4}
              </span>
            )}
          </div>
        </div>

        {timeLeft && challenge.status === 'active' && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{timeLeft}</span>
          </div>
        )}
      </div>
    </Link>
  )
}
```

### Step 5: Create Challenge Detail Page

File: `src/app/(dashboard)/community/challenges/[id]/page.tsx`

```typescript
import { notFound, redirect } from 'next/navigation'
import { getChallenge, getChallengeProgress } from '@/lib/actions/challenges'
import { getProfile } from '@/lib/actions/profile'
import { ChallengeDetailSheet } from '@/components/community/challenge-detail-sheet'

interface ChallengePageProps {
  params: Promise<{ id: string }>
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { id } = await params
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const challenge = await getChallenge(id)
  if (!challenge) notFound()

  const progressHistory = await getChallengeProgress(id)

  return (
    <div className="max-w-2xl mx-auto">
      <ChallengeDetailSheet
        challenge={challenge}
        currentUserId={profile.id}
        progressHistory={progressHistory}
      />
    </div>
  )
}
```

### Step 6: Create Challenge List Page

File: `src/app/(dashboard)/community/challenges/page.tsx`

```typescript
import { getMyChallenges } from '@/lib/actions/challenges'
import { getProfile } from '@/lib/actions/profile'
import { redirect } from 'next/navigation'
import { ChallengeCard } from '@/components/community/challenge-card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default async function ChallengesPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')

  const { active, pending, completed } = await getMyChallenges()
  const canCreate = profile.subscription_tier === 'premium'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Challenges</h1>
          <p className="text-muted-foreground">Compete with friends</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/community/challenges/create">
              <Plus className="h-4 w-4 mr-2" />
              Create Challenge
            </Link>
          </Button>
        )}
      </div>

      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-3 mt-4">
          {active.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No active challenges</p>
          ) : (
            active.map(c => (
              <ChallengeCard key={c.id} challenge={c} currentUserId={profile.id} />
            ))
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pending.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No pending invites</p>
          ) : (
            pending.map(c => (
              <ChallengeCard key={c.id} challenge={c} currentUserId={profile.id} />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-3 mt-4">
          {completed.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No completed challenges</p>
          ) : (
            completed.map(c => (
              <ChallengeCard key={c.id} challenge={c} currentUserId={profile.id} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## Todo Checklist

- [ ] Create challenge migration
- [ ] Apply migration to Supabase
- [ ] Add challenge types to database.ts
- [ ] Create challenges server actions
- [ ] Create ChallengeCard component
- [ ] Create ChallengeDetailSheet component
- [ ] Create CreateChallengeDialog component
- [ ] Create challenges list page
- [ ] Create challenge detail page
- [ ] Create challenge creation page
- [ ] Add challenge progress trigger
- [ ] Add cron for challenge completion check
- [ ] Test tier limits (join limit)
- [ ] Test RLS policies
- [ ] Test progress tracking

---

## Success Criteria

- [ ] PREMIUM users can create challenges
- [ ] Users can invite friends
- [ ] Invitees can accept/decline
- [ ] Progress updates automatically from activity_logs
- [ ] Challenge completes when all finish or time expires
- [ ] PRO users limited to 3 active challenges
- [ ] FREE users can only view (no join)

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Progress trigger slow | DB performance | Batch updates, debounce |
| Challenge gaming | Unfair results | Same anti-gaming as leaderboards |
| Too many invites | Spam | Limit to friends, max 15 per challenge |
| Complex state machine | Bugs | Clear status transitions, tests |

---

## Security Considerations

1. **Creator-Only Actions**: Only creator can invite, cancel pending challenges
2. **Friend-Only Invites**: Verify friendship before allowing invite
3. **Tier Enforcement**: Server-side check before join
4. **RLS**: Users only see challenges they're part of (or public/FoF)
5. **No Reward Gaming**: Rewards tied to actual progress triggers

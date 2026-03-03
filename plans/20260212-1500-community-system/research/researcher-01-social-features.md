# Social & Community Features Research
**Date:** 2026-02-12 | **App:** Habit Garden

---

## 1. Friend System Design

### Best Practices
- **Request States:** Pending → Accepted/Rejected → Blocked
- **Privacy Tiers:**
  - "Friends Only" (blocks friend requests from non-friends)
  - "Friends of Friends" (reduces spam)
  - "Everyone" (open to all)
- **Restrict Feature** (Instagram model): Soft-blocking without notifying user—hides messages, comments, online status
- **Audit Regularly:** Users should prune inactive friends every 3-6 months

### Implementation Patterns
```sql
-- Habit Garden: Friends Table
CREATE TABLE friendships (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  friend_id UUID NOT NULL REFERENCES auth.users,
  status TEXT CHECK (status IN ('pending', 'accepted', 'blocked')),
  blocked_by UUID REFERENCES auth.users,
  created_at TIMESTAMP,
  UNIQUE(user_id, friend_id)
);

-- RLS: Users can only see their own friendships
CREATE POLICY "Users see own friendships"
  ON friendships FOR SELECT
  USING (auth.uid() IN (user_id, friend_id));
```

---

## 2. Leaderboard Systems

### Core Patterns
- **Time Windows:** Weekly/Monthly resets prevent stagnation
- **Scope:** Global, Friend Group, Guild/Community cohorts
- **Scoring:** XP-based primary; tie-breakers: streak days, challenges completed
- **Percentile Ranking:** More fair than absolute ranks—shows progress vs peers

### Anti-Gaming Measures
1. **Activity Smoothing:** Detect burst completion patterns; apply time-cost penalties
2. **Validation:** Flag suspicious patterns (1000 XP in 5 mins) for review
3. **Seasonal Resets:** Monthly leaderboards reset; prevent long-term camping
4. **Soft-Capping:** Diminishing returns after N completions/day
5. **Rollback Audits:** Track anomalies; admin rollback capability

### Implementation Strategy
```sql
-- Weekly leaderboard snapshot (Supabase edge function processes daily)
CREATE TABLE leaderboard_snapshots (
  id UUID PRIMARY KEY,
  period TEXT, -- 'weekly_2026_w07', 'monthly_2026_02'
  user_id UUID REFERENCES auth.users,
  rank INT,
  xp_total INT,
  completed_habits INT,
  streak_days INT,
  created_at TIMESTAMP
);

-- Flag suspicious activity
CREATE TABLE leaderboard_flags (
  id UUID PRIMARY KEY,
  user_id UUID,
  flag_type TEXT, -- 'burst_xp', 'impossible_streak'
  xp_delta INT,
  created_at TIMESTAMP
);
```

---

## 3. Social Challenges & Community Events

### Design Patterns
- **Balancing Act:** Mix competitive (leaderboards) + collaborative (group goals)
- **Group Quests:** 5-15 people, time-boxed (1-4 weeks), shared objectives
- **Community-Wide Events:** App-level challenges (e.g., "Plant 1M flowers together")
- **Reward Structure:**
  - Individual completion badges
  - Group milestone rewards (bonus XP, cosmetics)
  - Stretch goals for extra incentives

### Engagement Drivers
- Small group cohort (5-15) > anonymous global (fosters accountability)
- Structured check-ins (daily/weekly) > passive tracking
- Real-time progress display (leaderboards update hourly)

### Tier Strategy (FREE/PRO/PREMIUM)
| Tier | Challenges | Community Events |
|------|-----------|-----------------|
| FREE | 1 active challenge | View-only leaderboards |
| PRO | 3 active challenges | Create/join challenges |
| PREMIUM | Unlimited | Host events + social spaces |

---

## 4. Supabase Implementation

### Real-Time Subscriptions Architecture
```typescript
// Listen to friend status changes (RLS-protected)
supabase
  .channel('friendships')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'friendships',
      filter: `user_id=eq.${userId}`
    },
    (payload) => updateFriendUI(payload)
  )
  .subscribe();

// Listen to leaderboard updates (scoped to visible friends)
supabase
  .channel(`leaderboard_friends_${period}`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'leaderboard_snapshots'
    },
    (payload) => refreshLeaderboard(payload)
  )
  .subscribe();
```

### RLS Policies for Privacy
```sql
-- Friend leaderboards (can only see friends' scores)
CREATE POLICY "See friend leaderboard scores"
  ON leaderboard_snapshots FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM friendships
      WHERE user_id = auth.uid()
      AND friend_id = leaderboard_snapshots.user_id
      AND status = 'accepted'
    )
  );

-- Challenge participation (private until accepted)
CREATE POLICY "See challenges you're invited to"
  ON challenges FOR SELECT
  USING (
    created_by = auth.uid() OR
    visibility = 'public' OR
    EXISTS (
      SELECT 1 FROM challenge_members
      WHERE challenge_id = challenges.id
      AND user_id = auth.uid()
    )
  );
```

### Performance Optimization
- **Leaderboard Caching:** Snapshot table (materialized view) updated nightly
- **Connection Limits:** Realtime subscriptions max 5 per user (prevent spam)
- **Batch Updates:** Use presence channel for online status (lighter than polling)

---

## 5. Key Recommendations for Habit Garden

### Phase 1 (MVP)
- Friend requests + accept/reject (no blocking yet)
- 1 shared challenge type (group habit streak)
- Simple weekly XP leaderboard (global + friend-only)

### Phase 2 (Enhancement)
- Blocking + restrict features
- Anti-gaming detection (flag burst XP)
- Monthly leaderboard, seasonal resets
- Multiple challenge types

### Phase 3 (Community)
- Guild/community spaces (async groups)
- Community-wide events (monthly themes)
- Moderator tools
- Achievement galleries

---

---

## 6. Advanced Anti-Gaming Algorithms

Research shows gamification can unintentionally encourage cheating when competitive pressure outweighs purpose. Duolingo's approach:
- **Anomaly Detection:** Flag users gaining XP >5x average user rate
- **Burst Prevention:** Diminishing returns per action (2nd daily check-in = 50% XP)
- **Time Gating:** Max 1 habit completion per minute (server-validated)
- **Eligibility Gates:** Minimum playtime before leaderboard visibility

Strategy: Apply lighter penalties first (soft-cap XP), escalate to flags for review, preserve trust.

---

## 7. Blocking & Privacy Architecture

**Blocking Model** (research-backed):
- **Block Edge:** Create separate "blocks" table (high-priority override)
- **Scope:** Blocker cannot see blocked user's profile, posts, stats, send messages, tag, or friend request
- **Asymmetric:** One-directional (blocker initiates; blocked user unaware)
- **Soft-Restrict:** Optional—hides messages/comments without notifying user

```sql
-- Blocking takes precedence over visibility settings
CREATE TABLE blocks (
  id UUID PRIMARY KEY,
  blocker_id UUID NOT NULL REFERENCES auth.users,
  blocked_id UUID NOT NULL REFERENCES auth.users,
  created_at TIMESTAMP,
  UNIQUE(blocker_id, blocked_id)
);

-- ANY query must check blocks first (applied in RLS)
CREATE POLICY "respect_blocks_on_all_social_tables" ON leaderboard_snapshots
  USING (NOT EXISTS (
    SELECT 1 FROM blocks
    WHERE (blocker_id = auth.uid() AND blocked_id = user_id)
      OR (blocker_id = user_id AND blocked_id = auth.uid())
  ));
```

---

## 8. Research-Backed Impact

- **Social Accountability Effect:** +65% habit completion rate when part of group
- **Goal Completion Rate:** 95% more likely to complete goals when part of accountable group (vs personal tracking)
- **Multi-Leaderboard Strategy:** Segmented by experience/tier prevents discouragement; top 10%, top 25%, participant rewards drive broader engagement

---

## Unresolved Questions

1. **Leaderboard Frequency:** How often update realtime? (Hourly/Daily for mobile bandwidth)
2. **Challenge Reward Formula:** How split group rewards between participants? (Even split vs contribution-weighted)
3. **Notification Strategy:** When to alert users of friend activity? (Privacy vs engagement trade-off)
4. **Anti-Gaming False Positives:** What XP threshold triggers flags? (Context: daily limit, weekends)
5. **Deleted User Handling:** Cascade friend records or soft-delete with anonymization?
6. **Notification Strategy:** Should challenge invites/friend requests trigger push notifications or in-app only?
7. **Social Graph Scale:** At 10k+ users, should we shard leaderboards by region/tier from day 1?
8. **Seasonal Events:** Should community challenges reset monthly or be event-driven?

---

## Sources

- [Best Habit Tracker Apps with Friends Features - Cohorty](https://www.cohorty.app/blog/best-habit-tracking-apps-with-friends)
- [Top Gamified Productivity Apps - Octalysis](https://yukaichou.com/lifestyle-gamification/the-top-ten-gamified-productivity-apps/)
- [Gamification Strategies - Storyly](https://www.storyly.io/post/gamification-strategies-to-increase-app-engagement)
- [Gamification Techniques Part 2: Social & Competition - Medium](https://sa-liberty.medium.com/the-31-core-gamification-techniques-part-2-social-competition-1070c6d38e38)
- [Designing a Leaderboard System - Beamable](https://beamable.com/blog/designing-a-leaderboard-system)
- [Supabase Realtime Authorization - Docs](https://supabase.com/docs/guides/realtime/authorization)
- [Supabase Row Level Security - Docs](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Anti-Cheating Leaderboards - Game Developer](https://www.gamedeveloper.com/business/gamification-overjustification-effect-and-cheating)
- [Duolingo Leaderboard Anti-Cheating Practices](https://duolingoguides.com/duolingo-leaderboard-cheating/)
- [Social Graph Database Design - Medium](https://medium.com/@bqqsqjzfy/data-friends-and-feeds-demystifying-social-network-architecture-9745d3c10dcb)
- [Friend System Database Design - GeeksForGeeks](https://www.geeksforgeeks.org/sql/how-to-design-database-for-social-media-platform/)

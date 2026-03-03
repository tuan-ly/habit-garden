# Community System Implementation Plan

> **Created**: 2026-02-12
> **Status**: Planning
> **Supabase Project**: jkhkfsfjnilbfqfatonb

## Overview

Social accountability system with friends, leaderboards, and group challenges. Research shows +65% habit completion with social features.

## Tier Strategy

| Feature | FREE | PRO | PREMIUM |
|---------|------|-----|---------|
| View profiles | Yes | Yes | Yes |
| Leaderboards (read) | Yes | Yes | Yes |
| Friend list | 5 max | 25 max | Unlimited |
| Follow/Share | - | Yes | Yes |
| Join challenges | View only | 3 active | Unlimited |
| Create challenges | - | - | Yes |
| Messaging | - | - | Yes |
| Private groups | - | - | Yes |

## Phases

| Phase | Name | Priority | Status | Link |
|-------|------|----------|--------|------|
| 01 | Foundation | P0 | Pending | [phase-01-foundation.md](phase-01-foundation.md) |
| 02 | Friend System | P0 | Pending | [phase-02-friend-system.md](phase-02-friend-system.md) |
| 03 | Leaderboards | P1 | Pending | [phase-03-leaderboards.md](phase-03-leaderboards.md) |
| 04 | Challenges | P1 | Pending | [phase-04-challenges.md](phase-04-challenges.md) |
| 05 | Polish | P2 | Pending | [phase-05-polish.md](phase-05-polish.md) |

## Timeline Estimate

- Phase 1: 2-3 days (database + types)
- Phase 2: 3-4 days (friend UI + actions)
- Phase 3: 2-3 days (leaderboards)
- Phase 4: 4-5 days (challenges)
- Phase 5: 3-4 days (notifications, referrals, moderation)

**Total**: ~15-19 days

## Research Context

- [researcher-01-social-features.md](research/researcher-01-social-features.md) - Friend system, leaderboards, challenges
- [researcher-02-monetization-privacy.md](research/researcher-02-monetization-privacy.md) - Feature gating, GDPR, referrals
- [scout-report.md](scout/scout-report.md) - Codebase integration points

## Success Criteria

- [ ] Friends: add, accept, reject, block, remove
- [ ] Leaderboards: weekly/monthly, global/friends, anti-gaming
- [ ] Challenges: create, join, track progress, complete
- [ ] Privacy: granular consent, GDPR-compliant data handling
- [ ] Moderation: report system, automated + manual review
- [ ] Referrals: double-sided rewards, tracking

## Key Files (After Implementation)

```
src/lib/actions/
  community.ts          # Friend actions
  leaderboard.ts        # Ranking actions
  challenges.ts         # Challenge actions

src/components/community/
  friend-list.tsx       # Friends UI
  friend-request-card.tsx
  leaderboard-table.tsx
  challenge-card.tsx
  challenge-detail-sheet.tsx

src/types/database.ts   # Extended with community types

supabase/migrations/
  YYYYMMDD_community_foundation.sql
  YYYYMMDD_leaderboard_system.sql
  YYYYMMDD_challenge_system.sql
```

# Monetization & Privacy Research: Community Features for Freemium Apps

## Executive Summary
For Habit Garden's community system, adopt **freemium feature gating** aligned with tier progression, implement **granular GDPR consent** for social sharing, leverage **double-sided incentives** in referrals, and build **multi-layer moderation** with automated + human review.

---

## 1. FEATURE GATING STRATEGY FOR SOCIAL

### Recommended Tier Breakdown

| Feature | FREE | PRO | PREMIUM |
|---------|------|-----|---------|
| **View public profiles** | ✓ | ✓ | ✓ |
| **Follow users** | - | ✓ | ✓ |
| **Share achievements** | Limited (5/mo) | Unlimited | Unlimited |
| **Comment on posts** | - | ✓ | ✓ |
| **Join community challenges** | Basic only | All | All + custom |
| **Messaging** | - | - | ✓ |
| **Create private groups** | - | - | ✓ |
| **Leaderboards** | Read-only | Full | Full + filters |

### Implementation Pattern
- **10-70-20 rule**: 10% free (discovery), 70% behind paywall, 20% for power users
- Free users see social value (read-only) → drives upgrade consideration
- PRO tier: Social engagement tools (follow, comment, share)
- PREMIUM: Private communities, messaging, exclusivity

---

## 2. PRIVACY & GDPR COMPLIANCE

### Consent Architecture
1. **Granular Consent Choices** (separate toggles, not blanket approval):
   - Profile data collection
   - Achievement sharing to followers
   - Leaderboard participation
   - Community recommendations
   - Analytics/usage tracking

2. **Mandatory Elements for EU Users**:
   - Clear privacy policy link before any social feature
   - Explicit opt-in (pre-ticked boxes forbidden)
   - Right to withdraw consent at any time (Settings > Privacy)
   - Data portability: export profile/achievements

3. **Data Sharing Compliance**:
   - No third-party sharing without explicit consent
   - Use Standard Contractual Clauses if storing data in non-EU regions
   - Document Transfer Impact Assessment (verify Supabase compliance)
   - Retention: Delete social data after user account deletion (30-day grace period)

### Implementation Checklist
- [ ] Consent banner on first social feature access
- [ ] Per-feature toggles in Settings > Privacy
- [ ] Audit logs for consent changes
- [ ] GDPR export endpoint (user data JSON download)
- [ ] 3rd-party vendor compliance verification

---

## 3. VIRAL GROWTH MECHANICS

### Referral System (K-Factor > 1)

**Double-Sided Incentive Model** (most effective):
- **Referrer reward**: 1 month PRO access / premium currency
- **Referred reward**: 2 weeks PRO trial (lowers barrier)
- **Refer-to-friend link**: Shareable via SMS, email, social media
- **Tracking**: Unique deep links, track activation

**K-Factor Target**: Aim for 1.2-1.5
- Formula: `K = (% who receive invite) × (% conversion rate)`
- Example: 50% recipients × 30% convert = 0.15 K-factor → needs optimization

### Achievement Sharing (Viral Engine)
- **Milestone celebrations**: "Completed 30-day habit" → shareable card
- **Leaderboard moments**: Top-3 ranking animations (shareable)
- **Social proof**: Friend count on profile (publicly visible)
- **Native integration**: One-tap share to major platforms (no account required initially)

### Invite System
- Pre-filled email template: "Join me on Habit Garden"
- In-app referral code: Share `GARDEN2024` for instant PRO trial
- Gamification: "Invite 3 friends = unlock rare plant"
- Messaging option: Only PREMIUM users can send bulk invites (prevents spam)

---

## 4. COMMUNITY MODERATION & ANTI-ABUSE

### Reporting System Architecture

**Tiered Reporting**:
1. Flag content (automated review triggers)
2. Manual moderator review (within 24hrs)
3. Action: Warn → Mute → Temporary ban → Permanent ban

**Reportable Content Types**:
- Harassment/bullying
- Spam (repetitive links/ads)
- Self-harm/dangerous challenges
- Adult content
- Misinformation about habits

### Anti-Abuse Measures

| Layer | Implementation |
|-------|-----------------|
| **Automated** | Rate limiting (5 posts/10min), duplicate detection, keyword filters |
| **Human** | 24hr review queue, appeal process, community guidelines |
| **Community** | Encouragement to report abuse (notify helpers), upvote/downvote |
| **Account Safety** | Verify email on day 1, CAPTCHA after 3 failed report submissions |

### Prevent Reporting System Abuse
- Warn users after 3 false reports (5-day report cooldown)
- Permanent ban after 10+ false reports
- Log all reports for audit trail (legal protection)

### Moderation Tools
- Moderator dashboard: Filter by type, priority, user status
- Quick actions: Warn, shadow-ban, delete post, restrict account
- Analytics: Track abuse trends (spike detection)

---

## 5. IMPLEMENTATION PRIORITIES

### Phase 1 (MVP)
- [ ] Granular GDPR consent (EU targeting)
- [ ] Basic follow/share system (PRO-gated)
- [ ] User reporting + moderation queue
- [ ] Simple referral code system

### Phase 2
- [ ] Achievement sharing cards
- [ ] Leaderboards (PRO-gated)
- [ ] Automated spam detection
- [ ] Email verification flow

### Phase 3
- [ ] Messaging system (PREMIUM)
- [ ] Private groups (PREMIUM)
- [ ] Advanced moderation dashboard
- [ ] Community guidelines enforcement

---

## TECHNICAL STACK RECOMMENDATIONS

**Consent Management**:
- OneTrust or Cookiebot (tracks per-feature consent)
- Fallback: Custom consent service in Supabase

**Moderation**:
- Perspective API (toxicity detection)
- Manual review queue in dashboard
- Audit logs table: `moderation_actions` (reporter, reported_user, action, timestamp)

**Data Privacy**:
- Verify Supabase EU data residency if targeting EU
- Implement data retention policies (archival after 90 days)
- Use row-level security (RLS) for user privacy

---

## UNRESOLVED QUESTIONS

1. **Messaging privacy**: Should PREMIUM users' messages be encrypted end-to-end or server-side encrypted?
2. **Leaderboard data exposure**: How much user data (location, achievements) is visible on public leaderboards?
3. **Community guidelines**: Should Habit Garden allow user-generated challenges, or only admin-curated ones?
4. **Moderation staffing**: Build internal team or hire external moderation service (cost/quality trade-off)?
5. **Cross-platform sharing**: When users share achievements to Instagram/Twitter, what data is exposed in the preview?

---

## SOURCES

- [12 Mobile App Monetisation Strategies for 2026 - Publift](https://www.publift.com/blog/app-monetization)
- [Freemium App Monetization Strategies - Adapty](https://adapty.io/blog/freemium-app-monetization-strategies/)
- [Complete GDPR Compliance Guide (2026-Ready) - SecurePrivacy](https://secureprivacy.ai/blog/gdpr-compliance-2026)
- [GDPR Consent Management: Requirements, Best Practices & Tools - SecurePrivacy](https://secureprivacy.ai/blog/gdpr-consent-management)
- [Viral Loops: How to Create One - Referral Rock](https://referralrock.com/blog/viral-loop/)
- [Mobile App Referral Program Guide - Viral Loops](https://viral-loops.com/blog/mobile-app-referral-program/)
- [7 Best Practices for Community Moderation - Utopia Analytics](https://www.utopiaanalytics.com/article/community-moderation)
- [Content Moderation Best Practices - Stream](https://getstream.io/blog/content-moderation-policy/)

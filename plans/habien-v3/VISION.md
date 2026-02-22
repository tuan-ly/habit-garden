# Habien v3 - Vision & Design

> **Mission**: Help people transform their identity through habits, then make the app unnecessary.
> **Supabase Project**: habien-v3 (id: nokkicjusrucrpnnbzlg, region: ap-southeast-1)
> **Git Branch**: feature/habien-3.0 (from feature/habien-2.0-phase-1)

---

## Core Philosophy

- **Identity-first, gamification-second**
- **App should make itself unnecessary** - habits become identity, no longer need tracking
- **Start impossibly small** (2-minute rule)
- **Discover intrinsic rewards** - transition from XP to personal meaning
- **Garden = mirror of inner self**, not a scoreboard

---

## v2 → v3 Shift

| Aspect | v2 | v3 |
|--------|----|----|
| Core loop | Water → XP → Level up | Reflect → Discover meaning → Identity shift |
| Motivation | Extrinsic (XP, streaks) | Intrinsic (feelings, identity) |
| Start | "Create plant, set goal" | "Who do you want to become?" |
| Difficulty | User picks, often too high | 2-minute rule, app guides small |
| Cue | None (waits for user) | Habit stacking + smart timing |
| Identity | Premium, week 8+ | FREE, day 1, foundation |
| Plant death | Moisture = 0, plant dies | Plants go DORMANT, always revivable |
| Endgame | Grind forever | Graduation (habit = identity, stop tracking) |
| XP display | Every action, prominent | Stats page only, de-emphasized |
| Social | None | Garden Neighbors (1-3 buddies, sunshine) |

---

## 5 New Systems

### 1. Identity-First Onboarding (FREE, Day 1)

```
Screen 1: "Who do you want to BECOME?"
Screen 2: Select identity [Reader] [Athlete] [Creator] [Mindful Person] [Custom]
Screen 3: "What's the smallest proof? (2-minute version)"
Screen 4: "After I _____, I will [tiny habit]" (anchor/habit stacking)
Screen 5: Seed appears → "Water it tomorrow by doing your tiny habit"
```

Identity woven into EVERYTHING: morning notifications, check-in headers, reflection prompts, plant labels, milestones.

### 2. Tiny Seed (2-Minute Rule)

- App actively guides users to scale DOWN when creating habits
- Commitment = the tiny version. Doing more = bonus, not requirement
- Check-in always binary (yes/no). Metrics optional.
- Progressive scaling suggested after 2 weeks of consistency

### 3. Anchors (Habit Stacking)

- Each plant has `anchor_habit` + `anchor_time`
- "After I [pour coffee], I will [read one page]"
- Notifications become contextual, not random
- Lightweight: just 2 fields on plants table

### 4. Reflection Engine (Intrinsic Reward Discovery)

| When | Prompt |
|------|--------|
| Week 1 | "How do you feel after doing this today?" |
| Week 2 | "What's different about days you do this vs don't?" |
| Week 3 | "What do you enjoy most about this?" |
| Week 4 | "If no one knew, would you still do it? Why?" |
| Day 30 | **"Why I Love This"** - aggregated reflection milestone |

### 5. Garden Neighbors (Minimum Social)

- Link with 1-3 people
- See simplified garden preview (visual only, no numbers)
- See if they showed up today (subtle green glow)
- ONE interaction: send "sunshine" (encouragement)
- No comparison. Positive-only. No social obligations.

---

## Garden Evolution

| v2 | v3 |
|----|----|
| Plants die | Plants go **dormant** (wilted, grey, revivable) |
| Moisture % visible | Plant visual state communicates everything |
| Growth = XP | Growth = time + consistency |
| Mature = bigger plant | **Established** = no longer needs daily watering |
| Random placement | **Identity zones** (clusters by identity) |

---

## Monetization v3

| Tier | Price | Features |
|------|-------|----------|
| **FREE "The Seed"** | $0 | 3 identities, 3 habits, FULL 4-laws engine, simple garden |
| **PRO "The Garden"** | $4.99/mo | Unlimited habits/identities, tiers 1-4, 5x5 garden + themes, analytics, weekly insights, advanced reflections, data export |
| **PREMIUM "The Sage"** | $9.99/mo | Buddies (1-3), AI coaching, tier 5 plants, 7x7+ garden, pattern recognition, family/team gardens |

**Key**: FREE tier is genuinely transformative. Not crippled. Users who transform → best evangelists → highest conversion.

---

## Progressive Disclosure (Time-Based)

```
Week 1:     1 identity, 1 plant, 1 anchor. One-tap check-in. One small pot.
Week 2-4:   Plant grows visually. Weekly reflection. 2nd identity option.
Month 2-3:  3rd slot. Optional metrics. "Why I Love This" milestone.
Month 3-6:  PRO relevant (analytics, themes). First "Established" ceremony.
Month 6+:   PREMIUM relevant (buddies, AI). "Graduation" concept.
```

---

## Implementation Phases

| Phase | Duration | Focus |
|-------|----------|-------|
| 0 | 1-2 weeks | Identity liberation: free + onboarding redesign |
| 1 | 2-3 weeks | 2-minute rule + anchors in plant creation |
| 2 | 2-3 weeks | XP de-emphasis + reflection engine |
| 3 | 2-3 weeks | Garden meaning (dormancy, established, identity zones) |
| 4 | 1-2 weeks | Monetization restructure |
| 5 | 2-3 weeks | Garden neighbors |

**Total: 10-16 weeks**

---

## Success Metrics

**Optimize**:
- Identity declaration rate (Day 1, target 90%+)
- 2-minute seed set rate (85%+)
- Day 30 return (40%+)
- "Why I Love This" completion (50%+)
- Graduation rate (habits → established)

**Anti-metrics** (do NOT optimize):
- DAU (10-second check-in is success)
- Time in app (not social media)
- XP earned per session
- Streak length as primary metric

---

## Database Changes Preview

New fields on `plants`:
- `anchor_habit TEXT` - "After I pour coffee"
- `anchor_time TIME` - approximate anchor time
- `tiny_seed TEXT` - 2-minute version of the habit
- `status` add 'dormant' and 'established' states

New tables:
- `reflection_prompts` - scheduled prompts by habit age
- `garden_neighbors` - buddy links
- `sunshine` - encouragement notifications

Existing tables to modify:
- `identities` - remove premium gate, add to onboarding flow
- `profiles` - de-emphasize XP in UI (data stays for analytics)

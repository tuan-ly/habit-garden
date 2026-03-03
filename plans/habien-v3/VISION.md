# Habien v3 - Fun First, Transform While Playing

> **Mission**: Build a habit garden so fun you open it every day, so smart it actually changes you.
> **Philosophy**: v2's game feel + v3's behavior science = a game that works.
> **Supabase Project**: habien-v3 (id: nokkicjusrucrpnnbzlg, region: ap-southeast-1)
> **Git Branch**: feature/habien-3.0 (from feature/habien-2.0-phase-1)

---

## 1. The Founder's Insight

"I've tried many ways to track habits but I always ignore them. So I want to build an app that at least reminds me I have habits I want to do. Looking at my garden with ancient trees that have been 'planted' for years -- that's satisfying."

This reveals the truth about habit apps: **nobody opens an app because it's good for them. They open it because it's fun.** The previous v3 vision tried to remove gamification in favor of psychology. That was wrong. The answer is not less fun -- it is fun that serves a deeper purpose.

### The v2.5 Principle

```
Keep everything that makes v2 fun.
Redirect the fun to reward behaviors that actually build habits.
Add psychology as REWARDS you earn, not LECTURES you endure.
```

---

## 2. What This Is NOT

Before defining what v3 is, here is what it is NOT:

- **NOT "identity-first, gamification-second"** -- Fun is first. Identity is earned through fun.
- **NOT "app should make itself unnecessary"** -- The app should be something you WANT to open for years. The ancient tree vision depends on long-term engagement.
- **NOT "XP de-emphasized"** -- XP stays visible, stays rewarding. But WHAT gives XP changes.
- **NOT "garden = mirror of inner self"** -- Garden = your game, your collection, your pride. It ALSO mirrors who you are becoming, but that happens naturally through play, not through philosophical framing.
- **NOT "start with 'who do you want to become?'"** -- Start with "plant your first seed." Identity emerges later as a reward.

---

## 3. Core Design Principles

### Principle 1: FUN FIRST

The app must be fun enough that someone opens it even on a bad day. Not because they "should" but because they want to see their garden, check their plants, collect XP, unlock things.

What "fun" means concretely:
- Beautiful isometric garden that grows over time
- Satisfying watering animation and sound
- XP rewards that feel good
- Levels that unlock new things
- Plant collection across 5 tiers
- Achievements to hunt for
- Decorations to place
- Weather bonuses that add variety
- The joy of watching something you built grow

### Principle 2: REDIRECT, DON'T REMOVE

Every v2 mechanic stays, but gets redirected:

| v2 Mechanic | v2 Rewards | v3 Redirected Rewards |
|-------------|-----------|----------------------|
| XP | Watering = XP | Watering + tiny seed completion + reflection = MORE XP |
| Streaks | Consecutive days | Consecutive days + anchor consistency bonus |
| Achievements | "Water 100 times" | "Water 100 times" + "Found your morning anchor" + "30 days as a Reader" |
| Levels | XP accumulation | XP accumulation (same), but unlocks include behavior tools |
| Plant tiers | Level-gated | Level-gated (same), higher tiers require proven consistency |
| Decorations | Level-gated | Level-gated + identity-themed decorations unlocked through behavior |

### Principle 3: PSYCHOLOGY AS REWARD

Every behavior science concept from Atomic Habits is implemented as something the user EARNS, not something they are forced to do:

| Psychology Concept | Old v3 (Lecture) | New v3 (Reward) |
|-------------------|-----------------|-----------------|
| Identity | Day 1 onboarding question | Achievement unlocked after 30+ days: "The app notices who you're becoming" |
| 2-Minute Rule | Forced tiny seed during creation | Optional "Easy mode" toggle that gives BONUS XP for consistency |
| Habit Stacking | Required anchor selection | Unlockable anchor system that gives XP bonuses when used |
| Reflection | Required weekly prompts | Optional reflection journal entries that give XP + unlock special achievements |
| Intrinsic Discovery | "Why I Love This" forced milestone | "Mirror Moment" -- surprise achievement when the app detects a pattern |

### Principle 4: THE ANCIENT TREE VISION

The long-term emotional hook is not XP, not streaks, not achievements. It is this:

**Looking at your garden 3 years from now and seeing a massive, beautiful ancient tree where you once planted a tiny seed.**

That tree represents time. It represents consistency. It represents who you became. No amount of money, hacking, or grinding can produce it. Only showing up, day after day, month after month, year after year.

This is the vision that keeps someone opening the app for years.

---

## 4. What Stays From v2 (Unchanged)

These systems work. Do not touch them:

- **Isometric garden** with zoom/pan and tile placement
- **XP system** with 15 levels and exponential scaling
- **Weather system** with daily bonuses
- **Water reserves** for streak protection
- **Achievement system** (will be extended, not replaced)
- **Decoration system** with level-based unlocks
- **Plant movement** and garden layout customization
- **One-tap watering** as the core interaction
- **Moisture decay** system (but see dormancy changes below)
- **Rest days** mechanic
- **Streak tracking** and celebration
- **Level-up modal** with confetti
- **Game-style HUD and navigation**
- **PWA** support

---

## 5. What Changes From v2

### 5.1 Plants Go Dormant, Never Die

**The problem**: Plant death punishes users for being human. A user who misses a week due to illness, travel, or life comes back to find dead plants. This creates avoidance -- they stop opening the app because they do not want to see the damage.

**The change**:
- Moisture reaches 0 --> plant enters **dormant** state (wilted, grey, but alive)
- Dormant plants can be **revived** with one watering
- Revival triggers a small celebration: "Welcome back! [Plant name] missed you."
- Revival gives a burst of XP (reward returning, not punish leaving)
- Dormant plants do NOT lose their growth progress. A 6-month-old plant that goes dormant for 2 weeks wakes up as a 6-month-old plant, not a seedling.

**Visual**: Dormant plants look asleep -- grey/muted colors, droopy posture, maybe a few ZZZ particles. Not dead, not ugly. Just waiting.

**Why this matters for the ancient tree vision**: If plants could die, users would lose years of progress. That destroys the emotional hook. Dormancy means your ancient trees are safe no matter what happens in your life.

### 5.2 Extended Growth Stages (The Ancient Tree System)

This is the centerpiece of v3. Plants grow FAR beyond "mature."

**Current v2 stages**: seed --> sprout --> growing --> mature --> legendary

**New v3 stages**:

```
STAGE           TIME            VISUAL DESCRIPTION
-------         ----            ------------------
Seed            Day 1-3         Tiny seed in soil. Barely visible.

Sprout          Day 4-7         Small green shoot. Delicate.

Growing         Day 8-30        Recognizable plant. Leaves developing.
                                Getting its characteristic shape.

Mature          Day 31-90       Full-sized plant. Beautiful.
                                This is where v2 stopped for most plants.

Established     Day 91-180      Plant is now a fixture. Slightly larger.
                                Richer colors. Small environmental effects
                                (butterflies, glow, subtle particles).
                                REDUCED watering need (every 2-3 days OK).

Venerable       Day 181-365     Noticeably bigger than established.
                                Unique visual details appear (flowers,
                                fruit, special bark patterns).
                                Environmental effects expand.
                                Affects nearby tiles (shade, moss, etc).

Ancient         Year 1-3        Significantly larger. Takes up visual
                                prominence in the garden. Rich detail.
                                Seasonal visual changes (spring blossoms,
                                autumn colors, winter frost patterns).
                                Small creatures appear around it.
                                OTHER plants near it grow slightly faster
                                ("ancient tree aura" mechanic).

Legendary       Year 3+         Massive, awe-inspiring presence.
                                Unique one-of-a-kind visual per plant type.
                                Custom particle effects. Garden landmark.
                                Practically a monument to consistency.
                                Achievement: "A tree older than most apps."
```

**Key design rules for growth stages**:

1. **Growth is time + consistency, not XP.** You cannot buy or grind your way to an ancient tree. You must show up over time. Days where you water the plant count. Days where you do not, the plant pauses (does not decay, just pauses growth timer).

2. **Each stage has a celebration.** Reaching Established, Venerable, Ancient, and Legendary all trigger special celebrations with unique animations. These are major achievements.

3. **Visual quality increases dramatically at higher stages.** The art investment goes into the later stages. Seed through Mature can use the existing art. Established through Legendary need new, beautiful, detailed art that makes users want to screenshot and share.

4. **Ancient and Legendary plants affect the garden.** They cast shade (visual), attract creatures (butterflies, birds, fireflies), and create an "aura" that gives nearby plants a small growth bonus. This makes the garden feel like a living ecosystem, not just a grid of independent plants.

5. **Reduced watering need at higher stages mirrors real habit internalization.** An Established plant only needs watering every 2-3 days. A Venerable plant every 3-5 days. An Ancient plant once a week. A Legendary plant is self-sustaining -- it just exists, beautiful and permanent, like a habit you no longer think about. (You CAN still water it for XP, but missing a week does not cause dormancy.)

### 5.3 The "Tiny Seed" System (2-Minute Rule as Game Mechanic)

Instead of forcing users to declare a tiny habit during creation, make it a toggle:

**Plant creation flow** (stays similar to v2):
```
1. Choose plant type
2. Name your habit ("Read books", "Exercise", etc.)
3. NEW: Optional "Easy Mode" toggle
   [Easy Mode: ON]
   "Set a 2-minute version of this habit.
    Complete just this to count as watered."
   Example: "Read one page" / "Do 1 pushup"

   Bonus: Easy Mode plants give +20% XP for first 30 days
   (rewarding the user for starting small)
```

**Why a toggle, not forced**: Some users know exactly what they want and how much. Forcing everyone through a 2-minute rule lecture during creation is friction. Making it optional with a bonus incentivizes it without mandating it.

**The XP bonus is the key**: Users discover that Easy Mode is not "baby mode" -- it is the smart mode that gives MORE rewards. This is psychology-as-game-mechanic.

### 5.4 Anchors (Habit Stacking as Unlockable Feature)

**Unlock**: Available after Level 3 (about 2-3 weeks of use).

When unlocked, a new option appears on each plant's detail sheet:

```
Set Anchor (NEW!)
"Link this habit to something you already do."

"After I _________, I will [habit name]."

Suggested anchors:
  [After I wake up]
  [After I brush my teeth]
  [After I pour my coffee]
  [After I sit at my desk]
  [After I eat lunch]
  [After I get home from work]
  [Custom...]

Benefit: Anchor Streak Bonus
  When you check in within 1 hour of your anchor time
  for 7+ days, you earn the "Anchored" achievement
  and get a permanent +10% XP bonus for this plant.
```

**Why unlockable, not day-1**: New users are already learning the app. Adding anchors on day 1 is cognitive overload. By Level 3, they understand the basics and are ready for a new tool.

**Why XP bonus**: The anchor actually helps them remember to do the habit. The XP bonus rewards them for using a tool that helps them. Win-win.

### 5.5 Reflection as XP Source

Reflection prompts appear as optional journal entries. They give XP.

**Unlocked at**: Level 4 (about 3-4 weeks).

```
Reflection Journal (NEW!)

A new prompt appears weekly in your plant's detail view:

Week 1: "How did you feel after doing this today?" (+15 XP)
Week 2: "What's different about days you do this vs don't?" (+15 XP)
Week 3: "What do you enjoy most about this habit?" (+20 XP)
Week 4: "If no one knew, would you still do it? Why?" (+25 XP)

Completing all 4: "Why I Love This" Achievement
  + special plant decoration (journal book icon near plant)
  + 100 bonus XP
```

**Why XP, not forced**: Users who skip reflections lose nothing. Users who do them get XP AND build self-awareness. The XP incentivizes the first few reflections; the self-awareness keeps them doing more.

### 5.6 Identity as Earned Achievement (NOT Onboarding)

This is the biggest philosophical change from the old v3 vision.

**Old v3**: "Who do you want to become?" on Day 1. Identity drives everything.

**New v3**: Identity is DISCOVERED, not DECLARED. The app notices patterns and reflects them back.

**How it works**:

```
MIRROR MOMENTS (Surprise Identity Achievements)

The app tracks your habits silently. When patterns emerge,
it surfaces "Mirror Moments" -- surprise achievements that
reflect back who you are becoming.

Examples:

Day 30 of reading consistently:
  "Mirror Moment: 30 days of reading.
   You're not just someone who reads sometimes.
   You're becoming a Reader."
  Achievement: "The Reader Emerges" (+50 XP)
  Unlocks: Reader identity badge for your profile

Day 60 of exercising:
  "Mirror Moment: 60 days of movement.
   This isn't a challenge anymore. This is just you.
   You're an Athlete."
  Achievement: "The Athlete Emerges" (+100 XP)
  Unlocks: Athlete identity badge for your profile

Day 90 of multiple reading-related habits:
  "Mirror Moment: 3 habits, all about learning.
   Reading, note-taking, and podcasts.
   You've built a system. You're a Lifelong Learner."
  Achievement: "The Learner Emerges" (+150 XP)
  Unlocks: Learner identity badge + themed garden zone
```

**Identity badges** appear on your profile and can optionally be shown in your garden (as a small banner or flag near your identity-related plants).

**Identity zones**: When you have 3+ plants related to the same identity (e.g., "Read books", "Take notes", "Visit library" all tagged as "Reader"), the garden can auto-group them into a zone with a themed background. This is a PRO feature -- beautiful, collectible, and earnable.

**Why this works better than day-1 declaration**:
1. No friction on day 1. Users just plant and water.
2. The surprise achievement feels magical -- "the app sees me."
3. Identity is backed by EVIDENCE (30+ days), not wishful thinking.
4. Users who never get a mirror moment still have a fully functional, fun app.
5. The achievement triggers genuine emotion because it was earned, not declared.

### 5.7 Struggle-Aware System

Life happens. The app should acknowledge it, not pretend it does not.

**Welcome Back System**:
When a user returns after 3+ days of absence:
```
"Welcome back! Your garden has been waiting for you.

[Plant name] is a little sleepy, but happy to see you.

No judgment. No guilt. Let's water one plant and call it a win.

[Water a plant]"

Bonus: "Welcome Back" XP bonus (+25 XP for first water after absence)
```

**Permission to Rest**:
When the app detects a pattern of declining check-ins (3+ plants behind, missed 3+ days in a week):
```
"Hey. Your garden senses you might need a breather.

It's okay. Even gardens have winters.

Want to:
[Put some plants to sleep] (manually dormant, no decay)
[Take a rest day]
[I'm fine, just busy]"
```

**Life Change Detection**:
When a dramatic pattern break happens (was daily for 60+ days, then suddenly stops for 7+ days):
```
"Something changed.

You were checking in every day for [X] days.
Then life happened.

Whatever it is, your garden is still here.
Your [Ancient Oak] has been growing for 247 days.
It's not going anywhere.

When you're ready: [Water one plant]
No rush."
```

**The key principle**: Never make the user feel bad. Every message is warm, welcoming, and forward-looking. The XP bonus for returning rewards the behavior we want (coming back) instead of punishing the behavior we do not want (leaving).

---

## 6. The Ancient Tree Vision (Long-Term Design)

This section describes what the garden looks and feels like over time. This is the emotional core of the app.

### 1 Week: The New Garden

```
A mostly empty 3x3 plot.
One small pot with a tiny sprout.
Clean soil, simple fence.
The user sees potential, not emptiness.
"This is the beginning."
```

### 1 Month: First Growth

```
2-3 plants, all in the Growing stage.
The garden has life -- green leaves, small flowers.
First decoration or two placed.
The plants are recognizable (a dandelion, a succulent).
"Hey, this is starting to look like something."
```

### 3 Months: The Small Garden

```
3-5 plants. Some reaching Mature.
The first Mature plant is a moment of pride.
Garden may have expanded to 5x5 (PRO).
Decorations create a personal feel.
First weather effects and seasonal changes visible.
"I have a garden. This is mine."
```

### 6 Months: The Living Garden

```
5-8 plants at various stages.
First Established plant -- noticeably different from Mature.
Butterflies appear around the Established plant.
The garden feels layered -- different heights, textures.
Maybe the first Tier 3 or Tier 4 plant is growing.
"I'm proud of this garden."
```

### 1 Year: The Meaningful Garden

```
Multiple Established plants. One or two Venerable.
The Venerable plants are larger, richer, more detailed.
They affect their surroundings (shade patterns, moss).
The garden has depth -- you can see the history in the layers.
Early plants are big and beautiful. New plants are small and fresh.
"This garden tells my story."
```

### 2 Years: The Ancient Garden

```
First Ancient tree appears.
It dominates the garden visually. Tall, detailed, alive.
Small creatures (birds, butterflies, fireflies at night).
Seasonal changes are beautiful on the ancient tree.
Other plants cluster around it, thriving in its aura.
The garden is no longer a grid -- it feels like a PLACE.
"I built this over two years. No one else has this exact garden."
```

### 3+ Years: The Legendary Garden

```
The Ancient tree becomes Legendary.
Unique, one-of-a-kind visual.
The garden is a LANDSCAPE, not a plot.
Multiple ancient trees create a canopy.
The isometric view shows depth, layers, life.
Screenshots get shared on social media.
"This is who I am, rendered in plants and time."
```

### Why This Creates Years of Engagement

1. **No ceiling**: There is always a next stage. Even at Legendary, the garden keeps evolving with new plants.
2. **Irreplaceable**: You cannot restart and get this. It took years. Switching apps means losing your ancient trees.
3. **Personal**: No two gardens look alike after a year. The combination of plant types, placements, and growth stages is unique.
4. **Shareable**: Beautiful gardens get screenshotted and shared. This is organic marketing.
5. **Emotional**: The ancient tree is not data -- it is a FEELING. "I did this. Every day, for years."

---

## 7. Garden Neighbors (Social Layer)

### Design: Minimum Viable Social

- Link with 1-3 people (invite code)
- See simplified garden preview (visual only, no metrics)
- See if they showed up today (subtle green glow on garden)
- ONE interaction: send "sunshine" (encouragement notification)
- See milestone celebrations ("Your buddy hit 100 days!")
- No leaderboards. No comparison. No messaging.

### Why This Specific Design

1. Leaderboards create "I'm worse than everyone" anxiety
2. Full messaging creates moderation burden for solo dev
3. Public profiles create performance pressure
4. Sunshine is positive-only: you can encourage, never criticize
5. Knowing someone is watching (benevolently) increases follow-through by 65%+
6. Buildable in 2-3 weeks

### PREMIUM Feature

Garden Neighbors is gated to PREMIUM because:
- It requires real-time/near-real-time data sync
- It has ongoing server cost (presence, notifications)
- It is a genuine value-add, not a core mechanic
- Users at the PREMIUM stage (months of use) are the right audience for social features

---

## 8. Monetization

### Philosophy: Sell More Garden, Not Core Habits

The core habit loop (plant, water, grow, streaks, XP, basic achievements) must be fully functional and fun for free. Payment unlocks MORE -- more plants, more garden, more beauty, more social, more intelligence.

### Tier Structure

#### FREE -- "The Seed" ($0)

| Feature | Details |
|---------|---------|
| Plant slots | 3 |
| Plant tiers | Tier 1-2 |
| Garden size | 3x3 |
| Growth stages | All (seed through Legendary) |
| XP/Levels | Full, levels 1-10 |
| Streaks | Full |
| Achievements | 15 basic achievements |
| Watering | Full one-tap |
| Weather bonuses | Full |
| Water reserves | 3 |
| Rest days | 1/week/plant |
| Easy Mode (2-min rule) | Full |
| Anchors | Full (unlocks at L3) |
| Reflection journal | Basic prompts (unlocks at L4) |
| Mirror Moments | Full (identity discovery) |
| Dormancy/Revival | Full |
| Decorations | Basic set |
| Struggle-aware system | Full |

**Why this works**: 3 habits with full game mechanics is genuinely enough for real habit change. The user has fun, builds habits, sees ancient trees grow. They upgrade because they LOVE the app, not because they hit a wall.

#### PRO -- "The Garden" ($4.99/mo or $47.99/yr)

| Feature | Details |
|---------|---------|
| Everything in Free | + |
| Plant slots | 8 |
| Plant tiers | Tier 1-4 (Life Companions) |
| Garden size | 5x5 |
| Level cap | 15 |
| Achievements | Full set (30+) |
| Garden themes | 5 visual themes |
| Advanced decorations | Full set |
| Goals system | 5 active goals with metrics |
| Weekly insights | Consistency patterns, best days |
| Advanced reflections | Deeper prompts, CBT-informed |
| Identity zones | Themed grouping for identity plants |
| Water reserves | 7 |
| Rest days | 2/week/plant |
| Backfill watering | 3 days |
| XP multiplier | 1.2x |
| Data export | CSV |
| No ads | |

**Upgrade trigger**: User hits 3-plant limit and wants more, OR reaches Level 6 and goals unlock naturally, OR falls in love with the garden and wants themes.

#### PREMIUM -- "The Sage" ($9.99/mo or $95.99/yr)

| Feature | Details |
|---------|---------|
| Everything in Pro | + |
| Plant slots | Unlimited |
| Plant tiers | Tier 5 (Garden Legends) |
| Garden size | 7x7+ dynamic |
| Level cap | 20+ |
| All themes + customs | |
| Premium decorations | Animated, interactive |
| Garden Neighbors | 1-3 accountability buddies |
| Sunshine system | Send/receive encouragement |
| AI coaching nudges | Pattern-based suggestions |
| Advanced pattern recognition | "You break streaks after weekends" |
| Year in Review | Transformation story |
| Water reserves | 14 |
| Rest days | 3/week/plant |
| Backfill watering | 7 days |
| XP multiplier | 1.5x |
| Priority support | |
| Early access | New features first |

**Upgrade trigger**: User is deeply engaged (months of use), wants social accountability, wants the most beautiful garden possible, wants AI insights.

### Monetization Guardrails

1. **Never block the core loop.** Free users can plant, water, grow, earn XP, and build habits without friction.
2. **Never create anxiety to sell.** No countdown timers, no "your plant is dying, pay to save it," no manufactured scarcity.
3. **Upgrade prompts at natural moments.** Hit plant limit, hit level cap, hit a milestone. Not random popups.
4. **30-day money-back guarantee.** No questions asked.
5. **Pause feature** for PRO/PREMIUM: up to 3 months/year without charge.

---

## 9. Implementation Roadmap (Incremental from v2)

### Approach: Evolve, Do Not Rebuild

The existing v2 codebase is solid. The database schema supports most changes with minor additions. The changes are primarily:

1. Add new plant growth stages (DB + art + UI)
2. Add dormancy mechanic (replace death)
3. Add tiny seed, anchor, reflection features (new fields + UI)
4. Add mirror moments (achievement system extension)
5. Add struggle-aware messages (UI layer)
6. Add garden neighbors (new tables + UI)

### Phase 0: Dormancy + Extended Growth (2-3 weeks)

**Goal**: Remove plant death, add dormancy. Extend growth stages beyond Mature.

- Replace plant death with dormancy mechanic
- Add `dormant` status to plants
- Add welcome-back flow for returning users
- Add `established` stage (Day 91-180) with visual treatment
- Add growth timer (days of consistency, not XP-based)
- Update plant visuals for Established state
- Add Established ceremony/celebration

**Database changes**:
- `plants.status`: add 'dormant' value
- `plants.growth_days`: INTEGER tracking total days of consistency
- `plants.last_growth_date`: DATE of last counted day

**Impact**: Removes biggest pain point (plant death), adds the first taste of the ancient tree vision.

### Phase 1: Tiny Seed + Anchors (2-3 weeks)

**Goal**: Add 2-minute rule and habit stacking as optional, rewarded features.

- Add Easy Mode toggle to plant creation flow
- Add `tiny_seed` field to plants table
- Add Easy Mode XP bonus (+20% for first 30 days)
- Add Anchor feature (unlocks at Level 3)
- Add `anchor_habit`, `anchor_time` fields to plants
- Add Anchor Streak Bonus mechanic (+10% permanent XP)
- Add "Anchored" achievement

**Database changes**:
- `plants.tiny_seed`: TEXT (2-minute version)
- `plants.easy_mode`: BOOLEAN
- `plants.anchor_habit`: TEXT
- `plants.anchor_time`: TIME

**Impact**: Addresses "Make it Easy" (Law 3) and "Make it Obvious" (Law 1) from Atomic Habits. Both are rewarded with XP, not forced.

### Phase 2: Reflection + Mirror Moments (2-3 weeks)

**Goal**: Add reflection journal and identity discovery as XP-rewarded activities.

- Add weekly reflection prompts (unlocks at Level 4)
- Add reflection XP rewards
- Add "Why I Love This" milestone achievement
- Add Mirror Moment system (identity discovery achievements)
- Add identity badges to profile
- Create trigger system: detect patterns --> surface Mirror Moments

**Database changes**:
- `reflection_prompts`: new table (prompt text, plant age trigger, XP reward)
- `plant_reflections`: new table (plant_id, prompt_id, response, created_at)
- `identity_badges`: new table (user_id, badge_name, earned_at, plant_ids)

**Impact**: Adds intrinsic reward discovery without removing extrinsic rewards. Identity emerges naturally.

### Phase 3: Advanced Growth Stages (3-4 weeks)

**Goal**: Add Venerable, Ancient, and Legendary stages with art and environmental effects.

- Commission/create art for Venerable, Ancient, Legendary stages
- Implement environmental effects (creatures, shade, aura)
- Implement ancient tree aura mechanic (nearby plant growth boost)
- Implement reduced watering requirements for higher stages
- Add seasonal visual changes for Ancient+ plants
- Add celebration ceremonies for each new stage
- Add "Ancient Tree" and "Legendary Garden" achievement categories

**Art requirements** (most significant investment):
- Each plant type needs Venerable, Ancient, Legendary variants
- Start with Tier 1-2 plants (most common)
- Tier 3-5 can come later

**Impact**: This is the ancient tree vision made real. The most emotionally impactful phase.

### Phase 4: Struggle-Aware System (1-2 weeks)

**Goal**: Add compassionate messaging for returning users and struggling users.

- Welcome Back flow (3+ days absence)
- Welcome Back XP bonus
- Permission to Rest prompt (declining check-in pattern)
- Manual dormancy (user puts plants to sleep)
- Life Change Detection (dramatic pattern break)
- Warm, non-judgmental copy for all messages

**No database changes needed** -- uses existing activity_logs and watering_logs for pattern detection.

**Impact**: Prevents the guilt spiral that kills retention. Users who leave COME BACK instead of uninstalling.

### Phase 5: Monetization Adjustment (1-2 weeks)

**Goal**: Restructure tiers to match v3 philosophy.

- Move identity from PREMIUM-only to discoverable-for-all (Mirror Moments are free)
- Add Identity Zones as PRO feature
- Add Goals system as PRO feature (unchanged from current)
- Update upgrade prompts to match new value proposition
- Update pricing page copy
- Add pause feature for paid tiers
- Add 30-day guarantee messaging

**Impact**: Monetization aligns with fun-first philosophy. Core is free and fun, paid is more beauty and depth.

### Phase 6: Garden Neighbors (2-3 weeks)

**Goal**: Add minimum viable social layer.

- Build garden_neighbors invite system
- Build garden preview (simplified visual of neighbor's garden)
- Build presence indicator (showed up today glow)
- Build sunshine system (one-tap encouragement)
- Build milestone notifications ("Your buddy hit 100 days!")
- Gate behind PREMIUM tier

**Database changes**:
- `garden_neighbors`: new table (user_id, neighbor_id, invite_code, status)
- `sunshine`: new table (from_user_id, to_user_id, sent_at)

**Impact**: Adds gentle social accountability without social media toxicity.

### Total Timeline

| Phase | Duration | Priority |
|-------|----------|----------|
| 0: Dormancy + Extended Growth | 2-3 weeks | **Critical** |
| 1: Tiny Seed + Anchors | 2-3 weeks | High |
| 2: Reflection + Mirror Moments | 2-3 weeks | High |
| 3: Advanced Growth Stages | 3-4 weeks | High (art-dependent) |
| 4: Struggle-Aware System | 1-2 weeks | Medium |
| 5: Monetization Adjustment | 1-2 weeks | Medium |
| 6: Garden Neighbors | 2-3 weeks | Lower |

**Total: 13-20 weeks for a solo developer.**

Phase 3 (Advanced Growth Stages) can run in parallel with other phases since it is primarily an art + visual rendering task. The game mechanics for growth work from Phase 0.

---

## 10. XP System Adjustments

The XP system stays but gets new sources:

### Current XP Sources (Keep All)

| Action | XP | Notes |
|--------|-----|-------|
| Daily watering | 10 | Core mechanic |
| Watering note | 5 | Optional note |
| Weather bonus | 2-5 | Daily variety |
| Streak bonus | varies | Consistency reward |

### New XP Sources (Add)

| Action | XP | Phase |
|--------|-----|-------|
| Easy Mode daily completion | +2 (20% bonus) | Phase 1 |
| Anchor check-in (within window) | +3 | Phase 1 |
| Weekly reflection | 15-25 | Phase 2 |
| "Why I Love This" completion | 100 | Phase 2 |
| Mirror Moment earned | 50-150 | Phase 2 |
| Welcome Back water | 25 | Phase 4 |
| Plant reaching Established | 200 | Phase 0 |
| Plant reaching Venerable | 500 | Phase 3 |
| Plant reaching Ancient | 1000 | Phase 3 |
| Plant reaching Legendary | 2500 | Phase 3 |

### New Achievements (Add)

| Achievement | Trigger | XP |
|-------------|---------|-----|
| "Tiny but Mighty" | Complete 7 days of Easy Mode | 30 |
| "Anchored" | 7-day anchor streak | 50 |
| "The Journal" | Complete 4 weekly reflections for one plant | 100 |
| "Why I Love This" | Write all 4 reflection prompts | 100 |
| "The Reader Emerges" | Mirror Moment: 30 days of reading habit | 50 |
| "Welcome Back" | Return after 3+ day absence | 25 |
| "The Dormant Revival" | Revive a dormant plant | 30 |
| "The Established One" | First plant reaches Established | 200 |
| "The Ancient Gardener" | First plant reaches Ancient | 1000 |
| "Living Legend" | First plant reaches Legendary | 2500 |
| "The Ancient Forest" | 3+ Ancient trees in garden | 2000 |
| "Decade Garden" | Any plant reaches 3650 growth days | 10000 |
| "Sunshine Sender" | Send sunshine to a neighbor | 20 |

---

## 11. Database Changes Summary

### Modified Tables

```sql
-- plants: add growth tracking and new states
ALTER TABLE plants ADD COLUMN growth_days INTEGER DEFAULT 0;
ALTER TABLE plants ADD COLUMN last_growth_date DATE;
ALTER TABLE plants ADD COLUMN tiny_seed TEXT;
ALTER TABLE plants ADD COLUMN easy_mode BOOLEAN DEFAULT false;
ALTER TABLE plants ADD COLUMN anchor_habit TEXT;
ALTER TABLE plants ADD COLUMN anchor_time TIME;
-- status enum: add 'dormant', keep all existing values
-- visual_stage enum: add 'established', 'venerable', 'ancient'
-- (legendary already exists)
```

### New Tables

```sql
-- Reflection prompts library
CREATE TABLE reflection_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_text TEXT NOT NULL,
  plant_age_days INTEGER NOT NULL, -- when to show (7, 14, 21, 28)
  xp_reward INTEGER DEFAULT 15,
  category TEXT DEFAULT 'discovery', -- 'discovery', 'intrinsic', 'identity'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User reflections on plants
CREATE TABLE plant_reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plant_id UUID REFERENCES plants(id) ON DELETE CASCADE,
  prompt_id UUID REFERENCES reflection_prompts(id),
  response TEXT NOT NULL,
  xp_awarded INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(plant_id, prompt_id) -- one response per prompt per plant
);

-- Identity badges (earned through Mirror Moments)
CREATE TABLE identity_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_name TEXT NOT NULL, -- "Reader", "Athlete", "Learner", etc.
  badge_icon TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  trigger_type TEXT NOT NULL, -- 'mirror_moment', 'achievement', 'manual'
  plant_ids UUID[] DEFAULT '{}', -- plants that contributed to this badge
  is_displayed BOOLEAN DEFAULT true
);

-- Garden neighbors
CREATE TABLE garden_neighbors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  neighbor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invite_code TEXT UNIQUE,
  status TEXT DEFAULT 'pending', -- 'pending', 'active', 'removed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, neighbor_id)
);

-- Sunshine encouragements
CREATE TABLE sunshine (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 12. Success Metrics

### Primary Metrics (Fun + Behavior Change)

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Day 7 retention | 60%+ | Is the app fun enough to keep opening? |
| Day 30 retention | 40%+ | Are habits forming? |
| Day 90 retention | 25%+ | Are habits sticking? |
| Plants reaching Established | 30%+ | Real habit internalization |
| Mirror Moment trigger rate | 20%+ of 30-day users | Is identity discovery working? |
| Average session time | 30-60 seconds | Quick, fun, not a time sink |
| XP earned from new sources | 15%+ of total XP | Are new mechanics being used? |

### Engagement Metrics (Is It Fun?)

| Metric | Target | Why |
|--------|--------|-----|
| Garden screenshot shares | Track any | Organic marketing signal |
| Decorations placed per user | 3+ by month 2 | Garden customization = investment |
| Plants attempted at higher tiers | 40%+ of L7 users | Progression desire |
| Voluntary reflection completion | 30%+ when prompted | Users find reflections valuable |
| Easy Mode adoption | 40%+ of new plants | 2-minute rule is attractive |
| Anchor adoption (L3+) | 50%+ of eligible users | Habit stacking is useful |

### Revenue Metrics

| Metric | Target | Why |
|--------|--------|-----|
| Free-to-PRO conversion | 8-12% of 30-day retained | Sustainable business |
| PRO-to-PREMIUM conversion | 15-20% of PRO users | Depth demand |
| Annual plan rate | 30%+ of subscribers | Commitment signal |
| Monthly churn | < 8% | Retention health |
| 30-day refund rate | < 5% | Value delivery |

### Anti-Metrics (Do NOT Optimize)

| Metric | Why NOT |
|--------|---------|
| DAU as primary KPI | A 30-second session is SUCCESS |
| Time in app | This is not social media |
| Number of plants created | Quality over quantity |
| Streak length as north star | Creates anxiety; consistency rate is healthier |
| Feature adoption rate | Not every user needs every feature |

### The North Star Metric

**Plants that reach the Ancient stage (1+ year of consistency).**

This single metric captures everything: the user had fun (kept opening the app), built a real habit (365+ days), and experienced the ancient tree vision that makes the app irreplaceable.

---

## 13. Risks and Mitigations

| Risk | Severity | Mitigation |
|------|----------|------------|
| Art for Advanced Growth Stages is expensive/slow | High | Start with 5 most popular plant types. Use procedural effects (particles, glow, color shifts) to differentiate stages before custom art is ready. |
| Users miss old XP popups after Phase 0-2 | Medium | XP popups are NOT removed. They stay. New XP sources ADD to the visible rewards, not replace them. |
| Dormancy makes the app feel "too easy" | Low | Dormancy replaces DEATH, not challenge. Plants still wilt, still look sad. The user still sees the consequence. They just do not lose years of progress. |
| Mirror Moments feel creepy/surveillance-like | Medium | Frame as "your garden noticed" not "we tracked you." Keep language warm and garden-themed. Make all data processing local/transparent. |
| Solo dev timeline slips | High | Each phase ships independently. Phase 0 alone is a major improvement. If only Phase 0-1 ships, the app is already meaningfully better. |
| Free tier too generous, no conversion | Medium | Monitor. Duolingo/Headspace evidence suggests generous free tiers INCREASE conversion. The limit (3 plants) creates natural desire for more once the user is invested. |
| Advanced growth stages need too many art assets | High | Phase approach: Established uses color/particle overlay on existing Mature art. Venerable adds small detail props. Ancient and Legendary are the only ones needing full new art per plant type, and those can ship plant-by-plant over months. |

---

## 14. Summary: v2 vs v3

| Aspect | v2 | v3 |
|--------|----|----|
| Philosophy | Fun game | Fun game that builds real habits |
| Core loop | Water --> XP --> Level up | Water --> XP + anchor + reflect --> Level up + identity |
| XP | Visible, core mechanic | Visible, core mechanic + NEW sources |
| Identity | PREMIUM feature, L13 | Earned achievement, any tier, triggered by consistency |
| Plant death | Moisture = 0, dead | Moisture = 0, dormant (revivable) |
| Growth ceiling | Mature / Legendary | Established --> Venerable --> Ancient --> Legendary |
| Long-term hook | More plants, higher tier | Ancient trees: years of consistency made visible |
| Behavior science | Absent (Law 4 only) | All 4 Laws, but as XP-rewarded optional features |
| Social | None | Garden Neighbors (1-3 buddies, PREMIUM) |
| Struggle handling | Plant dies, user quits | Welcome Back bonus, permission to rest, warmth |
| Onboarding | "Create plant, set goal" | "Plant your first seed" (simple), identity comes later |
| Endgame | Grind for XP | Watch your ancient forest grow, year after year |

### The One-Sentence Pitch

**Habien v3: A garden game where every plant you grow represents a real habit, and the trees get more beautiful the longer you keep going -- for years.**

---

*Document created: 2026-02-22*
*Replaces previous VISION.md (identity-first approach)*
*Author: Habien Team + Claude*

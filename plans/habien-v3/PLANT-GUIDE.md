# Habien v3 -- Plant Selection Guide

> **Version**: 1.0
> **Date**: 2026-02-22
> **Status**: Design Document (Pre-Implementation)
> **Context**: Each plant type represents a "habit personality." 1 habit = 1 plant for life.
> **Growth Model**: 8 stages (Seed through Legendary) spanning potentially years.
> **Related**: [VISION.md](VISION.md) | [v2 Plant Catalog](../goal-feature-uiux-design/plant-designs/PLANT_CATALOG.md)

---

## How This Relates to the v2 Plant Catalog

The v2 catalog defines 32 plants across 5 tiers. That system treats plants as a **collection game** -- users gather many plants, each matures in days/weeks, and difficulty = tier.

The v3 plant system is fundamentally different:

| Aspect | v2 Catalog | v3 Plant Guide |
|--------|-----------|----------------|
| Number of types | 32 | 9 |
| Plants per habit | Many plants, many habits | **1 plant = 1 habit for life** |
| Growth timeline | 5-365 days to mature | Years to reach Legendary |
| Differentiation | Difficulty tier + unique mechanic | **Habit personality** -- growth pattern, resilience, emotional arc |
| Selection moment | "Pick a cool plant" | "What kind of habit is this?" (meaningful choice) |
| Art per type | 5-6 stages | **8 stages** (more visual depth, fewer types) |

**The v3 system replaces the v2 catalog for new habit creation.** Existing v2 plants can be grandfathered as cosmetic variants within the 9 core types.

---

## Table of Contents

1. [Part 1: Plant Types (9 Types)](#part-1-plant-types)
2. [Part 2: Selection Criteria](#part-2-selection-criteria)
3. [Part 3: Question-Based Selection Flow](#part-3-question-based-selection-flow)
4. [Part 4: Rebirth System](#part-4-rebirth-system)
5. [Implementation Notes](#implementation-notes)

---

# Part 1: Plant Types

## Overview Matrix

| # | Plant | Vietnamese | Growth Pattern | Resilience | Time to First Result | Best For |
|---|-------|-----------|---------------|------------|---------------------|----------|
| 1 | Bamboo | Tre | Delayed explosive | High | 90 days (underground) | Patient, transformative habits |
| 2 | Sunflower | Hoa huong duong | Fast linear | Low | 3 days | Quick-win, visible habits |
| 3 | Oak | Cay soi | Slow compound | Very High | 14 days | Foundational, lifelong habits |
| 4 | Cactus | Xuong rong | Slow steady | Indestructible | 7 days | Low-frequency, resilient habits |
| 5 | Lotus | Hoa sen | Transformative | Medium | 21 days | Difficult habits, personal change |
| 6 | Bonsai | Cay bonsai | Precision | Medium-Low | 7 days | Quality-focused, craft habits |
| 7 | Cherry Blossom | Hoa anh dao | Burst-rest cycles | Medium | 14 days (first bud) | Creative, seasonal habits |
| 8 | Coconut Palm | Cay dua | Steady social | High | 30 days | Social, giving habits |
| 9 | Grapevine | Cay nho | Spreading compound | Medium-High | 10 days | Interconnected, compounding habits |

---

## 1. Tre / Bamboo -- "The Underground Builder"

### Real-World Metaphor

Moso bamboo (Phyllostachys edulis) spends its first 3-5 years developing an extensive root network underground with almost no visible growth. Then, in a single explosive growth season, it shoots up as much as 90 feet in 60 days -- one of the fastest-growing plants on earth. The lesson: the foundation matters more than the visible result.

### Habit Personality

The habit that requires FAITH. You will do the work for weeks or months before seeing any result. This is for habits where the payoff is real but delayed: learning a language, building a meditation practice, saving money, developing a creative skill. Bamboo people trust the process.

### Growth Pattern

**Delayed explosive.** Long underground phase (Days 1-90) where the user sees almost nothing. Then a dramatic eruption (Days 91-120) where growth is visible daily. Finally, a grove establishment phase where the plant becomes serene and permanent.

### Time to First Visible Result

**90 days.** This is intentionally the longest wait in the entire game. The first visible shoot breaking soil is one of the most emotionally powerful moments in Habien. To sustain engagement during the underground phase, the app shows subtle hints: soil cracks, tiny insects gathering, a faint "root map" overlay the user can toggle.

### Resilience

**High.** Once the root system is established (after Day 30), Bamboo can tolerate 5-7 missed days without losing growth progress. The roots hold everything together. Before Day 30, tolerance is lower (3 days) because roots are still shallow.

| Stage | Missed Day Tolerance |
|-------|---------------------|
| Seed - Sprout (Day 1-30) | 3 days |
| Growing (Day 31-90) | 5 days |
| Mature - Established | 7 days |
| Venerable - Ancient | 10 days |
| Legendary | 14 days (nearly self-sustaining) |

### Watering Frequency Curve

| Stage | Required Frequency | Flavor Text |
|-------|-------------------|-------------|
| Seed (Day 1-3) | Daily | "Feed the unseen roots." |
| Sprout (Day 4-7) | Daily | "The soil remembers every drop." |
| Growing (Day 8-30) | Daily | "Underground, a forest is forming." |
| Mature (Day 31-90) | Daily | "Almost there. The pressure builds." |
| Established (Day 91-180) | Every 2 days | "The bamboo is standing on its own." |
| Venerable (Day 181-365) | Every 3-4 days | "The grove sways gently. It knows what to do." |
| Ancient (Year 1-3) | Weekly | "Your grove has weathered seasons." |
| Legendary (Year 3+) | Self-sustaining | "The grove is eternal. It tends itself." |

### Visual Story at Each of 8 Stages

| Stage | Days | Visual Description |
|-------|------|-------------------|
| **Seed** | 1-3 | Dark soil with a single small mound. Barely anything to see. A faint dotted line hints at roots below. |
| **Sprout** | 4-7 | Soil cracks slightly. A few tiny insects appear near the surface. Underground root hint glows faintly. |
| **Growing** | 8-30 | Still mostly soil, but the mound is larger. Occasional "rumble" animation. The root overlay (toggleable) shows a spreading network. A few weeds grow nearby. |
| **Mature** | 31-90 | Around Day 85-90, a single green shoot BREAKS THROUGH the soil. This is the "bamboo moment" -- a major celebration. The shoot is thin but bright green and alive. |
| **Established** | 91-180 | Explosive growth. Multiple culms (stalks) shoot up rapidly. Leaves appear. By Day 180, a small grove of 5-7 tall bamboo stalks with rustling leaves. |
| **Venerable** | 181-365 | The grove thickens. Stalks are taller, thicker. A gentle swaying animation. Small birds perch on the stalks. Dappled sunlight filters through. |
| **Ancient** | Year 1-3 | A dense, towering bamboo forest. Mist occasionally drifts between stalks. A narrow path appears through the grove. Fireflies at night. The sound of wind through bamboo. |
| **Legendary** | Year 3+ | A massive bamboo cathedral. Stalks reach to the top of the tile and bend gracefully. Golden light filters through. A small stone bench appears at the base. The grove feels like a sacred place. |

### Best For

- Learning a language
- Building a meditation practice
- Saving/investing money
- Developing a creative skill (writing, drawing, music)
- Physical training programs with long ramp-up
- Any habit where "I'll see results in 3-6 months"

### NOT For

- Habits where you need daily visible feedback to stay motivated
- Quick-win habits (use Sunflower)
- Habits you are unsure about (the 90-day underground phase will break uncertain commitment)

### Signature Moment

**The Breakthrough (Day ~90).** After weeks of seeing only dirt, the first green shoot pierces the soil. Full-screen celebration. The camera zooms to the tiny shoot against the dark earth. Text: "You trusted the process. The bamboo trusted you." This is the single most dramatic visual payoff in the entire app.

---

## 2. Hoa Huong Duong / Sunflower -- "The Bright Starter"

### Real-World Metaphor

Sunflowers are one of the fastest-growing flowers, capable of reaching 6-10 feet in a single growing season. Young sunflowers exhibit heliotropism -- they literally turn to face the sun throughout the day, tracking light. Once mature, they face east permanently, warming themselves in the morning sun. The lesson: start by seeking energy and direction; eventually, you find your own.

### Habit Personality

The habit that gives you ENERGY. Sunflowers are for people who need to see results fast, who thrive on visible progress, and who want their habit to brighten their day. This is NOT a "baby plant" -- it is the right choice for action-oriented people who lose motivation without feedback.

### Growth Pattern

**Fast linear.** Visible growth every single day for the first 30 days. The Sunflower is always doing something new: growing taller, forming leaves, tracking the sun, budding, blooming. After the initial bloom, growth slows into a dignified, towering presence.

### Time to First Visible Result

**3 days.** The sprout emerges quickly and grows visibly each day. By Day 7, the user has a recognizable small sunflower. This fast feedback loop is the Sunflower's core appeal.

### Resilience

**Low.** Sunflowers need consistent attention. They wilt visibly after just 2 missed days, and after 4 missed days they enter dormancy. This is honest to the plant type: fast-growing plants need consistent resources. However, they also RECOVER fast -- a single watering brings them back noticeably within the same session.

| Stage | Missed Day Tolerance |
|-------|---------------------|
| Seed - Growing (Day 1-30) | 2 days |
| Mature (Day 31-90) | 3 days |
| Established - Venerable | 4 days |
| Ancient - Legendary | 5 days |

### Watering Frequency Curve

| Stage | Required Frequency | Flavor Text |
|-------|-------------------|-------------|
| Seed (Day 1-3) | Daily | "Already reaching for the light!" |
| Sprout (Day 4-7) | Daily | "Growing an inch a day." |
| Growing (Day 8-30) | Daily | "Can you keep up with it?" |
| Mature (Day 31-90) | Daily | "The bloom faces you. It sees your effort." |
| Established (Day 91-180) | Every 2 days | "Standing tall requires less effort now." |
| Venerable (Day 181-365) | Every 3 days | "A landmark in your garden." |
| Ancient (Year 1-3) | Every 4-5 days | "Its roots go deeper than you imagined." |
| Legendary (Year 3+) | Weekly | "A golden monument to consistency." |

### Visual Story at Each of 8 Stages

| Stage | Days | Visual Description |
|-------|------|-------------------|
| **Seed** | 1-3 | A seed cracks open. A pale shoot pushes up through loose soil. Immediate sense of life. |
| **Sprout** | 4-7 | Two round seed leaves. The stem is clearly growing taller. The plant leans slightly toward the "sun" in the scene. |
| **Growing** | 8-30 | Rapid height increase. True leaves form, getting larger. The stem thickens. A bud appears around Day 20. The plant tracks light (heliotropism animation). |
| **Mature** | 31-90 | The flower HEAD opens -- a large golden disc surrounded by yellow petals. This is the big visual payoff. Bees visit. The head slowly turns to face east and stays. Seeds form in the disc center. |
| **Established** | 91-180 | The stem is thick as a small tree trunk. The flower head has produced seeds (visible pattern). A second smaller bloom may appear on a side branch. Butterflies and bees are constant visitors. |
| **Venerable** | 181-365 | Multiple bloom stalks from a single robust base. The original head has become a seed-heavy disc, golden-brown and beautiful. Small birds eat seeds. The plant is taller than anything else in the garden. |
| **Ancient** | Year 1-3 | A towering sunflower "tree" with multiple tiers of blooms at different heights. The base is woody and thick. Vines may have begun to climb the stem. A bird's nest appears in the upper branches. |
| **Legendary** | Year 3+ | A radiant sunflower monument. The primary bloom emits a soft golden glow. Multiple heads at varying heights create a cascade effect. At dawn, the glow intensifies briefly. It is the "sun" of the garden -- other plants near it grow slightly faster (photosynthesis aura). |

### Best For

- Exercise / workout routines
- Daily journaling or writing
- Cleaning / tidying habits
- Drinking water
- Skincare routines
- Any habit where "I want to feel the difference immediately"

### NOT For

- Habits requiring patience before payoff (use Bamboo)
- Habits you only do 2-3 times per week (use Cactus)
- Habits focused on quality over quantity (use Bonsai)

### Signature Moment

**The First Bloom (Day ~30).** The bud that has been forming for a week suddenly opens in a radial animation -- petals unfurling one by one to reveal the golden disc. Bees fly in. The camera pulls back to show the full height of the plant. Text: "You showed up every day. The sun noticed."

---

## 3. Cay Soi / Oak -- "The Quiet Giant"

### Real-World Metaphor

An oak tree grows only 12-24 inches per year in its early decades. It does not flower until it is 20-50 years old. But it can live for 500-1000 years and become the largest tree in a forest, providing shelter and food for hundreds of species. A single oak produces about 70,000 acorns per year. The lesson: the slowest start can produce the most enduring legacy.

### Habit Personality

The FOUNDATIONAL habit. Oak is for habits that you expect to keep for the rest of your life -- not because they are exciting, but because they are essential. Brushing teeth, sleeping on schedule, eating well, exercising moderately. Oak people are not looking for drama; they are building something that lasts.

### Growth Pattern

**Slow compound.** Barely perceptible day-to-day change, but over months the compound effect becomes unmistakable. The Oak's visual impact doubles roughly every 6 months. By year 2-3, it dominates the garden. This is the "compound interest" plant.

### Time to First Visible Result

**14 days.** The Oak does show progress early -- a small sprout, then a thin sapling with a few leaves. It is never dramatic, but it is steady and reassuring. The "first visible result" is the appearance of the first TRUE leaf (not the seed leaves), which signals that the tree has taken root.

### Resilience

**Very High.** Oaks are among the most resilient trees in nature. In Habien, the Oak can tolerate the most missed days of any plant at every stage. It simply slows its growth rather than wilting. An Oak that has been "neglected" for a week looks the same -- it just did not grow. No drama, no guilt.

| Stage | Missed Day Tolerance |
|-------|---------------------|
| Seed - Sprout (Day 1-14) | 5 days |
| Growing (Day 15-30) | 7 days |
| Mature (Day 31-90) | 10 days |
| Established - Venerable | 14 days |
| Ancient - Legendary | 21 days (nearly impossible to neglect to dormancy) |

### Watering Frequency Curve

| Stage | Required Frequency | Flavor Text |
|-------|-------------------|-------------|
| Seed (Day 1-3) | Daily | "A mighty journey begins in silence." |
| Sprout (Day 4-7) | Daily | "The acorn doesn't rush." |
| Growing (Day 8-30) | Daily | "Inch by inch, root by root." |
| Mature (Day 31-90) | Every 2 days | "Steady as the oak." |
| Established (Day 91-180) | Every 3 days | "Deep roots need less rain." |
| Venerable (Day 181-365) | Every 4-5 days | "The oak has seen every season." |
| Ancient (Year 1-3) | Weekly | "Centuries in the making." |
| Legendary (Year 3+) | Self-sustaining | "The oak endures. So do you." |

### Visual Story at Each of 8 Stages

| Stage | Days | Visual Description |
|-------|------|-------------------|
| **Seed** | 1-3 | An acorn sitting in dark earth, partially buried. A tiny root tip visible beneath. |
| **Sprout** | 4-7 | The acorn has split. A pale stem with two round seed leaves emerges. Very small, very humble. |
| **Growing** | 8-30 | A thin sapling, about 6 inches tall. 4-6 true oak leaves with their characteristic lobed shape. A single thin trunk. |
| **Mature** | 31-90 | A small tree, clearly an oak. The trunk has slight bark texture. Branches form a loose canopy. Maybe 10-15 leaves. A squirrel appears occasionally. |
| **Established** | 91-180 | The trunk thickens noticeably. More branches, denser canopy. The first acorns appear (tiny, on branch tips). Moss begins on the trunk base. |
| **Venerable** | 181-365 | A substantial tree. The trunk has deep bark grooves. The canopy provides visible shade on the tile. Acorns drop occasionally. A bird nests in the branches. Autumn brings gold-orange leaf color changes. |
| **Ancient** | Year 1-3 | A grand old oak. Thick trunk with gnarled bark. Wide canopy spreading over adjacent tiles (visual overlap). Squirrels, birds, and insects are permanent residents. The roots are visible above ground, thick and powerful. Seasonal changes are dramatic and beautiful. |
| **Legendary** | Year 3+ | A MASSIVE ancient oak that visually dominates the garden. The trunk is as wide as the tile. The canopy creates a living roof over neighboring plants. Hanging moss, nesting owls, a swing hanging from a branch, fireflies at dusk. Text carved into the bark: the habit name and date planted. This is the "grandfather tree" of the garden. |

### Best For

- Sleep hygiene
- Healthy eating
- Regular moderate exercise (walking, stretching)
- Personal hygiene routines
- Financial habits (budgeting, saving)
- Any habit you plan to do FOREVER

### NOT For

- Habits you are experimenting with (might quit in a month)
- Habits that need daily excitement to sustain (use Sunflower)
- Skills-based habits where quality matters more than consistency (use Bonsai)

### Signature Moment

**The Canopy Moment (~Day 180-200).** When the Oak's branches grow wide enough to cast visible shade on adjacent tiles for the first time. The camera zooms out to show the Oak providing shelter for its neighbors. Text: "Your oak now shelters the garden. Some things take time to matter."

---

## 4. Xuong Rong / Cactus -- "The Desert Survivor"

### Real-World Metaphor

The Saguaro cactus grows only 1-1.5 inches per year for its first 8 years. It does not produce its first arm until age 50-70. But it can store up to 200 gallons of water and survive years of drought. A single Saguaro can live 150-200 years. The lesson: you do not need constant attention to build something extraordinary -- you just need to never quit entirely.

### Habit Personality

The MINIMALIST habit. Cactus is for habits you do a few times per week, not daily. It is for people with irregular schedules, travelers, parents with unpredictable days, anyone who knows they WILL miss days and does not want to feel punished for it. The Cactus does not reward frequency -- it rewards persistence over time.

### Growth Pattern

**Slow steady.** No dramatic phases, no explosive moments. The Cactus grows imperceptibly, day after day, year after year. Its beauty is in its quiet endurance. The visual changes are subtle at each stage but the cumulative effect over years is striking.

### Time to First Visible Result

**7 days.** A small round cactus body forms quickly and is immediately recognizable. The visual feedback is instant ("that is a cactus!") even though subsequent growth is glacially slow.

### Resilience

**Indestructible.** The Cactus has the highest neglect tolerance of any plant. It can go 14+ days without watering at any stage and never enter dormancy. It is literally impossible to accidentally kill through neglect. If someone IS going to neglect a plant, they should choose Cactus. No guilt, ever.

| Stage | Missed Day Tolerance |
|-------|---------------------|
| Seed - Growing | 10 days |
| Mature - Established | 14 days |
| Venerable - Ancient | 21 days |
| Legendary | 30 days (essentially immortal) |

### Watering Frequency Curve

| Stage | Required Frequency | Flavor Text |
|-------|-------------------|-------------|
| Seed (Day 1-3) | Every 2 days | "Even deserts get rain." |
| Sprout (Day 4-7) | Every 2 days | "Patient. Storing what it needs." |
| Growing (Day 8-30) | Every 2-3 days | "Thriving on less." |
| Mature (Day 31-90) | Every 3 days | "The desert rewards the persistent." |
| Established (Day 91-180) | Weekly | "Decades of patience in a single plant." |
| Venerable (Day 181-365) | Weekly | "It has survived worse than this." |
| Ancient (Year 1-3) | Every 10 days | "As old as the desert itself." |
| Legendary (Year 3+) | Self-sustaining | "Monument. Endurance. You." |

### Visual Story at Each of 8 Stages

| Stage | Days | Visual Description |
|-------|------|-------------------|
| **Seed** | 1-3 | A small green bump emerging from sandy soil. A few grains of sand around it. |
| **Sprout** | 4-7 | A small round cactus ball, about the size of a coin. 2-3 visible ribs. First tiny spines. |
| **Growing** | 8-30 | The ball elongates slightly into a column shape. More ribs, more spines. A couple of small rocks placed nearby. |
| **Mature** | 31-90 | A recognizable columnar cactus (think young Saguaro). About knee-height. Distinct ribbing pattern. Spines are golden in the light. Sandy terrain around it. |
| **Established** | 91-180 | Taller. The first FLOWER appears -- a small white or pink bloom at the very top, open only briefly. This is the "cactus flower moment." |
| **Venerable** | 181-365 | The first ARM begins to form -- a small nub growing out from the main column. This takes months to develop. A small lizard basks on the sunny side. |
| **Ancient** | Year 1-3 | A full Saguaro shape with 2-3 arms. The trunk has weathered texture. A bird has made a hole-nest in the trunk. Desert flowers bloom at the base in spring. Dramatic shadow at sunset. |
| **Legendary** | Year 3+ | A towering Saguaro, the tallest structure in the garden. Multiple arms in dramatic poses. Night-blooming white flowers open under moonlight (night-mode visual). A family of cactus wrens lives inside. Stars are visible behind it at night. It is the desert sentinel. |

### Best For

- Exercise 2-3 times per week
- Weekly meal prep
- Weekend hobbies
- Habits for travelers or shift workers
- Any habit where "I can not do this every single day and that is fine"

### NOT For

- Daily habits where you want the app to hold you accountable (use Sunflower or Bonsai)
- Habits requiring precision or quality tracking (use Bonsai)
- Habits with a social/sharing component (use Coconut Palm)

### Signature Moment

**The First Bloom (~Day 120-150).** Cactus flowers are among the most beautiful in nature precisely because they are so rare and brief. The bloom appears at the cactus crown, opens in a burst of white/pink petals, and lasts only 2-3 days in-game. Text: "The desert bloomed. It only needed your patience."

---

## 5. Hoa Sen / Lotus -- "The Transformer"

### Real-World Metaphor

The lotus grows in muddy, murky water. Its roots are buried in sludge. Yet it rises above the surface and produces one of the most beautiful flowers in nature -- spotlessly clean despite its origins. In Vietnamese culture, "Trong dam gi dep bang sen" (In the pond, what is more beautiful than the lotus?) is a proverb about beauty emerging from difficult conditions. The lotus also exhibits thermoregulation, maintaining its flower temperature even in cold water. The lesson: the hardest conditions produce the most beautiful transformations.

### Habit Personality

The TRANSFORMATION habit. Lotus is for habits born from difficulty -- quitting smoking, managing anxiety, recovering from injury, building confidence after failure. The user is not starting from a good place. They are starting from the mud. The Lotus tells them: that is exactly where beauty begins.

### Growth Pattern

**Transformative.** The early stages are visually "ugly" on purpose -- murky water, tangled roots, submerged stems. The beauty increases dramatically at each stage, with the bloom (Mature stage) being a true before/after transformation. The post-bloom stages represent the transformation becoming permanent and self-sustaining.

### Time to First Visible Result

**21 days.** The Lotus deliberately takes longer than the Sunflower to show beauty. The first 21 days show roots, underwater stems, and murky water. The first leaf pad reaching the surface (Day 21) is the "break the surface" moment. This mirrors the reality of transformation habits: the early days are messy.

### Resilience

**Medium.** The Lotus is forgiving but not indestructible. It can handle 3-4 missed days during early stages and more during later stages. However, during the critical "underwater" phase (Days 1-21), missing more than 4 days causes visible murkiness to increase -- the "mud" threatens to swallow the plant. This is intentionally symbolic: early transformation habits are fragile.

| Stage | Missed Day Tolerance |
|-------|---------------------|
| Seed - Sprout (Day 1-7) | 3 days |
| Growing (Day 8-30) | 4 days |
| Mature (Day 31-90) | 5 days |
| Established - Venerable | 7 days |
| Ancient - Legendary | 10 days |

### Watering Frequency Curve

| Stage | Required Frequency | Flavor Text |
|-------|-------------------|-------------|
| Seed (Day 1-3) | Daily | "In the mud, something stirs." |
| Sprout (Day 4-7) | Daily | "Roots reaching through the dark." |
| Growing (Day 8-30) | Daily | "Rising, rising, almost there." |
| Mature (Day 31-90) | Every 2 days | "The flower knows no mud now." |
| Established (Day 91-180) | Every 2-3 days | "Beauty that endures." |
| Venerable (Day 181-365) | Every 3-4 days | "From mud to monument." |
| Ancient (Year 1-3) | Weekly | "The pond reflects what you became." |
| Legendary (Year 3+) | Self-sustaining | "The lotus blooms eternal." |

### Visual Story at Each of 8 Stages

| Stage | Days | Visual Description |
|-------|------|-------------------|
| **Seed** | 1-3 | Dark, murky water. A seed pod visible beneath the surface. Bubbles rise occasionally. The tile looks less "nice" than others intentionally. |
| **Sprout** | 4-7 | Roots are visible through semi-transparent murky water. A thin stem reaches upward. The water is still dark. |
| **Growing** | 8-30 | The stem is longer. Around Day 14, a curled leaf pad is visible underwater, not yet reaching the surface. Around Day 21, the first pad breaks the surface -- a flat green circle on the water. The water begins to clear slightly. Small fish appear. |
| **Mature** | 31-90 | The BLOOM. A single lotus flower rises above the water, opening in pink/white petals. The water is now clear. 2-3 lily pads float on the surface. A dragonfly lands on a pad. This is the transformation moment. |
| **Established** | 91-180 | Multiple blooms. The water is crystal clear -- you can see the healthy root system below. Koi fish swim around the roots. The contrast with the "murky start" is striking. |
| **Venerable** | 181-365 | A full lotus garden within the tile. Multiple flowers in varying states of bloom (bud, open, seed pod). Golden light reflects off the water. Frogs sit on lily pads. The "pond" has become a place of beauty. |
| **Ancient** | Year 1-3 | The pond has expanded visually, hinting at depth. Ancient-looking stone edges frame the water. A small lantern or offering sits at the edge. The lotus blooms are luminous, almost glowing. The water is mirror-still when not animated. |
| **Legendary** | Year 3+ | A sacred lotus pond. The water is luminous blue-green. The primary bloom is oversized, golden-pink, and radiates soft light. Petals occasionally detach and float on the water like offerings. Fireflies gather at dusk. A faint reflection in the water shows not the flower but the user's habit name. |

### Best For

- Quitting an addiction (smoking, alcohol, social media)
- Managing mental health (anxiety, depression habits)
- Recovery from injury or illness
- Building confidence after failure
- Changing a deeply ingrained negative pattern
- Any habit where "I am starting from a hard place"

### NOT For

- Habits you are already good at (there is no mud to rise from)
- Low-stakes habits (drinking water, skincare -- use Sunflower)
- Habits without emotional weight (use Oak or Cactus)

### Signature Moment

**Breaking the Surface (Day ~21).** The first lily pad pushes through the murky water into light. The water ripples outward in concentric circles. As the pad unfurls, the water begins to clear around it. Text: "You rose above it. The mud was never your destiny."

---

## 6. Cay Bonsai / Bonsai -- "The Craftsman"

### Real-World Metaphor

Bonsai is not a species of tree -- it is a practice. The word means "tray planting" in Japanese. A bonsai master spends decades shaping a single tree, making deliberate choices about every branch, every leaf, every curve. No two bonsai are alike. The practice values intention over speed, quality over quantity, and the relationship between gardener and tree over the end result. Some bonsai trees are 800+ years old. The lesson: mastery is not about doing more; it is about doing with greater care.

### Habit Personality

The CRAFT habit. Bonsai is for habits where QUALITY matters more than frequency or quantity. Writing (not word count, but better prose). Cooking (not more meals, but better dishes). Music practice (not more hours, but deliberate practice). Bonsai people are not interested in streaks -- they are interested in getting better.

### Growth Pattern

**Precision.** The Bonsai grows at a moderate pace, but its visual shape is partly determined by USER CHOICES. Periodic "shaping" prompts ask the user to make a decision about their plant's direction, creating a truly unique visual for each user. The growth is not about size but about character.

### Time to First Visible Result

**7 days.** A small seedling appears quickly. But the real visual interest starts at Day 14, when the first "shaping choice" is offered. The Bonsai is always small compared to the Oak or Bamboo -- its beauty is in its miniature perfection, not its size.

### Resilience

**Medium-Low.** Bonsai trees in real life require careful, consistent attention. In Habien, the Bonsai is less forgiving than the Oak or Cactus. Missing days causes visible "wild growth" -- branches growing out of shape, leaves becoming unruly. This is not catastrophic (the user can "prune" back), but it communicates that quality habits need regular tending.

| Stage | Missed Day Tolerance |
|-------|---------------------|
| Seed - Growing (Day 1-30) | 3 days |
| Mature (Day 31-90) | 4 days |
| Established - Venerable | 5 days |
| Ancient - Legendary | 7 days |

### Watering Frequency Curve

| Stage | Required Frequency | Flavor Text |
|-------|-------------------|-------------|
| Seed (Day 1-3) | Daily | "Every master starts with a seed." |
| Sprout (Day 4-7) | Daily | "Watch carefully. Each day matters." |
| Growing (Day 8-30) | Daily | "Shape emerges from attention." |
| Mature (Day 31-90) | Daily | "The tree reflects its keeper." |
| Established (Day 91-180) | Every 2 days | "Mastery needs less force, more finesse." |
| Venerable (Day 181-365) | Every 2-3 days | "A lifetime of care in a small tree." |
| Ancient (Year 1-3) | Every 3-4 days | "The master and the tree are one." |
| Legendary (Year 3+) | Weekly | "A living sculpture. Your life's work." |

**Unique mechanic: Shaping Prompts.** Every 30 days, the user gets a "shaping choice":
- "Which direction should this branch grow?" (Left / Right / Upward / Let it be wild)
- "Should we prune this section for elegance or let it spread for character?"
- "Add a moss element or keep the trunk bare?"

These choices permanently affect the visual shape, making each Bonsai unique.

### Visual Story at Each of 8 Stages

| Stage | Days | Visual Description |
|-------|------|-------------------|
| **Seed** | 1-3 | A small ceramic pot (classic bonsai tray). Rich soil. A single tiny sprout. |
| **Sprout** | 4-7 | A thin stem with 3-4 tiny leaves. The pot is prominent; the plant is very small. Wire guides are faintly visible (training metaphor). |
| **Growing** | 8-30 | A miniature tree taking shape. The trunk begins to thicken. First shaping choice offered. The result of the choice visibly alters the branch direction. |
| **Mature** | 31-90 | A recognizable bonsai tree with character. The trunk has curves (based on shaping choices). Dense, carefully arranged foliage. Moss on the soil surface. The pot and tree are in visual harmony. |
| **Established** | 91-180 | The trunk shows aged bark texture. Exposed roots grip the edges of the pot (nebari). The canopy has clearly defined layers. A tiny accent plant may appear at the base. |
| **Venerable** | 181-365 | The bonsai looks ANCIENT despite its small size. Deadwood features appear (jin and shari -- stripped bark areas that add drama). The trunk has dramatic curves. Seasonal foliage changes: spring flowers, autumn colors. |
| **Ancient** | Year 1-3 | A masterwork bonsai. The trunk is twisted and powerful. The canopy is perfectly shaped from years of user choices. A display stand appears beneath the pot. Tiny details: moss patches, lichen, a miniature figure sitting beneath the tree. |
| **Legendary** | Year 3+ | A living national treasure. The pot is now a fine ceramic piece. The tree has the gravitas of centuries despite its small size. Display lighting highlights the form. A small plaque with the habit name and date planted. Petals or leaves occasionally fall in slow motion. This is the "museum piece" of the garden. |

### Best For

- Writing (craft-focused, not just word count)
- Musical instrument practice
- Cooking / culinary skills
- Any art or craft (drawing, painting, pottery)
- Code quality / software craftsmanship
- Any habit where "getting better at it" matters more than "doing it more"

### NOT For

- Habits measured by frequency alone (use Oak)
- Habits where consistency matters more than quality (use Bamboo)
- Habits you want to be forgiving (use Cactus)

### Signature Moment

**The First Shaping (Day ~30).** The user is presented with their first shaping choice -- a branching decision that will permanently alter their tree's visual form. The branch grows in their chosen direction in a smooth animation. Text: "Your choices shape your craft. No two paths look the same."

---

## 7. Hoa Anh Dao / Cherry Blossom (Sakura) -- "The Seasonal Artist"

### Real-World Metaphor

Cherry blossom trees spend most of the year as ordinary-looking trees. Then, for 1-2 weeks each spring, they explode into clouds of pink and white flowers. This brief, intense bloom period is celebrated across East Asia (hanami in Japan). The petals fall like snow, creating carpets of pink. The beauty is inseparable from its impermanence. The lesson: some things are beautiful precisely because they come in bursts, not continuously.

### Habit Personality

The CREATIVE habit. Sakura is for habits with natural rhythms of intensity and rest. Creative work (writing sprints, art projects), seasonal sports, project-based work, or any habit where you go through "seasons" of high effort and recovery. Sakura does not punish rest periods between bursts -- it celebrates them as part of the cycle.

### Growth Pattern

**Burst-rest cycles.** The Sakura alternates between active bloom periods (high engagement, dramatic visuals) and quiet growth periods (dormant-looking but still progressing). Each "bloom season" is more spectacular than the last. The tree itself grows steadily between blooms.

**Cycle structure:**
- **Active phase** (14-21 days): Enhanced visuals, bonus XP, daily engagement rewarded
- **Rest phase** (7-14 days): Tree looks green and leafy (no blooms), reduced watering needed, no penalty for skipping days
- Cycles repeat, each bloom more impressive than the previous

### Time to First Visible Result

**14 days (first bud).** The tree grows as a normal sapling for 14 days, then produces its first buds. The first mini-bloom (Day 21) is small -- just a few flowers -- but signals the cyclical nature of this plant.

### Resilience

**Medium.** During bloom phases, the Sakura needs consistent daily attention (2-day tolerance). During rest phases, it is very forgiving (7+ days). This dual nature mirrors creative habits perfectly: when you are "in the zone," show up daily; when resting, truly rest.

| Phase | Missed Day Tolerance |
|-------|---------------------|
| Bloom phase | 2 days |
| Rest phase | 7 days |
| Ancient+ (any phase) | 10 days |

### Watering Frequency Curve

| Stage | Required Frequency | Flavor Text |
|-------|-------------------|-------------|
| Seed (Day 1-3) | Daily | "A season is being born." |
| Sprout (Day 4-7) | Daily | "Patience. The bloom will come." |
| Growing (Day 8-30) | Daily (bloom) / 2-3 days (rest) | "Every season has its purpose." |
| Mature (Day 31-90) | Daily (bloom) / 3 days (rest) | "The petals know when to fall." |
| Established (Day 91-180) | 2 days (bloom) / 4 days (rest) | "You've learned the rhythm." |
| Venerable (Day 181-365) | 2-3 days (bloom) / 5 days (rest) | "Spring always returns." |
| Ancient (Year 1-3) | 3 days (bloom) / weekly (rest) | "Your art has seasons." |
| Legendary (Year 3+) | Weekly (any phase) | "The master rests and blooms as one." |

### Visual Story at Each of 8 Stages

| Stage | Days | Visual Description |
|-------|------|-------------------|
| **Seed** | 1-3 | A small dark branch-like stem emerging from soil. Looks bare and wintry. |
| **Sprout** | 4-7 | Thin branches extend. Small green buds appear at branch tips. Still looks wintry. |
| **Growing** | 8-30 | Branches form a graceful shape. First bloom cycle: buds swell, 5-10 small pink flowers open. Petals fall gently. Then leaves replace flowers (rest phase). |
| **Mature** | 31-90 | A beautiful small tree with graceful branching. Bloom cycles are now 20-30 flowers. Falling petals create a pink carpet on the ground. Between blooms, the tree has full green foliage. |
| **Established** | 91-180 | Trunk has visible bark texture. The canopy spreads wider. Bloom cycles fill the entire canopy with flowers. Petals drift to adjacent tiles. A bench appears under the tree. |
| **Venerable** | 181-365 | A mature cherry blossom tree. The blooms are clouds of pink. During rest, autumn foliage is orange-red. The tree goes through visible seasonal cycles: bare winter branches, spring bloom, summer green, autumn gold. |
| **Ancient** | Year 1-3 | A grand old Sakura. The trunk is thick and dramatic. Bloom season is a spectacle -- petals fill the air like snow. During rest seasons, the bare branches have their own stark beauty. A stone path appears beneath. |
| **Legendary** | Year 3+ | A Sakura monument. The bloom is breathtaking -- luminous pink petals that glow softly, drifting across the entire garden. Even at rest, the bare branches have an artistic beauty, like a calligraphy painting. A small torii gate or stone lantern at the base. |

### Best For

- Creative writing (sprints and rest)
- Art projects (draw daily for 2 weeks, then pause)
- Seasonal sports (running in spring/fall, rest in winter)
- Project-based learning (intensive study periods)
- Any habit with natural "on" and "off" seasons

### NOT For

- Daily non-negotiable habits (use Oak or Sunflower)
- Habits requiring year-round consistency (use Bamboo)
- Habits that should never be skipped (use Bonsai)

### Signature Moment

**The Full Bloom (~Day 90 first spectacular bloom).** The entire canopy erupts in pink. Petals cascade in slow motion. Adjacent garden tiles receive a dusting of petals. The camera slowly pans across the scene. Text: "Beauty this intense can only come in seasons. And this is your season."

---

## 8. Cay Dua / Coconut Palm -- "The Generous One"

### Real-World Metaphor

The coconut palm is called the "Tree of Life" in many tropical cultures. Every part of it is useful: the fruit provides water, milk, oil, and meat; the husks make rope and fuel; the leaves become roofing and baskets; the trunk becomes building material. A single palm can produce 50-200 coconuts per year for up to 80 years. It thrives in communities -- palms grow better in groves than alone. The lesson: the most meaningful habits are the ones that benefit others, not just yourself.

### Habit Personality

The SOCIAL habit. Coconut Palm is for habits that connect you to others or produce something for others: cooking for family, volunteering, mentoring, writing a blog, maintaining relationships, random acts of kindness. The Coconut Palm's growth is steady and its "fruit" mechanic rewards consistency with tangible, shareable outputs.

### Growth Pattern

**Steady social.** The Coconut Palm grows at a moderate, reliable pace -- no drama, no explosive phases. Its distinctive feature is the "fruit" system: once mature, it periodically produces coconuts that represent the "output" of social habits. The user can "share" these coconuts (send encouragement to garden neighbors), creating a tangible social loop.

### Time to First Visible Result

**30 days.** The Coconut Palm is a slow starter visually. For the first 30 days, it looks like a modest sprout. But the wait is worth it: the tall, graceful palm shape that eventually emerges is one of the most distinctive silhouettes in the garden.

### Resilience

**High.** Coconut palms are storm-resistant -- their flexible trunks bend rather than break. In Habien, the Coconut Palm is very tolerant of missed days at all stages, reflecting the reality that social habits can be irregular (you do not cook for friends every day).

| Stage | Missed Day Tolerance |
|-------|---------------------|
| Seed - Growing (Day 1-30) | 5 days |
| Mature (Day 31-90) | 7 days |
| Established+ | 10 days |
| Ancient+ | 14 days |

### Watering Frequency Curve

| Stage | Required Frequency | Flavor Text |
|-------|-------------------|-------------|
| Seed (Day 1-3) | Every 2 days | "Planted near others, it grows stronger." |
| Sprout (Day 4-7) | Every 2 days | "Even the tallest trees start small." |
| Growing (Day 8-30) | Every 2 days | "Growing toward the people who need it." |
| Mature (Day 31-90) | Every 2-3 days | "The first fruits of giving." |
| Established (Day 91-180) | Every 3 days | "Others rest in your shade." |
| Venerable (Day 181-365) | Every 4 days | "A tree that feeds many." |
| Ancient (Year 1-3) | Weekly | "The whole grove thanks you." |
| Legendary (Year 3+) | Self-sustaining | "The Tree of Life lives through giving." |

### Visual Story at Each of 8 Stages

| Stage | Days | Visual Description |
|-------|------|-------------------|
| **Seed** | 1-3 | A large coconut lying on sandy soil. A crack in the husk shows a green shoot beginning. |
| **Sprout** | 4-7 | A fan of 2-3 palm fronds emerging from the coconut. The fronds are bright green and spreading. |
| **Growing** | 8-30 | A short palm trunk forms. 5-6 fronds spread at the top. The trunk is thin and green, not yet woody. Sandy beach terrain with a seashell or two. |
| **Mature** | 31-90 | A recognizable coconut palm. The trunk has ring marks. 8-10 large fronds. The first cluster of small green coconuts appears. A hammock might be strung nearby. |
| **Established** | 91-180 | Tall and graceful. Coconuts ripen (green to brown). The "fruit" mechanic activates: coconuts can be "harvested" and "shared." Tropical flowers bloom at the base. |
| **Venerable** | 181-365 | A grand palm. Multiple coconut clusters at different ripeness stages. A rope swing hangs from a frond. Small tropical birds perch. The shade area is clearly defined on the tile. |
| **Ancient** | Year 1-3 | A towering palm that rivals the Oak in height. The trunk has weathered beauty. A treehouse or platform appears partway up the trunk. Coconuts are abundant. Other small tropical plants grow at its base. |
| **Legendary** | Year 3+ | A legendary palm grove has formed from a single tree (visual suggestion of multiple trunks). The grove provides a "tropical paradise" atmosphere. Sunset colors in the background. Hammocks, lanterns, and tropical flowers create a gathering place. This is the "place people come together" in the garden. |

### Best For

- Cooking for family/friends
- Volunteering or community service
- Mentoring others
- Writing/creating content to share
- Relationship maintenance habits
- Random acts of kindness
- Any habit where "the value is in what you give"

### NOT For

- Purely personal habits (meditation, journaling -- use Lotus or Bamboo)
- Competitive habits (use Sunflower)
- Habits focused on personal mastery (use Bonsai)

### Signature Moment

**The First Fruit (~Day 60-90).** The first ripe coconut appears on the palm. The user can "harvest" it and choose to keep it (decorative item) or "share" it (send encouragement to a garden neighbor or friend). Text: "Your tree bears fruit. The best kind: the kind you share."

---

## 9. Cay Nho / Grapevine -- "The Connector"

### Real-World Metaphor

Grapevines are unique among plants: they cannot stand on their own. They must climb, cling, and spread using tendrils that reach out and grab onto structures. A single vine can spread over 50 feet. But the magic is in what happens underground -- grape roots in a vineyard intertwine and communicate through mycorrhizal networks, sharing nutrients and chemical signals. And of course, grapes become wine: something that gets BETTER with age. The lesson: habits that connect to other habits create something greater than the sum of their parts.

### Habit Personality

The INTERCONNECTING habit. Grapevine is for habits that naturally connect to or reinforce other habits. Exercise connects to sleep quality. Reading connects to writing. Meditation connects to emotional regulation. The Grapevine's unique mechanic is that it can visually "connect" to other plants in the garden, representing habit stacking and the compound effect of interconnected habits.

### Growth Pattern

**Spreading compound.** The Grapevine starts small but spreads to visually interact with adjacent plants. Its growth is moderate in the early stages, but the "compound" effect becomes visible when it connects to other plants: the connected plants show a subtle boost (richer colors, faster growth animation). The Grapevine rewards BREADTH of habit engagement, not just single-habit depth.

### Time to First Visible Result

**10 days.** The vine's first tendril reaches out by Day 10. The first connection to an adjacent plant (Day 20-30) is the real "result" moment.

### Resilience

**Medium-High.** Grapevines are pruned aggressively in real life and always come back. In Habien, the Grapevine can tolerate moderate neglect (5-7 days). If neglected, the vines wither back but the root stock survives intact. Recovery is fast.

| Stage | Missed Day Tolerance |
|-------|---------------------|
| Seed - Growing (Day 1-30) | 4 days |
| Mature (Day 31-90) | 5 days |
| Established+ | 7 days |
| Ancient+ | 10 days |

### Watering Frequency Curve

| Stage | Required Frequency | Flavor Text |
|-------|-------------------|-------------|
| Seed (Day 1-3) | Daily | "A single vine. A thousand possibilities." |
| Sprout (Day 4-7) | Daily | "Reaching out, finding its way." |
| Growing (Day 8-30) | Daily | "Tendrils seeking connection." |
| Mature (Day 31-90) | Every 2 days | "The vine knows where to grow." |
| Established (Day 91-180) | Every 2-3 days | "Connected. Intertwined. Stronger together." |
| Venerable (Day 181-365) | Every 3 days | "A network of growth." |
| Ancient (Year 1-3) | Weekly | "The vintage improves with time." |
| Legendary (Year 3+) | Self-sustaining | "From one vine, a vineyard." |

### Visual Story at Each of 8 Stages

| Stage | Days | Visual Description |
|-------|------|-------------------|
| **Seed** | 1-3 | A small trellis or arbor structure is placed on the tile. A tiny green shoot emerges at its base. |
| **Sprout** | 4-7 | The vine has climbed 2-3 rungs of the trellis. Thin tendrils curl around the support. Small leaves appear. |
| **Growing** | 8-30 | The vine covers half the trellis. Tendrils begin reaching BEYOND the trellis toward adjacent tiles. If a plant is in an adjacent tile, a tendril visually stretches toward it. |
| **Mature** | 31-90 | The trellis is fully covered in vine. First grape clusters appear (small, green). If adjacent to another plant, a visible vine connection links them (a thin green line with tiny leaves). Connected plants show a subtle sparkle effect. |
| **Established** | 91-180 | Grapes ripen (green to purple). Multiple connections to neighbors. The vine has begun growing along the ground toward other tiles. The connected network is visible from the zoomed-out garden view. |
| **Venerable** | 181-365 | A lush vineyard scene within the tile. The trellis groans under the weight of fruit. Wine-purple grapes hang in heavy clusters. The vine connections to neighbors are thick and leafy. Autumn colors appear on the leaves. |
| **Ancient** | Year 1-3 | The original trellis has been replaced by a stone wall that the vine covers completely. The vine has a thick, woody trunk. Grape clusters are abundant. A small wine barrel sits at the base. The connection network extends across multiple tiles. |
| **Legendary** | Year 3+ | A legendary vineyard. The vine has spread to create an overhead canopy (pergola effect) across the tile and hinting at extending over neighbors. Lanterns hang from the vine. Ripe grapes glow softly. The scene suggests a Tuscan or French countryside. A "vintage year" marker appears: the year the habit was started. |

### Best For

- Habits that reinforce other habits (exercise + sleep + nutrition)
- Skill stacks (reading + note-taking + writing)
- Multi-part routines (morning routine: meditate + exercise + journal)
- Learning habits that build on each other
- Any habit where "this habit makes my other habits better"

### NOT For

- Standalone habits with no connection to others (use Oak or Cactus)
- Habits requiring complete independence (use Bamboo)
- Habits focused on a single deep skill (use Bonsai)

### Signature Moment

**The First Connection (Day ~25-30).** The Grapevine's tendril reaches an adjacent plant for the first time. A thin green vine bridge forms between the two tiles. The connected plant glows briefly. Text: "Your habits are not islands. They are a vineyard."

---

# Part 2: Selection Criteria

## The Five Dimensions

Every plant is scored on 5 dimensions using a 1-5 scale. These dimensions capture the meaningful differences between plant types and help users make an informed choice.

### Dimension Definitions

| Dimension | Scale | Description |
|-----------|-------|-------------|
| **Patience Required** | 1 (instant results) to 5 (months before payoff) | How long before the user sees meaningful visual/emotional results |
| **Daily Commitment** | 1 (2-3x/week ok) to 5 (every day matters) | How sensitive the plant is to missed days |
| **Forgiveness** | 1 (very fragile) to 5 (indestructible) | How well the plant handles streaks of missed days |
| **Growth Drama** | 1 (slow and steady) to 5 (dramatic bursts) | How visually dramatic the growth moments are |
| **Focus Type** | 1 (quantity/consistency) to 5 (quality/mastery) | Whether the plant rewards showing up vs. doing it well |

### Plant Scoring Matrix

| Plant | Patience | Commitment | Forgiveness | Drama | Focus Type |
|-------|----------|------------|-------------|-------|------------|
| Bamboo | **5** | 4 | 3 | **5** | 2 |
| Sunflower | **1** | **5** | 1 | 3 | 1 |
| Oak | 3 | 2 | **5** | 1 | 2 |
| Cactus | 2 | **1** | **5** | 2 | 1 |
| Lotus | 4 | 4 | 2 | 4 | 3 |
| Bonsai | 2 | 4 | 2 | 2 | **5** |
| Cherry Blossom | 3 | 3 | 3 | **5** | 4 |
| Coconut Palm | 3 | 2 | 4 | 2 | 2 |
| Grapevine | 2 | 3 | 3 | 3 | 2 |

### Visual: Radar Chart Groupings

**The Endurance Plants** (Oak, Cactus, Coconut Palm): High forgiveness, low commitment demand. For people who want a plant that survives their lifestyle.

**The Intensity Plants** (Sunflower, Bonsai, Lotus): High commitment demand, low forgiveness. For people who want the plant to hold them accountable.

**The Drama Plants** (Bamboo, Cherry Blossom): High drama moments, requires patience. For people who live for the payoff.

**The Connector** (Grapevine): Balanced across all dimensions. For people whose habit makes other habits better.

---

# Part 3: Question-Based Selection Flow

## The Quiz: "Which Plant Is Your Habit?"

**Design principles:**
- 3 questions maximum (respects the user's time)
- Each question has 3 clear options (not 4 -- decision fatigue is real)
- The quiz feels like a personality test, not a survey
- Every path leads to a clear recommendation with a brief "why"
- The user can always override the recommendation

### Question 1: "How quickly do you want to see results?"

| Option | What it means | Eliminates |
|--------|--------------|------------|
| **A) "Show me progress right away"** | Quick feedback, visible daily change | Bamboo, Lotus, Coconut Palm |
| **B) "I can wait a few weeks"** | Moderate patience, some delayed gratification | (none eliminated -- middle path) |
| **C) "I'm in this for years. No rush."** | Long-term commitment, delayed payoff | Sunflower |

### Question 2: "What happens when you miss a day?"

| Option | What it means | Narrows to |
|--------|--------------|-----------|
| **A) "I get back up immediately, no guilt"** | Resilient, self-forgiving | High-forgiveness plants |
| **B) "I feel bad, but I bounce back"** | Moderate guilt, recoverable | Medium-forgiveness plants |
| **C) "Missing a day might break my streak and I want that pressure"** | Uses accountability as fuel | Low-forgiveness plants |

### Question 3: "What matters more to you?"

| Option | What it means | Final filter |
|--------|--------------|-------------|
| **A) "Just doing it consistently"** | Consistency > quality | Quantity-focused plants |
| **B) "Doing it well, getting better"** | Quality > frequency | Quality-focused plants |
| **C) "How it connects to the rest of my life"** | Integration, compound effect | Connection-focused plants |

### Decision Tree

```
Q1: How quickly do you want results?
|
|-- A) Right away
|   |-- Q2: Miss a day?
|   |   |-- A) No guilt    --> Cactus ("Tough like you")
|   |   |-- B) Bounce back  --> Sunflower ("Fast and bright")
|   |   |-- C) Want pressure --> Bonsai ("Every detail counts")
|
|-- B) A few weeks
|   |-- Q2: Miss a day?
|   |   |-- A) No guilt    --> Oak ("Unshakeable foundation")
|   |   |-- B) Bounce back  --> Grapevine ("Everything connects")
|   |   |                     OR Cherry Blossom*
|   |   |-- C) Want pressure --> Lotus ("Beauty from struggle")
|   |
|   |   * Q3 tiebreaker for B+B path:
|   |   |-- A) Consistency  --> Grapevine
|   |   |-- B) Quality      --> Cherry Blossom
|   |   |-- C) Connection   --> Grapevine
|
|-- C) Years. No rush.
|   |-- Q2: Miss a day?
|   |   |-- A) No guilt    --> Coconut Palm ("Grows with generosity")
|   |   |-- B) Bounce back  --> Bamboo ("Trust the underground")
|   |   |-- C) Want pressure --> Bamboo ("Trust the underground")
```

### Recommendation Display

After the quiz, show:

```
Your habit personality: [PLANT NAME]

[Plant illustration, animated]
[One-sentence description]

"Here's why this fits you:"
[2-3 bullet points matching their answers to the plant's traits]

[Choose this plant]  [See all plants]
```

The user can always tap "See all plants" to browse all 9 types with their dimension scores and pick freely.

### Edge Cases

- If the user skips the quiz: show all 9 plants in a grid with brief descriptions
- If the user changes their mind later: this is what the Rebirth System is for (Part 4)
- The quiz should be OPTIONAL, never forced

---

# Part 4: Rebirth System

## What Is a Rebirth Stone?

A Rebirth Stone is a rare, earned item that allows the user to change their plant's TYPE while keeping all accumulated growth progress. The plant transforms visually -- its roots remain, but its form changes to the new type.

**Why it exists:** People change. A habit that felt like a "Bamboo" (long-term patience) might actually be a "Sunflower" (daily energy) after 3 months of experience. The Rebirth Stone prevents the user from feeling trapped in a wrong choice without trivializing the original selection.

## How to Earn a Rebirth Stone

Rebirth Stones are RARE. They should feel special, not routine.

| Method | Requirement | Stones Earned | Frequency |
|--------|------------|---------------|-----------|
| **Milestone Achievement** | Any plant reaches Established stage (Day 91+) | 1 | Once per plant |
| **Ancient Achievement** | Any plant reaches Ancient stage (Year 1+) | 1 | Once per plant |
| **Perfect Month** | 30 consecutive days of watering ALL plants | 1 | Once per occurrence |
| **Welcome Back** | Return after 30+ days of absence and revive a dormant plant | 1 | Once per long absence |
| **Seasonal Gift** | Special holiday events (Tet, Mid-Autumn, New Year) | 1 | 1-2 per year |

**Expected earning rate:** A dedicated user might accumulate 2-3 Rebirth Stones in their first year. This keeps them rare enough to feel meaningful.

**Note:** Rebirth Stones are NOT purchasable with real money. This is a deliberate design choice -- they represent personal growth, not spending power.

## How It Works (UX Flow)

### Step 1: Initiate

The user opens a plant's detail sheet and finds a "Rebirth" option (visible only if they own a Rebirth Stone). The option is subtle -- not a prominent button but a hidden gem in the settings area.

### Step 2: Preview

```
REBIRTH PREVIEW
━━━━━━━━━━━━━━━━
Your [Bamboo] "Morning Meditation" has been growing for 247 days.
It is currently at the Venerable stage.

See what it would look like as a different plant:

[Sunflower]  [Oak]  [Lotus]  [Cactus]  ...

Tap any plant to preview.
```

The preview shows the plant at its CURRENT STAGE but in the new type's visual form. For example, a Venerable Bamboo previewed as an Oak would show what a Venerable Oak looks like. This lets the user make an informed decision.

### Step 3: Confirm

```
REBIRTH CONFIRMATION
━━━━━━━━━━━━━━━━━━━━━
Transform "Morning Meditation" from Bamboo to Lotus?

WHAT TRANSFERS:
  ✓ Growth days (247 days)
  ✓ Current stage (Venerable)
  ✓ All reflections and journal entries
  ✓ Streak history
  ✓ Achievements earned
  ✓ XP contributed

WHAT CHANGES:
  ↻ Visual appearance (Bamboo grove → Lotus pond)
  ↻ Growth animation style
  ↻ Watering frequency requirements
  ↻ Resilience characteristics
  ↻ Signature moment (if not yet reached)

WHAT REMAINS AS LEGACY:
  🌿 A small bamboo shoot at the pond's edge
     (visible reminder of where you started)

[Use Rebirth Stone]     [Cancel]

This action uses 1 Rebirth Stone. You have 2 remaining.
```

### Step 4: Transformation Animation

If confirmed:
1. The current plant gently dissolves into particles of light
2. The particles swirl and reform into the new plant type at the same growth stage
3. A small visual remnant of the old type appears (see "Visual Legacy" below)
4. Celebration screen: "Reborn. Same roots, new form."
5. +50 XP bonus for the transformation

## What Transfers

| Element | Transfers? | Notes |
|---------|-----------|-------|
| Growth days | YES | The plant keeps its exact day count |
| Current stage | YES | Stage is mapped by growth days, unchanged |
| Reflections/journal | YES | All written content is preserved |
| Streak history | YES | Historical streaks remain in the record |
| Achievements already earned | YES | e.g., "First Bloom" stays earned |
| Total XP contributed | YES | XP is a player stat, not plant-specific |
| Watering history | YES | All watering logs preserved |

## What Changes

| Element | Changes? | Notes |
|---------|----------|-------|
| Visual appearance | YES | Plant looks like new type at current stage |
| Growth pattern going forward | YES | Future growth follows new type's curve |
| Watering frequency | YES | Matches new type's requirements |
| Resilience / tolerance | YES | Matches new type's tolerance |
| Future signature moments | YES | If the old type's signature moment was already seen, the new type's future ones apply |
| Plant personality in UI | YES | Description, tips, and flavor text change |

## Visual Legacy

This is the most important emotional design element. When a plant is reborn, a small visual trace of its former type remains permanently:

| Old Type | Legacy Visual in New Plant |
|----------|---------------------------|
| Bamboo | A single small bamboo shoot at the edge of the new plant's tile |
| Sunflower | A dried sunflower head (decorative) tucked near the base |
| Oak | A small acorn sitting on the soil near the new plant |
| Cactus | A tiny cactus pup growing beside the new plant |
| Lotus | A single lotus pad floating if the new plant has water; a pressed lotus flower decoration if not |
| Bonsai | A miniature pot (empty) sitting near the new plant |
| Cherry Blossom | A few dried pink petals on the ground near the base |
| Coconut Palm | A coconut shell (halved) used as a decorative planter at the base |
| Grapevine | A short piece of vine with a few dried leaves wrapped around the new plant's base |

**The legacy visual is permanent and cumulative.** A plant that has been reborn 3 times would show 3 small legacy artifacts, creating a visual history of its journey.

## Limitations

| Rule | Details |
|------|---------|
| **Cooldown** | Cannot rebirth the same plant more than once every 90 days |
| **Cost** | 1 Rebirth Stone per transformation |
| **Rebirth back** | YES, you can rebirth back to a previous type. The new legacy artifact is added (not removed). |
| **During dormancy** | NO. You must revive the plant first, then rebirth. |
| **During bloom** | Cherry Blossom: rebirth during bloom phase is allowed but the bloom ends immediately (the tree transitions during rest phase). |
| **Stage minimum** | Plant must be at least at Growing stage (Day 8+). You cannot rebirth a Seed or Sprout. |

## Strategic Value: Why Would a User WANT to Rebirth?

### Scenario 1: Wrong Personality Match

"I chose Bamboo for my meditation habit because I thought it was about patience. But after 3 months, I realize meditation gives me immediate daily energy -- it's more of a Sunflower habit. Rebirth lets me correct the mismatch without losing 90 days of growth."

### Scenario 2: Habit Evolution

"My 'Cook one meal' habit started as a daily Sunflower-type thing. Now, 6 months in, I'm focused on cooking WELL -- learning techniques, perfecting recipes. It's become a craft. Bonsai is the right type now."

### Scenario 3: Life Change

"I picked Lotus for my 'Manage anxiety' habit because I was struggling. A year later, the anxiety is managed -- it's now just a steady maintenance habit. Oak fits better for this phase of my life."

### Scenario 4: Aesthetic Desire

"My garden has 5 plants and they all happen to be green/earthy tones. I want the visual variety of a Lotus or Cherry Blossom. The Rebirth Stone lets me rethink the garden's visual composition."

### Scenario 5: Celebrating Transformation

"Using the Rebirth Stone IS the celebration. My plant went through a transformation just like I did. The legacy artifact tells the story: 'This Lotus used to be a Cactus. I started just surviving, and now I'm thriving.'"

---

# Implementation Notes

## Build Priority

Not all 9 plants need to ship simultaneously. Here is the recommended phased approach.

### Phase 1: MVP Launch (3 plants)

| Plant | Why First |
|-------|-----------|
| **Sunflower** | Fast feedback. Best for first-time users. Art is straightforward (vertical growth). |
| **Oak** | Represents the core "ancient tree" vision. Every user should have one. Simple art (tree gets bigger). |
| **Cactus** | The "forgiving" option. Users who fear commitment need this. Art is minimal (geometric shapes). |

**Rationale:** These 3 plants cover the essential spectrum: fast/fragile (Sunflower), slow/resilient (Oak), minimal/indestructible (Cactus). Any user can find a match. The quiz for 3 plants needs only 1-2 questions.

### Phase 2: Depth (add 3 plants)

| Plant | Why Second |
|-------|-----------|
| **Bamboo** | The signature Habien plant. The "underground to explosive" story is unique and shareable. |
| **Lotus** | Emotional resonance. Vietnamese cultural connection. Visually stunning. |
| **Bonsai** | The "quality" differentiator. Appeals to craftspeople and makers. |

**Rationale:** These add the emotional depth and differentiation that make Habien special. Bamboo and Lotus are the plants users will tell friends about.

### Phase 3: Complete Set (add 3 plants)

| Plant | Why Third |
|-------|-----------|
| **Cherry Blossom** | Creative/seasonal habits. Beautiful art but complex (seasonal cycle system). |
| **Coconut Palm** | Social habits. Requires Garden Neighbors feature (Phase 6 of v3) to fully shine. |
| **Grapevine** | Interconnection mechanic. Requires multiple plants in garden to demonstrate value. |

**Rationale:** These are the "advanced" plants that add nuance. They depend on other systems (seasons, social, multi-plant) being mature.

## Art Asset Requirements

### Per Plant Type: 8 Stage Illustrations

Each plant needs 8 distinct visual states, one per growth stage. Here is the estimated art complexity:

| Plant | Art Complexity | Notes |
|-------|---------------|-------|
| Cactus | **Low** | Geometric shapes, mostly color/size changes between stages |
| Sunflower | **Low-Medium** | Vertical growth, clear silhouette changes |
| Oak | **Medium** | Tree gets bigger, bark texture, canopy detail increases |
| Bamboo | **Medium** | Underground phase (simple), then grove (more complex) |
| Coconut Palm | **Medium** | Vertical growth with fronds, fruit clusters |
| Lotus | **Medium-High** | Water effects, bloom animation, murky-to-clear transition |
| Bonsai | **High** | Requires multiple visual variants (shaping choices) |
| Cherry Blossom | **High** | Seasonal cycle system (4 seasons x 8 stages = many variants) |
| Grapevine | **High** | Must render connections to adjacent tiles, spreading mechanic |

**Total minimum art assets for MVP (3 plants):** 24 illustrations (8 stages x 3 plants)
**Total for complete set (9 plants):** 72 illustrations minimum

### Art Budget Strategy

1. **Seed and Sprout stages** can be similar across plant types (small green shoots). Invest less here.
2. **Mature and Established** are the stages most users will see first. Invest the most here.
3. **Ancient and Legendary** are rare but HIGH IMPACT -- these are the screenshots users share. Invest in quality.
4. **Use procedural effects** (particles, glow, color overlays) to enhance Venerable+ stages before commissioning full custom art.

## Monetization Alignment

| Tier | Available Plants |
|------|-----------------|
| **FREE "The Seed"** | Sunflower, Oak, Cactus (3 plants, 3 habit types) |
| **PRO "The Garden"** | + Bamboo, Lotus, Bonsai (6 plants total) |
| **PREMIUM "The Sage"** | + Cherry Blossom, Coconut Palm, Grapevine (all 9) |
| **Rebirth Stones** | Earned only (never purchased). Available to all tiers. |

**Why this split:** Free users get the 3 most fundamentally different plants, covering the core spectrum. PRO adds the emotionally deep plants that make users fall in love with the app. PREMIUM adds the complex, system-dependent plants for power users.

## Relationship to v2 Plant Catalog

The v2 catalog defines **32 plants across 5 tiers**. In v3, these become **cosmetic variants ("skins")** within the 9 core personality types. This preserves all existing art and player investment while adding the meaningful personality system.

### How It Works

```
v2: 32 plant types, each is a standalone species
v3: 9 personality types x multiple cosmetic skins per type

Example:
  v3 Personality: Cactus (The Desert Survivor)
  Available skins:
    - Xuong Rong / Cactus (v2 Tier 1) ← default skin
    - Sen Da / Succulent (v2 Tier 1)
    - "Prickly Pear" variant (earned)
    - "Golden Barrel" variant (premium)

  All skins share: same resilience, watering curve, growth story
  Each skin differs: visual appearance, animations, flavor text
```

### Complete v2 → v3 Mapping

#### Cay Soi / Oak -- "The Quiet Giant"

| v2 Plant | Tier | v2 Mechanic | Fit Reason | Skin Notes |
|----------|------|-------------|------------|------------|
| **Co / Grass** | T1 | Immortal mode, weather resilient | Resilient, foundational, never dies | Grass patch instead of tree. Unique: stays small but covers ground |
| **Bui Cay / Bush** | T2 | Shape trimming | Steady, low-drama, long-term | Classic bush shape. Trimming → shaping at milestones |
| **Thong / Pine** | T3 | Year-round green, cold resistant | Evergreen = eternal consistency | Pine tree shape. Unique: snow visual in winter |
| **Da / Banyan** | T4 | Aerial roots, spreading canopy | Ancient, massive, sheltering | Banyan with aerial roots. The most "epic" Oak skin |
| **Bo De / Bodhi Tree** | T4 | Enlightenment theme, meditation bonus | Spiritual, permanent, wise | Heart-shaped leaves. Unique: meditation aura particle |

> **5 skins.** Oak has the most variety because "foundational habit" is the broadest category.

#### Hoa Huong Duong / Sunflower -- "The Bright Starter"

| v2 Plant | Tier | v2 Mechanic | Fit Reason | Skin Notes |
|----------|------|-------------|------------|------------|
| **Rau Mam / Sprouts** | T1 | Speed grower, harvest cycle | Fastest visible change, daily feedback | Microgreens in a tray. Unique: harvest animation at Mature |
| **Hoa Cuc / Daisy** | T2 | Mood sync, streak blooms | Cheerful, daily, streak-responsive | Daisy cluster. Unique: extra flowers appear per streak week |
| **Hoa Huong Duong / Sunflower** | T3 | Heliotropism | Bright, tall, energy-giving | The default. Classic sunflower growth |
| **Hoa Tulip / Tulip** | T3 | Seasonal blooms | Colorful, vibrant, visible | Tulip field. Unique: color variety based on season |

> **4 skins.** All share the "quick result, daily engagement" personality.

#### Xuong Rong / Cactus -- "The Desert Survivor"

| v2 Plant | Tier | v2 Mechanic | Fit Reason | Skin Notes |
|----------|------|-------------|------------|------------|
| **Xuong Rong / Cactus** | T1 | Drought champion, spine shield | The original desert survivor | Saguaro shape. The default |
| **Sen Da / Succulent** | T1 | Water reserve, pup generation | Patient, stores reserves, low-maintenance | Rosette arrangement in pot. Unique: spawns "pup" decoration at Established |
| **Nam / Mushroom** | T2 | Grows in dark/neglect, surprise mechanic | Thrives with minimal attention | Mushroom cluster. Unique: glows at night. Most visually unique Cactus skin |

> **3 skins.** The "zero guilt, low maintenance" family.

#### Tre / Bamboo -- "The Underground Builder"

| v2 Plant | Tier | v2 Mechanic | Fit Reason | Skin Notes |
|----------|------|-------------|------------|------------|
| **Tre / Bamboo** | T4 | Hidden progress, delayed explosion | THE bamboo. 90-day underground phase | The default. Bamboo grove |
| **Khoai Lang / Sweet Potato** | T2 | Underground growth | Grows underground before surfacing | Root vegetable version. Unique: tubers visible under translucent soil |

> **2 skins.** Bamboo's personality is so specific that few v2 plants share it.

#### Hoa Sen / Lotus -- "The Transformer"

| v2 Plant | Tier | v2 Mechanic | Fit Reason | Skin Notes |
|----------|------|-------------|------------|------------|
| **Hoa Sen / Lotus** | T5 | Transformation, beauty from mud | The original transformer | Pink lotus in pond. The default |
| **Sen Vang / Golden Lotus** | T5 | Rare, legendary | Ultimate transformation | Gold lotus. Earned: only available via Rebirth from a regular Lotus at Ancient+ stage |
| **Hoa Hong / Rose** | T3 | Thorns + beauty, careful tending | Beauty requiring effort, sharp edges | Rose bush. Unique: thorns visible early, flowers late. "Beauty from pain" variant |

> **3 skins.** The "transformation from difficulty" family.

#### Cay Bonsai / Bonsai -- "The Craftsman"

| v2 Plant | Tier | v2 Mechanic | Fit Reason | Skin Notes |
|----------|------|-------------|------------|------------|
| **Bonsai** | T4 | Shaping, precision, unique per user | The original craftsman | Classic bonsai in ceramic pot. The default |
| **Hoa Lan / Orchid** | T3 | Delicate, precise care required | Quality-focused, fragile beauty | Orchid in decorative pot. Unique: bloom colors based on user's shaping choices |
| **Hoa Oai Huong / Lavender** | T2 | Calming aura, evening bonus | Precise, aesthetic, quality over quantity | Lavender bush in planter. Unique: calming particle aura |

> **3 skins.** The "mastery and craft" family.

#### Hoa Anh Dao / Cherry Blossom -- "The Seasonal Artist"

| v2 Plant | Tier | v2 Mechanic | Fit Reason | Skin Notes |
|----------|------|-------------|------------|------------|
| **Hoa Anh Dao / Cherry Blossom** | T5 | Seasonal bloom, ephemeral beauty | The original seasonal artist | Sakura tree. The default |
| **Hoa Mau Don / Peony** | T3 | Lush bloom, seasonal | Big dramatic blooms in bursts | Peony bush. Unique: larger individual flowers, shorter bloom period |
| **Hoa Phong Lan Rung / Wild Orchid** | Special | Seasonal appearance | Appears/disappears with seasons | Wild orchid. Unique: only visible during bloom phase (rest phase = empty tile with roots) |

> **3 skins.** The "creative bursts and rest" family.

#### Cay Dua / Coconut Palm -- "The Generous One"

| v2 Plant | Tier | v2 Mechanic | Fit Reason | Skin Notes |
|----------|------|-------------|------------|------------|
| **Cay Dua / Coconut Palm** | NEW | Fruit production, sharing | Social, giving habits | Tropical palm. The default |
| **Rau / Vegetable** | T2 | Harvest cycles, provider | Produces something to share/use | Vegetable garden plot. Unique: different veggies per season |
| **Ca Chua / Tomato** | T2 | Yield counter, staking | Tangible output, sharing results | Tomato plant on stake. Unique: countable fruit visible |

> **3 skins.** The "produce and share" family.

#### Cay Nho / Grapevine -- "The Connector"

| v2 Plant | Tier | v2 Mechanic | Fit Reason | Skin Notes |
|----------|------|-------------|------------|------------|
| **Cay Nho / Grapevine** | NEW | Spreading, connecting | Interconnects with other plants | Grapevine on trellis. The default |
| **Bac Ha / Mint** | T2 | Spreads runners, neighbor boost | Literally spreads to boost neighbors | Mint patch. Unique: runner connections are green herb trails instead of vine |
| **Co Ba La / Clover** | T1 | Lucky charm, patch spreading | Spreads, luck mechanic | Clover field. Unique: 4-leaf clover rare event preserved from v2 |

> **3 skins.** The "spread and connect" family.

### Remaining v2 Plants -- Seasonal/Special Skins

These v2 plants become **limited-time or event-exclusive skins** rather than permanent options:

| v2 Plant | Available As | When |
|----------|-------------|------|
| **Mai / Apricot Blossom** | Cherry Blossom skin | Tet (Lunar New Year) event |
| **Dao / Peach Blossom** | Cherry Blossom skin | Tet (Lunar New Year) event |
| **Cuc Vang / Yellow Chrysanthemum** | Sunflower skin | Mid-Autumn Festival |
| **Cay Tai Loc / Money Tree** | Oak skin | Tet event (prosperity theme) |
| **Hoa Cuc Tet / Tet Chrysanthemum** | Sunflower skin | Tet event |

### Summary

| v3 Personality | Total Skins (v2 + new) | FREE Skins | PRO+ Skins |
|---------------|------------------------|------------|------------|
| Oak | 5 | Co, Bui Cay | Thong, Da, Bo De |
| Sunflower | 4 | Rau Mam, Hoa Cuc | Hoa Huong Duong, Tulip |
| Cactus | 3 | Xuong Rong, Sen Da | Nam |
| Bamboo | 2 | Tre | Khoai Lang |
| Lotus | 3 | Hoa Sen | Sen Vang*, Hoa Hong |
| Bonsai | 3 | Bonsai | Hoa Lan, Lavender |
| Cherry Blossom | 3 | Hoa Anh Dao | Peony, Wild Orchid |
| Coconut Palm | 3 | Cay Dua | Rau, Ca Chua |
| Grapevine | 3 | Cay Nho | Bac Ha, Co Ba La |
| **Total** | **29 + 5 seasonal** | **11** | **18** |

*Sen Vang (Golden Lotus) is a special skin earned only through Rebirth of a regular Lotus at Ancient+ stage.

### Migration for Existing Users

Existing v2 users keep ALL their plants. On v3 migration:

1. Each existing plant auto-maps to its v3 personality type based on the table above
2. The v2 species becomes the plant's cosmetic skin
3. Growth days are calculated from `started_at` date
4. Visual stage maps directly (v2 already has seed → legendary stages)
5. All streaks, waterings, reflections, XP preserved
6. User sees: "Your plants have evolved! [Plant name] is now a [personality type]. Same plant, deeper story."

```sql
-- Migration example
-- A user's v2 Succulent becomes a Cactus-personality with Succulent skin
UPDATE plants SET
  personality_type = 'cactus',
  skin = 'succulent',
  growth_days = EXTRACT(DAY FROM NOW() - started_at)
WHERE plant_type_id = (SELECT id FROM plant_types WHERE name = 'Succulent');
```

## Database Implications

The v3 plant system suggests these changes to the plant creation flow:

```sql
-- The plant_types table shifts from 32 types to 9 core types
-- Each type has a personality profile stored as JSONB

ALTER TABLE plant_types ADD COLUMN personality JSONB;
-- personality: { patience: 5, commitment: 4, forgiveness: 3, drama: 5, focus: 2 }

ALTER TABLE plant_types ADD COLUMN watering_curve JSONB;
-- watering_curve: { seed: 1, sprout: 1, growing: 1, mature: 1, established: 2, ... }
-- Values = required watering every N days

ALTER TABLE plant_types ADD COLUMN tolerance_curve JSONB;
-- tolerance_curve: { seed: 3, sprout: 3, growing: 5, mature: 7, ... }
-- Values = days before dormancy

-- Rebirth tracking
ALTER TABLE plants ADD COLUMN rebirth_count INTEGER DEFAULT 0;
ALTER TABLE plants ADD COLUMN rebirth_history JSONB DEFAULT '[]';
-- rebirth_history: [{ from_type: "bamboo", to_type: "lotus", date: "2026-08-15", growth_days_at_rebirth: 247 }]

-- Rebirth stones
CREATE TABLE rebirth_stones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  earned_via TEXT NOT NULL, -- 'milestone_established', 'milestone_ancient', 'perfect_month', 'welcome_back', 'seasonal'
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ, -- NULL if unused
  used_on_plant_id UUID REFERENCES plants(id),
  CONSTRAINT valid_earned_via CHECK (earned_via IN ('milestone_established', 'milestone_ancient', 'perfect_month', 'welcome_back', 'seasonal'))
);
```

---

## Open Questions for Future Design Sessions

1. **Shaping choices for Bonsai**: How many unique visual variants per stage? This directly impacts art workload. Recommend starting with 2 choices (left/right branch direction) and expanding later.

2. **Cherry Blossom cycle timing**: Should bloom/rest cycles be calendar-aligned (spring bloom) or activity-aligned (every N days)? Activity-aligned is simpler to implement; calendar-aligned is more thematic.

3. **Grapevine connection visuals**: How to render connections to adjacent tiles without breaking the isometric grid system? May need a dedicated "connection layer" rendered above tiles.

4. **Coconut Palm fruit-sharing**: Full implementation requires Garden Neighbors (Phase 6). Should the fruit mechanic be simplified for pre-social launch? Possible alternative: share coconuts via link (social share).

5. **Sound design**: Each plant type should eventually have distinct ambient sounds (bamboo wind, lotus water, cactus desert). This is a polish item but worth planning early.

---

*Document created: 2026-02-22*
*Author: Habien Team + Claude*
*Related: VISION.md, v2 PLANT_CATALOG.md*

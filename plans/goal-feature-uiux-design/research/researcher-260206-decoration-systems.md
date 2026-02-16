# Decoration & Customization Systems: Mobile Game Best Practices
**Research Date**: 2026-02-06 | **Focus**: Habit Garden Phase 2-3 Garden Expansion

---

## 1. Unlock Progression Tiers (Actionable)

### Tier Structure (Recommended for Habit Garden)
```
Level 1-3:   Locked (introduction phase)
Level 4-7:   Tier 1 - Basic cosmetics (2-3 items)
Level 8-11:  Tier 2 - Intermediate (unlock 1-2/week)
Level 12-15: Tier 3 - Advanced (access all with optional unlock)
```

**Key Insight**: Don't gate everything. Unlock 30-40% cosmetics at start, rest earned gradually.

### Unlock Mechanisms
- **Progression-Based**: Level milestones (most predictable, user friendly)
- **Achievement-Based**: Complete specific actions (replay value driver)
- **Time-Based**: Daily/weekly/seasonal rewards (engagement anchor)
- **Currency-Based**: Earned XP/water reserves (autonomy feeling)

**Best Practice**: Layer them. Ex: Level unlock + achievement bonus = faster unlock.

---

## 2. Theme Systems

### Seasonal Architecture
- **Hardcode 4 themes**: Spring, Summer, Fall, Winter (predictable rotation)
- **Duration**: Auto-activate Dec 21, Mar 20, Jun 21, Sep 22 (equinox-aligned feels natural)
- **Storage**: `decoration_theme` enum field in profiles table (not JSON)

### Achievement-Based Themes (Secondary)
- **Milestones**: 50 plants, 100-day streak, 5 goals completed → unlock special theme
- **Rarity tiers**: Common (easy), Rare (25+ days), Epic (100+ days), Legendary (1000+ XP)
- **Strategy**: 2-3 themes/tier keeps players engaged without bloat

### Implementation Pattern
```
decorations table:
- id, user_id, decoration_id, is_active, unlocked_at, unlock_type (level|achievement|seasonal)

user_decorations (computed view):
- Filters by user + unlock requirements met
- Seasons apply globally, achievements + levels per-user
```

---

## 3. Database Patterns (Critical)

### Recommended Schema
```sql
-- Central decoration catalog (immutable)
CREATE TABLE decoration_types (
  id SERIAL PRIMARY KEY,
  key VARCHAR(50) UNIQUE,           -- "spring_tile_v1"
  name VARCHAR(100),
  category VARCHAR(20),              -- "tile" | "plant" | "particle"
  rarity VARCHAR(20),                -- "common" | "rare" | "epic" | "legendary"
  min_level INTEGER,
  unlock_type VARCHAR(20),           -- "level" | "achievement" | "seasonal"
  unlock_value VARCHAR(50),          -- "level:10" | "achievement:streak_100"
  seasonal_availability VARCHAR(20), -- "spring" | "year_round"
  asset_url VARCHAR(255)
);

-- User unlock state (mutable, indexed)
CREATE TABLE user_decorations (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  active_tile_decoration_id INTEGER REFERENCES decoration_types(id),
  active_plant_decoration_id INTEGER,
  active_theme VARCHAR(20),         -- "spring" | "summer" | ... | null
  unlocked_ids INTEGER[] DEFAULT '{}', -- All decoration IDs user has access to
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Unlock tracking (audit trail)
CREATE TABLE decoration_unlocks (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  decoration_id INTEGER REFERENCES decoration_types(id),
  unlock_type VARCHAR(20),
  unlocked_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, decoration_id)
);
```

### Query Pattern (Efficient)
```sql
-- Get user's available decorations
SELECT d.* FROM decoration_types d
WHERE d.id = ANY((
  SELECT unlocked_ids FROM user_decorations WHERE user_id = $1
));

-- Check if unlock condition met (server-side validation)
SELECT CASE
  WHEN unlock_type = 'level' AND (SELECT level FROM profiles WHERE id = $1) >= min_level THEN true
  WHEN unlock_type = 'achievement' THEN EXISTS(...)  -- achievement check
  WHEN unlock_type = 'seasonal' THEN current_date BETWEEN season_start AND season_end
  ELSE false END;
```

---

## 4. Psychology & Engagement

### FOMO Mitigation (Seasonal)
- **Always available**: Core cosmetics (70%)
- **Seasonal (90 days)**: Limited edition themes
- **Evergreen**: Achievements stay forever
- **Result**: New players feel inclusive, veterans get exclusivity

### Progression Feel
- **Unlock velocity**: 1 decoration per level early (Lv1-5), then 1 per 2-3 levels
- **Visual feedback**: Toast notification + "New decoration!" highlight
- **Immediate usability**: Don't require reloads or restarts

### Reward Timing
- **First unlock**: Level 5 (honeymoon phase)
- **Drought period**: Lv10-12 (mitigate with achievement unlocks)
- **Seasonal switch**: Auto-apply at equinox (zero friction)

---

## 5. Implementation Priorities

### Phase 2 (MVP - 2 weeks)
1. Create `decoration_types` catalog (20-30 basic items)
2. Add `user_decorations` table with active tile/theme fields
3. Build unlock checker utility
4. Add decoration selector modal (grid, filter by rarity)

### Phase 3 (Polish - 1 week)
1. Seasonal theme auto-application logic
2. Achievement-based unlock triggers
3. Migration script for existing users
4. Toast notifications on unlock

---

## 6. Key Decisions for Habit Garden

| Decision | Recommendation | Rationale |
|----------|----------------|-----------|
| **Currency** | XP-based, not separate | Keep economy simple, reuse level system |
| **Max decorations** | 50-80 total | Avoid decision paralysis, curate quality |
| **Daily cost** | None | Cosmetics ≠ power, free after unlock |
| **Lost on uninstall** | Keep forever | Sunk cost = retention |
| **Trading/gifting** | No | Avoids currency gaming, keeps personal |

---

## Unresolved Questions
- Should seasonal themes be "free this season, paywall next"? (Likely: always free, rarity badge applies)
- How many achievement-based decorations to launch with? (Recommend: 6-8)
- Should garden expansion slots also be cosmetic or mechanical? (Currently mechanical—keep separate)


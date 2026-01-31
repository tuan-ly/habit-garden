Design a comprehensive UI/UX system for Habit Garden's Goal feature, inspired by Goal Master but with garden metaphors.

## Context from exploration:

**Current Visual Language:**
- Isometric garden view with tiles (140px desktop, 120px tablet, 100px mobile)
- Plant growth stages: seed → sprout → growing → blooming → mature
- Game-style UI: bottom nav, floating HUD, glass morphism
- Gradient colors per plant type and progress status
- Animations: plant-sway, bloom, growth-burst, water-splash

**User Requirements:**
1. **Mood/Weather System**:
   - User selects mood daily (sunny/cloudy/rainy/stormy/rainbow)
   - Affects: XP multiplier (hard days = more XP), target threshold (80% on hard days), special achievements
   
2. **Goal Lifecycle**:
   - Goal duration matches plant growth timeline
   - When mature (100% growth), goal continues increasing (no end)
   - Targets increase weekly (weekly progression cycle)
   
3. **Weeds System**:
   - Auto-grow daily: each day without check-in = +1 weed
   - Tap to clear individual weeds (mini engagement)
   
4. **Chart showing progression** (like Goal Master):
   - Visual timeline showing weekly targets
   - Format: Week dates → Target value (e.g., "01-04 → 01-10 : — 10")
   - Allow changing goal mid-way

## Design Requirements:

### 1. Goal Setup Wizard (Redesign)
- Make it feel like "planting a goal seed"
- Show preview chart of weekly progression
- Option to customize targets manually
- Round all target numbers for cleaner UI

### 2. Goal Progress Display
- Progress chart matching plant growth visualization
- Weekly bars/columns showing actual vs target
- Current week highlight
- Progression curve visualization

### 3. Goal Modification UI
- Allow changing target mid-way
- Show before/after comparison
- Recalculate remaining weeks

### 4. Weeds Integration
- Visual weeds around plant when neglected
- Tap-to-clear interaction with satisfying animation
- Counter showing pending weeds

### 5. Mood Selection UI
- Daily mood picker (weather icons)
- Show bonus indicator when on hard day
- Track mood history

## Design Philosophy:
- "Gần gũi nhưng mạnh mẽ" (Approachable yet Powerful)
- Emotional connection with garden metaphor
- Progress visibility - always see improvement
- Forgiveness built-in - encourage recovery

Please design:
1. Component hierarchy and structure
2. UI mockup descriptions (wireframe-like)
3. Color schemes and gradients to use
4. Animation suggestions
5. Data flow between components
6. File structure for new components
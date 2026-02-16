# Garden Expansion UX: Best Practices & Implementation Guide

> **Date**: 2026-02-06
> **Context**: Habien 2.0 Phase 2 (Garden Expansion System)
> **Scope**: Progressive unlock patterns, celebration mechanics, visual transitions

---

## 1. Progressive Garden Growth Mechanics

### Core Pattern: Earned Spatial Growth
Successful habit games (Stardew Valley, Animal Crossing, Harvest Moon) use **incremental spatial expansion** as a progression reward:

**Key Principles:**
- **Slot-based gating** → Each garden slot unlocks at specific levels (Habien: Lv1/4/6/8/9/11/12)
- **Visible capacity** → Show "2/3 slots used" UI before planting
- **Reservation system** → Let users preview what's available before unlocking
- **No surprises** → Users know exactly when next slot unlocks and what it costs

**Anti-Pattern:** Unlimited growth from Day 1 → Leads to overwhelm and decision paralysis.

### Recommendation for Habien:
```
Slot Unlock Flow:
Lv1 (Day 1)    → 1 slot [████] Users plant one thing
Lv4 (Day 35)   → +1 slot [██████] "You can plant another!"
Lv6 (Day 70)   → +1 slot [██████████] Goals unlock too
Lv8-12 (progressive) → +1 each → Clear pacing
Lv15+ (Day 500+) → Unlimited (celebratory milestone)
```

**Result:** Users feel achievement every 20-40 days without pressure.

---

## 2. Unlock Celebration Patterns

### Animation Layer (Celebration Moments)
Best practices from mobile games show **4-phase unlock celebration**:

**Phase 1: Anticipation (Build-up)**
- Notification appears subtly (top-left, not center)
- Icon pulses 2-3 times (not overwhelming)
- "Slot available" badge on next empty space

**Phase 2: Trigger (User Action)**
- User taps empty slot or clicks "Plant"
- Smooth modal slide-up (350ms cubic-easing)
- Show what's newly available

**Phase 3: Emotional Peak (Micro-celebration)**
- Brief confetti burst (2-3 sec, not spammy)
- Success sound (optional, muted by default)
- "New tier unlocked!" modal with plant preview

**Phase 4: Integration (Normal Play)**
- Modal closes, return to garden
- New slot shows up on grid (no jarring refresh)
- Smooth scroll to new area if off-screen

### Notification Timing
**Anti-pattern:** Pop-ups when user opens app (creates anxiety)

**Pattern:** Notify after next meaningful action
```
Event: Level up → Next watering → Show notification
→ "You've unlocked Tier 2 plants!"
```

### Recommended Habien Implementation:
```
LevelUpNotification {
  title: "New Slot Unlocked!"
  subtitle: "You can plant another seed"
  cta: "Plant now" | "Maybe later"
  animation: {
    entrance: "slideUp", 300ms, easeOut
    exit: "fadeOut", 200ms
  }
}

PlantTierUnlock {
  title: "Tier 2: Reliable Partners"
  plants: [Daisy, Mint, Lavender preview]
  warning: "Need 1 mature plant + 7-day streak"
  status: "✓ Ready!" | "Locked (9 more days)"
}
```

---

## 3. Visual Expansion Techniques

### Viewport Strategies
**Pattern 1: Smooth Scroll Reveal**
- New slot appears below fold (off-screen)
- On unlock, auto-scroll garden viewport +1 slot
- Duration: 400-600ms ease-out (feels deliberate, not rushed)

**Pattern 2: Grid Reflow**
- Garden uses responsive grid (CSS Grid `auto-fit`)
- New slot adds at calculated position
- Existing plants animate to new grid positions (150ms, preserving scroll)

**Pattern 3: Layered Cards**
- Empty slots show as semi-transparent "ghost" cards before unlock
- On unlock: opacity 0 → 1, scale 0.8 → 1.0 (200ms)
- Reinforces "this was always waiting for you"

### Visual Hierarchy for Locked Content
```
Unlocked Slot:    [████] Ready to plant | Plant here
Locked Slot:      [░░░░] Locked at Level 8 | 2 days away
Ghost Slot:       [░░░░] (faded, barely visible) | Locked at Level 12
```

**Anti-pattern:** Greyed-out disabled buttons (feels punitive)
**Pattern:** Translucent slots with timers (feels supportive)

### Animation Library (CSS-first)
```css
/* Smooth expansion */
@keyframes expandSlot {
  from { opacity: 0.5; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Garden reflow */
@keyframes reflow {
  from { gap: 16px; }
  to { gap: 16px; } /* CSS Grid handles movement */
}

/* Confetti burst (minimal) */
@keyframes confetti {
  0% { opacity: 1; transform: translateY(-20px) rotate(0deg); }
  100% { opacity: 0; transform: translateY(60px) rotate(720deg); }
}
```

---

## 4. Tier Unlock Celebrations

### Tier Progression Moment
When user unlocks Tier 2/3/4/5, create **milestone celebration**:

```
Level 7 Hit:
┌─────────────────────────────────────┐
│ 🌟 TIER 2 UNLOCKED! 🌟              │
│                                     │
│ Reliable Partners await             │
│ [🌼 Daisy] [🌿 Mint] [💜 Lavender]│
│                                     │
│ These plants need more care,       │
│ but reward your commitment!        │
│                                     │
│ ✓ You have 1 mature plant          │
│ ✓ You have 7-day streak            │
│ ⚠ Fair warning: 2-4 day watering  │
│                                     │
│ [Plant Tier 2] [Not Ready]         │
└─────────────────────────────────────┘
```

**Key Elements:**
- Celebratory visuals (stars, glow, background shift)
- Context why user earned it
- Requirements checklist (psychological closure)
- Clear CTA without pressure
- Option to defer ("Not Ready" is valid)

---

## 5. Smooth Transition Techniques

### Garden Growth Sequence
```
Stage 1: Lock
  └─ Grey slot, opacity 60%, locked icon

Stage 2: Countdown (optional)
  └─ "Unlocks in 2 days" badge
  └─ Subtle pulse animation every 12 hours

Stage 3: Ready
  └─ Bright slot, pulsing glow (2sec cycle)
  └─ "Ready to plant!" indicator

Stage 4: Plant!
  └─ Smooth modal opens
  └─ User selects plant → Animation plays
  └─ Plant appears with grow effect (300ms)
```

### No Jarring Reflows
```javascript
// ❌ Bad: Sudden layout shift
garden.slots = [1, 2, 3, 4] // BANG, 4th slot appears

// ✅ Good: Animated transition
garden.addSlot(4)            // CSS Grid handles reflow
  .animate({
    duration: 300,
    easing: 'easeOut',
    onComplete: () => autoScroll(slot4)
  })
```

### Scroll Anchoring
- If new slot is visible: No scroll needed
- If new slot is below fold: Smooth scroll to center it (400ms)
- Preserve user's scroll position on other areas of UI

---

## 6. Specific Habien 2.0 Integration

### Level-Up Flow (Recommended)
```
1. User reaches Level 4
2. XP bar fills (existing animation)
3. Level-up modal shows
4. "New plant slot unlocked!" toast notification
5. On close, garden highlights the new empty slot
6. New slot has pulsing "plant here" indicator
7. User taps → Familiar plant picker opens
```

### Tier Unlock Preconditions
Before showing Tier 2+ unlock celebration:
- Check level requirement ✓
- Check mature plant count ✓
- Check streak requirement ✓
- Show realistic timeline if not ready

```typescript
// Example: Can plant Tier 2 at Level 7?
if (profile.level >= 7) {
  const stats = getUserStats(userId);

  if (stats.maturePlants >= 1) {
    showTierUnlockCelebration('tier2');  // Ready now!
  } else {
    showTierUnlockCooldown('tier2', {     // Coming soon...
      daysUntilReady: 25,
      reason: 'Need 1 mature plant'
    });
  }
}
```

### Toast Notification Hierarchy
```
Priority 1 (Critical): "Plant died" → Center, 5sec, red
Priority 2 (Achievement): "Slot unlocked!" → Top, 4sec, blue
Priority 3 (Milestone): "Level up!" → Top, 3sec, gold
Priority 4 (Info): "Watered 10 plants" → Bottom, 2sec, grey
```

---

## 7. Technical Checklist for Implementation

- [ ] **Grid System**: Responsive CSS Grid for garden slots (not hardcoded)
- [ ] **Empty Slots**: Show ghost/placeholder for upcoming unlocks
- [ ] **Animation Library**: Tailwind + Framer Motion for consistent timing
- [ ] **Toast Queue**: Max 2 notifications visible at once
- [ ] **Scroll Behavior**: Auto-scroll new slots into view smoothly
- [ ] **Accessibility**: Keyboard navigation for all modals, ARIA labels for locked slots
- [ ] **Performance**: Lazy-load plant previews, debounce resize events
- [ ] **State Management**: Track which slots are revealed/animated to avoid re-triggering

---

## 8. Anti-Patterns to Avoid

| ❌ Don't | ✅ Do Instead |
|---------|-------------|
| Unlimited slots from Day 1 | Gate slots by level |
| Alert modals for every unlock | Subtle notifications + passive toasts |
| Greyed-out disabled buttons | Translucent slots with timers |
| Pop-ups on app open | Notify after next action |
| Jarring layout reflows | Smooth CSS transitions |
| Confetti for everything | Reserve celebration for tier/major unlocks |
| Complex tier requirement tooltips | Show requirement checklist with ✓/✗ |

---

## 9. Metrics to Track

- Time to unlock next slot (should feel achievable: 15-50 days)
- Slot usage rate (did user plant in new slot within 7 days?)
- Tier 2+ adoption rate (% of L7+ players who unlock)
- Notification engagement (did user tap unlock modal?)
- Garden growth curve (avg plants at each level)

---

## Summary: Three-Tier Implementation

### Tier 1 (MVP): Slot Gating + Toast
- Add empty slot cards to garden grid
- Show level-up toast: "New slot unlocked!"
- Filter plant picker by tier
- Smooth scroll on new slot unlock

### Tier 2: Celebration Modals
- Add tier unlock celebration modal (Level 6 goals, Level 10 Tier 3, etc.)
- Requirement checklist UI
- 30-sec confetti on first unlock

### Tier 3: Polish
- Ghost slots with countdown timers
- Achievement callout in garden (achievement badge animation)
- Seasonal expansion themes

---

*Report: Garden Expansion UX Best Practices*
*Basis: Stardew Valley, Animal Crossing, Duolingo, Habitica patterns*
*For: Habien 2.0 Phase 2 Implementation*

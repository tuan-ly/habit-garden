# UX Audit: Plant Story Chapters

- Date: 2026-08-21
- Surface: Mobile per-plant history concept
- User goal: Revisit the complete history of one plant/habit and find a past moment
- Evidence: `01-living-chapters.png`

## Verdict

The concept is emotionally clear and easy to browse, but only moderately efficient for finding a specific old log. Keep the storybook style while making chapters predictable, reducing the current-chapter hero, and exposing the raw timeline within one tap.

## Flow Health

1. Identify plant and location — Good. The title and Journey back action establish context immediately.
2. Understand the current chapter — Good. The hierarchy and recent moments are easy to read, but the hero consumes too much vertical space.
3. Choose an older chapter — Mostly good. Date ranges support recognition, but poetic titles cannot replace predictable grouping.
4. Find an exact historical log — Needs work. Opening a chapter adds a step, and the concept does not expose filters, search, or a clear full-timeline action.

## Highest-Impact Changes

- Use automatic monthly chapters so users can predict where a date belongs.
- Reduce the current chapter to roughly one-third of the initial viewport.
- Make each complete chapter row tappable, not only the chevron.
- Show `Xem tất cả trong tháng` after the recent moments.
- Add a compact plant switcher and optional filters only after the history becomes long.

## Accessibility Risks

- Verify small text contrast over textured cream surfaces.
- Keep chapter targets at least 44 by 44 CSS pixels and provide explicit accessible names.
- Hide decorative botanical art from assistive technology.
- Keyboard, focus, screen-reader announcements, zoom and responsive reflow require implementation testing.

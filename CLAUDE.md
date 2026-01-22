# Claude Code Instructions for Habit Garden

## Context Strategy (Token-Optimized)

**MEMO.md is lean (~130 lines).** Read it at session start for quick context.

**For deep dives**, read these on-demand:
- `DEVLOG.md` - Implementation history (when debugging or continuing past work)
- `DECISIONS.md` - Architecture reasoning (when making design choices)

**DO NOT** read all docs upfront. Only what's needed for the task.

---

## Quick Start

1. **Read** `.claude/MEMO.md` - Current status, recent sessions, working features
2. **Identify** what task needs
3. **Read additional context** only if needed

---

## After Work

**Update MEMO.md** with:
- Session date and title (1 line)
- What changed (bullet points, max 5)
- Key files (links)

**Move details to DEVLOG.md** if:
- Complex implementation worth documenting
- Bug fix with root cause analysis
- New system/feature added

**Keep MEMO.md under 200 lines.** Archive old sessions to DEVLOG.md.

---

## Project Quick Reference

| Item | Value |
|------|-------|
| Stack | Next.js 16, Supabase, Tailwind CSS 4, shadcn/ui |
| Phase | 4 - Polish & Launch |
| Plants Dir | `public/plants/[type]/[stage].png` |
| Server Actions | `src/lib/actions/` |
| Components | `src/components/` (garden, plants, goals, game-ui) |

---

## Key Directories

```
src/components/
├── garden/      # Isometric garden, tiles, zoom, decorations
├── plants/      # Plant visual, cards, dialogs
├── goals/       # Goal tracking UI
└── game-ui/     # HUD, nav, mood selector

src/lib/
├── actions/     # Server actions
├── context/     # React contexts
└── hooks/       # Custom hooks
```

---

## Commit Format

```
<type>: <description>

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

Types: feat, fix, refactor, docs, style, test, chore

# Claude Code Instructions for Habit Garden

## ⚠️ MANDATORY: Read Before ANY Task

**Khi bắt đầu session mới, PHẢI đọc file `.claude/MEMO.md` TRƯỚC KHI làm bất cứ điều gì.**

File này chứa:
- Trạng thái hiện tại của project
- Những gì đã hoàn thành
- Những gì chưa hoạt động
- Files quan trọng cần biết

Nếu user hỏi về project mà chưa đọc MEMO.md → Đọc ngay!

## Quick Start Protocol

**IMPORTANT: Before starting ANY task, read these files first:**

1. `.claude/MEMO.md` - Current project state and recent changes
2. `.claude/DECISIONS.md` - Architecture decisions and reasoning
3. `doc/11 - IMPLEMENTATION-PHASES.md` - Task completion status

## After Completing Work

**ALWAYS update these files after significant changes:**

1. **`.claude/MEMO.md`** - What changed, new files, what works/doesn't
2. **`.claude/DECISIONS.md`** - Any architectural choices made
3. **`doc/11 - IMPLEMENTATION-PHASES.md`** - Mark tasks complete
4. **`.claude/DEVLOG.md`** - Add session entry (what did, learned, challenges)
5. **`.claude/CHANGELOG.md`** - If user-facing feature (for release notes)
6. **`.claude/ROADMAP.md`** - If phase status changed

## Documentation Structure

```
.claude/
├── MEMO.md        # Current state (read first!)
├── DECISIONS.md   # Why we built things this way
├── DEVLOG.md      # Development journal
├── CHANGELOG.md   # Version history for users
├── ROADMAP.md     # Product roadmap
├── STORY.md       # Product story for marketing
└── PROTOCOL.md    # Rules and conventions
```

## Project Context

- **App**: Habit Garden - Gamified habit tracking with virtual plants
- **Stack**: Next.js 16, Supabase, Tailwind CSS 4, shadcn/ui
- **Current Phase**: Phase 3 - Goal Tracking (pending)
- **Completed**: Phase 1 (MVP), Phase 2 (Gamification)

## Key Directories

```
.claude/           → Project memo and decisions (READ FIRST!)
src/components/    → React components by feature
src/lib/           → Utilities and server actions
src/types/         → TypeScript definitions
doc/               → Project documentation
```

## Commit Messages

Use format: `<type>: <description>` with Co-Authored-By trailer.
Types: feat, fix, refactor, docs, style, test, chore

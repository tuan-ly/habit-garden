# AI Codebase Context Management — So Sánh Các Framework & Công Cụ

> **Ngày**: 2026-03-10
> **Mục đích**: So sánh các phương pháp giúp AI assistant hiểu nhanh codebase, định vị đúng phần code liên quan

---

## TL;DR

Không có "silver bullet". Kết hợp tối ưu cho 2025–2026:
1. **CLAUDE.md / AGENTS.md** (nền tảng — bắt buộc)
2. **`.claude/rules/` path-scoped** (cho codebase lớn)
3. **Context7 MCP** (cho library docs)
4. **Repomix** (khi cần dump toàn bộ repo cho AI phân tích một lần)
5. **ADR** (cho quyết định kiến trúc quan trọng)

---

## 1. CLAUDE.md / AGENTS.md — "Tờ hướng dẫn cho AI"

### Cách hoạt động
File markdown đặt ở root hoặc `.claude/CLAUDE.md`. Claude Code đọc toàn bộ vào context mỗi session. Có thể import file khác qua `@path/to/file`.

**Phân cấp scope:**
- `C:\Program Files\ClaudeCode\CLAUDE.md` — org-wide policy
- `./CLAUDE.md` hoặc `./.claude/CLAUDE.md` — project (share với team)
- `~/.claude/CLAUDE.md` — personal preferences
- `.claude/rules/*.md` — topic-specific rules, có thể path-scoped

**AGENTS.md** (OpenAI Codex convention) — tương tự CLAUDE.md nhưng cho OpenAI ecosystem. GitHub Copilot dùng `.github/copilot-instructions.md`. Pattern này đang converge về standard.

### Pros
- Zero-setup, plain markdown, ai cũng hiểu
- Versioned trong git, share toàn team
- Auto-load, AI không cần search thêm
- Path-scoped rules chỉ load khi làm việc với file matching glob → tiết kiệm token
- `/init` command tự tạo CLAUDE.md từ codebase analysis

### Cons
- Phải tự maintain thủ công — AI không tự cập nhật (trừ auto memory)
- Giới hạn ~200 lines trước khi ảnh hưởng adherence
- Context window vẫn tiêu tốn token dù file không liên quan đến task

### Hiệu quả với AI
**Cao nhất** trong tất cả phương pháp. AI đọc trước, định hướng toàn bộ session. Đây là nền tảng, các tool khác bổ trợ thêm.

**Best practices:**
```
CLAUDE.md (~100-150 lines):
├── Stack nhanh (Next.js 16, Supabase, Tailwind 4)
├── Key directories map
├── Commit format
├── Test commands
└── @import ARCHITECTURE.md (on demand)

.claude/rules/
├── api-design.md      (paths: src/lib/actions/**)
├── components.md      (paths: src/components/**)
└── database.md        (paths: src/types/**, supabase/**)
```

---

## 2. Cursor Rules / `.cursor/rules` — "Rules của IDE"

### Cách hoạt động
File `.mdc` (markdown + frontmatter YAML) đặt trong `.cursor/rules/`. Cursor inject vào context dựa theo loại rule.

**4 loại rule:**
| Loại | Trigger | Use case |
|------|---------|----------|
| Always Apply | Mọi session | Coding standards, naming conventions |
| Auto Attached (glob) | Khi file matching mở | Component rules cho `*.tsx` |
| Agent Requested | AI tự quyết dựa theo description | Library-specific guides |
| Manual (`@rule-name`) | User gọi thủ công | One-off workflows |

```markdown
---
description: React component conventions
globs: src/components/**/*.tsx
alwaysApply: false
---
# Component Rules
- Use functional components only
- Co-locate tests with components
```

### Pros
- Granular hơn CLAUDE.md — rules chỉ load khi cần
- Không tốn token cho rules không liên quan
- Có thể share qua git
- Symlink support để reuse rules cross-project

### Cons
- Cursor-specific — không dùng được với Claude Code, Copilot
- Phải biết MDC frontmatter format
- `.cursorrules` (cũ) vs `.cursor/rules/` (mới) — migration confusing

### Hiệu quả với AI
**Tốt cho codebase lớn** với nhiều domain khác nhau (frontend/backend/db). Rules tự động context-switch khi AI làm việc với loại file khác nhau.

---

## 3. Repomix — "Dump toàn bộ repo thành 1 file"

### Cách hoạt động
CLI tool đóng gói cả repo thành 1 file XML/Markdown/JSON. AI nhận file đó → có full context không cần tool calls.

```bash
npx repomix                          # toàn bộ repo
npx repomix --compress               # dùng Tree-sitter, giảm ~70% token
npx repomix --include "src/lib/**"   # chỉ một phần
```

**Tính năng nổi bật:**
- Token counting — biết trước có vừa context window không
- Secretlint integration — scan credential trước khi share
- Code compression via Tree-sitter — giữ structure, bỏ detail thừa

### Pros
- Không cần AI tự search file — toàn bộ code trong một prompt
- Tốt cho one-shot analysis: security audit, refactor plan, documentation
- Hoạt động với bất kỳ AI service nào (không vendor lock-in)
- Không cần setup MCP hay config

### Cons
- Không phù hợp cho daily workflow (quá nhiều token)
- File output lớn, không tiện cho conversation dài
- Không "live" — phải chạy lại khi code thay đổi
- 70% compression vẫn có thể rất lớn với repo lớn

### Hiệu quả với AI
**Tốt cho task cụ thể, một lần**: "Review toàn bộ auth flow", "Tìm tất cả N+1 queries". Không phù hợp làm context thường trực.

---

## 4. Context7 MCP — "Library docs tươi cho AI"

### Cách hoạt động
MCP server từ Upstash. Khi AI cần dùng library, thay vì dùng training data (có thể outdated), Context7 pull docs thực tế theo đúng version.

```bash
# Setup Claude Code
claude mcp add --scope user \
  --header "CONTEXT7_API_KEY: YOUR_KEY" \
  --transport http context7 https://mcp.context7.com/mcp

# Dùng trong prompt
"Implement Supabase realtime subscription. use context7"
```

**2 tools chính:**
- `resolve-library-id` — match tên library (e.g., "next.js" → `/vercel/next.js`)
- `query-docs` — lấy docs theo topic và version

### Pros
- Giải quyết vấn đề hallucination do outdated training data
- Version-specific: "Next.js 16" không nhầm với Next.js 14 APIs
- Hỗ trợ 30+ major libraries
- Tích hợp tốt với cả Claude Code và Cursor

### Cons
- Cần API key (có free tier)
- Chỉ có tác dụng với public libraries — không hiểu internal codebase
- Latency khi fetch docs
- Số lượng libraries còn hạn chế (30+, không phải mọi lib)

### Hiệu quả với AI
**Rất tốt khi dùng API mới** của thư viện đang update nhanh (Next.js 16, Supabase v2, shadcn/ui). Habit Garden dùng Next.js 16 + Supabase nên Context7 rất relevant.

---

## 5. Architecture Decision Records (ADR) — "Giải thích tại sao"

### Cách hoạt động
Mỗi ADR là 1 file markdown ngắn ghi lại 1 quyết định kiến trúc:

```markdown
# ADR-001: Use Supabase for Backend

## Status: Accepted
## Context: Need BaaS with realtime, auth, storage
## Decision: Supabase over Firebase
## Consequences: PostgreSQL, RLS, no vendor lock-in vs Google
```

Đặt trong `docs/adr/` hoặc `adr/`. Tools: `adr-tools` (CLI), `log4brains` (web UI).

### Pros
- AI hiểu *tại sao* code được viết như vậy, không chỉ *làm gì*
- Giảm "tại sao không dùng X?" — ADR giải thích trước
- Sống lâu dài, không bị stale như comments
- Có thể import vào CLAUDE.md via `@docs/adr/`

### Cons
- Overhead khi viết — team ít kỷ luật thì không ai maintain
- AI vẫn phải đọc ADR mới biết — không auto-discover
- Không giúp AI navigate code, chỉ giải thích context

### Hiệu quả với AI
**Tốt cho context "tại sao"**, ít tốt cho context "ở đâu". Kết hợp với CLAUDE.md: import key ADRs vào CLAUDE.md via `@`.

---

## 6. Công cụ MCP cho Codebase Navigation

### Các MCP server đáng chú ý (2025):

| Tool | Chức năng | Trạng thái |
|------|-----------|------------|
| **MCP Git** | Search, đọc, navigate git repo | Official, stable |
| **MCP Filesystem** | File ops với access control | Official, stable |
| **MCP Memory** | Knowledge graph persistent memory | Official, stable |
| **DeepWiki (Devin)** | AI-powered codebase Q&A | Remote MCP, SaaS |
| **Ref MCP** | Up-to-date docs từ public repos | Community |
| **Octocode** | AI analysis GitHub repos lớn | Community |
| **Context7** | Library documentation | Production-ready |

### MCP Memory — "Feature Registry tự xây"
MCP Memory server dùng knowledge graph để lưu entities và relationships. Có thể dùng để build feature registry thủ công:

```
Entity: "moisture-decay"
  - type: feature
  - files: ["src/app/api/cron/moisture-decay/route.ts", "supabase/migrations/..."]
  - status: active
  - depends_on: ["plant-status", "activity-logs"]
```

Nhưng hiện tại **không có tool nào tự động build feature registry** từ codebase — vẫn cần viết thủ công.

### Không có "Feature Registry MCP" hoàn chỉnh (tính đến 3/2026)
Đây vẫn là gap. DeepWiki gần nhất nhưng là SaaS closed-source. Giải pháp thực tế hiện tại: viết ARCHITECTURE.md thủ công với feature registry.

---

## 7. Các Pattern Mới 2025–2026

### GitHub Copilot Instructions
`.github/copilot-instructions.md` — repo-wide instructions cho Copilot. Hỗ trợ path-specific instructions trong `.github/instructions/*.instructions.md`.

### Prompt Files
`.github/prompts/*.prompt.md` — reusable prompt templates với file references. VS Code, JetBrains support.

### Claude Code Auto Memory
Claude tự ghi notes vào `~/.claude/projects/<repo>/memory/` — học từ corrections, patterns. Không phải config manual.

### `.claude/rules/` Path-scoped Rules
Tính năng mới của Claude Code — rules chỉ load khi làm việc với files matching glob. Giải quyết vấn đề token waste của CLAUDE.md monolithic.

---

## So Sánh Tổng Hợp

| Tiêu chí | CLAUDE.md | Cursor Rules | Repomix | Context7 | ADR |
|----------|-----------|--------------|---------|----------|-----|
| Setup effort | Thấp | Trung bình | Zero | Thấp | Trung bình |
| Token cost | Trung bình | Thấp | Rất cao (1-shot) | Thấp | Thấp |
| Cập nhật | Thủ công | Thủ công | Tự động (re-run) | Tự động | Thủ công |
| Vendor lock | Claude | Cursor | None | None | None |
| Hiểu "ở đâu" | Tốt | Tốt | Xuất sắc | N/A | Kém |
| Hiểu "tại sao" | Tốt | Kém | Tốt | Kém | Xuất sắc |
| Library docs | Kém | Kém | Kém | Xuất sắc | Kém |
| Team-shared | Tốt | Tốt | N/A | Tốt | Tốt |

---

## Khuyến Nghị cho Habit Garden

**Hiện tại** (dùng Claude Code):
1. CLAUDE.md hiện tại đang tốt — giữ nguyên pattern MEMO.md + on-demand docs
2. Thêm `.claude/rules/` cho path-specific rules (e.g., rules riêng cho `src/lib/actions/`, `src/components/`, `supabase/migrations/`)
3. Cài Context7 MCP — hữu ích khi dùng Next.js 16 + Supabase APIs mới
4. Không cần Repomix cho daily work — chỉ dùng khi cần one-shot full analysis

**Cải tiến ARCHITECTURE.md** — thêm feature registry table:
```markdown
| Feature | Files | Status | Notes |
|---------|-------|--------|-------|
| moisture-decay | api/cron/moisture-decay/route.ts | active | cron 17:00 UTC |
| xp-system | lib/xp-system.ts, lib/actions/activity.ts | active | 15 levels |
```

---

## Câu Hỏi Còn Mở

1. DeepWiki có thực sự hoạt động tốt với private repos không? (SaaS, cần test)
2. Auto memory của Claude Code có đủ tốt để thay thế MEMO.md manual không?
3. Khi nào nên migrate sang `.claude/rules/` thay vì monolithic CLAUDE.md?
4. Có tool nào tự động generate feature registry từ git history không?

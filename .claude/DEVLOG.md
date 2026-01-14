# Development Log - Habit Garden

> Nhật ký phát triển theo thời gian thực. Ghi lại những gì đã làm, học được, và suy nghĩ trong quá trình xây dựng sản phẩm.

---

## Cách sử dụng file này

Mỗi entry gồm:
- **Date**: Ngày làm việc
- **Duration**: Thời gian làm (ước tính)
- **What I did**: Công việc cụ thể
- **What I learned**: Bài học rút ra
- **Challenges**: Khó khăn gặp phải
- **Next**: Việc cần làm tiếp

---

## 2024-01-14

### Session: Phase 2 Gamification Complete

**Duration**: ~3 hours

**What I did**:
- Hoàn thành toàn bộ Phase 1 (Plant Animations) và Phase 2 (Gamification)
- Tạo hệ thống CSS animations cho plant states (seed → sprout → growing → blooming → mature → wilting → dead)
- Build PlantVisual component với growth stage detection
- Implement special plant effects (Bamboo, Sunflower, Cherry Blossom, Cactus, Lotus, Rose, Bonsai, Money Tree)
- Xây dựng XP system với 15 levels và exponential scaling
- Tạo 20+ achievements với 4 tiers
- Implement daily weather system (deterministic based on date)
- Build water reserves system cho streak protection
- Tạo stats dashboard tổng hợp
- Build cemetery view cho dead plants history
- Setup project memo system (.claude/ files)

**What I learned**:
1. CSS animations đủ mạnh cho hầu hết use cases, không cần Lottie phức tạp
2. Deterministic pseudo-random (dùng date hash) tốt hơn DB storage cho weather
3. Exponential XP scaling tạo cảm giác progression tốt
4. Achievement definitions nên ở code, không phải DB - type-safe và version control

**Challenges**:
- TypeScript strict mode bắt lỗi `0` không phải `boolean` - phải dùng `!!` để convert
- Quyết định animation strategy: chọn CSS vì performance và simplicity

**Files created**:
```
src/components/plants/plant-visual.tsx
src/components/plants/special-effects.tsx
src/lib/xp-system.ts
src/lib/achievements.ts
src/lib/weather-system.ts
src/lib/water-reserves.ts
src/components/gamification/ (7 files)
src/components/garden/cemetery-view.tsx
.claude/PROTOCOL.md
.claude/MEMO.md
.claude/DECISIONS.md
CLAUDE.md
```

**Next**:
- Integrate gamification components vào UI thực tế
- Wire up achievement checking sau khi water
- Apply weather modifiers vào watering action
- Start Phase 3: Goal Tracking

---

## Template for future entries

```markdown
## YYYY-MM-DD

### Session: [Title]

**Duration**: X hours

**What I did**:
-

**What I learned**:
1.

**Challenges**:
-

**Files created/modified**:
-

**Next**:
-
```

---

## Statistics

| Metric | Value |
|--------|-------|
| Total sessions | 1 |
| Total hours (est.) | ~3h |
| Files created | 20+ |
| Lines of code | ~5000 |
| Phases completed | 2/5 |

---

## Key Decisions Made

| Date | Decision | Reason |
|------|----------|--------|
| 2024-01-14 | CSS animations over Lottie | Performance, simplicity, no external files needed |
| 2024-01-14 | Deterministic weather | No DB storage, consistent across users, predictable testing |
| 2024-01-14 | Achievements in code | Type safety, version control, no async needed |
| 2024-01-14 | Exponential XP scaling | Better progression feel, prevents quick max-level |

---

## Lessons for Future Projects

1. **Start with good documentation structure** - Memo/Decision/Changelog từ đầu giúp track progress tốt hơn

2. **CSS animations often enough** - Đừng over-engineer với animation libraries khi CSS đủ dùng

3. **Deterministic > Random for predictable features** - Dễ test, dễ debug, consistent UX

4. **Keep achievement logic separate from DB** - Flexibility để thay đổi mà không cần migration

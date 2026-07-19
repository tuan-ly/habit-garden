# Habit Garden — Redesign Master Plan

Ngày lập: 2026-07-10  
Trạng thái: Core experience implemented on `codex/garden-experience-rewrite`  
Nguồn: `docs/ux-audit/retention-strategy-2026-07-10/README.md`, OpenWiki và code hiện tại

## 1. Quyết định chiến lược đề xuất

Thực hiện **Experience Rewrite, không Platform Rewrite**.

**Experience Rewrite** là viết lại kiến trúc trải nghiệm, hierarchy, navigation, interaction và visual shell nhưng giữ các domain capability đã hoạt động. Chọn hướng này vì nó giải quyết **Reward Separation** và **Dashboard Gravity**, trong khi viết lại toàn bộ platform chủ yếu giải quyết technical structure và tạo rủi ro migration không cần thiết.

### North Star

> Mỗi ngày chăm một khoảnh vườn. Mỗi mùa viết một chương về con người bạn đang trở thành.

### Core loop bắt buộc

`Arrive → Notice one plant → Act → Garden reacts → Reveal → Anticipate tomorrow`

Nếu vertical slice này chưa khiến người thử muốn quay lại, không mở rộng sang Store, Stats, Community hoặc full narrative.

## 2. Ma trận giữ, sửa, thay và tạm dừng

### Giữ nguyên nền tảng

- Supabase schema, RLS, auth và server-action boundary.
- Plant, activity log, goal, moisture, Gentle Growth và rest-path domain logic.
- Canvas-first garden rendering, grid positioning, zoom/pan primitives.
- Plant asset pipeline, inventory data và progression logic ở backend.
- Design direction Living Garden: biophilic, calm, no-guilt, mobile-first.

### Refactor có kiểm soát

- `GardenView`: tách page orchestration khỏi các experience mode.
- Modal entry flow: một orchestrator duy nhất cho onboarding, mood và welcome back.
- Garden interactions: lựa chọn cây, camera focus, optimistic check-in và reaction timeline.
- Plant Detail: progressive disclosure, ưu tiên “Why I started” và chapter hiện tại.
- Celebration: từ card `Watered + XP` sang biến đổi trực tiếp của cây/khu vườn.
- Navigation và responsive shell.

### Thay hoàn toàn

- Today dashboard hiện tại và action queue dạng productivity dashboard.
- Hai lớp navigation có nhãn Today/Garden trùng nhau.
- XP-first return/check-in messaging.
- `Critical!`, wither/death pressure và copy “keep alive”.
- Các theme rời rạc giữa mood, welcome, garden, auth và dashboard.

### Tạm dừng

- Mở rộng Store/crafting/economy.
- Community, leaderboard-like surfaces và AI coaching.
- Thêm achievement, currency hoặc quest mới.
- Polish pricing/subscription ngoài những điểm chặn onboarding.
- Full desktop optimization trước khi mobile vertical slice đạt gate.

## 3. Kiến trúc trải nghiệm mục tiêu

### Information architecture

- **Garden**: home duy nhất, hành động hằng ngày và phản hồi trực tiếp.
- **Journey**: weekly letter, seasons, history, stats và reflection.
- **Me**: identity, profile, settings và subscription.
- **Workshop/Store**: mở như một địa điểm trong garden sau khi core loop đã ổn, không là tab cấp một trong giai đoạn đầu.

### Garden home

- Garden chiếm 70–80% viewport.
- Một cây được camera và animation mềm đề xuất là `next plant`.
- Bottom action card chỉ chứa tên cây, tiny seed và ba lựa chọn: `Đã làm`, `2 phút`, `Nghỉ hôm nay`.
- Chỉ một metric cấp một: `đã chăm x/y cây hôm nay`.
- List là accessibility/efficiency fallback, không phải experience ngang hàng cạnh tranh với garden.
- Focus/Zen trở thành trạng thái của garden, không phải top-level navigation.

### Sau check-in

1. Optimistic state phản hồi trong tối đa 300 ms.
2. Camera giữ trên đúng cây.
3. Water/soil/leaf/lighting reaction diễn ra tại chỗ.
4. Một micro-reveal xuất hiện nhưng không che cây.
5. Teaser cho milestone gần nhất hoặc ngày mai.
6. XP, coin và material nằm trong receipt thu gọn, không là headline.

## 4. Kế hoạch triển khai theo gate

Tổng thời gian dự kiến: 7–10 tuần cho một người phát triển với AI hỗ trợ. Mỗi phase chỉ được mở khi gate trước đạt.

### Phase 0 — Freeze và baseline (2–3 ngày)

Mục tiêu: bảo vệ scope và có số đo trước redesign.

- Đóng băng feature mới ngoài bug nghiêm trọng.
- Chụp baseline desktop/mobile cho landing, first session, daily return và comeback.
- Gắn hoặc xác nhận analytics events: session start, garden viewed, plant selected, action selected, action saved, reaction completed, tomorrow teaser viewed.
- Ghi baseline: time-to-first-action, số tap đến check-in, completion rate và return-after-miss.
- Tạo feature flag `garden_v2`; giữ trải nghiệm cũ làm rollback trong thời gian thử nghiệm.

**Gate 0:** có baseline và event dictionary; mọi người thống nhất không thêm feature ngoài redesign.

### Phase 1 — Experience architecture prototype (3–5 ngày)

Mục tiêu: chứng minh flow trước khi thay code production.

- Vẽ state map cho new user, daily return, comeback và all-done.
- Tạo low-fidelity mobile prototype cho toàn core loop.
- Thiết kế entry orchestrator: không có hai modal cùng lúc; mood optional sau hành động hoặc cuối ngày.
- Xác định copy system no-guilt cho `ready / quiet / resting / sleeping`.
- Test với 5 người, ưu tiên người chưa biết project.

**Gate 1:** ít nhất 4/5 người hiểu phải làm gì trong 5 giây; check-in hoàn tất trong tối đa 2 tap; 4/5 mô tả được hành động đã làm thay đổi cây như thế nào.

### Phase 2 — Visual direction sprint (4–6 ngày)

Mục tiêu: chọn một thế giới hình ảnh trước khi build.

- Tạo đúng 3 visual directions dựa trên cùng wireframe: `Living Diorama`, `Botanical Storybook`, `Soft Isometric Sanctuary`.
- Mỗi direction phải cho thấy Garden home, action card, plant detail và post-check-in reaction ở cùng viewport/state.
- Đánh giá theo: emotional pull, readability, asset scalability, canvas performance và khả năng giữ Living Garden tokens.
- Chốt một direction, art bible delta, typography, color, shape, elevation, motion, sound và haptic rules.

**Gate 2:** một direction thắng rõ theo rubric; có source visual cho implementation; asset list P0 được chốt.

### Phase 3 — Vertical slice production (8–12 ngày)

Mục tiêu: hoàn chỉnh một flow thật bằng data hiện có.

- Tạo `GardenExperienceShell` mới dưới feature flag; không tiếp tục nhồi logic vào Today dashboard.
- Garden-first route với next-plant selection và action card.
- Ba action path dùng server actions hiện có: completed, tiny/easy và rest/watering.
- Optimistic reaction timeline, error recovery và reduced-motion variant.
- Entry orchestrator cho Welcome Back, Mood và onboarding.
- Mobile 390×844 trước; desktop chỉ cần responsive shell an toàn.
- Instrument toàn bộ loop.

**Gate 3:** reaction bắt đầu dưới 300 ms khi optimistic; save failure có recovery rõ; không có modal collision; keyboard hoàn thành được flow; 5/5 test user nhận ra cây đã phản ứng.

### Phase 4 — Core product screens (10–15 ngày)

Mục tiêu: thay shell cũ mà không làm loãng core loop.

- Plant Detail mới: identity → current chapter → today → deeper metrics.
- Journey: weekly letter, season progress, history và stats.
- Onboarding `plant your first seed`: product preview → first plant → tiny seed → first reaction.
- Comeback flow đưa thẳng đến một cây, không headline XP.
- Navigation mới Garden/Journey/Me; redirect hoặc retire `/overview` và Today mode cũ.
- Unify auth/landing với visual direction đã chọn.

**Gate 4:** không còn route/mode trùng mental model; mobile navigation không che nội dung; user mới thấy first delight dưới 60 giây kể từ signup.

### Phase 5 — Ambient narrative và Dual Growth (10–15 ngày)

Mục tiêu: tạo lý do quay lại ngoài streak.

- 5–8 micro-state theo ngày: dew, bud, visitor, soil detail, light, weather interaction.
- Weekly Garden Letter từ activity data, không chấm điểm.
- Season/chapter review: đặt tên, reflection, keepsake và next rhythm.
- Short-cycle plants cho feedback nhanh; legacy tree giữ identity dài hạn.
- Teaser logic chỉ dựa trên milestone thật, không dùng false scarcity.

**Gate 5:** trong phỏng vấn sau 7 ngày, ít nhất 60% người thử nhớ một thay đổi của cây hoặc garden story, không chỉ nhớ XP/streak.

### Phase 6 — Rollout và dọn hệ thống cũ (5–8 ngày)

Mục tiêu: chuyển an toàn và tránh hai sản phẩm tồn tại lâu dài.

- Internal → 10% cohort → 50% → 100% rollout bằng feature flag.
- So sánh Daily Loop Completion, Time to First Delight, D1/D7 và Return After Miss.
- Chỉ tăng cohort nếu không có regression về save errors, performance và accessibility.
- Sau 100% ổn định, xóa Today dashboard, duplicated modes và theme legacy.
- Cập nhật OpenWiki, roadmap, Storybook và E2E happy paths.

**Gate 6:** D7 hoặc Return After Miss tăng có ý nghĩa; không có regression nghiêm trọng; rollback không còn cần thiết.

## 5. Workstreams

### UX architecture

- State maps, IA, navigation, modal priority, empty/error/comeback states.
- Owner output: prototype và acceptance criteria.

### Visual system

- Source visuals, tokens, component states, motion, sound/haptic và asset briefs.
- Owner output: visual direction + art bible delta + component specs.

### Game feel

- Reaction timeline, camera, micro-events, anticipation và reward hierarchy.
- Owner output: một “reaction grammar” dùng lại cho mọi plant type.

### Narrative system

- Tiny seed, Why I Started, weekly letter, seasons và legacy tree.
- Owner output: content model + copy rules; không hardcode lore dài trong component.

### Engineering

- Feature flag, experience shell, optimistic mutation, analytics, performance và cleanup.
- Owner output: vertical slice có thể rollback.

### Research và QA

- 5-user tests ở Gate 1, 3 và 5; mobile/accessibility matrix; cohort analysis.
- Owner output: evidence để tiếp tục, sửa hoặc dừng.

## 6. Definition of Done cho core loop

- Không có modal blocking trước garden, trừ onboarding lần đầu bắt buộc.
- Trong 5 giây, người dùng nhận ra cây nào cần attention và CTA chính.
- Check-in hoặc rest hoàn tất trong tối đa 2 tap từ Garden home.
- Phản hồi thị giác bắt đầu dưới 300 ms và xảy ra trên đúng cây.
- Save lỗi không làm mất niềm tin: cây rollback hoặc hiển thị retry rõ.
- Home không có quá hai metric hiển thị đồng thời.
- Rest path có prominence và target size tương đương completed path.
- Không dùng `Critical`, death, shame hoặc streak loss làm primary motivation.
- Keyboard, screen reader label, focus return, reduced motion và 200% zoom hoạt động.
- Mobile 360–430 px không bị bottom nav che CTA hoặc content.

## 7. Rủi ro và biện pháp

| Rủi ro | Ảnh hưởng | Biện pháp |
|---|---|---|
| Rebuild kéo dài vì scope lan sang mọi màn | Mất nhiều tuần nhưng core loop chưa test | Feature freeze + vertical slice gates |
| Canvas khó gắn UI và camera reaction | Interaction chậm, khó maintain | Experience shell điều phối, canvas giữ rendering |
| Asset gap làm direction trông rẻ | Không đánh giá đúng emotional pull | Chỉ sản xuất asset P0 cho 2–3 cây test trước |
| Narrative trở thành content factory | Chi phí vận hành cao | Ambient/state-driven narrative từ data thật |
| Hai UI tồn tại quá lâu | Bug và design drift | Feature flag có deadline cleanup sau rollout |
| Gamification cũ lấn át | Tone conflict quay lại | Reward hierarchy: plant reaction → story → XP receipt |
| Thay schema sớm | Migration risk | Phase 1–4 dùng domain hiện có; chỉ thêm field sau prototype validation |

## 8. Backlog sau redesign

Chỉ mở lại khi Gate 5 đạt:

- Workshop/Store như garden location.
- Crafting gắn với keepsake và seasonal story.
- Community dạng garden visiting/sunshine.
- Subscription packaging mới.
- Creature system mở rộng và ancient tree aura.

## 9. Task đầu tiên đề xuất

Tạo một design sprint chỉ cho **mobile Garden vertical slice**, gồm bốn state: `arrive`, `choose action`, `garden reacts`, `tomorrow teaser`. Chưa sửa production UI cho đến khi một trong ba visual directions được chọn và prototype vượt Gate 1.

## 10. Implementation checkpoint — 2026-07-10

- Chọn visual direction: **Soft Isometric Sanctuary**.
- Đã thay Today/dashboard bằng Garden-first shell và focal plant.
- Đã nối ba action path `Đã làm / 2 phút / Nghỉ` vào domain mutation hiện có.
- Đã thêm calm reaction, plant detail mới, Journey, navigation Garden/Journey/Me.
- Đã thống nhất landing, auth, onboarding và Me; `/stats` redirect về Journey.
- Đã bỏ proactive Mood prompt và XP-first celebration khỏi core Garden loop.
- Production build pass; visual QA mobile pass tại `design-qa.md`.

Các phase research/cohort/analytics dài hạn trong kế hoạch vẫn là công việc rollout sau khi branch này được review; chúng không phải điều kiện để core experience rewrite hoạt động.

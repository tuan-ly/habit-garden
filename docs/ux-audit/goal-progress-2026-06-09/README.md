# UX Audit: Cây có goal và luồng theo dõi tiến độ

Ngày audit: 2026-06-09  
Phạm vi: tạo goal cho cây, đọc tiến độ trên card, log tiến độ hằng ngày, xem kế hoạch goal.

## Kết luận ngắn

Vấn đề cốt lõi là **Conceptual Model Mismatch** — hình ảnh cây đang đại diện cho thói quen dài hạn, nhưng UI lại khiến người dùng kỳ vọng cây đại diện cho tiến độ goal định lượng.

Hiện có ba hệ tiến độ chạy song song:

1. **Plant growth**: tăng theo số lần check-in/log, không phụ thuộc log 1 km hay 10 km.
2. **Period goal**: ví dụ 3/5 km trong tuần.
3. **Overall goal**: ví dụ đạt 10 km sau 12 tuần.

Vì không có thứ tự ưu tiên rõ ràng, người dùng khó trả lời ba câu cơ bản:

- Hôm nay tôi cần làm gì?
- Tôi đang tiến gần goal đến đâu?
- Cây lớn lên vì tôi đều đặn hay vì tôi đạt chỉ tiêu?

## Bằng chứng theo flow

| Bước | Mô tả | Tình trạng |
|---|---|---|
| 1 | Card cây có goal | Cần cải thiện: nhiều số liệu nhưng chưa có tiến độ chính |
| 2 | Mở modal từ cây | Cần cải thiện mạnh: quá nhiều context trước hành động |
| 3 | Nhập progress | Khá rõ về thao tác, nhưng câu hỏi không đúng ngữ nghĩa từng loại goal |
| 4 | Chọn loại goal | Cần cải thiện: dùng thuật ngữ hệ thống thay vì ý định người dùng |
| 5 | Chọn chu kỳ | Tương đối rõ, nhưng duration bằng tuần cho mọi cadence |
| 6 | Nhập target | Cần cải thiện: growth pattern là quyết định nâng cao bị đưa quá sớm |
| 7 | Review kế hoạch | Quá chi tiết; người dùng phải kiểm tra 12 dòng trước khi bắt đầu |

Screenshots:

- [01 - Goal plant card](./01-goal-plant-card.png)
- [02 - Action choice](./02-log-progress-choice.png)
- [03 - Log form](./03-log-progress-form.png)
- [04 - Goal type](./04-goal-wizard-type.png)
- [05 - Frequency](./05-goal-wizard-frequency.png)
- [06 - Target](./06-goal-wizard-target.png)
- [07 - Review](./07-goal-wizard-review.png)

## Điểm đang làm tốt

- Card có CTA rõ: `Log Progress`.
- Modal giữ giọng điệu nhẹ nhàng, có lựa chọn nghỉ thay vì phạt.
- Goal có near-term target theo tuần, tốt hơn chỉ hiển thị mục tiêu cuối.
- Quick picks giảm thao tác nhập số.
- Wizard có preview trước khi tạo.
- Màu sắc và typography phù hợp với định hướng “Living Garden”.

## UX risks

### P0 — Sai nguồn dữ liệu trong progress modal

Modal đang truyền `today_value` vào `periodProgress`, nhưng so sánh với `current_week_target`.

Ví dụ: user đã chạy 3 km thứ Hai và 2 km thứ Ba. Thứ Tư `today_value = 0`, modal có thể báo còn 5 km dù target tuần đã hoàn thành.

Code liên quan:

- `src/components/garden/garden-modals.tsx:76`
- `src/components/garden/garden-modals.tsx:77`

### P0 — Cây không phản ánh goal progress

Mỗi log tăng cây theo một lượng cố định dựa trên `maturity_days`; giá trị log không tham gia tính growth. Log 1 km và 10 km làm cây lớn như nhau.

Đây không hẳn là logic sai, nhưng UI chưa nói rõ:

- **Cây = consistency**
- **Goal bar = measurable outcome**

Code liên quan:

- `src/lib/context/plants-context.tsx:131`
- `src/lib/context/plants-context.tsx:132`
- `src/lib/context/plants-context.tsx:356`
- `src/lib/context/plants-context.tsx:357`

### P0 — Tạo plant và tạo goal là hai flow tách rời

Flow tạo cây chỉ hỏi habit name, description và Easy Mode. Muốn thêm goal, user phải biết mở plant detail rồi chọn `Add Goal Tracking`.

Đây là **Split Configuration Flow** — một object mà user hiểu là “cây goal” lại phải được tạo qua hai entry point khó đoán.

Code liên quan:

- `src/components/plants/add-plant-dialog.tsx:419`
- `src/components/plants/add-plant-dialog.tsx:515`
- `src/components/plants/plant-detail-sheet.tsx:474`

### P1 — Progress Ambiguity

Trong một modal có moisture, plant growth, streak, weekly target, motivation, Easy Mode và total waterings. Các thành phần có trọng lượng thị giác gần nhau.

Đề xuất: mỗi surface chỉ có một câu trả lời chính.

- Garden card: “Tuần này còn bao nhiêu?”
- Log modal: “Ghi hoạt động vừa làm.”
- Detail: lịch sử, overall goal và plant health.

### P1 — Câu hỏi nhập số không đúng loại goal

`How much?` không cho biết user đang nhập:

- giá trị của lần thực hiện này,
- tổng hiện tại,
- hay phần tăng thêm.

Copy nên phụ thuộc mode:

- Build capacity: “Lần chạy dài nhất hôm nay là bao nhiêu km?”
- Total progress: “Hôm nay bạn cộng thêm bao nhiêu km?”

### P1 — Wizard bắt user học thuật ngữ hệ thống

`Build Capacity`, `Total Progress`, `Growth Pattern`, `Gentle Start` và `Fast Start` là model nội bộ. Người dùng chỉ cần chọn ý định:

- “Tôi muốn làm tốt hơn mỗi lần.”
- “Tôi muốn tích lũy đến một con số.”

Các curve nên được hệ thống đề xuất; `Customize plan` là tùy chọn nâng cao.

### P1 — Hidden gesture

Single tap mở watering modal, double tap mở detail sheet. Double tap không có affordance và khó dùng trên mobile.

Code liên quan:

- `src/components/garden/use-garden-interactions.ts:295`
- `src/components/garden/use-garden-interactions.ts:302`

### P2 — Review plan quá chi tiết

Preview 12 tuần tạo cảm giác phải kiểm tra bảng tính. Chỉ nên hiển thị:

- mục tiêu đầu,
- mục tiêu cuối,
- 2–3 milestone,
- ngày dự kiến hoàn thành.

Danh sách từng tuần chuyển vào `Customize plan`.

## Accessibility risks

- `maximumScale: 1` và `userScalable: false` chặn pinch zoom trên mobile, gây rủi ro với WCAG 1.4.4.
- Step indicator của wizard chỉ có icon; screen reader không nhận được “Bước 2/4”.
- Các lựa chọn mode/frequency dùng button nhưng không có `aria-pressed` hoặc radio semantics.
- Nút disabled trong dark theme vẫn trông khá giống active.
- Danh sách cây dành cho screen reader chỉ đọc status và plant growth, không đọc period goal.
- `role="application"` trên garden có thể làm thay đổi hành vi screen reader và cần test thực tế.

Code liên quan:

- `src/app/layout.tsx:102`
- `src/app/layout.tsx:103`
- `src/components/garden/isometric-garden.tsx:291`
- `src/components/garden/isometric-garden.tsx:410`
- `src/components/garden/isometric-garden.tsx:414`

## Mô hình UX đề xuất

### Plant = habit identity

Cây là thứ tồn tại nhiều năm và lớn lên nhờ sự đều đặn. Nó không kết thúc khi một goal hoàn thành.

### Season = finite goal

Goal là một “mùa” có target và thời hạn. Một cây có thể trải qua nhiều season: 5 km, 10 km, half marathon.

### Log = real-world action

Mỗi log vừa:

- đóng góp vào period/season goal,
- vừa xác nhận một ngày chăm cây.

Khi hiển thị, luôn tách nhãn:

- `Consistency growth`: cây lớn nhờ số ngày xuất hiện.
- `Goal progress`: số đo thực tế của season.

## User flow đề xuất

### 1. Tạo mới

`Add` → `Bạn muốn xây một thói quen hay đạt một con số?`

- **Thói quen đều đặn**: tạo Simple Plant.
- **Mục tiêu đo được**: tạo Goal Plant trong cùng flow.

Flow goal:

1. Viết hành động: “Chạy bộ”.
2. Chọn cách đo bằng câu tự nhiên.
3. Nhập mục tiêu: “Từ 3 km/lần lên 10 km/lần”.
4. Hệ thống đề xuất cadence và plan.
5. Chọn cây như personality/cosmetic.
6. Confirm bằng một câu: “Mỗi lần chạy, nhập quãng đường. Tuần này mục tiêu 3 km.”

### 2. Daily loop

`Today/Focus` → card hiển thị `3/5 km tuần này` → `+ Log run`

Form mở trực tiếp:

- input số được autofocus,
- quick picks dựa trên lịch sử,
- target tuần vẫn nhìn thấy,
- `Rest today` là secondary action.

Sau submit:

> Đã ghi 3 km. Còn 2 km trong tuần này. Cây có thêm 1 ngày phát triển.

### 3. Weekly review

Cuối tuần:

- target đạt/chưa đạt,
- tiến bộ so với tuần trước,
- đề xuất target tuần tới,
- chọn `Keep`, `Ease`, hoặc `Increase`.

Không bắt user quản lý curve từ đầu.

## Cấu trúc màn hình đề xuất

### Garden

Ưu tiên cảm xúc và phần thưởng hình ảnh. Chỉ hiển thị badge ngắn:

- `2 km left`
- `Done this week`
- `Resting`

### Today / Focus

Đây nên là màn hình hành động chính cho goal users:

- danh sách việc cần làm,
- target gần nhất,
- CTA log,
- trạng thái hoàn thành hôm nay.

Có thể phát triển từ `FocusGardenView` hiện có thay vì tạo hệ thống mới.

### Plant detail

Ba section:

1. `This week`: target và log gần đây.
2. `Season`: overall progress và milestones.
3. `Tree story`: consistency, streak, growth stages.

## Thứ tự triển khai

### P0

1. Sửa `periodProgress` dùng dữ liệu toàn period, không dùng `today_value`.
2. Chốt và ghi rõ model: Plant = consistency, Season = measurable goal.
3. Đổi log modal thành direct entry với copy theo mode.

### P1

4. Gộp goal setup vào flow tạo plant.
5. Card chỉ giữ một progress chính: current period.
6. Thêm feedback sau log: amount logged, remaining target, consistency impact.
7. Đưa `Focus` thành entry point rõ ràng cho công việc hôm nay.

### P2

8. Chuyển growth curve và manual weekly targets vào Advanced.
9. Thêm weekly review/adaptive target.
10. Hoàn thiện semantics, zoom, keyboard và screen-reader testing.

## Giới hạn bằng chứng

- Live flow bị chặn do tài khoản E2E trong repo không tồn tại trên Supabase hiện tại.
- Screenshots được chụp từ production components với mock data cục bộ, không ghi database.
- Audit chưa kiểm tra mobile breakpoint, keyboard flow, screen reader thực tế hoặc contrast bằng công cụ đo.
- Storybook hiện lỗi `process is not defined`, nên không dùng làm nguồn bằng chứng.

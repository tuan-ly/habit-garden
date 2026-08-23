# Habien — Hướng phát triển tiếp theo

Ngày: 2026-08-23
Trạng thái: quyết định đã chọn và triển khai MVP

## Bối cảnh hiện tại

- North Star: mỗi ngày chăm một khoảnh vườn, mỗi mùa viết một chương về con người đang trở thành.
- Garden-first daily loop, Capability Plugin Platform và Per-Plant Story Recall đã có vertical slice hoàn chỉnh.
- `Hành trình` đã có “Thư từ khu vườn”, nhưng nội dung hiện chỉ dựa trên tổng số lần chăm và số cây; chưa phản chiếu ngày nghỉ, ghi chú, reflection hay nhịp tiếp theo.
- Release gate còn mở: authenticated two-plant start/resume conflict smoke trên linked environment.

## Các hướng có thể phát triển

### A. Garden Letter 2.0 — Reflection-to-Anticipation Bridge

**Reflection-to-Anticipation Bridge** là lớp biến dữ liệu lịch sử thành một điều đáng nhớ và một lý do nhẹ nhàng để quay lại.

- Giải quyết: **Narrative Flatness** và khoảng trống `Anticipate tomorrow` trong retention loop.
- Vertical slice: thư tuần gồm một pattern quan sát được, một ghi chú đáng nhớ nếu có, và một gợi ý nhịp tiếp theo liên kết về đúng cây.
- Tận dụng: `activity_logs`, Plant Story projection và Journey hiện có.
- Không cần ở slice đầu: AI, schema mới, chấm điểm, bắt buộc viết reflection.

### B. Proof-of-Life Microstates

**Proof-of-Life Microstates** là các thay đổi nhỏ nhưng nhìn thấy được như sương, nụ, ánh sáng, đất hoặc sinh vật ghé thăm sau hành động.

- Giải quyết: **Delayed Gratification Gap** giữa các growth stage dài.
- Giá trị: tăng cảm giác khu vườn đang sống và tạo tò mò quay lại ngày mai.
- Rủi ro: phụ thuộc asset, state matrix và visual QA nhiều hơn logic sản phẩm.

### C. Capability #2

**Platform Validation** là kiểm chứng một nền tảng trừu tượng bằng use case thứ hai, thay vì chỉ use case đã sinh ra kiến trúc đó.

- Đề xuất capability: Deep Work hoặc Exercise, dùng session model nhưng đơn vị và completion khác Reading.
- Giải quyết: rủi ro Capability Plugin Platform mới chỉ được chứng minh bằng Reading.
- Rủi ro: mở rộng bề ngang trước khi retention loop được đo và hoàn thiện.

### D. Gentle Comeback Rhythm

**Return-After-Miss Recovery** là giúp người dùng quay lại sau quãng vắng mà không tạo cảm giác nợ hoặc mất chuỗi.

- Vertical slice: chọn một cây, nhắc lại “Why I started”, cho ba lựa chọn `Bắt đầu nhỏ / Giữ nhịp / Cho cây nghỉ`.
- Giải quyết: churn sau 3–7 ngày vắng.
- Rủi ro: chỉ xuất hiện ở một cohort nhỏ hơn daily/weekly loop.

### E. Sunshine Postcards

**Positive Accountability** là hỗ trợ xã hội chỉ bằng khích lệ, không so sánh thành tích.

- Vertical slice: gửi một postcard “ánh nắng” cho 1–3 người quen; không leaderboard, không xem metric riêng tư.
- Giải quyết: động lực xã hội và cảm giác được nhớ tới.
- Rủi ro: cần privacy model, invite flow, abuse controls và notification delivery.

## Quyết định ngày 2026-08-23

Chọn **B. Proof-of-Life Microstates**, triển khai dưới tên **Daily Garden Encounters**.

Lý do: Garden Encounters giải quyết trực tiếp **Delayed Gratification Gap** và **Predictable Re-entry** — người dùng có một lý do thẩm mỹ để tò mò khi mở Garden, rồi nhận một khoảnh khắc bất ngờ sau hành động thật. Garden Letter 2.0 giải quyết **Reflection-to-Anticipation** ở nhịp tuần; hướng đó vẫn giá trị nhưng không tạo phản hồi tức thời cho lần mở app hằng ngày.

Rủi ro được chấp nhận: MVP dùng `localStorage`, nên continuity là theo browser chứ chưa account-synced. Đổi lại, slice không cần schema, không can thiệp progression và đủ nhỏ để kiểm chứng cảm giác trước khi đầu tư asset hoặc persistence đa thiết bị.

## Smallest complete slice

1. Mỗi local date chọn deterministic một Daily Atmosphere và một Garden Encounter từ date, garden signature và weather.
2. Freeze plan trong browser storage; reload và hành động sau không được reroll.
3. Sau server action thành công, phát existing reaction trước rồi mới reveal encounter.
4. Cho `Đã làm`, `2 phút`, `Nghỉ` và guided Reading completion cùng đi vào một action path.
5. Sau reveal, chỉ giữ một memory whisper nhỏ; reload không replay animation.
6. Tôn trọng Reduced Motion và setting tắt celebration; không thêm schema, AI hay reward advantage.

## Acceptance criteria

- Có đúng một fresh encounter mỗi local day; hành động sau và reload không reroll/replay.
- Encounter chỉ xuất hiện sau mutation thành công; failed action không tạo tín hiệu giả.
- `care`, `tiny`, `rest` và guided Reading completion đều có cùng quyền tạo encounter đầu ngày.
- Encounter chỉ mang giá trị thẩm mỹ và narrative; không XP, item, bonus, countdown hay false scarcity.
- Celebration-disabled và Reduced Motion vẫn giữ nội dung dễ đọc, không ép animation.
- Existing Garden, Plant Story, progression và guided-session behavior không regression.

## Non-goals

- Community, leaderboard, gift economy hoặc AI coaching.
- Nội dung AI, loot table vô hạn, collection economy hoặc encounter inventory.
- Thay schema, progression, XP, subscription hoặc capability assignment rules.
- Đồng bộ encounter đa thiết bị trong MVP.

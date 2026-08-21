# Audit Capability Platform & Hành trình của cây

- Ngày: 2026-08-19
- Phạm vi: chọn, xác nhận, sử dụng, tạm dừng và gỡ một capability trên cây
- Mục tiêu: mỗi cây vẫn là một habit hoàn chỉnh; capability chỉ thêm cách hướng dẫn, không cạnh tranh với hành động hằng ngày
- Kết luận: flow đã có hierarchy rõ, giữ đúng ngôn ngữ Habien và đủ tốt để làm nền cho capability tiếp theo

## Các bước đã kiểm tra

1. **Slot trống — Tốt.** Cây vẫn có giá trị khi chưa chọn; CTA `Chọn hành trình` rõ nhưng không ép buộc. Ảnh: [01-empty-slot-desktop.png](./01-empty-slot-desktop.png).
2. **Capability Library — Tốt.** Modal giữ identity của cây, mô tả outcome trước feature và dùng một hàng chọn dễ quét. Ảnh: [02-library-desktop.png](./02-library-desktop.png), [08-library-narrow-mobile.png](./08-library-narrow-mobile.png).
3. **Xác nhận Reading intent — Tốt.** Người dùng phải xác nhận cây đại diện cho việc đọc trước khi CTA được bật; primary action vẫn nhìn thấy ở chiều cao 720 px. Ảnh: [03-reading-confirmation-desktop.png](./03-reading-confirmation-desktop.png).
4. **Quản lý capability — Tốt.** Active, pause, resume và remove nằm trong Plant Detail; copy nói rõ log vẫn được giữ. Ảnh: [04-active-slot-mobile.png](./04-active-slot-mobile.png), [09-paused-slot-mobile-final.png](./09-paused-slot-mobile-final.png), [07-remove-confirmation-mobile.png](./07-remove-confirmation-mobile.png).
5. **Daily focus action — Tốt.** Reading cung cấp một primary action `Đọc cùng cây`; setup/management không còn cạnh tranh với daily loop. Ảnh: [05-focus-primary-action-desktop.png](./05-focus-primary-action-desktop.png).

## Điểm mạnh

- **Capability Slot** — một cây có tối đa một hành trình, giúp mental model đơn giản và tránh gắn thêm một habit thứ hai.
- **Contextual Primary Action** — focus panel chỉ ưu tiên hành động phù hợp trạng thái hiện tại.
- **Progressive Disclosure** — Library → preview → explicit confirmation giảm attach nhầm mà không biến bước đầu thành form dài.
- **Data Reassurance** — pause/remove đều giải thích session, tiến độ và ghi chú cũ không bị mất.

## Rủi ro và khuyến nghị

- Library mới có một capability nên chưa chứng minh được grouping, recommended item và trạng thái locked/coming-soon; kiểm tra lại hierarchy khi thêm capability thứ hai.
- Eligibility hiện dựa vào xác nhận chủ động, chưa phân loại habit intent tự động; giữ explicit confirmation làm ranh giới an toàn cho đến khi có taxonomy đáng tin.
- Route screen đã cho phép plugin chỉ đăng ký các màn hình nó thật sự hỗ trợ; capability `instant` hoặc `none` không phải dựng giả `plan/completion`.
- Focus được phục hồi về `Chọn hành trình` sau khi đóng bằng Escape; tên accessible của nút đóng đã được Việt hóa trên Library và Plant Detail.

## Accessibility và giới hạn bằng chứng

- Keyboard Escape/focus restoration đã kiểm tra trực tiếp và có regression test.
- Reflow hẹp 390 × 843 không có horizontal overflow; nội dung Library và Plant Detail vẫn cuộn được.
- Capability dialog và Plant Detail tắt animation/transition chính dưới `prefers-reduced-motion`; active-session banner đã dùng `useReducedMotion`.
- Browser audit hiện không mô phỏng được chính xác viewport landscape tương đương 200% zoom; cần chạy thêm manual browser zoom 200% trước release.
- Screenshot và DOM inspection không đủ để tuyên bố WCAG compliance; contrast định lượng và screen-reader announcement chưa được audit chuyên dụng.

Ảnh `06-paused-slot-mobile.png` là bản trước khi copy phụ được đổi thành `Giữ nguyên nhật ký`; dùng `09-paused-slot-mobile-final.png` làm evidence cuối.

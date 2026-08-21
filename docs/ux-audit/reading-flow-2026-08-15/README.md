# Audit UX: Reading theo từng cây

Ngày: 2026-08-15  
Viewport: desktop 1280×720 và mobile 390×844  
Phạm vi: Garden → focus cây → Reading Home → Growth Plan; trạng thái gắn Reading trên cây chưa có capability.

## Kết luận

Flow có chất lượng hình ảnh tốt nhưng đang rối ở **Mental Model Collision**: một cây vốn đại diện cho một habit (`Chạy bộ`) lại mang thêm một habit khác (`Đọc sách mỗi ngày`). UI tiếp tục xếp chồng hành động chăm cây, CTA Reading, Reading Home, Growth Plan và điều hướng toàn app nên người dùng phải hiểu mô hình dữ liệu trước khi biết cần bấm gì.

## Các bước đã quan sát

| Bước | Màn hình | Sức khỏe | Bằng chứng |
|---|---|---|---|
| 1 | Garden, tìm cây có Reading | Cần cải thiện | `01-garden-desktop.png`, `08-garden-mobile.png` |
| 2 | Focus cây Reading | Cần cải thiện mạnh | `02-reading-plant-focus-desktop.png`, `09-reading-plant-focus-mobile.png` |
| 3 | Reading Home | Cần cải thiện | `03-reading-home-desktop.png`, `06-reading-home-mobile.png`, `07-reading-home-mobile-actions.png` |
| 4 | Growth Plan | Kém trên mobile | `04-growth-plan-desktop.png`, `05-growth-plan-mobile.png` |
| 5 | Focus cây chưa có Reading | Khá rõ về thao tác, rủi ro về mental model | `10-unassigned-plant-focus-mobile.png` |
| 6 | Tạo/tiếp tục Focus Session | Chưa chạy | CTA tạo bản ghi phiên đọc mới |
| 7 | Completion | Chưa chạy | Hoàn tất sẽ ghi progress/reflection vào dữ liệu thật |

## Điểm tốt

- Soft Isometric Sanctuary nhất quán, giàu cảm xúc và khác biệt rõ với app productivity thông thường.
- Plant focus, Reading Home và Growth Plan đều giữ hình ảnh cây thật; CTA có target chạm tốt trên mobile.
- Copy không phán xét (`không có hình phạt`, `một bước nhỏ là đủ`) đúng North Star.
- DOM có heading, progressbar và tên nút chính tương đối rõ.

## Rủi ro UX chính

1. **Mental Model Collision — P0:** `Chạy bộ` đồng thời xuất hiện dưới `Đọc sách mỗi ngày`; một cây đang đại diện cho hai hành vi khác nhau.
2. **Transition Tax — P1:** cần Garden → focus → Mở hành trình đọc → Reading Home → Bắt đầu/Đọc thêm trước khi vào hành động cốt lõi.
3. **Navigation Competition — P1:** `Quay lại`, bottom nav, CTA Reading và Growth Plan cùng tranh quyền điều hướng trên một màn hình.
4. **Primary Action Below the Fold — P1:** trên 390×844, CTA `Đọc thêm` chỉ xuất hiện sau khi cuộn qua hero plant cao khoảng 300 px.
5. **Badge Scale Coupling — P1:** icon Reading nằm trong layer bị scale theo cây, nên ở focus mobile phóng rất lớn và tách khỏi plant.
6. **Responsive Overflow — P1:** timeline 5→30 dùng `min-width: 560px`, tạo scrollbar ngang bên trong card trên mobile.
7. **Terminology Fragmentation — P2:** `Reading`, `Focus Session`, `Growth Plan`, `Target`, `Review` trộn với tiếng Việt.
8. **Instance Ambiguity — P2:** hai cây cùng tên `Chạy bộ` đều có Reading nhưng focus panel không thêm type/stage để phân biệt, trong khi log hiện đã tách theo cây.

## Rủi ro accessibility

- Reading Home có `aria-valuenow=9` lớn hơn `aria-valuemax=5`; visual clamp ở 100% nhưng semantic progressbar không hợp lệ khi vượt mục tiêu.
- Garden render nhiều button ô trống không có accessible name. `tabIndex=-1` tránh keyboard noise, nhưng screen-reader browse mode vẫn cần kiểm tra.
- Focus panel nhìn như modal nhưng khai báo `aria-modal=false`; cần test focus order, Escape và khả năng tương tác với garden phía sau.
- Horizontal timeline cần kiểm tra ở 200% zoom và với keyboard; screenshot mới chỉ xác nhận lỗi reflow ở 390 px.

## Hướng đơn giản hóa đề xuất

Giữ product model `một cây = một habit`. Với cây Reading, CTA chính trong focus panel nên là `Bắt đầu đọc` / `Tiếp tục phiên` / `Đã đọc hôm nay`; không xếp thêm ba hành động chăm cây song song. `Xem tiến độ đọc` là secondary action, còn Growth Plan chuyển vào Hành trình hoặc plant detail.

Flow mục tiêu: `Garden → focus cây → Bắt đầu/Tiếp tục phiên → Completion → phản ứng của cây → Garden`. Reading Home chỉ còn là trang chi tiết tùy chọn, không phải trạm bắt buộc.

Trên mobile, rút hero plant xuống khoảng 140–180 px hoặc đưa CTA vào sticky action bar phía trên bottom nav. Timeline đổi thành current/next milestone theo chiều dọc; toàn bộ 6 mốc mở theo disclosure.

## Giới hạn bằng chứng

Audit dùng trạng thái authenticated hiện có và không tạo dữ liệu mới. Focus Session và Completion chưa được chạy vì hai bước đó sẽ ghi session/progress vào database. Chưa thể kết luận WCAG compliance chỉ từ screenshot và DOM inspection.

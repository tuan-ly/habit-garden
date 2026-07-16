# Audit hình ảnh khu vườn — 2026-07-10

## Phạm vi

Đánh giá một trạng thái `/garden` khi focus panel “Chạy bộ” đang mở, theo hướng thiết kế **Soft Isometric Sanctuary**.

## Kết luận

Hướng nghệ thuật đã đúng, nhưng **Visual Depth Hierarchy** còn yếu: nền, mặt đất và chi tiết trang trí có độ tương phản gần nhau nên khu vườn phẳng, mờ và thiếu cảm giác được chăm sóc.

## Điểm mạnh

- Bảng màu sage–cream và ánh sáng giờ vàng thống nhất với cảm giác sanctuary.
- Cây xương rồng lớn tạo focal point rõ và có silhouette dễ nhận diện.
- Background nhiều lớp núi tạo không khí rộng, nhẹ và không cạnh tranh với UI.

## Vấn đề và hướng cải tiến

1. **Hình khối:** mảnh vườn là một khối vuông dày, cạnh thẳng và góc sắc nên giống sân khấu nổi hơn là đất sống. Giảm bề dày thành đất, bo/mẻ nhẹ đường biên và thêm rìa cỏ tràn sẽ hữu cơ hơn.
2. **Mặt cỏ:** màu và texture quá đồng đều; các nét dọc rời rạc chưa đọc thành cỏ. Dùng 2–3 mảng sắc độ lớn, cụm cỏ nhỏ theo nhóm và vùng đất nén quanh cây để tạo nhịp.
3. **Trang trí:** vật thể nhỏ đang rải ngẫu nhiên, thiếu cụm và thiếu quan hệ với cây. Tổ chức thành micro-scenes: lối đá đến cây, góc nước, cụm nấm/hoa và đèn dẫn đường.
4. **Ambience:** lớp vàng sáng đẹp nhưng phủ đều làm giảm chiều sâu. Giữ nền sáng, tăng tương phản cục bộ trên mặt vườn, thêm contact shadow rõ hơn và rim light mảnh cho cây chủ thể.
5. **Tỷ lệ:** cây hero lớn nhưng thiếu vật thể trung gian nên khoảng trống quanh nó có cảm giác chưa hoàn thiện. Thêm 1–2 prop cỡ vừa, không thêm nhiều đồ nhỏ.
6. **Panel:** panel dưới che gần một phần ba khu vườn và backdrop làm các chi tiết vốn nhạt càng khó thấy. Khi panel mở, camera nên nâng focal plant lên hoặc giảm mức dim riêng trên vùng cây.

## Ưu tiên

1. Tách sáng–tối giữa cây, mặt vườn và background.
2. Làm lại mép đất và texture cỏ theo cụm.
3. Gom trang trí thành 3 micro-scenes có câu chuyện.
4. Sau đó mới thêm particles và chi tiết nhỏ.

## Giới hạn bằng chứng

Ảnh tĩnh không cho phép đánh giá chuyển động, parallax, trạng thái thời tiết khác, responsive, keyboard focus hoặc `prefers-reduced-motion`.

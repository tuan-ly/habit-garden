# Game Asset Pipeline — Plants & Decorations

> Quy trình chuẩn từ ý tưởng → ảnh sinh bởi AI → asset có metadata → hiển thị trong garden.

## 1. Hai lớp tiêu chuẩn

**Asset Contract** là hợp đồng kỹ thuật giúp mọi ảnh được renderer xử lý giống nhau. Nó bao gồm canvas, alpha, anchor chạm đất, scale, footprint và kết quả kiểm định.

**Art Direction Gate** là bước con người duyệt các thuộc tính thị giác mà đo pixel không thể kết luận đáng tin cậy: đúng phong cách, ánh sáng, projection, silhouette và cảm xúc.

Chọn mô hình hai lớp vì phân tích ảnh giải quyết **rendering consistency**, còn art review giải quyết **semantic/style consistency**.

## 2. Nguyên tắc thiết kế chung

- Flat Vector Biophilic Isometric, 3/4 isometric ở camera tilt 30°.
- Ánh sáng dịu từ phía trên-phải; mặt sáng ở phải, bóng ở trái.
- Smooth bezier, two-tone shading, không outline, không tile/background baked vào ảnh.
- PNG vuông, nền trong suốt, silhouette không chạm mép và có safe padding.
- Object đứng tại một điểm chạm đất rõ ràng; bóng chỉ là ambient-occlusion nhẹ và không được làm sai anchor.
- Tâm thị giác có thể lệch, nhưng `anchorX/anchorY` phải trỏ đúng điểm tiếp xúc mặt đất.

### Plant

- Một loài có đúng 5 file: `01-seed.png`, `02-sprout.png`, `03-growing.png`, `04-blooming.png`, `05-mature.png`.
- Tạo `05-mature` trước làm **Mature Anchor**, sau đó tạo các stage còn lại từ cùng style DNA.
- Các stage phải tăng rõ silhouette/visual reward, nhưng giữ palette, góc nhìn và chân cây nhất quán.

### Decoration

- Mỗi decoration có `gridSize` 1×1, 2×2, 3×3… theo diện tích thật trong garden.
- Silhouette, chi tiết và chiều cao phải đọc được ở kích thước runtime; footprint lớn không đồng nghĩa phóng ảnh tùy tiện.
- Asset dài/rộng phải có anchor ở chân đế thực tế, không dùng tâm canvas.

## 3. Luồng làm việc chuẩn

1. **Brief** — ghi kind, slug, footprint, silhouette, palette, projection và reference.
2. **Generate** — dùng prompt theo Art Bible; plant bắt đầu từ mature anchor.
3. **Post-process** — xóa watermark/nền, crop vuông, resize/optimize; không tự căn object bằng padding giả.
4. **Machine Gate** — chạy `npm run assets:analyze`. Script đo alpha bounds, coverage, centroid, ground contact và sinh `src/generated/game-asset-manifest.json`.
5. **Metadata Review** — mở preview trong garden; chỉ override `scale` hoặc anchor khi điểm chạm alpha bị bóng/particle đánh lừa. Override phải có lý do.
6. **Art Direction Gate** — duyệt checklist ánh sáng, projection, palette, outline, silhouette, stage progression.
7. **Runtime QA** — kiểm tra 100%/zoom lớn, ghost placement, rotation, chọn/di chuyển/cất kho, mobile và desktop.
8. **Ship** — `npm run assets:check`, test và build phải đạt; lỗi legacy phải được ghi nhận, không âm thầm bỏ qua.

## 4. Metadata được sinh và cách dùng

| Field | Nguồn | Runtime sử dụng |
|---|---|---|
| `analysis.width/height` | PNG | phát hiện sai canvas |
| `analysis.bounds` | alpha pixels | kiểm tra padding/safe area |
| `analysis.centroid` | alpha-weighted | chẩn đoán lệch thị giác |
| `display.anchorX/Y` | bottom contact band | đặt đúng chân vật thể lên tile |
| `display.scale` | default + reviewed override | cân tỷ lệ giữa các asset |
| `gridSize` | catalog/domain metadata | chiếm tile và collision |

Renderer đọc manifest qua `game-asset-contract.ts`; không hard-code anchor PNG trong component.

## 5. Ship checklist

- [ ] File và stage đúng convention.
- [ ] Nền trong suốt; silhouette không chạm canvas.
- [ ] Anchor preview trùng mặt tile, không nổi và không lún.
- [ ] Scale hợp lý bên cạnh plant/decoration chuẩn 1×1 và 2×2.
- [ ] Ánh sáng trên-phải, isometric 30°, palette và shading đúng Art Bible.
- [ ] Ghost và asset đã đặt dùng cùng metadata.
- [ ] Asset có thể select, move, rotate (nếu hỗ trợ) và store.
- [ ] `npm run assets:check`, test và build đã chạy.

## 6. Lệnh vận hành

```bash
npm run assets:analyze  # cập nhật manifest và in báo cáo
npm run assets:check    # CI gate; fail nếu có lỗi kỹ thuật
```

Manifest là generated file nhưng được commit cùng asset để build luôn tái lập được. Mỗi lần thay PNG phải chạy lại analyzer.

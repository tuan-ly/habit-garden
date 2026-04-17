Asset Style Workflow — Habit Garden

1. Vấn đề bạn đang gặp (gọi tên)
   Asset Decay: chỉ có 01-seed.png, các stage sau không tồn tại → fallback emoji → phá vibe.
   Style Drift: chưa có "art bible" → mỗi plant sẽ lệch nhau (cactus flat, sunflower painterly, bonsai pixel...).
   Context Mismatch: asset 2D front-facing đặt trong world isometric → không ăn nhập không gian.
2. Concept cần nắm (art direction vocabulary)
   Concept Ý nghĩa Quyết định cho Habit Garden
   Art Bible / Style Guide Tài liệu chốt style 1 lần, mọi asset sau tuân theo PHẢI có trước khi vẽ cái tiếp theo
   Projection Góc nhìn world (top-down, front, isometric, 2.5D) Isometric 2:1 (giống world của bạn)
   Silhouette Test Che chi tiết, chỉ còn outline — vẫn phân biệt được plant? Mỗi plant type có silhouette KHÁC nhau
   Growth Stages Chuỗi frame thể hiện tiến hoá Chuẩn hoá 5 stage cho mọi plant
   Color Script Palette cố định từ brand, không freeform Dùng Sage palette đã lock (#3B7A57, #6BA57A, #E8B96A...)
   Readable Scale Asset render ở size nhỏ nhất (32–64px tile) vẫn nhìn ra Shapes to, ít chi tiết rối
   Light Direction Tất cả asset cùng hướng sáng Top-left, 45° → shadow đổ bottom-right
   Lineart vs Shape-only Có outline đậm hay chỉ mảng màu Khuyến nghị: soft outline 1px Canopy (#1F3A2E)
3. Style đề xuất: "Paper-Cut Biophilic Isometric"
   Lý do chọn: đồng bộ với Organic Biophilic đã chốt ở UI shell (sage tones, rounded 16–24px, soft shadows, WCAG AA, Tailwind-friendly).

Visual contract:

Projection: Isometric 2:1 (30° angle), dimetric acceptable
Shading: 3-tone shading — base / shadow / highlight (no gradient ramps)
Outline: Soft 1–1.5px, color = canopy (#1F3A2E) ở opacity 60%, không đen 100%
Texture: Phẳng nhưng có grain nhẹ (paper texture overlay 5–8% opacity)
Corners: Tất cả điểm cuối bo tròn — lá không nhọn như gai
Palette per plant: 3 màu từ Sage palette + 1 accent riêng (ví dụ rose thêm #D97A8E)
Shadow: Ellipse dưới gốc, blur 4, opacity 20% canopy — KHÔNG drop-shadow 4 hướng 4. Growth Stages — chuẩn hoá 5 frame
Áp dụng cho MỌI plant type:

# Filename % Growth Mô tả Visual cue

1 01-seed.png 0–10% Hạt trong đất Mound đất + 1 mầm xanh xíu
2 02-sprout.png 10–30% Nảy mầm 2 lá mầm (cotyledon)
3 03-juvenile.png 30–60% Cây non Có đặc điểm nhận dạng loài (e.g. bamboo có đốt, cactus có gai)
4 04-mature.png 60–95% Trưởng thành Full silhouette, chưa nở hoa
5 05-bloom.png 95–100% Ra hoa/quả Hoa/quả đặc trưng (reward moment)
Convention: kích thước canvas cố định 256×256 PNG, transparent BG, plant anchored ở đáy-giữa (y=256, x=128). Lưu @2x (512×512) cho retina.

5. Workflow từng bước
   Step 0 — Lock Art Bible (1 lần, 1 trang A4)
   Tạo file docs/art-bible.md với:

Palette hex codes (copy từ globals.css)
Projection angle + reference image
1 plant "golden reference" vẽ trước (gợi ý: bamboo — silhouette đơn giản, dễ lặp style)
Do/Don't examples (no neon, no gradient, no sharp points)
Step 1 — Vẽ Golden Reference (bamboo, 5 stages)
Chốt được: line weight, shading, shadow, proportion
Đây là benchmark cho 7 plant còn lại
Step 2 — Silhouette Pass (cho 7 plant còn lại)
Trước khi chi tiết, vẽ chỉ silhouette đen cho từng plant ở stage 4 (mature) — đảm bảo 8 silhouette phân biệt được khi thu nhỏ 32px. Nếu 2 cái giống nhau → redesign.

Step 3 — Production theo batch
Không vẽ 1 plant đủ 5 stage rồi mới qua plant khác. Thay vào đó:

Batch by stage: vẽ 01-seed cho cả 8 plant → rồi 02-sprout cho cả 8 → ...
Lý do: ép consistency, tránh style drift giữa plant đầu và plant cuối
Step 4 — In-Context QA
Drop từng asset vào garden dev thật sự, zoom 50%/100%/200%. Nếu:

Nhìn mờ ở 50% → outline quá mảnh
Nhìn "lồi" ở 100% → shadow quá đậm
Không phân biệt được với plant khác → silhouette fail
Step 5 — Export pipeline

source.psd / figma / procreate file
↓ export
public/plants/<type>/<stage>.png (256×256)
public/plants/<type>/<stage>@2x.png (512×512)
↓ optimize
npx @squoosh/cli --oxipng '{...}' (giảm 40–60% size) 6. Tooling — 3 con đường thực tế
Path Effort Consistency Khi nào chọn
A. Vẽ tay (Procreate/Figma) Cao (40–60h) Cao nhất Bạn có thời gian + yêu thích art
B. AI gen + retouch (Midjourney/SDXL + Photoshop) Trung bình (15–25h) Trung bình — PHẢI có reference ảnh lock style Muốn nhanh nhưng vẫn polish
C. Mua asset pack (itch.io, Kenney.nl) Thấp (2–5h chọn + recolor) Cao (đã pro) Ship fast, accept không unique
Recommend: Path B cho bạn — Midjourney với reference mode (--cref hoặc --sref), prompt template cố định:

isometric 2:1 projection, <plant name> in <stage> growth stage,
paper-cut biophilic style, 3-tone shading, soft 1px dark green outline,
sage color palette (#3B7A57, #6BA57A, #E8B96A), flat cel shading,
white background, no gradient, no photorealism, no neon 7. Checklist trước khi ship 1 asset
Canvas 256×256, transparent, anchor bottom-center
Silhouette phân biệt với 7 plant khác ở 32px
Cùng light direction (top-left) với các asset đã có
Outline 1–1.5px canopy 60% opacity
3-tone shading, no gradient
Shadow ellipse dưới gốc
5 stages tồn tại đủ, naming đúng format
Dung lượng <30KB mỗi PNG sau oxipng
Dark mode test: vẫn nổi trên nền #0F1A14 8. Gợi ý bắt đầu ngay
Tạo docs/art-bible.md với spec ở mục 3
Chọn bamboo làm golden reference, vẽ đủ 5 stage
Commit + review cùng tôi → nếu OK, batch sang 7 plant còn lại theo stage

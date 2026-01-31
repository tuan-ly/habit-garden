# 03 - PLANT SYSTEM

## Tổng quan

Mỗi thói quen được đại diện bởi một cây. Cây có các đặc tính:
- Loại cây (plant_type)
- Độ ẩm (moisture) - giảm theo thời gian
- Tiến độ tăng trưởng (growth_percentage)
- Trạng thái (status)

## Các loại cây

### Basic Plants (Cây cơ bản)

| ID | Tên | Icon | Ngày | Tần suất | Độ khó | Mô tả |
|---|---|---|---|---|---|---|
| grass | Cỏ | 🌱 | 21 | daily | easy | Thói quen nhỏ, nhanh |
| flower | Hoa | 🌸 | 45 | daily | easy | Thói quen cơ bản |
| vegetable | Rau | 🥬 | 60 | daily | medium | Cho "thu hoạch" |
| bush | Bụi cây | 🌿 | 90 | flexible | medium | Chịu được miss |
| fruit_tree | Cây ăn quả | 🍎 | 180 | flexible | hard | Dài hạn, có quả |
| tree | Cây thân gỗ | 🌳 | 365 | flexible | hard | Rất dài hạn |

### Special Plants (Cây đặc biệt)

#### 🎋 Bamboo (Tre) - "Kiên nhẫn rồi bùng nổ"
```json
{
  "type": "delayed_growth",
  "hidden_until": 80,
  "burst_at": 80
}
Đặc điểm: 80% đầu không thấy progress, 20% cuối bùng nổ
UI: Hiển thị "Rễ đang mọc..." thay vì % growth
Bài học: Không thấy tiến bộ ≠ Không có tiến bộ
🌻 Sunflower (Hướng dương) - "Lan tỏa năng lượng"
Copy{
  "type": "buff_others",
  "buff_percentage": 5
}
Đặc điểm: Khi trưởng thành, tất cả cây khác +5% growth/day
UI: Hiển thị tia sáng từ hướng dương đến cây khác
Bài học: Một thói quen tốt kéo theo thói quen khác
🌸 Cherry Blossom (Anh đào) - "Nở rồi tàn"
Copy{
  "type": "cycle",
  "cycle_days": 30,
  "bloom_days": 7
}
Đặc điểm: Nở 7 ngày rồi tàn, phải trồng lại
UI: Counter cho cycle hiện tại
Bài học: Kiên trì là chuỗi bắt đầu lại
🌵 Cactus (Xương rồng) - "Chịu hạn"
Copy{
  "type": "drought_resistant",
  "decay_multiplier": 0.33
}
Đặc điểm: Moisture giảm chậm 3x (5%/ngày thay vì 15%)
UI: Hiển thị "Drought resistant" badge
Bài học: Không cần hoàn hảo, chỉ cần không bỏ cuộc
🌺 Lotus (Sen) - "Vươn lên từ bùn"
Copy{
  "type": "difficulty_bonus",
  "hard_day_bonus": 10
}
Đặc điểm: Check-in vào ngày khó = bonus growth
UI: Hỏi "Hôm nay khó không?" khi check-in
Bài học: Khó khăn tạo nên vẻ đẹp
🌳 Banyan (Cây đa) - "Rễ phụ thành cây"
Copy{
  "type": "spawn_children",
  "child_at": 100
}
Đặc điểm: Khi trưởng thành, có thể tạo "cây con" (sub-habits)
UI: Hiển thị cây với rễ phụ đang mọc
Bài học: Một gốc sinh nhiều nhánh
🍄 Mushroom (Nấm) - "Mọc trong bóng tối"
Copy{
  "type": "hidden_progress"
}
Đặc điểm: Không hiển thị % progress, bất ngờ khi xong
UI: Chỉ hiện "Đang mọc..." không có số
Bài học: Làm không cần thấy kết quả
🎄 Pine (Thông) - "Xanh mãi"
Copy{
  "type": "immortal_after_mature"
}
Đặc điểm: Sau trưởng thành, không bao giờ chết, chỉ "ngủ đông"
UI: Trạng thái "Active" hoặc "Dormant"
Bài học: Thói quen thành identity vĩnh viễn
Giai đoạn phát triển
Stage	%	Icon	Tên	Mô tả
1	0-10%	🌰	Hạt giống	Mới bắt đầu
2	11-25%	🌱	Mầm non	Mầm nhú lên
3	26-50%	🌿	Cây con	Có thân
4	51-75%	🪴	Cây đang lớn	Mạnh mẽ
5	76-99%	🌳	Sắp trưởng thành	Gần đích
6	100%	🌳✨	Trưởng thành	Hoàn thành
Trạng thái cây (Status)
Status	Mô tả	Điều kiện
growing	Đang lớn	Bình thường
mature	Trưởng thành	growth >= 100%
dead	Chết	moisture = 0
dormant	Ngủ đông	Pine không tưới lâu
blooming	Đang nở	Cherry blossom trong bloom_days
wilting	Đang héo	moisture < 30%
Logic xử lý
Khi tưới nước (water)
1. Check đã tưới hôm nay chưa (1 lần/ngày)
2. Tăng moisture (+20%, max 100%)
3. Tăng total_waterings
4. Cập nhật streak
5. Tính growth_percentage mới
6. Tính XP earned
7. Check achievements
8. Apply special effects
Khi cập nhật hàng ngày (daily cron)
1. Generate weather
2. Giảm moisture theo decay_rate
3. Apply weather modifier
4. Check cây chết (moisture = 0)
5. Check cây trưởng thành (growth = 100%)
6. Reset streak nếu không tưới
Gợi ý loại cây theo thói quen
Thói quen	Loại cây gợi ý	Lý do
Uống nước	🌱 Cỏ	Đơn giản, nhanh
Thiền	🌺 Sen	Bonus ngày khó
Tập gym	🌵 Xương rồng	Cần nghỉ giữa
Đọc sách	🥬 Rau	Thu hoạch kiến thức
Học ngoại ngữ	🎋 Tre	Chậm rồi bùng nổ
Viết blog	🌻 Hướng dương	Lan tỏa
Chạy bộ	🌿 Bụi cây	Linh hoạt
Master skill	🎄 Thông	Identity vĩnh viễn


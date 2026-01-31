Phân tích & Đề xuất Thiết kế
1. 🌧️ Hành động thay thế ngày mưa/bão
Vấn đề: Tưới cây khi trời mưa không hợp lý về mặt logic.

Giải pháp: Thay đổi hành động dựa trên thời tiết:

Thời tiết	Hành động	Icon	Ý nghĩa
Sunny/Cloudy	"Tưới nước"	💧	Cung cấp nước cho cây
Rainy	"Chăm sóc"	🌱	Kiểm tra, tỉa lá, dọn dẹp
Stormy	"Che chở"	🏠	Bảo vệ cây khỏi gió bão
Rainbow	"Ngắm nhìn"	✨	Thưởng thức khoảnh khắc hiếm
Tất cả vẫn đều là "hoàn thành thói quen" - chỉ khác về cách thể hiện.

2. 🌿 Kích thước vườn dựa trên Level
Hiện tại: Vườn tự mở rộng theo vị trí cây.

Đề xuất mới:

Level 1-2:   3x3 = 9 ô    (Vườn nhỏ)
Level 3-4:   4x4 = 16 ô   (Vườn con)
Level 5-6:   5x5 = 25 ô   (Vườn xinh)
Level 7-9:   6x6 = 36 ô   (Vườn đẹp)
Level 10-12: 7x7 = 49 ô   (Vườn lớn)
Level 13-14: 8x8 = 64 ô   (Vườn rộng)
Level 15:    9x9 = 81 ô   (Khu vườn Eden)

Ô chưa mở khóa hiển thị mờ với icon khóa.

3. 💀 Hình phạt khi cây chết
Hiện tại: Cây chết → chỉ vào nghĩa trang.

Đề xuất mới:

Hình phạt	Số lượng	Ghi chú
Mất XP	-30 đến -100 XP	Tùy tuổi cây (waterings count)
"Garden Health" giảm	-10% mỗi cây chết	Dùng cho tính năng mở rộng
Thu hẹp vườn tạm thời	Nếu health < 50%	Mất quyền truy cập ô ngoài cùng
Cơ chế phục hồi:

Mỗi lần tưới cây sống: +2% garden health
Mỗi cây mature: +10% garden health
Max: 100%
4. 🏡 Đa vườn theo Domain
Cấu trúc mới:

User Profile (Chủ vườn)
├── overall_level: Tổng hợp từ tất cả vườn
├── overall_xp: Tổng XP
└── gardens[]
    ├── Garden 1: "Sức khỏe" (level 5, 450 XP)
    ├── Garden 2: "Học tập" (level 3, 180 XP)
    └── Garden 3: "Công việc" (level 7, 820 XP)

Domain gợi ý:

💪 Sức khỏe & Thể dục
📚 Học tập & Phát triển
💼 Công việc & Hiệu suất
💝 Quan hệ & Gia đình
🎨 Sáng tạo & Nghệ thuật
🧘 Tâm trí & Thiền định
⭐ Tùy chỉnh
Công thức Overall Level:

overall_level = round(average(garden_levels) + bonus)
bonus = +1 nếu có ≥3 vườn, +2 nếu có ≥5 vườn

Bạn muốn tôi triển khai theo thứ tự nào?
Hành động thay thế thời tiết - Thay đổi nhỏ, hiệu quả ngay
Garden size by level - Trung bình, cần database + UI
Plant death penalties - Trung bình, cần cân bằng cẩn thận
Multi-garden domains - Lớn, cần thiết kế database mới
Tôi khuyên bắt đầu với #1 (thay đổi hành động theo thời tiết) vì nhanh nhất và cải thiện trải nghiệm ngay lập tức. Sau đó là #2 (garden size) để tạo động lực mở rộng. Bạn nghĩ sao?
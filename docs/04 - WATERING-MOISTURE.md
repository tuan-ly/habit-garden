# 04 - WATERING & MOISTURE SYSTEM

## Hệ thống độ ẩm

### Moisture Levels

| Level | % | Trạng thái | Icon | Hành động |
|---|---|---|---|---|
| Full | 80-100 | Tươi tốt | 💧💧💧💧 | Không cần |
| Good | 60-79 | Khỏe mạnh | 💧💧💧 | Không cần |
| Low | 40-59 | Hơi khô | 💧💧 | Nên tưới |
| Critical | 20-39 | Héo | 💧 | Cần tưới ngay |
| Dying | 1-19 | Sắp chết | 💧🚨 | KHẨN CẤP |
| Dead | 0 | Chết | 💀 | Không cứu được |

### Decay Rate (Mỗi ngày không tưới)

| Loại cây | Decay Rate | Ngày đến chết |
|---|---|---|
| Cỏ | -20% | 5 ngày |
| Hoa | -15% | ~7 ngày |
| Rau | -15% | ~7 ngày |
| Bụi | -12% | ~8 ngày |
| Xương rồng | -5% | 20 ngày |
| Cây lớn | -8% | ~12 ngày |

### Weather Modifiers

| Thời tiết | Icon | Growth | Moisture |
|---|---|---|---|
| Sunny | ☀️ | +5% | -5% |
| Cloudy | ⛅ | 0 | 0 |
| Rainy | 🌧️ | 0 | +10% (auto) |
| Stormy | ⛈️ | -5% | -10% |
| Rainbow | 🌈 | +10% | +5% |

## Hệ thống tưới nước

### Watering Rules

1. **Một lần/ngày**: Chỉ tưới được 1 lần/ngày cho mỗi cây
2. **Moisture boost**: +20% moisture (có thể adjust theo plant type)
3. **Morning bonus**: Tưới trước 9h sáng = +5 XP bonus
4. **Streak bonus**: Streak càng dài, XP càng nhiều

### XP Calculation

Base XP = 10 Morning Bonus = +5 (nếu trước 9h) Streak Bonus = floor(streak / 7) * 5 (mỗi 7 ngày +5) Weather Bonus = +3 (nếu rainbow) Difficulty Bonus = +5 (nếu Sen + hard day)

Total XP = Base + Morning + Streak + Weather + Difficulty


### Water Reserves (Freeze)

- User có 2 bình dự trữ/tháng
- Khi dùng: Moisture không giảm trong ngày đó
- Không tính vào growth (chỉ bảo vệ)
- Tự động dùng nếu moisture sắp < critical
- Reset đầu mỗi tháng
- Bonus: Streak 30 = +1 bình, Streak 100 = +2 bình

### Streak Calculation

Nếu tưới hôm nay:

Nếu hôm qua đã tưới: streak++
Nếu hôm qua không tưới: streak = 1
Nếu không tưới hôm nay:

Nếu có water reserve: giữ streak
Nếu không: streak = 0
Cập nhật longest_streak nếu current > longest


## UI Flow khi tưới

### Step 1: Tap vào cây
Hiển thị PlantDetailSheet:

Tên cây, loại, mô tả
Moisture bar
Growth progress
Streak info
Nút "Tưới nước"

### Step 2: Xác nhận tưới
Nếu là Goal plant:

Hiện input form để nhập số
Validate số hợp lệ
Nếu là Simple plant:

Tưới ngay

### Step 3: Animation & Feedback
Water drop animation
Moisture bar tăng
XP popup (+15 XP)
Growth animation (nếu có)
Achievement popup (nếu có)
Close sheet hoặc show summary

## Notifications

### Reminder Schedule

| Thời điểm | Loại | Message |
|---|---|---|
| 8:00 AM | Morning | "Buổi sáng tốt lành! Đừng quên tưới cây nhé 🌱" |
| 7:00 PM | Evening | "Cây đang chờ bạn tưới nước 💧" |
| 9:00 PM | Warning | "Còn 3 tiếng để tưới! [Tên cây] đang khô" |
| 11:00 PM | Critical | "CUỐI CÙNG! [Tên cây] sắp héo rồi!" |

### Moisture-based Notifications

| Moisture | Notification |
|---|---|
| < 40% | "[Tên cây] đang khô, cần tưới nước!" |
| < 25% | "🚨 [Tên cây] sắp chết! Tưới ngay!" |
| Recovery | "Phew! [Tên cây] đã được cứu sống!" |
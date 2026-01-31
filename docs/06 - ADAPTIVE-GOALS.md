# 06 - ADAPTIVE GOALS SYSTEM

## Concept

Hệ thống tự động điều chỉnh weekly targets dựa trên performance thực tế.
"Cây lắng nghe người trồng"

## Ba chế độ

| Mode | Mô tả | Control |
|---|---|---|
| Fixed | Không thay đổi | User hoàn toàn |
| Suggest | Đề xuất, user quyết | Shared |
| Auto | Tự động điều chỉnh | System |

## Trigger Conditions

### 🚀 Trigger TĂNG target

Điều kiện (OR):

Performance > 110% trong 3 tuần liên tiếp
Performance > 130% trong 2 tuần liên tiếp
Đạt Personal Record mới
Hành động:

Tăng weekly target 10-20%
Có thể nâng mục tiêu cuối
Hoặc rút ngắn timeline

### 📉 Trigger GIẢM target

Điều kiện (OR):

Performance < 80% trong 3 tuần liên tiếp
Miss hoàn toàn 2 tuần
Downward trend 3 tuần
Hành động:

Giảm weekly target 10-20%
Có thể kéo dài timeline
Đề xuất recovery week

### ⚠️ Trigger CẢNH BÁO

Điều kiện:

Variance cao (lúc vượt xa, lúc miss)
Đang ở "Valley of Death" (tuần 2-4)
Hành động:

Không điều chỉnh
Gửi encouragement
Tips để ổn định

## Performance Scoring

### Weekly Performance Score

Score = (Actual / Target) × 100%

130% → Exceptional 🌟 110-130% → Exceeding 🚀 90-110% → On Track ✅ 70-90% → Below ⚠️ 50-70% → Struggling 😟 < 50% → Critical 🆘


### Trend Analysis

Analyze last 4 weeks:

All increasing → Upward 📈 All decreasing → Downward 📉 Mixed → Volatile 📊 Similar → Stable ➡️


### Decision Matrix

              Upward    Stable    Downward
Exceptional TĂNG 20% TĂNG 15% GIỮ Exceeding TĂNG 15% TĂNG 10% GIỮ On Track GIỮ GIỮ GIỮ Below GIỮ GIỮ GIẢM 10% Struggling GIỮ GIẢM 10% GIẢM 15% Critical GIẢM 15% GIẢM 20% PAUSE


## Recalculation Strategies

### Strategy 1: Giữ mục tiêu, đổi timeline
Problem: Đang struggle Solution: Kéo dài thời gian Example: 50 tuần → 62 tuần (+12 tuần)


### Strategy 2: Giữ timeline, đổi mục tiêu
Problem: Đang exceed Solution: Tăng mục tiêu cuối Example: 10km → 12km


### Strategy 3: Đổi progression curve
Problem: Pattern không match curve Solution: Đổi sang curve phù hợp hơn Example: Linear → S-Curve


### Strategy 4: Dynamic Buffer
Weekly target: 5km Buffer: ±20% (4km - 6km acceptable) Evaluate by: Rolling 4-week average


## Recovery Week

### Khi nào đề xuất:
- Performance < 60% trong 3 tuần
- User request (burnout, sick)
- Sau milestone lớn
- Scheduled every 8-12 tuần

### Cách hoạt động:
- Target giảm 50%
- Không tính vào trend
- Giữ streak
- Cây ở trạng thái "🌙 Đang nghỉ"

## Adjustment Notification Flow

### Exceeding Notification:
Title: "🎉 Bạn đang làm tuyệt vời!"

Body:

4 tuần vượt target
Avg performance: 118%
Options:

Tăng mục tiêu (10km → 12km)
Hoàn thành sớm (tuần 42 thay vì 50)
Giữ nguyên
[Chi tiết] [Chọn option]


### Struggling Notification:
Title: "💚 Điều chỉnh kế hoạch nhé?"

Body:

Khó khăn 3 tuần qua
Điều chỉnh là bình thường
Options:

Kéo dài timeline (+12 tuần)
Giảm mục tiêu (10km → 8km)
Nghỉ recovery 1 tuần
Giữ nguyên (tôi ổn!)
[Chi tiết] [Chọn option]


## Settings UI

Adaptive Mode: [Fixed] [Suggest] [Auto]

Trigger thresholds:

Tăng khi vượt: [110%] (3 tuần)
Giảm khi dưới: [80%] (3 tuần)
Max adjustment:

Tăng tối đa: [15%] / lần
Giảm tối đa: [15%] / lần
Protection limits: ☑️ Không giảm dưới mục tiêu ban đầu ☑️ Không tăng quá 150% mục tiêu ☑️ Tối đa 2 điều chỉnh / tháng

Recovery: ☑️ Cho phép đề xuất recovery week ☑️ Scheduled deload mỗi 8 tuần


## Data Storage

### goal_adjustments table:
adjustment_type: 'increase' | 'decrease' | 'curve_change' | 'timeline' | 'recovery'
old_value: JSON (trước điều chỉnh)
new_value: JSON (sau điều chỉnh)
trigger_reason: Lý do trigger
performance_data: Data 4 tuần
response: 'accepted' | 'rejected' | 'auto'

## Analytics

Track để improve algorithm:
- Acceptance rate của suggestions
- Success rate sau điều chỉnh
- Common rejection reasons
- Correlation: adjustment → completion
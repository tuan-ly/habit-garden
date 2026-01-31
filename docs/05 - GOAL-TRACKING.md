# 05 - GOAL TRACKING SYSTEM

## Tổng quan

Hai loại habit:
1. **Simple Habit**: Chỉ cần Yes/No (tưới hoặc không)
2. **Goal Habit**: Có số liệu đo lường

## Hai chế độ Goal

### 🏋️ Build Capacity
- Mục đích: Nâng cao năng lực theo thời gian
- Ví dụ: Chạy từ 2km → 10km
- Đo: Giá trị MỖI LẦN

### 💰 Total Progress
- Mục đích: Tích lũy đến mục tiêu
- Ví dụ: Tiết kiệm 100 triệu
- Đo: TỔNG tất cả các lần

## Tracking Metrics

| Metric | Công thức | Use Case |
|---|---|---|
| SUM | Σ(values) | Tích lũy tiền, số lượng |
| MAX | max(values) | Kỷ lục cá nhân |
| MIN | min(values) | Baseline, consistency |
| AVERAGE | Σ/count | Sustainable performance |

## Progression Curves

### 1. Linear (Tăng đều)
target = start + (end - start) × (week / total)

- Mỗi tuần tăng như nhau
- Phù hợp: Người có nền tảng

### 2. Exponential (Chậm → Nhanh)
target = start + (end - start) × (week / total)²

- Đầu tăng chậm, sau tăng nhanh
- Phù hợp: Người mới bắt đầu

### 3. Logarithmic (Nhanh → Chậm)
target = start + (end - start) × log(week + 1) / log(total + 1)

- Đầu tăng nhanh, sau ổn định
- Phù hợp: Quick wins

### 4. S-Curve (Sigmoid)
target = start + (end - start) × sigmoid(week, total)

- Chậm - Nhanh - Chậm
- Phù hợp: Kỹ năng thể chất (realistic nhất)

### 5. Step (Bậc thang)
target = start + (end - start) × floor(week / step_size) / total_steps

- Tăng theo level
- Phù hợp: Structured programs

## Weekly Target Generation

```javascript
function generateWeeklyTargets(goal) {
  const targets = [];
  
  for (let week = 1; week <= goal.duration_weeks; week++) {
    const target = calculateTarget({
      startValue: goal.start_value,
      endValue: goal.target_value,
      totalWeeks: goal.duration_weeks,
      currentWeek: week,
      type: goal.progression_type
    });
    
    targets.push({ week, target: round(target, 2) });
  }
  
  return targets;
}
Goal Log Entry
Khi user log số liệu:
Validate giá trị hợp lệ (> 0, hợp lý)
Tính toán các metrics:
Is personal record?
Exceeded weekly target?
Current week number?
Insert vào goal_logs
Update goal.current_value
Cũng tưới cây (watering_logs)
Tính XP
Personal Record Logic:
Copyfunction checkPersonalRecord(goal, newValue) {
  if (goal.tracking_metric === 'max') {
    return newValue > goal.current_value;
  }
  return false;
}
Goal Statistics
Hiển thị cho user:

Stat	Mô tả
Current Value	Giá trị hiện tại (max/sum/avg)
Weekly Target	Target của tuần này
Progress %	% so với mục tiêu cuối
Weeks Completed	Số tuần đã đạt target
Personal Records	Số lần đạt PR
Predicted Completion	Dự đoán ngày hoàn thành
UI Components
Goal Setup Wizard Steps:
Chọn Mode (Build Capacity / Total Progress)
Nhập Details (unit, start, target, duration)
Chọn Progression Curve
Preview & Confirm
Goal Plant Card:
Plant animation
Progress ring
Current vs Target
Weekly progress bar
PR badges
Goal Log Modal:
Number input
+/- buttons
Comparison với target
PR celebration
Notes (optional)
Goal Stats Page:
Progress chart (actual vs planned)
Weekly breakdown
Statistics summary
Adjustment history
Prediction

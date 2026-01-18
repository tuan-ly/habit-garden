# Test Moisture Decay Fix

## Bug Description
Cron job có thể chạy nhiều lần trong một ngày (do retries hoặc lỗi cấu hình), gây ra việc moisture decay nhiều lần và cây chết.

## Fix Applied
Thêm idempotency check vào cron job:
- Nếu `updated_at` là hôm nay (UTC) → Skip (đã được update rồi - bởi cron hoặc user watering)
- Ngược lại → Process bình thường (decay moisture)

**Rationale:**
- Nếu cron đã chạy hôm nay → updated_at = today → Skip (tránh decay 2 lần)
- Nếu user đã water hôm nay → updated_at = today → Skip (user đã ahead of schedule!)
- Chỉ decay khi plant chưa được touch hôm nay (updated_at = yesterday)

## Test Scenarios

### Scenario 1: Cron chạy 1 lần (bình thường)
**Setup:**
1. Plant có moisture = 100%, last_watered_at = yesterday, updated_at = yesterday

**Expected:**
- Moisture giảm theo decay rate (ví dụ: 100 → 88%)
- updated_at = today
- Status: Đếm vào `decayed` counter

### Scenario 2: Cron chạy 2 lần cùng ngày (fix)
**Setup:**
1. Lần 1: Plant có moisture = 100%, last_watered_at = yesterday, updated_at = yesterday
2. Lần 2: Plant có moisture = 88%, last_watered_at = yesterday, updated_at = today (từ lần 1)

**Expected:**
- Lần 1: Moisture giảm 100 → 88%
- Lần 2: **Skip plant** (already processed today)
- Status lần 2: Đếm vào `skipped` counter

### Scenario 3: User water sau khi cron chạy, cron retry
**Setup:**
1. Cron chạy midnight: moisture 100 → 88%, updated_at = today, last_watered_at = yesterday
2. User water lúc 10am: moisture 88 → 100%, last_watered_at = today, updated_at = today
3. Cron chạy lại (retry) lúc 11am: Plant có last_watered_at = today, updated_at = today

**Expected:**
- Lần 3: **Skip** vì `updated_at === today`
- Moisture không bị decay lại (tránh 100 → 88 sau khi user vừa water)
- Status: Đếm vào `skipped` counter

### Scenario 4: User water TRƯỚC khi cron chạy (early bird)
**Setup:**
1. User dậy sớm water lúc 6am: moisture 88 → 100%, last_watered_at = today, updated_at = today
2. Cron chạy lúc 7am: Plant có updated_at = today

**Expected:**
- **Skip** vì `updated_at === today`
- User đã hoàn thành habit hôm nay → không cần decay
- Đây là behavior đúng: Người dùng chăm chỉ không bị "phạt"

## How to Test

### Local Testing (Development)
```bash
# 1. Check current plants state
curl -X GET "http://localhost:3000/api/cron/moisture-decay"

# 2. Run cron again (should skip all plants that weren't watered today)
curl -X GET "http://localhost:3000/api/cron/moisture-decay"

# Expected response lần 2:
{
  "success": true,
  "date": "2026-01-18",
  "weather": "sunny",
  "totalPlants": 5,
  "processed": 0,
  "skipped": 5,  // <-- All plants skipped!
  "decayed": 0,
  "died": 0,
  "streaksReset": 0
}
```

### Production Testing (Vercel)
```bash
# With CRON_SECRET
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://your-app.vercel.app/api/cron/moisture-decay
```

## Success Criteria
✅ Cron chạy lần 1: Moisture decay bình thường
✅ Cron chạy lần 2 (cùng ngày): All plants skipped
✅ Plants không chết khi cron retry
✅ Response includes `skipped` count for monitoring

## Logs to Check
Console logs should show:
```
Plant abc-123 (My Habit) already processed today, skipping
Moisture decay completed: {
  date: "2026-01-18",
  weather: "sunny",
  totalPlants: 10,
  processed: 0,
  skipped: 10,
  ...
}
```

# Cron Job Guide - Moisture Decay System

## 📋 Overview

Habit Garden sử dụng **Vercel Cron Jobs** để tự động giảm moisture (độ ẩm) của cây mỗi ngày. Nếu người dùng không chăm sóc cây (không "water"), cây sẽ dần chết.

## ⚙️ Cấu hình

### vercel.json
```json
{
  "crons": [
    {
      "path": "/api/cron/moisture-decay",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**Schedule Format**: Cron expression (Unix cron syntax)
- `0 0 * * *` = Chạy lúc **00:00 UTC** mỗi ngày (7:00 sáng giờ Việt Nam)
- Pattern: `minute hour day-of-month month day-of-week`

**Examples:**
- `0 0 * * *` - Daily at midnight UTC
- `*/15 * * * *` - Every 15 minutes
- `0 */6 * * *` - Every 6 hours
- `0 2 * * *` - Daily at 2:00 AM UTC

## 🔄 Cách Hoạt Động

### 1. Vercel Triggers Cron
- Vercel tự động gọi HTTP GET request đến `/api/cron/moisture-decay`
- Thêm header: `Authorization: Bearer ${CRON_SECRET}`
- Chạy trên Vercel edge network (không phải trên máy bạn)

### 2. Cron Job Xử Lý
```
┌─────────────────────────────────────────────────────────────┐
│ 1. Verify CRON_SECRET (production only)                    │
│ 2. Connect to Supabase with Service Role Key               │
│ 3. Get today's weather (for decay modifier)                │
│ 4. Query all plants with status = 'growing'                │
│ 5. For each plant:                                          │
│    ├─ Check idempotency (skip if updated_at = today)      │
│    ├─ Calculate decay (base rate × weather modifier)       │
│    ├─ Update moisture (current - decay)                    │
│    ├─ Check if should die (moisture ≤ 0)                   │
│    ├─ Check if should reset streak (not watered)           │
│    └─ Update plant record in database                      │
│ 6. Return summary statistics                               │
└─────────────────────────────────────────────────────────────┘
```

### 3. Logic Flow (sau fix idempotency)

```typescript
for (const plant of plants) {
  // IDEMPOTENCY CHECK - New!
  if (updated_at === today) {
    // Already processed today (by cron or user watering)
    results.skipped++
    continue  // ← Skip to prevent double decay
  }

  // CALCULATE DECAY
  baseDecay = plant_type.moisture_decay_rate  // 5-20%
  weatherModifier = getWeatherModifier()       // sunny: ×1.2, rainy: ×0.7
  adjustedDecay = baseDecay × weatherModifier

  // UPDATE MOISTURE
  newMoisture = max(0, current_moisture - adjustedDecay)

  // CHECK DEATH
  if (newMoisture <= 0) {
    status = 'dead'
    died_at = now()
    death_reason = 'Moisture reached 0%'
  }

  // CHECK STREAK
  if (not watered yesterday or today) {
    current_streak = 0
  }

  // SAVE
  update plant in database
  results.processed++
}
```

## 🔒 Bảo mật

### Environment Variables (Required for Production)

1. **`CRON_SECRET`** (optional but recommended)
   - Purpose: Ngăn người khác gọi cron endpoint
   - Example: `CRON_SECRET=my-super-secret-key-12345`
   - Vercel tự động thêm header `Authorization: Bearer ${CRON_SECRET}`

2. **`SUPABASE_SERVICE_ROLE_KEY`** (required)
   - Purpose: Admin access để update toàn bộ plants (bypass RLS)
   - Lấy từ: Supabase Dashboard → Settings → API
   - **Warning**: Không bao giờ expose key này ra client!

### Security Check
```typescript
// In route.ts
const authHeader = request.headers.get('authorization')
if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "date": "2026-01-18",
  "weather": "sunny",
  "totalPlants": 25,
  "processed": 18,      // Plants that had moisture decayed
  "skipped": 7,         // Plants already updated today (idempotency)
  "decayed": 18,        // Plants with moisture decreased
  "died": 2,            // Plants that died (moisture = 0)
  "streaksReset": 5     // Plants with streak reset to 0
}
```

### Error Response
```json
{
  "error": "Unauthorized"  // or "Internal server error"
}
```

## 🧪 Testing

### Local Development

**Problem**: Cron không chạy tự động trên localhost (chỉ chạy trên Vercel).

**Solution 1: Manual Trigger**
```bash
# Call the cron endpoint directly (no CRON_SECRET needed in dev)
curl http://localhost:3000/api/cron/moisture-decay

# Or with POST
curl -X POST http://localhost:3000/api/cron/moisture-decay
```

**Solution 2: Test Endpoint** (if you create one)
```bash
# Development-only endpoint for testing
curl http://localhost:3000/api/test/moisture-decay
```

### Production (Vercel)

**Via Vercel Dashboard:**
1. Go to your project on Vercel
2. Navigate to **Deployments** → **Cron Jobs**
3. Click **Run** next to `moisture-decay`
4. View logs

**Via API:**
```bash
# With CRON_SECRET
curl -H "Authorization: Bearer your_cron_secret_here" \
  https://habit-garden.vercel.app/api/cron/moisture-decay
```

**Check Logs:**
```bash
# Vercel CLI
vercel logs --follow

# Or in Vercel Dashboard → Deployments → Functions
```

## 🐛 Debugging

### Check if Cron is Running

**Vercel Dashboard:**
- Go to: Project → Settings → Cron Jobs
- Status should be "Active"
- Recent runs should show success/failure

**Via Logs:**
```bash
# Look for console.log output
vercel logs | grep "Moisture decay completed"
```

### Common Issues

#### 1. Cron not running
- ✅ Check `vercel.json` is committed
- ✅ Check cron is enabled in Vercel dashboard
- ✅ Verify schedule format is correct

#### 2. Unauthorized error
- ✅ Set `CRON_SECRET` environment variable
- ✅ Make sure Vercel is using the same secret

#### 3. Database error
- ✅ Set `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Check Supabase connection URL
- ✅ Verify RLS policies allow service role

#### 4. Plants dying too fast (fixed!)
- ✅ Check idempotency logic (should skip if already updated today)
- ✅ Look for `skipped` count in response
- ✅ Verify cron isn't running multiple times (check logs)

### Logs to Look For

**Success:**
```
Moisture decay completed: {
  date: "2026-01-18",
  weather: "sunny",
  totalPlants: 10,
  processed: 8,
  skipped: 2,
  ...
}
```

**Idempotency Working:**
```
Plant abc-123 (My Morning Run) already processed, skipping decay
Plant def-456 (Reading Habit) watered today, skipping decay
```

## 📈 Monitoring

### Key Metrics to Track

1. **`totalPlants`** - How many growing plants exist
2. **`processed`** - How many had moisture decayed (should be most plants)
3. **`skipped`** - Should be low (only if cron retries or early bird users)
4. **`died`** - How many plants died (watch for spikes!)
5. **`streaksReset`** - How many lost their streaks

### Alerting Ideas

```typescript
// Example: Alert if too many plants died
if (results.died > totalPlants * 0.1) {
  // More than 10% died - something wrong!
  await sendAlert('Too many plants died in cron job')
}

// Example: Alert if too many skipped
if (results.skipped > totalPlants * 0.5) {
  // More than 50% skipped - cron might be running too often
  await sendAlert('Cron job may be running multiple times')
}
```

## 🎯 Best Practices

### 1. Idempotency (Implemented ✅)
- Always check if operation already happened today
- Use `updated_at` field as marker
- Prevents data corruption on retries

### 2. Logging
- Log summary statistics
- Log skip reasons
- Include timestamp and weather

### 3. Error Handling
- Use try-catch for entire operation
- Don't fail entire cron if one plant fails
- Return partial success with error details

### 4. Performance
- Use indexes on `status` and `updated_at` columns
- Batch updates if possible
- Limit query results if needed

### 5. Testing
- Test locally before deploying
- Verify idempotency works (run twice, check skipped count)
- Test edge cases (plant watered before cron, etc.)

## 🔧 Maintenance

### Changing Schedule

Edit `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/moisture-decay",
      "schedule": "0 2 * * *"  // Changed to 2:00 AM UTC
    }
  ]
}
```

Then:
```bash
git add vercel.json
git commit -m "chore: change cron schedule to 2am UTC"
git push
```

Vercel will auto-update the schedule on next deployment.

### Disabling Cron Temporarily

**Option 1: Remove from vercel.json**
```json
{
  "crons": []
}
```

**Option 2: Vercel Dashboard**
- Go to Settings → Cron Jobs
- Disable the cron job

### Manual Run (For Testing/Recovery)

```bash
# Production
curl -H "Authorization: Bearer $CRON_SECRET" \
  https://your-app.vercel.app/api/cron/moisture-decay

# Local
curl http://localhost:3000/api/cron/moisture-decay
```

## 📚 Related Files

- `vercel.json` - Cron configuration
- `src/app/api/cron/moisture-decay/route.ts` - Cron job handler
- `src/lib/weather-system.ts` - Weather modifier logic
- `scripts/test-moisture-decay.md` - Test scenarios
- `.claude/MEMO.md` - Project state and recent changes

## 🚀 Future Improvements

- [ ] Add retry logic with exponential backoff
- [ ] Implement partial failure handling
- [ ] Add Sentry/error tracking integration
- [ ] Create admin dashboard to view cron history
- [ ] Add email notifications for mass plant deaths
- [ ] Implement dry-run mode for testing

# 07 - GAMIFICATION SYSTEM

## XP System

### XP Sources

| Action | Base XP | Bonuses |
|---|---|---|
| Tưới nước | 10 | Morning +5, Streak bonus |
| Hoàn thành tuần | 50 | - |
| Cây trưởng thành | 100-500 | Theo loại cây |
| Personal Record | 25 | - |
| Achievement | 10-500 | Theo achievement |
| Recovery comeback | 50 | - |

### Streak Bonus Formula

streak_bonus = floor(current_streak / 7) * 5 Max bonus: 50 XP (streak 70+)

Examples:

Streak 7: +5 XP
Streak 14: +10 XP
Streak 30: +20 XP
Streak 100: +50 XP (capped)

### Level System

Level = floor(sqrt(total_xp / 100)) + 1

XP needed for level N: xp_needed = (N - 1)² × 100

Level 1: 0 XP Level 2: 100 XP Level 3: 400 XP Level 4: 900 XP Level 5: 1600 XP Level 10: 8100 XP Level 20: 36100 XP


### Level Titles

| Level | Title | Title VI |
|---|---|---|
| 1-2 | Seedling | Mầm non |
| 3-5 | Sprout | Cây con |
| 6-10 | Gardener | Người làm vườn |
| 11-15 | Farmer | Nông dân |
| 16-20 | Botanist | Nhà thực vật học |
| 21-30 | Garden Master | Bậc thầy vườn |
| 31+ | Forest Keeper | Người giữ rừng |

## Achievements

### Progress Achievements

| ID | Name | Condition | XP |
|---|---|---|---|
| first_plant | Hạt giống đầu tiên | Tạo plant đầu | 10 |
| five_plants | Vườn nhỏ | Có 5 plants | 50 |
| ten_plants | Vườn lớn | Có 10 plants | 100 |
| first_mature | Thu hoạch đầu | 1 cây mature | 100 |
| five_mature | Nông dân | 5 cây mature | 200 |
| twenty_mature | Chủ vườn | 20 cây mature | 500 |

### Streak Achievements

| ID | Name | Condition | XP |
|---|---|---|---|
| streak_7 | Tuần đầu tiên | 7 ngày streak | 50 |
| streak_21 | 3 tuần | 21 ngày streak | 100 |
| streak_30 | 1 tháng | 30 ngày streak | 150 |
| streak_66 | Thói quen | 66 ngày streak | 200 |
| streak_100 | Triple digits | 100 ngày streak | 300 |
| streak_365 | 1 năm | 365 ngày streak | 1000 |

### Special Achievements

| ID | Name | Condition | XP |
|---|---|---|---|
| early_bird | Chim sớm | 10 morning waterings | 50 |
| phoenix | Phượng hoàng | Recover dying plant | 100 |
| bamboo_master | Bậc thầy tre | Complete bamboo | 300 |
| drought_survivor | Sống sót | Cactus survive 15 days no water | 100 |
| rainbow_lucky | May mắn | Gặp rainbow 3 lần | 50 |
| perfect_week | Tuần hoàn hảo | 7/7 tưới trong tuần | 75 |
| perfect_month | Tháng hoàn hảo | 30/30 tưới | 200 |

### Goal Achievements

| ID | Name | Condition | XP |
|---|---|---|---|
| first_pr | Kỷ lục đầu | 1 Personal Record | 25 |
| ten_pr | PR Hunter | 10 PRs | 100 |
| goal_complete | Đạt mục tiêu | Complete 1 goal | 200 |
| overachiever | Vượt kỳ vọng | Exceed goal by 20% | 150 |
| adaptive_success | Thích nghi | Complete after adjustment | 100 |

## Badges Display

User Profile: ┌────────────────────────────────┐ │ 🏆 Badges (12/45) │ │ │ │ 🌱 🌳 🔥 💪 👑 🌅 │ │ 🔄 🎋 🌈 ✨ 📈 🎯 │ │ │ │ [View all badges →] │ └────────────────────────────────┘


## Weather System

### Daily Weather Generation

Probability:

Sunny ☀️: 30%
Cloudy ⛅: 30%
Rainy 🌧️: 25%
Stormy ⛈️: 10%
Rainbow 🌈: 5%

### Weather Effects

| Weather | Growth Mod | Moisture Mod | Special |
|---|---|---|---|
| Sunny | +5% | -5% | - |
| Cloudy | 0% | 0% | - |
| Rainy | 0% | +10% | Auto water |
| Stormy | -5% | -10% | Plants more vulnerable |
| Rainbow | +10% | +5% | Rare bonus |

## Daily Rewards

### Login Streak Rewards

| Day | Reward |
|---|---|
| 1 | 5 XP |
| 2 | 10 XP |
| 3 | 15 XP |
| 4 | 20 XP |
| 5 | 25 XP |
| 6 | 30 XP |
| 7 | 50 XP + 1 Water Reserve |

### Weekly Summary

Mỗi Chủ nhật, show:

Tổng XP tuần
Cây đã tưới
Streak status
Weather encountered
Achievements unlocked
Next week preview

## Notifications for Gamification

| Event | Notification |
|---|---|
| Level up | "🎉 Level Up! Bạn đã đạt level [N]!" |
| Achievement | "🏆 Achievement Unlocked: [Name]" |
| Streak milestone | "🔥 [N] ngày streak! Tiếp tục nhé!" |
| Weather | "🌈 Cầu vồng hôm nay! +10% growth cho tất cả cây!" |
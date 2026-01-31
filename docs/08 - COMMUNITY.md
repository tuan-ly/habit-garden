# 08 - COMMUNITY SYSTEM (Phase 3)

## Overview

Tính năng cộng đồng cho phép người dùng:
- Tạo vườn chung
- Tưới hộ bạn bè
- Tặng quà
- Xem leaderboard

## Garden Types

### Personal Garden (Default)
- Chỉ user xem được
- Private by default

### Buddy Garden (2 người)
- Couple hoặc accountability partner
- Cả 2 phải tưới để tính 1 ngày
- Shared progress

### Group Garden (3-10 người)
- Friend groups
- Mỗi người có cây riêng
- Có thể tưới hộ (1 lần/tuần)
- Leaderboard trong nhóm

### Public Garden (Community)
- Challenges công khai
- Cây chung khổng lồ
- Tất cả cùng đóng góp

## Buddy Garden

### Setup Flow:
1. User A tạo buddy garden
2. Nhận invite link
3. User B accept
4. Chọn thói quen chung
5. Cả 2 cùng trồng

### Rules:
- Cả 2 phải tưới trong ngày = tính là tưới
- 1 người tưới = 50% moisture
- Cả 2 tưới = 100% moisture + bonus
- Streak = cả 2 đều giữ

### UI:
┌────────────────────────────────────┐ │ 💑 Buddy Garden: Học tiếng Anh │ │ │ │ 🌳 │ │ /||\ │ │ || │ │ │ │ Hôm nay: │ │ 👤 Bạn: ✅ Đã tưới │ │ 👤 Minh: ⏳ Chưa tưới │ │ │ │ [💌 Nhắc Minh] │ └────────────────────────────────────┘


## Group Garden

### Features:
- Mỗi người 1 cây
- Xem tiến độ của nhau
- Tưới hộ 1 lần/tuần
- Weekly leaderboard
- Group streak

### Tưới hộ (Water for friend):
- Giới hạn: 1 lần/tuần
- Hiệu quả: +10% moisture (không full)
- Notification cho người được tưới
- XP cho người tưới hộ

### UI:
┌────────────────────────────────────┐ │ 👥 Group: Squad Gym │ │ Members: 5 │ Streak: 8 tuần │ │ │ │ 🌳 🌿 🌱 🌳 🥀 │ │ Bạn Minh Lan Hùng Trang │ │ 78% 65% 30% 82% 25% │ │ │ │ ⚠️ Trang cần tưới! │ │ [💧 Tưới hộ Trang] │ └────────────────────────────────────┘


## Gift System

### Gift Types:

| Gift | Effect | How to get |
|---|---|---|
| 🚿 Water | +1 Water Reserve | 200 XP |
| ☀️ Sunlight | +10% growth 3 days | Streak 30 |
| 🌱 Seed | Tặng cây mới (start 10%) | Mature plant |
| 🥥 Coconut | +20% growth 1 day | Coconut tree |
| 🌈 Rainbow | +30% growth all plants | Random rare |

### Gifting Flow:
1. Vào profile bạn
2. Chọn gift
3. Chọn cây của bạn để apply
4. Add message (optional)
5. Send

### Receiving Gift:
- Notification
- Gift icon trên cây
- Claim để apply effect
- Thank you message (optional)

## Leaderboard

### Types:
- Global (all users)
- Country (Vietnam, etc.)
- Friends only
- Group

### Metrics:
- Total XP
- Current streak
- Plants matured
- Weekly waterings

### UI:
┌────────────────────────────────────┐ │ 🏆 Leaderboard - Tuần này │ │ [Global] [Vietnam] [Friends] │ │ │ │ 1. 🥇 @green_master 2,450 XP │ │ 2. 🥈 @habit_queen 2,280 XP │ │ 3. 🥉 @daily_grower 2,100 XP │ │ ... │ │ 24. 👤 Bạn 890 XP │ │ │ └────────────────────────────────────┘


## Public Challenges

### Monthly Challenge Example:
🌸 MÙA HOA ANH ĐÀO - Tháng 3

Mục tiêu: Cộng đồng trồng 10,000 cây Anh Đào Tiến độ: 6,234/10,000 (62%) Còn lại: 18 ngày

Phần thưởng:

🌸 Badge "Mùa hoa 2026"
+500 XP cho mỗi người
Unlock cây Anh Đào Vàng (rare)
Bạn đã đóng góp: 3 cây

[Trồng thêm cây Anh Đào]


## Privacy Settings

Visibility: ○ Public - Ai cũng thấy profile ○ Friends only - Chỉ bạn bè ● Private - Không ai thấy

Allow: ☑️ Friend requests ☑️ Buddy garden invites ☑️ Group garden invites ☐ Appear in leaderboard ☑️ Receive gifts


## Database Schema Additions

```sql
-- Gardens
CREATE TABLE gardens (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'buddy', 'group', 'public'
  owner_id UUID REFERENCES profiles(id),
  max_members INTEGER DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garden Members
CREATE TABLE garden_members (
  garden_id UUID REFERENCES gardens(id),
  user_id UUID REFERENCES profiles(id),
  role TEXT DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (garden_id, user_id)
);

-- Friendships
CREATE TABLE friendships (
  user_id UUID REFERENCES profiles(id),
  friend_id UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, friend_id)
);

-- Gifts
CREATE TABLE gifts (
  id UUID PRIMARY KEY,
  from_user_id UUID REFERENCES profiles(id),
  to_user_id UUID REFERENCES profiles(id),
  gift_type TEXT NOT NULL,
  target_plant_id UUID REFERENCES plants(id),
  message TEXT,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  claimed_at TIMESTAMPTZ,
  claimed BOOLEAN DEFAULT FALSE
);
# 11 - IMPLEMENTATION PHASES

# Follow instructions in 01-PROJECT-OVERVIEW.md
Khi cần tra cứu:
Cần thông tin về	Đọc file
Tech stack, setup	01-PROJECT-OVERVIEW.md
Database, tables	02-DATABASE-SCHEMA.md
Loại cây, hiệu ứng	03-PLANT-SYSTEM.md
Tưới nước, moisture	04-WATERING-MOISTURE.md
Goal tracking	05-GOAL-TRACKING.md
Adaptive system	06-ADAPTIVE-GOALS.md
XP, achievements	07-GAMIFICATION.md
Community (future)	08-COMMUNITY.md
UI components	09-UI-COMPONENTS.md
API, hooks	10-API-HOOKS.md
Task breakdown	11-IMPLEMENTATION-PHASES.md
## Overview

Dự án chia thành 4 phases chính:
- Phase 1: MVP Core (4-6 tuần)
- Phase 2: Gamification (3-4 tuần)
- Phase 3: Goal Tracking (3-4 tuần)
- Phase 4: Community (4-6 tuần - future)

## Phase 1: MVP Core (4-6 tuần)

### Week 1-2: Setup & Auth

**Tasks:**
- [x] Setup Next.js project với TypeScript, Tailwind
- [x] Setup Supabase project
- [x] Configure environment variables
- [x] Setup shadcn/ui components
- [x] Create database schema (basic tables)
- [x] Implement auth (login, register, logout)
- [x] Create protected routes
- [x] Setup user profile
- [x] Basic layout (header, navigation)

**Deliverables:**
- User có thể đăng ký, đăng nhập
- Protected dashboard page
- Basic profile display

### Week 3-4: Garden Core

**Tasks:**
- [x] Create plant_types seed data
- [x] Implement GardenView component
- [x] Create PlantCard component
- [x] Create "Add Plant" flow
- [x] Plant type selection UI
- [x] PlantDetailSheet component
- [x] Basic plant animation (CSS animations for all growth states)
- [x] Plant list with grid layout
- [x] Empty state design

**Deliverables:**
- User có thể tạo cây mới
- Xem danh sách cây trong vườn
- Xem chi tiết cây

### Week 5-6: Watering System

**Tasks:**
- [x] Implement watering API
- [x] Create WateringButton component
- [x] Moisture bar component
- [x] Growth progress component
- [x] Streak tracking logic
- [x] Daily moisture decay (cron job)
- [x] Plant death logic
- [ ] Basic notifications setup
- [x] XP calculation (basic)

**Deliverables:**
- User có thể tưới cây
- Moisture giảm theo thời gian
- Cây có thể chết
- Streak được track

## Phase 2: Gamification (3-4 tuần)

### Week 7-8: Enhanced Plants

**Tasks:**
- [x] Implement special plant effects:
  - [x] Bamboo (delayed growth)
  - [x] Sunflower (buff others)
  - [x] Cherry Blossom (cycle)
  - [x] Cactus (drought resistant)
  - [x] Lotus (difficulty bonus)
- [x] Create Lottie animations cho cây (lottie-react installed, CSS animations implemented)
- [x] Special effect UI indicators
- [x] Plant stage progression visuals

**Deliverables:**
- 5 loại cây đặc biệt hoạt động
- Animation đẹp cho cây

### Week 9-10: XP & Achievements

**Tasks:**
- [x] Full XP system implementation
- [x] Level progression
- [x] Create achievements table & data
- [x] Achievement checking logic
- [x] Achievement popup UI
- [x] Daily weather system
- [x] Weather effects on plants
- [x] Water reserves (freeze) feature
- [x] Stats dashboard
- [x] Cemetery (dead plants history)

**Deliverables:**
- Full gamification hoạt động
- Achievements, levels, weather
- Stats tracking

## Phase 3: Goal Tracking (3-4 tuần)

### Week 11-12: Goal System

**Tasks:**
- [x] Goals database schema
- [x] Goal setup wizard UI
- [x] Build Capacity mode
- [x] Total Progress mode
- [x] Progression curves implementation
- [x] Weekly targets generation
- [x] Goal log entry UI
- [x] Goal statistics display
- [x] Progress chart component

**Deliverables:**
- User có thể tạo goal plants
- Log số liệu hàng ngày
- Xem progress charts

### Week 13-14: Adaptive Goals

**Tasks:**
- [ ] Adaptive trigger detection
- [ ] Performance scoring
- [ ] Trend analysis
- [ ] Suggestion generation
- [ ] Adjustment UI (notification/modal)
- [ ] Apply/reject adjustment flow
- [ ] Recovery week feature
- [ ] Adjustment history
- [ ] Adaptive settings UI

**Deliverables:**
- Adaptive goals hoạt động
- User nhận suggestions
- Recovery week available

## Phase 4: Polish & Launch (2 tuần)

### Week 15-16: Polish

**Tasks:**
- [ ] Responsive design check
- [ ] PWA setup
- [ ] Onboarding flow
- [ ] Empty states
- [ ] Error handling
- [ ] Loading states
- [ ] Performance optimization
- [ ] SEO setup
- [ ] Analytics integration
- [ ] Landing page

**Deliverables:**
- Production-ready app
- PWA installable
- Good UX across devices

## Phase 5: Community (Future)

### Tasks:
- [ ] Buddy gardens
- [ ] Group gardens
- [ ] Friend system
- [ ] Gift system
- [ ] Leaderboards
- [ ] Public challenges

## Priority Matrix

### Must Have (P0):
- Auth
- Create/view plants
- Watering
- Moisture/death
- Basic gamification

### Should Have (P1):
- Special plants
- Goal tracking
- Adaptive goals
- Weather system
- Achievements

### Nice to Have (P2):
- Community features
- Advanced analytics
- Multiple themes
- Sound effects

### Future (P3):
- Mobile app
- API for integrations
- Team/enterprise features

## Development Guidelines

### Code Quality:
- TypeScript strict mode
- ESLint + Prettier
- Component unit tests
- E2E tests for critical paths

### Git Workflow:
- main: production
- develop: staging
- feature/*: new features
- PR required for merge

### Documentation:
- Component storybook (optional)
- API documentation
- README updated

### Performance Targets:
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Lighthouse score > 90
📋 INSTRUCTION CHO CLAUDE CODE
Khi bắt đầu làm việc, hãy:

Đọc tất cả các file documentation theo thứ tự
Bắt đầu từ Phase 1, Week 1-2 (Setup & Auth)
Mỗi khi hoàn thành 1 feature, đánh dấu checkbox trong file 11-IMPLEMENTATION-PHASES.md
Khi gặp vấn đề về design, tham khảo file tương ứng
Commit thường xuyên với message rõ ràng
Commands để bắt đầu:
Copy# 1. Tạo project
npx create-next-app@latest vuon-thoi-quen --typescript --tailwind --app --src-dir

# 2. Đọc documentation
cat docs/01-PROJECT-OVERVIEW.md

# 3. Bắt đầu setup
# Follow instructions in 01-PROJECT-OVERVIEW.md
Khi cần tra cứu:
Cần thông tin về	Đọc file
Tech stack, setup	01-PROJECT-OVERVIEW.md
Database, tables	02-DATABASE-SCHEMA.md
Loại cây, hiệu ứng	03-PLANT-SYSTEM.md
Tưới nước, moisture	04-WATERING-MOISTURE.md
Goal tracking	05-GOAL-TRACKING.md
Adaptive system	06-ADAPTIVE-GOALS.md
XP, achievements	07-GAMIFICATION.md
Community (future)	08-COMMUNITY.md
UI components	09-UI-COMPONENTS.md
API, hooks	10-API-HOOKS.md
Task breakdown	11-IMPLEMENTATION-PHASES.md
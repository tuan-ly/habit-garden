# 01 - PROJECT OVERVIEW

## Mô tả dự án

"Vườn Thói Quen" là web app giúp người dùng xây dựng thói quen thông qua 
gamification với theme trồng cây. Mỗi thói quen là một cây cần được tưới 
nước (check-in) hàng ngày để lớn lên.

## Core Concept

- Mỗi thói quen = 1 cây
- Check-in hàng ngày = Tưới nước
- Cây có độ ẩm, giảm dần nếu không tưới
- Cây chết nếu độ ẩm = 0
- Cây trưởng thành khi đạt đủ thời gian (21-365+ ngày tùy loại)
- Không được đánh giá thói quen khi cây chưa trưởng thành

## Triết lý chính

"Mỗi thói quen có thời gian chín riêng. Đừng đánh giá khi chưa đủ thời gian."

## Tech Stack

### Frontend
- Next.js 
- TypeScript
- Tailwind CSS
- shadcn/ui (component library)
- Framer Motion (animations)
- Lottie (complex animations)
- Zustand (client state)
- TanStack Query (server state)

### Backend
- Supabase
  - PostgreSQL (database)
  - Auth (authentication)
  - Realtime (subscriptions)
  - Storage (files)
  - Edge Functions (serverless)

### Deployment
- Vercel (hosting)
- GitHub (version control)

## Project Setup Commands

```bash
# Create Next.js project
npx create-next-app@latest vuon-thoi-quen --typescript --tailwind --app --src-dir

# Install dependencies
npm install @supabase/supabase-js @supabase/ssr
npm install @tanstack/react-query
npm install zustand
npm install framer-motion
npm install @lottiefiles/react-lottie-player
npm install date-fns
npm install zod react-hook-form @hookform/resolvers

# Install shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog input label select tabs toast
Environment Variables
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
Folder Structure
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── garden/page.tsx
│   │   ├── plant/[id]/page.tsx
│   │   ├── stats/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                 # shadcn components
│   ├── garden/             # Garden-specific components
│   ├── plants/             # Plant type components
│   ├── goals/              # Goal tracking components
│   └── shared/             # Shared components
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── utils.ts
│   ├── constants.ts
│   └── progression.ts
├── hooks/
│   ├── usePlants.ts
│   ├── useWatering.ts
│   ├── useGoals.ts
│   └── useAdaptive.ts
├── stores/
│   ├── gardenStore.ts
│   └── userStore.ts
├── types/
│   ├── database.ts
│   ├── plant.ts
│   └── goal.ts
└── animations/
    ├── plants/
    └── effects/
# Frontend — Velo TradeFi

Next.js 16 App Router + TypeScript + TailwindCSS v4 + shadcn/ui.

## Tech Stack

| Thư viện | Mục đích |
|---------|---------|
| Next.js 16 | Framework (App Router + Turbopack) |
| React 19 | UI library |
| TailwindCSS v4 | Styling |
| shadcn/ui | Component library (Radix UI) |
| Zustand | Global state |
| TanStack React Query | Server state / data fetching |
| Supabase (@supabase/supabase-js) | Auth + Database |
| Recharts | Charts |
| Lucide React | Icons |
| ethers.js | Web3 / Ethereum |

## Cấu trúc thư mục

```
frontend/src/
├── app/                        # Next.js App Router
│   ├── (app)/                 # Protected routes (có auth guard)
│   │   ├── dashboard/
│   │   ├── markets/
│   │   ├── ai-predict/
│   │   ├── web3/
│   │   └── news/
│   ├── (auth)/                # Auth routes (public)
│   │   ├── login/
│   │   └── register/
│   ├── auth/callback/         # OAuth callback handler
│   └── api/                   # API routes (Next.js API)
│       └── auth/set-cookies/  # Set auth cookies cho middleware
│
├── components/
│   ├── features/              # Business components
│   │   ├── StockTable.tsx
│   │   ├── StockChart.tsx
│   │   ├── PredictionChart.tsx
│   │   └── ...
│   ├── layout/               # Layout components
│   │   ├── AppLayout.tsx
│   │   ├── TopBar.tsx
│   │   └── Sidebar.tsx
│   └── ui/                   # shadcn/ui base components
│
├── lib/
│   ├── supabase.ts           # Supabase browser client
│   ├── auth-server.ts        # Supabase server utilities
│   ├── auth-cookies.ts       # Client-side cookie helpers
│   ├── api-client.ts         # Backend API client
│   ├── hooks.ts              # Custom React hooks
│   └── types.ts              # TypeScript types
│
└── middleware.ts             # Auth guard (cookie-based)
```

## Auth Flow

1. User đăng nhập bằng **Google OAuth** hoặc **Email/Password** qua Supabase Auth
2. Supabase trả về session (access token + refresh token)
3. Callback page (`/auth/callback`) lưu token vào:
   - `localStorage` — cho client-side API calls
   - Cookie `velo_token` (non-httpOnly) — cho middleware đọc
   - Cookie `sb-access-token` (httpOnly) — qua `/api/auth/set-cookies`
4. **Middleware** kiểm tra cookie `velo_token` / `sb-access-token` để guard các protected routes

## API Endpoints

Frontend gọi backend tại `http://localhost:5000`:

| Method | Endpoint | Mô tả |
|--------|---------|--------|
| GET | `/api/stocks` | Danh sách chứng khoán |
| GET | `/api/stocks/{symbol}` | Chi tiết 1 mã |
| GET | `/api/stocks/{symbol}/history` | Lịch sử giá |
| GET | `/api/stocks/search?q=` | Tìm kiếm mã |
| GET | `/api/predictions/{symbol}` | Dự đoán AI 7 ngày |
| GET | `/api/news` | Tin tức |
| GET | `/api/memecoins` | Danh sách memecoin |

## Cài đặt

```bash
npm install
npm run dev
```

## Biến môi trường

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Commands

```bash
npm run dev      # Dev server với Turbopack
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
```

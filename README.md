# Velo — Nền tảng AI Stock & Crypto Intelligence

> Đồ án môn Lập trình Web | Nhóm 2–3 người | MVP deploy

## Tổng quan

Velo là nền tảng theo dõi chứng khoán và tiền mã hoá tích hợp AI, cung cấp dữ liệu thị trường thời gian thực, dự đoán giá bằng mô hình LSTM/Prophet, theo dõi ví Web3, và tin tức AI/Tech tổng hợp.

## Tech Stack

| Tầng | Công nghệ |
|------|-----------|
| Frontend | Next.js 16 + TailwindCSS v4 + shadcn/ui + Zustand + React Query |
| Backend | ASP.NET Core 10 + Clean Architecture |
| Database | Supabase (PostgreSQL) |
| Cache | Redis |
| Auth | Supabase Auth (Google OAuth + Email/Password) |
| AI/ML | LSTM + Prophet (tích hợp trong Backend) |
| Web3 | ethers.js + MetaMask |
| Realtime | Supabase Realtime |
| Deploy | Vercel (Frontend) + Railway (Backend) |

## Các module chính

- **Theo dõi chứng khoán** — Giá realtime VN (HOSE/HNX) & US (NYSE/NASDAQ)
- **AI Dự đoán** — Dự báo giá 7 ngày bằng LSTM + Prophet
- **Ví Web3** — Tích hợp MetaMask + số dư ETH/ERC20
- **Memecoin Tracker** — Giá memecoin qua CoinGecko
- **Tin tức AI** — Tin tức AI & tech tổng hợp qua RSS

## Cấu trúc dự án

```
Velo-Tradefi-app/
├── frontend/                 # Next.js 16 App Router (frontend)
│   └── src/
│       ├── app/             # App Router pages & API routes
│       ├── components/      # UI components (shadcn/ui + custom)
│       ├── lib/             # API client, Supabase, utilities
│       └── middleware.ts     # Auth guard cho protected routes
│
├── backend/                  # ASP.NET Core 10 (API)
│   └── src/
│       ├── FinAI.Api/       # Controllers & Program.cs
│       ├── FinAI.Core/      # Entities, DTOs, Interfaces
│       └── FinAI.Infrastructure/  # Services (Stock, AI, Web3...)
│
├── .env.example             # Template biến môi trường
└── README.md
```

## Hướng dẫn cài đặt nhanh

### 1. Cài đặt dependencies

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && dotnet restore
```

### 2. Cấu hình biến môi trường

```bash
cp .env.example .env
```

Điền các giá trị cần thiết:
- `NEXT_PUBLIC_SUPABASE_URL` — URL Supabase project
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `NEXT_PUBLIC_API_URL=http://localhost:5000` — Backend URL (local)

### 3. Chạy development

```bash
# Terminal 1 — Frontend (port 3000)
cd frontend && npm run dev

# Terminal 2 — Backend (port 5000)
cd backend && dotnet run --project src/FinAI.Api
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## Thiết lập Supabase Auth (Google OAuth)

Xem chi tiết trong `GOOGLE_OAUTH_SETUP.md`.

Tóm tắt:
1. Tạo project Supabase → bật **Email/Password** và **Google** provider
2. Cấu hình Google Cloud Console → tạo OAuth 2.0 Client ID
3. Thêm redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Copy credentials vào `.env`

## Thiết kế (Design System)

**"Kinetic Precision"** — Dark theme với accent màu lime.

| Màu | Hex |
|-----|-----|
| Lime | `#A3E635` |
| Red | `#F05252` |
| Indigo | `#6366F1` |
| Purple | `#8B5CF6` |
| Amber | `#F59E0B` |

Xem chi tiết trong `FinAI_Project_Plan.md`.

## Scripts hữu ích

```bash
# Frontend
cd frontend
npm run dev        # Dev server
npm run build      # Production build
npm run lint       # ESLint

# Backend
cd backend
dotnet run --project src/FinAI.Api
dotnet build
```

## License

MIT — Đồ án môn Lập trình Web

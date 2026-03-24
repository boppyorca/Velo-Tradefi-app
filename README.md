# Velo — Nền tảng AI Stock & Crypto Intelligence

> Đồ án môn Lập trình Web | Nhóm 2–3 người | 8 tuần | MVP deploy

## Tổng quan

Velo là nền tảng theo dõi chứng khoán và tiền mã hoá tích hợp AI, cung cấp dữ liệu thị trường thời gian thực, dự đoán giá bằng mô hình LSTM/Prophet, theo dõi ví Web3, và tin tức AI/Tech tổng hợp.

## Tech Stack

| Tầng | Công nghệ |
|------|-----------|
| Frontend | Next.js 16 + TailwindCSS v4 + shadcn/ui + Zustand + React Query |
| Backend | ASP.NET Core 8 + Clean Architecture |
| AI/ML | Python FastAPI + Random Forest (Scikit-Learn) |
| Database | Supabase (PostgreSQL) |
| Cache | Redis |
| Auth | Supabase Auth (Google OAuth + Email/Password) |
| Web3 | ethers.js + MetaMask |
| Realtime | SignalR |
| Deploy | Vercel (Frontend) + Railway (Backend) + Supabase Cloud |

## Các module chính

- **Theo dõi chứng khoán** — Giá realtime VN (HOSE/HNX) & US (NYSE/NASDAQ), cập nhật mỗi 30s qua SignalR
- **AI Dự đoán** — Dự báo giá 7 ngày bằng Random Forest (VN: Yahoo Finance, US: Alpha Vantage)
- **Ví Web3** — Tích hợp MetaMask + số dư ETH/ERC20 + signature verification
- **Memecoin Tracker** — Giá memecoin qua CoinGecko (20+ coins)
- **Tin tức AI** — Tin tức AI & tech tổng hợp qua Hacker News API
- **Watchlist** — Danh sách theo dõi cá nhân cho cổ phiếu và memecoin

## Cấu trúc dự án

```
Velo-Tradefi-app/
├── frontend/                          # Next.js 16 App Router
│   └── src/
│       ├── app/                      # Pages
│       │   ├── (app)/               # Protected routes (dashboard, markets, ai-predict, web3, news, settings)
│       │   ├── (auth)/             # Auth routes (login, register)
│       │   └── api/                # API routes
│       ├── components/
│       │   ├── features/           # Custom components (StockCard, MemecoinCard, WatchlistSection...)
│       │   ├── layout/             # Layout components (Sidebar, TopBar, AppLayout...)
│       │   └── ui/                # shadcn/ui components
│       └── lib/                    # Utilities (api-client, supabase, hooks, stores...)
│
├── backend/                           # ASP.NET Core 8 API
│   ├── src/
│   │   ├── FinAI.Api/              # API Layer
│   │   │   ├── Controllers/        # 7 controllers (Auth, Stocks, Predictions, Memecoins, News, Web3, Watchlist)
│   │   │   ├── Hubs/              # SignalR Hubs (StockPriceHub)
│   │   │   └── Services/          # SignalR Broadcaster
│   │   ├── FinAI.Core/            # Domain Layer
│   │   │   ├── Entities/         # User, StockWatchlist, MemecoinWatchlist, PredictionHistory
│   │   │   ├── Interfaces/       # Service & Repository interfaces
│   │   │   └── Models/          # DTOs
│   │   └── FinAI.Infrastructure/   # Infrastructure Layer
│   │       ├── Data/             # AppDbContext, Repositories
│   │       └── Services/         # StockService, PredictionService, Web3Service, RedisCacheService...
│   ├── migrations/                  # SQL migrations
│   └── Dockerfile                  # Multi-stage Docker build
│
├── ml-service/                        # Python FastAPI ML Service (Random Forest)
│   ├── main.py                      # FastAPI app entry point (v2.1.0)
│   ├── Dockerfile                    # Python Docker build
│   └── requirements.txt             # Dependencies (FastAPI, scikit-learn, prophet)
│
├── docker-compose.yml                # Local development stack
├── FinAI_Project_Plan.md             # Chi tiết kỹ thuật
└── README.md                         # This file
```

## API Endpoints

### Authentication
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| POST | `/api/auth/register` | Đăng ký tài khoản mới |
| POST | `/api/auth/login` | Đăng nhập |
| POST | `/api/auth/google` | Đăng nhập Google OAuth |

### Stocks
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/stocks` | Danh sách cổ phiếu (phân trang, lọc theo sàn) |
| GET | `/api/stocks/{symbol}` | Chi tiết 1 cổ phiếu |
| GET | `/api/stocks/{symbol}/history` | Lịch sử giá (1D/1W/1M/3M/1Y) |
| GET | `/api/stocks/search?q=` | Tìm kiếm cổ phiếu |

### Predictions
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/predictions/{symbol}` | Dự đoán giá (Random Forest + SMA/RSI features) |
| GET | `/api/predictions/{symbol}/latest` | Dự đoán mới nhất (từ cache) |
| GET | `/api/predictions/{symbol}/history` | Lịch sử dự đoán |

### Memecoins
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/memecoins` | Danh sách memecoin trending |
| GET | `/api/memecoins/prices?ids=` | Giá theo IDs |

### Web3
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/web3/balance/{address}` | Số dư ví ETH |
| GET | `/api/web3/challenge` | Lấy challenge message |
| POST | `/api/web3/connect` | Kết nối ví (có signature verification) |

### Watchlist
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/watchlist` | Danh sách đang theo dõi |
| POST | `/api/watchlist` | Thêm vào watchlist |
| DELETE | `/api/watchlist/{symbol}` | Xoá khỏi watchlist |

### News
| Method | Endpoint | Mô tả |
|--------|----------|--------|
| GET | `/api/news` | Tin tức AI/Tech |

### Realtime
| Endpoint | Mô tả |
|----------|--------|
| `/hubs/stock-price` | SignalR hub cho realtime stock updates |

## Hướng dẫn cài đặt

### Docker Compose (Khuyến nghị)

```bash
# Copy và chỉnh sửa .env
cp .env.example .env

# Backend only (ML service chạy riêng)
cd backend && dotnet run --project src/FinAI.Api

# Hoặc tất cả services (cần Redis local)
docker-compose up backend ml-service redis postgres

# ML Service chạy riêng (khuyến nghị)
cd ml-service && python3 main.py

# Services sẽ chạy:
# - Backend: http://localhost:5001
# - ML Service: http://localhost:8000
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
# - Frontend: chạy riêng `cd frontend && npm run dev`
```

### Manual Setup

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && dotnet restore && dotnet run --project src/FinAI.Api

# ML Service
cd ml-service && pip install -r requirements.txt && uvicorn main:app --reload
```

## Biến môi trường cần thiết

```env
# Supabase
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/velotradefi
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET_KEY=your-secret-key-min-32-chars

# ML Service
PYTHON_AI_SERVICE_URL=http://localhost:8000

# Frontend
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
```

## Roadmap - Trạng thái hoàn thành

> Cập nhật: 2026-03-24 | Worktree: `fvo`

### ✅ Đã hoàn thành

| Module | Trạng thái | Chi tiết |
|--------|-------------|----------|
| **Backend API** | ✅ Hoàn thành | 7 controllers, 12 services |
| **Frontend Pages** | ✅ Hoàn thành | Dashboard, Markets, AI Predict, Web3, News, Settings |
| **Auth** | ✅ Hoàn thành | Email/password + Google OAuth (Supabase) |
| **Stock Tracking** | ✅ Hoàn thành | VN (HOSE/HNX) + US (NASDAQ/NYSE), cascading data provider |
| **Cascading Data Provider** | ✅ Hoàn thành | Finnhub → iTick → AlphaVantage → Yahoo Finance → Mock |
| **Stock History** | ✅ Hoàn thành | `/api/stocks/{symbol}/history` — 6 timeframes (1D/1W/1M/3M/1Y/ALL) |
| **Memecoin Tracking** | ✅ Hoàn thành | 20+ memecoins qua CoinGecko |
| **News Feed** | ✅ Hoàn thành | Hacker News API |
| **Watchlist** | ✅ Hoàn thành | Backend + Frontend |
| **Web3 Wallet** | ✅ Hoàn thành | MetaMask connect + balance + signature verification |
| **SignalR Hub** | ✅ Hoàn thành | StockPriceHub + Frontend `useStockSignalR` hook |
| **Frontend Realtime** | ✅ Hoàn thành | Live badge, React Query cache merge, auto-reconnect |
| **Background Polling** | ✅ Hoàn thành | `StockPollingBackgroundService` — poll mỗi 30s, broadcast SignalR |
| **Redis Cache** | ✅ Hoàn thành | Graceful degradation khi Redis offline |
| **ML Service** | ✅ Hoàn thành | FastAPI + Random Forest, multi-source (Yahoo Finance VN + Alpha Vantage US) |
| **AI Prediction Endpoint** | ✅ Hoàn thành | `/api/predictions/{symbol}` gọi ML service thật |
| **VN Stocks Price (ML)** | ✅ Hoàn thành | Yahoo Finance `.VN` suffix — VNM: 60,800 VND ✅ |
| **Docker Support** | ✅ Hoàn thành | Backend Dockerfile + docker-compose.yml (backend + ml + postgres + redis) |
| **Worktree Development** | ✅ Hoàn thành | Isolated worktree `fvo`, env config riêng |
| **Supabase Integration** | ✅ Hoàn thành | Auth + Database + RLS policies |

### ❌ Chưa hoàn thành

| Module | Độ ưu tiên | Chi tiết |
|--------|-------------|----------|
| **Production Deploy** | 🔴 Cao | Railway (backend + ml-service) + Vercel (frontend) |
| **CI/CD Pipeline** | 🟡 Vừa | Chưa có GitHub Actions workflow |
| **Frontend Dockerfile** | 🟡 Vừa | docker-compose.yml có comment nhưng chưa tạo `frontend/Dockerfile` |
| **Redis Production** | 🟡 Vừa | Hiện dùng placeholder URL — cần setup Redis thật (Railway Redis hoặc Upstash) |
| **Unit/Integration Tests** | 🟢 Thấp | Chưa có test coverage |
| **Train thêm LSTM cho VN stocks** | 🟡 Vừa | Yahoo Finance rate-limit — cần train VNM, FPT, TCB... khi quota hết |
| **VN Stocks Yahoo Finance Edge Cases** | 🟢 Thấp | Một số ticker VN có thể confused với cổ phiếu cùng mã thị trường khác |

### ✅ Mới hoàn thành

| Module | Chi tiết |
|--------|----------|
| **LSTM Real Model** | Train LSTM 2-layer (64→32 units) + Dropout(0.2) + Dense(16→1). Data: Alpha Vantage. Trained: AAPL (MAPE 1.01%), TSLA (MAPE 2.45%). Files: `models/lstm_AAPL.keras`, `models/lstm_TSLA.keras` |
| **LSTM Training Pipeline** | `train_lstm.py` — auto-download data → feature engineer → train → eval → save. Supports all US/VN stocks |
| **LSTM Inference** | `lstm_inference.py` — standalone inference script. `main.py` v2.2.0 tích hợp: auto (LSTM→RF fallback), `?model=lstm`, `?model=random_forest` |
| **Dual Model System** | Priority: trained LSTM → Random Forest online. Cache LSTM models in memory after first load |

### 🗺️ Kiến trúc đã xác lập

```
Browser (Next.js)
│
├── /dashboard, /markets/* ──────────→ Backend (ASP.NET Core :5001)
│   │                                      │
│   │   SignalR ◄──┐                      │
│   │              │  broadcast             │
│   │         StockPollingBackgroundService
│   │              │  (every 30s)         │
│   └── React Query ───┘                   │
│                                          │
│   /api/predictions/{symbol} ──────────→ ML Service (FastAPI :8000)
│                                          │   ├── Yahoo Finance (VN stocks)
│                                          │   └── Alpha Vantage (US stocks)
│
├── /web3 ────────────────────────────────→ Backend → Ethereum RPC
└── /news ────────────────────────────────→ Backend → Hacker News API
```

### 📦 Services đang chạy local

| Service | URL | Port | Status |
|---------|-----|------|--------|
| Frontend (Next.js) | http://localhost:3000 | 3000 | ✅ Running |
| Backend (ASP.NET) | http://localhost:5001 | 5001 | ✅ Running |
| ML Service (FastAPI) | http://localhost:8000 | 8000 | ✅ Running |
| PostgreSQL (Supabase Cloud) | db.shloeixwkwzyxwwzmkmh.supabase.co | 5432 | ✅ Connected |
| Redis | — | 6379 | ⚠️ Offline (graceful degradation active) |

## Thiết kế (Design System)

**"Kinetic Precision"** — Dark theme với accent màu lime.

| Màu | Hex | Sử dụng |
|-----|-----|---------|
| Lime | `#A3E635` | Primary accent, success indicators |
| Red | `#F05252` | Negative changes, errors |
| Indigo | `#6366F1` | Links, secondary actions |
| Purple | `#8B5CF6` | AI/Prediction features |
| Amber | `#F59E0B` | Warnings, highlights |

## License

MIT — Đồ án môn Lập trình Web

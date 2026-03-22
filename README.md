# Velo — Nền tảng AI Stock & Crypto Intelligence

> Đồ án môn Lập trình Web | Nhóm 2–3 người | 8 tuần | MVP deploy

## Tổng quan

Velo là nền tảng theo dõi chứng khoán và tiền mã hoá tích hợp AI, cung cấp dữ liệu thị trường thời gian thực, dự đoán giá bằng mô hình LSTM/Prophet, theo dõi ví Web3, và tin tức AI/Tech tổng hợp.

## Tech Stack

| Tầng | Công nghệ |
|------|-----------|
| Frontend | Next.js 16 + TailwindCSS v4 + shadcn/ui + Zustand + React Query |
| Backend | ASP.NET Core 8 + Clean Architecture |
| AI/ML | Python FastAPI + LSTM + Prophet |
| Database | Supabase (PostgreSQL) |
| Cache | Redis |
| Auth | Supabase Auth (Google OAuth + Email/Password) |
| Web3 | ethers.js + MetaMask |
| Realtime | SignalR |
| Deploy | Vercel (Frontend) + Railway (Backend) + Supabase Cloud |

## Các module chính

- **Theo dõi chứng khoán** — Giá realtime VN (HOSE/HNX) & US (NYSE/NASDAQ)
- **AI Dự đoán** — Dự báo giá 7 ngày bằng LSTM + Prophet
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
├── ml-service/                        # Python FastAPI ML Service
│   ├── main.py                      # FastAPI app entry point
│   ├── Dockerfile                    # Python Docker build
│   └── requirements.txt             # Dependencies
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
| GET | `/api/predictions/{symbol}` | Dự đoán giá (LSTM/Prophet) |
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

# Khởi động tất cả services
docker-compose up

# Services sẽ chạy:
# - Frontend: http://localhost:3000
# - Backend: http://localhost:5000
# - ML Service: http://localhost:8000
# - PostgreSQL: localhost:5432
# - Redis: localhost:6379
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

### ✅ Đã hoàn thành

| Module | Trạng thái | Chi tiết |
|--------|-------------|----------|
| **Backend API** | ✅ Hoàn thành | 7 controllers, 12 services |
| **Frontend Pages** | ✅ Hoàn thành | Dashboard, Markets, AI Predict, Web3, News, Settings |
| **Auth** | ✅ Hoàn thành | Email/password + Google OAuth |
| **Stock Tracking** | ✅ Hoàn thành | VN (HOSE) + US (NASDAQ/NYSE) |
| **Memecoin Tracking** | ✅ Hoàn thành | 20+ memecoins qua CoinGecko |
| **News Feed** | ✅ Hoàn thành | Hacker News API |
| **Watchlist** | ✅ Hoàn thành | Backend + Frontend |
| **Web3 Wallet** | ✅ Hoàn thành | MetaMask connect + balance + signature verification |
| **SignalR Hub** | ✅ Hoàn thành | StockPriceHub cho realtime |
| **Redis Cache** | ✅ Hoàn thành | TTL caching (VN:15m, memecoin:30s, prediction:1h) |
| **Docker Support** | ✅ Hoàn thành | Backend Dockerfile + docker-compose.yml |
| **SQL Migration** | ✅ Hoàn thành | Supabase schema với RLS |

### ❌ Chưa hoàn thành

| Module | Độ ưu tiên | Chi tiết |
|--------|-------------|----------|
| **AI/ML Service** | 🔴 Cao | Train LSTM model thực sự, hiện chỉ có heuristic fallback |
| **ML Model Files** | 🔴 Cao | Chưa có `.h5` files cho LSTM, chưa train thực |
| **Frontend SignalR** | 🟡 Vừa | Chưa kết nối frontend với SignalR hub |
| **Background Stock Polling** | 🟡 Vừa | Chưa implement polling service để broadcast updates |
| **Production Deploy** | 🟡 Vừa | Chưa deploy lên Railway/Vercel |
| **CI/CD Pipeline** | 🟢 Thấp | Chưa có GitHub Actions workflow |
| **Testing** | 🟢 Thấp | Chưa có unit/integration tests |

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

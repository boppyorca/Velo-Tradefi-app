# Backend — Velo TradeFi API

ASP.NET Core 10 + Clean Architecture.

## Tech Stack

| Thư viện | Mục đích |
|---------|---------|
| ASP.NET Core 10 | Web framework |
| Entity Framework Core | ORM (InMemory / PostgreSQL) |
| System.Text.Json | JSON serialization |
| JWT Bearer Auth | API authentication |
| HttpClient | Gọi Yahoo Finance, CoinGecko |

## Clean Architecture

```
backend/src/
├── FinAI.Api/
│   ├── Controllers/         # API endpoints
│   └── Program.cs           # Entry point, DI, middleware
│
├── FinAI.Core/
│   ├── Entities/            # Domain entities (User, Stock, Prediction...)
│   ├── Models/              # DTOs (StockDto, PredictionDto...)
│   └── Interfaces/          # Service interfaces
│
└── FinAI.Infrastructure/
    ├── Data/               # EF Core DbContext
    ├── Services/           # Business logic implementations
    │   ├── StockService.cs      # Yahoo Finance + fallback
    │   ├── PredictionService.cs   # LSTM + Prophet mock
    │   ├── MemecoinService.cs    # CoinGecko
    │   ├── NewsService.cs       # RSS mock
    │   └── Web3Service.cs       # Ethereum
    └── Services/
```

## API Endpoints

### Auth
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| POST | `/api/auth/register` | Không | Đăng ký user |
| POST | `/api/auth/login` | Không | Đăng nhập, trả JWT |
| GET | `/api/auth/me` | Có | Lấy thông tin user hiện tại |

### Stocks
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/api/stocks` | Không | Danh sách chứng khoán |
| GET | `/api/stocks/{symbol}` | Không | Chi tiết 1 mã |
| GET | `/api/stocks/{symbol}/history` | Không | Lịch sử giá |
| GET | `/api/stocks/search?q=` | Không | Tìm kiếm mã |

### AI Predictions
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/api/predictions/{symbol}` | Không | Dự báo 7 ngày |
| GET | `/api/predictions/{symbol}/history` | Có | Lịch sử predictions |

### Memecoins
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/api/memecoins` | Không | Danh sách memecoin |
| GET | `/api/memecoins/prices?ids=` | Không | Giá memecoin cụ thể |

### News
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| GET | `/api/news` | Không | Danh sách tin tức (phân trang) |

### Web3
| Method | Endpoint | Auth | Mô tả |
|--------|----------|------|--------|
| POST | `/api/web3/connect` | Có | Kết nối ví MetaMask |
| GET | `/api/web3/balance/{address}` | Không | Số dư ETH |

## Cài đặt

```bash
cd backend
dotnet restore
dotnet run --project src/FinAI.Api
```

API chạy tại `http://localhost:5000`. Swagger UI tại `http://localhost:5000/swagger`.

## Biến môi trường

```bash
DATABASE_URL=postgresql://user:password@host:5432/finai
REDIS_URL=redis://host:6379
JWT_SECRET_KEY=your-super-secret-key-min-32-chars
FRONTEND_URL=http://localhost:3000
```

> **Lưu ý:** Ở chế độ development, database mặc định dùng **InMemory** (không cần PostgreSQL).

## Stock Service

`StockService` lấy dữ liệu từ **Yahoo Finance**:

- US stocks: `AAPL`, `NVDA`, `TSLA`, `MSFT`, `AMZN`, `META`, `GOOGL`, ...
- VN stocks: `VNM`, `VIC`, `HPG`, `FPT`, `TCB`, `MBB`, ...

Nếu Yahoo Finance trả lỗi → fallback sang dữ liệu mock hardcoded.

## JWT Authentication

Backend hỗ trợ 2 chế độ (tự động nhận biết qua biến môi trường):

1. **Supabase Auth JWT** — Khi có `SUPABASE_URL`:
   - Validate token bằng Supabase anon key
   - Dùng cho production

2. **Custom JWT** (Development) — Khi không có `SUPABASE_URL`:
   - Dùng `JWT_SECRET_KEY` để sign/verify
   - Cho local development

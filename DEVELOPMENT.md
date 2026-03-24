# Hướng Dẫn Phát Triển Dự Án VeloTradeFi

## Mục Lục
- [Tổng Quan Tech Stack](#tổng-quan-tech-stack)
- [Kiến Trúc Hệ Thống](#kiến-trúc-hệ-thống)
- [Development Workflow](#development-workflow)
- [Hướng Dẫn Setup](#hướng-dẫn-setup)
- [Chạy Services](#chạy-services)
- [Testing](#testing)
- [Deployment](#deployment)

---

## Tổng Quan Tech Stack

### 1. Frontend (Next.js 16 + React 19)

| Công nghệ | Phiên bản | Công dụng |
|-----------|-----------|-----------|
| **Next.js** | 16.2.0 | React framework với App Router, Server Components, và API Routes |
| **React** | 19.2.4 | Thư viện UI với hooks và concurrent features |
| **TypeScript** | 5.x | Type-safe development |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **shadcn/ui** | 4.1.0 | Component library dựa trên Radix UI |
| **Zustand** | 5.0.12 | Lightweight state management |
| **TanStack Query** | 5.91.3 | Data fetching và caching |
| **Recharts** | 3.8.0 | Data visualization charts |
| **SignalR Client** | 10.0.0 | Real-time communication với backend |
| **Ethers.js** | 6.16.0 | Ethereum blockchain interaction |
| **Supabase Client** | 2.99.3 | Backend-as-a-service (auth, database) |

**Công dụng chính:**
- Giao diện người dùng cho dashboard tài chính
- Real-time stock price updates qua SignalR
- Web3 wallet integration
- Authentication với Supabase

---

### 2. Backend (ASP.NET Core 10)

| Công nghệ | Phiên bản | Công dụng |
|-----------|-----------|-----------|
| **ASP.NET Core** | 10.0 | Web API framework |
| **Entity Framework Core** | 10.0 | ORM cho PostgreSQL |
| **SignalR** | (built-in) | Real-time hub cho stock prices |
| **JWT Authentication** | 10.0 | Token-based authentication |
| **Polly** | 8.5.0 | Resilience patterns (retry, circuit breaker) |
| **Redis Cache** | 10.0 | Distributed caching với StackExchange.Redis |
| **BCrypt** | 4.0.3 | Password hashing |
| **Swashbuckle** | 10.1.5 | OpenAPI/Swagger documentation |

**Công dụng chính:**
- RESTful API endpoints
- Real-time SignalR hub cho stock prices
- JWT authentication & authorization
- Redis caching cho performance
- Integration với ML service

---

### 3. ML Service (Python FastAPI)

| Công nghệ | Phiên bản | Công dụng |
|-----------|-----------|-----------|
| **FastAPI** | 0.115.0 | Modern Python web framework |
| **Uvicorn** | 0.30.6 | ASGI server |
| **TensorFlow** | 2.16.2 | Deep learning (LSTM models) |
| **NumPy** | 1.26.4 | Numerical computations |
| **Pandas** | 2.2.3 | Data manipulation |
| **Scikit-learn** | 1.5.2 | Machine learning utilities |
| **Prophet** | 1.1.5 | Time series forecasting |

**Công dụng chính:**
- Stock price prediction sử dụng LSTM models
- Model inference API
- Time series analysis

---

### 4. Infrastructure

| Công nghệ | Công dụng |
|-----------|-----------|
| **PostgreSQL 16** | Primary database (Supabase hosted) |
| **Redis 7** | Cache layer, session storage |
| **Docker** | Containerization |
| **GitHub Actions** | CI/CD pipelines |
| **Railway** | Cloud deployment |
| **Vercel** | Frontend hosting |

---

## Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Next.js Frontend                       │   │
│  │  - Dashboard      - Markets Page     - Web3 Wallet      │   │
│  └────────────────────────┬─────────────────────────────────┘   │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTP/WS
┌───────────────────────────▼─────────────────────────────────────┐
│                      BACKEND LAYER (BFF)                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │               Next.js API Routes (BFF)                   │   │
│  │           Proxy requests to Backend + SignalR            │   │
│  └────────┬─────────────────────────────────┬───────────────┘   │
└───────────┼─────────────────────────────────┼───────────────────┘
            │ HTTP/REST              │ SignalR/WebSocket
┌───────────▼───────────────┐ ┌──────▼────────────────────────┐
│    Backend (ASP.NET)      │ │   Real-time Updates           │
│  ┌─────────────────────┐  │ │  ┌──────────────────────┐    │
│  │  REST API           │  │ │  │  SignalR Hub         │    │
│  │  - /api/stocks      │  │ │  │  StockPriceHub       │    │
│  │  - /api/auth        │  │ │  └──────────┬───────────┘    │
│  │  - /api/portfolio   │  │ │             │                │
│  └──────────┬──────────┘  │ │             ▼                │
│             │             │ │  ┌──────────────────────┐    │
│  ┌──────────▼──────────┐  │ │  │  Frontend (Subscribed)│    │
│  │  Services          │  │ └──┤                       │────┘
│  │  - StockService     │  │    └──────────────────────┘
│  │  - RedisCache       │  │
│  │  - AuthService      │  │
│  └──────────┬──────────┘  │
└─────────────┼─────────────┘
              │
    ┌─────────┼─────────┬──────────────┐
    │         │         │              │
    ▼         ▼         ▼              ▼
┌───────┐ ┌───────┐ ┌────────┐  ┌──────────────┐
│  DB   │ │ Redis │ │  ML    │  │  External    │
│(PG)   │ │ Cache │ │Service │  │  - CoinGecko │
└───────┘ └───────┘ │(Python)│  │  - Web3 APIs │
                    └────┬───┘  └──────────────┘
                         │
                    ┌────▼────┐
                    │ LSTM    │
                    │ Models  │
                    └─────────┘
```

---

## Development Workflow

### 1. Git Workflow (GitFlow)

```
main (production)
  └── develop (development)
        ├── feature/TICKET-description
        ├── feature/TICKET-description
        └── release/x.x.x
```

**Quy tắc:**
- Checkout từ `develop` để tạo feature branch
- Commit message theo conventional commits: `feat|fix|docs|style|refactor|test|chore: description`
- Tạo Pull Request khi hoàn thành
- Review trước khi merge vào `develop`

### 2. Development Cycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   PLAN      │───▶│   CODE      │───▶│   TEST      │───▶│   REVIEW    │
│             │    │             │    │             │    │             │
│ - Analysis  │    │ - Feature   │    │ - Unit test │    │ - Code      │
│ - Design    │    │ - Refactor  │    │ - Integration│    │   review   │
│ - TDD       │    │ - Document  │    │ - E2E test  │    │ - QA       │
└─────────────┘    └─────────────┘    └─────────────┘    └──────┬──────┘
                                                                   │
┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │
│   DEPLOY    │◀───│   MERGE     │◀───│   FIX       │◀────────────┘
│             │    │             │    │             │
│ - Staging   │    │ - Squash    │    │ - Address   │
│ - Production│    │ - Fast-forward│  │   feedback  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 3. Code Standards

**Frontend:**
- ESLint + TypeScript strict mode
- Prettier formatting
- Vitest cho unit tests
- React Testing Library cho component tests

**Backend:**
- C# 12+ features
- nullable reference types enabled
- xUnit cho tests
- Swagger documentation

**ML Service:**
- PEP 8 style guide
- pytest cho tests
- Type hints cho documentation

---

## Hướng Dẫn Setup

### Yêu Cầu Hệ Thống

| Tool | Phiên bản tối thiểu |
|------|---------------------|
| Node.js | 20.x LTS |
| .NET SDK | 10.0 |
| Python | 3.10+ |
| Docker | 24.x |
| Git | 2.40+ |

### Bước 1: Clone Repository

```bash
git clone https://github.com/your-org/Velo-Tradefi-app.git
cd Velo-Tradefi-app
```

### Bước 2: Setup Environment Variables

```bash
# Copy example env files
cp .env.example .env.local

# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.production.example frontend/.env.production
```

**Các biến môi trường quan trọng:**

| Biến | Mô tả | Giá trị mẫu |
|------|-------|-------------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbG...` |
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:5000` |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL | `ws://localhost:8080` |
| `ConnectionStrings__DefaultConnection` | PostgreSQL connection | Connection string |
| `Redis__ConnectionString` | Redis connection | `localhost:6379` |
| `Jwt__SecretKey` | JWT signing key (32+ chars) | `your-secret-key` |

### Bước 3: Cài Đặt Frontend Dependencies

```bash
cd frontend

# Install dependencies
npm install

# Setup shadcn/ui (nếu cần)
npx shadcn@latest init
```

### Bước 4: Cài Đặt Backend Dependencies

```bash
cd backend

# Restore .NET packages
dotnet restore

# Build solution
dotnet build
```

### Bước 5: Cài Đặt ML Service Dependencies

```bash
cd ml-service

# Tạo virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# hoặc: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

### Bước 6: Setup Database

**Sử dụng Supabase (Cloud):**
1. Tạo project tại https://supabase.com
2. Lấy connection string từ Settings > Database
3. Cập nhật `ConnectionStrings__DefaultConnection` trong `.env`

**Sử dụng Local PostgreSQL:**
```bash
# Run migrations
cd backend
dotnet ef database update
```

---

## Chạy Services

### Option 1: Docker Compose (Khuyến nghị cho Development)

```bash
# Build và chạy tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Services sẽ chạy tại:**
| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| ML Service | http://localhost:8000 |
| Redis | localhost:6379 |
| PostgreSQL | localhost:5432 |

### Option 2: Chạy Riêng Từng Service

**Frontend:**
```bash
cd frontend
npm run dev
# http://localhost:3000
```

**Backend:**
```bash
cd backend/src/FinAI.Api
dotnet run
# http://localhost:5000
```

**ML Service:**
```bash
cd ml-service
source venv/bin/activate
uvicorn main:app --reload --port 8000
# http://localhost:8000
```

**Redis (nếu không dùng Docker):**
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis
```

### Option 3: Chạy Backend + ML riêng, Frontend bằng Vercel

```bash
# Backend
cd backend && dotnet run

# ML Service (terminal khác)
cd ml-service && uvicorn main:app --reload

# Frontend (Vercel)
cd frontend && vercel dev
```

---

## Testing

### Frontend Tests

```bash
cd frontend

# Chạy tất cả tests
npm test

# Chạy tests một lần (CI mode)
npm run test:run

# Coverage report
npm run test:coverage

# Vitest UI
npm test -- --ui
```

### Backend Tests

```bash
cd backend

# Chạy tất cả tests
dotnet test

# Chạy với coverage
dotnet test --collect:"XPlat Code Coverage"

# Chạy specific test project
dotnet test tests/FinAI.Api.Tests
```

### ML Service Tests

```bash
cd ml-service

# Chạy tests
pytest

# Verbose output
pytest -v

# Specific test file
pytest tests/test_ml_service.py -v
```

### Integration Tests

```bash
# Chạy Docker Compose với test environment
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
# ...
```

---

## Deployment

### 1. Frontend (Vercel)

```bash
cd frontend

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

**Environment Variables cần setup trên Vercel:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SIGNALR_URL`

### 2. Backend (Railway)

```bash
# Sử dụng railway CLI
railway login
railway init
railway up

# Hoặc connect GitHub repo trên railway.app
```

**Required Environment Variables:**
- `ConnectionStrings__DefaultConnection`
- `Redis__ConnectionString`
- `Jwt__SecretKey`
- `AllowedOrigins__0`
- `PYTHON_AI_SERVICE_URL`

### 3. ML Service (Railway)

```bash
cd ml-service
railway up
```

### 4. CI/CD Pipeline

**GitHub Actions workflow** đã được setup tự động:

```
Push to develop ──▶ CI Pipeline ──▶ Deploy to Staging
     │
     ▼
Push to main ──▶ CI Pipeline ──▶ Deploy to Production
```

**CI Pipeline checks:**
- Frontend: `npm run build && npm run test:run`
- Backend: `dotnet build && dotnet test`
- ML Service: `pytest`

---

## Troubleshooting

### Lỗi Thường Gặp

**1. CORS Error khi gọi API**
```
Kiểm tra AllowedOrigins trong backend appsettings.json
Đảm bảo frontend URL đúng format: http://localhost:3000
```

**2. Redis Connection Failed**
```
Đảm bảo Redis đang chạy: docker-compose up -d redis
Kiểm tra REDIS_URL trong .env
```

**3. SignalR Connection Failed**
```
Kiểm tra NEXT_PUBLIC_SIGNALR_URL
Đảm bảo backend SignalR hub endpoint đúng
```

**4. ML Service Model Not Found**
```
Kiểm tra MODEL_DIR path
Đảm bảo models đã được copy vào ml-service/models/
```

**5. Database Migration Failed**
```
Kiểm tra DATABASE_URL
Chạy: dotnet ef database update --verbose
```

### Health Check Endpoints

| Service | Endpoint |
|---------|----------|
| Backend | `http://localhost:5000/health` |
| ML Service | `http://localhost:8000/health` |
| Frontend | `http://localhost:3000` |

---

## Liên Hệ & Hỗ Trợ

- **Issues:** https://github.com/your-org/Velo-Tradefi-app/issues
- **Documentation:** https://docs.velotradefi.com
- **Discord:** https://discord.gg/velotradefi

# FinAI Dashboard — Project Plan

> Đồ án môn Lập trình Web | Nhóm 2–3 người | 8 tuần | MVP deploy

---

## 1. Tổng quan dự án

Hệ thống web app toàn diện tích hợp AI dự đoán & theo dõi cổ phiếu VN/US, ví Web3, theo dõi memecoin và cập nhật tin tức AI mới nhất.

### Tech stack chính thức

| Layer | Công nghệ |
|---|---|
| Frontend | Google Stitch (export) → Next.js 14 + TailwindCSS + shadcn/ui |
| Backend | ASP.NET Core 8 MVC |
| AI/ML | Python FastAPI microservice (LSTM + Prophet) |
| Database | Supabase (PostgreSQL + Realtime) |
| Cache | Redis |
| Web3 | ethers.js + MetaMask |
| Realtime | SignalR (ASP.NET) |
| Deploy | Vercel (Frontend) + Railway (Backend + Python) + Supabase Cloud |

> **Lý do chọn Supabase thay SQL Server:** Free tier 500MB, Realtime built-in, PostgreSQL chuẩn, tích hợp dễ với Vercel + Railway, tiết kiệm chi phí.

---

## 2. Business Plan

### 2.1 Modules & tính năng

| Module | Tính năng | Độ ưu tiên |
|---|---|---|
| Stock tracking | Theo dõi giá VN (HOSE) & US (NYSE/NASDAQ) realtime | Core |
| AI prediction | Dự đoán giá 7 ngày tới bằng LSTM + Prophet | Core |
| Auth | Đăng ký / đăng nhập JWT | Core |
| Web3 wallet | Connect MetaMask, hiển thị số dư ETH + ERC20 | Bonus |
| Memecoin | Theo dõi giá, watchlist cá nhân, chart 7d/30d | Bonus |
| News feed | Tổng hợp tin tức AI mới nhất qua RSS | Phụ |

### 2.2 System Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT LAYER                      │
│   Next.js (Stitch)  │  ethers.js  │  WalletConnect  │
└────────────┬────────────────────────────────────────┘
             │ HTTPS / WS
┌────────────▼────────────────────────────────────────┐
│         ASP.NET Core 8 MVC + JWT Auth                │
└──┬────────┬──────────┬───────────┬──────────────────┘
   │        │          │           │
┌──▼──┐ ┌──▼──┐  ┌────▼───┐ ┌────▼────┐
│Stock│ │ AI  │  │ Web3   │ │  News   │
│ Svc │ │Pred.│  │Wallet  │ │Scraper  │
└──┬──┘ └──┬──┘  └────┬───┘ └────┬────┘
   │        │          │           │
┌──▼────────▼──────────▼───────────▼────────────────┐
│              EXTERNAL APIs & DATA LAYER             │
│  Yahoo Finance  │  Python FastAPI  │  CoinGecko     │
│  TCBS/vnstock   │  (LSTM+Prophet)  │  RSS/NewsAPI   │
│                                                     │
│  Supabase PostgreSQL  │  Redis Cache  │  Model .h5  │
└─────────────────────────────────────────────────────┘
```

### 2.3 Timeline 8 tuần

| Tuần | Dev A (Fullstack) | Dev B (Backend) | Dev C (AI/ML + Web3) | Milestone |
|---|---|---|---|---|
| W1 | Setup Next.js + Auth UI | ASP.NET setup + DB schema | Python env + data collect | — |
| W2 | — | — | — | ✅ Auth + DB live |
| W3 | Stock dashboard UI | Stock API + realtime feed | LSTM model + FastAPI | — |
| W4 | — | — | — | ✅ Stock + AI demo |
| W5 | Web3 + Memecoin UI | News scraper + API | Web3 wallet logic | — |
| W6 | — | — | — | ✅ Web3 live |
| W7 | Polish + deploy | Testing + bug fixes | Model tuning + docs | — |
| W8 | — | — | — | 🚀 MVP Deploy |

> W2 / W4 / W6 / W8 = review + integration sprint

### 2.4 Risk Assessment

| Rủi ro | Mức | Vấn đề | Giải pháp |
|---|---|---|---|
| LSTM training time | 🔴 Cao | Không có GPU, kết quả không ổn định | Train offline trên Colab, lưu `.h5` sẵn. Prophet làm fallback |
| Stock data VN | 🔴 Cao | API HOSE/TCBS giới hạn, dễ bị block | Dùng `vnstock` (Python lib) + cache 15 phút Redis |
| Web3 complexity | 🟡 Vừa | ethers.js + WalletConnect phức tạp | Chỉ dùng MetaMask + đọc số dư. Bỏ WalletConnect nếu trễ |
| Realtime performance | 🟡 Vừa | Polling nhiều làm chậm, Supabase free có limit | Poll 30s cho stock VN, WS chỉ cho memecoin |
| Python ↔ .NET bridge | 🟡 Vừa | Lỗi serialization, timeout giữa 2 service | FastAPI trả JSON chuẩn, .NET dùng Polly retry policy |
| Phân công mất cân bằng | 🟡 Vừa | Dev C ôm cả AI lẫn Web3 (bottleneck W5-6) | Dev A hỗ trợ Web3 UI, Dev B lo scraping news ở W5 |
| Deploy cost | 🟢 Thấp | Railway cold start, sleep sau 30 phút | Cron ping mỗi 20 phút, hoặc upgrade $5/tháng khi demo |

---

## 3. Technical & Development Plan

### 3.1 ASP.NET Core 8 MVC — Project Structure

```
FinAI.sln
└── src/
    └── FinAI.Web/                      # Project duy nhất (MVC)
        ├── Controllers/
        │   ├── StockController.cs      # /Stock/Price, /Stock/History
        │   ├── PredictionController.cs # /Prediction/Index, /Prediction/Get
        │   ├── Web3Controller.cs       # /Web3/Balance, /Web3/Connect
        │   ├── NewsController.cs       # /News/Index
        │   └── AuthController.cs       # /Auth/Login, /Auth/Register
        │
        ├── Models/
        │   ├── Stock/
        │   │   ├── StockViewModel.cs
        │   │   └── WatchlistViewModel.cs
        │   ├── Prediction/
        │   │   └── PredictionViewModel.cs
        │   ├── Web3/
        │   │   └── WalletViewModel.cs
        │   └── Auth/
        │       ├── LoginViewModel.cs
        │       └── RegisterViewModel.cs
        │
        ├── Views/
        │   ├── Stock/
        │   │   ├── Index.cshtml        # Dashboard cổ phiếu
        │   │   └── Detail.cshtml       # Chi tiết + chart
        │   ├── Prediction/
        │   │   └── Index.cshtml        # AI forecast
        │   ├── Web3/
        │   │   └── Index.cshtml        # Wallet + memecoin
        │   ├── News/
        │   │   └── Index.cshtml        # Tin tức AI
        │   └── Shared/
        │       ├── _Layout.cshtml
        │       └── _NavBar.cshtml
        │
        ├── Services/                   # Business logic
        │   ├── StockService.cs         # Gọi Yahoo Finance / vnstock
        │   ├── PredictionService.cs    # Gọi Python FastAPI
        │   ├── CoinGeckoService.cs     # Memecoin data
        │   ├── NewsService.cs          # RSS aggregator
        │   └── RedisCacheService.cs
        │
        ├── Data/
        │   ├── AppDbContext.cs         # EF Core DbContext
        │   └── Migrations/
        │
        ├── Hubs/
        │   └── StockPriceHub.cs        # SignalR realtime
        │
        └── wwwroot/                    # Static assets
            ├── js/
            │   ├── web3.js             # ethers.js wallet logic
            │   └── charts.js           # TradingView / Chart.js
            └── css/
```

**Lưu ý quan trọng với MVC + Next.js:** Vì frontend dùng Google Stitch → Next.js (tách biệt), ASP.NET MVC sẽ hoạt động thuần như **API backend** — các Action trả về `Json()` thay vì Views. Views chỉ cần nếu nhóm muốn có server-side render fallback. Cấu hình CORS để Next.js gọi được.

**Packages chính:**
- `Microsoft.AspNetCore.Mvc` — MVC framework (built-in .NET 8)
- `Entity Framework Core` + `Npgsql` — ORM cho PostgreSQL
- `Microsoft.AspNetCore.Authentication.JwtBearer` — JWT auth
- `StackExchange.Redis` — Redis cache
- `Polly` — retry policy khi gọi Python service
- `Microsoft.AspNetCore.SignalR` — realtime push
- `Nethereum` — verify Ethereum wallet signature

### 3.2 MVC Action Endpoints (theo thứ tự ưu tiên)

```
# Tuần 1–2 (Core — unblock frontend sớm)
GET  /Stock/Price/{symbol}             # giá realtime → Json()
GET  /Stock/History/{symbol}           # chart data (7d/30d/1y) → Json()
POST /Auth/Register                    # → Json({ token })
POST /Auth/Login                       # → Json({ token })

# Tuần 3–4 (AI prediction)
POST /Prediction/Get/{symbol}          # gọi Python FastAPI → Json(7-day forecast)
GET  /Prediction/Latest/{symbol}       # lấy prediction đã cache → Json()

# Tuần 5–6 (Web3 + Memecoin)
GET  /Web3/Balance/{address}           # ETH + ERC20 balances → Json()
POST /Web3/Connect                     # lưu wallet address → Json()
GET  /Memecoin/Trending                # top 50 memecoins (cache 30s) → Json()
GET  /Memecoin/Price/{id}             # giá + chart data → Json()
POST /Watchlist/AddCoin               # thêm vào watchlist → Json()
DELETE /Watchlist/RemoveCoin/{id}     # xoá khỏi watchlist → Json()

# Tuần 7 (News)
GET  /News/Index                      # RSS feed tổng hợp, paginated → Json()
```

> **Convention MVC với frontend tách biệt:** Dùng `[Route("api/[controller]/[action]")]` trên Controller để giữ route đẹp kiểu `/api/stock/price/VNM`, hoặc dùng route mặc định `/{controller}/{action}/{id?}`. Cả hai đều hợp lệ với Next.js fetch.

### 3.3 Python AI Service — LSTM Pipeline

**Luồng xử lý:**

```
[Offline — Google Colab]
Data collect (vnstock/yfinance)
  → Preprocessing (MinMaxScaler, 60-day window)
  → Train LSTM model (Keras)
  → Export model.h5 + scaler.pkl

[Online — FastAPI server]
POST /predict/lstm
  → Load .h5 + .pkl
  → Fetch 60 ngày mới nhất
  → Scale → predict → inverse_transform
  → Return JSON

POST /predict/prophet         # fallback khi LSTM lỗi
GET  /health
```

**Folder structure:**

```
python-ai-service/
├── app/
│   ├── main.py
│   ├── routers/
│   │   └── predict.py
│   ├── services/
│   │   ├── lstm_service.py
│   │   └── prophet_service.py
│   └── models/
│       ├── lstm_vnm.h5          # VNM, VIC, HPG, VHM...
│       ├── lstm_aapl.h5         # AAPL, TSLA, NVDA...
│       └── scaler_*.pkl
├── training/                    # Colab notebooks (không deploy)
│   ├── train_lstm.ipynb
│   └── train_prophet.ipynb
└── requirements.txt             # tensorflow, prophet, fastapi, uvicorn
```

**Response model:**

```python
class PredictionResponse(BaseModel):
    symbol: str
    predictions: list[float]   # giá dự đoán 7 ngày tới
    confidence: float          # 0.0 – 1.0
    model_used: str            # "lstm" | "prophet"
    generated_at: datetime
```

**Cache strategy:**
- Redis TTL 1 giờ cho prediction (giá không thay đổi liên tục)
- Skip cache nếu thị trường đang mở (9:00–15:00 VN, 9:30–16:00 US)
- Tự động fallback sang Prophet nếu LSTM service lỗi

### 3.4 Web3 Integration Flow

**Frontend (Stitch export → Next.js):**

```typescript
// 1. Connect MetaMask
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const address = await signer.getAddress();

// 2. Đọc số dư ETH
const balance = await provider.getBalance(address);
const ethBalance = ethers.formatEther(balance);

// 3. Gửi address lên backend để lưu
await fetch('/api/web3/wallet', {
  method: 'POST',
  body: JSON.stringify({ address })
});
```

**Backend (ASP.NET MVC + Nethereum):**

```csharp
// Web3Controller.cs
[Route("api/[controller]/[action]")]
public class Web3Controller : Controller
{
    [HttpPost]
    public async Task<IActionResult> Connect([FromBody] ConnectWalletDto dto)
    {
        // Verify wallet signature (chống giả mạo)
        var signer = new EthereumMessageSigner();
        var recovered = signer.EncodeUTF8AndEcRecover(dto.Message, dto.Signature);
        if (!recovered.Equals(dto.Address, StringComparison.OrdinalIgnoreCase))
            return Json(new { success = false, error = "Invalid signature" });

        // Lưu vào DB
        await _userService.UpdateWalletAsync(UserId, dto.Address);
        return Json(new { success = true });
    }
}
```

**Memecoin tracking flow:**

```
CoinGecko /coins/markets?category=meme-token
  → ASP.NET cache Redis (TTL 30s)
  → SignalR broadcast to connected clients
  → Frontend chart (Recharts / TradingView Lightweight Charts)
```

**Supabase schema (bảng liên quan Web3):**

```sql
-- Thêm cột wallet vào users
ALTER TABLE users ADD COLUMN wallet_address VARCHAR(42);

-- Watchlist memecoin
CREATE TABLE user_watchlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  coin_id VARCHAR(100) NOT NULL,   -- CoinGecko ID, e.g. "dogecoin"
  added_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.5 Google Stitch → Next.js Integration

Stitch export ra React components với Tailwind CSS. Để tích hợp mượt:

1. **Tạo Next.js project trước** với `shadcn/ui` init — Stitch và shadcn dùng chung Tailwind, compatibility cao.
2. **Paste Stitch components** vào `src/components/ui/` hoặc `src/components/features/`.
3. **Chỉnh duy nhất phần data:** Stitch export UI tĩnh (hardcoded data). Thay bằng `useState` + React Query để fetch từ ASP.NET API.

```typescript
// Trước (Stitch static)
const price = "123,456 VND";

// Sau (connect API)
const { data } = useQuery({
  queryKey: ['stock', symbol],
  queryFn: () => fetch(`/api/stocks/${symbol}/price`).then(r => r.json()),
  refetchInterval: 30_000  // poll 30 giây
});
const price = data?.price ?? "—";
```

---

## 4. Database Schema (Supabase / PostgreSQL)

```sql
-- Users & Auth
CREATE TABLE users (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email            VARCHAR(255) UNIQUE NOT NULL,
  password_hash    TEXT NOT NULL,
  wallet_address   VARCHAR(42),
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- Stock watchlist
CREATE TABLE watchlist (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol    VARCHAR(20) NOT NULL,   -- "VNM", "AAPL"
  market    VARCHAR(4) NOT NULL,    -- "VN" | "US"
  added_at  TIMESTAMPTZ DEFAULT now()
);

-- AI predictions (cache lịch sử)
CREATE TABLE predictions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol       VARCHAR(20) NOT NULL,
  predictions  JSONB NOT NULL,       -- [{"date": "...", "price": 123.4}, ...]
  model_used   VARCHAR(20),          -- "lstm" | "prophet"
  confidence   NUMERIC(4,3),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Memecoin watchlist
CREATE TABLE user_watchlist_memecoins (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  coin_id  VARCHAR(100) NOT NULL,
  added_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. Deployment Setup

### Vercel (Frontend)
```bash
# next.config.js — proxy API calls
rewrites: [{ source: '/api/:path*', destination: 'https://your-railway-app.railway.app/api/:path*' }]
```

### Railway (Backend)
```dockerfile
# Dockerfile cho ASP.NET Core MVC
FROM mcr.microsoft.com/dotnet/aspnet:8.0
COPY . .
ENTRYPOINT ["dotnet", "FinAI.Web.dll"]
```

```dockerfile
# Dockerfile cho Python FastAPI
FROM python:3.11-slim
COPY requirements.txt .
RUN pip install -r requirements.txt
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment variables cần thiết
```
# ASP.NET
ConnectionStrings__DefaultConnection=postgresql://...  (Supabase)
Redis__ConnectionString=redis://...
PythonService__BaseUrl=https://your-python-service.railway.app
Jwt__SecretKey=your-secret-key

# Python FastAPI
MODEL_DIR=./app/models

# Next.js
NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app
```

### Giữ Railway khỏi sleep (free tier)
```
# Cron job ping mỗi 20 phút (dùng cron-job.org hoặc GitHub Actions)
GET https://your-railway-app.railway.app/health
```

---

## 6. Checklist bắt đầu (ngay tuần 1)

- [ ] Tạo Supabase project → chạy migrations SQL ở mục 4
- [ ] Bootstrap `FinAI.sln` với 1 project ASP.NET Core MVC (`dotnet new mvc`)
- [ ] Tạo Next.js 14 project + init shadcn/ui + Tailwind
- [ ] Setup Google Stitch, import design system, export component đầu tiên
- [ ] Tạo Python venv + cài tensorflow, prophet, fastapi, uvicorn
- [ ] Tạo Google Colab notebook cho data collection
- [ ] Setup Railway projects (2 service: dotnet + python)
- [ ] Setup Vercel project → link GitHub repo
- [ ] Tạo `.env` files cho cả 3 project

---

*Generated: March 2026 | Stack: Next.js 14 · ASP.NET Core 8 MVC · Python FastAPI · Supabase · Redis · ethers.js*

# Velo Tradefi — Remotion Video

Video demo được tạo bằng [Remotion](https://www.remotion.dev) — framework tạo video bằng React.

## Cấu trúc video (6 scenes, 15 giây)

| # | Scene | Thời lượng | Nội dung |
|---|-------|-----------|----------|
| 1 | **Title** | 3s | Logo V, tên "Velo Tradefi", tagline |
| 2 | **Dashboard** | 3.3s | Main Index, Market Cap, 24h Volume cards |
| 3 | **Top Movers** | 3s | Bảng AAPL/TSLA/NVDA với giá + thay đổi |
| 4 | **AI Prediction** | 3s | Biểu đồ LSTM, predicted high |
| 5 | **Memecoins** | 2s | DOGE / SHIB / PEPE từ CoinGecko |
| 6 | **CTA** | 3s | "Ready to Trade Smarter?" + nút Start |

## Scripts

```bash
# Cài đặt dependencies
npm install

# Preview trong trình duyệt (Studio)
npm start

# Render video local → out/velo-tradefi.mp4
npm run build
# hoặc
node render.mjs

# Render ảnh thumbnail → out/thumbnail.png
npm run still

# Deploy lên AWS Lambda + render trên cloud
npm run deploy
```

## Tùy chỉnh nội dung

Sửa `defaultProps` trong `src/Root.tsx`:

```ts
defaultProps={{
  stockPrice: "$127.45",
  changePercent: "+2.34%",
  marketCap: "$2.8T",
  tokenName: "VELO",
  userName: "Alex Trader",
  topMovers: [
    { symbol: "AAPL", price: "$187.32", change: "+1.2%" },
    { symbol: "TSLA", price: "$248.50", change: "+3.8%" },
    { symbol: "NVDA", price: "$875.40", change: "+5.1%" },
  ],
}}
```

## Deploy lên Remotion Studio (Vercel)

```bash
# Build và deploy lên Vercel
npx vercel --prod

# Render trực tiếp từ URL
npx remotion render https://your-studio.vercel.app VeloTradefiVideo out/video.mp4
```

## Công nghệ

- **Remotion 4.x** — React-based video rendering
- **Transitions** — `@remotion/transitions` (fade, wipe)
- **Springs** — Physics-based animations
- **TypeScript** — Fully typed composition props
- **HLS** — Optional: render trên AWS Lambda để tăng tốc

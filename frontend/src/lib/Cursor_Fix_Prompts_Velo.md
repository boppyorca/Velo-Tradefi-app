# Velo Frontend — Cursor Fix Prompts
# Dùng từng prompt theo thứ tự. Paste vào Cursor chat (model: claude-sonnet-4-6).
# Mỗi prompt là 1 session riêng biệt trong Cursor.

---

## QUAN TRỌNG — ĐỌC TRƯỚC KHI DÙNG

Các prompt này được viết theo đúng cấu trúc thư mục thực tế:
```
frontend/src/
├── app/(app)/layout.tsx          ← app shell
├── components/layout/Sidebar.tsx ← sidebar
├── components/layout/TopBar.tsx  ← top bar
├── components/layout/AppLayout.tsx
├── components/features/          ← feature components
└── components/ui/                ← shadcn base
```

Chạy từng prompt theo thứ tự 1 → 7. Không bỏ qua bước nào.

---

## ════ PROMPT 1 — SIDEBAR + LAYOUT (Fix trước tiên) ════

```
Rewrite the following files completely to fix critical UI issues in the Velo dark-theme trading app.

The current sidebar is broken: it shows only ~60px icon-only collapsed state with no nav text labels, wrong background color, and missing watchlist section. The overall layout has white/gray background instead of the correct dark theme.

=== FILE 1: frontend/src/components/layout/Sidebar.tsx ===

Rewrite this file completely. Requirements:

SIDEBAR SPECS:
- Width: 220px fixed, NEVER collapses to icon-only
- Background: #0F0F13
- Full height: h-screen, position sticky top-0
- Right border: 1px solid rgba(255,255,255,0.07)
- Overflow-y: auto (scrollable if content overflows)
- No shadow, no blur effects
- z-index: 40

LOGO SECTION (top, px-4 py-5):
- Flex row, items-center, gap-2
- Logo: small div (28px × 28px, rounded-lg, bg-[#A3E635], flex items-center justify-center)
  containing a ⚡ emoji (text-sm text-black font-bold)
- App name: "Velo" text-white font-bold text-lg
- Tagline below logo row: "TERMINAL" text-[10px] text-[#4A4A5A] tracking-widest ml-[36px]

SEARCH BAR (px-3 mb-2):
- Input: w-full, bg-[#141418], border border-white/[0.08], rounded-lg
- Height: 34px, text-[13px] text-[#8A8A9A]
- Placeholder: "Search ticker / company..."
- Leading search icon: MagnifyingGlassIcon (16px, text-[#4A4A5A])
- No focus ring — use focus:border-white/20 instead

NAVIGATION (use next/link for all items):
Section "PLATFORM" label: text-[10px] font-medium tracking-widest text-[#4A4A5A] uppercase px-4 mb-1 mt-4

Nav items (each item px-3 py-2 rounded-r-lg mx-0 flex items-center gap-3 cursor-pointer text-[13px] transition-colors):
  INACTIVE style: text-[#8A8A9A], hover:bg-white/[0.04], hover:text-[#F0F0F0]
  ACTIVE style: bg-[#A3E635]/[0.09] text-[#A3E635] border-l-2 border-[#A3E635] rounded-r-lg rounded-l-none

Items list (icon + label + href):
  - LayoutDashboard icon → "Dashboard" → href="/dashboard"
  - TrendingUp icon → "Markets" → href="/markets"
  - Sparkles icon → "AI Predict" → href="/ai-predict"
  - Wallet icon → "Web3 Wallet" → href="/web3"
  - Newspaper icon → "News Feed" → href="/news"
  - Settings icon → "Settings" → href="/settings"

All icons: from lucide-react, size 16px (w-4 h-4)
Use usePathname() from next/navigation to determine active item.
Active when pathname === href OR pathname.startsWith(href) for nested routes.
Special case: "/dashboard" is active when pathname === "/dashboard" only (not for "/").

Section "EXCHANGES" label (same label style, mt-4):
Items (not links, just display, same inactive style):
  - TrendingUp icon (14px) → "NASDAQ" → right: green dot (w-1.5 h-1.5 rounded-full bg-[#A3E635])
  - TrendingUp icon → "HOSE" → right: green dot
  - TrendingUp icon → "NYSE" → right: green dot  
  - TrendingUp icon → "LSE" → right: gray dot (bg-[#4A4A5A])

Section "WATCHLIST" label (same label style, mt-4):
Show 4 hardcoded watchlist items (will be replaced with API data later):
Each item (px-3 py-1.5 flex items-center gap-2 hover:bg-white/[0.04] rounded-lg cursor-pointer):
  - Avatar: 24px rounded-full, bg colors: AAPL=#1a1a2e, NVDA=#1a2e1a, VNM=#2e1a1a, DOGE=#2e2a1a
  - Ticker: text-[12px] font-medium text-[#F0F0F0] font-mono
  - Spacer flex-1
  - Change: text-[11px] font-mono (green if positive, red if negative)
  Data: { ticker: "AAPL", change: "+0.8%" } { ticker: "NVDA", change: "+2.4%" } { ticker: "VNM", change: "+1.2%" } { ticker: "DOGE", change: "+5.2%" }

BOTTOM (mt-auto, px-3 py-3, border-t border-white/[0.07]):
- Flex row items-center gap-2
- Flag emoji "🇻🇳" text-sm
- Text "VND · USD" text-[11px] text-[#4A4A5A]
- Spacer
- Text "VI · EN" text-[11px] text-[#4A4A5A]

=== FILE 2: frontend/src/components/layout/TopBar.tsx ===

Rewrite completely. Requirements:

- Height: h-14 (56px)
- Background: #0F0F13
- Border-bottom: border-b border-white/[0.07]
- Sticky top-0 z-30
- Flex items-center px-6 gap-4
- Full width of content area (not including sidebar)

LEFT SIDE: nothing (breadcrumb removed — pages will handle their own titles)

CENTER: Search bar
- Flex-1, max-w-md
- Input: bg-[#141418] border border-white/[0.08] rounded-lg h-9 px-3 text-[13px] text-[#F0F0F0]
- Placeholder: "Search markets, tickers, or news..."
- Leading: MagnifyingGlassIcon 16px text-[#4A4A5A]
- No focus ring, focus:border-white/20

RIGHT SIDE (flex items-center gap-3 ml-auto):
- Bell icon button: w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center
  Bell icon: 18px text-[#8A8A9A]
  
- Wallet icon button: same style
  Wallet icon: 18px text-[#8A8A9A]

- "PRO TRADER" badge: bg-[#A3E635]/[0.12] text-[#A3E635] text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full

- User section (flex items-center gap-2):
  Avatar: w-8 h-8 rounded-full bg-[#1E1E26] border border-white/[0.10] flex items-center justify-center
    Text inside: "US" text-[11px] text-[#8A8A9A] font-mono
  Name column:
    "USER_882" text-[12px] text-[#F0F0F0] font-medium
    "CONNECTED" text-[10px] text-[#A3E635] (with green dot w-1.5 h-1.5 rounded-full bg-[#A3E635] inline-block mr-1)
  ChevronDown icon: 14px text-[#4A4A5A]

=== FILE 3: frontend/src/components/layout/AppLayout.tsx ===

Rewrite. This is the shell that combines Sidebar + TopBar + page content.

Requirements:
- Root div: className="flex h-screen bg-[#0A0A0C] text-[#F0F0F0] overflow-hidden"
- Sidebar on left: render <Sidebar /> — fixed width 220px, h-full
- Right side: flex-1 flex flex-col min-w-0 overflow-hidden
  - TopBar at top: <TopBar />
  - Main content: flex-1 overflow-y-auto
    - Inner div: p-6 min-h-full
    - Render: {children}

Import and use Inter font via className on root, ensure antialiased.

=== FILE 4: frontend/src/app/(app)/layout.tsx ===

Rewrite to simply wrap children in AppLayout:

```tsx
import { AppLayout } from '@/components/layout'

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>
}
```

After rewriting all 4 files, verify:
1. Sidebar shows full 220px with text labels
2. Background is dark #0A0A0C
3. Active nav item highlights in lime green
4. No white/gray backgrounds anywhere
```

---

## ════ PROMPT 2 — DASHBOARD PAGE ════

```
Rewrite frontend/src/app/(app)/dashboard/page.tsx completely.

The current dashboard is broken: missing portfolio value numbers, broken card layout, missing right column sections.

This is a "use client" page for the Velo dark-theme trading dashboard.

=== PAGE STRUCTURE ===

Page wrapper: div className="space-y-6"

--- SECTION 1: PAGE HEADER ---
Flex row justify-between items-start:
LEFT:
  - "Trader" h1: text-[#A3E635] text-3xl font-bold
  - Date below: text-[#8A8A9A] text-sm — use new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
RIGHT:
  - "● LIVE" badge: flex items-center gap-1.5, text-[#A3E635] text-xs font-medium
    Green dot: w-2 h-2 rounded-full bg-[#A3E635] animate-pulse
    Border: border border-[#A3E635]/30 rounded-full px-3 py-1

--- SECTION 2: STATS CARDS ROW (grid grid-cols-4 gap-4) ---

Each card: bg-[#141418] border border-white/[0.07] rounded-xl p-5

Card 1 — Portfolio Value:
  Label: "PORTFOLIO VALUE" text-[10px] uppercase tracking-widest text-[#4A4A5A] mb-3
  Value: "$12,450.32" text-2xl font-bold text-[#F0F0F0] font-mono mb-1
  Sub: "+1.24% today" text-sm text-[#A3E635] flex items-center gap-1
    ↑ TrendingUp icon 14px

Card 2 — Day P&L:
  Label: "DAY P&L"
  Value: "+$154.20" text-2xl font-bold text-[#A3E635] font-mono mb-1
  Sub: "+1.27% AAPL + TSLA" text-sm text-[#8A8A9A]

Card 3 — AI Confidence:
  Label: "AI CONFIDENCE"
  Value: "87%" text-2xl font-bold text-[#6366F1] font-mono mb-1
  Sub: "LSTM model" text-sm text-[#8A8A9A]
  Bottom: thin progress bar — bg-[#1E1E26] rounded-full h-1 mt-2, fill bg-[#6366F1] w-[87%]

Card 4 — Memecoin P&L:
  Label: "MEMECOIN P&L"
  Value: "+8.40%" text-2xl font-bold text-[#A3E635] font-mono mb-1
  Sub: "7-day return" text-sm text-[#8A8A9A]

--- SECTION 3: MAIN CONTENT (grid grid-cols-3 gap-6) ---

LEFT COLUMN (col-span-2):

Top Movers Card (bg-[#141418] border border-white/[0.07] rounded-xl p-5):
  Header row: flex justify-between items-center mb-4
    Left: TrendingUp icon 16px text-[#A3E635] + "Top Movers" text-sm font-medium text-[#F0F0F0] (gap-2)
    Right: "View all →" text-xs text-[#A3E635] hover:underline cursor-pointer (link to /markets)
  Sub: "Stocks with highest daily movement" text-xs text-[#4A4A5A] mb-4

  Stock rows (space-y-1). Each row (flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.03] cursor-pointer):
    Avatar: w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-mono
      AAPL: bg-[#1a1a2e] text-[#6366F1] "AA"
      NVDA: bg-[#1a2e1a] text-[#A3E635] "NV"
      TSLA: bg-[#2e1a1a] text-[#F05252] "TS"
      MSFT: bg-[#1a2a2e] text-[#06B6D4] "MS"
      AMZN: bg-[#2e2a1a] text-[#F59E0B] "AM"
    
    Info (flex-1):
      Ticker: text-sm font-medium text-[#F0F0F0] font-mono
      Name: text-xs text-[#4A4A5A]
    
    Exchange badge: text-[10px] font-mono bg-[#1E1E26] text-[#8A8A9A] px-2 py-0.5 rounded
    
    Sparkline placeholder: w-16 h-8 (simple div with a subtle gradient bar to simulate a chart)
    
    Change: text-sm font-mono font-medium (text-[#A3E635] if positive, text-[#F05252] if negative)
      With ↑ or ↓ icon 12px before the number
    
  Data:
    { ticker: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", change: "+0.80%" }
    { ticker: "NVDA", name: "NVIDIA Corp.", exchange: "NASDAQ", change: "+2.40%" }
    { ticker: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", change: "-0.50%" }
    { ticker: "MSFT", name: "Microsoft Corp.", exchange: "NASDAQ", change: "+0.68%" }
    { ticker: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", change: "-0.46%" }

RIGHT COLUMN (col-span-1 space-y-4):

Memecoins Card (bg-[#141418] border border-white/[0.07] rounded-xl p-5):
  Header: TrendingUp icon + "Live Memecoins" + "Track →" link to /web3
  Sub: "Live from CoinGecko" text-xs text-[#4A4A5A] mb-3
  3 rows (each flex items-center gap-2 py-2 border-b border-white/[0.05] last:border-0):
    Avatar: w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
      DOGE: bg-[#2e2a1a] text-[#F59E0B] "DO"
      SHIB: bg-[#2e1a1a] text-[#F05252] "SH"
      PEPE: bg-[#1a2e1a] text-[#A3E635] "PE"
    Name: text-sm font-mono text-[#F0F0F0]
    Spacer flex-1
    Change: text-sm font-mono (colored)
  Data: DOGE +5.2% | SHIB -2.1% | PEPE +12.4%

AI News Card (bg-[#141418] border border-white/[0.07] rounded-xl p-5):
  Header: Newspaper icon text-[#F59E0B] + "Latest AI News" text-sm font-medium + "All →" link to /news
  3 news rows (space-y-3, each border-b border-white/[0.05] last:border-0 pb-3 last:pb-0):
    Row: flex gap-2
      Left: category badge — "AI" bg-[#6366F1]/20 text-[#6366F1] OR "CRYPTO" bg-[#F59E0B]/20 text-[#F59E0B] text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 shrink-0
      Right: headline text-xs text-[#F0F0F0] leading-relaxed line-clamp-2 + time text-[10px] text-[#4A4A5A] mt-1
    Data:
      AI | "1h ago" | "NVIDIA announces next-gen AI chips at GTC 2026"
      CRYPTO | "2h ago" | "Bitcoin breaks $67K amid record ETF inflow"
      AI | "4h ago" | "OpenAI releases GPT-5 with multimodal reasoning"

Quick Actions (grid grid-cols-2 gap-2):
  4 buttons (h-10 rounded-lg text-xs font-semibold flex items-center justify-center gap-2):
  "Buy Stock": bg-[#A3E635] text-black — ShoppingCart icon 14px
  "AI Predict": bg-[#6366F1] text-white — Sparkles icon 14px — link to /ai-predict
  "Connect Wallet": bg-[#8B5CF6] text-white — Wallet icon 14px — link to /web3
  "View News": bg-[#F59E0B] text-black — Newspaper icon 14px — link to /news

All icons from lucide-react.
```

---

## ════ PROMPT 3 — MARKETS PAGE ════

```
Rewrite frontend/src/app/(app)/markets/page.tsx completely.

Critical bug: the PRICE column is missing from the table — only showing CHANGE and %. Fix this and redesign the full page.

"use client" page.

=== PAGE STRUCTURE ===

Page wrapper: div className="space-y-4"

--- HEADER ROW ---
Flex justify-between items-center:
LEFT:
  "LIVE" badge: bg-[#A3E635]/10 text-[#A3E635] text-[10px] font-bold tracking-widest px-3 py-1 rounded-full border border-[#A3E635]/20 + animate-pulse green dot
  Sub: "Real-time VN & US stock prices — 30s auto-refresh" text-xs text-[#4A4A5A] mt-1
RIGHT:
  Refresh button: flex items-center gap-2 bg-[#141418] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-[#8A8A9A] hover:text-[#F0F0F0] hover:border-white/20 cursor-pointer
  RotateCcw icon 14px

--- CONTROLS ROW ---
Flex items-center gap-3:
LEFT: Search input
  Relative div, flex-1 max-w-sm
  Input: w-full bg-[#141418] border border-white/[0.08] rounded-lg h-9 pl-9 pr-3 text-[13px] text-[#F0F0F0] placeholder-[#4A4A5A] focus:border-white/20 outline-none
  MagnifyingGlassIcon: absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A5A]
  Placeholder: "Search ticker or name..."

RIGHT: Market filter tabs
  Flex gap-1 bg-[#141418] border border-white/[0.08] rounded-lg p-1
  3 buttons: "All" | "VN" | "US"
  Active: bg-[#0A0A0C] text-[#F0F0F0] rounded-md shadow-sm
  Inactive: text-[#8A8A9A] hover:text-[#F0F0F0]
  Each button: px-4 py-1.5 text-xs font-medium transition-colors

--- STOCKS TABLE (main card) ---
Card: bg-[#141418] border border-white/[0.07] rounded-xl overflow-hidden

Table header row (bg-[#1E1E26] border-b border-white/[0.07] px-4 py-3 grid):
  Grid: grid-cols-[40px_1fr_120px_100px_100px_100px_120px]
  Headers: "" | "SYMBOL ↑" | "PRICE" | "CHANGE" | "%" | "VOLUME" | "MARKET"
  All: text-[10px] uppercase tracking-widest text-[#4A4A5A] font-medium

Table rows (each: grid grid-cols-[40px_1fr_120px_100px_100px_100px_120px] px-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] items-center):

Column 1 — Star button:
  StarIcon 15px — filled gold (★) if watchlisted, outline (☆) text-[#4A4A5A] if not
  Toggle on click

Column 2 — Symbol + Name:
  Ticker: text-sm font-medium font-mono text-[#F0F0F0]
  Name: text-xs text-[#4A4A5A] mt-0.5
  Make entire cell a link to /markets/[symbol]

Column 3 — PRICE: ← THIS WAS MISSING, NOW REQUIRED
  text-sm font-mono text-[#F0F0F0] font-medium
  Show actual price with currency: US stocks "$192.10", VN stocks "45,200 ₫"

Column 4 — CHANGE (absolute):
  text-sm font-mono (text-[#A3E635] if positive, text-[#F05252] if negative)
  Format: "+1.52" or "-0.90"

Column 5 — % change:
  Same color. Format: "+0.80%" or "-0.46%"

Column 6 — VOLUME:
  text-sm font-mono text-[#8A8A9A]
  Format: "58.2M" or "4.2M"

Column 7 — MARKET badge:
  Pill: text-[10px] font-mono font-bold px-2.5 py-1 rounded
  NASDAQ: bg-[#1a1a2e] text-[#6366F1]
  HOSE: bg-[#1a2e1a] text-[#A3E635]
  NYSE: bg-[#2e1a1a] text-[#F59E0B]

SAMPLE DATA (10 rows, mix of VN + US):
{ symbol: "AAPL", name: "Apple Inc.", price: 192.10, priceFormatted: "$192.10", change: 1.52, changePct: 0.80, volume: "58.2M", market: "NASDAQ" }
{ symbol: "AMZN", name: "Amazon.com Inc.", price: 195.40, priceFormatted: "$195.40", change: -0.90, changePct: -0.46, volume: "18.4M", market: "NASDAQ" }
{ symbol: "FPT", name: "FPT Corp.", price: 146200, priceFormatted: "146,200 ₫", change: 1200, changePct: 0.83, volume: "4.2M", market: "HOSE" }
{ symbol: "GOOGL", name: "Alphabet Inc.", price: 172.30, priceFormatted: "$172.30", change: 1.20, changePct: 0.70, volume: "19.2M", market: "NASDAQ" }
{ symbol: "HPG", name: "Hoa Phat Group", price: 28480, priceFormatted: "28,480 ₫", change: 480, changePct: 1.72, volume: "5.8M", market: "HOSE" }
{ symbol: "META", name: "Meta Platforms", price: 511.40, priceFormatted: "$511.40", change: 8.40, changePct: 1.67, volume: "15.6M", market: "NASDAQ" }
{ symbol: "MSFT", name: "Microsoft Corp.", price: 415.80, priceFormatted: "$415.80", change: 2.80, changePct: 0.68, volume: "22.1M", market: "NASDAQ" }
{ symbol: "MSN", name: "Masan Group", price: 72540, priceFormatted: "72,540 ₫", change: 540, changePct: 0.75, volume: "1.1M", market: "HOSE" }
{ symbol: "MWG", name: "Mobile World Inv.", price: 51720, priceFormatted: "51,720 ₫", change: -280, changePct: -0.54, volume: "1.8M", market: "HOSE" }
{ symbol: "NVDA", name: "NVIDIA Corp.", price: 192.10, priceFormatted: "$192.10", change: 4.50, changePct: 2.40, volume: "42.5M", market: "NASDAQ" }

Implement client-side filtering: filter by market (All/VN/US), search by ticker or name (case-insensitive).
```

---

## ════ PROMPT 4 — AI PREDICT PAGE ════

```
Rewrite frontend/src/app/(app)/ai-predict/page.tsx and frontend/src/components/features/PredictionChart.tsx completely.

Critical bug: the chart area is almost completely empty/black — the prediction line and historical data are not rendering.

=== PAGE: ai-predict/page.tsx ===
"use client" — imports: useState from react, PredictionChart from features

Page wrapper: div className="space-y-5"

--- HEADER ---
Flex items-center justify-between:
Left: "BETA" badge (bg-[#6366F1]/10 text-[#6366F1] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#6366F1]/20) + sub text "7-day price forecasting powered by LSTM & Prophet" text-xs text-[#4A4A5A] mt-1

--- CONTROLS BAR (bg-[#141418] border border-white/[0.07] rounded-xl p-4) ---
Flex items-center gap-4 flex-wrap:

Symbol pills (flex gap-2 flex-wrap):
  Label "Symbol" text-xs text-[#4A4A5A] mr-1
  5 pill buttons: AAPL | NVDA | TSLA | VNM | MSFT
  Active: bg-[#6366F1] text-white rounded-full px-3 py-1 text-xs font-medium
  Inactive: bg-[#1E1E26] text-[#8A8A9A] rounded-full px-3 py-1 text-xs hover:text-[#F0F0F0]
  useState for selectedSymbol, default "AAPL"

Divider: w-px h-6 bg-white/[0.07]

Model toggle (flex gap-1 bg-[#0A0A0C] rounded-lg p-1):
  "LSTM" button: active bg-[#6366F1] text-white rounded-md px-3 py-1 text-xs font-medium
                  inactive text-[#8A8A9A]
  "Prophet" button: same style
  useState for selectedModel, default "LSTM"
  Prefix: Cpu icon 14px text-[#6366F1] before the buttons

Refresh button (ml-auto): flex items-center gap-2 bg-[#141418] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-[#8A8A9A]
  RotateCcw icon 14px

--- MAIN CONTENT (grid grid-cols-3 gap-5) ---

LEFT + CENTER (col-span-2):
PredictionChart card (bg-[#141418] border border-white/[0.07] rounded-xl overflow-hidden):
  Pass props: symbol={selectedSymbol} model={selectedModel}

  Below chart: 3 stat boxes (grid grid-cols-3 gap-0 border-t border-white/[0.07]):
    Each box: px-5 py-4 border-r border-white/[0.07] last:border-0
    Box 1: label "TREND" text-[10px] uppercase text-[#4A4A5A] + value "↑ Bullish" text-sm font-medium text-[#A3E635] mt-1
    Box 2: label "CONFIDENCE" + value "87%" text-sm font-bold text-[#F0F0F0] font-mono mt-1
    Box 3: label "7D TARGET" + value "$199.20" text-sm font-bold text-[#A3E635] font-mono mt-1

RIGHT COLUMN (col-span-1 space-y-4):

Model Info card (bg-[#141418] border border-white/[0.07] rounded-xl p-5):
  Header: Info icon 16px text-[#6366F1] + "Model Info" text-sm font-medium ml-2
  4 rows (each flex justify-between py-2 border-b border-white/[0.05] last:border-0 text-xs):
    "Active Model" | "LSTM" (text-[#6366F1] font-medium)
    "Training Data" | "60 days" (text-[#F0F0F0] font-mono)
    "Forecast Window" | "7 days" (text-[#F0F0F0] font-mono)
    "Last Updated" | "Just now" (text-[#8A8A9A])

Disclaimer card (bg-[#6366F1]/[0.06] border border-[#6366F1]/20 rounded-xl p-4):
  Info icon 14px text-[#6366F1] inline mr-1
  "For educational purposes only. " text-xs text-[#6366F1] font-medium inline
  "Predictions are based on historical price patterns and do not constitute financial advice. Always do your own research." text-xs text-[#8A8A9A]

All Forecasts card (bg-[#141418] border border-white/[0.07] rounded-xl p-5):
  Header: "All Forecasts" text-sm font-medium text-[#F0F0F0] mb-3
  4 rows (each flex justify-between items-center py-2.5 border-b border-white/[0.05] last:border-0):
    Symbol: text-sm font-mono font-medium text-[#F0F0F0]
    Right: change% (colored) text-sm font-mono + price text-xs text-[#4A4A5A] mt-0.5 text-right
  Data:
    AAPL +3.7% / $199.20
    NVDA +8.2% / $146.30
    TSLA -3.9% / $238.70
    VNM +0.9% / $47,240

=== COMPONENT: frontend/src/components/features/PredictionChart.tsx ===

"use client"
Props: { symbol: string, model: string }

Use recharts library (import from 'recharts').
If recharts is not installed, use a pure SVG/canvas fallback.

Generate mock data inside the component:
const today = new Date()
Generate 30 historical points (past 30 days) + 7 prediction points (next 7 days):

Historical data: simulate realistic prices starting from a base (AAPL=192, NVDA=140, TSLA=245, VNM=46000, MSFT=415)
Use a simple random walk: price[i] = price[i-1] * (1 + (Math.random() - 0.48) * 0.02)
Each point: { date: formatted date string, actual: price, predicted: null }

Prediction data (last 7): { date, actual: null, predicted: price with slight upward bias }
Vertical divider at "Today" mark.

Chart implementation using recharts ComposedChart:
  Width: "100%", height: 280
  Background: transparent (chart area bg #0A0A0C)

  CartesianGrid: strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false}
  
  XAxis: 
    dataKey="date"
    tick={{ fill: '#4A4A5A', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
    axisLine={{ stroke: 'rgba(255,255,255,0.07)' }}
    tickLine={false}
    Show only every 5th label (interval={4})
  
  YAxis:
    tick={{ fill: '#4A4A5A', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
    axisLine={false}
    tickLine={false}
    tickFormatter={(v) => formatPrice(v, symbol)}
    width={70}
    domain={['auto', 'auto']}
  
  Tooltip:
    contentStyle={{ backgroundColor: '#1E1E26', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
    labelStyle={{ color: '#8A8A9A', fontSize: 11 }}
    itemStyle={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12 }}
  
  Line for "actual":
    type="monotone" dataKey="actual"
    stroke="#8A8A9A" strokeWidth={2}
    dot={false} connectNulls={false}
    name="Historical"
  
  Line for "predicted":
    type="monotone" dataKey="predicted"  
    stroke="#6366F1" strokeWidth={2.5}
    strokeDasharray="6 3"
    dot={{ fill: '#6366F1', r: 3, strokeWidth: 0 }}
    connectNulls={false}
    name="Predicted"
  
  ReferenceLine at today's x position:
    stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4"
    label={{ value: 'Today', fill: '#4A4A5A', fontSize: 10, position: 'top' }}
  
  Legend at bottom:
    iconType="line"
    wrapperStyle={{ fontSize: 11, color: '#8A8A9A' }}

  "87% conf LSTM" floating badge:
    Position absolute top-3 right-3 within chart container
    bg-[#6366F1]/20 text-[#6366F1] text-[10px] font-mono px-2 py-1 rounded-full border border-[#6366F1]/30
    Flex items-center gap-1 + green dot animate-pulse

Container: relative w-full p-4 (the chart goes inside this relative div)
```

---

## ════ PROMPT 5 — WEB3 + MEMECOIN PAGE ════

```
Rewrite frontend/src/app/(app)/web3/page.tsx and frontend/src/components/features/MemecoinCard.tsx completely.

Current issues: layout is broken, wallet card and memecoin grid are not aligned, missing market data labels.

=== PAGE: web3/page.tsx ===
"use client" — useState for walletConnected (default false), watchlist (default ["DOGE", "PEPE", "AI16Z"])

Page wrapper: div className="space-y-5"

--- HEADER ROW ---
Flex items-center justify-between:
Left: "BETA" badge (same style as ai-predict) + sub "MetaMask integration · Memecoin tracking" text-xs text-[#4A4A5A] mt-1
Right: Refresh button (same style as markets page)

--- MAIN CONTENT (grid grid-cols-3 gap-6) ---

LEFT COLUMN (col-span-1 space-y-4):

Wallet Card (bg-[#141418] border border-white/[0.07] rounded-xl overflow-hidden):
  Header (px-5 py-4 border-b border-white/[0.07] flex items-center gap-2):
    Wallet icon 16px text-[#8B5CF6]
    "Wallet" text-sm font-medium text-[#F0F0F0]
  
  Body (px-5 py-5):
  IF walletConnected === false:
    Center content (text-center py-4):
      Wallet icon: w-12 h-12 mx-auto mb-3 text-[#4A4A5A] (Wallet from lucide)
      "No wallet connected" text-sm text-[#F0F0F0] font-medium mb-1
      "Connect your MetaMask to view balances and manage tokens" text-xs text-[#4A4A5A] text-center mb-4
    Connect button (full width, onClick={() => setWalletConnected(true)}):
      bg-[#8B5CF6] text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2
      Wallet icon 16px + "Connect MetaMask"
  
  IF walletConnected === true:
    Address row (flex items-center gap-2 mb-4 p-3 bg-[#0A0A0C] rounded-lg):
      Ethereum circle: w-6 h-6 rounded-full bg-[#6366F1]/20 flex items-center justify-center text-[#6366F1] text-xs "⟠"
      "0x1a2b...9f3c" text-xs font-mono text-[#F0F0F0]
      Spacer flex-1
      "CONNECTED" text-[9px] font-bold text-[#A3E635] + green dot w-1.5 h-1.5
    
    3 balance rows (space-y-2):
    Each (flex items-center justify-between p-3 bg-[#0A0A0C] rounded-lg):
      Left: circle icon 28px + token name text-xs text-[#8A8A9A]
      Right: amount text-sm font-mono font-medium text-[#F0F0F0] + usd text-xs text-[#4A4A5A] text-right
    Data:
      ETH circle bg-[#6366F1]/20 "⟠" | "Ethereum ETH" | "2.451 ETH" / "$4,820.23"
      USDC circle bg-blue-900/40 "◎" | "USD Coin USDC" | "1,250.00" / "$1,250.00"
      BNB circle bg-yellow-900/40 "◆" | "BNB Chain BNB" | "0.85" / "$512.42"

Watchlist Card (bg-[#141418] border border-white/[0.07] rounded-xl overflow-hidden):
  Header (px-5 py-4 border-b border-white/[0.07] flex items-center justify-between):
    "Watchlist" text-sm font-medium text-[#F0F0F0]
    Badge: "{watchlist.length} coins" text-[10px] text-[#8A8A9A] bg-[#1E1E26] px-2 py-0.5 rounded-full
  
  Body (px-5 py-3 space-y-1):
  watchlist.map(coin => (
    Flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-white/[0.03]:
      Avatar: w-7 h-7 rounded-full bg colors + 2-letter abbrev text-xs font-mono
      Name: text-sm font-mono text-[#F0F0F0] flex-1
      Change: text-sm font-mono (colored) — hardcode: DOGE +5.2%, PEPE +12.4%, AI16Z +21.3%
      Delete button: Trash2 icon 13px text-[#4A4A5A] hover:text-[#F05252] cursor-pointer onClick removes from watchlist
  ))
  No watchlist items: show "No coins in watchlist" text-xs text-[#4A4A5A] text-center py-4

RIGHT SECTION (col-span-2):

Filter bar (flex items-center justify-between mb-4):
  Left tabs (flex gap-1 bg-[#141418] border border-white/[0.07] rounded-lg p-1):
    "Trending" | "Top Gainers" | "Top Losers"
    Active: bg-[#0A0A0C] text-[#F0F0F0] rounded-md px-3 py-1.5 text-xs font-medium
    Inactive: text-[#8A8A9A] px-3 py-1.5 text-xs
  Right: Refresh button small

Memecoin grid (grid grid-cols-2 gap-3):
Render 8 MemecoinCard components with this data:
{ symbol: "DOGE", name: "Dogecoin", price: "$0.08214", change: "+5.20%", positive: true, mcap: "$12.1B", vol: "$890M" }
{ symbol: "SHIB", name: "Shiba Inu", price: "$1.23e-5", change: "-2.10%", positive: false, mcap: "$7.3B", vol: "$210M" }
{ symbol: "PEPE", name: "Pepe", price: "$4.21e-6", change: "+12.40%", positive: true, mcap: "$1.8B", vol: "$520M" }
{ symbol: "FLOKI", name: "FLOKI", price: "$0.000142", change: "+6.80%", positive: true, mcap: "$1.3B", vol: "$410M" }
{ symbol: "AI16Z", name: "ai16z", price: "$1.2345", change: "+21.30%", positive: true, mcap: "$1.2B", vol: "$620M" }
{ symbol: "BRETT", name: "Brett", price: "$0.09231", change: "+3.10%", positive: true, mcap: "$920M", vol: "$180M" }
{ symbol: "GOAT", name: "Goatseus Maximus", price: "$0.3821", change: "-1.80%", positive: false, mcap: "$380M", vol: "$95M" }
{ symbol: "WIF", name: "Dogwifhat", price: "$2.34", change: "+8.90%", positive: true, mcap: "$2.3B", vol: "$450M" }

=== COMPONENT: MemecoinCard.tsx ===

Props: { symbol, name, price, change, positive, mcap, vol, inWatchlist?, onToggleWatchlist? }

Card: bg-[#141418] border border-white/[0.07] rounded-xl p-4 hover:border-white/[0.15] hover:bg-[#1a1a20] transition-all cursor-pointer

Top row (flex items-center gap-2 mb-3):
  Avatar: w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono
    Colors based on symbol: DOGE=amber, SHIB=red, PEPE=green, others=purple/blue variety
  Name section (flex-1):
    Symbol: text-sm font-mono font-bold text-[#F0F0F0]
    Name: text-xs text-[#4A4A5A]
  Star button (w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06]):
    Star icon 14px: filled text-yellow-400 if inWatchlist, outline text-[#4A4A5A] if not

Price row (mb-2):
  Price: text-xl font-mono font-bold text-[#F0F0F0]
  Change badge (inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-mono font-medium):
    Positive: bg-[#A3E635]/10 text-[#A3E635] — with ↑ TrendingUp icon 11px
    Negative: bg-[#F05252]/10 text-[#F05252] — with ↓ TrendingDown icon 11px

Stats row (flex justify-between border-t border-white/[0.05] pt-2 mt-2):
  "MCap" label text-[10px] text-[#4A4A5A] + value text-xs font-mono text-[#8A8A9A]
  "24h Vol" label + value same style
```

---

## ════ PROMPT 6 — NEWS FEED PAGE ════

```
Rewrite frontend/src/app/(app)/news/page.tsx and frontend/src/components/features/NewsCard.tsx completely.

Current design is mostly correct but needs refinement: filter tabs need active state, cards need proper category badge colors, and source attribution needs styling.

=== PAGE: news/page.tsx ===
"use client" — useState for activeFilter (default "All")

Page wrapper: div className="space-y-5"

--- HEADER ROW ---
Flex items-center justify-between:
Left:
  "RSS" badge: bg-[#F59E0B]/10 text-[#F59E0B] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#F59E0B]/20
  Sub: "Aggregated AI, tech, crypto & stock news" text-xs text-[#4A4A5A] mt-1
Right: Refresh button (same style as other pages)

--- FILTER TABS ---
Flex items-center gap-2 flex-wrap:
Filters: ["All", "AI", "Tech", "Crypto", "Stock"]
Each button (px-4 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer):
  Active (filter === activeFilter): bg-[#A3E635] text-black font-semibold
  Inactive: bg-[#141418] text-[#8A8A9A] border border-white/[0.07] hover:text-[#F0F0F0] hover:border-white/[0.15]

--- NEWS GRID (grid grid-cols-2 gap-4) ---
Render 8 NewsCard components:

Data array (filter client-side by category when activeFilter !== "All"):
{ id:1, category:"AI", title:"NVIDIA announces next-gen AI chips at GTC 2026, targets $500B market", excerpt:"Jensen Huang reveals Blackwell Ultra architecture at annual developer conference, promising 3x performance improvement for LLM training workloads.", source:"TechCrunch", time:"1h ago" }
{ id:2, category:"Crypto", title:"Bitcoin breaks $67K amid record ETF inflow surge of $1.2B in single day", excerpt:"Spot Bitcoin ETFs recorded unprecedented daily inflows as institutional adoption accelerates following favorable regulatory signals.", source:"CoinDesk", time:"2h ago" }
{ id:3, category:"Stock", title:"Fed holds rates at 4.25-4.50%, signals two cuts in 2026 as inflation cools", excerpt:"Federal Reserve maintains current range while updating dot plot projections. Markets rally on dovish tone.", source:"Reuters", time:"3h ago" }
{ id:4, category:"AI", title:"OpenAI releases GPT-5 with native multimodal reasoning at human expert level", excerpt:"The latest model achieves PhD-level performance across science, math, and coding benchmarks while reducing hallucinations by 80%.", source:"The Verge", time:"4h ago" }
{ id:5, category:"Tech", title:"Apple Vision Pro 2 specs leaked: M5 chip, improved display, $2,499 starting price", excerpt:"Apple's next spatial computing headset features significantly improved resolution and weight reduction, analyst Ming-Chi Kuo reports.", source:"MacRumors", time:"5h ago" }
{ id:6, category:"Crypto", title:"Ethereum ETF staking approval expected Q2 2026, could unlock $10B in yield", excerpt:"SEC reportedly reconsidering stance on staking rewards for Ethereum ETF products following BlackRock and Fidelity applications.", source:"Decrypt", time:"6h ago" }
{ id:7, category:"AI", title:"Meta opens LLaMA 4 weights to researchers with commercial use permitted", excerpt:"Zuckerberg confirms the commitment to open-source AI continues with their most capable model yet, outperforming GPT-4 on multiple benchmarks.", source:"Meta AI Blog", time:"12h ago" }
{ id:8, category:"Stock", title:"AI trading bots now account for 60% of US market volume, SEC launches review", excerpt:"Autonomous trading systems are shifting market microstructure fundamentally. Regulators call for new frameworks for algorithmic oversight.", source:"Financial Times", time:"1d ago" }

Filtered array: if activeFilter !== "All", filter articles where category === activeFilter.
If empty: show "No articles in this category" centered text-[#4A4A5A] py-12.

=== COMPONENT: NewsCard.tsx ===

Props: { category, title, excerpt, source, time }

Card: bg-[#141418] border border-white/[0.07] rounded-xl p-5 hover:border-white/[0.15] hover:bg-[#1a1a20] transition-all cursor-pointer h-full flex flex-col

Top row (flex items-center gap-2 mb-3):
  Category badge (px-2 py-0.5 rounded text-[9px] font-bold tracking-wider):
    AI: bg-[#6366F1]/20 text-[#6366F1]
    Crypto: bg-[#F59E0B]/20 text-[#F59E0B]
    Stock: bg-[#A3E635]/20 text-[#A3E635]
    Tech: bg-cyan-500/20 text-cyan-400
  
  Dot separator: w-1 h-1 rounded-full bg-[#4A4A5A]
  
  Time: Clock icon 11px text-[#4A4A5A] + time text-[11px] text-[#4A4A5A]
  
  Spacer flex-1
  
  Bookmark button: Bookmark icon 14px text-[#4A4A5A] hover:text-[#F0F0F0]

Title: text-sm font-medium text-[#F0F0F0] leading-relaxed mb-2 line-clamp-2 flex-1

Excerpt: text-xs text-[#8A8A9A] leading-relaxed line-clamp-2 mb-3

Source row (flex items-center gap-1.5 mt-auto):
  Source icon placeholder: w-4 h-4 rounded-sm bg-[#1E1E26] flex items-center justify-center text-[8px] text-[#4A4A5A] font-mono shrink-0
    First 2 chars of source
  Source name: text-[11px] text-[#4A4A5A]
```

---

## ════ PROMPT 7 — SETTINGS PAGE ════

```
Rewrite frontend/src/app/(app)/settings/page.tsx completely.

Current issues: background is too dark/blank at top, toggle switches are not styled, missing page title header.

"use client" — useState for:
  pushNotifications (false), priceAlerts (false), dailyDigest (false), darkMode (true)

Page wrapper: div className="space-y-5 max-w-2xl"

--- HEADER ---
"Manage your account and preferences" text-sm text-[#4A4A5A] mb-6

--- PROFILE CARD (bg-[#141418] border border-white/[0.07] rounded-xl p-6) ---
Header: User icon 16px text-[#8A8A9A] + "Profile" text-base font-semibold text-[#F0F0F0] flex items-center gap-2 mb-5

Profile summary row (flex items-center justify-between mb-5 pb-5 border-b border-white/[0.07]):
  Left: Avatar circle (w-10 h-10 rounded-full bg-[#1E1E26] flex items-center justify-center text-sm font-bold text-[#A3E635] font-mono) "NV"
        + info: "Nguyen Van A" text-sm font-medium text-[#F0F0F0] + "trader@velo.finance" text-xs text-[#4A4A5A]
  Right: "PRO TRADER" badge: border border-[#A3E635]/40 text-[#A3E635] text-[10px] font-bold px-3 py-1 rounded-full

Form grid (grid grid-cols-2 gap-4):
  Field 1: label "FULL NAME" (text-[10px] uppercase tracking-widest text-[#4A4A5A] mb-1.5)
           input: bg-[#0A0A0C] border border-white/[0.08] rounded-lg h-10 px-3 text-sm text-[#F0F0F0] focus:border-[#A3E635]/40 outline-none w-full
           defaultValue: "Nguyen Van A"
  Field 2: label "EMAIL" + input defaultValue: "trader@velo.finance"

Save button (mt-4): bg-[#A3E635] text-black text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#b5f23d] transition-colors

--- NOTIFICATIONS CARD (bg-[#141418] border border-white/[0.07] rounded-xl p-6) ---
Header: Bell icon + "Notifications"

3 toggle rows (each flex items-center justify-between py-4 border-b border-white/[0.05] last:border-0):
  Left: label text-sm text-[#F0F0F0] + sub text-xs text-[#4A4A5A] mt-0.5
  Right: custom toggle switch (use shadcn Switch component from @/components/ui/switch)
         Checked: bg-[#A3E635] (add this via className or inline CSS override)

Rows:
  "Push Notifications" / "Browser notifications for price alerts" / pushNotifications
  "Price Alerts" / "Notify when stocks hit target prices" / priceAlerts
  "Daily News Digest" / "Morning summary of top market news" / dailyDigest

--- DISPLAY CARD (bg-[#141418] border border-white/[0.07] rounded-xl p-6) ---
Header: Monitor icon + "Display"

1 toggle row (same style):
  "Dark Mode" / "Optimized for low-light trading environments" / darkMode (always true, disabled)

Note below in small text: "Light mode coming soon" text-xs text-[#4A4A5A] mt-3

--- DANGER ZONE CARD (bg-[#141418] border border-[#F05252]/20 rounded-xl p-6) ---
Header: AlertTriangle icon text-[#F05252] + "Danger Zone" text-base font-semibold text-[#F05252]

1 row (flex items-center justify-between):
  Left: "Delete Account" text-sm text-[#F0F0F0] + "Permanently delete your account and all data" text-xs text-[#4A4A5A] mt-0.5
  Right: button bg-[#F05252]/10 text-[#F05252] border border-[#F05252]/20 rounded-lg px-4 py-2 text-xs font-medium hover:bg-[#F05252]/20
         "Delete Account"

All icons from lucide-react.
```

---

## GLOBAL CSS CHECK — chạy sau tất cả các prompt trên

```
Check and update frontend/src/app/layout.tsx (root layout) and frontend/src/app/(app)/layout.tsx.

Ensure the following:

1. In frontend/src/app/layout.tsx:
   - body tag must have: className="bg-[#0A0A0C] text-[#F0F0F0] antialiased"
   - Import and apply Inter font from next/font/google
   - Import and apply JetBrains_Mono font from next/font/google as a CSS variable
   - No default white background anywhere

2. In frontend/src/app/globals.css (or create if missing):
   Add these base styles:
   ```css
   * { box-sizing: border-box; }
   body { background-color: #0A0A0C; color: #F0F0F0; }
   :root { --font-mono: 'JetBrains Mono', monospace; }
   .font-mono { font-family: var(--font-mono) !important; }
   /* Custom scrollbar */
   ::-webkit-scrollbar { width: 4px; height: 4px; }
   ::-webkit-scrollbar-track { background: transparent; }
   ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
   ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
   ```

3. In tailwind.config.ts, ensure:
   - darkMode: 'class' is set
   - fontFamily extends with mono: ['JetBrains Mono', 'monospace']
   - All custom Velo colors added to theme.extend.colors if needed

4. Verify recharts is in package.json dependencies. If not, note: run `npm install recharts` before running the AI Predict page.

5. Check that all pages in (app)/ route group properly get the AppLayout wrapper via the (app)/layout.tsx file.
```

---

## Thứ tự chạy prompts

```
1. PROMPT 1  → Sidebar + Layout (bắt buộc trước tiên, fix nền trắng + sidebar icon-only)
2. GLOBAL CSS → Chạy ngay sau Prompt 1 để đảm bảo dark theme nhất quán
3. PROMPT 2  → Dashboard
4. PROMPT 3  → Markets (fix cột PRICE bị thiếu)
5. PROMPT 4  → AI Predict (fix chart trống)
6. PROMPT 5  → Web3 + Memecoin
7. PROMPT 6  → News Feed
8. PROMPT 7  → Settings
```

---

*Velo Frontend Fix Prompts v1.0 · March 2026*
*Target files: 7 pages + 4 components + 3 layout files*

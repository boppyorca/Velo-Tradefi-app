"use client";

import Link from "next/link";
import { ShoppingCart, Sparkles, Wallet, Newspaper } from "lucide-react";

const TOP_MOVERS = [
  { ticker: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", change: "+0.80%", positive: true, color: "#1a1a2e", textColor: "#6366F1", abbr: "AA" },
  { ticker: "NVDA", name: "NVIDIA Corp.", exchange: "NASDAQ", change: "+2.40%", positive: true, color: "#1a2e1a", textColor: "#A3E635", abbr: "NV" },
  { ticker: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", change: "-0.50%", positive: false, color: "#2e1a1a", textColor: "#F05252", abbr: "TS" },
  { ticker: "MSFT", name: "Microsoft Corp.", exchange: "NASDAQ", change: "+0.68%", positive: true, color: "#1a2a2e", textColor: "#06B6D4", abbr: "MS" },
  { ticker: "AMZN", name: "Amazon.com Inc.", exchange: "NASDAQ", change: "-0.46%", positive: false, color: "#2e2a1a", textColor: "#F59E0B", abbr: "AM" },
];

const MEMECOINS = [
  { symbol: "DOGE", name: "Dogecoin", change: "+5.2%", positive: true, color: "#2e2a1a", textColor: "#F59E0B", abbr: "DO" },
  { symbol: "SHIB", name: "Shiba Inu", change: "-2.1%", positive: false, color: "#2e1a1a", textColor: "#F05252", abbr: "SH" },
  { symbol: "PEPE", name: "Pepe", change: "+12.4%", positive: true, color: "#1a2e1a", textColor: "#A3E635", abbr: "PE" },
];

const NEWS = [
  { category: "AI", categoryColor: "#6366F1", time: "1h ago", title: "NVIDIA announces next-gen AI chips at GTC 2026" },
  { category: "CRYPTO", categoryColor: "#F59E0B", time: "2h ago", title: "Bitcoin breaks $67K amid record ETF inflow" },
  { category: "AI", categoryColor: "#6366F1", time: "4h ago", title: "OpenAI releases GPT-5 with multimodal reasoning" },
];

function todayStr() {
  return new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#A3E635]">
            Welcome back, Trader
          </h1>
          <p className="text-sm text-[#8A8A9A] mt-0.5">{todayStr()}</p>
        </div>
        <div className="flex items-center gap-1.5 border border-[#A3E635]/30 rounded-full px-3 py-1">
          <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
          <span className="text-xs font-medium text-[#A3E635]">LIVE</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {/* Portfolio Value */}
        <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-[#4A4A5A] mb-3">Portfolio Value</p>
          <p className="text-2xl font-bold font-mono text-[#F0F0F0] mb-1">$12,450.32</p>
          <p className="text-sm text-[#A3E635] flex items-center gap-1">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
            +1.24% today
          </p>
        </div>

        {/* Day P&L */}
        <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-[#4A4A5A] mb-3">Day P&L</p>
          <p className="text-2xl font-bold font-mono text-[#A3E635] mb-1">+$154.20</p>
          <p className="text-sm text-[#8A8A9A]">+1.27% AAPL + TSLA</p>
        </div>

        {/* AI Confidence */}
        <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-[#4A4A5A] mb-3">AI Confidence</p>
          <p className="text-2xl font-bold font-mono text-[#6366F1] mb-1">87%</p>
          <p className="text-sm text-[#8A8A9A] mb-2">LSTM model</p>
          <div className="h-1 bg-[#1E1E26] rounded-full overflow-hidden">
            <div className="h-full bg-[#6366F1] rounded-full" style={{ width: "87%" }} />
          </div>
        </div>

        {/* Memecoin P&L */}
        <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-5">
          <p className="text-[10px] uppercase tracking-widest text-[#4A4A5A] mb-3">Memecoin P&L</p>
          <p className="text-2xl font-bold font-mono text-[#A3E635] mb-1">+8.40%</p>
          <p className="text-sm text-[#8A8A9A]">7-day return</p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left col */}
        <div className="col-span-2 space-y-4">
          {/* Top Movers */}
          <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3E635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                  <h2 className="text-sm font-medium text-[#F0F0F0]">Top Movers</h2>
                </div>
                <p className="text-xs text-[#4A4A5A]">Stocks with highest daily movement</p>
              </div>
              <Link href="/markets" className="text-xs text-[#A3E635] hover:underline">
                View all →
              </Link>
            </div>
            <div className="space-y-1">
              {TOP_MOVERS.map((s) => (
                <div
                  key={s.ticker}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-mono flex-shrink-0"
                    style={{ backgroundColor: s.color, color: s.textColor }}
                  >
                    {s.abbr}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#F0F0F0] font-mono">{s.ticker}</p>
                    <p className="text-xs text-[#4A4A5A] truncate">{s.name}</p>
                  </div>
                  <span className="text-[10px] font-mono bg-[#1E1E26] text-[#8A8A9A] px-2 py-0.5 rounded flex-shrink-0">
                    {s.exchange}
                  </span>
                  {/* Sparkline placeholder */}
                  <div className="w-16 h-8 flex-shrink-0 flex items-end gap-0.5 px-1">
                    {[0.3, 0.5, 0.4, 0.6, 0.55, 0.7, 0.65].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{
                          height: `${h * 100}%`,
                          backgroundColor: s.positive ? "#A3E635" : "#F05252",
                          opacity: 0.3 + i * 0.1,
                        }}
                      />
                    ))}
                  </div>
                  <span
                    className="text-sm font-mono font-medium flex-shrink-0 w-14 text-right"
                    style={{ color: s.positive ? "#A3E635" : "#F05252" }}
                  >
                    {s.positive ? "↑" : "↓"} {s.change}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/markets"
              className="h-10 rounded-lg bg-[#A3E635] text-black text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#b5f23d] transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Buy Stock
            </Link>
            <Link
              href="/ai-predict"
              className="h-10 rounded-lg bg-[#6366F1] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#5558e3] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Predict
            </Link>
            <Link
              href="/web3"
              className="h-10 rounded-lg bg-[#8B5CF6] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#7c4de8] transition-colors"
            >
              <Wallet className="w-3.5 h-3.5" />
              Connect Wallet
            </Link>
            <Link
              href="/news"
              className="h-10 rounded-lg bg-[#F59E0B] text-black text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#e08f0c] transition-colors"
            >
              <Newspaper className="w-3.5 h-3.5" />
              View News
            </Link>
          </div>
        </div>

        {/* Right col */}
        <div className="space-y-4">
          {/* Memecoins */}
          <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 mb-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A3E635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
                <h2 className="text-sm font-medium text-[#F0F0F0]">Live Memecoins</h2>
              </div>
              <Link href="/web3" className="text-xs text-[#A3E635] hover:underline">
                Track →
              </Link>
            </div>
            <p className="text-xs text-[#4A4A5A] mb-3">Live from CoinGecko</p>
            <div className="space-y-0">
              {MEMECOINS.map((coin) => (
                <div
                  key={coin.symbol}
                  className="flex items-center gap-3 py-2 border-b border-white/[0.05] last:border-0"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: coin.color, color: coin.textColor }}
                  >
                    {coin.abbr}
                  </div>
                  <span className="text-sm font-mono text-[#F0F0F0] flex-1">{coin.symbol}</span>
                  <span
                    className="text-sm font-mono"
                    style={{ color: coin.positive ? "#A3E635" : "#F05252" }}
                  >
                    {coin.change}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI News */}
          <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 mb-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/></svg>
                <h2 className="text-sm font-medium text-[#F0F0F0]">Latest AI News</h2>
              </div>
              <Link href="/news" className="text-xs text-[#A3E0B] hover:underline">
                All →
              </Link>
            </div>
            <div className="space-y-3">
              {NEWS.map((n, i) => (
                <div
                  key={i}
                  className="border-b border-white/[0.05] pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${n.categoryColor}20`, color: n.categoryColor }}
                    >
                      {n.category}
                    </span>
                    <span className="text-[10px] text-[#4A4A5A]">{n.time}</span>
                  </div>
                  <p className="text-xs text-[#F0F0F0] leading-relaxed line-clamp-2">{n.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

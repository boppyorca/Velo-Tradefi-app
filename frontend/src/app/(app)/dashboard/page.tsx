"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { stockApi } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { BarChart3, Brain, TrendingUp, Wallet, Newspaper } from "lucide-react";
import { StatCard } from "@/components/features";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp as TrendingUpIcon, TrendingDown, Clock } from "lucide-react";
import type { Stock } from "@/lib/types";

const MOCK_MEMECOINS = [
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", price: 0.08214, change24h: 5.2, marketCap: 12_100_000_000, volume24h: 890_000_000, image: "" },
  { id: "shiba-inu", symbol: "SHIB", name: "Shiba Inu", price: 0.00001234, change24h: -2.1, marketCap: 7_300_000_000, volume24h: 210_000_000, image: "" },
  { id: "pepe", symbol: "PEPE", name: "Pepe", price: 0.00000421, change24h: 12.4, marketCap: 1_800_000_000, volume24h: 520_000_000, image: "" },
];

const MOCK_NEWS = [
  { id: "1", title: "NVIDIA announces next-gen AI chips at GTC 2026", summary: "Jensen Huang reveals Blackwell Ultra architecture targeting $500B AI infrastructure market.", source: "TechCrunch", url: "#", publishedAt: new Date(Date.now() - 3600000).toISOString(), category: "ai" as const },
  { id: "2", title: "Bitcoin breaks $67K amid ETF inflow surge", summary: "Spot Bitcoin ETFs recorded $1.2B in daily inflows as institutional demand accelerates.", source: "CoinDesk", url: "#", publishedAt: new Date(Date.now() - 7200000).toISOString(), category: "crypto" as const },
  { id: "3", title: "Fed holds rates, signals two cuts in 2026", summary: "Federal Reserve maintains 4.25-4.50% range while updating dot plot projections.", source: "Reuters", url: "#", publishedAt: new Date(Date.now() - 14400000).toISOString(), category: "stock" as const },
];

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: stocks, isLoading: stocksLoading } = useQuery({
    queryKey: ["stocks", "top-movers"],
    queryFn: () => stockApi.list({ pageSize: 6 }),
    refetchInterval: 30_000,
    staleTime: 20_000,
  });
  const isLoading = stocksLoading;

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Welcome back, <span className="text-velo-lime">{user?.fullName ?? "Trader"}</span>
          </h1>
          <p className="text-sm text-[#8A8A9A] mt-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-[#4A4A5A]">
          <span className="w-1.5 h-1.5 bg-velo-lime rounded-full animate-pulse" />
          LIVE
        </div>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Portfolio Value"
          value="$24,815.00"
          change={1.24}
          sub="today"
        />
        <StatCard
          label="Day P&L"
          value="+$312.40"
          change={1.27}
          sub="AAPL + TSLA"
        />
        <StatCard
          label="AI Confidence"
          value="87%"
          sub="LSTM model"
        />
        <StatCard
          label="Memecoin P&L"
          value="+$891.20"
          change={8.4}
          sub="7-day"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column — Markets */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top movers */}
          <div className="rounded-2xl bg-[#141418] border border-[rgba(255,255,255,0.07)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUpIcon className="w-4 h-4 text-velo-lime" />
                  Top Movers
                </h2>
                <p className="text-xs text-[#8A8A9A] mt-0.5">Stocks with highest daily movement</p>
              </div>
              <Link href="/markets">
                <Button variant="ghost" className="text-xs text-velo-lime hover:text-velo-lime/80 h-7 px-3">
                  View all →
                </Button>
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#1E1E26]">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-lg bg-[#252530]" />
                      <div>
                        <Skeleton className="h-3.5 w-16 bg-[#252530] mb-1" />
                        <Skeleton className="h-2.5 w-28 bg-[#252530]" />
                      </div>
                    </div>
                    <div className="text-right">
                      <Skeleton className="h-3.5 w-16 bg-[#252530] mb-1" />
                      <Skeleton className="h-2.5 w-12 bg-[#252530] ml-auto" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {stocks?.map((stock) => {
                  const isUp = stock.change >= 0;
                  return (
                    <Link
                      key={stock.symbol}
                      href={`/markets/${stock.symbol}`}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#1E1E26] hover:bg-[#252530] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#0A0A0C] flex items-center justify-center">
                          <span className="text-[10px] font-black text-velo-lime">
                            {stock.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold font-mono text-white">{stock.symbol}</span>
                            <span className="text-[10px] text-[#4A4A5A] bg-[#141418] px-1.5 py-0.5 rounded">
                              {stock.exchange}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#4A4A5A] truncate max-w-[160px]">{stock.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-mono text-white">
                          {stock.exchange === "HOSE"
                            ? `₫${stock.price.toLocaleString("vi-VN")}`
                            : `$${stock.price.toFixed(2)}`}
                        </p>
                        <div className="flex items-center gap-1.5 justify-end mt-0.5">
                          {isUp ? (
                            <TrendingUpIcon size={10} className="text-velo-lime" />
                          ) : (
                            <TrendingDown size={10} className="text-velo-red" />
                          )}
                          <span className={`text-[11px] font-mono ${isUp ? "text-velo-lime" : "text-velo-red"}`}>
                            {isUp ? "+" : ""}{stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/ai-predict">
              <div className="group p-4 rounded-2xl bg-[#141418] border border-velo-indigo/20 hover:border-velo-indigo/40 transition-all cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-velo-indigo/10 flex items-center justify-center mb-3">
                  <Brain className="w-4 h-4 text-velo-indigo" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">AI Predictions</h3>
                <p className="text-xs text-[#8A8A9A]">Get 7-day forecasts</p>
              </div>
            </Link>
            <Link href="/web3">
              <div className="group p-4 rounded-2xl bg-[#141418] border border-velo-purple/20 hover:border-velo-purple/40 transition-all cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-velo-purple/10 flex items-center justify-center mb-3">
                  <Wallet className="w-4 h-4 text-velo-purple" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Web3 Wallet</h3>
                <p className="text-xs text-[#8A8A9A]">Connect MetaMask</p>
              </div>
            </Link>
            <Link href="/markets">
              <div className="group p-4 rounded-2xl bg-[#141418] border border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-velo-lime/10 flex items-center justify-center mb-3">
                  <BarChart3 className="w-4 h-4 text-velo-lime" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Markets</h3>
                <p className="text-xs text-[#8A8A9A]">Browse all stocks</p>
              </div>
            </Link>
            <Link href="/news">
              <div className="group p-4 rounded-2xl bg-[#141418] border border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.15)] transition-all cursor-pointer">
                <div className="w-9 h-9 rounded-xl bg-velo-amber/10 flex items-center justify-center mb-3">
                  <Newspaper className="w-4 h-4 text-velo-amber" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">News Feed</h3>
                <p className="text-xs text-[#8A8A9A]">AI & tech news</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Memecoin snapshot */}
          <div className="rounded-2xl bg-[#141418] border border-velo-purple/20 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <TrendingUpIcon className="w-4 h-4 text-velo-purple" />
                  Memecoins
                </h2>
                <p className="text-xs text-[#8A8A9A] mt-0.5">Live from CoinGecko</p>
              </div>
              <Link href="/web3">
                <Button variant="ghost" className="text-xs text-velo-purple h-7 px-3">
                  Track →
                </Button>
              </Link>
            </div>
            <div className="space-y-2">
              {MOCK_MEMECOINS.map((coin) => {
                const isUp = coin.change24h >= 0;
                return (
                  <div
                    key={coin.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[#1E1E26] hover:bg-[#252530] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-velo-purple/20 flex items-center justify-center">
                        <span className="text-[8px] font-black text-velo-purple">
                          {coin.symbol.slice(0, 2)}
                        </span>
                      </div>
                      <span className="text-xs font-bold font-mono text-white">{coin.symbol}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-mono text-white">
                        {coin.price < 0.001
                          ? coin.price.toExponential(2)
                          : `$${coin.price.toFixed(5)}`}
                      </p>
                      <p className={`text-[10px] font-mono ${isUp ? "text-velo-lime" : "text-velo-red"}`}>
                        {isUp ? "+" : ""}{coin.change24h.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* News feed */}
          <div className="rounded-2xl bg-[#141418] border border-[rgba(255,255,255,0.07)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Newspaper className="w-4 h-4 text-velo-amber" />
                  Latest News
                </h2>
              </div>
              <Link href="/news">
                <Button variant="ghost" className="text-xs text-velo-amber h-7 px-3">
                  All →
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {MOCK_NEWS.map((n) => (
                <a
                  key={n.id}
                  href={n.url}
                  className="group block p-3 rounded-xl bg-[#1E1E26] hover:bg-[#252530] transition-colors"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-velo-amber bg-velo-amber/10 px-1.5 py-0.5 rounded">
                      {n.category}
                    </span>
                    <span className="text-[10px] text-[#4A4A5A] flex items-center gap-0.5">
                      <Clock size={8} />
                      {timeAgo(n.publishedAt)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-white leading-snug group-hover:text-velo-lime transition-colors line-clamp-2">
                    {n.title}
                  </p>
                  <p className="text-[10px] text-[#4A4A5A] mt-0.5">{n.source}</p>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

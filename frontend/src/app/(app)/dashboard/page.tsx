"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/lib/auth-store";
import { stockApi, memecoinApi, newsApi } from "@/lib/api-client";
import { useStockSignalR, LiveBadge } from "@/lib/useStockSignalR";
import type { Memecoin, MemecoinsResponse, NewsResponse } from "@/lib/types";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Sparkles,
  Wallet,
  Newspaper,
  ArrowRight,
} from "lucide-react";

function todayStr() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatPrice(price: number, symbol: string): string {
  const isVN =
    symbol === "VNM" ||
    symbol === "VIC" ||
    symbol === "HPG" ||
    symbol === "FPT" ||
    symbol === "TCB" ||
    symbol === "MWG" ||
    symbol === "MSN";
  if (isVN) return `₫${price.toLocaleString("vi-VN")}`;
  return `$${price.toFixed(2)}`;
}

function formatLargeNum(n: number, currency: "USD" | "VND" = "USD") {
  if (currency === "VND") {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    return `₫${n.toLocaleString("vi-VN")}`;
  }
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  ai: { bg: "#6366F120", text: "#6366F1" },
  crypto: { bg: "#F59E0B20", text: "#F59E0B" },
  stock: { bg: "#A3E63520", text: "#A3E635" },
  tech: { bg: "#06B6D420", text: "#06B6D4" },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const router = useRouter();

  const greeting = user?.fullName
    ? `Welcome back, ${user.fullName.split(" ")[0]}`
    : "Welcome back, Trader";

  // ── SignalR real-time connection ──────────────────────────────────────────
  // Subscribe to all markets (VN + US) for real-time updates
  // SignalR updates are merged into React Query cache automatically
  const { connectionStatus } = useStockSignalR({});

  // ── Data queries ─────────────────────────────────────────────────────────
  // Polling kept as fallback: when SignalR disconnects (e.g. network loss),
  // React Query polling ensures data still refreshes.
  const { data: stocks, isLoading: stocksLoading } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => stockApi.list({ pageSize: 50 }),
    staleTime: 30_000,
    // Much longer interval — SignalR handles real-time updates; polling is fallback only
    refetchInterval: connectionStatus === "connected" ? false : 30_000,
    retry: 1,
  });

  const { data: memecoins, isLoading: memecoinsLoading } = useQuery({
    queryKey: ["memecoins-dashboard"],
    queryFn: () => memecoinApi.list({ pageSize: 6 }),
    staleTime: 15_000,
    // Memecoins don't have SignalR — keep polling
    refetchInterval: 30_000,
    retry: 1,
  });

  const { data: newsItems, isLoading: newsLoading } = useQuery({
    queryKey: ["news-dashboard"],
    queryFn: () => newsApi.list({ pageSize: 5 }),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const newsList = newsItems
    ? Array.isArray(newsItems)
      ? newsItems
      : (newsItems as NewsResponse).data ?? []
    : [];

  // Top movers: top 5 by absolute change
  const topMovers = [...(stocks ?? [])]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 5);

  // Top memecoins: by volume
  const memecoinList: Memecoin[] =
    memecoins
      ? Array.isArray(memecoins)
        ? memecoins
        : (memecoins as MemecoinsResponse).data ?? []
      : [];
  const topCoins = memecoinList.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#A3E635]">{greeting}</h1>
          <p className="text-sm text-[#8A8A9A] mt-0.5">{todayStr()}</p>
        </div>
        <LiveBadge />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left col — Top Movers + Quick Actions */}
        <div className="col-span-2 space-y-4">
          {/* Top Movers */}
          <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <TrendingUp className="w-4 h-4 text-[#A3E635]" />
                  <h2 className="text-sm font-medium text-[#F0F0F0]">Top Movers</h2>
                </div>
                <p className="text-xs text-[#4A4A5A]">Stocks with highest daily movement</p>
              </div>
              <Link href="/markets" className="text-xs text-[#A3E635] hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {stocksLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 rounded-lg bg-[#1E1E26] animate-pulse" />
                ))}
              </div>
            ) : topMovers.length === 0 ? (
              <p className="text-sm text-[#4A4A5A] py-8 text-center">
                No market data. Start the backend and refresh.
              </p>
            ) : (
              <div className="space-y-1">
                {topMovers.map((s) => {
                  const isUp = s.changePercent >= 0;
                  return (
                    <div
                      key={s.symbol}
                      onClick={() => router.push(`/markets/${s.symbol}`)}
                      className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-white/[0.03] cursor-pointer transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 bg-[#1E1E26] text-[#8A8A9A]">
                        {s.symbol.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#F0F0F0] font-mono">{s.symbol}</p>
                        <p className="text-xs text-[#4A4A5A] truncate">{s.name}</p>
                      </div>
                      <span className="text-[10px] font-mono bg-[#1E1E26] text-[#8A8A9A] px-2 py-0.5 rounded flex-shrink-0">
                        {s.exchange}
                      </span>
                      <div className="text-right flex-shrink-0 min-w-[72px]">
                        <p className="text-sm font-mono font-medium text-[#F0F0F0]">
                          {formatPrice(s.price, s.symbol)}
                        </p>
                        <div className="flex items-center justify-end gap-0.5">
                          {isUp ? (
                            <TrendingUp className="w-3 h-3 text-[#A3E635]" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-[#F05252]" />
                          )}
                          <span
                            className={cn(
                              "text-[10px] font-mono font-medium",
                              isUp ? "text-[#A3E635]" : "text-[#F05252]"
                            )}
                          >
                            {isUp ? "+" : ""}
                            {s.changePercent.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/markets"
              className="h-10 rounded-lg bg-[#A3E635] text-black text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#b5f23d] transition-colors"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Explore Markets
            </Link>
            <Link
              href="/ai-predict"
              className="h-10 rounded-lg bg-[#6366F1] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#5558e3] transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              AI Prediction
            </Link>
            <Link
              href="/web3"
              className="h-10 rounded-lg bg-[#8B5CF6] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#7c4de8] transition-colors"
            >
              <Wallet className="w-3.5 h-3.5" />
              Memecoins
            </Link>
            <Link
              href="/news"
              className="h-10 rounded-lg bg-[#F59E0B] text-black text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#e08f0c] transition-colors"
            >
              <Newspaper className="w-3.5 h-3.5" />
              Latest News
            </Link>
          </div>
        </div>

        {/* Right col — Memecoins + News */}
        <div className="space-y-4">
          {/* Memecoins */}
          <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 mb-0.5">
                <TrendingUp className="w-4 h-4 text-[#8B5CF6]" />
                <h2 className="text-sm font-medium text-[#F0F0F0]">Memecoins</h2>
              </div>
              <Link href="/web3" className="text-xs text-[#8B5CF6] hover:underline flex items-center gap-1">
                Track <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {memecoinsLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-[#1E1E26] animate-pulse" />
                ))}
              </div>
            ) : topCoins.length === 0 ? (
              <p className="text-xs text-[#4A4A5A] py-4 text-center">
                No memecoin data. Start the backend and refresh.
              </p>
            ) : (
              <div className="space-y-0">
                {topCoins.map((coin) => {
                  const isUp = coin.change24h >= 0;
                  return (
                    <div
                      key={coin.id}
                      className="flex items-center gap-3 py-2.5 border-b border-white/[0.05] last:border-0"
                    >
                      {coin.image ? (
                        <img
                          src={coin.image}
                          alt={coin.name}
                          className="w-7 h-7 rounded-full flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#1E1E26] flex items-center justify-center text-[10px] font-bold text-[#8A8A9A] flex-shrink-0">
                          {coin.symbol.slice(0, 2)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#F0F0F0] font-mono">{coin.symbol}</p>
                        <p className="text-[10px] text-[#4A4A5A] truncate">{coin.name}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-mono font-medium text-[#F0F0F0]">
                          ${coin.price.toFixed(6)}
                        </p>
                        <div className="flex items-center justify-end gap-0.5">
                          {isUp ? (
                            <TrendingUp className="w-3 h-3 text-[#A3E635]" />
                          ) : (
                            <TrendingDown className="w-3 h-3 text-[#F05252]" />
                          )}
                          <span
                            className={cn(
                              "text-[10px] font-mono",
                              isUp ? "text-[#A3E635]" : "text-[#F05252]"
                            )}
                          >
                            {isUp ? "+" : ""}
                            {coin.change24h.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Latest News */}
          <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 mb-0.5">
                <Newspaper className="w-4 h-4 text-[#F59E0B]" />
                <h2 className="text-sm font-medium text-[#F0F0F0]">Latest News</h2>
              </div>
              <Link href="/news" className="text-xs text-[#F59E0B] hover:underline flex items-center gap-1">
                All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {newsLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="h-3 w-20 rounded bg-[#1E1E26] animate-pulse" />
                    <div className="h-8 rounded bg-[#1E1E26] animate-pulse" />
                  </div>
                ))}
              </div>
            ) : newsList.length === 0 ? (
              <p className="text-xs text-[#4A4A5A] py-4 text-center">
                No news available. Start the backend and refresh.
              </p>
            ) : (
              <div className="space-y-3">
                {newsList.slice(0, 5).map((n) => {
                  const colors = CATEGORY_COLORS[n.category] ?? CATEGORY_COLORS.tech;
                  return (
                    <a
                      key={n.id}
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border-b border-white/[0.05] pb-3 last:border-0 last:pb-0 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase"
                          style={{ backgroundColor: colors.bg, color: colors.text }}
                        >
                          {n.category}
                        </span>
                        <span className="text-[10px] text-[#4A4A5A]">
                          {timeAgo(n.publishedAt)}
                        </span>
                      </div>
                      <p className="text-xs text-[#F0F0F0] leading-relaxed line-clamp-2">
                        {n.title}
                      </p>
                      <p className="text-[10px] text-[#4A4A5A] mt-0.5">{n.source}</p>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

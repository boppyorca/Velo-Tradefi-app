"use client";

import { useState } from "react";
import { Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stock } from "@/lib/types";

function watchlistMarketForExchange(exchange: Stock["exchange"]): "VN" | "US" {
  return exchange === "HOSE" || exchange === "HNX" ? "VN" : "US";
}

interface StockTableProps {
  stocks: Stock[];
  loading?: boolean;
  error?: Error;
  /** Keys like `AAPL:US` or `VNM:VN` */
  watchedKeys?: Set<string>;
  onToggleWatchlist: (symbol: string, exchange: Stock["exchange"]) => void;
  onSymbolClick: (symbol: string) => void;
}

const MARKET_COLORS: Record<string, string> = {
  NASDAQ: "bg-[#1a1a2e] text-[#6366F1]",
  NYSE: "bg-[#2e1a1a] text-[#F59E0B]",
  HOSE: "bg-[#1a2e1a] text-[#A3E635]",
  HNX: "bg-[#1a1a2e] text-[#06B6D4]",
};

type MarketFilter = "All" | "VN" | "US";

function formatPrice(price: number, exchange: string) {
  if (exchange === "HOSE" || exchange === "HNX") {
    return `${price.toLocaleString("vi-VN")} ₫`;
  }
  return `$${price.toFixed(2)}`;
}

function formatVolume(volume: number) {
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(1)}B`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `${(volume / 1_000).toFixed(0)}K`;
  return volume.toString();
}

export function StockTable({
  stocks,
  loading,
  watchedKeys = new Set(),
  onToggleWatchlist,
  onSymbolClick,
}: StockTableProps) {
  const [search, setSearch] = useState("");
  const [market, setMarket] = useState<MarketFilter>("All");

  const filtered = stocks.filter((s) => {
    const matchesSearch =
      !search ||
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase());
    const matchesMarket =
      market === "All" ||
      (market === "VN" && (s.exchange === "HOSE" || s.exchange === "HNX")) ||
      (market === "US" && (s.exchange === "NASDAQ" || s.exchange === "NYSE"));
    return matchesSearch && matchesMarket;
  });

  const MARKET_FILTERS: MarketFilter[] = ["All", "VN", "US"];

  return (
    <div className="bg-[#141418] border border-white/[0.07] rounded-xl overflow-hidden">
      {/* Controls */}
      <div className="flex items-center gap-3 p-4 border-b border-white/[0.04]">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A5A] pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ticker or name..."
            className="w-full bg-[#141418] border border-white/[0.08] rounded-lg h-9 pl-9 pr-3 text-[13px] text-[#F0F0F0] placeholder-[#4A4A5A] focus:outline-none focus:border-white/20"
          />
        </div>

        {/* Market filter tabs */}
        <div className="flex gap-1 bg-[#141418] border border-white/[0.08] rounded-lg p-1">
          {MARKET_FILTERS.map((m) => (
            <button
              key={m}
              onClick={() => setMarket(m)}
              className={cn(
                "px-4 py-1.5 text-xs font-medium transition-colors rounded-md",
                market === m
                  ? "bg-[#0A0A0C] text-[#F0F0F0] shadow-sm"
                  : "text-[#8A8A9A] hover:text-[#F0F0F0]"
              )}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div>
        {/* Header */}
        <div className="grid px-4 py-3 bg-[#1E1E26] border-b border-white/[0.07]"
          style={{ gridTemplateColumns: "40px 1fr 120px 100px 100px 100px 120px" }}
        >
          <span />
          <span className="text-[10px] uppercase tracking-widest text-[#4A4A5A] font-medium">Symbol</span>
          <span className="text-[10px] uppercase tracking-widest text-[#4A4A5A] font-medium">Price</span>
          <span className="text-[10px] uppercase tracking-widest text-[#4A4A5A] font-medium">Change</span>
          <span className="text-[10px] uppercase tracking-widest text-[#4A4A5A] font-medium">%</span>
          <span className="text-[10px] uppercase tracking-widest text-[#4A4A5A] font-medium">Volume</span>
          <span className="text-[10px] uppercase tracking-widest text-[#4A4A5A] font-medium">Market</span>
        </div>

        {/* Rows */}
        {loading ? (
          <div className="p-8 text-center text-[#4A4A5A] text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-[#4A4A5A] text-sm">No stocks found</div>
        ) : (
          filtered.map((stock) => {
            const isUp = stock.change >= 0;
            const changeColor = isUp ? "text-[#A3E635]" : "text-[#F05252]";
            const wlMarket = watchlistMarketForExchange(stock.exchange);
            const isWatched = watchedKeys.has(`${stock.symbol}:${wlMarket}`);
            const marketStyle = MARKET_COLORS[stock.exchange] ?? "bg-[#1E1E26] text-[#8A8A9A]";

            return (
              <div
                key={stock.symbol}
                className={cn(
                  "grid items-center px-4 py-3.5 border-b border-white/[0.04] transition-colors cursor-pointer",
                  isWatched
                    ? "bg-[#F59E0B]/[0.06] hover:bg-[#F59E0B]/[0.09]"
                    : "hover:bg-white/[0.02]"
                )}
                style={{ gridTemplateColumns: "40px 1fr 120px 100px 100px 100px 120px" }}
                onClick={() => onSymbolClick(stock.symbol)}
              >
                {/* Star */}
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    aria-label={isWatched ? "Remove from watchlist" : "Add to watchlist"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatchlist(stock.symbol, stock.exchange);
                    }}
                    className={cn(
                      "p-1.5 rounded-lg transition-all duration-200",
                      isWatched
                        ? "bg-[#F59E0B]/20 ring-1 ring-[#F59E0B]/55 shadow-[0_0_14px_rgba(245,158,11,0.18)]"
                        : "hover:bg-white/[0.06] ring-1 ring-transparent"
                    )}
                  >
                    <Star
                      className={cn(
                        "w-[15px] h-[15px] transition-all duration-200",
                        isWatched
                          ? "fill-[#F59E0B] text-[#F59E0B] drop-shadow-[0_0_6px_rgba(245,158,11,0.45)]"
                          : "text-[#4A4A5A]"
                      )}
                    />
                  </button>
                </div>

                {/* Symbol + Name */}
                <div>
                  <p className="text-sm font-medium font-mono text-[#F0F0F0]">{stock.symbol}</p>
                  <p className="text-xs text-[#4A4A5A] mt-0.5 truncate">{stock.name}</p>
                </div>

                {/* PRICE — was missing! */}
                <p className="text-sm font-mono text-[#F0F0F0] font-medium">
                  {formatPrice(stock.price, stock.exchange)}
                </p>

                {/* Change absolute */}
                <p className={cn("text-sm font-mono", changeColor)}>
                  {isUp ? "+" : ""}{stock.change.toFixed(2)}
                </p>

                {/* Change % */}
                <p className={cn("text-sm font-mono", changeColor)}>
                  {isUp ? "+" : ""}{stock.changePercent.toFixed(2)}%
                </p>

                {/* Volume */}
                <p className="text-sm font-mono text-[#8A8A9A]">
                  {formatVolume(stock.volume)}
                </p>

                {/* Market */}
                <div>
                  <span className={cn("text-[10px] font-mono font-bold px-2.5 py-1 rounded", marketStyle)}>
                    {stock.exchange}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

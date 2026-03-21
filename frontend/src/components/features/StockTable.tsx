"use client";

import { useState } from "react";
import { Search, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stock } from "@/lib/types";

interface StockTableProps {
  stocks: Stock[];
  loading?: boolean;
  error?: Error;
  watchedSymbols: Set<string>;
  onToggleWatchlist: (symbol: string) => void;
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
  watchedSymbols,
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
            const isWatched = watchedSymbols.has(stock.symbol);
            const marketStyle = MARKET_COLORS[stock.exchange] ?? "bg-[#1E1E26] text-[#8A8A9A]";

            return (
              <div
                key={stock.symbol}
                className="grid items-center px-4 py-3.5 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                style={{ gridTemplateColumns: "40px 1fr 120px 100px 100px 100px 120px" }}
                onClick={() => onSymbolClick(stock.symbol)}
              >
                {/* Star */}
                <div className="flex items-center justify-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); onToggleWatchlist(stock.symbol); }}
                    className="p-1 rounded hover:bg-white/[0.05] transition-colors"
                  >
                    <Star
                      className={cn("w-[15px] h-[15px]", isWatched ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#4A4A5A]")}
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

"use client";

import { useState, useMemo } from "react";
import { Search, Star, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StockCard } from "./StockCard";
import type { Stock } from "@/lib/types";

function formatStockPrice(stock: Stock): string {
  const p = stock.price;
  if (!Number.isFinite(p)) return "—";
  if (stock.exchange === "HOSE" || stock.exchange === "HNX") {
    return p.toLocaleString("vi-VN", { maximumFractionDigits: 0 });
  }
  return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface StockTableProps {
  stocks: Stock[];
  loading?: boolean;
  error?: Error | null;
  onToggleWatchlist?: (symbol: string) => void;
  watchedSymbols?: Set<string>;
  onSymbolClick?: (symbol: string) => void;
}

type SortKey = "symbol" | "price" | "change" | "changePercent" | "volume";
type SortDir = "asc" | "desc";

const EXCHANGES = ["All", "VN", "US"] as const;
type ExchangeFilter = (typeof EXCHANGES)[number];

export function StockTable({
  stocks,
  loading = false,
  error = null,
  onToggleWatchlist,
  watchedSymbols,
  onSymbolClick,
}: StockTableProps) {
  const [search, setSearch] = useState("");
  const [exchange, setExchange] = useState<ExchangeFilter>("All");
  const [sortKey, setSortKey] = useState<SortKey>("symbol");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    let result = stocks;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          s.symbol.toLowerCase().includes(q) ||
          s.name.toLowerCase().includes(q)
      );
    }

    if (exchange === "VN") {
      result = result.filter((s) => s.exchange === "HOSE" || s.exchange === "HNX");
    } else if (exchange === "US") {
      result = result.filter((s) => s.exchange === "NYSE" || s.exchange === "NASDAQ");
    }

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "symbol":
          cmp = a.symbol.localeCompare(b.symbol);
          break;
        case "price":
          cmp = a.price - b.price;
          break;
        case "change":
          cmp = a.change - b.change;
          break;
        case "changePercent":
          cmp = a.changePercent - b.changePercent;
          break;
        case "volume":
          cmp = a.volume - b.volume;
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [stocks, search, exchange, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-velo-red text-sm mb-2">Failed to load market data</p>
        <p className="text-[#8A8A9A] text-xs">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4A5A] w-4 h-4" />
          <Input
            className="pl-9 h-9 bg-[#1E1E26] border-0 rounded-lg text-sm placeholder:text-[#4A4A5A]"
            placeholder="Search ticker or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Exchange filter */}
        <div className="flex items-center bg-[#1E1E26] rounded-lg p-1 gap-1">
          {EXCHANGES.map((ex) => (
            <button
              key={ex}
              onClick={() => setExchange(ex)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                exchange === ex
                  ? "bg-velo-lime text-[#0A0A0C]"
                  : "text-[#8A8A9A] hover:text-white"
              }`}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-[rgba(255,255,255,0.07)]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.07)] bg-[#0F0F13]">
              {[
                { key: "symbol" as SortKey, label: "Symbol" },
                { key: "price" as SortKey, label: "Price" },
                { key: "change" as SortKey, label: "Change" },
                { key: "changePercent" as SortKey, label: "%" },
                { key: "volume" as SortKey, label: "Volume" },
              ].map(({ key, label }) => (
                <th
                  key={key}
                  className="px-4 py-3 text-left text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest cursor-pointer hover:text-[#8A8A9A] transition-colors select-none"
                  onClick={() => handleSort(key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {label}
                    {sortKey === key && (
                      <span className="text-velo-lime">{sortDir === "asc" ? "↑" : "↓"}</span>
                    )}
                  </span>
                </th>
              ))}
              <th className="px-4 py-3 text-right text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest">
                Market
              </th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-[rgba(255,255,255,0.04)]"
                  >
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <Skeleton className="h-4 w-20 bg-[#1E1E26]" />
                      </td>
                    ))}
                  </tr>
                ))
              : filtered.map((stock) => (
                  <tr
                    key={stock.symbol}
                    className="border-b border-[rgba(255,255,255,0.04)] hover:bg-[#1E1E26]/50 transition-colors cursor-pointer"
                    onClick={() => onSymbolClick?.(stock.symbol)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {onToggleWatchlist && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleWatchlist(stock.symbol);
                            }}
                            className={`p-0.5 rounded transition-colors ${
                              watchedSymbols?.has(stock.symbol)
                                ? "text-velo-lime"
                                : "text-[#4A4A5A] hover:text-[#8A8A9A]"
                            }`}
                          >
                            <Star
                              size={12}
                              className={
                                watchedSymbols?.has(stock.symbol)
                                  ? "fill-current"
                                  : ""
                              }
                            />
                          </button>
                        )}
                        <span className="font-mono font-bold text-white">
                          {stock.symbol}
                        </span>
                      </div>
                      <p className="text-xs text-[#4A4A5A] truncate max-w-[160px]">
                        {stock.name}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-white tabular-nums">
                      {stock.exchange === "HOSE" || stock.exchange === "HNX" ? (
                        <span title="VND">{formatStockPrice(stock)} ₫</span>
                      ) : (
                        <span>${formatStockPrice(stock)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`font-mono text-xs ${
                          stock.change >= 0 ? "text-velo-lime" : "text-velo-red"
                        }`}
                      >
                        {stock.change >= 0 ? "+" : ""}
                        {stock.change.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-1.5 py-0.5 rounded text-xs font-mono ${
                          stock.changePercent >= 0
                            ? "bg-velo-lime/10 text-velo-lime"
                            : "bg-velo-red/10 text-velo-red"
                        }`}
                      >
                        {stock.changePercent >= 0 ? "+" : ""}
                        {stock.changePercent.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#8A8A9A] text-xs">
                      {stock.volume >= 1_000_000
                        ? `${(stock.volume / 1_000_000).toFixed(1)}M`
                        : stock.volume >= 1_000
                        ? `${(stock.volume / 1_000).toFixed(1)}K`
                        : stock.volume.toString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs font-medium text-[#4A4A5A] bg-[#1E1E26] px-2 py-0.5 rounded">
                        {stock.exchange}
                      </span>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-[#8A8A9A] text-sm">No stocks found</p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-2 text-xs text-velo-lime hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

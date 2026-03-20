"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Star, StarOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Stock } from "@/lib/types";

interface StockCardProps {
  stock: Stock;
  onToggleWatchlist?: (symbol: string) => void;
  isWatched?: boolean;
  onClick?: () => void;
}

export function StockCard({
  stock,
  onToggleWatchlist,
  isWatched = false,
  onClick,
}: StockCardProps) {
  const isPositive = stock.change >= 0;

  return (
    <div
      className={cn(
        "group relative p-4 rounded-xl bg-[#141418] border border-[rgba(255,255,255,0.07)]",
        "hover:border-[rgba(255,255,255,0.15)] hover:bg-[#1A1A20]",
        "transition-all duration-200 cursor-pointer",
        onClick ? "" : ""
      )}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Watchlist toggle */}
      {onToggleWatchlist && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWatchlist(stock.symbol);
          }}
          className={cn(
            "absolute top-3 right-3 p-1 rounded transition-colors",
            "opacity-0 group-hover:opacity-100",
            isWatched ? "text-velo-lime" : "text-[#4A4A5A] hover:text-[#8A8A9A]"
          )}
          aria-label={isWatched ? "Remove from watchlist" : "Add to watchlist"}
        >
          {isWatched ? (
            <Star size={12} className="fill-current" />
          ) : (
            <StarOff size={12} />
          )}
        </button>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-white font-mono">{stock.symbol}</span>
            <span className="text-[10px] font-medium text-[#4A4A5A] bg-[#1E1E26] px-1.5 py-0.5 rounded">
              {stock.exchange}
            </span>
          </div>
          <p className="text-xs text-[#8A8A9A] truncate max-w-[140px]">{stock.name}</p>
        </div>
      </div>

      {/* Price */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-lg font-bold text-white font-mono">
            ${stock.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="flex items-center gap-1.5 mt-1">
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-mono",
                isPositive ? "text-velo-lime" : "text-velo-red"
              )}
            >
              {isPositive ? (
                <TrendingUp size={10} />
              ) : (
                <TrendingDown size={10} />
              )}
              {isPositive ? "+" : ""}{stock.change.toFixed(2)}
            </span>
            <span
              className={cn(
                "text-xs font-mono px-1.5 py-0.5 rounded",
                isPositive
                  ? "bg-velo-lime/10 text-velo-lime"
                  : "bg-velo-red/10 text-velo-red"
              )}
            >
              {isPositive ? "+" : ""}{stock.changePercent.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Volume */}
        <div className="text-right">
          <p className="text-[10px] text-[#4A4A5A] mb-0.5">VOL</p>
          <p className="text-xs font-mono text-[#8A8A9A]">
            {formatVolume(stock.volume)}
          </p>
        </div>
      </div>
    </div>
  );
}

function formatVolume(vol: number): string {
  if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(1)}B`;
  if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `${(vol / 1_000).toFixed(1)}K`;
  return vol.toString();
}

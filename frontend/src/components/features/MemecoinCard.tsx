"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Memecoin } from "@/lib/types";

interface MemecoinCardProps {
  coin: Memecoin;
  onToggleWatchlist?: (id: string) => void;
  isWatched?: boolean;
}

export function MemecoinCard({
  coin,
  onToggleWatchlist,
  isWatched = false,
}: MemecoinCardProps) {
  const isPositive = coin.change24h >= 0;

  return (
    <div className="group relative p-4 rounded-xl bg-[#141418] border border-[rgba(255,255,255,0.07)] hover:border-velo-purple/30 hover:bg-[#1A1A20] transition-all duration-200">
      {onToggleWatchlist && (
        <button
          onClick={() => onToggleWatchlist(coin.id)}
          className={cn(
            "absolute top-3 right-3 p-1 rounded transition-all",
            "opacity-0 group-hover:opacity-100",
            isWatched ? "text-velo-purple" : "text-[#4A4A5A] hover:text-[#8A8A9A]"
          )}
        >
          {isWatched ? (
            <StarIcon className="fill-current" />
          ) : (
            <StarIcon />
          )}
        </button>
      )}

      <div className="flex items-center gap-3 mb-3">
        {coin.image ? (
          <img
            src={coin.image}
            alt={coin.name}
            className="w-8 h-8 rounded-full"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-velo-purple/20 flex items-center justify-center">
            <span className="text-xs font-bold text-velo-purple">
              {coin.symbol.slice(0, 2)}
            </span>
          </div>
        )}
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">{coin.symbol}</span>
            <span className="text-xs text-[#4A4A5A]">{coin.name}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-lg font-bold font-mono text-white">
          ${coin.price < 0.0001 ? coin.price.toExponential(2) : coin.price.toLocaleString("en-US", { maximumFractionDigits: 6 })}
        </p>
        <div className="flex items-center justify-between">
          <div
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-mono font-semibold",
              isPositive
                ? "bg-velo-lime/10 text-velo-lime"
                : "bg-velo-red/10 text-velo-red"
            )}
          >
            {isPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {isPositive ? "+" : ""}{coin.change24h.toFixed(2)}%
          </div>
          <div className="text-right">
            <p className="text-[10px] text-[#4A4A5A]">MCap</p>
            <p className="text-xs font-mono text-[#8A8A9A]">
              {formatLargeNum(coin.marketCap)}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#4A4A5A]">24h Vol</span>
          <span className="font-mono text-[#8A8A9A]">{formatLargeNum(coin.volume24h)}</span>
        </div>
      </div>
    </div>
  );
}

function StarIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

function formatLargeNum(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

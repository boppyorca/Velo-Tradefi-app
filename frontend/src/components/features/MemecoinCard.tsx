"use client";

import Image from "next/image";
import { TrendingUp, TrendingDown, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemecoinCardProps {
  symbol: string;
  name: string;
  price: string;
  change: string;
  positive: boolean;
  mcap: string;
  vol: string;
  image?: string | null;
  inWatchlist?: boolean;
  onToggleWatchlist?: () => void;
}

const SYMBOL_COLORS: Record<string, { bg: string; text: string }> = {
  DOGE: { bg: "bg-[#2e2a1a]", text: "text-[#F59E0B]" },
  SHIB: { bg: "bg-[#2e1a1a]", text: "text-[#F05252]" },
  PEPE: { bg: "bg-[#1a2e1a]", text: "text-[#A3E635]" },
  FLOKI: { bg: "bg-[#2a1a2a]", text: "text-[#8B5CF6]" },
  AI16Z: { bg: "bg-[#1a1a2e]", text: "text-[#6366F1]" },
  BRETT: { bg: "bg-[#1a2a2e]", text: "text-[#06B6D4]" },
  GOAT: { bg: "bg-[#2e2a1a]", text: "text-[#F59E0B]" },
  WIF: { bg: "bg-[#1a2e1a]", text: "text-[#A3E635]" },
};

function getColors(symbol: string) {
  return SYMBOL_COLORS[symbol] ?? { bg: "bg-[#1a1a2e]", text: "text-[#8B5CF6]" };
}

export function MemecoinCard({
  symbol,
  name,
  price,
  change,
  positive,
  mcap,
  vol,
  image,
  inWatchlist,
  onToggleWatchlist,
}: MemecoinCardProps) {
  const colors = getColors(symbol);

  return (
    <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-4 hover:border-white/[0.15] hover:bg-[#1a1a20] transition-all cursor-pointer">
      {/* Top row */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold font-mono flex-shrink-0 overflow-hidden", colors.bg)}>
          {image ? (
            <Image src={image} alt={symbol} width={36} height={36} className="object-cover w-full h-full" unoptimized />
          ) : (
            <span className={colors.text}>{symbol.slice(0, 2)}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-mono font-bold text-[#F0F0F0]">{symbol}</p>
          <p className="text-xs text-[#4A4A5A] truncate">{name}</p>
        </div>
        {onToggleWatchlist && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleWatchlist(); }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/[0.06] transition-colors"
          >
            <Star
              className={cn("w-[14px] h-[14px]", inWatchlist ? "fill-[#F59E0B] text-[#F59E0B]" : "text-[#4A4A5A]")}
            />
          </button>
        )}
      </div>

      {/* Price */}
      <p className="text-xl font-mono font-bold text-[#F0F0F0] mb-1">{price}</p>

      {/* Change badge */}
      <div className="mb-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono font-medium",
            positive
              ? "bg-[#A3E635]/10 text-[#A3E635]"
              : "bg-[#F05252]/10 text-[#F05252]"
          )}
        >
          {positive ? (
            <TrendingUp className="w-[11px] h-[11px]" />
          ) : (
            <TrendingDown className="w-[11px] h-[11px]" />
          )}
          {change}
        </span>
      </div>

      {/* Stats */}
      <div className="flex justify-between border-t border-white/[0.05] pt-2 mt-2">
        <div>
          <p className="text-[10px] text-[#4A4A5A]">MCap</p>
          <p className="text-xs font-mono text-[#8A8A9A]">{mcap}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[#4A4A5A]">24h Vol</p>
          <p className="text-xs font-mono text-[#8A8A9A]">{vol}</p>
        </div>
      </div>
    </div>
  );
}

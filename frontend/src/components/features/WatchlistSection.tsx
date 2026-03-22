"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Star, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import { watchlistApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { WatchlistItem } from "@/lib/types";

function formatPrice(price: number, symbol: string): string {
  const isVN =
    symbol === "VNM" ||
    symbol === "VIC" ||
    symbol === "HPG" ||
    symbol === "FPT" ||
    symbol === "TCB" ||
    symbol === "MWG" ||
    symbol === "MSI";
  if (isVN) return `₫${price.toLocaleString("vi-VN")}`;
  return `$${price.toFixed(2)}`;
}

interface WatchlistSectionProps {
  onSymbolClick?: (symbol: string) => void;
}

export function WatchlistSection({ onSymbolClick }: WatchlistSectionProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: items, isLoading, error } = useQuery({
    queryKey: ["watchlist"],
    queryFn: watchlistApi.list,
    retry: 1,
  });

  const removeMutation = useMutation({
    mutationFn: ({ symbol, market }: { symbol: string; market?: string }) =>
      watchlistApi.remove(symbol, market),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  if (isLoading) {
    return (
      <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-[#F59E0B]" />
          <h2 className="text-sm font-medium text-[#F0F0F0]">My Watchlist</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-[#4A4A5A] animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !items || items.length === 0) {
    return (
      <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-[#F59E0B]" />
          <h2 className="text-sm font-medium text-[#F0F0F0]">My Watchlist</h2>
        </div>
        <div className="py-6 text-center">
          <Star className="w-6 h-6 text-[#4A4A5A] mx-auto mb-2" />
          <p className="text-xs text-[#4A4A5A]">
            {error ? "Failed to load watchlist" : "No stocks watched yet"}
          </p>
          <p className="text-[10px] text-[#4A4A5A] mt-1">
            Click the star icon on any stock to add it here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#141418] border border-white/[0.07] rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-[#F59E0B]" />
          <h2 className="text-sm font-medium text-[#F0F0F0]">My Watchlist</h2>
          <span className="text-[10px] font-mono bg-[#1E1E26] text-[#8A8A9A] px-1.5 py-0.5 rounded">
            {items.length}
          </span>
        </div>
        <span className="text-[10px] text-[#4A4A5A]">
          {items.filter((i) => i.changePercent >= 0).length}/{items.length} up
        </span>
      </div>

      <div className="divide-y divide-white/[0.04]">
        {items.map((item) => {
          const isUp = item.changePercent >= 0;
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02] transition-colors cursor-pointer group"
              onClick={() => onSymbolClick?.(item.symbol)}
            >
              <div className="w-8 h-8 rounded-lg bg-[#1E1E26] flex items-center justify-center text-[10px] font-bold font-mono text-[#8A8A9A] flex-shrink-0">
                {item.symbol.slice(0, 2)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium font-mono text-[#F0F0F0]">{item.symbol}</p>
                <p className="text-[10px] text-[#4A4A5A] truncate">{item.name}</p>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-sm font-mono font-medium text-[#F0F0F0]">
                  {formatPrice(item.price, item.symbol)}
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
                    {item.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeMutation.mutate({ symbol: item.symbol, market: item.market });
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white/[0.06] transition-all"
                disabled={removeMutation.isPending}
              >
                <Star className="w-[14px] h-[14px] fill-[#F59E0B] text-[#F59E0B]" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

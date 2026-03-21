"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { StockTable } from "@/components/features";
import { Button } from "@/components/ui/button";
import { RefreshCw, MagnifyingGlass } from "lucide-react";
import { stockApi } from "@/lib/api-client";

export default function MarketsPage() {
  const router = useRouter();
  const [watched, setWatched] = useState<Set<string>>(new Set(["AAPL", "NVDA", "VNM"]));

  const { data: stocks, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => stockApi.list({ pageSize: 50 }),
    refetchInterval: 30_000,
    staleTime: 20_000,
    retry: 1,
  });

  function handleToggleWatchlist(symbol: string) {
    setWatched((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex items-center gap-1.5 border border-[#A3E635]/20 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-[#A3E635] animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest text-[#A3E635]">LIVE</span>
            </div>
          </div>
          <p className="text-xs text-[#4A4A5A]">Real-time VN & US stock prices — 30s auto-refresh</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-white/[0.08] text-xs text-[#8A8A9A] hover:text-white hover:border-white/20"
          onClick={() => refetch()}
        >
          <RefreshCw className={`w-3 h-3 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-[#F05252]/10 border border-[#F05252]/20 text-sm text-[#F05252]">
          Failed to load market data: {error.message}
        </div>
      )}

      {/* Market tabs */}
      <div className="mb-2">
        <StockTable
          stocks={stocks ?? []}
          loading={isLoading}
          error={error ?? undefined}
          watchedSymbols={watched}
          onToggleWatchlist={handleToggleWatchlist}
          onSymbolClick={(symbol) => router.push(`/markets/${symbol}`)}
        />
      </div>
    </div>
  );
}

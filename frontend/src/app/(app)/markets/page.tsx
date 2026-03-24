"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StockTable, WatchlistSection } from "@/components/features";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { stockApi, watchlistApi } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import { useStockSignalR, LiveBadge } from "@/lib/useStockSignalR";
import type { Stock } from "@/lib/types";

export default function MarketsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  // ── SignalR real-time connection ──────────────────────────────────────────
  const { connectionStatus } = useStockSignalR({});

  // ── Data queries ─────────────────────────────────────────────────────────
  // Polling is fallback only — SignalR pushes real-time updates
  const { data: stocks, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => stockApi.list({ pageSize: 50 }),
    staleTime: 30_000,
    // Disable polling when SignalR is connected; fallback to 30s when disconnected
    refetchInterval: connectionStatus === "connected" ? false : 30_000,
    retry: 1,
  });

  // Load user's watchlist symbols for the star state
  const { data: watchlistItems } = useQuery({
    queryKey: ["watchlist"],
    queryFn: watchlistApi.list,
    enabled: isAuthenticated,
    retry: 1,
  });

  const watchedSymbols = new Set((watchlistItems ?? []).map((w) => w.symbol));

  const addMutation = useMutation({
    mutationFn: (symbol: string) => watchlistApi.add(symbol),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  const removeMutation = useMutation({
    mutationFn: (symbol: string) => watchlistApi.remove(symbol),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  const handleToggleWatchlist = useCallback(
    (symbol: string) => {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }
      if (watchedSymbols.has(symbol)) {
        removeMutation.mutate(symbol);
      } else {
        addMutation.mutate(symbol);
      }
    },
    [isAuthenticated, router, watchedSymbols, addMutation, removeMutation]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LiveBadge />
          </div>
          <p className="text-xs text-[#4A4A5A]">Real-time VN & US stock prices — SignalR + 30s fallback</p>
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

      <div className="grid grid-cols-3 gap-6">
        {/* Left col — Market table */}
        <div className="col-span-2">
          <StockTable
            stocks={stocks ?? []}
            loading={isLoading}
            error={error ?? undefined}
            watchedSymbols={watchedSymbols}
            onToggleWatchlist={handleToggleWatchlist}
            onSymbolClick={(symbol) => router.push(`/markets/${symbol}`)}
          />
        </div>

        {/* Right col — Watchlist */}
        <div>
          <WatchlistSection
            onSymbolClick={(symbol) => router.push(`/markets/${symbol}`)}
          />
        </div>
      </div>
    </div>
  );
}

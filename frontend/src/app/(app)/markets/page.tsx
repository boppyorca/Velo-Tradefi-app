"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/features";
import { StockTable } from "@/components/features";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { stockApi } from "@/lib/api-client";
import type { Stock } from "@/lib/types";

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
      if (next.has(symbol)) {
        next.delete(symbol);
      } else {
        next.add(symbol);
      }
      return next;
    });
  }

  return (
    <div>
      <PageHeader
        title="Markets"
        description="Real-time VN & US stock prices — 30s auto-refresh"
        badge="LIVE"
        badgeColor="lime"
        action={
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-[rgba(255,255,255,0.12)] text-xs text-[#8A8A9A] hover:text-white hover:border-[rgba(255,255,255,0.2)]"
            onClick={() => refetch()}
          >
            <RefreshCw className={`w-3 h-3 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-velo-red/10 border border-velo-red/20 text-sm text-velo-red">
          Failed to load market data: {error.message}
        </div>
      )}

      {/* Market tabs */}
      <div className="mb-6">
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

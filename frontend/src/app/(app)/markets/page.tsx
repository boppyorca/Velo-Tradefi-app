"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StockTable, WatchlistSection } from "@/components/features";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { stockApi, watchlistApi } from "@/lib/api-client";
import { useHasVeloSession } from "@/lib/use-velo-session";
import { resyncBackendJwtFromSupabase } from "@/lib/resync-backend-jwt";
import type { Stock, WatchlistItem } from "@/lib/types";

function watchlistMarket(exchange: Stock["exchange"]): "VN" | "US" {
  return exchange === "HOSE" || exchange === "HNX" ? "VN" : "US";
}

export default function MarketsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const hasSession = useHasVeloSession();
  const [watchlistActionError, setWatchlistActionError] = useState<string | null>(null);
  const [resyncingJwt, setResyncingJwt] = useState(false);

  // Tự đồng bộ Supabase → JWT backend khi vào Markets (để My Watchlist bên phải gọi được API).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { supabase } = await import("@/lib/supabase");
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session || cancelled) return;
      const result = await resyncBackendJwtFromSupabase();
      if (cancelled) return;
      if (result.ok) {
        setWatchlistActionError(null);
        await queryClient.invalidateQueries({ queryKey: ["watchlist"] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queryClient]);

  async function handleResyncBackendJwt() {
    setResyncingJwt(true);
    setWatchlistActionError(null);
    const result = await resyncBackendJwtFromSupabase();
    if (result.ok) {
      await queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    } else {
      setWatchlistActionError(result.message);
    }
    setResyncingJwt(false);
  }

  const { data: stocks, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["stocks"],
    queryFn: () => stockApi.list({ pageSize: 50 }),
    refetchInterval: 30_000,
    staleTime: 20_000,
    retry: 1,
  });

  // Load user's watchlist symbols for the star state
  const { data: watchlistItems } = useQuery({
    queryKey: ["watchlist"],
    queryFn: watchlistApi.list,
    enabled: hasSession,
    retry: 1,
  });

  const watchedKeys = useMemo(
    () =>
      new Set((watchlistItems ?? []).map((w) => `${w.symbol}:${w.market}`)),
    [watchlistItems]
  );

  const addMutation = useMutation({
    mutationFn: ({ symbol, market }: { symbol: string; market: string }) =>
      watchlistApi.add(symbol, market),
    onMutate: async ({ symbol, market }) => {
      setWatchlistActionError(null);
      await queryClient.cancelQueries({ queryKey: ["watchlist"] });
      const previous = queryClient.getQueryData<WatchlistItem[]>(["watchlist"]);
      const list = previous ?? [];
      const optimistic: WatchlistItem = {
        id: `optimistic-${symbol}-${market}`,
        symbol,
        market: market === "VN" ? "VN" : "US",
        addedAt: new Date().toISOString(),
        price: 0,
        changePercent: 0,
        name: symbol,
      };
      queryClient.setQueryData<WatchlistItem[]>(["watchlist"], [...list, optimistic]);
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(["watchlist"], ctx.previous);
      } else {
        queryClient.removeQueries({ queryKey: ["watchlist"] });
      }
      const msg = err instanceof Error ? err.message : String(err);
      setWatchlistActionError(
        /401|unauthorized/i.test(msg)
          ? "Token API không hợp lệ — hãy Đăng xuất rồi Đăng nhập lại (để đồng bộ JWT backend)."
          : msg
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({ symbol, market }: { symbol: string; market: string }) =>
      watchlistApi.remove(symbol, market),
    onMutate: async ({ symbol, market }) => {
      setWatchlistActionError(null);
      await queryClient.cancelQueries({ queryKey: ["watchlist"] });
      const previous = queryClient.getQueryData<WatchlistItem[]>(["watchlist"]);
      if (!previous?.length) return {};
      queryClient.setQueryData<WatchlistItem[]>(
        ["watchlist"],
        previous.filter((w) => !(w.symbol === symbol && w.market === market))
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        queryClient.setQueryData(["watchlist"], ctx.previous);
      }
      const msg = err instanceof Error ? err.message : String(err);
      setWatchlistActionError(
        /401|unauthorized/i.test(msg)
          ? "Token API không hợp lệ — hãy Đăng xuất rồi Đăng nhập lại."
          : msg
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
    },
  });

  const handleToggleWatchlist = useCallback(
    (symbol: string, exchange: Stock["exchange"]) => {
      if (!hasSession) {
        router.push("/login?redirect=/markets");
        return;
      }
      const market = watchlistMarket(exchange);
      const key = `${symbol}:${market}`;
      if (watchedKeys.has(key)) {
        removeMutation.mutate({ symbol, market });
      } else {
        addMutation.mutate({ symbol, market });
      }
    },
    [hasSession, router, watchedKeys, addMutation, removeMutation]
  );

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

      {watchlistActionError && (
        <div className="mb-4 p-4 rounded-xl bg-[#F05252]/10 border border-[#F05252]/20 text-sm text-[#F05252] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="min-w-0">{watchlistActionError}</span>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button
              type="button"
              disabled={resyncingJwt}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#1E1E26] text-[#F0F0F0] border border-white/[0.12] hover:border-[#A3E635]/40 disabled:opacity-50"
              onClick={() => void handleResyncBackendJwt()}
            >
              {resyncingJwt ? "Đang đồng bộ…" : "Đồng bộ JWT (Supabase → backend)"}
            </button>
            <button
              type="button"
              className="text-xs font-semibold text-[#A3E635] hover:underline"
              onClick={() => setWatchlistActionError(null)}
            >
              Đóng
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {/* Left col — Market table */}
        <div className="col-span-2">
          <StockTable
            stocks={stocks ?? []}
            loading={isLoading}
            error={error ?? undefined}
            watchedKeys={watchedKeys}
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

/**
 * React hook that integrates SignalR real-time updates with React Query.
 *
 * Strategy: Hybrid approach
 * - React Query handles the initial data fetch and provides cache/suspense.
 * - SignalR handles real-time updates — when a push arrives, we merge it
 *   into the React Query cache so UI re-renders automatically.
 * - The LIVE badge now reflects actual SignalR connectivity, not polling.
 *
 * Usage:
 *   const { connectionStatus } = useStockSignalR({ market: "VN" | "US" | undefined });
 *   const { data: stocks } = useQuery({ queryKey: ["stocks"], ... });
 *   // stocks are automatically updated by SignalR push
 */

"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { stockSignalR, type ConnectionStatus, type StockBatchUpdate } from "./signalr-client";
import type { Stock } from "./types";

// ── Hook ────────────────────────────────────────────────────────────────────────

export interface UseStockSignalROptions {
  /**
   * Market to subscribe to. If provided, subscribes to "VN" (HOSE/HNX) or "US" (NASDAQ/NYSE).
   * If undefined, no market subscription is made — use subscribeToSymbols instead.
   */
  market?: "VN" | "US";
  /**
   * Specific symbols to subscribe to. Overrides market subscription if provided.
   */
  symbols?: string[];
  /**
   * If true, connects to SignalR on mount and disconnects on unmount.
   * Set to false if you manage the connection manually elsewhere.
   * Default: true
   */
  autoConnect?: boolean;
}

/**
 * Returns the current SignalR connection status.
 * Also subscribes to the given market/symbols and merges incoming updates into
 * the React Query cache.
 */
export function useStockSignalR(options: UseStockSignalROptions = {}) {
  const { market, symbols, autoConnect = true } = options;
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    stockSignalR.status
  );

  const queryClient = useQueryClient();

  // ── Connect / disconnect ──────────────────────────────────────────────────

  useEffect(() => {
    if (!autoConnect) return;

    // Subscribe to connection status changes
    const unsubStatus = stockSignalR.status$.subscribe(setConnectionStatus);

    // Connect to SignalR hub
    stockSignalR.connect().catch(console.error);

    return () => {
      unsubStatus();
      // Don't disconnect on unmount — keep the connection alive for other consumers.
      // Only disconnect when the entire app unmounts (handled by the provider).
    };
  }, [autoConnect]);

  // ── Subscribe to market ────────────────────────────────────────────────────

  useEffect(() => {
    if (!market) return;

    stockSignalR.subscribeToMarket(market).catch(console.error);

    return () => {
      stockSignalR.unsubscribeFromMarket(market).catch(console.error);
    };
  }, [market]);

  // ── Subscribe to specific symbols ─────────────────────────────────────────

  useEffect(() => {
    if (!symbols || symbols.length === 0) return;

    stockSignalR.subscribeToSymbols(symbols).catch(console.error);

    return () => {
      stockSignalR.unsubscribeFromSymbols(symbols).catch(console.error);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbols?.join(",")]);

  // ── Merge incoming batch updates into React Query cache ─────────────────────

  useEffect(() => {
    const unsub = stockSignalR.batchUpdate$.subscribe((updates) => {
      mergeStockUpdatesIntoCache(queryClient, updates);
    });

    return () => {
      unsub();
    };
  }, [queryClient]);

  // ── Merge incoming single updates into React Query cache ────────────────────

  useEffect(() => {
    const unsub = stockSignalR.stockUpdate$.subscribe((update) => {
      mergeSingleUpdateIntoCache(queryClient, update);
    });

    return () => {
      unsub();
    };
  }, [queryClient]);

  return { connectionStatus };
}

// ── Cache merging helpers ────────────────────────────────────────────────────────

function mergeSingleUpdateIntoCache(
  queryClient: ReturnType<typeof useQueryClient>,
  update: StockBatchUpdate
) {
  // Update all stock query caches that might contain this symbol
  queryClient.setQueriesData<Stock[]>(
    { queryKey: ["stocks"] },
    (oldData) => {
      if (!oldData || !Array.isArray(oldData)) return oldData;

      return oldData.map((stock) =>
        stock.symbol.toUpperCase() === update.symbol.toUpperCase()
          ? {
              ...stock,
              price: update.price,
              change: update.change,
              changePercent: update.changePercent,
              volume: update.volume,
              updatedAt: update.timestamp,
            }
          : stock
      );
    }
  );
}

function mergeStockUpdatesIntoCache(
  queryClient: ReturnType<typeof useQueryClient>,
  updates: StockBatchUpdate[]
) {
  if (updates.length === 0) return;

  // Build a fast lookup map
  const updateMap = new Map<string, StockBatchUpdate>();
  for (const u of updates) {
    updateMap.set(u.symbol.toUpperCase(), u);
  }

  // Update all matching stock caches
  queryClient.setQueriesData<Stock[]>(
    { queryKey: ["stocks"] },
    (oldData) => {
      if (!oldData || !Array.isArray(oldData)) return oldData;

      const hasChanges = oldData.some(
        (s) => updateMap.has(s.symbol.toUpperCase())
      );

      if (!hasChanges) return oldData;

      return oldData.map((stock) => {
        const update = updateMap.get(stock.symbol.toUpperCase());
        if (!update) return stock;
        return {
          ...stock,
          price: update.price,
          change: update.change,
          changePercent: update.changePercent,
          volume: update.volume,
          updatedAt: update.timestamp,
        };
      });
    }
  );

  // Also invalidate query keys to trigger a refetch (hybrid approach ensures data freshness)
  // We invalidate AFTER merging for instant UI update, then let React Query refetch later.
  queryClient.invalidateQueries({ queryKey: ["stocks"], exact: false });
}

// ── Live badge component ────────────────────────────────────────────────────────

export interface LiveBadgeProps {
  status?: ConnectionStatus;
  className?: string;
}

export function LiveBadge({ status, className }: LiveBadgeProps) {
  const [currentStatus, setCurrentStatus] = useState<ConnectionStatus>(
    status ?? stockSignalR.status
  );

  useEffect(() => {
    if (status !== undefined) {
      setCurrentStatus(status);
      return;
    }
    return stockSignalR.status$.subscribe(setCurrentStatus);
  }, [status]);

  const isLive = currentStatus === "connected";
  const isReconnecting = currentStatus === "reconnecting";

  return (
    <div
      className={`flex items-center gap-1.5 border rounded-full px-3 py-1 ${
        className ?? ""
      } ${
        isLive
          ? "border-[#A3E635]/30"
          : isReconnecting
          ? "border-[#F59E0B]/30"
          : "border-white/10"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isLive
            ? "bg-[#A3E635] animate-pulse"
            : isReconnecting
            ? "bg-[#F59E0B] animate-pulse"
            : "bg-[#8A8A9A]"
        }`}
      />
      <span
        className={`text-xs font-medium ${
          isLive
            ? "text-[#A3E635]"
            : isReconnecting
            ? "text-[#F59E0B]"
            : "text-[#8A8A9A]"
        }`}
      >
        {isLive ? "LIVE" : isReconnecting ? "RECONNECTING" : "OFFLINE"}
      </span>
    </div>
  );
}

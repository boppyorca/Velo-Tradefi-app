/**
 * Standardized React Query hooks for data fetching.
 *
 * NOTE on SignalR:
 * - Stock data is updated in real-time via SignalR (see useStockSignalR hook).
 * - These polling intervals are FALLBACK values used when SignalR is disconnected.
 * - Pages that use useStockSignalR disable these hooks' polling automatically
 *   by setting refetchInterval: false when connectionStatus === "connected".
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stockApi, memecoinApi, newsApi, predictionApi } from "@/lib/api-client";
import type { Stock, StockQuote, StockHistoryPoint } from "@/lib/types";

export function useStockList(params?: { exchange?: string; page?: number; pageSize?: number }) {
  return useQuery<Stock[]>({
    queryKey: ["stocks", params],
    queryFn: () => stockApi.list(params),
    staleTime: 20_000,       // 20s — data stays fresh for 20s
    refetchInterval: 30_000,   // 30s fallback — overridden by useStockSignalR on pages that use it
    retry: 1,
  });
}

export function useStockQuote(symbol: string) {
  return useQuery<StockQuote | null, Error, StockQuote | null>({
    queryKey: ["stock", symbol],
    queryFn: () => stockApi.quote(symbol),
    staleTime: 10_000,         // 10s — quote data goes stale quickly
    refetchInterval: 15_000,   // 15s fallback — prices change often
    enabled: !!symbol,
    retry: 1,
  });
}

export function useStockHistory(symbol: string, period = "1mo") {
  return useQuery<StockHistoryPoint[], Error, StockHistoryPoint[]>({
    queryKey: ["stock-history", symbol, period],
    queryFn: () => stockApi.history(symbol, period),
    staleTime: 5 * 60_000,   // 5min — historical data changes rarely
    enabled: !!symbol,
    retry: 1,
  });
}

export function useStockSearch(q: string) {
  return useQuery<Stock[], Error, Stock[]>({
    queryKey: ["stock-search", q],
    queryFn: () => stockApi.search(q),
    enabled: q.length >= 2,
    staleTime: 60_000,        // 1min — search results are stable
  });
}

export function useMemecoinList(params?: { page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ["memecoins", params],
    queryFn: () => memecoinApi.list(params),
    staleTime: 15_000,        // 15s
    refetchInterval: 30_000,  // 30s — memecoins change faster than stocks
    retry: 1,
  });
}

export function useMemecoinPrices(ids: string) {
  return useQuery({
    queryKey: ["memecoin-prices", ids],
    queryFn: () => memecoinApi.price(ids),
    enabled: !!ids,
    staleTime: 15_000,
    refetchInterval: 30_000,  // 30s — same as memecoin list
    retry: 1,
  });
}

export function useNewsList(params?: { category?: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ["news", params],
    queryFn: () => newsApi.list(params),
    staleTime: 5 * 60_000,   // 5min — news doesn't change frequently
    retry: 1,
  });
}

export function usePrediction(symbol: string, model?: "lstm" | "prophet") {
  return useQuery({
    queryKey: ["prediction", symbol, model],
    queryFn: () => predictionApi.predict(symbol, model),
    enabled: !!symbol,
    staleTime: 60 * 60_000,   // 60min — predictions are expensive to compute
    retry: 1,
  });
}

export function usePredictionHistory(symbol: string) {
  return useQuery({
    queryKey: ["prediction-history", symbol],
    queryFn: () => predictionApi.history(symbol),
    enabled: !!symbol,
    staleTime: 60 * 60_000,   // 60min
    retry: 1,
  });
}


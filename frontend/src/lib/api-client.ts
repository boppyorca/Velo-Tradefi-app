"use client";

import type { AuthResponse, StocksResponse, MemecoinsResponse, NewsResponse, StockQuote, Prediction, Stock, StockHistoryPoint, WatchlistItem } from "./types";

/** True when env points at the usual local Kestrel URL — browser should use /bff proxy instead (same-origin). */
function isLocalLoopbackApiUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const port = u.port || (u.protocol === "https:" ? "443" : "80");
    return (host === "localhost" || host === "127.0.0.1") && port === "5000";
  } catch {
    return false;
  }
}

/**
 * Browser: use `/bff` → Next.js rewrites to the .NET API (see next.config.ts) unless NEXT_PUBLIC_API_URL is a non-local API.
 * Server: call the backend directly via BACKEND_INTERNAL_URL or 127.0.0.1:5000.
 */
function getApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim()?.replace(/\/$/, "");
  if (configured && !isLocalLoopbackApiUrl(configured)) return configured;
  if (typeof window !== "undefined") return "/bff";
  return (
    process.env.BACKEND_INTERNAL_URL?.trim().replace(/\/$/, "") ||
    "http://127.0.0.1:5000"
  );
}

/** Normalize API payloads (.NET may send PascalCase; Yahoo decimals as strings) */
function normalizeStock(raw: unknown): Stock {
  const r = raw as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v));
  const price = num(r.price ?? r.Price);
  const change = num(r.change ?? r.Change);
  const changePercent = num(r.changePercent ?? r.ChangePercent);
  const volume = Math.trunc(num(r.volume ?? r.Volume));
  const ex = String(r.exchange ?? r.Exchange ?? "NASDAQ").toUpperCase();
  const exchange: Stock["exchange"] =
    ex === "HOSE" || ex === "HNX" || ex === "NYSE" || ex === "NASDAQ" ? ex : "NASDAQ";
  return {
    symbol: String(r.symbol ?? r.Symbol ?? ""),
    name: String(r.name ?? r.Name ?? ""),
    exchange,
    price: Number.isFinite(price) ? price : 0,
    change: Number.isFinite(change) ? change : 0,
    changePercent: Number.isFinite(changePercent) ? changePercent : 0,
    volume: Number.isFinite(volume) ? volume : 0,
    marketCap: r.marketCap != null || r.MarketCap != null ? num(r.marketCap ?? r.MarketCap) : undefined,
    updatedAt: String(r.updatedAt ?? r.UpdatedAt ?? new Date().toISOString()),
  };
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  // Get token from parameter, localStorage, or Supabase auth store
  const authToken =
    token ??
    (typeof window !== "undefined" ? localStorage.getItem("velo_token") : null) ??
    undefined;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${getApiBase()}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message ?? `HTTP ${res.status}`);
  }

  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; password: string; fullName: string }) =>
    request<AuthResponse>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: (token?: string | null) =>
    request<{ id: string; email: string; fullName: string }>(
      "/api/auth/me",
      {},
      token
    ),

  /** Get the Supabase Google OAuth URL from the backend. */
  googleOAuthUrl: () =>
    request<{ data: { url: string }; success: boolean }>("/api/auth/google"),

  /** Exchange a Supabase OAuth token for a backend JWT. */
  exchangeGoogleToken: (accessToken: string) =>
    request<AuthResponse>("/api/auth/google/exchange", {
      method: "POST",
      body: JSON.stringify({ accessToken }),
    }),
};

// ── Stocks ─────────────────────────────────────────────────────────────────
export const stockApi = {
  list: async (params?: { exchange?: string; page?: number; pageSize?: number }): Promise<Stock[]> => {
    const filtered = Object.fromEntries(
      Object.entries(params ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ) as Record<string, string>;
    const qs = new URLSearchParams(filtered).toString();
    const res = await request<{ data: Stock[]; success: boolean }>(`/api/stocks${qs ? `?${qs}` : ""}`);
    return (res.data ?? []).map(normalizeStock);
  },

  quote: async (symbol: string): Promise<StockQuote | null> => {
    try {
      const res = await request<{ data: StockQuote; success: boolean }>(`/api/stocks/${symbol}`);
      return res.data;
    } catch {
      return null;
    }
  },

  history: async (symbol: string, period = "1mo"): Promise<StockHistoryPoint[]> => {
    try {
      const res = await request<{ data: StockHistoryPoint[]; success: boolean }>(
        `/api/stocks/${symbol}/history?period=${period}`
      );
      return res.data;
    } catch {
      return [];
    }
  },

  search: async (q: string): Promise<Stock[]> => {
    const res = await request<{ data: Stock[]; success: boolean }>(`/api/stocks/search?q=${q}`);
    return res.data;
  },
};

// ── AI Predictions ──────────────────────────────────────────────────────────
export const predictionApi = {
  predict: (symbol: string, model?: "lstm" | "prophet") =>
    request<{ data: Prediction; success: boolean }>(
      `/api/predictions/${symbol}${model ? `?model=${model}` : ""}`
    ),

  history: (symbol: string) =>
    request<{ data: Prediction[]; success: boolean }>(
      `/api/predictions/${symbol}/history`
    ),
};

// ── Web3 / Memecoins ────────────────────────────────────────────────────────
export const memecoinApi = {
  list: (params?: { page?: number; pageSize?: number }) => {
    const filtered = Object.fromEntries(
      Object.entries(params ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ) as Record<string, string>;
    const qs = new URLSearchParams(filtered).toString();
    return request<MemecoinsResponse>(`/api/memecoins${qs ? `?${qs}` : ""}`);
  },

  price: (ids: string) =>
    request<import("./types").Memecoin[]>(`/api/memecoins/prices?ids=${ids}`),
};

// ── Watchlist ────────────────────────────────────────────────────────────────
export const watchlistApi = {
  list: (): Promise<WatchlistItem[]> =>
    request<{ data: WatchlistItem[]; success: boolean }>("/api/watchlist").then(
      (r) => r.data ?? []
    ),

  add: (symbol: string, market?: string) =>
    request<{ success: boolean; message: string }>("/api/watchlist", {
      method: "POST",
      body: JSON.stringify({ symbol, market }),
    }),

  remove: (symbol: string, market?: string) =>
    request<{ success: boolean }>(
      `/api/watchlist/${encodeURIComponent(symbol)}${market ? `?market=${market}` : ""}`,
      { method: "DELETE" }
    ),
};

// ── News ───────────────────────────────────────────────────────────────────
export const newsApi = {
  list: (params?: { category?: string; page?: number; pageSize?: number }) => {
    const filtered = Object.fromEntries(
      Object.entries(params ?? {}).filter(([, v]) => v !== undefined).map(([k, v]) => [k, String(v)])
    ) as Record<string, string>;
    const qs = new URLSearchParams(filtered).toString();
    return request<NewsResponse>(`/api/news${qs ? `?${qs}` : ""}`);
  },
};

"use client";

import type {
  AdminActivityItem,
  AdminStatCard,
  AlertCondition,
  AlertRule,
  AuthResponse,
  ExchangeStatusRow,
  MemecoinsResponse,
  NewsResponse,
  Prediction,
  Stock,
  StockHistoryPoint,
  StockQuote,
  StocksResponse,
  WatchlistItem,
} from "./types";

function normalizeWatchlistItem(raw: unknown): WatchlistItem {
  const r = raw as Record<string, unknown>;
  const m = String(r.market ?? r.Market ?? "US").toUpperCase();
  return {
    id: String(r.id ?? r.Id ?? ""),
    symbol: String(r.symbol ?? r.Symbol ?? ""),
    market: m === "VN" ? "VN" : "US",
    addedAt: String(r.addedAt ?? r.AddedAt ?? ""),
    price: Number(r.price ?? r.Price ?? 0),
    changePercent: Number(r.changePercent ?? r.ChangePercent ?? 0),
    name: String(r.name ?? r.Name ?? ""),
  };
}

function normalizeAlert(raw: unknown): AlertRule {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? r.Id ?? ""),
    name: String(r.name ?? r.Name ?? ""),
    symbol: String(r.symbol ?? r.Symbol ?? ""),
    targetType: (r.targetType ?? r.TargetType ?? "STOCK") as AlertRule["targetType"],
    basePrice: Number(r.basePrice ?? r.BasePrice ?? 0),
    conditions: (r.conditions ?? r.Conditions ?? []) as AlertRule["conditions"],
    isActive: Boolean(r.isActive ?? r.IsActive ?? true),
    createdAt: String(r.createdAt ?? r.CreatedAt ?? ""),
    updatedAt: r.updatedAt != null ? String(r.updatedAt) : undefined,
  };
}

/** Backend API URL resolution strategy:
 * 1. Use NEXT_PUBLIC_API_URL if set (must be reachable from the browser).
 * 2. In browser without it → same-origin `/api/*` (Next.js rewrites to backend — Docker-safe).
 * 3. Server-side → BACKEND_INTERNAL_URL or http://127.0.0.1:5050 (docker-compose backend publish).
 */
function getApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim()?.replace(/\/$/, "");
  if (configured) return configured;

  if (typeof window !== "undefined") {
    return "";
  }
  return (
    process.env.BACKEND_INTERNAL_URL?.trim().replace(/\/$/, "") ||
    "http://127.0.0.1:5050"
  );
}

/**
 * Resolve the full API URL for a given endpoint.
 * Call sites pass paths that already start with `/api/...`.
 * When getApiBase() is empty (browser, no NEXT_PUBLIC_API_URL), return the path
 * as-is so Next.js rewrites `/api/*` → backend — do NOT prepend `/api` again
 * (that would produce `/api/api/stocks` and a 404 from the backend).
 */
function resolveUrl(endpoint: string): string {
  const base = getApiBase();
  if (base) return `${base}${endpoint}`;
  return endpoint;
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

  const url = resolveUrl(endpoint);

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    const msg =
      (typeof raw.message === "string" && raw.message) ||
      (typeof raw.title === "string" && raw.title) ||
      (res.status === 401
        ? "Unauthorized — token missing, expired, or not a backend JWT. Sign out and sign in again."
        : null) ||
      res.statusText;
    throw new Error(msg || `HTTP ${res.status}`);
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
    request<{ id: string; email: string; fullName: string; role: string }>(
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
    request<{ data: unknown[]; success: boolean }>("/api/watchlist").then((r) =>
      (r.data ?? []).map(normalizeWatchlistItem)
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

// ── Admin (requires Admin role + backend JWT with role claim) ─────────────
export const adminApi = {
  dashboard: () =>
    request<{ success: boolean; data: { stats: AdminStatCard[]; recentActivity: AdminActivityItem[] } }>(
      "/api/admin/dashboard"
    ),
};

// ── Markets (authenticated) ────────────────────────────────────────────────
export const marketsApi = {
  exchangeStatus: () =>
    request<{ success: boolean; data: ExchangeStatusRow[] }>("/api/markets/exchange-status"),
};

// ── Price Alerts ───────────────────────────────────────────────────────────
export const alertApi = {
  list: (): Promise<AlertRule[]> =>
    request<{ data: unknown[]; success: boolean }>("/api/alerts").then((r) =>
      (r.data ?? []).map(normalizeAlert)
    ),

  create: (data: {
    name: string;
    symbol: string;
    targetType: string;
    basePrice: number;
    conditions: AlertCondition[];
  }): Promise<AlertRule> =>
    request<{ data: unknown; success: boolean; message: string }>("/api/alerts", {
      method: "POST",
      body: JSON.stringify(data),
    }).then((r) => normalizeAlert(r.data)),

  update: (
    id: string,
    data: { name?: string; conditions?: AlertCondition[] }
  ): Promise<AlertRule> =>
    request<{ data: unknown; success: boolean; message: string }>(`/api/alerts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }).then((r) => normalizeAlert(r.data)),

  delete: (id: string): Promise<void> =>
    request<{ success: boolean }>(`/api/alerts/${id}`, { method: "DELETE" }).then(() => {}),

  toggle: (id: string): Promise<AlertRule> =>
    request<{ data: unknown; success: boolean }>(`/api/alerts/${id}/toggle`, {
      method: "PATCH",
    }).then((r) => normalizeAlert(r.data)),
};

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  createdAt?: string;
}

export interface Stock {
  symbol: string;
  name: string;
  exchange: "HOSE" | "HNX" | "NYSE" | "NASDAQ";
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  updatedAt: string;
}

export interface StockQuote extends Stock {
  open: number;
  high: number;
  low: number;
  previousClose: number;
  week52High?: number;
  week52Low?: number;
  peRatio?: number;
  dividendYield?: number;
  avgVolume?: number;
  eps?: number;
}

export interface StockHistoryPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Prediction {
  symbol: string;
  model: "lstm" | "prophet";
  currentPrice: number;
  predictions: Array<{
    date: string;
    predictedPrice: number;
    confidence: number;
    upperBound: number;
    lowerBound: number;
  }>;
  trend: "bullish" | "bearish" | "neutral";
  confidence: number;
}

export interface Wallet {
  address: string;
  balance: string;
  chainId: number;
}

export interface Memecoin {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
  image: string;
}

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  imageUrl?: string;
  category: "ai" | "tech" | "crypto" | "stock";
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AppSettings {
  theme: "dark";
  notifications: boolean;
  refreshInterval: number;
  defaultMarket: "VN" | "US";
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  market: "VN" | "US";
  addedAt: string;
  price: number;
  changePercent: number;
  name: string;
}

export interface AdminStatCard {
  key: string;
  label: string;
  value: string;
  change: string;
  up: boolean;
}

export interface AdminActivityItem {
  occurredAtUtc: string;
  action: string;
  user: string;
  type: string;
}

export interface ExchangeStatusRow {
  code: string;
  live: boolean;
}

// API response types
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
  };
}

export interface StocksResponse {
  data: Stock[];
  total: number;
}

export interface MemecoinsResponse {
  data: Memecoin[];
}

export interface NewsResponse {
  data: NewsItem[];
}

// ── Price Alerts ─────────────────────────────────────────────────────────────────

export type AlertConditionType = "price_above" | "price_below" | "percent_change";

export interface AlertCondition {
  type: AlertConditionType;
  value: number;
}

export interface AlertRule {
  id: string;
  name: string;
  symbol: string;
  targetType: "STOCK" | "TOKEN";
  basePrice: number;
  conditions: AlertCondition[];
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface AlertNotification {
  alertId: string;
  alertName: string;
  symbol: string;
  currentPrice: number;
  basePrice: number;
  triggeredCondition: string;
  triggeredValue: number;
  triggeredAt: string;
}

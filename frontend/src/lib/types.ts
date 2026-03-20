export interface User {
  id: string;
  email: string;
  fullName: string;
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
}

export interface StockHistoryPoint {
  Date: string;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
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

// API response types
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    fullName: string;
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

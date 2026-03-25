/**
 * SignalR connection manager for real-time stock price updates.
 *
 * Architecture:
 * - This is a singleton that manages one SignalR connection per app lifecycle.
 * - The `useStockSignalR` hook subscribes/unsubscribes to symbols and merges
 *   incoming updates into the React Query cache for seamless real-time UX.
 * - Browser connects directly to backend SignalR hub (CORS-enabled).
 * - JWT tokens are sent as query param ?access_token=<jwt> for authentication.
 */

"use client";

import * as signalR from "@microsoft/signalr";
import type { IRetryPolicy, RetryContext } from "@microsoft/signalr";

// ── Types matching the backend Hub contract ────────────────────────────────────

export interface StockPriceUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
}

export interface StockBatchUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  timestamp: string;
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

// ── Connection state ────────────────────────────────────────────────────────────

export type ConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

interface StockPriceClient {
  receiveStockUpdate(update: StockPriceUpdate): void;
  receiveBatchUpdate(updates: StockBatchUpdate[]): void;
  receiveAlertNotification(notification: AlertNotification): void;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** True when env points at the usual local Kestrel URL — browser should use direct backend URL. */
function isLocalLoopbackApiUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    const port = u.port || (u.protocol === "https:" ? "443" : "80");
    return (host === "localhost" || host === "127.0.0.1") && (port === "5000" || port === "5001");
  } catch {
    return false;
  }
}

/**
 * Get the JWT token from localStorage.
 * Returns empty string if not authenticated or localStorage is unavailable.
 */
function getJwtToken(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("velo_token") ?? "";
}

/**
 * Determine the SignalR hub URL with optional JWT token.
 * Browser: calls backend directly (CORS-enabled on backend) at http://127.0.0.1:5001/hubs/stock-price.
 * Server: calls BACKEND_INTERNAL_URL or falls back to 127.0.0.1:5001.
 */
function getHubUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SIGNALR_URL?.trim();
  if (configured) return configured;

  // If a non-local API is configured, use it directly
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (apiUrl && !isLocalLoopbackApiUrl(apiUrl)) {
    return `${apiUrl}/hubs/stock-price`;
  }

  // Browser: use same-origin /hubs/* which next.config.ts rewrites to backend
  if (typeof window !== "undefined") {
    return "/hubs/stock-price";
  }

  // Server: call backend directly
  const internal =
    process.env.BACKEND_INTERNAL_URL?.trim() ||
    "http://127.0.0.1:5001";
  return `${internal}/hubs/stock-price`;
}

// ── Event emitter (lightweight pub/sub) ───────────────────────────────────────

type Listener<T> = (data: T) => void;

class EventEmitter<T> {
  private listeners = new Set<Listener<T>>();

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(data: T): void {
    for (const listener of this.listeners) {
      try {
        listener(data);
      } catch {
        // Ignore listener errors
      }
    }
  }

  get listenerCount(): number {
    return this.listeners.size;
  }
}

// ── Exponential backoff retry policy (SignalR v10 IRetryPolicy) ───────────────

class ExponentialBackoffRetryPolicy implements IRetryPolicy {
  private readonly maxAttempts: number;
  private readonly initialDelayMs: number;
  private readonly maxDelayMs: number;

  constructor(maxAttempts = 10, initialDelayMs = 1000, maxDelayMs = 30_000) {
    this.maxAttempts = maxAttempts;
    this.initialDelayMs = initialDelayMs;
    this.maxDelayMs = maxDelayMs;
  }

  nextRetryDelayInMilliseconds(retryContext: RetryContext): number | null {
    if (retryContext.previousRetryCount >= this.maxAttempts) {
      return null; // Stop reconnecting
    }
    // Exponential backoff: 1s, 2s, 4s, 8s, ... capped at maxDelayMs
    const delay = Math.min(
      this.initialDelayMs * Math.pow(2, retryContext.previousRetryCount),
      this.maxDelayMs
    );
    return delay;
  }
}

// ── Connection manager singleton ───────────────────────────────────────────────

class StockSignalRConnection {
  private _hub: signalR.HubConnection | null = null;
  private _status: ConnectionStatus = "disconnected";
  private _statusListeners = new EventEmitter<ConnectionStatus>();
  private _stockUpdateListeners = new EventEmitter<StockPriceUpdate>();
  private _batchUpdateListeners = new EventEmitter<StockBatchUpdate[]>();
  private _alertNotificationListeners = new EventEmitter<AlertNotification>();

  // Subscribed groups — maintained for auto-reconnect re-subscription
  private _subscribedMarkets = new Set<string>();
  private _subscribedSymbols = new Set<string>();

  // Retry policy instance
  private readonly _retryPolicy = new ExponentialBackoffRetryPolicy();

  get status(): ConnectionStatus {
    return this._status;
  }

  get status$(): EventEmitter<ConnectionStatus> {
    return this._statusListeners;
  }

  get stockUpdate$(): EventEmitter<StockPriceUpdate> {
    return this._stockUpdateListeners;
  }

  get batchUpdate$(): EventEmitter<StockBatchUpdate[]> {
    return this._batchUpdateListeners;
  }

  get alertNotification$(): EventEmitter<AlertNotification> {
    return this._alertNotificationListeners;
  }

  async connect(): Promise<void> {
    if (this._hub?.state === signalR.HubConnectionState.Connected) return;
    if (this._hub?.state === signalR.HubConnectionState.Connecting) return;

    await this._disposeHub();

    this._setStatus("connecting");

    const baseUrl = getHubUrl();
    const jwtToken = getJwtToken();

    // Build hub URL with optional JWT token as query param.
    // SignalR convention: ?access_token=<jwt> is read by the server's OnMessageReceived handler.
    const hubUrl = jwtToken
      ? `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(jwtToken)}`
      : baseUrl;

    const builder = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl)
      .withAutomaticReconnect(this._retryPolicy)
      .withStatefulReconnect()
      .configureLogging(
        process.env.NODE_ENV === "development"
          ? signalR.LogLevel.Debug
          : signalR.LogLevel.Warning
      );

    this._hub = builder.build();

    // Register client handlers
    const client = this._createClientHandlers();
    this._hub.on("ReceiveStockUpdate", client.receiveStockUpdate);
    this._hub.on("ReceiveBatchUpdate", client.receiveBatchUpdate);
    this._hub.on("ReceiveAlertNotification", client.receiveAlertNotification);

    // Wire up connection lifecycle events
    this._hub.onreconnecting(() => {
      this._setStatus("reconnecting");
    });

    this._hub.onreconnected(async () => {
      this._setStatus("connected");
      await this._resubscribeGroups();
    });

    this._hub.onclose(() => {
      this._setStatus("disconnected");
    });

    try {
      await this._hub.start();
      this._setStatus("connected");
      await this._resubscribeGroups();
      console.debug("[SignalR] Connected. Authenticated:", !!jwtToken);
    } catch (error) {
      this._setStatus("disconnected");
      console.error("[SignalR] Failed to start connection:", error);
    }
  }

  async disconnect(): Promise<void> {
    await this._disposeHub();
    this._subscribedMarkets.clear();
    this._subscribedSymbols.clear();
    this._setStatus("disconnected");
  }

  async subscribeToMarket(market: string): Promise<void> {
    const m = market.toUpperCase();
    this._subscribedMarkets.add(m);
    if (this._hub?.state === signalR.HubConnectionState.Connected) {
      await this._hub.invoke("SubscribeToMarket", m).catch(console.error);
    }
  }

  async unsubscribeFromMarket(market: string): Promise<void> {
    const m = market.toUpperCase();
    this._subscribedMarkets.delete(m);
    if (this._hub?.state === signalR.HubConnectionState.Connected) {
      await this._hub.invoke("UnsubscribeFromMarket", m).catch(console.error);
    }
  }

  async subscribeToSymbols(symbols: string[]): Promise<void> {
    for (const sym of symbols) {
      this._subscribedSymbols.add(sym.toUpperCase());
    }
    if (this._hub?.state === signalR.HubConnectionState.Connected) {
      await this._hub
        .invoke("SubscribeToSymbols", symbols.map((s) => s.toUpperCase()))
        .catch(console.error);
    }
  }

  async unsubscribeFromSymbols(symbols: string[]): Promise<void> {
    for (const sym of symbols) {
      this._subscribedSymbols.delete(sym.toUpperCase());
    }
    if (this._hub?.state === signalR.HubConnectionState.Connected) {
      await this._hub
        .invoke("UnsubscribeFromSymbols", symbols.map((s) => s.toUpperCase()))
        .catch(console.error);
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private _createClientHandlers(): StockPriceClient {
    return {
      receiveStockUpdate: (update: StockPriceUpdate) => {
        this._stockUpdateListeners.emit(update);
      },
      receiveBatchUpdate: (updates: StockBatchUpdate[]) => {
        this._batchUpdateListeners.emit(updates);
      },
      receiveAlertNotification: (notification: AlertNotification) => {
        this._alertNotificationListeners.emit(notification);
        // Dispatch custom DOM event so TopBar (outside React context) can receive it
        window.dispatchEvent(
          new CustomEvent("velo:alert:notification", { detail: notification })
        );
      },
    };
  }

  private _setStatus(status: ConnectionStatus): void {
    if (this._status === status) return;
    this._status = status;
    this._statusListeners.emit(status);
  }

  private async _disposeHub(): Promise<void> {
    if (this._hub) {
      try {
        this._hub.off("ReceiveStockUpdate");
        this._hub.off("ReceiveBatchUpdate");
        this._hub.off("ReceiveAlertNotification");
        await this._hub.stop();
      } catch {
        // Ignore errors during teardown
      }
      this._hub = null;
    }
  }

  private async _resubscribeGroups(): Promise<void> {
    if (!this._hub) return;

    const invoke = async <T>(method: string, ...args: T[]) => {
      try {
        await (this._hub as signalR.HubConnection).invoke(method, ...args);
      } catch (err) {
        console.warn(`[SignalR] Failed to re-subscribe via ${method}:`, err);
      }
    };

    if (this._subscribedMarkets.size > 0) {
      await invoke("SubscribeToMarket", [...this._subscribedMarkets]);
    }
    if (this._subscribedSymbols.size > 0) {
      await invoke("SubscribeToSymbols", [...this._subscribedSymbols]);
    }
  }
}

// ── Singleton export ───────────────────────────────────────────────────────────

export const stockSignalR = new StockSignalRConnection();

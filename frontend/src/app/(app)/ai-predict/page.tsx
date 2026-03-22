"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PredictionChart } from "@/components/features";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { predictionApi } from "@/lib/api-client";
import type { Prediction } from "@/lib/types";

const SYMBOLS = ["AAPL", "NVDA", "TSLA", "VNM", "MSFT", "GOOGL", "AMZN", "FPT"] as const;

const EXCHANGES: Record<string, string> = {
  AAPL: "NASDAQ", NVDA: "NASDAQ", TSLA: "NASDAQ",
  MSFT: "NASDAQ", GOOGL: "NASDAQ", AMZN: "NASDAQ",
  VNM: "HOSE", FPT: "HOSE",
};

const NAMES: Record<string, string> = {
  AAPL: "Apple Inc.", NVDA: "NVIDIA Corp.", TSLA: "Tesla Inc.",
  MSFT: "Microsoft Corp.", GOOGL: "Alphabet Inc.", AMZN: "Amazon.com Inc.",
  VNM: "Vietnam Dairy", FPT: "FPT Corporation",
};

type ModelType = "lstm" | "prophet";

export default function AIPredictPage() {
  const [symbol, setSymbol] = useState<string>("AAPL");
  const [model, setModel] = useState<ModelType>("lstm");

  const { data: result, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["predictions", symbol, model],
    queryFn: () => predictionApi.predict(symbol, model),
    staleTime: 5 * 60 * 1000, // 5 min — predictions are expensive to compute
    retry: 1,
  });

  const prediction: Prediction | null = result?.data ?? null;
  const base = prediction?.currentPrice ?? 0;
  const exchange = EXCHANGES[symbol] ?? "NASDAQ";
  const name = NAMES[symbol] ?? symbol;
  const isUp = prediction?.trend === "bullish";
  const isDown = prediction?.trend === "bearish";
  const trendColor = isUp ? "text-[#A3E635]" : isDown ? "text-[#F05252]" : "text-[#6366F1]";
  const trendBg = isUp ? "bg-[#A3E635]/10" : isDown ? "bg-[#F05252]/10" : "bg-[#6366F1]/10";
  const trendIconColor = isUp ? "#A3E635" : isDown ? "#F05252" : "#6366F1";
  const targetPrice = prediction?.predictions[prediction.predictions.length - 1]?.predictedPrice ?? base * 1.03;
  const pctChange = base > 0 ? ((targetPrice - base) / base) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#6366F1]/10 text-[#6366F1] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#6366F1]/20">
              BETA
            </span>
          </div>
          <p className="text-xs text-[#4A4A5A]">7-day price forecasting powered by LSTM & Prophet</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-white/[0.08] text-xs text-[#8A8A9A] hover:text-white hover:border-white/20"
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
        >
          <RefreshCw className={`w-3 h-3 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-3 rounded-xl bg-[#F05252]/10 border border-[#F05252]/20 text-xs text-[#F05252]">
          Prediction failed: {error.message}. Ensure the backend is running.
        </div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 bg-[#141418] border border-white/[0.07] rounded-xl p-4">
        {/* Symbol pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#4A4A5A] font-medium">Symbol</span>
          <div className="flex gap-1 flex-wrap">
            {SYMBOLS.map((s) => (
              <button
                key={s}
                onClick={() => setSymbol(s)}
                className={cn(
                  "px-3 py-1 text-xs font-mono font-bold rounded-full transition-colors",
                  symbol === s
                    ? "bg-[#6366F1] text-white"
                    : "bg-[#1E1E26] text-[#8A8A9A] hover:text-[#F0F0F0]"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-6 bg-white/[0.07]" />

        {/* Model toggle */}
        <div className="flex items-center gap-1 bg-[#0A0A0C] rounded-lg p-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
          {(["lstm", "prophet"] as ModelType[]).map((m) => (
            <button
              key={m}
              onClick={() => setModel(m)}
              className={cn(
                "px-3 py-1 text-xs font-bold rounded-md transition-colors",
                model === m
                  ? "bg-[#6366F1] text-white"
                  : "text-[#8A8A9A]"
              )}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center gap-1.5 text-xs text-[#8A8A9A]">
            <Loader2 className="w-3 h-3 animate-spin" />
            {prediction?.model === "lstm" ? "Running LSTM..." : "Running Prophet..."}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-3 gap-5">
        {/* Chart area */}
        <div className="col-span-2">
          <div className="bg-[#141418] border border-white/[0.07] rounded-xl overflow-hidden">
            {/* Chart header */}
            <div className="flex items-center justify-between p-5 border-b border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#6366F1]/10 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-white font-mono">{symbol}</h2>
                    <span className="text-xs text-[#4A4A5A] bg-[#1E1E26] px-1.5 py-0.5 rounded">
                      {exchange}
                    </span>
                  </div>
                  <p className="text-sm text-[#8A8A9A]">{name}</p>
                </div>
              </div>
              <div className="text-right">
                {isLoading ? (
                  <div className="h-6 w-20 bg-[#1E1E26] rounded animate-pulse" />
                ) : (
                  <>
                    <p className="text-xl font-black font-mono text-white">
                      {exchange === "HOSE"
                        ? Math.round(base).toLocaleString("vi-VN") + " ₫"
                        : `$${base.toFixed(2)}`}
                    </p>
                    <span className={cn("text-xs font-mono", isUp ? "text-[#A3E635]" : isDown ? "text-[#F05252]" : "text-[#8A8A9A]")}>
                      {pctChange >= 0 ? "+" : ""}{pctChange.toFixed(2)}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Chart */}
            <div className="p-4">
              {isLoading ? (
                <div className="h-[280px] flex items-center justify-center">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 text-[#6366F1] animate-spin mx-auto mb-2" />
                    <p className="text-xs text-[#8A8A9A]">
                      {prediction?.model === "lstm" ? "Training LSTM model..." : "Fitting Prophet model..."}
                    </p>
                  </div>
                </div>
              ) : prediction ? (
                <PredictionChart prediction={prediction} height={280} />
              ) : (
                <div className="h-[280px] flex items-center justify-center text-[#8A8A9A] text-sm">
                  No prediction data available
                </div>
              )}
            </div>

            {/* Stats below chart */}
            <div className="grid grid-cols-3 border-t border-white/[0.07]">
              <div className="px-5 py-4 border-r border-white/[0.07]">
                <p className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest mb-1">Trend</p>
                <div className="flex items-center gap-1">
                  {isUp ? (
                    <TrendingUp className="w-4 h-4" style={{ color: trendIconColor }} />
                  ) : isDown ? (
                    <TrendingDown className="w-4 h-4" style={{ color: trendIconColor }} />
                  ) : (
                    <TrendingUp className="w-4 h-4" style={{ color: trendIconColor }} />
                  )}
                  <span className={cn("text-sm font-bold capitalize", trendColor)}>
                    {isUp ? "↑ Bullish" : isDown ? "↓ Bearish" : "→ Neutral"}
                  </span>
                </div>
              </div>
              <div className="px-5 py-4 border-r border-white/[0.07]">
                <p className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest mb-1">Confidence</p>
                <p className="text-xl font-black font-mono text-white">
                  {prediction ? `${(prediction.confidence * 100).toFixed(0)}%` : "—"}
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest mb-1">7D Target</p>
                <p className="text-xl font-black font-mono text-[#A3E635]">
                  {prediction
                    ? exchange === "HOSE"
                      ? Math.round(targetPrice).toLocaleString("vi-VN") + " ₫"
                      : `$${targetPrice.toFixed(2)}`
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Model Info */}
          <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-[#6366F1]" />
              <h3 className="text-sm font-medium text-[#F0F0F0]">Model Info</h3>
            </div>
            <div className="space-y-2">
              {[
                { label: "Active Model", value: (prediction?.model ?? model).toUpperCase(), color: "text-[#6366F1] font-medium" },
                { label: "Training Data", value: "90 days", color: "text-[#F0F0F0] font-mono" },
                { label: "Forecast Window", value: "7 days", color: "text-[#F0F0F0] font-mono" },
                { label: "Last Updated", value: prediction ? "Just now" : "—", color: "text-[#8A8A9A]" },
                { label: "ML Service", value: isLoading ? "Computing..." : "Active", color: isLoading ? "text-[#F59E0B]" : "text-[#A3E635] font-medium" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs py-2 border-b border-white/[0.05] last:border-0">
                  <span className="text-[#8A8A9A]">{row.label}</span>
                  <span className={row.color}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-[#6366F1]/6 border border-[#6366F1]/20 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-[#6366F1] mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-[#8A8A9A] leading-relaxed">
                <span className="font-bold text-[#6366F1]">For educational purposes only.</span>{" "}
                Predictions are based on historical price patterns and do not constitute financial advice.
              </p>
            </div>
          </div>

          {/* All Forecasts */}
          <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-5">
            <h3 className="text-sm font-medium text-[#F0F0F0] mb-3">All Forecasts</h3>
            <div className="space-y-2">
              {SYMBOLS.map((s) => {
                const sExchange = EXCHANGES[s] ?? "NASDAQ";
                const sName = NAMES[s] ?? s;
                const isActive = s === symbol;
                return (
                  <div
                    key={s}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer",
                      isActive ? "bg-[#6366F1]/10" : "bg-[#1E1E26] hover:bg-[#252530]"
                    )}
                    onClick={() => setSymbol(s)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-white">{s}</span>
                      <span className="text-[10px] text-[#4A4A5A]">{sExchange}</span>
                    </div>
                    <div className="text-right">
                      {sExchange === "HOSE" ? (
                        <p className="text-xs font-mono text-[#8A8A9A]">—</p>
                      ) : (
                        <p className="text-xs font-mono text-[#8A8A9A]">
                          ${((BASE_PRICES[s] ?? 100)).toFixed(0)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Fallback base prices for display
const BASE_PRICES: Record<string, number> = {
  AAPL: 192, NVDA: 135, TSLA: 248, MSFT: 415,
  GOOGL: 175, AMZN: 196, VNM: 78500, FPT: 134000,
};

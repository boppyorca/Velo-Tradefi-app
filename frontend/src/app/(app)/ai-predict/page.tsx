"use client";

import { useState } from "react";
import { PredictionChart } from "@/components/features";
import { Button } from "@/components/ui/button";
import { RefreshCw, TrendingUp, TrendingDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Prediction } from "@/lib/types";

const SYMBOLS = ["AAPL", "NVDA", "TSLA", "VNM", "MSFT"] as const;

const BASE_PRICES: Record<string, number> = {
  AAPL: 192,
  NVDA: 135,
  TSLA: 248,
  VNM: 78500,
  MSFT: 415,
};

const EXCHANGES: Record<string, string> = {
  AAPL: "NASDAQ",
  NVDA: "NASDAQ",
  TSLA: "NASDAQ",
  VNM: "HOSE",
  MSFT: "NASDAQ",
};

const NAMES: Record<string, string> = {
  AAPL: "Apple Inc.",
  NVDA: "NVIDIA Corp.",
  TSLA: "Tesla Inc.",
  VNM: "Vietnam Dairy",
  MSFT: "Microsoft Corp.",
};

function buildPrediction(symbol: string, trend: "bullish" | "bearish" | "neutral", confidence: number): Prediction {
  const base = BASE_PRICES[symbol] ?? 192;
  const today = new Date();
  const preds = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i + 1);
    const bias = trend === "bullish" ? 0.008 : trend === "bearish" ? -0.008 : 0;
    const price = base * (1 + bias * (i + 1) + (Math.random() - 0.5) * 0.01);
    preds.push({
      date: d.toISOString().split("T")[0],
      predictedPrice: price,
      confidence: confidence - i * 0.03,
      upperBound: price * 1.015,
      lowerBound: price * 0.985,
    });
  }
  return {
    symbol,
    model: "lstm",
    currentPrice: base,
    trend,
    confidence,
    predictions: preds,
  };
}

const PREDICTIONS: Record<string, Prediction> = {
  AAPL: buildPrediction("AAPL", "bullish", 0.87),
  NVDA: buildPrediction("NVDA", "bullish", 0.91),
  TSLA: buildPrediction("TSLA", "bearish", 0.73),
  VNM: buildPrediction("VNM", "neutral", 0.68),
  MSFT: buildPrediction("MSFT", "bullish", 0.84),
};

type ModelType = "lstm" | "prophet";

export default function AIPredictPage() {
  const [symbol, setSymbol] = useState<string>("AAPL");
  const [model, setModel] = useState<ModelType>("lstm");
  const [refreshing, setRefreshing] = useState(false);

  const prediction = PREDICTIONS[symbol] ?? PREDICTIONS.AAPL;
  const base = BASE_PRICES[symbol] ?? 192;
  const exchange = EXCHANGES[symbol];
  const name = NAMES[symbol];
  const isUp = prediction.trend === "bullish";
  const trendColor = isUp ? "text-[#A3E635]" : prediction.trend === "bearish" ? "text-[#F05252]" : "text-[#6366F1]";
  const trendBg = isUp ? "bg-[#A3E635]/10" : prediction.trend === "bearish" ? "bg-[#F05252]/10" : "bg-[#6366F1]/10";
  const trendIconColor = isUp ? "#A3E635" : prediction.trend === "bearish" ? "#F05252" : "#6366F1";
  const targetPrice = prediction.predictions[prediction.predictions.length - 1]?.predictedPrice ?? base * 1.03;
  const pctChange = ((targetPrice - base) / base) * 100;

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }

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
          onClick={handleRefresh}
        >
          <RefreshCw className={`w-3 h-3 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

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
                <p className="text-xl font-black font-mono text-white">
                  {exchange === "HOSE"
                    ? base.toLocaleString("vi-VN") + " ₫"
                    : `$${base.toFixed(2)}`}
                </p>
                <span className={cn("text-xs font-mono", isUp ? "text-[#A3E635]" : "text-[#F05252]")}>
                  {isUp ? "+" : ""}{pctChange.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Chart */}
            <div className="p-4">
              <PredictionChart prediction={prediction} height={280} />
            </div>

            {/* Stats below chart */}
            <div className="grid grid-cols-3 border-t border-white/[0.07]">
              <div className="px-5 py-4 border-r border-white/[0.07]">
                <p className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest mb-1">Trend</p>
                <div className="flex items-center gap-1">
                  {isUp ? (
                    <TrendingUp className="w-4 h-4" style={{ color: trendIconColor }} />
                  ) : prediction.trend === "bearish" ? (
                    <TrendingDown className="w-4 h-4" style={{ color: trendIconColor }} />
                  ) : (
                    <TrendingUp className="w-4 h-4" style={{ color: trendIconColor }} />
                  )}
                  <span className={cn("text-sm font-bold capitalize", trendColor)}>
                    {isUp ? "↑ Bullish" : prediction.trend === "bearish" ? "↓ Bearish" : "→ Neutral"}
                  </span>
                </div>
              </div>
              <div className="px-5 py-4 border-r border-white/[0.07]">
                <p className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest mb-1">Confidence</p>
                <p className="text-xl font-black font-mono text-white">
                  {(prediction.confidence * 100).toFixed(0)}%
                </p>
              </div>
              <div className="px-5 py-4">
                <p className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest mb-1">7D Target</p>
                <p className="text-xl font-black font-mono text-[#A3E635]">
                  {exchange === "HOSE"
                    ? Math.round(targetPrice).toLocaleString("vi-VN") + " ₫"
                    : `$${targetPrice.toFixed(2)}`}
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
                { label: "Active Model", value: model.toUpperCase(), color: "text-[#6366F1] font-medium" },
                { label: "Training Data", value: "60 days", color: "text-[#F0F0F0] font-mono" },
                { label: "Forecast Window", value: "7 days", color: "text-[#F0F0F0] font-mono" },
                { label: "Last Updated", value: "Just now", color: "text-[#8A8A9A]" },
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
                const p = PREDICTIONS[s];
                const target = p.predictions[p.predictions.length - 1]?.predictedPrice ?? BASE_PRICES[s];
                const diff = ((target - BASE_PRICES[s]) / BASE_PRICES[s]) * 100;
                const up = diff >= 0;
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
                    <span className="text-xs font-bold font-mono text-white">{s}</span>
                    <div className="text-right">
                      <p className={cn("text-xs font-mono font-bold", up ? "text-[#A3E635]" : "text-[#F05252]")}>
                        {up ? "+" : ""}{diff.toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-[#4A4A5A] font-mono">
                        {EXCHANGES[s] === "HOSE"
                          ? Math.round(target).toLocaleString("vi-VN") + " ₫"
                          : `$${target.toFixed(2)}`}
                      </p>
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

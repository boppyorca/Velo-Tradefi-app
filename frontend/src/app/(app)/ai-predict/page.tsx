"use client";

import { useState } from "react";
import { PageHeader } from "@/components/features";
import { PredictionChart } from "@/components/features";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Brain, RefreshCw, TrendingUp, TrendingDown, Info } from "lucide-react";
import type { Prediction, Stock } from "@/lib/types";

const MOCK_SYMBOLS: Stock[] = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ", price: 192.10, change: 1.52, changePercent: 0.80, volume: 58_230_000, updatedAt: new Date().toISOString() },
  { symbol: "NVDA", name: "NVIDIA Corp.", exchange: "NASDAQ", price: 135.21, change: 3.17, changePercent: 2.40, volume: 42_100_000, updatedAt: new Date().toISOString() },
  { symbol: "TSLA", name: "Tesla Inc.", exchange: "NASDAQ", price: 248.50, change: -1.25, changePercent: -0.50, volume: 31_800_000, updatedAt: new Date().toISOString() },
  { symbol: "VNM", name: "Vietnam Dairy", exchange: "HOSE", price: 78500, change: -952, changePercent: -1.20, volume: 3_200_000, updatedAt: new Date().toISOString() },
  { symbol: "MSFT", name: "Microsoft Corp.", exchange: "NASDAQ", price: 415.20, change: 2.80, changePercent: 0.68, volume: 22_100_000, updatedAt: new Date().toISOString() },
];

const MOCK_PREDICTIONS: Record<string, Prediction> = {
  AAPL: {
    symbol: "AAPL", model: "lstm", currentPrice: 192.10, trend: "bullish", confidence: 0.87,
    predictions: [
      { date: "2026-03-21", predictedPrice: 193.40, confidence: 0.82, upperBound: 196.10, lowerBound: 190.70 },
      { date: "2026-03-22", predictedPrice: 194.20, confidence: 0.80, upperBound: 198.50, lowerBound: 189.90 },
      { date: "2026-03-23", predictedPrice: 195.80, confidence: 0.77, upperBound: 201.20, lowerBound: 190.40 },
      { date: "2026-03-24", predictedPrice: 196.30, confidence: 0.74, upperBound: 203.80, lowerBound: 188.80 },
      { date: "2026-03-25", predictedPrice: 197.90, confidence: 0.70, upperBound: 206.40, lowerBound: 189.40 },
      { date: "2026-03-26", predictedPrice: 198.50, confidence: 0.66, upperBound: 208.90, lowerBound: 188.10 },
      { date: "2026-03-27", predictedPrice: 199.20, confidence: 0.62, upperBound: 211.50, lowerBound: 186.90 },
    ],
  },
  NVDA: {
    symbol: "NVDA", model: "lstm", currentPrice: 135.21, trend: "bullish", confidence: 0.91,
    predictions: [
      { date: "2026-03-21", predictedPrice: 136.80, confidence: 0.88, upperBound: 139.20, lowerBound: 134.40 },
      { date: "2026-03-22", predictedPrice: 138.20, confidence: 0.86, upperBound: 141.80, lowerBound: 134.60 },
      { date: "2026-03-23", predictedPrice: 140.10, confidence: 0.83, upperBound: 144.90, lowerBound: 135.30 },
      { date: "2026-03-24", predictedPrice: 141.50, confidence: 0.80, upperBound: 147.20, lowerBound: 135.80 },
      { date: "2026-03-25", predictedPrice: 143.20, confidence: 0.76, upperBound: 150.40, lowerBound: 136.00 },
      { date: "2026-03-26", predictedPrice: 144.80, confidence: 0.72, upperBound: 153.10, lowerBound: 136.50 },
      { date: "2026-03-27", predictedPrice: 146.30, confidence: 0.68, upperBound: 156.20, lowerBound: 136.40 },
    ],
  },
  TSLA: {
    symbol: "TSLA", model: "prophet", currentPrice: 248.50, trend: "bearish", confidence: 0.73,
    predictions: [
      { date: "2026-03-21", predictedPrice: 247.20, confidence: 0.70, upperBound: 251.80, lowerBound: 242.60 },
      { date: "2026-03-22", predictedPrice: 245.80, confidence: 0.68, upperBound: 251.40, lowerBound: 240.20 },
      { date: "2026-03-23", predictedPrice: 244.30, confidence: 0.65, upperBound: 251.00, lowerBound: 237.60 },
      { date: "2026-03-24", predictedPrice: 242.90, confidence: 0.62, upperBound: 250.80, lowerBound: 235.00 },
      { date: "2026-03-25", predictedPrice: 241.50, confidence: 0.58, upperBound: 250.60, lowerBound: 232.40 },
      { date: "2026-03-26", predictedPrice: 240.10, confidence: 0.54, upperBound: 250.40, lowerBound: 229.80 },
      { date: "2026-03-27", predictedPrice: 238.70, confidence: 0.50, upperBound: 250.20, lowerBound: 227.20 },
    ],
  },
  VNM: {
    symbol: "VNM", model: "lstm", currentPrice: 78500, trend: "neutral", confidence: 0.68,
    predictions: [
      { date: "2026-03-21", predictedPrice: 78720, confidence: 0.65, upperBound: 79500, lowerBound: 77940 },
      { date: "2026-03-22", predictedPrice: 78880, confidence: 0.63, upperBound: 79800, lowerBound: 77960 },
      { date: "2026-03-23", predictedPrice: 79040, confidence: 0.60, upperBound: 80100, lowerBound: 77980 },
      { date: "2026-03-24", predictedPrice: 78960, confidence: 0.57, upperBound: 80200, lowerBound: 77720 },
      { date: "2026-03-25", predictedPrice: 79120, confidence: 0.54, upperBound: 80500, lowerBound: 77740 },
      { date: "2026-03-26", predictedPrice: 79080, confidence: 0.51, upperBound: 80600, lowerBound: 77560 },
      { date: "2026-03-27", predictedPrice: 79240, confidence: 0.48, upperBound: 80900, lowerBound: 77580 },
    ],
  },
  MSFT: {
    symbol: "MSFT", model: "lstm", currentPrice: 415.20, trend: "bullish", confidence: 0.84,
    predictions: [
      { date: "2026-03-21", predictedPrice: 416.80, confidence: 0.81, upperBound: 421.40, lowerBound: 412.20 },
      { date: "2026-03-22", predictedPrice: 418.40, confidence: 0.79, upperBound: 424.20, lowerBound: 412.60 },
      { date: "2026-03-23", predictedPrice: 420.10, confidence: 0.76, upperBound: 427.80, lowerBound: 412.40 },
      { date: "2026-03-24", predictedPrice: 421.80, confidence: 0.73, upperBound: 431.40, lowerBound: 412.20 },
      { date: "2026-03-25", predictedPrice: 423.50, confidence: 0.69, upperBound: 435.00, lowerBound: 412.00 },
      { date: "2026-03-26", predictedPrice: 425.20, confidence: 0.65, upperBound: 438.60, lowerBound: 411.80 },
      { date: "2026-03-27", predictedPrice: 427.10, confidence: 0.61, upperBound: 442.20, lowerBound: 412.00 },
    ],
  },
};

type ModelType = "lstm" | "prophet";

export default function AIPredictPage() {
  const [symbol, setSymbol] = useState("AAPL");
  const [model, setModel] = useState<ModelType>("lstm");
  const [refreshing, setRefreshing] = useState(false);

  const prediction = MOCK_PREDICTIONS[symbol] ?? MOCK_PREDICTIONS.AAPL;
  const stock = MOCK_SYMBOLS.find((s) => s.symbol === symbol) ?? MOCK_SYMBOLS[0];

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }

  const trendColor =
    prediction.trend === "bullish"
      ? "text-velo-lime"
      : prediction.trend === "bearish"
      ? "text-velo-red"
      : "text-velo-indigo";

  return (
    <div>
      <PageHeader
        title="AI Predict"
        description="7-day price forecasting powered by LSTM & Prophet"
        badge="BETA"
        badgeColor="indigo"
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Symbol selector */}
        <div className="flex items-center gap-2 bg-[#141418] border border-[rgba(255,255,255,0.07)] rounded-xl px-4 py-1.5">
          <span className="text-xs text-[#8A8A9A] font-medium">Symbol</span>
          <div className="flex flex-wrap gap-1">
            {MOCK_SYMBOLS.map((s) => (
              <button
                key={s.symbol}
                onClick={() => setSymbol(s.symbol)}
                className={cn(
                  "px-2 py-1 text-xs font-mono font-bold rounded-lg transition-colors",
                  symbol === s.symbol
                    ? "bg-velo-indigo text-white"
                    : "text-[#8A8A9A] hover:text-white hover:bg-[#1E1E26]"
                )}
              >
                {s.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Model selector */}
        <div className="flex items-center gap-2 bg-[#141418] border border-[rgba(255,255,255,0.07)] rounded-xl px-4 py-1.5">
          <Brain className="w-3.5 h-3.5 text-velo-indigo" />
          <button
            onClick={() => setModel("lstm")}
            className={cn(
              "px-2 py-1 text-xs font-bold rounded-lg transition-colors",
              model === "lstm"
                ? "bg-velo-indigo text-white"
                : "text-[#8A8A9A] hover:text-white"
            )}
          >
            LSTM
          </button>
          <button
            onClick={() => setModel("prophet")}
            className={cn(
              "px-2 py-1 text-xs font-bold rounded-lg transition-colors",
              model === "prophet"
                ? "bg-velo-indigo text-white"
                : "text-[#8A8A9A] hover:text-white"
            )}
          >
            Prophet
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-8 border-[rgba(255,255,255,0.12)] text-xs text-[#8A8A9A] hover:text-white"
          onClick={handleRefresh}
        >
          <RefreshCw className={`w-3 h-3 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main chart */}
        <div className="lg:col-span-2 rounded-2xl bg-[#141418] border border-velo-indigo/20 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-velo-indigo/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-velo-indigo" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white font-mono">{symbol}</h2>
                  <span className="text-xs text-[#4A4A5A] bg-[#1E1E26] px-1.5 py-0.5 rounded">
                    {stock.exchange}
                  </span>
                </div>
                <p className="text-sm text-[#8A8A9A]">{stock.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-black font-mono text-white">
                ${stock.exchange === "HOSE"
                  ? stock.price.toLocaleString()
                  : stock.price.toFixed(2)}
              </p>
              <span className={cn("text-xs font-mono", stock.change >= 0 ? "text-velo-lime" : "text-velo-red")}>
                {stock.change >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
              </span>
            </div>
          </div>

          <PredictionChart prediction={prediction} height={300} />

          {/* Summary */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#0A0A0C]">
              <p className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest mb-1">Trend</p>
              <div className="flex items-center gap-1">
                {prediction.trend === "bullish" ? (
                  <TrendingUp className="w-4 h-4 text-velo-lime" />
                ) : prediction.trend === "bearish" ? (
                  <TrendingDown className="w-4 h-4 text-velo-red" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-velo-indigo" />
                )}
                <span className={cn("text-sm font-bold capitalize", trendColor)}>
                  {prediction.trend}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#0A0A0C]">
              <p className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest mb-1">Confidence</p>
              <p className="text-xl font-black font-mono text-white">
                {(prediction.confidence * 100).toFixed(0)}%
              </p>
            </div>
            <div className="p-3 rounded-xl bg-[#0A0A0C]">
              <p className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest mb-1">7D Target</p>
              <p className="text-xl font-black font-mono text-velo-lime">
                ${prediction.predictions[prediction.predictions.length - 1].predictedPrice.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          {/* Model info */}
          <div className="rounded-2xl bg-[#141418] border border-[rgba(255,255,255,0.07)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="w-4 h-4 text-velo-indigo" />
              <h3 className="text-sm font-bold text-white">Model Info</h3>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[#8A8A9A]">Active Model</span>
                <span className="font-bold text-velo-indigo">{model.toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8A9A]">Training Data</span>
                <span className="text-white">60 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8A9A]">Forecast Window</span>
                <span className="text-white">7 days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8A9A]">Last Updated</span>
                <span className="text-white">Just now</span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="rounded-2xl bg-velo-indigo/5 border border-velo-indigo/20 p-4">
            <div className="flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-velo-indigo mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-[#8A8A9A] leading-relaxed">
                <span className="font-bold text-velo-indigo">For educational purposes only.</span>{" "}
                Predictions are based on historical price patterns and do not constitute financial advice.{" "}
                Always do your own research before making investment decisions.
              </p>
            </div>
          </div>

          {/* All symbols predictions summary */}
          <div className="rounded-2xl bg-[#141418] border border-[rgba(255,255,255,0.07)] p-5">
            <h3 className="text-sm font-bold text-white mb-3">All Forecasts</h3>
            <div className="space-y-2">
              {MOCK_SYMBOLS.map((s) => {
                const p = MOCK_PREDICTIONS[s.symbol];
                const target = p?.predictions[p.predictions.length - 1].predictedPrice;
                const diff = target && s.price ? ((target - s.price) / s.price) * 100 : 0;
                const isUp = diff >= 0;
                return (
                  <div
                    key={s.symbol}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl transition-colors cursor-pointer",
                      symbol === s.symbol ? "bg-velo-indigo/10" : "bg-[#1E1E26] hover:bg-[#252530]"
                    )}
                    onClick={() => setSymbol(s.symbol)}
                  >
                    <div>
                      <span className="text-xs font-bold font-mono text-white">{s.symbol}</span>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-mono font-bold ${isUp ? "text-velo-lime" : "text-velo-red"}`}>
                        {isUp ? "+" : ""}{diff.toFixed(1)}%
                      </p>
                      <p className="text-[10px] text-[#4A4A5A] font-mono">
                        ${target?.toFixed(s.exchange === "HOSE" ? 0 : 2)}
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

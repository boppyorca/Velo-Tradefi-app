"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/features";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PredictionChart } from "@/components/features";
import { StockChart } from "@/components/features/StockChart";
import { cn } from "@/lib/utils";
import { useStockQuote, useStockHistory } from "@/lib/hooks";
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Star,
  StarOff,
  Brain,
  AlertCircle,
} from "lucide-react";
import type { Prediction } from "@/lib/types";

const MOCK_PREDICTION: Prediction = {
  symbol: "AAPL",
  model: "lstm",
  currentPrice: 192.10,
  trend: "bullish",
  confidence: 0.87,
  predictions: [
    { date: new Date(Date.now() + 86400000).toISOString().split("T")[0], predictedPrice: 193.40, confidence: 0.82, upperBound: 196.10, lowerBound: 190.70 },
    { date: new Date(Date.now() + 172800000).toISOString().split("T")[0], predictedPrice: 194.20, confidence: 0.80, upperBound: 198.50, lowerBound: 189.90 },
    { date: new Date(Date.now() + 259200000).toISOString().split("T")[0], predictedPrice: 195.80, confidence: 0.77, upperBound: 201.20, lowerBound: 190.40 },
    { date: new Date(Date.now() + 345600000).toISOString().split("T")[0], predictedPrice: 196.30, confidence: 0.74, upperBound: 203.80, lowerBound: 188.80 },
    { date: new Date(Date.now() + 432000000).toISOString().split("T")[0], predictedPrice: 197.90, confidence: 0.70, upperBound: 206.40, lowerBound: 189.40 },
    { date: new Date(Date.now() + 518400000).toISOString().split("T")[0], predictedPrice: 198.50, confidence: 0.66, upperBound: 208.90, lowerBound: 188.10 },
    { date: new Date(Date.now() + 604800000).toISOString().split("T")[0], predictedPrice: 199.20, confidence: 0.62, upperBound: 211.50, lowerBound: 186.90 },
  ],
};

const TIMEFRAMES = ["1D", "1W", "1M", "3M", "1Y", "ALL"] as const;
type Timeframe = (typeof TIMEFRAMES)[number];

function formatLargeNum(n: number, currency: "USD" | "VND" = "USD") {
  if (currency === "VND") {
    if (n >= 1_000_000_000_000) return `₫${(n / 1_000_000_000_000).toFixed(2)}T`;
    if (n >= 1_000_000_000) return `₫${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `₫${(n / 1_000_000).toFixed(1)}M`;
    return `₫${n.toLocaleString("vi-VN")}`;
  }
  if (n >= 1_000_000_000_000) return `$${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

export default function StockDetailPage() {
  const params = useParams();
  const router = useRouter();
  const symbol = typeof params.symbol === "string" ? params.symbol.toUpperCase() : "AAPL";

  const [watched, setWatched] = useState(false);
  const [timeframe, setTimeframe] = useState<Timeframe>("1M");

  const { data: quote, isLoading: quoteLoading, error: quoteError } = useStockQuote(symbol);
  const { data: history, isLoading: historyLoading } = useStockHistory(symbol, timeframe);
  const isUp = (quote?.change ?? 0) >= 0;
  const isVN = quote?.exchange === "HOSE" || quote?.exchange === "HNX";
  const currency = isVN ? "VND" : "USD";

  const formatPrice = (price: number) =>
    currency === "VND"
      ? `₫${price.toLocaleString("vi-VN")}`
      : `$${price.toFixed(2)}`;

  if (quoteError) {
    return (
      <div>
        <button
          onClick={() => router.push("/markets")}
          className="flex items-center gap-1.5 text-sm text-[#8A8A9A] hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Markets
        </button>
        <div className="rounded-2xl bg-[#141418] border border-velo-red/20 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-velo-red mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Failed to load stock</h2>
          <p className="text-sm text-[#8A8A9A] mb-4">{quoteError.message}</p>
          <Button variant="outline" onClick={() => router.push("/markets")} className="border-[rgba(255,255,255,0.12)]">
            Back to Markets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => router.push("/markets")}
        className="flex items-center gap-1.5 text-sm text-[#8A8A9A] hover:text-white transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Markets
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          {quoteLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-24 bg-[#1E1E26]" />
              <Skeleton className="h-4 w-32 bg-[#1E1E26]" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-white tracking-tight">{symbol}</h1>
                <span className="text-sm font-medium text-[#4A4A5A] bg-[#1E1E26] px-2 py-0.5 rounded">
                  {quote?.exchange ?? "—"}
                </span>
                <button
                  onClick={() => setWatched((w) => !w)}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    watched ? "text-velo-lime bg-velo-lime/10" : "text-[#4A4A5A] hover:text-[#8A8A9A]"
                  )}
                >
                  {watched ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-sm text-[#8A8A9A]">{quote?.name ?? "—"}</p>
            </>
          )}
        </div>

        {quoteLoading ? (
          <div className="text-right space-y-2">
            <Skeleton className="h-10 w-32 bg-[#1E1E26] ml-auto" />
            <Skeleton className="h-5 w-24 bg-[#1E1E26] ml-auto" />
          </div>
        ) : (
          <div className="text-right">
            <p className="text-4xl font-black text-white font-mono tracking-tight">
              {formatPrice(quote?.price ?? 0)}
            </p>
            <div className="flex items-center justify-end gap-2 mt-1">
              {isUp ? (
                <TrendingUp className="w-4 h-4 text-velo-lime" />
              ) : (
                <TrendingDown className="w-4 h-4 text-velo-red" />
              )}
              <span className={cn("text-base font-mono font-bold", isUp ? "text-velo-lime" : "text-velo-red")}>
                {isUp ? "+" : ""}{formatPrice(Math.abs(quote?.change ?? 0))} ({isUp ? "+" : ""}{(quote?.changePercent ?? 0).toFixed(2)}%)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-[#141418] border border-[rgba(255,255,255,0.07)] h-9 p-1 gap-1">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-velo-lime data-[state=active]:text-[#0A0A0C] data-[state=active]:font-bold text-xs h-7"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="prediction"
            className="data-[state=active]:bg-velo-indigo data-[state=active]:text-white data-[state=active]:font-bold text-xs h-7"
          >
            <Brain className="w-3 h-3 mr-1" />
            AI Prediction
          </TabsTrigger>
          <TabsTrigger
            value="fundamentals"
            className="data-[state=active]:bg-velo-lime data-[state=active]:text-[#0A0A0C] data-[state=active]:font-bold text-xs h-7"
          >
            Fundamentals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Chart */}
          <div className="rounded-2xl bg-[#141418] border border-[rgba(255,255,255,0.07)] p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1 bg-[#1E1E26] rounded-lg p-1">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors",
                      timeframe === tf
                        ? "bg-velo-lime text-[#0A0A0C] font-bold"
                        : "text-[#8A8A9A] hover:text-white"
                    )}
                  >
                    {tf}
                  </button>
                ))}
              </div>
              <span className="text-xs text-[#4A4A5A]">
                Prices in {currency === "VND" ? "VND" : "USD"}
              </span>
            </div>

            {historyLoading ? (
              <div className="h-72 rounded-xl bg-[#0A0A0C] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-velo-lime/30 border-t-velo-lime rounded-full animate-spin" />
                  <p className="text-xs text-[#4A4A5A]">Loading chart data...</p>
                </div>
              </div>
            ) : history && history.length > 0 ? (
              <StockChart
                data={history.map((h) => ({
                  date: new Date(h.Date),
                  open: Number(h.Open),
                  high: Number(h.High),
                  low: Number(h.Low),
                  close: Number(h.Close),
                  volume: Number(h.Volume),
                }))}
                height={288}
                currency={currency}
              />
            ) : (
              <div className="h-72 rounded-xl bg-[#0A0A0C] flex items-center justify-center text-[#4A4A5A] text-sm">
                No chart data available for {symbol}
              </div>
            )}
          </div>

          {/* Key stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Open", value: quote?.open ? formatPrice(quote.open) : "—" },
              { label: "High", value: quote?.high ? formatPrice(quote.high) : "—" },
              { label: "Low", value: quote?.low ? formatPrice(quote.low) : "—" },
              { label: "Prev Close", value: quote?.previousClose ? formatPrice(quote.previousClose) : "—" },
              { label: "Volume", value: quote?.volume ? formatLargeNum(quote.volume, currency) : "—" },
              { label: "Mkt Cap", value: quote?.marketCap ? formatLargeNum(quote.marketCap, currency) : "—" },
              { label: "52W High", value: "—" },
              { label: "52W Low", value: "—" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-3 rounded-xl bg-[#141418] border border-[rgba(255,255,255,0.07)]"
              >
                <p className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest mb-1">
                  {stat.label}
                </p>
                <p className="text-sm font-mono font-bold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="prediction" className="space-y-4">
          <div className="rounded-2xl bg-[#141418] border border-velo-indigo/20 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-velo-indigo/10 flex items-center justify-center">
                <Brain className="w-4 h-4 text-velo-indigo" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">LSTM Forecast</h2>
                <p className="text-xs text-[#8A8A9A]">7-day price prediction</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-xs font-mono text-[#4A4A5A]">Model:</span>
                <span className="text-xs font-bold text-velo-indigo bg-velo-indigo/10 px-2 py-0.5 rounded">
                  LSTM
                </span>
              </div>
            </div>

            <PredictionChart prediction={MOCK_PREDICTION} height={280} />

            {/* Prediction table */}
            <div className="mt-4 rounded-xl bg-[#0A0A0C] overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.06)]">
                    <th className="text-left px-4 py-2 text-[#4A4A5A] font-bold uppercase tracking-widest">Date</th>
                    <th className="text-right px-4 py-2 text-[#4A4A5A] font-bold uppercase tracking-widest">Predicted</th>
                    <th className="text-right px-4 py-2 text-[#4A4A5A] font-bold uppercase tracking-widest">High</th>
                    <th className="text-right px-4 py-2 text-[#4A4A5A] font-bold uppercase tracking-widest">Low</th>
                    <th className="text-right px-4 py-2 text-[#4A4A5A] font-bold uppercase tracking-widest">Conf</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PREDICTION.predictions.map((p) => {
                    const isUpFromCurrent = p.predictedPrice > MOCK_PREDICTION.currentPrice;
                    return (
                      <tr key={p.date} className="border-b border-[rgba(255,255,255,0.04)]">
                        <td className="px-4 py-2 text-[#8A8A9A]">{p.date}</td>
                        <td className={cn("px-4 py-2 text-right font-mono font-bold", isUpFromCurrent ? "text-velo-lime" : "text-velo-red")}>
                          ${p.predictedPrice.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-velo-lime/70">
                          ${p.upperBound.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right font-mono text-velo-red/70">
                          ${p.lowerBound.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <span className={cn(
                            "font-mono px-1.5 py-0.5 rounded",
                            p.confidence >= 0.8 ? "bg-velo-lime/10 text-velo-lime" : "bg-velo-amber/10 text-velo-amber"
                          )}>
                            {(p.confidence * 100).toFixed(0)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="fundamentals">
          <div className="rounded-2xl bg-[#141418] border border-[rgba(255,255,255,0.07)] p-5">
            <p className="text-center text-[#8A8A9A] py-16">Fundamental data coming from Yahoo Finance API</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

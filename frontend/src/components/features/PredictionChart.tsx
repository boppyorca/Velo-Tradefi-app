"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Prediction } from "@/lib/types";

interface PredictionChartProps {
  prediction: Prediction;
  height?: number;
}

function formatPrice(v: number, symbol: string): string {
  const isVN = symbol === "VNM";
  if (isVN) return `${v.toLocaleString("vi-VN")}`;
  return `$${v.toFixed(2)}`;
}

const SYMBOL_BASE: Record<string, number> = {
  AAPL: 192,
  NVDA: 135,
  TSLA: 248,
  VNM: 78500,
  MSFT: 415,
};

function generateData(symbol: string, prediction: Prediction) {
  const base = SYMBOL_BASE[symbol] ?? 192;
  const today = new Date();
  const data: Array<{
    date: string;
    actual: number | null;
    predicted: number | null;
  }> = [];

  // Historical: 30 days ago → today
  for (let i = 29; i >= 1; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const price = base * (0.94 + Math.random() * 0.06);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      actual: price,
      predicted: null,
    });
  }

  // Today
  data.push({
    date: today.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    actual: prediction.currentPrice,
    predicted: null,
  });

  // Predictions: 7 days
  prediction.predictions.forEach((p) => {
    const d = new Date(p.date);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      actual: null,
      predicted: p.predictedPrice,
    });
  });

  return data;
}

export function PredictionChart({ prediction, height = 280 }: PredictionChartProps) {
  const trendColor =
    prediction.trend === "bullish"
      ? "#A3E635"
      : prediction.trend === "bearish"
      ? "#F05252"
      : "#6366F1";

  const data = useMemo(() => generateData(prediction.symbol, prediction), [prediction]);

  // Find "today" index
  const todayIndex = data.findIndex(
    (d) =>
      d.actual !== null &&
      d.predicted === null
  );

  return (
    <div className="relative" style={{ height }}>
      {/* Confidence badge */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-[#141418]/80 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/[0.08]">
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: trendColor }} />
        <span className="text-xs font-mono font-semibold" style={{ color: trendColor }}>
          {(prediction.confidence * 100).toFixed(0)}% conf
        </span>
        <span className="text-[10px] text-[#4A4A5A] uppercase tracking-wider">
          {prediction.model}
        </span>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fill: "#4A4A5A", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={{ stroke: "rgba(255,255,255,0.07)" }}
            tickLine={false}
            interval={6}
          />
          <YAxis
            tick={{ fill: "#4A4A5A", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatPrice(v, prediction.symbol)}
            width={72}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1E1E26",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#8A8A9A", fontSize: 11 }}
            itemStyle={{ fontFamily: "JetBrains Mono, monospace", fontSize: 12 }}
            formatter={(value: number, name: string) => [
              formatPrice(value, prediction.symbol),
              name === "actual" ? "Historical" : "Predicted",
            ]}
          />

          {/* Today divider */}
          {todayIndex > 0 && (
            <ReferenceLine
              x={data[todayIndex]?.date}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="4 4"
              label={{ value: "Today", fill: "#4A4A5A", fontSize: 10, position: "top" }}
            />
          )}

          {/* Historical line */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#8A8A9A"
            strokeWidth={2}
            dot={false}
            connectNulls={false}
            name="Historical"
          />

          {/* Predicted line */}
          <Line
            type="monotone"
            dataKey="predicted"
            stroke={trendColor}
            strokeWidth={2.5}
            strokeDasharray="6 3"
            dot={{ fill: trendColor, r: 3, strokeWidth: 0 }}
            connectNulls={false}
            name="Predicted"
          />

          <Legend
            iconType="line"
            wrapperStyle={{ fontSize: 11, color: "#8A8A9A" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

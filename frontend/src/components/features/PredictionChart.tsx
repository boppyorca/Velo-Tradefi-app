"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import type { Prediction } from "@/lib/types";

interface PredictionChartProps {
  prediction: Prediction;
  height?: number;
}

export function PredictionChart({
  prediction,
  height = 240,
}: PredictionChartProps) {
  const { historical, forecast, upperBound, lowerBound } = useMemo(() => {
    const currentPrice = prediction.currentPrice;
    const preds = prediction.predictions;

    const historical = [
      currentPrice * 0.94,
      currentPrice * 0.96,
      currentPrice * 0.98,
      currentPrice * 0.99,
      currentPrice,
    ];

    const forecast = preds.map((p) => p.predictedPrice);
    const all = [...historical, ...forecast];
    const min = Math.min(...all, ...preds.map((p) => p.lowerBound));
    const max = Math.max(...all, ...preds.map((p) => p.upperBound));
    const range = max - min || 1;

    const upperBound = preds.map((p) => p.upperBound);
    const lowerBound = preds.map((p) => p.lowerBound);

    const normalize = (v: number) =>
      height - ((v - min) / range) * height;

    return {
      historical: historical.map((v, i) => ({ x: i, y: normalize(v) })),
      forecast: forecast.map((v, i) => ({
        x: historical.length + i,
        y: normalize(v),
      })),
      upperBound: upperBound.map((v, i) => ({
        x: historical.length + i,
        y: normalize(v),
      })),
      lowerBound: lowerBound.map((v, i) => ({
        x: historical.length + i,
        y: normalize(v),
      })),
      min,
      max,
      range,
    };
  }, [prediction, height]);

  const trendColor =
    prediction.trend === "bullish"
      ? "#A3E635"
      : prediction.trend === "bearish"
      ? "#F05252"
      : "#6366F1";

  const polylinePoints = (pts: { x: number; y: number }[]) =>
    pts.map((p) => `${p.x},${p.y}`).join(" ");

  const maxX = historical.length + forecast.length - 1;

  return (
    <div className="relative" style={{ height }}>
      <svg
        viewBox={`0 0 ${maxX + 1} ${height}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((r) => {
          const y = height * r;
          return (
            <line
              key={r}
              x1="0"
              x2={maxX + 1}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth="0.5"
            />
          );
        })}

        {/* Confidence band */}
        <polygon
          points={[
            ...upperBound.map((p) => `${p.x},${p.y}`),
            ...[...lowerBound].reverse().map((p) => `${p.x},${p.y}`),
          ].join(" ")}
          fill={trendColor}
          fillOpacity="0.06"
        />

        {/* Historical line */}
        <polyline
          points={polylinePoints(historical)}
          fill="none"
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Forecast line */}
        <polyline
          points={polylinePoints(forecast)}
          fill="none"
          stroke={trendColor}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeDasharray="4 2"
        />

        {/* Dots */}
        {forecast.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2.5"
            fill={trendColor}
            fillOpacity="0.8"
          />
        ))}

        {/* Divider line */}
        <line
          x1={historical.length - 0.5}
          x2={historical.length - 0.5}
          y1="0"
          y2={height}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="0.5"
          strokeDasharray="3 3"
        />
      </svg>

      {/* Labels */}
      <div className="flex justify-between mt-2 text-[10px] text-[#4A4A5A] font-mono">
        <span>7d ago</span>
        <span>Today</span>
        <span>+7d forecast</span>
      </div>

      {/* Confidence badge */}
      <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-[#141418]/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-[rgba(255,255,255,0.08)]">
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: trendColor }}
        />
        <span className="text-xs font-mono font-semibold" style={{ color: trendColor }}>
          {(prediction.confidence * 100).toFixed(0)}% conf
        </span>
        <span className="text-[10px] text-[#4A4A5A] uppercase tracking-wider">
          {prediction.model.toUpperCase()}
        </span>
      </div>
    </div>
  );
}

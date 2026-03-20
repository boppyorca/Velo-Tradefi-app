"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { cn } from "@/lib/utils";

export interface StockHistoryPoint {
  date: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface StockChartProps {
  data: StockHistoryPoint[];
  height?: number;
  symbol?: string;
  currency?: "USD" | "VND";
  showGrid?: boolean;
  showVolume?: boolean;
  className?: string;
}

function formatDate(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatDateShort(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatPrice(value: number, currency?: "USD" | "VND"): string {
  if (currency === "VND") {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatVolume(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toString();
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    payload: StockHistoryPoint;
  }>;
  label?: string;
  currency?: "USD" | "VND";
}

function CustomTooltip({ active, payload, label, currency }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload as StockHistoryPoint;
  if (!point) return null;

  const isUp = point.close >= point.open;

  return (
    <div className="bg-[#1A1A24] border border-[rgba(255,255,255,0.1)] rounded-xl p-3 shadow-2xl min-w-[160px]">
      <p className="text-[10px] text-[#8A8A9A] font-mono mb-2">
        {new Date(label ?? point.date).toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-[10px] text-[#6B6B7B]">Open</span>
          <span className="text-xs font-mono text-white">{formatPrice(point.open, currency)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[10px] text-[#6B6B7B]">High</span>
          <span className="text-xs font-mono text-velo-lime">{formatPrice(point.high, currency)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[10px] text-[#6B6B7B]">Low</span>
          <span className="text-xs font-mono text-velo-red">{formatPrice(point.low, currency)}</span>
        </div>
        <div className="border-t border-[rgba(255,255,255,0.06)] pt-1.5 mt-1.5 flex justify-between gap-4">
          <span className="text-[10px] text-[#6B6B7B]">Close</span>
          <span className={cn(
            "text-xs font-mono font-bold",
            isUp ? "text-velo-lime" : "text-velo-red"
          )}>
            {formatPrice(point.close, currency)}
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-[10px] text-[#6B6B7B]">Volume</span>
          <span className="text-xs font-mono text-[#8A8A9A]">{formatVolume(point.volume)}</span>
        </div>
      </div>
    </div>
  );
}

export function StockChart({
  data,
  height = 320,
  currency = "USD",
  showGrid = true,
  className,
}: StockChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-xl bg-[#0A0A0C] text-[#4A4A5A] text-sm",
          className
        )}
        style={{ height }}
      >
        No chart data available
      </div>
    );
  }

  // Determine trend from first to last close
  const firstClose = data[0]?.close ?? 0;
  const lastClose = data[data.length - 1]?.close ?? 0;
  const isUp = lastClose >= firstClose;
  const lineColor = isUp ? "#A3E635" : "#F05252";
  const gradientId = isUp ? "colorUp" : "colorDown";
  const fillOpacity = 0.15;

  // Calculate domain with padding
  const allPrices = data.flatMap(d => [d.high, d.low]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;

  // Format x-axis labels (show fewer labels for readability)
  const labelInterval = Math.max(1, Math.floor(data.length / 6));

  return (
    <div className={cn("", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={data}
          margin={{ top: 10, right: 4, left: 4, bottom: 0 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={fillOpacity} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          {showGrid && (
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
          )}

          <XAxis
            dataKey="date"
            tickFormatter={formatDateShort}
            tick={{ fill: "#6B6B7B", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={false}
            tickLine={false}
            interval={labelInterval}
            dy={6}
          />

          <YAxis
            domain={[minPrice - padding, maxPrice + padding]}
            tickFormatter={(v) => formatPrice(v, currency).replace(/\.00$/, "")}
            tick={{ fill: "#6B6B7B", fontSize: 10, fontFamily: "JetBrains Mono, monospace" }}
            axisLine={false}
            tickLine={false}
            width={70}
            dx={-4}
          />

          <Tooltip
            content={<CustomTooltip currency={currency} />}
            cursor={{
              stroke: "rgba(255,255,255,0.1)",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />

          {/* Current price reference line */}
          <ReferenceLine
            y={lastClose}
            stroke={lineColor}
            strokeOpacity={0.3}
            strokeDasharray="2 4"
            strokeWidth={1}
          />

          <Area
            type="monotone"
            dataKey="close"
            stroke={lineColor}
            strokeWidth={2}
            fillOpacity={1}
            fill={`url(#${gradientId})`}
            dot={false}
            activeDot={{
              r: 4,
              fill: lineColor,
              stroke: "#0A0A0C",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

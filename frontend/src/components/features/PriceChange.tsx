"use client";

import Link from "next/link";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriceChangeProps {
  value: number;
  percent?: number;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export function PriceChange({
  value,
  percent,
  size = "md",
  showIcon = true,
}: PriceChangeProps) {
  const isPositive = value > 0;
  const isNeutral = value === 0;

  const colorClass = isNeutral
    ? "text-[#8A8A9A]"
    : isPositive
    ? "text-velo-lime"
    : "text-velo-red";

  const sizeMap = {
    sm: "text-xs font-mono",
    md: "text-sm font-mono font-semibold",
    lg: "text-base font-mono font-bold",
  };

  const iconSize = size === "sm" ? 10 : size === "md" ? 12 : 14;

  return (
    <span className={cn("inline-flex items-center gap-1", colorClass, sizeMap[size])}>
      {showIcon && (
        <>
          {isNeutral ? (
            <Minus size={iconSize} />
          ) : isPositive ? (
            <TrendingUp size={iconSize} />
          ) : (
            <TrendingDown size={iconSize} />
          )}
        </>
      )}
      {isNeutral ? "0.00%" : `${isPositive ? "+" : ""}${value.toFixed(2)}${percent !== undefined ? "%" : ""}`}
    </span>
  );
}

"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  badge?: string;
  badgeColor?: "lime" | "red" | "indigo" | "purple" | "amber";
}

const BADGE_COLORS = {
  lime: "bg-velo-lime/10 text-velo-lime border-velo-lime/20",
  red: "bg-velo-red/10 text-velo-red border-velo-red/20",
  indigo: "bg-velo-indigo/10 text-velo-indigo border-velo-indigo/20",
  purple: "bg-velo-purple/10 text-velo-purple border-velo-purple/20",
  amber: "bg-velo-amber/10 text-velo-amber border-velo-amber/20",
};

export function PageHeader({
  title,
  description,
  action,
  badge,
  badgeColor = "lime",
}: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-black text-white tracking-tight">{title}</h1>
          {badge && (
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border",
                BADGE_COLORS[badgeColor]
              )}
            >
              {badge}
            </span>
          )}
        </div>
        {description && (
          <p className="text-sm text-[#8A8A9A]">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={cn("p-4 rounded-xl bg-[#141418] border border-[rgba(255,255,255,0.07)]", className)}>
      <Skeleton className="h-4 w-24 mb-3 bg-[#1E1E26]" />
      <Skeleton className="h-6 w-32 mb-2 bg-[#1E1E26]" />
      <Skeleton className="h-3 w-40 bg-[#1E1E26]" />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-2xl bg-[#1E1E26] flex items-center justify-center mb-4 text-[#4A4A5A]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#8A8A9A] max-w-xs mb-4">{description}</p>
      )}
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  change,
  sub,
  icon,
}: {
  label: string;
  value: string;
  change?: number;
  sub?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="p-4 rounded-xl bg-[#141418] border border-[rgba(255,255,255,0.07)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest">
          {label}
        </span>
        {icon && (
          <span className="text-[#4A4A5A]">{icon}</span>
        )}
      </div>
      <p className="text-xl font-black text-white font-mono mb-1">{value}</p>
      <div className="flex items-center gap-2">
        {change !== undefined && (
          <span
            className={cn(
              "text-xs font-mono",
              change >= 0 ? "text-velo-lime" : "text-velo-red"
            )}
          >
            {change >= 0 ? "+" : ""}{change.toFixed(2)}%
          </span>
        )}
        {sub && (
          <span className="text-xs text-[#4A4A5A]">{sub}</span>
        )}
      </div>
    </div>
  );
}

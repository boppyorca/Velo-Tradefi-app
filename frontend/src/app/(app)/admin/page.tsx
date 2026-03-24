"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";
import { adminApi } from "@/lib/api-client";
import type { AdminActivityItem, AdminStatCard } from "@/lib/types";
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  Shield,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatRelativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const diffSec = Math.floor((Date.now() - t) / 1000);
  if (diffSec < 45) return "just now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)} day${Math.floor(diffSec / 86400) === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString();
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStatCard[] | null>(null);
  const [recentActivity, setRecentActivity] = useState<AdminActivityItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (user?.role !== "Admin") {
        setLoading(false);
        return;
      }
      try {
        const res = await adminApi.dashboard();
        if (cancelled) return;
        setStats(res.data.stats);
        setRecentActivity(res.data.recentActivity);
        setError(null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load dashboard");
          setStats(null);
          setRecentActivity(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role]);

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-[#F0F0F0] mb-1">
          Welcome back, <span className="text-[#A3E635]">{user?.fullName}</span>
        </h1>
        <p className="text-sm text-[#4A4A5A]">
          Admin Dashboard &mdash;{" "}
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {user?.role !== "Admin" && (
        <div className="rounded-xl border border-white/[0.07] bg-[#141418] p-5 text-sm text-[#8A8A9A]">
          You need the Admin role to view this dashboard.
        </div>
      )}

      {user?.role === "Admin" && loading && (
        <div className="flex items-center gap-2 text-sm text-[#8A8A9A]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading live metrics…
        </div>
      )}

      {user?.role === "Admin" && error && (
        <div className="rounded-xl border border-[#F05252]/30 bg-[#F05252]/[0.08] p-4 text-sm text-[#F0A0A0]">
          {error}
        </div>
      )}

      {user?.role === "Admin" && stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="bg-[#141418] border border-white/[0.07] rounded-xl p-4"
            >
              <p className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest mb-2">
                {stat.label}
              </p>
              <p className="text-2xl font-bold text-[#F0F0F0] font-mono mb-1">{stat.value}</p>
              <div className="flex items-center gap-1">
                {stat.up ? (
                  <TrendingUp className="w-3 h-3 text-[#A3E635]" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-[#F05252]" />
                )}
                <span
                  className={cn(
                    "text-[11px] font-medium font-mono",
                    stat.up ? "text-[#A3E635]" : "text-[#F05252]"
                  )}
                >
                  {stat.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {user?.role === "Admin" && recentActivity !== null && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-[#8A8A9A]" />
              <h2 className="text-sm font-semibold text-[#F0F0F0]">Recent Activity</h2>
            </div>

            {recentActivity.length === 0 ? (
              <p className="text-sm text-[#4A4A5A]">No activity recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map((item, i) => (
                  <div
                    key={`${item.occurredAtUtc}-${i}`}
                    className="flex items-center gap-3 py-2 border-b border-white/[0.05] last:border-0"
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        item.type === "warning"
                          ? "bg-[#F05252]"
                          : item.type === "admin"
                            ? "bg-[#A3E635]"
                            : "bg-[#8A8A9A]"
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-[#F0F0F0] truncate">{item.action}</p>
                      <p className="text-[11px] text-[#4A4A5A] truncate">{item.user}</p>
                    </div>
                    <span className="text-[11px] text-[#4A4A5A] flex-shrink-0">
                      {formatRelativeTime(item.occurredAtUtc)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-[#8A8A9A]" />
              <h2 className="text-sm font-semibold text-[#F0F0F0]">Admin Actions</h2>
            </div>

            <div className="space-y-3">
              {[
                { label: "Manage Users", icon: Users, desc: "View and manage user accounts" },
                { label: "System Alerts", icon: AlertTriangle, desc: "Configure system alerts & thresholds" },
                { label: "AI Model Config", icon: Activity, desc: "Manage prediction model settings" },
              ].map((action) => (
                <button
                  key={action.label}
                  type="button"
                  className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#0A0A0C] border border-white/[0.06] hover:border-white/[0.12] hover:bg-[#0F0F13] transition-colors text-left group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#A3E635]/[0.10] flex items-center justify-center flex-shrink-0 group-hover:bg-[#A3E635]/[0.15] transition-colors">
                    <action.icon className="w-4 h-4 text-[#A3E635]" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-[#F0F0F0]">{action.label}</p>
                    <p className="text-[11px] text-[#4A4A5A]">{action.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

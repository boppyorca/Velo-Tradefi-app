"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  TrendingUp,
  Brain,
  Wallet,
  Newspaper,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/markets", label: "Markets", icon: TrendingUp },
  { href: "/ai-predict", label: "AI Predict", icon: Brain },
  { href: "/web3", label: "Web3 Wallet", icon: Wallet },
  { href: "/news", label: "News Feed", icon: Newspaper },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

const EXCHANGES = [
  { name: "NASDAQ", status: "live" as const },
  { name: "HOSE", status: "dim" as const },
  { name: "NYSE", status: "live" as const },
  { name: "HNX", status: "dim" as const },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] bg-sidebar flex flex-col py-6 z-50 border-r border-[rgba(255,255,255,0.07)]">
      {/* Logo */}
      <div className="px-6 mb-10 flex items-center gap-3">
        <div className="w-8 h-8 bg-velo-lime flex items-center justify-center rounded-sm flex-shrink-0">
          <Zap className="w-4 h-4 text-[#0A0A0C] font-bold fill-current" />
        </div>
        <div>
          <h1 className="text-velo-lime font-black tracking-tighter text-xl leading-none">
            VELO
          </h1>
          <p className="text-[10px] text-[#4A4A5A] tracking-[0.2em] font-bold">
            TERMINAL
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/dashboard"
              ? pathname === "/dashboard" || pathname === "/" || pathname === "/(app)"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center px-4 py-3 gap-3 transition-all duration-200 rounded-sm text-sm font-medium tracking-tight",
                isActive
                  ? "bg-velo-lime-dim border-l-2 border-velo-lime text-velo-lime font-bold"
                  : "text-[#8A8A9A] hover:text-[#F0F0F0] hover:bg-[#1E1E26]"
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Exchange Status */}
      <div className="mt-auto px-6 pt-6 border-t border-[rgba(255,255,255,0.07)]">
        <p className="text-[10px] text-[#4A4A5A] font-bold mb-4 tracking-widest uppercase">
          Exchanges
        </p>
        <div className="space-y-3">
          {EXCHANGES.map(({ name, status }) => (
            <div
              key={name}
              className="flex items-center justify-between text-xs text-[#8A8A9A] group cursor-pointer hover:text-[#F0F0F0]"
            >
              <span className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3" />
                {name}
              </span>
              <span
                className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  status === "live"
                    ? "bg-velo-lime"
                    : "bg-velo-lime opacity-40"
                )}
              />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

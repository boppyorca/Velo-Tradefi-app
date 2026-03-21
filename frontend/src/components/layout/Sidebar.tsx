"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", key: "dashboard" },
  { href: "/markets", label: "Markets", key: "markets" },
  { href: "/ai-predict", label: "AI Predict", key: "ai-predict" },
  { href: "/web3", label: "Web3 Wallet", key: "web3" },
  { href: "/news", label: "News Feed", key: "news" },
  { href: "/settings", label: "Settings", key: "settings" },
] as const;

const NAV_ICONS: Record<string, string> = {
  dashboard: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>`,
  markets: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>`,
  "ai-predict": `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12 18 6"/><path d="m6 18-2 2 2-2"/><path d="M12 2v4"/><path d="M20 8h4"/><path d="M12 12 6 6"/></svg>`,
  web3: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z"/></svg>`,
  news: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>`,
  settings: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
};

const EXCHANGES = [
  { name: "NASDAQ", live: true },
  { name: "HOSE", live: true },
  { name: "NYSE", live: true },
  { name: "LSE", live: false },
];

const WATCHLIST = [
  { ticker: "AAPL", change: "+0.8%", positive: true, color: "#1a1a2e" },
  { ticker: "NVDA", change: "+2.4%", positive: true, color: "#1a2e1a" },
  { ticker: "VNM", change: "+1.2%", positive: true, color: "#2e1a1a" },
  { ticker: "DOGE", change: "+5.2%", positive: true, color: "#2e2a1a" },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <aside className="flex flex-col h-full bg-[#0F0F13] border-r border-white/[0.07] overflow-y-auto">
      {/* Logo */}
      <div className="px-4 py-5 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-[#A3E635] flex items-center justify-center flex-shrink-0">
          <span className="text-sm text-black font-bold">⚡</span>
        </div>
        <span className="text-white font-bold text-lg leading-none">Velo</span>
      </div>
      <p className="text-[10px] text-[#4A4A5A] tracking-widest ml-[36px] mb-2">TERMINAL</p>

      {/* Search bar */}
      <div className="px-3 mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A5A] pointer-events-none" />
          <input
            type="text"
            placeholder="Search ticker / company..."
            className="w-full bg-[#141418] border border-white/[0.08] rounded-lg h-8 px-3 pl-9 text-[13px] text-[#8A8A9A] placeholder:text-[#4A4A5A] focus:outline-none focus:border-white/20"
          />
        </div>
      </div>

      {/* Platform nav */}
      <p className="text-[10px] font-medium tracking-widest text-[#4A4A5A] uppercase px-4 mb-1 mt-2">
        Platform
      </p>
      <nav className="px-0">
        {NAV_ITEMS.map(({ href, label, key }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 mx-0 px-3 py-2 rounded-r-lg cursor-pointer transition-colors text-[13px]",
                active
                  ? "bg-[#A3E635]/[0.09] text-[#A3E635] border-l-2 border-[#A3E635] rounded-l-none"
                  : "text-[#8A8A9A] hover:bg-white/[0.04] hover:text-[#F0F0F0] border-l-2 border-transparent"
              )}
            >
              <span
                className="w-4 h-4 flex-shrink-0 [&>svg]:w-4 [&>svg]:h-4"
                dangerouslySetInnerHTML={{ __html: NAV_ICONS[key] ?? "" }}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Exchanges */}
      <p className="text-[10px] font-medium tracking-widest text-[#4A4A5A] uppercase px-4 mb-1 mt-6">
        Exchanges
      </p>
      <div className="px-3 space-y-1">
        {EXCHANGES.map(({ name, live }) => (
          <div
            key={name}
            className="flex items-center justify-between py-1 px-2 rounded-lg hover:bg-white/[0.04] cursor-pointer"
          >
            <span className="flex items-center gap-2 text-[#8A8A9A] text-xs">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
              </svg>
              {name}
            </span>
            <span className={cn("w-1.5 h-1.5 rounded-full", live ? "bg-[#A3E635]" : "bg-[#4A4A5A]")} />
          </div>
        ))}
      </div>

      {/* Watchlist */}
      <p className="text-[10px] font-medium tracking-widest text-[#4A4A5A] uppercase px-4 mb-1 mt-6">
        Watchlist
      </p>
      <div className="px-3 space-y-0.5">
        {WATCHLIST.map(({ ticker, change, positive, color }) => (
          <div
            key={ticker}
            className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.04] cursor-pointer"
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-[#8A8A9A]"
              style={{ backgroundColor: color }}
            >
              {ticker.slice(0, 2)}
            </div>
            <span className="text-[12px] font-medium text-[#F0F0F0] font-mono flex-1">{ticker}</span>
            <span className={cn("text-[11px] font-mono", positive ? "text-[#A3E635]" : "text-[#F05252]")}>
              {change}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="mt-auto px-3 py-3 border-t border-white/[0.07] flex items-center gap-2">
        <span className="text-sm">🇻🇳</span>
        <span className="text-[11px] text-[#4A4A5A]">VND · USD</span>
        <span className="flex-1" />
        <span className="text-[11px] text-[#4A4A5A]">VI · EN</span>
      </div>
    </aside>
  );
}

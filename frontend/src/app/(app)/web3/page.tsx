"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Copy, Check, RefreshCw, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/features";
import { MemecoinCard } from "@/components/features";
import { Button } from "@/components/ui/button";
import { memecoinApi } from "@/lib/api-client";
import { useWallet } from "@/lib/useWallet";
import type { Memecoin } from "@/lib/types";

type SortTab = "trending" | "gainers" | "losers";

const FILTER_TABS: { key: SortTab; label: string }[] = [
  { key: "trending", label: "Trending" },
  { key: "gainers", label: "Top Gainers" },
  { key: "losers", label: "Top Losers" },
];

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  11155111: "Sepolia",
  137: "Polygon",
  56: "BSC",
  8453: "Base",
};

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Web3Page() {
  const {
    address,
    balance,
    balanceUsd,
    chainId,
    isConnecting,
    error,
    connect,
    disconnect,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<SortTab>("trending");
  const [watchedCoins, setWatchedCoins] = useState<Set<string>>(
    new Set<string>(["dogecoin", "pepe", "ai16z", "bonk", "goatseus-maximus"])
  );

  function handleCopy() {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function toggleWatch(id: string) {
    setWatchedCoins((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // ── CoinGecko API via backend ─────────────────────────────────────────────────
  const { data: coins, isLoading, isFetching, error: coinError, refetch } = useQuery({
    queryKey: ["memecoins"],
    queryFn: () => memecoinApi.list({ pageSize: 50 }).then((r) => r.data ?? []),
    staleTime: 50_000,
    refetchInterval: 60_000,
    retry: 1,
  });

  const allCoins: Memecoin[] = coins ?? [];

  const displayedCoins = (() => {
    const sorted = [...allCoins];
    switch (activeTab) {
      case "gainers":
        return sorted.sort((a, b) => b.change24h - a.change24h);
      case "losers":
        return sorted.sort((a, b) => a.change24h - b.change24h);
      default: // trending
        return sorted.sort((a, b) => b.marketCap - a.marketCap);
    }
  })();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#6366F1]/10 text-[#6366F1] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#6366F1]/20">
              BETA
            </span>
          </div>
          <p className="text-xs text-[#4A4A5A]">MetaMask integration · Live memecoin prices via CoinGecko</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-white/[0.08] text-xs text-[#8A8A9A] hover:text-white hover:border-white/20"
          onClick={() => refetch()}
        >
          <RefreshCw className={`w-3 h-3 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Wallet card */}
          <div className="bg-[#141418] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07] flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#8B5CF6]" />
              <h2 className="text-sm font-medium text-[#F0F0F0]">Wallet</h2>
              {address && (
                <span className="ml-auto text-[9px] font-bold text-[#A3E635] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635]" />
                  CONNECTED
                </span>
              )}
            </div>
            <div className="px-5 py-5">
              {address ? (
                <div className="space-y-4">
                  {/* Address */}
                  <div className="flex items-center gap-2 p-3 bg-[#0A0A0C] rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-[#6366F1]/20 flex items-center justify-center text-[#6366F1] text-xs font-bold">
                      ⟠
                    </div>
                    <span className="text-xs font-mono text-[#F0F0F0] flex-1 truncate">
                      {formatAddress(address)}
                    </span>
                  </div>

                  {/* ETH Balance */}
                  {balance ? (
                    <div className="flex items-center justify-between p-3 bg-[#0A0A0C] rounded-lg">
                      <span className="text-xs text-[#8A8A9A]">ETH Balance</span>
                      <div className="text-right">
                        <p className="text-sm font-mono font-medium text-[#F0F0F0]">
                          {balance} ETH
                        </p>
                        {balanceUsd && (
                          <p className="text-xs text-[#4A4A5A]">≈ ${balanceUsd}</p>
                        )}
                      </div>
                    </div>
                  ) : isConnecting ? (
                    <div className="p-3 bg-[#0A0A0C] rounded-lg text-center">
                      <p className="text-xs text-[#4A4A5A]">Fetching balance...</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-[#0A0A0C] rounded-lg text-center">
                      <p className="text-xs text-[#4A4A5A]">
                        {error ?? "Balance unavailable"}
                      </p>
                    </div>
                  )}

                  {/* Chain info */}
                  {chainId && (
                    <div className="flex items-center justify-between p-3 bg-[#0A0A0C] rounded-lg">
                      <span className="text-xs text-[#8A8A9A]">Network</span>
                      <span className="text-xs font-mono text-[#8A8A9A]">
                        {CHAIN_NAMES[chainId] ?? `Chain ${chainId}`}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 border-white/[0.08] text-xs text-[#8A8A9A] hover:text-white"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <Check className="w-3 h-3 mr-1" />
                      ) : (
                        <Copy className="w-3 h-3 mr-1" />
                      )}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 border-[#F05252]/20 text-[#F05252] hover:bg-[#F05252]/10"
                      onClick={disconnect}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Wallet className="w-12 h-12 mx-auto mb-3 text-[#4A4A5A]" />
                  <p className="text-sm font-medium text-[#F0F0F0] mb-1">No wallet connected</p>
                  <p className="text-xs text-[#4A4A5A] mb-4">
                    Connect your MetaMask to view balances and manage tokens
                  </p>
                  <Button
                    className="w-full h-10 bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white font-semibold text-sm"
                    onClick={connect}
                    disabled={isConnecting}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    {isConnecting ? "Connecting..." : "Connect MetaMask"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Watchlist */}
          <div className="bg-[#141418] border border-white/[0.07] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07] flex items-center justify-between">
              <h3 className="text-sm font-medium text-[#F0F0F0]">Watchlist</h3>
              <span className="text-[10px] text-[#8A8A9A] bg-[#1E1E26] px-2 py-0.5 rounded-full">
                {watchedCoins.size} coins
              </span>
            </div>
            <div className="px-5 py-3 space-y-1">
              {allCoins.filter((c) => watchedCoins.has(c.id)).length === 0 && (
                <p className="text-xs text-[#4A4A5A] text-center py-4">
                  No coins in watchlist — tap ★ on any coin
                </p>
              )}
              {allCoins.filter((c) => watchedCoins.has(c.id)).map((coin) => (
                <div
                  key={coin.id}
                  className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-white/[0.03] cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-[#2a1a2e] flex items-center justify-center text-[10px] font-mono font-bold text-[#8B5CF6] overflow-hidden">
                    {coin.image ? (
                      <img src={coin.image} alt={coin.symbol} className="w-7 h-7 rounded-full object-cover" />
                    ) : coin.symbol.slice(0, 2)}
                  </div>
                  <span className="text-sm font-mono text-[#F0F0F0] flex-1">{coin.symbol}</span>
                  <span
                    className={`text-sm font-mono ${
                      coin.change24h >= 0 ? "text-[#A3E635]" : "text-[#F05252]"
                    }`}
                  >
                    {coin.change24h >= 0 ? "+" : ""}
                    {coin.change24h.toFixed(1)}%
                  </span>
                  <button
                    onClick={() => toggleWatch(coin.id)}
                    className="text-[#4A4A5A] hover:text-[#F05252] cursor-pointer p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Error state */}
          {coinError && (
            <div className="p-3 rounded-xl bg-[#F05252]/10 border border-[#F05252]/20 text-xs text-[#F05252]">
              Could not load memecoins: {coinError.message}. Start the backend (see README) and refresh.
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="col-span-2 space-y-4">
          {/* Filter bar */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 bg-[#141418] border border-white/[0.07] rounded-lg p-1">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    activeTab === tab.key
                      ? "bg-[#0A0A0C] text-[#F0F0F0] shadow-sm"
                      : "text-[#8A8A9A] hover:text-[#F0F0F0]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-[#4A4A5A]">
              {isLoading ? "Loading…" : `${allCoins.length} coins · via CoinGecko`}
            </span>
          </div>

          {/* Coin grid */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-[#141418] border border-white/[0.07] rounded-xl p-4 animate-pulse"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-full bg-[#1E1E26]" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-12 bg-[#1E1E26] rounded" />
                      <div className="h-2 w-16 bg-[#1E1E26] rounded" />
                    </div>
                  </div>
                  <div className="h-5 w-20 bg-[#1E1E26] rounded mb-1" />
                  <div className="h-4 w-14 bg-[#1E1E26] rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {displayedCoins.map((coin) => (
                <MemecoinCard
                  key={coin.id}
                  symbol={coin.symbol}
                  name={coin.name}
                  price={
                    coin.price < 0.0001
                      ? `$${coin.price.toExponential(2)}`
                      : coin.price < 0.01
                      ? `$${coin.price.toFixed(6)}`
                      : coin.price < 1
                      ? `$${coin.price.toFixed(4)}`
                      : `$${coin.price.toFixed(2)}`
                  }
                  change={`${coin.change24h >= 0 ? "+" : ""}${coin.change24h.toFixed(2)}%`}
                  positive={coin.change24h >= 0}
                  mcap={
                    coin.marketCap >= 1_000_000_000
                      ? `$${(coin.marketCap / 1_000_000_000).toFixed(1)}B`
                      : coin.marketCap >= 1_000_000
                      ? `$${(coin.marketCap / 1_000_000).toFixed(1)}M`
                      : `$${coin.marketCap.toFixed(0)}`
                  }
                  vol={
                    coin.volume24h >= 1_000_000_000
                      ? `$${(coin.volume24h / 1_000_000_000).toFixed(1)}B`
                      : coin.volume24h >= 1_000_000
                      ? `$${(coin.volume24h / 1_000_000).toFixed(1)}M`
                      : `$${coin.volume24h.toFixed(0)}`
                  }
                  image={coin.image}
                  inWatchlist={watchedCoins.has(coin.id)}
                  onToggleWatchlist={() => toggleWatch(coin.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

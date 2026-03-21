"use client";

import { useState } from "react";
import { PageHeader } from "@/components/features";
import { MemecoinCard } from "@/components/features";
import { Button } from "@/components/ui/button";
import { Wallet, Copy, Check, RefreshCw, Trash2 } from "lucide-react";
import type { Memecoin } from "@/lib/types";

const MOCK_MEMECOINS: Memecoin[] = [
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin", price: 0.08214, change24h: 5.2, marketCap: 12_100_000_000, volume24h: 890_000_000, image: "" },
  { id: "shiba-inu", symbol: "SHIB", name: "Shiba Inu", price: 0.00001234, change24h: -2.1, marketCap: 7_300_000_000, volume24h: 210_000_000, image: "" },
  { id: "pepe", symbol: "PEPE", name: "Pepe", price: 0.00000421, change24h: 12.4, marketCap: 1_800_000_000, volume24h: 520_000_000, image: "" },
  { id: "dogwifcoin", symbol: "WIF", name: "dogwifcoin", price: 2.3412, change24h: 8.7, marketCap: 820_000_000, volume24h: 340_000_000, image: "" },
  { id: "brett", symbol: "BRETT", name: "Brett", price: 0.09231, change24h: 3.1, marketCap: 920_000_000, volume24h: 180_000_000, image: "" },
  { id: "popcat", symbol: "POPCAT", name: "Popcat", price: 0.7234, change24h: -4.2, marketCap: 680_000_000, volume24h: 95_000_000, image: "" },
  { id: "floxify", symbol: "FLOKI", name: "FLOKI", price: 0.0001421, change24h: 6.8, marketCap: 1_340_000_000, volume24h: 410_000_000, image: "" },
  { id: "ai16z", symbol: "AI16Z", name: "ai16z", price: 1.2345, change24h: 21.3, marketCap: 1_230_000_000, volume24h: 620_000_000, image: "" },
  { id: "goat", symbol: "GOAT", name: "Goatseus Maximus", price: 0.8234, change24h: 15.2, marketCap: 823_000_000, volume24h: 290_000_000, image: "" },
];

function fmtPrice(p: number) {
  if (p < 0.0001) return `$${p.toExponential(2)}`;
  if (p < 0.01) return `$${p.toFixed(6)}`;
  if (p < 1) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(2)}`;
}

function fmtLargeNum(n: number) {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  return `$${n.toFixed(0)}`;
}

export default function Web3Page() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [watchedCoins, setWatchedCoins] = useState<Set<string>>(new Set(["dogecoin", "pepe", "ai16z"]));
  const [refreshing, setRefreshing] = useState(false);

  async function handleConnect() {
    if (typeof window === "undefined" || !(window as Window & { ethereum?: unknown }).ethereum) {
      alert("MetaMask not installed");
      return;
    }
    setConnecting(true);
    try {
      const eth = (window as Window & { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
      const accounts = await eth!.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) setWalletAddress(accounts[0]);
    } catch {
      // user rejected
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() { setWalletAddress(null); }

  function handleCopy() {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
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

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }

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
          <p className="text-xs text-[#4A4A5A]">MetaMask integration · Memecoin tracking</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-white/[0.08] text-xs text-[#8A8A9A] hover:text-white hover:border-white/20"
          onClick={handleRefresh}
        >
          <RefreshCw className={`w-3 h-3 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
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
            </div>
            <div className="px-5 py-5">
              {walletAddress ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 bg-[#0A0A0C] rounded-lg">
                    <div className="w-6 h-6 rounded-full bg-[#6366F1]/20 flex items-center justify-center text-[#6366F1] text-xs font-bold">⟠</div>
                    <span className="text-xs font-mono text-[#F0F0F0] flex-1 truncate">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
                    <span className="text-[9px] font-bold text-[#A3E635] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635]" />
                      CONNECTED
                    </span>
                  </div>
                  {[
                    { label: "Ethereum ETH", amount: "2.451 ETH", usd: "$4,820.23" },
                    { label: "USD Coin USDC", amount: "1,250.00", usd: "$1,250.00" },
                    { label: "BNB Chain BNB", amount: "0.85", usd: "$512.42" },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between p-3 bg-[#0A0A0C] rounded-lg">
                      <span className="text-xs text-[#8A8A9A]">{row.label}</span>
                      <div className="text-right">
                        <p className="text-sm font-mono font-medium text-[#F0F0F0]">{row.amount}</p>
                        <p className="text-xs text-[#4A4A5A]">{row.usd}</p>
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 h-8 border-white/[0.08] text-xs text-[#8A8A9A] hover:text-white" onClick={handleCopy}>
                      {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 h-8 border-[#F05252]/20 text-[#F05252] hover:bg-[#F05252]/10" onClick={handleDisconnect}>
                      <Trash2 className="w-3 h-3 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Wallet className="w-12 h-12 mx-auto mb-3 text-[#4A4A5A]" />
                  <p className="text-sm font-medium text-[#F0F0F0] mb-1">No wallet connected</p>
                  <p className="text-xs text-[#4A4A5A] mb-4">Connect your MetaMask to view balances and manage tokens</p>
                  <Button
                    className="w-full h-10 bg-[#8B5CF6] hover:bg-[#8B5CF6]/90 text-white font-semibold text-sm"
                    onClick={handleConnect}
                    disabled={connecting}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect MetaMask
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
              {MOCK_MEMECOINS.filter((c) => watchedCoins.has(c.id)).map((coin) => (
                <div key={coin.id} className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-white/[0.03] cursor-pointer">
                  <div className="w-7 h-7 rounded-full bg-[#2a1a2e] flex items-center justify-center text-[10px] font-mono font-bold text-[#8B5CF6]">
                    {coin.symbol.slice(0, 2)}
                  </div>
                  <span className="text-sm font-mono text-[#F0F0F0] flex-1">{coin.symbol}</span>
                  <span className={`text-sm font-mono ${coin.change24h >= 0 ? "text-[#A3E635]" : "text-[#F05252]"}`}>
                    {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(1)}%
                  </span>
                  <button
                    onClick={() => toggleWatch(coin.id)}
                    className="text-[#4A4A5A] hover:text-[#F05252] cursor-pointer p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {watchedCoins.size === 0 && (
                <p className="text-xs text-[#4A4A5A] text-center py-4">No coins in watchlist</p>
              )}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-2 space-y-4">
          {/* Filter bar */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 bg-[#141418] border border-white/[0.07] rounded-lg p-1">
              {(["trending", "gainers", "losers"] as const).map((tab) => (
                <button
                  key={tab}
                  className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors text-[#8A8A9A] hover:text-[#F0F0F0]"
                >
                  {tab === "trending" ? "Trending" : tab === "gainers" ? "Top Gainers" : "Top Losers"}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-white/[0.08] text-xs text-[#8A8A9A] hover:text-white hover:border-white/20"
              onClick={handleRefresh}
            >
              <RefreshCw className={`w-3 h-3 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            </Button>
          </div>

          {/* Memecoin grid */}
          <div className="grid grid-cols-2 gap-3">
            {MOCK_MEMECOINS.sort((a, b) => b.marketCap - a.marketCap).map((coin) => (
              <MemecoinCard
                key={coin.id}
                symbol={coin.symbol}
                name={coin.name}
                price={fmtPrice(coin.price)}
                change={`${coin.change24h >= 0 ? "+" : ""}${coin.change24h.toFixed(2)}%`}
                positive={coin.change24h >= 0}
                mcap={fmtLargeNum(coin.marketCap)}
                vol={fmtLargeNum(coin.volume24h)}
                inWatchlist={watchedCoins.has(coin.id)}
                onToggleWatchlist={() => toggleWatch(coin.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

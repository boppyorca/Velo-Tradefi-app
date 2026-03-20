"use client";

import { useState } from "react";
import { PageHeader } from "@/components/features";
import { MemecoinCard } from "@/components/features";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Plus, ExternalLink, Copy, Check, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
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

export default function Web3Page() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [watchedCoins, setWatchedCoins] = useState<Set<string>>(new Set(["dogecoin", "pepe", "ai16z"]));

  async function handleConnect() {
    if (typeof window === "undefined" || !(window as Window & { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum) {
      alert("MetaMask not installed");
      return;
    }
    setConnecting(true);
    try {
      const ethereum = (window as Window & { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;
      const accounts = await ethereum!.request({ method: "eth_requestAccounts" });
      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    setWalletAddress(null);
  }

  function handleCopy() {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function shortenAddress(addr: string) {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }

  function toggleWatch(id: string) {
    setWatchedCoins((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div>
      <PageHeader
        title="Web3 Wallet"
        description="MetaMask integration · Memecoin tracking"
        badge="BETA"
        badgeColor="purple"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — Wallet */}
        <div className="space-y-4">
          {/* Wallet card */}
          <div className="rounded-2xl bg-[#141418] border border-velo-purple/20 p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-velo-purple/10 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-velo-purple" />
              </div>
              <h2 className="text-base font-bold text-white">Wallet</h2>
            </div>

            {walletAddress ? (
              <div className="space-y-4">
                {/* Connected state */}
                <div className="p-4 rounded-xl bg-[#0A0A0C] border border-velo-purple/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 bg-velo-lime rounded-full" />
                    <span className="text-xs font-bold text-velo-lime">CONNECTED</span>
                  </div>
                  <p className="text-xs font-mono text-[#8A8A9A] break-all">
                    {walletAddress}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8A8A9A]">Network</span>
                    <span className="text-white font-medium">Ethereum Mainnet</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8A8A9A]">ETH Balance</span>
                    <span className="text-white font-mono font-bold">0.00 ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#8A8A9A]">Tokens</span>
                    <span className="text-white font-medium">0 ERC-20</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 border-[rgba(255,255,255,0.12)] text-xs text-[#8A8A9A] hover:text-white"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copied ? "Copied!" : "Copy"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 border-velo-red/20 text-velo-red hover:bg-velo-red/10"
                    onClick={handleDisconnect}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              /* Not connected */
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-2xl bg-velo-purple/10 flex items-center justify-center mx-auto mb-4">
                  <Wallet className="w-8 h-8 text-velo-purple" />
                </div>
                <p className="text-sm text-[#8A8A9A] mb-1">No wallet connected</p>
                <p className="text-xs text-[#4A4A5A] mb-4">Connect your MetaMask to view balances and manage tokens</p>
                <Button
                  className="w-full h-10 bg-velo-purple hover:bg-velo-purple/90 text-white font-semibold text-sm"
                  onClick={handleConnect}
                  disabled={connecting}
                >
                  {connecting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-3.5 h-3.5 mr-2" />
                      Connect MetaMask
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Watchlist */}
          <div className="rounded-2xl bg-[#141418] border border-[rgba(255,255,255,0.07)] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Watchlist</h3>
              <span className="text-xs text-[#4A4A5A]">{watchedCoins.size} coins</span>
            </div>
            <div className="space-y-2">
              {MOCK_MEMECOINS.filter((c) => watchedCoins.has(c.id)).map((coin) => (
                <div
                  key={coin.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#1E1E26]"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-velo-purple/20 flex items-center justify-center">
                      <span className="text-[8px] font-black text-velo-purple">{coin.symbol.slice(0, 2)}</span>
                    </div>
                    <span className="text-xs font-bold font-mono text-white">{coin.symbol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono ${coin.change24h >= 0 ? "text-velo-lime" : "text-velo-red"}`}>
                      {coin.change24h >= 0 ? "+" : ""}{coin.change24h.toFixed(1)}%
                    </span>
                    <button
                      onClick={() => toggleWatch(coin.id)}
                      className="text-velo-purple/60 hover:text-velo-purple"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {watchedCoins.size === 0 && (
                <p className="text-xs text-[#4A4A5A] text-center py-4">
                  No coins in watchlist. Track memecoins to add them here.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right — Memecoin list */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="trending" className="space-y-4">
            <div className="flex items-center justify-between">
              <TabsList className="bg-[#141418] border border-[rgba(255,255,255,0.07)] h-9 p-1 gap-1">
                <TabsTrigger
                  value="trending"
                  className="data-[state=active]:bg-velo-purple data-[state=active]:text-white data-[state=active]:font-bold text-xs h-7"
                >
                  Trending
                </TabsTrigger>
                <TabsTrigger
                  value="gainers"
                  className="data-[state=active]:bg-velo-lime data-[state=active]:text-[#0A0A0C data-[state=active]:font-bold text-xs h-7"
                >
                  Top Gainers
                </TabsTrigger>
                <TabsTrigger
                  value="losers"
                  className="data-[state=active]:bg-velo-red data-[state=active]:text-white data-[state=active]:font-bold text-xs h-7"
                >
                  Top Losers
                </TabsTrigger>
              </TabsList>

              <Button
                variant="outline"
                size="sm"
                className="h-8 border-[rgba(255,255,255,0.12)] text-xs text-[#8A8A9A] hover:text-white"
              >
                <RefreshCw className="w-3 h-3 mr-1.5" />
                Refresh
              </Button>
            </div>

            <TabsContent value="trending">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...MOCK_MEMECOINS]
                  .sort((a, b) => b.marketCap - a.marketCap)
                  .map((coin) => (
                    <MemecoinCard
                      key={coin.id}
                      coin={coin}
                      isWatched={watchedCoins.has(coin.id)}
                      onToggleWatchlist={toggleWatch}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="gainers">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...MOCK_MEMECOINS]
                  .sort((a, b) => b.change24h - a.change24h)
                  .map((coin) => (
                    <MemecoinCard
                      key={coin.id}
                      coin={coin}
                      isWatched={watchedCoins.has(coin.id)}
                      onToggleWatchlist={toggleWatch}
                    />
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="losers">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[...MOCK_MEMECOINS]
                  .sort((a, b) => a.change24h - b.change24h)
                  .map((coin) => (
                    <MemecoinCard
                      key={coin.id}
                      coin={coin}
                      isWatched={watchedCoins.has(coin.id)}
                      onToggleWatchlist={toggleWatch}
                    />
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

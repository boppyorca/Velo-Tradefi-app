"use client";

import { useState } from "react";
import { NewsCard } from "@/components/features";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NewsItem } from "@/lib/types";

type CategoryId = "all" | "ai" | "tech" | "crypto" | "stock";

const CATEGORIES: { id: CategoryId; label: string; active: string }[] = [
  { id: "all", label: "All", active: "bg-[#A3E635] text-[#0A0A0C] font-semibold" },
  { id: "ai", label: "AI", active: "bg-[#6366F1] text-white font-semibold" },
  { id: "tech", label: "Tech", active: "bg-cyan-500 text-white font-semibold" },
  { id: "crypto", label: "Crypto", active: "bg-[#F59E0B] text-[#0A0A0C] font-semibold" },
  { id: "stock", label: "Stock", active: "bg-[#A3E635] text-[#0A0A0C] font-semibold" },
];

const MOCK_NEWS: NewsItem[] = [
  { id: "1", title: "NVIDIA announces next-gen AI chips at GTC 2026, targets $500B market", summary: "Jensen Huang reveals Blackwell Ultra architecture at annual developer conference, promising 3x performance improvement for LLM training workloads.", source: "TechCrunch", url: "https://techcrunch.com/2026/03/nvidia-gtc-2026", publishedAt: new Date(Date.now() - 3600000).toISOString(), category: "ai" },
  { id: "2", title: "Bitcoin breaks $67K amid record ETF inflow surge of $1.2B in single day", summary: "Spot Bitcoin ETFs recorded unprecedented daily inflows as institutional adoption accelerates following favorable regulatory signals.", source: "CoinDesk", url: "https://www.coindesk.com/markets/2026/03/bitcoin-67k-etf-inflow", publishedAt: new Date(Date.now() - 7200000).toISOString(), category: "crypto" },
  { id: "3", title: "Fed holds rates at 4.25-4.50%, signals two cuts in 2026 as inflation cools", summary: "Federal Reserve maintains current range while updating dot plot projections. Markets rally on dovish tone.", source: "Reuters", url: "https://www.reuters.com/markets/us/fed-holds-rates-2026-03", publishedAt: new Date(Date.now() - 10800000).toISOString(), category: "stock" },
  { id: "4", title: "OpenAI releases GPT-5 with native multimodal reasoning at human expert level", summary: "The latest model achieves PhD-level performance across science, math, and coding benchmarks while reducing hallucinations by 80%.", source: "The Verge", url: "https://www.theverge.com/2026/03/openai-gpt5-release", publishedAt: new Date(Date.now() - 14400000).toISOString(), category: "ai" },
  { id: "5", title: "Apple Vision Pro 2 specs leaked: M5 chip, improved display, $2,499 starting price", summary: "Apple's next spatial computing headset features significantly improved resolution and weight reduction, analyst Ming-Chi Kuo reports.", source: "MacRumors", url: "https://www.macrumors.com/2026/03/vision-pro-2-specs-leak", publishedAt: new Date(Date.now() - 18000000).toISOString(), category: "tech" },
  { id: "6", title: "Ethereum ETF staking approval expected Q2 2026, could unlock $10B in yield", summary: "SEC reportedly reconsidering stance on staking rewards for Ethereum ETF products following BlackRock and Fidelity applications.", source: "Decrypt", url: "https://decrypt.co/2026/03/ethereum-etf-staking-approval", publishedAt: new Date(Date.now() - 21600000).toISOString(), category: "crypto" },
  { id: "7", title: "TSLA stock drops 8% after Q1 deliveries miss estimates by 12%", summary: "Tesla delivered 355,000 vehicles in Q1, falling short of analyst consensus of 403,000 amid increasing EV competition.", source: "Bloomberg", url: "https://www.bloomberg.com/news/2026-03/tesla-q1-deliveries", publishedAt: new Date(Date.now() - 25200000).toISOString(), category: "stock" },
  { id: "8", title: "Anthropic raises $3.5B at $61B valuation, largest AI funding round ever", summary: "The Claude maker secures mega-round led by Google and Amazon, bringing total raised to $7.5B with plans to scale safety research.", source: "FT", url: "https://www.ft.com/content/anthropic-3-5b-funding", publishedAt: new Date(Date.now() - 28800000).toISOString(), category: "ai" },
];

export default function NewsPage() {
  const [category, setCategory] = useState<CategoryId>("all");
  const [refreshing, setRefreshing] = useState(false);

  const filtered = category === "all" ? MOCK_NEWS : MOCK_NEWS.filter((n) => n.category === category);

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#F59E0B]/10 text-[#F59E0B] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#F59E0B]/20">
              RSS
            </span>
          </div>
          <p className="text-xs text-[#4A4A5A]">Aggregated AI, tech, crypto & stock news</p>
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

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map((cat) => {
          const isActive = category === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-medium transition-colors cursor-pointer",
                isActive
                  ? cat.active
                  : "bg-[#141418] text-[#8A8A9A] border border-white/[0.07] hover:text-[#F0F0F0] hover:border-white/[0.15]"
              )}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* News grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((news) => (
            <NewsCard key={news.id} news={news} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A4A5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/></svg>
          <p className="text-sm text-[#4A4A5A]">No articles in this category</p>
        </div>
      )}

      {/* Load more */}
      <div className="mt-8 text-center">
        <Button
          variant="outline"
          className="border-white/[0.12] text-xs text-[#8A8A9A] hover:text-white"
        >
          Load more stories
        </Button>
        <p className="text-[10px] text-[#4A4A5A] mt-2">Powered by RSS aggregation · Updated every 15 minutes</p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { PageHeader } from "@/components/features";
import { NewsCard } from "@/components/features";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Newspaper, RefreshCw, ExternalLink } from "lucide-react";
import type { NewsItem } from "@/lib/types";

type CategoryId = "all" | "ai" | "tech" | "crypto" | "stock";

const CATEGORIES = [
  { id: "all" as CategoryId, label: "All" },
  { id: "ai" as CategoryId, label: "AI", color: "velo-indigo" },
  { id: "tech" as CategoryId, label: "Tech", color: "velo-lime" },
  { id: "crypto" as CategoryId, label: "Crypto", color: "velo-purple" },
  { id: "stock" as CategoryId, label: "Stock", color: "velo-amber" },
];

const MOCK_NEWS: NewsItem[] = [
  { id: "1", title: "NVIDIA announces next-gen AI chips at GTC 2026, targets $500B market", summary: "Jensen Huang reveals Blackwell Ultra architecture at annual developer conference, promising 3x performance improvement for LLM training workloads.", source: "TechCrunch", url: "#", publishedAt: new Date(Date.now() - 3600000).toISOString(), category: "ai" },
  { id: "2", title: "Bitcoin breaks $67K amid record ETF inflow surge of $1.2B in single day", summary: "Spot Bitcoin ETFs recorded unprecedented daily inflows as institutional adoption accelerates following favorable regulatory signals.", source: "CoinDesk", url: "#", publishedAt: new Date(Date.now() - 7200000).toISOString(), category: "crypto" },
  { id: "3", title: "Fed holds rates at 4.25-4.50%, signals two cuts in 2026 as inflation cools", summary: "Federal Reserve maintains current range while updating dot plot projections. Markets rally on dovish tone.", source: "Reuters", url: "#", publishedAt: new Date(Date.now() - 10800000).toISOString(), category: "stock" },
  { id: "4", title: "OpenAI releases GPT-5 with native multimodal reasoning at human expert level", summary: "The latest model achieves PhD-level performance across science, math, and coding benchmarks while reducing hallucinations by 80%.", source: "The Verge", url: "#", publishedAt: new Date(Date.now() - 14400000).toISOString(), category: "ai" },
  { id: "5", title: "Apple Vision Pro 2 specs leaked: M5 chip, improved display, $2,499 starting price", summary: "Apple's next spatial computing headset features significantly improved resolution and weight reduction, analyst Ming-Chi Kuo reports.", source: "MacRumors", url: "#", publishedAt: new Date(Date.now() - 18000000).toISOString(), category: "tech" },
  { id: "6", title: "Ethereum ETF staking approval expected Q2 2026, could unlock $10B in yield", summary: "SEC reportedly reconsidering stance on staking rewards for Ethereum ETF products following BlackRock and Fidelity applications.", source: "Decrypt", url: "#", publishedAt: new Date(Date.now() - 21600000).toISOString(), category: "crypto" },
  { id: "7", title: "TSLA stock drops 8% after Q1 deliveries miss estimates by 12%", summary: "Tesla delivered 355,000 vehicles in Q1, falling short of analyst consensus of 403,000 amid increasing EV competition.", source: "Bloomberg", url: "#", publishedAt: new Date(Date.now() - 25200000).toISOString(), category: "stock" },
  { id: "8", title: "Anthropic raises $3.5B at $61B valuation, largest AI funding round ever", summary: "The Claude maker secures mega-round led by Google and Amazon, bringing total raised to $7.5B with plans to scale safety research.", source: "FT", url: "#", publishedAt: new Date(Date.now() - 28800000).toISOString(), category: "ai" },
  { id: "9", title: "Google DeepMind AlphaFold 3 predicts full cellular interactome for first time", summary: "The breakthrough AI system models all protein interactions in a human cell, potentially accelerating drug discovery by 10x.", source: "Nature", url: "#", publishedAt: new Date(Date.now() - 32400000).toISOString(), category: "ai" },
  { id: "10", title: "Solana memecoin season 2.0: $4B in new token launches in single week", summary: "Solana network sees unprecedented memecoin activity with AI-themed tokens dominating. DOGE and SHIB alternatives surge.", source: "CoinGecko", url: "#", publishedAt: new Date(Date.now() - 36000000).toISOString(), category: "crypto" },
  { id: "11", title: "Microsoft Copilot+ PC sales exceed expectations, Windows market share rises", summary: "Qualcomm Snapdragon X-powered devices sell out in major markets. Microsoft reports 40% increase in Copilot usage.", source: "The Verge", url: "#", publishedAt: new Date(Date.now() - 39600000).toISOString(), category: "tech" },
  { id: "12", title: "NVIDIA stock surges to all-time high, briefly becomes world's most valuable company", summary: "AI chip demand pushes NVIDIA market cap to $3.1T, surpassing Microsoft and Apple in early trading.", source: "Bloomberg", url: "#", publishedAt: new Date(Date.now() - 43200000).toISOString(), category: "stock" },
];

export default function NewsPage() {
  const [category, setCategory] = useState<CategoryId>("all");
  const [refreshing, setRefreshing] = useState(false);

  const filtered =
    category === "all"
      ? MOCK_NEWS
      : MOCK_NEWS.filter((n) => n.category === category);

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <div>
      <PageHeader
        title="News Feed"
        description="Aggregated AI, tech, crypto & stock news"
        badge="RSS"
        badgeColor="amber"
        action={
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-[rgba(255,255,255,0.12)] text-xs text-[#8A8A9A] hover:text-white"
            onClick={handleRefresh}
          >
            <RefreshCw className={`w-3 h-3 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {/* Category filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {CATEGORIES.map((cat) => {
          const isActive = category === cat.id;
          const colorStyle =
            cat.id === "ai"
              ? { active: "bg-velo-indigo text-white font-bold" }
              : cat.id === "tech"
              ? { active: "bg-velo-lime text-[#0A0A0C] font-bold" }
              : cat.id === "crypto"
              ? { active: "bg-velo-purple text-white font-bold" }
              : cat.id === "stock"
              ? { active: "bg-velo-amber text-[#0A0A0C] font-bold" }
              : { active: "bg-velo-lime text-[#0A0A0C] font-bold" };
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors",
                isActive
                  ? colorStyle.active
                  : "bg-[#141418] text-[#8A8A9A] hover:text-white border border-[rgba(255,255,255,0.07)]"
              )}
            >
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* News grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((news) => (
          <NewsCard key={news.id} news={news} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Newspaper className="w-10 h-10 text-[#4A4A5A] mb-3" />
          <p className="text-sm text-[#8A8A9A]">No news in this category</p>
        </div>
      )}

      {/* Load more */}
      <div className="mt-8 text-center">
        <Button
          variant="outline"
          className="border-[rgba(255,255,255,0.12)] text-xs text-[#8A8A9A] hover:text-white"
        >
          Load more stories
        </Button>
        <p className="text-[10px] text-[#4A4A5A] mt-2">Powered by RSS aggregation · Updated every 15 minutes</p>
      </div>
    </div>
  );
}

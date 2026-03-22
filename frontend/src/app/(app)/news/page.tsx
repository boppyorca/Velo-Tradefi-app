"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { NewsCard } from "@/components/features";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { newsApi } from "@/lib/api-client";
import type { NewsItem } from "@/lib/types";

type CategoryId = "all" | "ai" | "tech" | "crypto" | "stock";

const CATEGORIES: { id: CategoryId; label: string; active: string }[] = [
  { id: "all",    label: "All",    active: "bg-[#A3E635] text-[#0A0A0C] font-semibold" },
  { id: "ai",     label: "AI",    active: "bg-[#6366F1] text-white font-semibold" },
  { id: "tech",   label: "Tech",  active: "bg-cyan-500 text-white font-semibold" },
  { id: "crypto", label: "Crypto", active: "bg-[#F59E0B] text-[#0A0A0C] font-semibold" },
  { id: "stock",  label: "Stock", active: "bg-[#A3E635] text-[#0A0A0C] font-semibold" },
];

function mapApiToNews(raw: {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
}): NewsItem {
  return {
    id: raw.id,
    title: raw.title,
    summary: raw.summary,
    source: raw.source,
    url: raw.url,
    publishedAt: raw.publishedAt,
    category: raw.category as NewsItem["category"],
  };
}

export default function NewsPage() {
  const [category, setCategory] = useState<CategoryId>("all");

  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["news", category],
    queryFn: async () => {
      const res = await newsApi.list({ category, page: 1, pageSize: 30 });
      return (res.data ?? []).map(mapApiToNews);
    },
    // Refresh every 5 minutes automatically
    refetchInterval: 5 * 60 * 1000,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const news: NewsItem[] = data ?? [];
  const filtered = category === "all" ? news : news.filter((n) => n.category === category);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-[#F59E0B]/10 text-[#F59E0B] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#F59E0B]/20">
              LIVE
            </span>
            {isFetching && !isLoading && (
              <span className="flex items-center gap-1 text-[10px] text-[#4A4A5A]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#A3E635] animate-pulse" />
                Updating...
              </span>
            )}
          </div>
          <p className="text-xs text-[#4A4A5A]">Aggregated AI, tech, crypto & stock news · auto-refresh every 5 min</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 border-white/[0.08] text-xs text-[#8A8A9A] hover:text-white hover:border-white/20"
          onClick={() => refetch()}
          disabled={isLoading || isFetching}
        >
          <RefreshCw className={`w-3 h-3 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
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

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-[#F05252]/10 border border-[#F05252]/20">
          <p className="text-sm text-[#F05252] font-medium mb-1">Failed to load news</p>
          <p className="text-xs text-[#8A8A9A]">{error.message}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2 text-xs border-[#F05252]/30 text-[#F05252] hover:bg-[#F05252]/10"
            onClick={() => refetch()}
          >
            Try again
          </Button>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="p-5 rounded-xl bg-[#141418] border border-white/[0.07] animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-4 w-12 rounded bg-[#1E1E26]" />
                <div className="h-3 w-16 rounded bg-[#1E1E26]" />
              </div>
              <div className="space-y-2 mb-3">
                <div className="h-4 w-full rounded bg-[#1E1E26]" />
                <div className="h-4 w-3/4 rounded bg-[#1E1E26]" />
              </div>
              <div className="h-3 w-2/3 rounded bg-[#1E1E26]" />
              <div className="flex items-center gap-2 mt-4">
                <div className="h-3 w-8 rounded bg-[#1E1E26]" />
                <div className="h-3 w-20 rounded bg-[#1E1E26]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* News grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {filtered.map((item) => (
            <NewsCard key={item.id} news={item} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4A4A5A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/></svg>
          <p className="text-sm text-[#4A4A5A]">
            {category === "all"
              ? "No stories available right now"
              : `No ${category.toUpperCase()} stories found`}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 text-xs"
            onClick={() => refetch()}
          >
            <RefreshCw className="w-3 h-3 mr-1.5" />
            Refresh
          </Button>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-[10px] text-[#4A4A5A]">
          Powered by Hacker News API · Updated every 5 minutes · {news.length} stories loaded
        </p>
      </div>
    </div>
  );
}

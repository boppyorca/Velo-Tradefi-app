"use client";

import type { NewsItem } from "@/lib/types";
import { Clock, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  news: NewsItem;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  ai:     { bg: "bg-[#6366F1]/20", text: "text-[#6366F1]", label: "AI" },
  tech:   { bg: "bg-cyan-500/20",  text: "text-cyan-400",    label: "Tech" },
  crypto: { bg: "bg-[#F59E0B]/20", text: "text-[#F59E0B]", label: "Crypto" },
  stock:  { bg: "bg-[#A3E635]/20", text: "text-[#A3E635]", label: "Stock" },
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NewsCard({ news }: NewsCardProps) {
  const style = CATEGORY_STYLES[news.category] ?? { bg: "bg-[#1E1E26]", text: "text-[#8A8A9A]", label: news.category.toUpperCase() };

  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block p-5 rounded-xl bg-[#141418] border border-white/[0.07] hover:border-white/[0.15] hover:bg-[#1A1A20] transition-all cursor-pointer h-full flex flex-col"
    >
      {/* Top row */}
      <div className="flex items-center gap-2 mb-3">
        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", style.bg, style.text)}>
          {style.label}
        </span>
        <span className="w-1 h-1 rounded-full bg-[#4A4A5A]" />
        <span className="text-[11px] text-[#4A4A5A] flex items-center gap-1">
          <Clock className="w-[11px] h-[11px]" />
          {timeAgo(news.publishedAt)}
        </span>
        <span className="flex-1" />
        {/* External link icon — shows this opens in new tab */}
        <span className="text-[#4A4A5A] group-hover:text-[#A3E635] transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-[#F0F0F0] leading-relaxed mb-2 flex-1 group-hover:text-[#A3E635] transition-colors line-clamp-2">
        {news.title}
      </h3>

      {/* Excerpt */}
      <p className="text-xs text-[#8A8A9A] leading-relaxed line-clamp-2 mb-3">
        {news.summary}
      </p>

      {/* Source */}
      <div className="flex items-center gap-1.5 mt-auto">
        <div className="w-4 h-4 rounded-sm bg-[#1E1E26] flex items-center justify-center text-[8px] text-[#4A4A5A] font-mono font-bold">
          {news.source.slice(0, 2).toUpperCase()}
        </div>
        <span className="text-[11px] text-[#4A4A5A]">{news.source}</span>
        <span className="flex-1" />
        {/* "Read full article" hint */}
        <span className="text-[10px] text-[#4A4A5A] group-hover:text-[#A3E635] transition-colors flex items-center gap-0.5">
          Read full
          <ExternalLink className="w-[10px] h-[10px]" />
        </span>
      </div>
    </a>
  );
}

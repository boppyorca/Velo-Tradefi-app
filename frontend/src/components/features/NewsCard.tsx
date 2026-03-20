"use client";

import type { NewsItem } from "@/lib/types";
import { ExternalLink, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsCardProps {
  news: NewsItem;
}

const CATEGORY_COLORS: Record<string, string> = {
  ai: "text-velo-indigo bg-velo-indigo/10",
  tech: "text-velo-lime bg-velo-lime/10",
  crypto: "text-velo-purple bg-velo-purple/10",
  stock: "text-velo-amber bg-velo-amber/10",
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NewsCard({ news }: NewsCardProps) {
  const catStyle = CATEGORY_COLORS[news.category] ?? "text-[#8A8A9A] bg-[#1E1E26]";

  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block p-5 rounded-xl bg-[#141418] border border-[rgba(255,255,255,0.07)] hover:border-[rgba(255,255,255,0.15)] hover:bg-[#1A1A20] transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {/* Category + time */}
          <div className="flex items-center gap-2 mb-2">
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                catStyle
              )}
            >
              {news.category}
            </span>
            <span className="text-[#4A4A5A]">·</span>
            <span className="text-[10px] text-[#4A4A5A] flex items-center gap-1">
              <Clock size={9} />
              {timeAgo(news.publishedAt)}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-white leading-snug mb-2 group-hover:text-velo-lime transition-colors line-clamp-2">
            {news.title}
          </h3>

          {/* Summary */}
          <p className="text-xs text-[#8A8A9A] leading-relaxed line-clamp-2">
            {news.summary}
          </p>

          {/* Source */}
          <div className="mt-3 flex items-center gap-1.5">
            <span className="text-[10px] text-[#4A4A5A] font-medium">{news.source}</span>
          </div>
        </div>

        {/* Thumbnail */}
        {news.imageUrl && (
          <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-[#1E1E26]">
            <img
              src={news.imageUrl}
              alt=""
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
            />
          </div>
        )}
      </div>
    </a>
  );
}

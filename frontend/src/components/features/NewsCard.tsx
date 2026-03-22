"use client";

import type { NewsItem } from "@/lib/types";
import { Clock, ExternalLink, MessageSquare, ArrowUp } from "lucide-react";
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

function parseMetaFromSummary(summary: string): { score: number; comments: number; author: string } | null {
  // Format: "{score} points · {comments} comments · by {author} · {title}" or "by {author}"
  const scoreMatch = summary.match(/^([\d,]+)\s*points/);
  const commentsMatch = summary.match(/([\d,]+)\s*comments/);
  const byMatch = summary.match(/by\s+([^\s]+)/);
  return {
    score: scoreMatch ? parseInt(scoreMatch[1].replace(",", "")) : 0,
    comments: commentsMatch ? parseInt(commentsMatch[1].replace(",", "")) : 0,
    author: byMatch ? byMatch[1] : "",
  };
}

export function NewsCard({ news }: NewsCardProps) {
  const style = CATEGORY_STYLES[news.category] ?? { bg: "bg-[#1E1E26]", text: "text-[#8A8A9A]", label: news.category.toUpperCase() };
  const meta = parseMetaFromSummary(news.summary);
  const isAskOrShow = !news.url.includes("ycombinator.com") === false || news.title.startsWith("Ask HN") || news.title.startsWith("Show HN");

  // Determine if URL is a real external link or HN comments page
  const isHNComments = news.url.includes("news.ycombinator.com/item");
  const linkLabel = isHNComments ? "View discussion" : "Read full article";

  return (
    <a
      href={news.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block p-5 rounded-xl bg-[#141418] border border-white/[0.07] hover:border-white/[0.15] hover:bg-[#1A1A20] transition-all cursor-pointer h-full flex flex-col"
    >
      {/* Top row */}
      <div className="flex items-center gap-2 mb-3 flex-shrink-0">
        <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded", style.bg, style.text)}>
          {style.label}
        </span>
        <span className="w-1 h-1 rounded-full bg-[#4A4A5A]" />
        <span className="text-[11px] text-[#4A4A5A] flex items-center gap-1">
          <Clock className="w-[11px] h-[11px]" />
          {timeAgo(news.publishedAt)}
        </span>
        <span className="flex-1" />
        {/* External link icon */}
        <span className="text-[#4A4A5A] group-hover:text-[#A3E635] transition-colors">
          <ExternalLink className="w-3.5 h-3.5" />
        </span>
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-[#F0F0F0] leading-relaxed mb-3 flex-shrink-0 group-hover:text-[#A3E635] transition-colors">
        {news.title}
      </h3>

      {/* Meta row: score + comments */}
      {meta && (meta.score > 0 || meta.comments > 0) && (
        <div className="flex items-center gap-3 mb-3 mt-auto">
          {meta.score > 0 && (
            <div className="flex items-center gap-1 text-[#A3E635]">
              <ArrowUp className="w-3 h-3" />
              <span className="text-xs font-mono font-medium">{meta.score}</span>
            </div>
          )}
          {meta.comments > 0 && (
            <div className="flex items-center gap-1 text-[#8A8A9A]">
              <MessageSquare className="w-3 h-3" />
              <span className="text-xs font-mono">{meta.comments}</span>
            </div>
          )}
          {meta.author && (
            <div className="flex items-center gap-1 text-[#8A8A9A]">
              <span className="text-[11px]">by {meta.author}</span>
            </div>
          )}
        </div>
      )}

      {/* Source */}
      <div className="flex items-center gap-1.5 mt-auto flex-shrink-0">
        <div className="w-4 h-4 rounded-sm bg-[#1E1E26] flex items-center justify-center text-[8px] text-[#4A4A5A] font-mono font-bold">
          HN
        </div>
        <span className="text-[11px] text-[#4A4A5A]">Hacker News</span>
        <span className="flex-1" />
        {/* Read hint */}
        <span className="text-[10px] text-[#4A4A5A] group-hover:text-[#A3E635] transition-colors flex items-center gap-0.5">
          {linkLabel}
          <ExternalLink className="w-[10px] h-[10px]" />
        </span>
      </div>
    </a>
  );
}

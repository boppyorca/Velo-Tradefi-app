"use client";

import { useState } from "react";
import { Bell, BellOff, Pencil, Trash2, X, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertConditionBuilder } from "@/components/features/AlertConditionBuilder";
import type { AlertCondition, AlertConditionType, AlertRule } from "@/lib/types";
import { stockApi } from "@/lib/api-client";

const CONDITION_LABELS: Record<AlertConditionType, string> = {
  price_above: "Giá trên ▲",
  price_below: "Giá dưới ▼",
  percent_change: "Thay đổi %",
};

function formatConditionBrief(type: string, value: number): string {
  if (type === "percent_change") return `±${value}%`;
  if (value >= 1000) return `₫${(value / 1000).toFixed(0)}K`;
  return `₫${value.toLocaleString("vi-VN")}`;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Vừa tạo";
  if (mins < 60) return `${mins}p trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h trước`;
  const days = Math.floor(hours / 24);
  return `${days}d trước`;
}

interface AlertRuleCardProps {
  alert: AlertRule;
  onToggle: (id: string) => Promise<void>;
  onUpdate: (id: string, data: { name?: string; conditions?: AlertCondition[] }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function AlertRuleCard({ alert, onToggle, onUpdate, onDelete }: AlertRuleCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(alert.name);
  const [editConditions, setEditConditions] = useState<AlertCondition[]>(alert.conditions);
  const [editSymbol, setEditSymbol] = useState(alert.symbol);
  const [editBasePrice, setEditBasePrice] = useState(String(alert.basePrice));
  const [isSaving, setIsSaving] = useState(false);
  const [searchResults, setSearchResults] = useState<{ symbol: string; name: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSearchSymbol(q: string) {
    setEditSymbol(q.toUpperCase());
    if (q.length < 1) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await stockApi.search(q);
      setSearchResults(
        results.slice(0, 5).map((s) => ({ symbol: s.symbol, name: s.name }))
      );
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  function handleSelectSymbol(symbol: string, name: string) {
    setEditSymbol(symbol);
    setSearchResults([]);
  }

  async function handleSave() {
    setIsSaving(true);
    try {
      await onUpdate(alert.id, {
        name: editName,
        conditions: editConditions,
      });
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancel() {
    setEditName(alert.name);
    setEditConditions(alert.conditions);
    setEditSymbol(alert.symbol);
    setEditBasePrice(String(alert.basePrice));
    setSearchResults([]);
    setIsEditing(false);
  }

  return (
    <>
      <div
        className={`rounded-xl border p-4 transition-all ${
          alert.isActive
            ? "bg-[#141418] border-white/[0.07]"
            : "bg-[#141418]/50 border-white/[0.04] opacity-60"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  alert.isActive
                    ? "bg-[#A3E635]/15 text-[#A3E635]"
                    : "bg-[#4A4A5A]/30 text-[#4A4A5A]"
                }`}
              >
                {alert.isActive ? (
                  <Bell className="w-3 h-3" />
                ) : (
                  <BellOff className="w-3 h-3" />
                )}
                {alert.isActive ? "ACTIVE" : "PAUSED"}
              </span>
              <span className="text-[10px] text-[#4A4A5A]">{timeAgo(alert.createdAt)}</span>
            </div>
            <h3 className="text-sm font-semibold text-[#F0F0F0] truncate">{alert.name}</h3>
            <p className="text-xs text-[#4A4A5A] font-mono mt-0.5">
              {alert.symbol} · Base: ₫{alert.basePrice.toLocaleString("vi-VN")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => {
                setIsToggling(true);
                onToggle(alert.id).finally(() => setIsToggling(false));
              }}
              disabled={isToggling}
              title={alert.isActive ? "Pause alert" : "Resume alert"}
              className={alert.isActive ? "text-[#A3E635]" : "text-[#4A4A5A]"}
            >
              {isToggling ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : alert.isActive ? (
                <BellOff className="w-3 h-3" />
              ) : (
                <Bell className="w-3 h-3" />
              )}
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setIsEditing(true)}
              title="Edit alert"
              className="text-[#4A4A5A] hover:text-[#F0F0F0]"
            >
              <Pencil className="w-3 h-3" />
            </Button>
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => {
                setIsDeleting(true);
                onDelete(alert.id).finally(() => setIsDeleting(false));
              }}
              disabled={isDeleting}
              title="Delete alert"
              className="text-[#4A4A5A] hover:text-[#F05252]"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Conditions */}
        <div className="flex flex-wrap gap-1.5">
          {alert.conditions.map((cond, idx) => (
            <span
              key={idx}
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                cond.type === "price_above"
                  ? "border-[#A3E635]/25 text-[#A3E635] bg-[#A3E635]/[0.06]"
                  : cond.type === "price_below"
                    ? "border-[#F05252]/25 text-[#F05252] bg-[#F05252]/[0.06]"
                    : "border-[#6366F1]/25 text-[#6366F1] bg-[#6366F1]/[0.06]"
              }`}
            >
              {CONDITION_LABELS[cond.type]} {formatConditionBrief(cond.type, cond.value)}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-[#4A4A5A] mt-2">Bất kỳ điều kiện nào thỏa mãn → alert kích hoạt</p>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Alert</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Alert name */}
            <div>
              <label className="text-xs font-medium text-[#8A8A9A] block mb-1.5">Tên alert</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="VD: Bán BTC khi đạt mục tiêu"
                className="h-9"
              />
            </div>

            {/* Symbol */}
            <div>
              <label className="text-xs font-medium text-[#8A8A9A] block mb-1.5">Mã token/stock</label>
              <Input
                value={editSymbol}
                onChange={(e) => handleSearchSymbol(e.target.value)}
                placeholder="VD: BTC, AAPL"
                className="h-9 font-mono"
              />
              {searchResults.length > 0 && (
                <div className="mt-1 rounded-lg border border-white/[0.08] bg-[#1E1E26] overflow-hidden">
                  {searchResults.map((r) => (
                    <button
                      key={r.symbol}
                      type="button"
                      onClick={() => handleSelectSymbol(r.symbol, r.name)}
                      className="w-full text-left px-3 py-2 hover:bg-white/[0.05] border-b border-white/[0.04] last:border-0"
                    >
                      <span className="text-xs font-mono font-semibold text-[#F0F0F0]">{r.symbol}</span>
                      <span className="text-xs text-[#4A4A5A] ml-2">{r.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Base price */}
            <div>
              <label className="text-xs font-medium text-[#8A8A9A] block mb-1.5">Giá tại thời điểm tạo</label>
              <Input
                type="number"
                value={editBasePrice}
                onChange={(e) => setEditBasePrice(e.target.value)}
                placeholder="VD: 105000"
                className="h-9 font-mono"
                min={0}
              />
              <p className="text-[10px] text-[#4A4A5A] mt-1">Giá hiện tại của {editSymbol} — dùng làm mốc tính % thay đổi</p>
            </div>

            {/* Conditions */}
            <div>
              <label className="text-xs font-medium text-[#8A8A9A] block mb-1.5">Điều kiện (OR)</label>
              <AlertConditionBuilder
                conditions={editConditions}
                onChange={setEditConditions}
                basePrice={Number(editBasePrice) || undefined}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              <X className="w-3.5 h-3.5" />
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving || !editName || editConditions.length === 0}
              className="bg-[#A3E635] text-black hover:bg-[#b5f23d]"
            >
              {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Lưu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, RefreshCw, Bell, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AlertConditionBuilder } from "@/components/features/AlertConditionBuilder";
import { AlertRuleCard } from "@/components/features/AlertRuleCard";
import { NotificationStack } from "@/components/features/AlertNotificationToast";
import { useNotifications } from "@/lib/notifications-context";
import { alertApi, stockApi } from "@/lib/api-client";
import { useAuthStore } from "@/lib/auth-store";
import type { AlertCondition } from "@/lib/types";
import { cn } from "@/lib/utils";

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

export default function AlertsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { notifications, dismissNotification, markAllRead } = useNotifications();

  const [isCreating, setIsCreating] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createSymbol, setCreateSymbol] = useState("");
  const [createBasePrice, setCreateBasePrice] = useState("");
  const [createConditions, setCreateConditions] = useState<AlertCondition[]>([]);
  const [searchResults, setSearchResults] = useState<{ symbol: string; name: string }[]>([]);
  const [activeTab, setActiveTab] = useState<"alerts" | "history">("alerts");

  // Mark all read when switching to history tab
  const handleSetActiveTab = useCallback((tab: "alerts" | "history") => {
    if (tab === "history") markAllRead();
    setActiveTab(tab);
  }, [markAllRead]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Fetch alerts ──────────────────────────────────────────────────────
  const {
    data: alerts = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["alerts"],
    queryFn: alertApi.list,
    enabled: !!user,
  });

  // ── Mutations ─────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: alertApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      resetCreateForm();
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof alertApi.update>[1] }) =>
      alertApi.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: alertApi.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: alertApi.toggle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["alerts"] }),
  });

  // ── Search symbol ─────────────────────────────────────────────────────
  async function handleSymbolSearch(q: string) {
    setCreateSymbol(q.toUpperCase());
    if (q.length < 1) {
      setSearchResults([]);
      return;
    }
    try {
      const results = await stockApi.search(q);
      setSearchResults(results.slice(0, 5).map((s) => ({ symbol: s.symbol, name: s.name })));
    } catch {
      setSearchResults([]);
    }
  }

  function resetCreateForm() {
    setCreateName("");
    setCreateSymbol("");
    setCreateBasePrice("");
    setCreateConditions([]);
    setSearchResults([]);
  }

  function handleCreate() {
    if (!createName || !createSymbol || createConditions.length === 0) return;
    createMutation.mutate({
      name: createName,
      symbol: createSymbol,
      targetType: "STOCK",
      basePrice: Number(createBasePrice) || 0,
      conditions: createConditions,
    });
  }

  const activeAlerts = alerts.filter((a) => a.isActive);
  const pausedAlerts = alerts.filter((a) => !a.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F0F0F0]">Price Alerts</h1>
          <p className="text-sm text-[#8A8A9A] mt-0.5">
            {alerts.length} alert · {activeAlerts.length} đang hoạt động · {notifications.length} thông báo chưa đọc
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="h-8"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            onClick={() => setIsCreating(true)}
            className="h-8 bg-[#A3E635] text-black hover:bg-[#b5f23d]"
          >
            <Plus className="w-3.5 h-3.5" />
            Tạo Alert
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.07]">
        <button
          onClick={() => handleSetActiveTab("alerts")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
            activeTab === "alerts"
              ? "border-[#A3E635] text-[#A3E635]"
              : "border-transparent text-[#8A8A9A] hover:text-[#F0F0F0]"
          )}
        >
          <Bell className="w-3.5 h-3.5" />
          Alerts
          {alerts.length > 0 && (
            <span className="bg-[#A3E635]/15 text-[#A3E635] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {alerts.length}
            </span>
          )}
        </button>
        <button
          onClick={() => handleSetActiveTab("history")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
            activeTab === "history"
              ? "border-[#A3E635] text-[#A3E635]"
              : "border-transparent text-[#8A8A9A] hover:text-[#F0F0F0]"
          )}
        >
          <History className="w-3.5 h-3.5" />
          Lịch sử thông báo
          {unreadCount > 0 && (
            <span className="bg-[#F05252]/15 text-[#F05252] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Alert list */}
      {activeTab === "alerts" && (
        <>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 rounded-xl bg-[#141418] animate-pulse border border-white/[0.07]" />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1E1E26] flex items-center justify-center mb-4">
                <Bell className="w-8 h-8 text-[#4A4A5A]" />
              </div>
              <h3 className="text-sm font-semibold text-[#F0F0F0] mb-1">Chưa có alert nào</h3>
              <p className="text-xs text-[#4A4A5A] mb-4 max-w-xs">
                Tạo alert để nhận thông báo khi giá token hoặc stock chạm ngưỡng bạn đặt.
              </p>
              <Button
                size="sm"
                onClick={() => setIsCreating(true)}
                className="bg-[#A3E635] text-black hover:bg-[#b5f23d]"
              >
                <Plus className="w-3.5 h-3.5" />
                Tạo Alert đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Active section */}
              {activeAlerts.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium tracking-widest text-[#4A4A5A] uppercase mb-2">
                    Đang hoạt động ({activeAlerts.length})
                  </p>
                  <div className="space-y-2">
                    {activeAlerts.map((alert) => (
                      <AlertRuleCard
                        key={alert.id}
                        alert={alert}
                        onToggle={(id) => toggleMutation.mutateAsync(id).then(() => {})}
                        onUpdate={(id, data) => updateMutation.mutateAsync({ id, data }).then(() => {})}
                        onDelete={(id) => deleteMutation.mutateAsync(id).then(() => {})}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Paused section */}
              {pausedAlerts.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium tracking-widest text-[#4A4A5A] uppercase mb-2 mt-4">
                    Đã tạm dừng ({pausedAlerts.length})
                  </p>
                  <div className="space-y-2">
                    {pausedAlerts.map((alert) => (
                      <AlertRuleCard
                        key={alert.id}
                        alert={alert}
                        onToggle={(id) => toggleMutation.mutateAsync(id).then(() => {})}
                        onUpdate={(id, data) => updateMutation.mutateAsync({ id, data }).then(() => {})}
                        onDelete={(id) => deleteMutation.mutateAsync(id).then(() => {})}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Notification history */}
      {activeTab === "history" && (
        <div className="space-y-2">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#1E1E26] flex items-center justify-center mb-4">
                <History className="w-8 h-8 text-[#4A4A5A]" />
              </div>
              <h3 className="text-sm font-semibold text-[#F0F0F0] mb-1">Chưa có thông báo nào</h3>
              <p className="text-xs text-[#4A4A5A] max-w-xs">
                Thông báo sẽ xuất hiện ở đây khi alert của bạn được kích hoạt.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 p-4 rounded-xl border transition-all",
                  n.read
                    ? "bg-[#141418] border-white/[0.05]"
                    : "bg-[#141418] border-[#A3E635]/25"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                  n.read ? "bg-[#1E1E26]" : "bg-[#A3E635]/10"
                )}>
                  <Bell className={cn("w-4 h-4", n.read ? "text-[#4A4A5A]" : "text-[#A3E635]")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className={cn("text-sm font-semibold", n.read ? "text-[#8A8A9A]" : "text-[#F0F0F0]")}>
                      {n.alertName}
                    </p>
                    <span className="text-[10px] text-[#4A4A5A] shrink-0">{timeAgo(n.triggeredAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono font-bold bg-[#1E1E26] text-[#F0F0F0] px-2 py-0.5 rounded">
                      {n.symbol}
                    </span>
                    <span className={cn("text-xs font-mono font-semibold",
                      n.currentPrice > n.basePrice ? "text-[#A3E635]" : "text-[#F05252]"
                    )}>
                      ₫{n.currentPrice.toLocaleString("vi-VN")}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8A8A9A]">
                    {n.triggeredCondition === "price_above"
                      ? `Giá trên ₫${n.triggeredValue.toLocaleString("vi-VN")}`
                      : n.triggeredCondition === "price_below"
                        ? `Giá dưới ₫${n.triggeredValue.toLocaleString("vi-VN")}`
                        : `Thay đổi ${n.triggeredValue}%`}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Create Alert Dialog */}
      <Dialog open={isCreating} onOpenChange={(open) => !open && resetCreateForm()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo Alert mới</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Alert name */}
            <div>
              <label className="text-xs font-medium text-[#8A8A9A] block mb-1.5">Tên alert</label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="VD: Bán BTC khi đạt mục tiêu"
                className="h-9"
              />
            </div>

            {/* Symbol */}
            <div>
              <label className="text-xs font-medium text-[#8A8A9A] block mb-1.5">Mã token/stock</label>
              <Input
                value={createSymbol}
                onChange={(e) => handleSymbolSearch(e.target.value)}
                placeholder="VD: BTC, AAPL, NVDA"
                className="h-9 font-mono"
              />
              {searchResults.length > 0 && (
                <div className="mt-1 rounded-lg border border-white/[0.08] bg-[#1E1E26] overflow-hidden">
                  {searchResults.map((r) => (
                    <button
                      key={r.symbol}
                      type="button"
                      onClick={() => {
                        setCreateSymbol(r.symbol);
                        setSearchResults([]);
                      }}
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
              <label className="text-xs font-medium text-[#8A8A9A] block mb-1.5">
                Giá tại thời điểm tạo
              </label>
              <Input
                type="number"
                value={createBasePrice}
                onChange={(e) => setCreateBasePrice(e.target.value)}
                placeholder="VD: 105000 (để trống = giá hiện tại)"
                className="h-9 font-mono"
                min={0}
              />
              <p className="text-[10px] text-[#4A4A5A] mt-1">
                Dùng làm mốc tính % thay đổi cho điều kiện "Thay đổi %"
              </p>
            </div>

            {/* Conditions */}
            <div>
              <label className="text-xs font-medium text-[#8A8A9A] block mb-1.5">
                Điều kiện kích hoạt (OR)
              </label>
              <AlertConditionBuilder
                conditions={createConditions}
                onChange={setCreateConditions}
                basePrice={Number(createBasePrice) || undefined}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { resetCreateForm(); setIsCreating(false); }}
            >
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={
                !createName ||
                !createSymbol ||
                createConditions.length === 0 ||
                createMutation.isPending
              }
              className="bg-[#A3E635] text-black hover:bg-[#b5f23d]"
            >
              {createMutation.isPending ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Tạo Alert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Global notification toasts */}
      <NotificationStack
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}

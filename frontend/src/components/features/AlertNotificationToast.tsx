"use client";

import { useEffect, useState } from "react";
import { Bell, X, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NotificationItem } from "@/lib/useAlertNotifications";

function formatPrice(price: number): string {
  if (price >= 1_000_000) return `₫${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1000) return `₫${price.toLocaleString("vi-VN")}`;
  return `$${price.toFixed(2)}`;
}

function ConditionIcon({ type }: { type: string }) {
  if (type === "price_above") return <TrendingUp className="w-3.5 h-3.5 text-[#A3E635]" />;
  if (type === "price_below") return <TrendingDown className="w-3.5 h-3.5 text-[#F05252]" />;
  return <Minus className="w-3.5 h-3.5 text-[#6366F1]" />;
}

function NotificationToast({ notification, onDismiss }: {
  notification: NotificationItem;
  onDismiss: () => void;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setIsVisible(true));
    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300); // wait for exit animation
    }, 8000);
    return () => clearTimeout(timer);
  }, [notification.id, onDismiss]);

  return (
    <div
      className={cn(
        "relative w-80 rounded-xl border border-[#A3E635]/30 bg-[#141418] p-4 shadow-2xl shadow-black/60 transition-all duration-300",
        isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-8"
      )}
    >
      {/* Indicator stripe */}
      <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-xl bg-[#A3E635]" />

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-9 h-9 rounded-xl bg-[#A3E635]/10 flex items-center justify-center shrink-0 mt-0.5">
          <Bell className="w-4.5 h-4.5 text-[#A3E635]" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <p className="text-xs font-bold text-[#A3E635]">Alert kích hoạt!</p>
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onDismiss, 300);
              }}
              className="text-[#4A4A5A] hover:text-[#F0F0F0] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-sm font-semibold text-[#F0F0F0]">{notification.alertName}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono font-bold text-[#F0F0F0] bg-[#1E1E26] px-2 py-0.5 rounded">
              {notification.symbol}
            </span>
            <span className="text-xs font-mono text-[#A3E635]">
              {formatPrice(notification.currentPrice)}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            <ConditionIcon type={notification.triggeredCondition} />
            <span className="text-[10px] text-[#8A8A9A]">
              {notification.triggeredCondition === "price_above"
                ? `Giá trên ${formatPrice(notification.triggeredValue)}`
                : notification.triggeredCondition === "price_below"
                  ? `Giá dưới ${formatPrice(notification.triggeredValue)}`
                  : `Thay đổi ${notification.triggeredValue}%`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NotificationStackProps {
  notifications: NotificationItem[];
  onDismiss: (id: string) => void;
}

export function NotificationStack({ notifications, onDismiss }: NotificationStackProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-50 flex flex-col gap-3 pointer-events-none">
      {notifications.slice(0, 3).map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <NotificationToast
            notification={n}
            onDismiss={() => onDismiss(n.id)}
          />
        </div>
      ))}
    </div>
  );
}

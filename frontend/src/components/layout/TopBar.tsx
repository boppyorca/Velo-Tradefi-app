"use client";

import { useRouter } from "next/navigation";
import { Bell, Wallet, ChevronDown, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/auth-store";
import { useAuth } from "@/lib/useAuth";
import { useHasVeloSession } from "@/lib/use-velo-session";
import { useNotifications } from "@/lib/notifications-context";
import { cn } from "@/lib/utils";

export function TopBar() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const hasSession = useHasVeloSession();
  const { notifications, markAllRead } = useNotifications();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const displayName =
    user?.fullName?.trim() || user?.email?.split("@")[0] || "User";
  const initials = displayName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "US";

  return (
    <header className="h-14 bg-[#0F0F13] border-b border-white/[0.07] sticky top-0 z-30 flex items-center px-6 gap-4">
      {/* Center: Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4A4A5A] pointer-events-none" />
          <input
            type="text"
            placeholder="Search markets, tickers, or news..."
            className="w-full bg-[#141418] border border-white/[0.08] rounded-lg h-9 px-3 pl-9 text-[13px] text-[#F0F0F0] placeholder:text-[#4A4A5A] focus:outline-none focus:border-white/20"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Bell — shows unread count */}
        <button
          type="button"
          className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition-colors relative"
          aria-label="Notifications"
          onClick={() => router.push("/alerts")}
        >
          <Bell className="w-[18px] h-[18px] text-[#8A8A9A]" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F05252] rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Wallet */}
        <button
          type="button"
          className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition-colors"
          aria-label="Wallet"
        >
          <Wallet className="w-[18px] h-[18px] text-[#8A8A9A]" />
        </button>

        {/* User role badge */}
        <span className="bg-[#A3E635]/[0.12] text-[#A3E635] text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full">
          {user?.role?.toUpperCase() || "TRADER"}
        </span>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-90 transition-opacity outline-none cursor-pointer">
            <div className="text-right hidden sm:block">
              <p className="text-[12px] text-[#F0F0F0] font-medium leading-tight truncate max-w-[120px]">
                {displayName}
              </p>
              <p
                className={cn(
                  "text-[10px]",
                  hasSession ? "text-[#A3E635]" : "text-[#4A4A5A]"
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full inline-block mr-1",
                    hasSession ? "bg-[#A3E635]" : "bg-[#4A4A5A]"
                  )}
                />
                {hasSession ? "CONNECTED" : "NO SESSION"}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#1E1E26] border border-white/[0.10] flex items-center justify-center">
              <span className="text-[11px] text-[#8A8A9A] font-mono">{initials}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#4A4A5A]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-[#141418] border border-white/[0.10]"
          >
            <DropdownMenuItem
              className="text-[#8A8A9A] hover:text-[#F0F0F0] cursor-pointer text-sm"
              onClick={() => router.push("/settings")}
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-[#8A8A9A] hover:text-[#F0F0F0] cursor-pointer text-sm"
              onClick={() => router.push("/settings")}
            >
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.07]" />
            <DropdownMenuItem
              className="text-[#F05252] hover:text-[#F05252]/90 cursor-pointer text-sm"
              variant="destructive"
              onClick={() => logout()}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

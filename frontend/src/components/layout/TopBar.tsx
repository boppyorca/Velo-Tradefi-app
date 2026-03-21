"use client";

import { Bell, Wallet, ChevronDown, Search } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function TopBar() {
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
        {/* Bell */}
        <button
          type="button"
          className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-[18px] h-[18px] text-[#8A8A9A]" />
          <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-velo-red rounded-full" />
        </button>

        {/* Wallet */}
        <button
          type="button"
          className="w-8 h-8 rounded-lg hover:bg-white/[0.06] flex items-center justify-center transition-colors"
          aria-label="Wallet"
        >
          <Wallet className="w-[18px] h-[18px] text-[#8A8A9A]" />
        </button>

        {/* PRO TRADER badge */}
        <span className="bg-[#A3E635]/[0.12] text-[#A3E635] text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-full">
          PRO TRADER
        </span>

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 hover:opacity-90 transition-opacity outline-none cursor-pointer">
            <div className="text-right hidden sm:block">
              <p className="text-[12px] text-[#F0F0F0] font-medium leading-tight">USER_882</p>
              <p className="text-[10px] text-[#A3E635]">
                <span className="w-1.5 h-1.5 bg-[#A3E635] rounded-full inline-block mr-1" />
                CONNECTED
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#1E1E26] border border-white/[0.10] flex items-center justify-center">
              <span className="text-[11px] text-[#8A8A9A] font-mono">US</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#4A4A5A]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-[#141418] border border-white/[0.10]"
          >
            <DropdownMenuItem className="text-[#8A8A9A] hover:text-[#F0F0F0] cursor-pointer text-sm">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[#8A8A9A] hover:text-[#F0F0F0] cursor-pointer text-sm">
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-white/[0.07]" />
            <DropdownMenuItem className="text-[#F05252] hover:text-[#F05252]/90 cursor-pointer text-sm">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

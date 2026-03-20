"use client";

import { Search, Bell, Wallet, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TopBarProps {
  userName?: string;
  userEmail?: string;
}

export function TopBar({ userName = "USER_882", userEmail }: TopBarProps) {
  return (
    <header className="fixed top-0 right-0 left-[220px] h-[56px] bg-[#141418]/80 backdrop-blur-xl flex items-center justify-between px-6 z-40 border-b border-[rgba(255,255,255,0.07)]">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4A5A] w-4 h-4" />
          <Input
            className="w-full bg-[#1E1E26] border-0 rounded-lg h-9 pl-10 pr-4 text-sm font-mono placeholder:text-[#4A4A5A] focus-visible:ring-1 focus-visible:ring-velo-lime/50 transition-all"
            placeholder="Search markets, tickers, or news..."
            type="text"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="text-[#8A8A9A] hover:text-velo-lime transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-velo-red rounded-full border border-[#141418]" />
          </button>
          {/* Wallet quick */}
          <button className="text-[#8A8A9A] hover:text-velo-lime transition-colors">
            <Wallet className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-[1px] bg-[rgba(255,255,255,0.1)]" />

        {/* PRO badge */}
        <Button
          variant="ghost"
          className="bg-velo-lime/10 text-velo-lime text-[10px] font-black px-3 py-1.5 h-auto rounded hover:bg-velo-lime hover:text-black transition-all"
        >
          PRO TRADER
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-3 hover:opacity-80 transition-opacity outline-none cursor-pointer">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-bold text-[#F0F0F0] leading-tight">
                {userName}
              </p>
              <p className="text-[8px] text-velo-lime font-mono">CONNECTED</p>
            </div>
            <Avatar className="w-8 h-8 rounded-full border border-[rgba(255,255,255,0.1)]">
              <AvatarFallback className="bg-velo-elevated text-[#8A8A9A] text-xs">
                {userName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <ChevronDown className="w-3 h-3 text-[#4A4A5A]" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48 bg-[#1E1E26] border-[rgba(255,255,255,0.1)]"
          >
            <DropdownMenuItem className="text-[#8A8A9A] hover:text-white focus:text-white cursor-pointer">
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[#8A8A9A] hover:text-white focus:text-white cursor-pointer">
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[rgba(255,255,255,0.1)]" />
            <DropdownMenuItem className="text-velo-red hover:text-velo-red/80 focus:text-velo-red cursor-pointer">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

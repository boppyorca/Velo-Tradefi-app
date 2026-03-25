"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { useAuthStore } from "@/lib/auth-store";
import {
  User,
  Bell,
  Monitor,
  Trash2,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [pushNotifications, setPushNotifications] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState(false);
  const [dailyDigest, setDailyDigest] = useState(false);
  const [darkMode] = useState(true);

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#F0F0F0] mb-1">Settings</h1>
        <p className="text-sm text-[#4A4A5A]">Manage your account and preferences</p>
      </div>

      {/* Profile card */}
      <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5 pb-5 border-b border-white/[0.07]">
          <User className="w-4 h-4 text-[#8A8A9A]" />
          <h2 className="text-sm font-semibold text-[#F0F0F0]">Profile</h2>
        </div>

        <div className="flex items-center justify-between mb-5 pb-5 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1E1E26] flex items-center justify-center text-sm font-bold text-[#A3E635] font-mono">
              NV
            </div>
            <div>
              <p className="text-sm font-medium text-[#F0F0F0]">{user?.fullName ?? "Nguyen Van A"}</p>
              <p className="text-xs text-[#4A4A5A]">{user?.email ?? "trader@velo.finance"}</p>
            </div>
          </div>
          <span className="text-[10px] font-bold text-[#A3E635] px-3 py-1 rounded-full border border-[#A3E635]/40">
            PRO TRADER
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest mb-1.5 block">
              Full Name
            </label>
            <Input
              key={user?.id}
              className="h-9 bg-[#0A0A0C] border-white/[0.08] text-sm text-[#F0F0F0] focus:border-[#A3E635]/40 outline-none"
              defaultValue={user?.fullName || ""}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest mb-1.5 block">
              Email
            </label>
            <Input
              key={`email-${user?.id}`}
              className="h-9 bg-[#0A0A0C] border-white/[0.08] text-sm text-[#F0F0F0] focus:border-[#A3E635]/40 outline-none"
              defaultValue={user?.email || ""}
              readOnly
            />
          </div>
        </div>

        <Button className="h-9 bg-[#A3E635] hover:bg-[#b5f23d] text-black font-semibold text-xs px-5 py-2.5 rounded-lg transition-colors">
          Save changes
        </Button>
      </div>

      {/* Notifications card */}
      <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-[#8A8A9A]" />
          <h2 className="text-sm font-semibold text-[#F0F0F0]">Notifications</h2>
        </div>

        {[
          { label: "Push Notifications", desc: "Browser notifications for price alerts", checked: pushNotifications, onChange: setPushNotifications },
          { label: "Price Alerts", desc: "Notify when stocks hit target prices", checked: priceAlerts, onChange: setPriceAlerts },
          { label: "Daily News Digest", desc: "Morning summary of top market news", checked: dailyDigest, onChange: setDailyDigest },
        ].map((item, i) => (
          <div key={item.label} className={cn("flex items-center justify-between py-4", i < 2 && "border-b border-white/[0.05]")}>
            <div>
              <p className="text-sm font-medium text-[#F0F0F0]">{item.label}</p>
              <p className="text-xs text-[#4A4A5A] mt-0.5">{item.desc}</p>
            </div>
            <Switch
              checked={item.checked}
              onCheckedChange={item.onChange}
              className="data-[state=checked]:bg-[#A3E635]"
            />
          </div>
        ))}
      </div>

      {/* Display card */}
      <div className="bg-[#141418] border border-white/[0.07] rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Monitor className="w-4 h-4 text-[#8A8A9A]" />
          <h2 className="text-sm font-semibold text-[#F0F0F0]">Display</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#F0F0F0]">Dark Mode</p>
            <p className="text-xs text-[#4A4A5A] mt-0.5">Optimized for low-light trading environments</p>
          </div>
          <Switch
            checked={darkMode}
            className="data-[state=checked]:bg-[#A3E635]"
            disabled
          />
        </div>
        <p className="text-xs text-[#4A4A5A] mt-3">Light mode coming soon</p>
      </div>

      {/* Danger zone */}
      <div className="bg-[#141418] border border-[#F05252]/20 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Trash2 className="w-4 h-4 text-[#F05252]/60" />
          <h2 className="text-sm font-semibold text-[#F05252]/80">Danger Zone</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[#F0F0F0]">Delete Account</p>
            <p className="text-xs text-[#4A4A5A] mt-0.5">Permanently delete your account and all data</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-[#F05252]/20 text-[#F05252] hover:bg-[#F05252]/10 text-xs font-medium px-4 py-2"
          >
            Delete Account
          </Button>
        </div>
      </div>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full h-10 border-white/[0.12] text-[#8A8A9A] hover:text-[#F05252] hover:border-[#F05252]/20 text-sm"
        onClick={logout}
      >
        <LogOut className="w-3.5 h-3.5 mr-2" />
        Sign out
      </Button>
    </div>
  );
}

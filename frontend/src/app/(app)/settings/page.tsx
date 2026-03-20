"use client";

import { useState } from "react";
import { PageHeader } from "@/components/features";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuthStore } from "@/lib/auth-store";
import {
  User,
  Bell,
  Shield,
  Monitor,
  RefreshCw,
  Trash2,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, logout } = useAuthStore();
  const [notifications, setNotifications] = useState(true);
  const [priceAlerts, setPriceAlerts] = useState(true);
  const [newsDigest, setNewsDigest] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState("30");

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Manage your account and preferences"
      />

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <section className="rounded-2xl bg-[#141418] border border-[rgba(255,255,255,0.07)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.07)]">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#8A8A9A]" />
              <h2 className="text-sm font-bold text-white">Profile</h2>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{user?.fullName ?? "Nguyen Van A"}</p>
                <p className="text-xs text-[#8A8A9A]">{user?.email ?? "trader@velo.finance"}</p>
              </div>
              <Badge variant="outline" className="text-xs border-velo-lime/30 text-velo-lime">
                PRO TRADER
              </Badge>
            </div>
            <Separator className="bg-[rgba(255,255,255,0.07)]" />
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest mb-1 block">
                    Full Name
                  </label>
                  <Input
                    className="h-9 bg-[#1E1E26] border-[rgba(255,255,255,0.08)] text-sm"
                    defaultValue={user?.fullName ?? "Nguyen Van A"}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest mb-1 block">
                    Email
                  </label>
                  <Input
                    className="h-9 bg-[#1E1E26] border-[rgba(255,255,255,0.08)] text-sm"
                    defaultValue={user?.email ?? "trader@velo.finance"}
                    readOnly
                  />
                </div>
              </div>
              <Button size="sm" className="h-8 bg-velo-lime hover:bg-velo-lime/90 text-[#0A0A0C] font-semibold text-xs">
                Save changes
              </Button>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="rounded-2xl bg-[#141418] border border-[rgba(255,255,255,0.07)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.07)]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#8A8A9A]" />
              <h2 className="text-sm font-bold text-white">Notifications</h2>
            </div>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: "Push Notifications", desc: "Browser notifications for price alerts", checked: notifications, onChange: setNotifications },
              { label: "Price Alerts", desc: "Notify when stocks hit target prices", checked: priceAlerts, onChange: setPriceAlerts },
              { label: "Daily News Digest", desc: "Morning summary of top market news", checked: newsDigest, onChange: setNewsDigest },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-[#8A8A9A]">{item.desc}</p>
                </div>
                <Switch
                  checked={item.checked}
                  onCheckedChange={item.onChange}
                  className="data-[state=checked]:bg-velo-lime"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Display */}
        <section className="rounded-2xl bg-[#141418] border border-[rgba(255,255,255,0.07)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.07)]">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#8A8A9A]" />
              <h2 className="text-sm font-bold text-white">Display</h2>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Dark Mode</p>
                <p className="text-xs text-[#8A8A9A]">Always on — Velo is designed dark-first</p>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
                className="data-[state=checked]:bg-velo-lime"
                disabled
              />
            </div>
            <Separator className="bg-[rgba(255,255,255,0.07)]" />
            <div>
              <label className="text-[10px] font-bold text-[#4A4A5A] uppercase tracking-widest mb-2 block">
                Data Refresh Interval
              </label>
              <div className="flex items-center gap-2">
                {["15", "30", "60"].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setRefreshInterval(sec)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                      refreshInterval === sec
                        ? "bg-velo-lime text-[#0A0A0C] font-bold"
                        : "bg-[#1E1E26] text-[#8A8A9A] hover:text-white"
                    )}
                  >
                    {sec}s
                  </button>
                ))}
                <RefreshCw className="w-3 h-3 text-[#4A4A5A] ml-1" />
                <span className="text-xs text-[#4A4A5A]">Market data refresh rate</span>
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="rounded-2xl bg-[#141418] border border-[rgba(255,255,255,0.07)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.07)]">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#8A8A9A]" />
              <h2 className="text-sm font-bold text-white">Security</h2>
            </div>
          </div>
          <div className="divide-y divide-[rgba(255,255,255,0.04)]">
            {[
              { label: "Change Password", desc: "Update your account password" },
              { label: "Two-Factor Authentication", desc: "Add an extra layer of security" },
              { label: "Active Sessions", desc: "Manage logged-in devices" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between px-5 py-4 hover:bg-[#1E1E26]/50 transition-colors cursor-pointer group"
              >
                <div>
                  <p className="text-sm font-medium text-white">{item.label}</p>
                  <p className="text-xs text-[#8A8A9A]">{item.desc}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-[#4A4A5A] group-hover:text-[#8A8A9A] transition-colors" />
              </div>
            ))}
          </div>
        </section>

        {/* Danger zone */}
        <section className="rounded-2xl bg-[#141418] border border-velo-red/20 overflow-hidden">
          <div className="px-5 py-4 border-b border-velo-red/20">
            <div className="flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-velo-red/60" />
              <h2 className="text-sm font-bold text-velo-red/80">Danger Zone</h2>
            </div>
          </div>
          <div className="p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">Delete Account</p>
              <p className="text-xs text-[#8A8A9A]">Permanently delete your account and all data</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-velo-red/20 text-velo-red hover:bg-velo-red/10 text-xs"
            >
              Delete account
            </Button>
          </div>
        </section>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full h-10 border-[rgba(255,255,255,0.12)] text-[#8A8A9A] hover:text-velo-red hover:border-velo-red/20 text-sm"
          onClick={logout}
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  );
}

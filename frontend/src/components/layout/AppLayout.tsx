"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-[#0A0A0C] text-[#F0F0F0] overflow-hidden">
      {/* Sidebar */}
      <div className="w-[220px] h-full flex-shrink-0">
        <Sidebar />
      </div>

      {/* Right side */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 min-h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}

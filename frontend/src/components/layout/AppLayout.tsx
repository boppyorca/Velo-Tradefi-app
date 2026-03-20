"use client";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <TopBar />
      <main className="ml-[220px] pt-[56px] min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

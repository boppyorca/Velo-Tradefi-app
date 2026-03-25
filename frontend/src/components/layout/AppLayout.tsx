"use client";

import { useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { NotificationStack } from "@/components/features/AlertNotificationToast";
import { useNotifications } from "@/lib/notifications-context";
import type { AlertNotification } from "@/lib/types";
import type { NotificationItem } from "@/lib/useAlertNotifications";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { notifications, dismissNotification, addNotification } = useNotifications();

  // ── Sound engine (Web Audio API) ──────────────────────────────────────────
  // Must be called inside a user-gesture context or after AudioContext resume.
  // Returns an AudioContext; caller must .resume() it if suspended.
  function getAudioContext(): AudioContext | null {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      return new AC();
    } catch {
      return null;
    }
  }

  function playAlertSound() {
    const ac = getAudioContext();
    if (!ac) return;
    if (ac.state === "suspended") ac.resume();

    const now = ac.currentTime;

    // ── Alert: loud 3-tone chime (A5 → E5 → A5) ───────────────────────────
    const osc1 = ac.createOscillator();
    const gain1 = ac.createGain();
    osc1.connect(gain1);
    gain1.connect(ac.destination);
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);      // A5
    gain1.gain.setValueAtTime(0.6, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc1.start(now);
    osc1.stop(now + 0.15);

    const osc2 = ac.createOscillator();
    const gain2 = ac.createGain();
    osc2.connect(gain2);
    gain2.connect(ac.destination);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(659, now + 0.18);  // E5
    gain2.gain.setValueAtTime(0.6, now + 0.18);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.start(now + 0.18);
    osc2.stop(now + 0.35);

    const osc3 = ac.createOscillator();
    const gain3 = ac.createGain();
    osc3.connect(gain3);
    gain3.connect(ac.destination);
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(880, now + 0.38);  // A5 again
    gain3.gain.setValueAtTime(0.7, now + 0.38);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc3.start(now + 0.38);
    osc3.stop(now + 0.7);

    // ── Sub-bass thud for desktop presence ─────────────────────────────────
    const sub = ac.createOscillator();
    const subGain = ac.createGain();
    sub.connect(subGain);
    subGain.connect(ac.destination);
    sub.type = "sine";
    sub.frequency.setValueAtTime(80, now);
    sub.frequency.exponentialRampToValueAtTime(40, now + 0.12);
    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    sub.start(now);
    sub.stop(now + 0.2);
  }

  function triggerVibration() {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate([150, 80, 150, 80, 250]);
    }
  }

  // ── Listen for SignalR alert events ─────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      const alert = (e as CustomEvent<AlertNotification>).detail;
      // Convert to NotificationItem (extends AlertNotification + id + read)
      const notification: NotificationItem = {
        ...alert,
        id: `${alert.alertId}-${Date.now()}`,
        read: false,
      };
      addNotification(notification);
      playAlertSound();
      triggerVibration();
    };
    window.addEventListener("velo:alert:notification", handler);
    return () => window.removeEventListener("velo:alert:notification", handler);
  }, [addNotification]);

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

      {/* Global notification toasts */}
      <NotificationStack
        notifications={notifications}
        onDismiss={dismissNotification}
      />
    </div>
  );
}

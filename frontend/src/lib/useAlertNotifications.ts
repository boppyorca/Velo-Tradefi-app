"use client";

import { useEffect, useRef, useCallback } from "react";
import type { AlertNotification } from "@/lib/types";

// Default alert chime using Web Audio API
function playAlertSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Loud alert chime
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(660, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.8);
  } catch {
    // Fallback: just play a system beep if Web Audio API fails
  }
}

function triggerDesktopVibration() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 300]);
  }
}

export interface NotificationItem extends AlertNotification {
  id: string;
  read: boolean;
}

interface UseAlertNotificationsOptions {
  onNotification?: (notification: NotificationItem) => void;
}

export function useAlertNotifications(options: UseAlertNotificationsOptions = {}) {
  const { onNotification } = options;
  const notificationRef = useRef<NotificationItem[]>([]);

  const addNotification = useCallback((notification: AlertNotification) => {
    const item: NotificationItem = {
      ...notification,
      id: `${notification.alertId}-${Date.now()}`,
      read: false,
    };
    notificationRef.current = [item, ...notificationRef.current].slice(0, 50);
    onNotification?.(item);

    // Sound + vibration
    playAlertSound();
    triggerDesktopVibration();
  }, [onNotification]);

  const markAllRead = useCallback(() => {
    notificationRef.current = notificationRef.current.map((n) => ({ ...n, read: true }));
  }, []);

  const getNotifications = useCallback(() => notificationRef.current, []);

  return { addNotification, markAllRead, getNotifications };
}

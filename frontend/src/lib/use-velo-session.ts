"use client";

import { useLayoutEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth-store";

/**
 * True when Zustand has a token or localStorage has velo_token (same source api-client uses).
 * Aligns watchlist / gated UI with actual API auth, including before persist rehydration.
 */
export function useHasVeloSession(): boolean {
  const storeToken = useAuthStore((s) => s.token);
  const [localToken, setLocalToken] = useState<string | null>(null);

  useLayoutEffect(() => {
    const read = () => {
      try {
        setLocalToken(
          typeof window !== "undefined"
            ? localStorage.getItem("velo_token")
            : null
        );
      } catch {
        setLocalToken(null);
      }
    };
    read();
    window.addEventListener("storage", read);
    return () => window.removeEventListener("storage", read);
  }, [storeToken]);

  return Boolean(storeToken || localToken);
}

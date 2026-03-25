"use client";

import type { User } from "@/lib/types";
import { setVeloTokenCookie, syncAuthCookiesToServer } from "@/lib/auth-cookies";

/**
 * Exchange Supabase access token for backend JWT + role (ADMIN_EMAIL / User),
 * persist token/cookies, and hydrate Zustand. Same path as Google OAuth callback.
 */
export async function syncBackendAuthFromSupabaseSession(session: {
  access_token: string;
  refresh_token?: string | null;
}): Promise<{ user: User; token: string }> {
  const { authApi } = await import("@/lib/api-client");
  const { useAuthStore } = await import("@/lib/auth-store");

  const result = await authApi.exchangeGoogleToken(session.access_token);

  const token = result.token;
  localStorage.setItem("velo_token", token);
  setVeloTokenCookie(token);
  await syncAuthCookiesToServer(token, session.refresh_token ?? "");

  const u = result.user;
  const user: User = {
    id: String(u.id),
    email: u.email,
    fullName: u.fullName,
    role: u.role,
  };
  useAuthStore.getState().setAuth(user, token);

  return { user, token };
}

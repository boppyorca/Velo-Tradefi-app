"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";
import { signIn, signUp, signOut as supabaseSignOut, getAccessToken } from "@/lib/supabase";
import { authApi } from "@/lib/api-client";
import type { User } from "./types";

export function useAuth() {
  const router = useRouter();
  const { user, token, isAuthenticated, setAuth, updateUser, logout: clearAuth } =
    useAuthStore();

  // ── Login with Supabase Auth ───────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string) => {
      const { data, error } = await signIn(email, password);

      if (error) throw error;

      // Get the JWT token from Supabase
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("No access token received");

      // Extract user info from Supabase response
      const supabaseUser = data.user;
      const fullName =
        supabaseUser?.user_metadata?.full_name?.toString() || "";

      // Set auth state with Supabase user info
      const authUser: User = {
        id: supabaseUser?.id || "",
        email: supabaseUser?.email || email,
        fullName,
        createdAt: supabaseUser?.created_at || new Date().toISOString(),
      };

      setAuth(authUser, accessToken);

      // Also sync with backend (optional, for storing user in your DB)
      try {
        await authApi.login({ email, password });
      } catch {
        // Backend sync failed, but Supabase auth succeeded
        console.warn("Backend sync failed, continuing with Supabase auth only");
      }

      router.push("/dashboard");
    },
    [setAuth, router]
  );

  // ── Register with Supabase Auth ───────────────────────────────────
  const register = useCallback(
    async (email: string, password: string, fullName: string) => {
      const { data, error } = await signUp(email, password, fullName);

      if (error) throw error;

      // Get the JWT token from Supabase
      const accessToken = await getAccessToken();
      if (!accessToken) throw new Error("No access token received");

      // Set auth state with new user info
      const authUser: User = {
        id: data.user?.id || "",
        email: data.user?.email || email,
        fullName,
        createdAt: data.user?.created_at || new Date().toISOString(),
      };

      setAuth(authUser, accessToken);

      router.push("/dashboard");
    },
    [setAuth, router]
  );

  // ── Logout ────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    // Sign out from Supabase
    try {
      await supabaseSignOut();
    } catch {
      // Ignore Supabase signout errors
    }

    // Clear local auth state
    clearAuth();
    if (typeof localStorage !== "undefined") {
      localStorage.removeItem("velo-auth");
      localStorage.removeItem("velo_token");
    }
    // Clear auth cookie so middleware treats user as logged out
    if (typeof document !== "undefined") {
      document.cookie = "velo_token=; Path=/; Max-Age=0; SameSite=Lax";
    }

    router.push("/login");
  }, [clearAuth, router]);

  // ── Fetch current user from backend ───────────────────────────────
  const fetchMe = useCallback(async () => {
    if (!token) return;

    try {
      const me = await authApi.me(token);
      updateUser(me);
    } catch {
      // Token might be expired, clear auth
      clearAuth();
    }
  }, [token, updateUser, clearAuth]);

  // ── Initialize auth state from Supabase ───────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const accessToken = await getAccessToken();

      if (accessToken && !isAuthenticated) {
        // We have a token but no local state, try to restore
        try {
          const me = await authApi.me(accessToken);
          setAuth(me, accessToken);
        } catch {
          // Token invalid, clear
          clearAuth();
        }
      }
    };

    initAuth();
  }, [isAuthenticated, setAuth, clearAuth]);

  return {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    fetchMe,
    updateUser,
  };
}

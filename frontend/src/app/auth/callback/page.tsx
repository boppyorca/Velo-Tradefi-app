"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setVeloTokenCookie } from "@/lib/auth-cookies";
import { syncBackendAuthFromSupabaseSession } from "@/lib/sync-backend-auth";

/**
 * Exchange Supabase session token for a backend JWT, then set auth cookies and redirect.
 */
async function exchangeAndRedirect(session: {
  access_token: string;
  refresh_token?: string | null;
}) {
  const accessToken = session.access_token;

  // Save to localStorage immediately so auth works even if fetch fails
  localStorage.setItem("velo_token", accessToken);
  window.history.replaceState(null, "", window.location.pathname);
  setVeloTokenCookie(accessToken);

  try {
    const { user } = await syncBackendAuthFromSupabaseSession(session);
    console.log("Auth synced to backend");
    window.location.replace(user.role === "Admin" ? "/admin" : "/dashboard");
  } catch (err) {
    console.warn("Backend token exchange failed (continuing with Supabase token):", err);
    window.location.replace("/dashboard");
  }
}

/**
 * Auth Callback Route
 *
 * This page handles OAuth redirects from Supabase.
 * It exchanges the auth code for a session and redirects to dashboard.
 */
function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    let authStateSubscription: { unsubscribe: () => void } | null = null;

    const handleCallback = async () => {
      try {
        console.log("Processing OAuth callback...");
        console.log("Current URL:", window.location.href);
        console.log("URL Hash:", window.location.hash);

        const { supabase } = await import("@/lib/supabase");

        // Check for error in URL params (from Supabase)
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        if (error) {
          console.error("OAuth error in URL:", error, errorDescription);
          setErrorMessage(errorDescription || error);
          setStatus("error");
          return;
        }

        // Method 1: Try to get session immediately (in case it's already parsed)
        const { data: { session } } = await supabase.auth.getSession();

        if (session) {
          console.log("Session found immediately, exchanging token with backend");
          if (mounted) {
            await exchangeAndRedirect(session);
          }
          return;
        }

        // Method 2: Listen for auth state change (handles OAuth hash parsing)
        console.log("Waiting for auth state change...");
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth state changed:", event, session ? "session exists" : "no session");

          if (event === "SIGNED_IN" && session && mounted) {
            console.log("User signed in via Google OAuth, exchanging token");
            await exchangeAndRedirect(session);
            subscription.unsubscribe();
          } else if (event === "SIGNED_OUT" && mounted) {
            console.log("User signed out");
            router.push("/login?error=session_expired");
            subscription.unsubscribe();
          }
        });
        authStateSubscription = subscription;

        // Method 3: Fallback - manually check session with retries
        let retries = 0;
        const maxRetries = 10;
        const checkSession = async () => {
          if (!mounted) return;

          const { data: { session: retrySession } } =
            await supabase.auth.getSession();

          if (retrySession) {
            console.log("Session found after retry, exchanging token");
            await exchangeAndRedirect(retrySession);
            if (authStateSubscription) {
              authStateSubscription.unsubscribe();
            }
            return;
          }

          if (retries < maxRetries) {
            retries++;
            console.log(`Retrying session check (${retries}/${maxRetries})...`);
            setTimeout(checkSession, 500);
          } else {
            console.error("Max retries reached, no session found");
            if (mounted) {
              setErrorMessage("Authentication timeout. Please try logging in again.");
              setStatus("error");
              if (authStateSubscription) {
                authStateSubscription.unsubscribe();
              }
            }
          }
        };

        // Start checking after a short delay
        setTimeout(checkSession, 1000);

      } catch (err) {
        console.error("Callback error:", err);
        if (mounted) {
          setErrorMessage(err instanceof Error ? err.message : "Authentication failed");
          setStatus("error");
        }
        if (authStateSubscription) {
          authStateSubscription.unsubscribe();
        }
      }
    };

    handleCallback();

    // Cleanup
    return () => {
      mounted = false;
      if (authStateSubscription) {
        authStateSubscription.unsubscribe();
      }
    };
  }, [router, searchParams]);

  if (status === "error") {
    return (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Authentication Failed</h1>
          <p className="text-[#8A8A9A] mb-6">{errorMessage}</p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-2 bg-velo-lime text-[#0A0A0C] rounded-lg font-semibold hover:bg-velo-lime/90 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-velo-lime/30 border-t-velo-lime rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#8A8A9A]">Authenticating...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-velo-lime/30 border-t-velo-lime rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#8A8A9A]">Loading...</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}

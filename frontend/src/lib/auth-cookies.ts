/**
 * Client-side auth cookie helpers.
 * Middleware reads `velo_token` (non-httpOnly) — set this even if /api/auth/set-cookies fails.
 */

export function setVeloTokenCookie(accessToken: string, maxAgeSeconds = 60 * 60) {
  if (typeof document === "undefined") return;
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  document.cookie = `velo_token=${encodeURIComponent(accessToken)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

export async function syncAuthCookiesToServer(accessToken: string, refreshToken: string) {
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/api/auth/set-cookies`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accessToken, refreshToken }),
    credentials: "same-origin",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }
}

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth Proxy - Handles authentication and redirects
 *
 * API routes (/api/*) are rewritten to backend via next.config.ts:
 *   - In dev: next.config.ts rewrites /api/* → backend:5001
 *   - In Vercel: Vercel rewrites /api/* → Railway backend
 *
 * If rewrites don't work, api-client.ts falls back to direct backend calls.
 */

const PUBLIC_PATHS = ["/", "/login", "/register", "/auth/callback"];
const PROTECTED_PATHS = ["/dashboard", "/settings", "/markets", "/ai-predict", "/web3", "/news"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── PASS THROUGH WITHOUT MODIFICATION ───────────────────────────────────────
  // These paths are handled by other mechanisms:
  // - /_next/*      → static files served by Next.js
  // - /api/*        → Next.js rewrites to backend (next.config.ts)
  // - /hubs/*       → Next.js rewrites to backend SignalR hub (next.config.ts)
  // - /favicon.ico  → static file
  // - Files with extension → static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/hubs") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // ── PUBLIC PATHS ────────────────────────────────────────────────────────────
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // ── AUTH CHECK FOR PROTECTED PATHS ──────────────────────────────────────────
  const supabaseToken = request.cookies.get("sb-access-token")?.value;
  const legacyToken =
    request.cookies.get("velo_token")?.value ??
    request.cookies.get("velo_auth")?.value;

  const isAuthenticated = !!supabaseToken || !!legacyToken;

  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (isProtectedPath && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated users on login/register → redirect to dashboard
  if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
    const redirectTo = request.nextUrl.searchParams.get("redirect") || "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes EXCEPT Next.js static files
  // The negative lookahead excludes paths that Next.js handles directly
  // /api/* and /hubs/* are passed through to rewrites
  matcher: ["/((?!_next/static|_next/image).*)"],
};

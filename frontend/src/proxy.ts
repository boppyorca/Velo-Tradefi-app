import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth Proxy - Handles authentication and redirects
 *
 * BFF proxy routes (/bff/*) are handled by:
 *   1. next.config.ts rewrites → for simple API proxying
 *   2. /app/api/bff/[...path]/route.ts → for full-featured proxy with auth
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
  // - /bff/*        → proxied to backend (via next.config.ts rewrites or API route)
  // - /favicon.ico  → static file
  // - /api/bff/*    → Next.js API route (bypasses proxy)
  // - Files with extension → static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/bff") ||
    pathname.startsWith("/api/bff") ||
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
  // /bff/* is passed through to rewrites/API routes
  // NOTE: In Next.js 16, the proxy matches ALL paths by default when no matcher
  // is specified, but we list explicit paths for clarity
  matcher: ["/((?!_next/static|_next/image).*)"],
};

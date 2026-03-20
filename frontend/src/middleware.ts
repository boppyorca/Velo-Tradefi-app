import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth Middleware - Protects routes using Supabase session cookies
 *
 * Checks for sb-access-token cookie set by Supabase client after login.
 * Redirects unauthenticated users to login page.
 */

const PUBLIC_PATHS = ["/", "/login", "/register", "/auth/callback"];
const PROTECTED_PATHS = ["/dashboard", "/settings", "/markets", "/ai-predict", "/web3", "/news"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static assets and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Allow public paths (login, register, home)
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  // Check for Supabase auth cookie
  const supabaseToken = request.cookies.get("sb-access-token")?.value;

  // Also check legacy token cookie (for backwards compatibility)
  const legacyToken =
    request.cookies.get("velo_token")?.value ??
    request.cookies.get("velo_auth")?.value;

  const isAuthenticated = !!supabaseToken || !!legacyToken;

  // Check if the current path is protected
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (isProtectedPath && !isAuthenticated) {
    // Redirect to login with return URL
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If authenticated and trying to access login/register, redirect to dashboard
  if (isAuthenticated && (pathname === "/login" || pathname === "/register")) {
    const redirectTo = request.nextUrl.searchParams.get("redirect") || "/dashboard";
    return NextResponse.redirect(new URL(redirectTo, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

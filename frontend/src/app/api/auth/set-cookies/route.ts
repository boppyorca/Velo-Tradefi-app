import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Set auth cookies API route
 * 
 * This endpoint is called after successful Supabase login/auth callback.
 * It sets httpOnly cookies that middleware can read.
 */
export async function POST(request: NextRequest) {
  try {
    const { accessToken, refreshToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Missing access token" },
        { status: 400 }
      );
    }
    // Refresh token can be empty in rare edge cases; still set access cookie
    const refresh = refreshToken ?? "";

    const response = NextResponse.json({ success: true });

    // Set access token cookie (1 hour expiry)
    response.cookies.set("sb-access-token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });

    // Set refresh token cookie (7 days expiry)
    response.cookies.set("sb-refresh-token", refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    // Also set legacy token for backwards compatibility
    response.cookies.set("velo_token", accessToken, {
      httpOnly: false, // Allow client-side read
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Error setting auth cookies:", error);
    return NextResponse.json(
      { error: "Failed to set cookies" },
      { status: 500 }
    );
  }
}

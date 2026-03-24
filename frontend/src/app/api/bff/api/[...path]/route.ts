/**
 * BFF Proxy API Route
 *
 * Next.js App Router API route that proxies requests to the backend.
 * This replaces the next.config.ts rewrite approach which was failing
 * due to proxy.ts Edge Runtime issues.
 *
 * All /bff/api/* requests are proxied to http://127.0.0.1:5001/api/*
 * The token (JWT) is automatically forwarded from the request headers/cookies.
 */

import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:5001";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const searchParams = request.nextUrl.search;

  const backendUrl = `${BACKEND_URL}/api/${pathStr}${searchParams}`;

  // Forward auth headers
  const authToken =
    request.cookies.get("velo_token")?.value ||
    request.headers.get("x-auth-token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

  try {
    const response = await fetch(backendUrl, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[BFF] Proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Backend unavailable" },
      { status: 503 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");

  const backendUrl = `${BACKEND_URL}/api/${pathStr}`;

  const authToken =
    request.cookies.get("velo_token")?.value ||
    request.headers.get("x-auth-token");

  const body = await request.text();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

  try {
    const response = await fetch(backendUrl, {
      method: "POST",
      headers,
      body,
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.text();

    const nextResponse = new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });

    // Forward Set-Cookie headers
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        nextResponse.headers.append(key, value);
      }
    });

    return nextResponse;
  } catch (error) {
    console.error("[BFF] Proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Backend unavailable" },
      { status: 503 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathStr = path.join("/");
  const searchParams = request.nextUrl.search;

  const backendUrl = `${BACKEND_URL}/api/${pathStr}${searchParams}`;

  const authToken =
    request.cookies.get("velo_token")?.value ||
    request.headers.get("x-auth-token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  };

  try {
    const response = await fetch(backendUrl, {
      method: "DELETE",
      headers,
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.text();
    return new NextResponse(data, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error) {
    console.error("[BFF] Proxy error:", error);
    return NextResponse.json(
      { success: false, message: "Backend unavailable" },
      { status: 503 }
    );
  }
}

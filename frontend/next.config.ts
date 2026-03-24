import type { NextConfig } from "next";

/**
 * Backend API URL for BFF proxy.
 * Priority: NEXT_PUBLIC_API_URL > http://127.0.0.1:5001
 *
 * In dev: browser → /bff/* → Next.js rewrites → backend (127.0.0.1:5001)
 * In prod: browser → /bff/* → Vercel rewrites → Railway backend
 */
const backendUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:5001";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // BFF proxy for REST API (stocks, memecoins, news, etc.)
      {
        source: "/bff/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      // BFF proxy for SignalR hub
      // Browser connects to same-origin /bff/hubs/stock-price
      // Next.js rewrites to backend SignalR endpoint
      {
        source: "/bff/hubs/:path*",
        destination: `${backendUrl}/hubs/:path*`,
      },
    ];
  },
};

export default nextConfig;

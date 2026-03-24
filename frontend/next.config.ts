import type { NextConfig } from "next";

/**
 * Backend API URL for BFF proxy.
 * Priority: NEXT_PUBLIC_API_URL > http://127.0.0.1:5001
 *
 * Routing strategy:
 * - Frontend calls /api/* (relative paths)
 * - next.config.ts rewrites /api/* → backend:5001 in dev, Railway in prod
 * - This avoids CORS issues and works seamlessly in Vercel preview deployments
 */
const backendUrl =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:5001";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      // All /api/* requests → backend (for development with dotnet run)
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
      // SignalR hub → backend
      {
        source: "/hubs/:path*",
        destination: `${backendUrl}/hubs/:path*`,
      },
    ];
  },
};

export default nextConfig;

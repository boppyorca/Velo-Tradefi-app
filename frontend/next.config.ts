import type { NextConfig } from "next";

/**
 * Backend URL for Next.js rewrites only (server-side). The browser should call
 * same-origin `/api/*` so this must be reachable from the Node process:
 * - Docker frontend container: http://backend:8080
 * - Local next dev + backend on host: http://127.0.0.1:5050
 *
 * Do not use NEXT_PUBLIC_API_URL here first — that would duplicate the same
 * value for client bundles and break when it points at `backend` (unresolvable
 * in the browser) or wrong host ports.
 */
const backendUrl =
  process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "http://127.0.0.1:5050";

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

import type { NextConfig } from "next";

/** Where Next.js proxies `/bff/*` in dev (browser uses same-origin `/bff`, no CORS). */
const backendInternalUrl =
  process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:5000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/bff/api/:path*",
        destination: `${backendInternalUrl}/api/:path*`,
      },
      // SignalR hub — browser connects to same-origin /bff/hubs, Next.js proxies to backend
      {
        source: "/bff/hubs/:path*",
        destination: `${backendInternalUrl}/hubs/:path*`,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

/** Where Next.js proxies `/bff/api/*` in dev (browser uses same-origin `/bff`, no CORS). */
const backendInternalUrl =
  process.env.BACKEND_INTERNAL_URL?.replace(/\/$/, "") ?? "http://127.0.0.1:5000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/bff/api/:path*",
        destination: `${backendInternalUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;

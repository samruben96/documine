import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
  // Turbopack configuration (Next.js 16 default)
  // Empty config acknowledges we're using Turbopack
  turbopack: {},
  // Webpack fallback for compatibility
  webpack: (config) => {
    // Required for react-pdf to work with Next.js
    // Prevents SSR issues with canvas dependency
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;

import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* Ensure Next.js uses this directory as root for chunks (fixes main-app.js load errors with multiple lockfiles) */
  outputFileTracingRoot: path.join(process.cwd()),
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  async rewrites() {
    return [
      // Avoid 404 when browser requests /favicon.ico
      { source: "/favicon.ico", destination: "/logo-light.png" },
    ];
  },
};

export default nextConfig;

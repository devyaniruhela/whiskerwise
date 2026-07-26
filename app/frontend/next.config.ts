import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* Ensure Next.js uses this directory as root for chunks (fixes main-app.js load errors with multiple lockfiles) */
  outputFileTracingRoot: path.join(process.cwd()),
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  images: {
    // Curated Essentials product photography. Scoped to our own account so a
    // stray res.cloudinary.com URL from anywhere else can't be proxied.
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/dksnlowb1/**' },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  async rewrites() {
    return [
      // Avoid 404 when browser requests /favicon.ico
      { source: "/favicon.ico", destination: "/favicon.png" },
    ];
  },
  async redirects() {
    return [
      // Instagram bio short link -> home, tagged for attribution (302 so we can re-point later)
      {
        source: "/ig",
        destination: "/?utm_source=instagram&utm_medium=social&utm_campaign=bio",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

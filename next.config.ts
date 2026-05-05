import type { NextConfig } from "next";

const isExport = process.env.BUILD_MODE === 'export';

const nextConfig: NextConfig = {
  ...(isExport ? { output: 'export' } : {}),
  // Skip type-checking during mobile export build (api/ folder is temporarily renamed)
  typescript: {
    ignoreBuildErrors: isExport,
  },
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

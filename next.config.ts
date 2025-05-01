import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Temporary during troubleshooting
  },
  eslint: {
    ignoreDuringBuilds: true, // Temporary during troubleshooting
  },
  output: 'standalone', // Remove if causing issues
};

export default nextConfig;
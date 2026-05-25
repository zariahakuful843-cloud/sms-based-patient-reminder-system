import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // Type checking is done in CI; skipping here keeps production builds fast.
    ignoreBuildErrors: true,
  },
  eslint: {
    // Linting is done in CI; skipping here keeps production builds fast.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;

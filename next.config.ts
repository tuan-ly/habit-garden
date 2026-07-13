import type { NextConfig } from "next";
import withPWAInit from "next-pwa";
import withBundleAnalyzer from "@next/bundle-analyzer";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    qualities: [75, 85],
  },
  // Empty turbopack config to silence the warning in dev mode
  // next-pwa adds webpack config but is disabled in development anyway
  turbopack: {},
  webpack(config, { dev, isServer }) {
    if (!dev && !isServer && config.optimization.splitChunks) {
      // Keep the initial dashboard request fan-out bounded. Async modal/action
      // chunks remain independently loadable, while small shared fragments are
      // merged into fewer initial requests.
      config.optimization.splitChunks.maxInitialRequests = 6
      config.optimization.splitChunks.minSize = 60_000
    }
    return config
  },
};

const analyze = withBundleAnalyzer({ enabled: process.env.ANALYZE === "true" });

export default analyze(withPWA(nextConfig));

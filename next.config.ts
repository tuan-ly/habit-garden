import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Use webpack for build (required for next-pwa)
  // Turbopack doesn't support webpack plugins yet
};

export default withPWA(nextConfig);

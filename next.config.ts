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
  // Empty turbopack config to silence the warning in dev mode
  // next-pwa adds webpack config but is disabled in development anyway
  turbopack: {},
};

export default withPWA(nextConfig);

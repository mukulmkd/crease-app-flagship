import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // Custom client registration handles update checks + reload (see PwaUpdateProvider).
  register: false,
  reloadOnOnline: true,
  cacheStartUrl: true,
  dynamicStartUrl: true,
  workboxOptions: {
    skipWaiting: true,
    clientsClaim: true,
    cleanupOutdatedCaches: true,
  },
  fallbacks: {
    document: "/offline",
  },
});

const lanDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Allow phone / LAN testing against `next dev` (blocks cross-origin /_next by default).
  allowedDevOrigins: [
    "127.0.0.1",
    "localhost",
    "192.168.1.159",
    ...lanDevOrigins,
  ],
  // PWA plugin injects webpack; production builds use `next build --webpack`.
  turbopack: {},
};

export default withPWA(nextConfig);

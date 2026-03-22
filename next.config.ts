import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  reloadOnOnline: true,
  fallbacks: {
    // App Router offline fallback page
    document: "/~offline",
  },
  workboxOptions: {
    skipWaiting: true,
    // Extend the default caching strategies
    runtimeCaching: [
      // Cache all navigations (HTML pages) — stale-while-revalidate
      // so previously visited pages load offline instantly
      {
        urlPattern: /^https?:\/\/[^/]+\/((?!api\/).)*$/,
        handler: "NetworkFirst" as const,
        options: {
          cacheName: "pages-cache",
          expiration: {
            maxEntries: 128,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
          networkTimeoutSeconds: 15,
        },
      },
      // Cache API GET responses — network-first with cache fallback
      {
        urlPattern: /^https?:\/\/[^/]+\/api\//,
        handler: "NetworkFirst" as const,
        method: "GET",
        options: {
          cacheName: "api-cache",
          networkTimeoutSeconds: 10,
          expiration: {
            maxEntries: 32,
            maxAgeSeconds: 60 * 60, // 1 hour
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
  },
});

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ibb.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

export default withPWA(nextConfig);

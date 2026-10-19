import type { NextConfig } from "next";
import { z } from "zod";

import { parseServerEnv } from "./src/lib/env";

const { API_URL } = parseServerEnv();

/**
 * Where uploaded images are served from: the same `PUBLIC_ASSET_BASE_URL` the API stores in each
 * asset's `url` (a Cloudflare R2 public host in production, the API itself in local dev).
 * One URL or a comma separated list. Never hard-coded: an unset value means no remote image host
 * is allowed. Parsed with zod so a typo stops the build instead of silently turning optimisation off.
 */
const AssetBaseUrls = z
  .string()
  .transform((value) =>
    value
      .split(",")
      .map((part) => part.trim())
      .filter((part) => part.length > 0),
  )
  .pipe(
    z.array(z.url("PUBLIC_ASSET_BASE_URL must be a full URL such as https://assets.example.com")),
  )
  .default([]);

const assetBaseUrls = AssetBaseUrls.parse(process.env.PUBLIC_ASSET_BASE_URL || undefined).map(
  (value) => new URL(value),
);

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

const nextConfig: NextConfig = {
  transpilePackages: ["@giftpop/contracts", "@giftpop/renderer"],
  poweredByHeader: false,
  images: {
    // Uploads are already normalised to WebP by the API (CLAUDE.md rule 9), so AVIF would only
    // add encode time on a cache miss. WebP in, WebP out, resized to the card or scene width.
    formats: ["image/webp"],
    remotePatterns: assetBaseUrls.map((url) => ({
      protocol: url.protocol === "http:" ? "http" : "https",
      hostname: url.hostname,
      port: url.port,
      pathname: `${url.pathname.replace(/\/+$/, "")}/**`,
    })),
    // Asset keys are random and never rewritten, so a resized copy never goes stale.
    minimumCacheTTL: 60 * 60 * 24 * 365,
    // Next refuses to fetch from a private address unless told otherwise. Only the local dev stack
    // (assets served by the API on localhost) needs this; a production asset host is public.
    dangerouslyAllowLocalIP: assetBaseUrls.some((url) => LOCAL_HOSTS.has(url.hostname)),
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/v1/:path*` }];
  },
};

export default nextConfig;

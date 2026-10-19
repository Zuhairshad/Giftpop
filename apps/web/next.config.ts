import type { NextConfig } from "next";

import { parseServerEnv } from "./src/lib/env";

const { API_URL } = parseServerEnv();

const nextConfig: NextConfig = {
  transpilePackages: ["@giftpop/contracts", "@giftpop/renderer"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/v1/:path*` }];
  },
};

export default nextConfig;

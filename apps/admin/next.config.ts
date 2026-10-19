import type { NextConfig } from "next";

import { getApiUrl } from "./src/lib/env";

// Parsed with zod at boot: a bad API_URL stops the build or dev server.
const apiUrl = getApiUrl();

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
    return [{ source: "/api/:path*", destination: `${apiUrl}/v1/:path*` }];
  },
};

export default nextConfig;

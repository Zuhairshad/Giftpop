import type { NextConfig } from "next";

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
};

export default nextConfig;

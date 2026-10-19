import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    // Every suite starts its own in-memory replica set on a random port; capping the
    // workers avoids rare port collisions when many start at once.
    maxWorkers: 4,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});

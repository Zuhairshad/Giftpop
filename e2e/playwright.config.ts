import { defineConfig, devices } from "@playwright/test";

const WEB = process.env.E2E_WEB_URL ?? "http://localhost:3000";
const ADMIN = process.env.E2E_ADMIN_URL ?? "http://localhost:3001";
const API = process.env.E2E_API_URL ?? "http://localhost:4000";

/** Browser binary for machines where `playwright install` is not available. */
const executablePath = process.env.E2E_CHROMIUM_PATH || undefined;

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./global-setup.ts",
  // One database, one order sequence: flows run one after another.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: WEB,
    // A phone first: the customer store is built for it.
    ...devices["Pixel 7"],
    launchOptions: executablePath ? { executablePath } : {},
    trace: "retain-on-failure",
  },
  webServer: [
    { command: "pnpm --filter @giftpop/api dev", url: `${API}/ready`, reuseExistingServer: true },
    { command: "pnpm --filter @giftpop/web dev", url: WEB, reuseExistingServer: true },
    {
      command: "pnpm --filter @giftpop/admin dev",
      url: `${ADMIN}/login`,
      reuseExistingServer: true,
    },
  ],
});

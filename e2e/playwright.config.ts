import { tmpdir } from "node:os";
import path from "node:path";

import { defineConfig, devices } from "@playwright/test";

import { STAFF_EMAIL, STAFF_PASSWORD } from "./support/env";

/**
 * `E2E_ISOLATED=1` runs a private copy of the stack: its own database (`giftpop_e2e`
 * on the Mongo that is already listening on 27017), API on 4100, web on 3100 and admin
 * on 3101. Playwright starts and stops all three, so every run gets a fresh API process
 * and therefore fresh in-memory rate-limit counters (login 5/min, track 10/min,
 * partner requests 3/hour). Without it the standard ports are used and any server that is
 * already running there is reused.
 */
const isolated = process.env.E2E_ISOLATED === "1";

const WEB =
  process.env.E2E_WEB_URL ?? (isolated ? "http://localhost:3100" : "http://localhost:3000");
const ADMIN =
  process.env.E2E_ADMIN_URL ?? (isolated ? "http://localhost:3101" : "http://localhost:3001");
const API =
  process.env.E2E_API_URL ?? (isolated ? "http://localhost:4100" : "http://localhost:4000");

/** Browser binary for machines where `playwright install` is not available. */
const executablePath = process.env.E2E_CHROMIUM_PATH || undefined;

const isolatedEnv = {
  MONGODB_URI:
    process.env.E2E_MONGODB_URI ?? "mongodb://127.0.0.1:27017/giftpop_e2e?replicaSet=rs0",
  WEB_ORIGIN: WEB,
  ADMIN_ORIGIN: ADMIN,
  API_URL: API,
  PORT: new URL(API).port,
  NOTIFICATIONS_WORKER: "off",
  UPLOAD_DIR: process.env.E2E_UPLOAD_DIR ?? path.join(tmpdir(), "giftpop-e2e-uploads"),
  PUBLIC_ASSET_BASE_URL: `${API}/v1/assets/files`,
};

if (isolated) {
  // The config is loaded in the main process (global setup, seed) and in every worker.
  Object.assign(process.env, isolatedEnv);
}

const servers = isolated
  ? [
      {
        // Seed before the API listens. Playwright starts the servers before global setup, and
        // the web readiness probe renders the home page: on a fresh database it would cache an
        // empty country list for five minutes (`revalidate: 300`) and every flow would fail.
        command: "pnpm seed && pnpm --filter @giftpop/api exec tsx src/server.ts",
        url: `${API}/ready`,
        env: { ...isolatedEnv, SEED_OWNER_EMAIL: STAFF_EMAIL, SEED_OWNER_PASSWORD: STAFF_PASSWORD },
        reuseExistingServer: false,
        timeout: 120_000,
      },
      {
        command: `pnpm --filter @giftpop/web exec next dev -p ${new URL(WEB).port}`,
        url: WEB,
        env: isolatedEnv,
        reuseExistingServer: false,
        timeout: 180_000,
      },
      {
        command: `pnpm --filter @giftpop/admin exec next dev -p ${new URL(ADMIN).port}`,
        url: `${ADMIN}/login`,
        env: isolatedEnv,
        reuseExistingServer: false,
        timeout: 180_000,
      },
    ]
  : [
      { command: "pnpm --filter @giftpop/api dev", url: `${API}/ready`, reuseExistingServer: true },
      { command: "pnpm --filter @giftpop/web dev", url: WEB, reuseExistingServer: true },
      {
        command: "pnpm --filter @giftpop/admin dev",
        url: `${ADMIN}/login`,
        reuseExistingServer: true,
      },
    ];

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./global-setup.ts",
  // One database, one order sequence: flows run one after another, in file order.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  // Dev servers compile each route on first use, and the machine may be shared.
  timeout: 180_000,
  expect: { timeout: 15_000 },
  outputDir: "./test-results",
  reporter: [["list"]],
  use: {
    baseURL: WEB,
    // A phone first: the customer store is built for it.
    ...devices["Pixel 7"],
    launchOptions: {
      ...(executablePath ? { executablePath } : {}),
      // Keeps Chromium out of /dev/shm: one run on a busy shared machine saw "Target crashed".
      args: ["--disable-dev-shm-usage"],
    },
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    trace: "retain-on-failure",
  },
  webServer: servers,
});

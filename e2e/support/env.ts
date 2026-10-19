/** Where each app and the API listen. Mirrors `playwright.config.ts`. */
const isolated = process.env.E2E_ISOLATED === "1";

export const WEB_URL =
  process.env.E2E_WEB_URL ?? (isolated ? "http://localhost:3100" : "http://localhost:3000");
export const ADMIN_URL =
  process.env.E2E_ADMIN_URL ?? (isolated ? "http://localhost:3101" : "http://localhost:3001");
export const API_URL =
  process.env.E2E_API_URL ?? (isolated ? "http://localhost:4100" : "http://localhost:4000");

/** The staff account `pnpm seed` creates (see `global-setup.ts`). */
export const STAFF_EMAIL = process.env.E2E_STAFF_EMAIL ?? "owner@giftpop.test";
export const STAFF_PASSWORD = process.env.E2E_STAFF_PASSWORD ?? "dev-owner-password-1";

/** A short unique suffix so repeated runs against one database never collide. */
export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}
